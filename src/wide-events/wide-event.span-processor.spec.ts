import { context, trace } from "@opentelemetry/api";
import { NodeTracerProvider, type Span } from "@opentelemetry/sdk-trace-node";
import {
  getLocalRootSpan,
  WideEventSpanProcessor,
} from "./wide-event.span-processor";

describe("WideEventSpanProcessor", () => {
  let processor: WideEventSpanProcessor;
  let provider: NodeTracerProvider;

  beforeAll(() => {
    provider = new NodeTracerProvider();
    provider.register();
  });

  beforeEach(() => {
    processor = new WideEventSpanProcessor();
  });

  afterAll(async () => {
    await provider.shutdown();
  });

  const startSpan = (name: string): Span =>
    trace.getTracer("test").startSpan(name) as Span;

  it("should register a parentless span as the local root for its trace", () => {
    const root = startSpan("GET /test");

    processor.onStart(root, context.active());

    expect(getLocalRootSpan(root.spanContext().traceId)).toBe(root);
    root.end();
  });

  it("should not register a span whose parent is local", () => {
    const root = startSpan("GET /test");
    processor.onStart(root, context.active());
    const child = trace
      .getTracer("test")
      .startSpan(
        "child",
        undefined,
        trace.setSpan(context.active(), root)
      ) as Span;

    processor.onStart(child, context.active());

    // local root for the trace is still the root, not the child
    expect(getLocalRootSpan(root.spanContext().traceId)).toBe(root);
    child.end();
    root.end();
  });

  it("should drop the local root from the registry when it ends", () => {
    const root = startSpan("GET /test");
    const traceId = root.spanContext().traceId;
    processor.onStart(root, context.active());

    processor.onEnd(root);

    expect(getLocalRootSpan(traceId)).toBeUndefined();
    root.end();
  });
});
