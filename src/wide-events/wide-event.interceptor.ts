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
  type WideEventBag,
} from "./wide-event.context";

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
    const span = trace.getSpan(activeContext);
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
                span?.setStatus({ code: SpanStatusCode.ERROR });
              },
              complete: () => {
                terminated = true;
              },
            }),
            finalize(() => {
              if (terminated) {
                this.flush(bag, span);
              }
            })
          )
          .subscribe(subscriber)
      );
      return () => subscription.unsubscribe();
    });
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

  private flush(bag: WideEventBag, span: Span | undefined): void {
    span?.setAttributes(Object.fromEntries(bag));
  }
}
