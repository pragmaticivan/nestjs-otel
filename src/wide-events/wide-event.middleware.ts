import { Injectable, type NestMiddleware } from "@nestjs/common";
import { context, trace } from "@opentelemetry/api";
import { WIDE_EVENT_ROOT_SPAN } from "./wide-event.context";

/**
 * Captures the span active at the start of the request (the HTTP server /
 * local-root span, before Nest instrumentation nests guard/interceptor/handler
 * spans) and stashes it on the request so the WideEventInterceptor can flush
 * accumulated attributes onto the root span rather than a nested child.
 *
 * Applied automatically by the OpenTelemetry module for HTTP apps.
 *
 * @publicApi
 */
@Injectable()
export class WideEventMiddleware implements NestMiddleware {
  use(
    req: Record<symbol, unknown>,
    _res: unknown,
    next: (error?: unknown) => void
  ): void {
    const span = trace.getSpan(context.active());
    if (span) {
      req[WIDE_EVENT_ROOT_SPAN] = span;
    }
    next();
  }
}
