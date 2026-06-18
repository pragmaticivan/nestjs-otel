import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  type NestInterceptor,
  Optional,
} from "@nestjs/common";
import { context, type Span, SpanStatusCode, trace } from "@opentelemetry/api";
import { Observable } from "rxjs";
import { finalize, tap } from "rxjs/operators";
import type { OpenTelemetryModuleOptions } from "../interfaces";
import { OPENTELEMETRY_MODULE_OPTIONS } from "../opentelemetry.constants";
import {
  WIDE_EVENT_CONTEXT_KEY,
  WIDE_EVENT_ROOT_SPAN,
  type WideEventBag,
} from "./wide-event.context";
import { getLocalRootSpan } from "./wide-event.span-processor";

interface RequestWithRootSpan {
  [WIDE_EVENT_ROOT_SPAN]?: Span;
  raw?: { [WIDE_EVENT_ROOT_SPAN]?: Span };
}

/**
 * Opens a wide event for each request and flushes the accumulated
 * attributes onto the span that was active when the request entered the
 * interceptor (usually the root HTTP span created by instrumentation).
 *
 * Register globally with APP_INTERCEPTOR or per controller with
 * UseInterceptors.
 *
 * @publicApi
 */
@Injectable()
export class WideEventInterceptor implements NestInterceptor {
  constructor(
    @Optional()
    @Inject(OPENTELEMETRY_MODULE_OPTIONS)
    private readonly options?: OpenTelemetryModuleOptions
  ) {}

  intercept(
    executionContext: ExecutionContext,
    next: CallHandler
  ): Observable<unknown> {
    const bag: WideEventBag = new Map();
    bag.set(
      "code.function.name",
      `${executionContext.getClass().name}.${executionContext.getHandler().name}`
    );
    this.seed(bag, executionContext);

    const activeContext = context.active();
    // The middleware-captured span is the local root on Express / plain
    // Fastify (alive until the response ends). On stacks that wrap each
    // request phase in its own span (e.g. @fastify/otel) it can be an
    // ephemeral span that has already ended by flush time, so we keep the
    // interceptor-time active span as a live fallback and pick whichever is
    // still recording when we flush.
    const rootSpan = this.rootSpanFromRequest(executionContext);
    const activeSpan = trace.getSpan(activeContext);
    const contextWithBag = activeContext.setValue(WIDE_EVENT_CONTEXT_KEY, bag);

    return new Observable((subscriber) => {
      let terminated = false;
      const subscription = context.with(contextWithBag, () =>
        next
          .handle()
          .pipe(
            tap({
              error: (error: unknown) => {
                terminated = true;
                bag.set(
                  "error.type",
                  error instanceof Error
                    ? (error.constructor?.name ?? "Error")
                    : "unknown"
                );
                if (error instanceof Error) {
                  bag.set("error.message", error.message);
                  if (error.stack) {
                    bag.set("error.stack", error.stack);
                  }
                }
                this.targetSpan(rootSpan, activeSpan)?.setStatus({
                  code: SpanStatusCode.ERROR,
                });
              },
              complete: () => {
                terminated = true;
              },
            }),
            finalize(() => {
              if (terminated) {
                this.flush(bag, rootSpan, activeSpan);
              }
            })
          )
          .subscribe(subscriber)
      );
      return () => subscription.unsubscribe();
    });
  }

  private rootSpanFromRequest(
    executionContext: ExecutionContext
  ): Span | undefined {
    if (
      typeof executionContext.getType !== "function" ||
      executionContext.getType() !== "http"
    ) {
      return;
    }
    const request = executionContext
      .switchToHttp()
      .getRequest<RequestWithRootSpan | undefined>();
    return (request?.[WIDE_EVENT_ROOT_SPAN] ??
      request?.raw?.[WIDE_EVENT_ROOT_SPAN]) as Span | undefined;
  }

  /**
   * Picks the span the wide event should be written to, preferring the
   * local-root span (when the WideEventSpanProcessor is registered), then the
   * middleware-captured root span, then the interceptor-time active span —
   * skipping any that have already ended.
   */
  private targetSpan(
    rootSpan: Span | undefined,
    activeSpan: Span | undefined
  ): Span | undefined {
    const traceId = (activeSpan ?? rootSpan)?.spanContext().traceId;
    const localRoot = traceId ? getLocalRootSpan(traceId) : undefined;
    return this.pickSpan(localRoot, rootSpan, activeSpan);
  }

  private pickSpan(...candidates: (Span | undefined)[]): Span | undefined {
    for (const candidate of candidates) {
      if (candidate?.isRecording()) {
        return candidate;
      }
    }
    return;
  }

  private seed(bag: WideEventBag, executionContext: ExecutionContext): void {
    const seed = this.options?.wideEvents?.seed;
    if (!seed) {
      return;
    }
    try {
      const result = seed(executionContext);
      if (result == null) {
        return;
      }
      for (const [key, value] of Object.entries(result)) {
        if (value !== undefined) {
          bag.set(key, value);
        }
      }
    } catch (error) {
      bag.set(
        "wide_event.seed.error",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private flush(
    bag: WideEventBag,
    rootSpan: Span | undefined,
    activeSpan: Span | undefined
  ): void {
    const span = this.targetSpan(rootSpan, activeSpan);
    if (!span) {
      return;
    }
    span.setAttributes(Object.fromEntries(bag));
    span.setAttribute("nestjs_otel.wide_event", true);
  }
}
