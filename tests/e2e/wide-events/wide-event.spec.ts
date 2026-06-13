import {
  type INestApplication,
  Injectable,
  type MiddlewareConsumer,
  Module,
  type NestMiddleware,
  type NestModule,
} from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { context, trace } from "@opentelemetry/api";
import {
  InMemorySpanExporter,
  NodeTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import type { NextFunction, Request, Response } from "express";
import request from "supertest";
import { OpenTelemetryModule, WideEventInterceptor } from "../../../src";
import { WideEventController } from "../../fixture-app/wide-event.controller";

@Injectable()
class RootSpanMiddleware implements NestMiddleware {
  use(_req: Request, res: Response, next: NextFunction) {
    const tracer = trace.getTracer("test");
    const span = tracer.startSpan("http_request");

    context.with(trace.setSpan(context.active(), span), () => {
      res.on("finish", () => {
        span.end();
      });
      next();
    });
  }
}

@Module({
  imports: [
    OpenTelemetryModule.forRoot({
      wideEvents: {
        seed: (ctx) => ({
          "http.method": ctx.switchToHttp().getRequest().method,
        }),
      },
    }),
  ],
  controllers: [WideEventController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: WideEventInterceptor,
    },
  ],
})
class TestModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RootSpanMiddleware).forRoutes("*");
  }
}

describe("Wide Events", () => {
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
        "cart.items": 3,
        "cart.total": 42.5,
        "db.queries": 2,
      })
    );
  });

  it("should record timer durations", async () => {
    await request(app.getHttpServer()).get("/wide-event/timer").expect(200);

    const rootSpan = getRootSpan();
    expect(typeof rootSpan?.attributes["work.duration_ms"]).toBe("number");
    expect(rootSpan?.attributes["work.duration_ms"]).toBeGreaterThan(0);
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

  it("should seed attributes from the module seed option", async () => {
    await request(app.getHttpServer()).get("/wide-event/enrich").expect(200);

    const rootSpan = getRootSpan();
    expect(rootSpan?.attributes["http.method"]).toBe("GET");
  });

  it("should capture return values with @WideEventField", async () => {
    await request(app.getHttpServer()).get("/wide-event/field").expect(200);

    const rootSpan = getRootSpan();
    expect(rootSpan?.attributes["books.count"]).toBe(2);
  });
});
