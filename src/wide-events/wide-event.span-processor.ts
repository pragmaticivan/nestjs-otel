import type { Context } from "@opentelemetry/api";
import type {
  ReadableSpan,
  Span,
  SpanProcessor,
} from "@opentelemetry/sdk-trace-base";

const localRootSpans = new Map<string, Span>();

const isLocalRoot = (span: ReadableSpan): boolean => {
  const parent = span.parentSpanContext;
  return !parent || parent.isRemote === true;
};

/**
 * The local-root span for the given trace (the span with no in-process
 * parent — usually the HTTP server span created by instrumentation), or
 * undefined when the WideEventSpanProcessor is not registered or the span has
 * already ended.
 *
 * @internal
 */
export function getLocalRootSpan(traceId: string): Span | undefined {
  return localRootSpans.get(traceId);
}

/**
 * Tracks the local-root span of every trace so the WideEventInterceptor can
 * flush accumulated attributes onto it instead of a nested instrumentation
 * span (e.g. the per-request span created by instrumentation-nestjs-core or
 * the per-phase spans created by @fastify/otel).
 *
 * Register it on your NodeSDK alongside the exporting processor:
 *
 * ```ts
 * new NodeSDK({
 *   spanProcessors: [
 *     new WideEventSpanProcessor(),
 *     new BatchSpanProcessor(traceExporter),
 *   ],
 * });
 * ```
 *
 * @publicApi
 */
export class WideEventSpanProcessor implements SpanProcessor {
  onStart(span: Span, _parentContext: Context): void {
    if (isLocalRoot(span)) {
      localRootSpans.set(span.spanContext().traceId, span);
    }
  }

  onEnd(span: ReadableSpan): void {
    if (isLocalRoot(span)) {
      localRootSpans.delete(span.spanContext().traceId);
    }
  }

  forceFlush(): Promise<void> {
    return Promise.resolve();
  }

  shutdown(): Promise<void> {
    localRootSpans.clear();
    return Promise.resolve();
  }
}
