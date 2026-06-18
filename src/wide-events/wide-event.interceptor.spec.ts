import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { context, SpanStatusCode, trace } from "@opentelemetry/api";
import {
  InMemorySpanExporter,
  NodeTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import { defer, lastValueFrom, Observable, of, throwError } from "rxjs";
import type { OpenTelemetryModuleOptions } from "../interfaces";
import { WideEventInterceptor } from "./wide-event.interceptor";
import { WideEventService } from "./wide-event.service";

class CatsController {
  findAll() {}
}

const executionContext = {
  getClass: () => CatsController,
  getHandler: () => CatsController.prototype.findAll,
} as unknown as ExecutionContext;

const callHandler = (handle: CallHandler["handle"]): CallHandler => ({
  handle,
});

describe("WideEventInterceptor", () => {
  let interceptor: WideEventInterceptor;
  let traceExporter: InMemorySpanExporter;
  let provider: NodeTracerProvider;

  beforeAll(() => {
    traceExporter = new InMemorySpanExporter();
    provider = new NodeTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(traceExporter)],
    });
    provider.register();
  });

  beforeEach(() => {
    interceptor = new WideEventInterceptor();
  });

  afterEach(() => {
    traceExporter.reset();
  });

  afterAll(async () => {
    await provider.shutdown();
  });

  const interceptWithRootSpan = async (
    handle: CallHandler["handle"],
    options?: OpenTelemetryModuleOptions
  ): Promise<unknown> => {
    const activeInterceptor = options
      ? new WideEventInterceptor(options)
      : interceptor;
    const tracer = trace.getTracer("test");
    const span = tracer.startSpan("http_request");

    try {
      return await context.with(
        trace.setSpan(context.active(), span),
        async () =>
          await lastValueFrom(
            activeInterceptor.intercept(executionContext, callHandler(handle))
          )
      );
    } finally {
      span.end();
    }
  };

  it("should flush handler metadata onto the active span", async () => {
    const result = await interceptWithRootSpan(() => of("ok"));

    expect(result).toBe("ok");
    const [span] = traceExporter.getFinishedSpans();
    expect(span.attributes["code.function.name"]).toBe(
      "CatsController.findAll"
    );
  });

  it("should flush attributes set by the service during the request", async () => {
    const service = new WideEventService();

    await interceptWithRootSpan(() =>
      defer(() => {
        service.set("user.id", "u-1");
        service.increment("db.queries");
        return of("ok");
      })
    );

    const [span] = traceExporter.getFinishedSpans();
    expect(span.attributes["user.id"]).toBe("u-1");
    expect(span.attributes["db.queries"]).toBe(1);
  });

  it("should record error attributes when the handler throws", async () => {
    const error = new Error("boom");

    await expect(
      interceptWithRootSpan(() => throwError(() => error))
    ).rejects.toThrow("boom");

    // #then
    const [span] = traceExporter.getFinishedSpans();
    expect(span.attributes["error.type"]).toBe("Error");
    expect(span.attributes["error.message"]).toBe("boom");
    expect(span.attributes["error.stack"]).toBe(error.stack);
  });

  it("should not record error.stack when the error has no stack", async () => {
    const error = new Error("no stack");
    error.stack = undefined;

    await expect(
      interceptWithRootSpan(() => throwError(() => error))
    ).rejects.toThrow("no stack");

    // #then
    const [span] = traceExporter.getFinishedSpans();
    expect(span.attributes["error.stack"]).toBeUndefined();
  });

  it("should seed attributes from the configured seed callback", async () => {
    await interceptWithRootSpan(() => of("ok"), {
      wideEvents: {
        seed: (ctx) => ({ "app.controller": ctx.getClass().name }),
      },
    });

    const [span] = traceExporter.getFinishedSpans();
    expect(span.attributes["app.controller"]).toBe("CatsController");
  });

  it("should record a seed error without failing the request", async () => {
    const result = await interceptWithRootSpan(() => of("ok"), {
      wideEvents: {
        seed: () => {
          throw new Error("seed boom");
        },
      },
    });

    expect(result).toBe("ok");
    const [span] = traceExporter.getFinishedSpans();
    expect(span.attributes["wide_event.seed.error"]).toBe("seed boom");
  });

  it("should set span status to ERROR when the handler throws", async () => {
    await expect(
      interceptWithRootSpan(() => throwError(() => new Error("fail")))
    ).rejects.toThrow("fail");

    const [span] = traceExporter.getFinishedSpans();
    expect(span.status.code).toBe(SpanStatusCode.ERROR);
  });

  it("should handle exotic errors with null constructor without replacing the original error", async () => {
    const exoticError = Object.create(Error.prototype);
    exoticError.message = "exotic";
    Object.defineProperty(exoticError, "constructor", { value: null });

    await expect(
      interceptWithRootSpan(() => throwError(() => exoticError))
    ).rejects.toBe(exoticError);

    const [span] = traceExporter.getFinishedSpans();
    expect(span.attributes["error.type"]).toBe("Error");
    expect(span.attributes["error.message"]).toBe("exotic");
  });

  it("should not flush attributes when the observable is unsubscribed before completion", async () => {
    const span = trace.getTracer("test").startSpan("http_request");
    const neverCompletes = new Observable((s) => {
      s.next("partial");
    });

    const obs$ = context.with(trace.setSpan(context.active(), span), () =>
      interceptor.intercept(
        executionContext,
        callHandler(() => neverCompletes)
      )
    );

    const sub = obs$.subscribe();
    sub.unsubscribe();
    span.end();

    const [finished] = traceExporter.getFinishedSpans();
    expect(finished.attributes["code.function.name"]).toBeUndefined();
  });

  it("should not throw and should produce no seed error when seed returns null", async () => {
    const result = await interceptWithRootSpan(() => of("ok"), {
      wideEvents: { seed: () => null as any },
    });

    expect(result).toBe("ok");
    const [span] = traceExporter.getFinishedSpans();
    expect(span.attributes["wide_event.seed.error"]).toBeUndefined();
  });

  it("should propagate the handler result untouched when no span is active", async () => {
    const result = await lastValueFrom(
      interceptor.intercept(
        executionContext,
        callHandler(() => of("ok"))
      )
    );

    expect(result).toBe("ok");
    expect(traceExporter.getFinishedSpans()).toHaveLength(0);
  });
});
