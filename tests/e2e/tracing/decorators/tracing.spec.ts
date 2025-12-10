import {
  type INestApplication,
  Injectable,
  type MiddlewareConsumer,
  Module,
  type NestMiddleware,
  type NestModule,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { context, propagation, trace } from "@opentelemetry/api";
import {
  InMemorySpanExporter,
  NodeTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import type { NextFunction, Request, Response } from "express";
import request from "supertest";
import { OpenTelemetryModule } from "../../../../src";
import {
  TraceableController,
  TracingController,
} from "../../../fixture-app/tracing.controller";

@Injectable()
class TracingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const ctx = propagation.extract(context.active(), req.headers);
    const tracer = trace.getTracer("test");
    const span = tracer.startSpan("http_request", undefined, ctx);

    context.with(trace.setSpan(ctx, span), () => {
      res.on("finish", () => {
        span.end();
      });
      next();
    });
  }
}

@Module({
  imports: [OpenTelemetryModule.forRoot({})],
  controllers: [TracingController, TraceableController],
})
class TestModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TracingMiddleware).forRoutes("*");
  }
}

describe("Tracing Decorators", () => {
  let app: INestApplication;
  let traceExporter: InMemorySpanExporter;
  let spanProcessor: SimpleSpanProcessor;
  let provider: NodeTracerProvider;

  beforeAll(async () => {
    traceExporter = new InMemorySpanExporter();
    spanProcessor = new SimpleSpanProcessor(traceExporter);
    provider = new NodeTracerProvider({
      spanProcessors: [spanProcessor],
    });
    provider.register();

    const testingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = testingModule.createNestApplication();
    await app.init();
  });

  afterEach(() => {
    traceExporter.reset();
  });

  afterAll(async () => {
    await app.close();
    await provider.shutdown();
  });

  it("should create a span with @Span decorator", async () => {
    await request(app.getHttpServer()).get("/tracing/span").expect(200);

    const spans = traceExporter.getFinishedSpans();
    // We expect at least one span for the controller method
    // There might be other spans from NestJS or HTTP layer if instrumented, but we focus on the decorator one
    const decoratorSpan = spans.find(
      (s) => s.name === "TracingController.span"
    );
    expect(decoratorSpan).toBeDefined();
  });

  it("should create a span with custom name", async () => {
    await request(app.getHttpServer())
      .get("/tracing/span-with-name")
      .expect(200);

    const spans = traceExporter.getFinishedSpans();
    const decoratorSpan = spans.find((s) => s.name === "custom-span-name");
    expect(decoratorSpan).toBeDefined();
  });

  it("should capture result with onResult", async () => {
    await request(app.getHttpServer())
      .get("/tracing/span-on-result")
      .expect(200);

    const spans = traceExporter.getFinishedSpans();
    const decoratorSpan = spans.find(
      (s) => s.name === "TracingController.spanOnResult"
    );
    expect(decoratorSpan).toBeDefined();
    expect(decoratorSpan?.attributes.result).toBe("success");
  });

  it("should inject current span with @CurrentSpan", async () => {
    await request(app.getHttpServer()).get("/tracing/current-span").expect(200);

    const spans = traceExporter.getFinishedSpans();
    const rootSpan = spans.find((s) => s.name === "http_request");
    const decoratorSpan = spans.find(
      (s) => s.name === "TracingController.currentSpan"
    );

    expect(rootSpan).toBeDefined();
    expect(decoratorSpan).toBeDefined();

    // The attribute is set on the root span because @CurrentSpan resolves before @Span creates the new span
    expect(rootSpan?.attributes["custom.attribute"]).toBe("value");
    // The decorator span should be a child of the root span
    expect((decoratorSpan as any)?.parentSpanContext?.spanId).toBe(
      rootSpan?.spanContext().spanId
    );
  });

  it("should trace all methods with @Traceable", async () => {
    await request(app.getHttpServer()).get("/traceable/method").expect(200);

    const spans = traceExporter.getFinishedSpans();
    const decoratorSpan = spans.find(
      (s) => s.name === "TraceableController.method"
    );
    expect(decoratorSpan).toBeDefined();
  });

  // For @Baggage, we need to simulate incoming baggage.
  // Since we are using supertest, we can't easily inject baggage into the context unless we have a propagator setup.
  // The W3C Trace Context propagator is default.
  // We can try sending 'baggage' header.
  it("should extract baggage with @Baggage", async () => {
    await request(app.getHttpServer())
      .get("/tracing/baggage")
      .set("baggage", "test-baggage=value")
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({ baggageValue: "value" });
      });
  });
});
