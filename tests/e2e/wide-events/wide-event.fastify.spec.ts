import {
  type INestApplication,
  Injectable,
  type MiddlewareConsumer,
  Module,
  type NestMiddleware,
  type NestModule,
} from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { context, trace } from "@opentelemetry/api";
import {
  InMemorySpanExporter,
  NodeTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import request from "supertest";
import { OpenTelemetryModule, WideEventInterceptor } from "../../../src";
import { WideEventController } from "../../fixture-app/wide-event.controller";

@Injectable()
class RootSpanMiddleware implements NestMiddleware {
  use(
    _req: unknown,
    res: { on: (e: string, cb: () => void) => void },
    next: () => void
  ) {
    const span = trace.getTracer("test").startSpan("http_request");

    context.with(trace.setSpan(context.active(), span), () => {
      res.on("finish", () => span.end());
      next();
    });
  }
}

@Module({
  imports: [OpenTelemetryModule.forRoot()],
  controllers: [WideEventController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: WideEventInterceptor }],
})
class TestModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RootSpanMiddleware).forRoutes("*");
  }
}

describe("Wide Events (Fastify)", () => {
  let app: INestApplication;
  let traceExporter: InMemorySpanExporter;
  let provider: NodeTracerProvider;

  beforeAll(async () => {
    traceExporter = new InMemorySpanExporter();
    provider = new NodeTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(traceExporter)],
    });
    provider.register();

    const testingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = testingModule.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    );
    await app.init();
    await (app as NestFastifyApplication)
      .getHttpAdapter()
      .getInstance()
      .ready();
  });

  afterEach(() => {
    traceExporter.reset();
  });

  afterAll(async () => {
    await app.close();
    await provider.shutdown();
  });

  const getRootSpan = () =>
    traceExporter.getFinishedSpans().find((s) => s.name === "http_request");

  it("should flush accumulated attributes onto the root span", async () => {
    await request(app.getHttpServer()).get("/wide-event/enrich").expect(200);

    const rootSpan = getRootSpan();
    expect(rootSpan).toBeDefined();
    expect(rootSpan?.attributes).toEqual(
      expect.objectContaining({
        "code.function.name": "WideEventController.enrich",
        "user.id": "u-1",
        "db.queries": 2,
        "nestjs_otel.wide_event": true,
      })
    );
  });

  it("should flush error attributes alongside accumulated ones", async () => {
    await request(app.getHttpServer()).get("/wide-event/error").expect(500);

    const rootSpan = getRootSpan();
    expect(rootSpan?.attributes).toEqual(
      expect.objectContaining({
        "user.id": "u-2",
        "error.type": "Error",
        "error.message": "wide event error",
      })
    );
  });
});
