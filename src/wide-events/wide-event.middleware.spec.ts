import { context, trace } from "@opentelemetry/api";
import {
  InMemorySpanExporter,
  NodeTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import { WIDE_EVENT_ROOT_SPAN } from "./wide-event.context";
import { WideEventMiddleware } from "./wide-event.middleware";

describe("WideEventMiddleware", () => {
  let middleware: WideEventMiddleware;
  let provider: NodeTracerProvider;

  beforeAll(() => {
    provider = new NodeTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(new InMemorySpanExporter())],
    });
    provider.register();
  });

  beforeEach(() => {
    middleware = new WideEventMiddleware();
  });

  afterAll(async () => {
    await provider.shutdown();
  });

  it("should stash the active span on the request", () => {
    // #given
    const span = trace.getTracer("test").startSpan("http_request");
    const req: Record<symbol, unknown> = {};
    const next = jest.fn();

    // #when
    context.with(trace.setSpan(context.active(), span), () =>
      middleware.use(req, {}, next)
    );
    span.end();

    // #then
    expect(req[WIDE_EVENT_ROOT_SPAN]).toBe(span);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should call next without stashing when no span is active", () => {
    // #given
    const req: Record<symbol, unknown> = {};
    const next = jest.fn();

    // #when
    middleware.use(req, {}, next);

    // #then
    expect(req[WIDE_EVENT_ROOT_SPAN]).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
