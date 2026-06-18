import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { context, SpanStatusCode, trace } from "@opentelemetry/api";
import {
  InMemorySpanExporter,
  NodeTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import { defer, lastValueFrom, Observable, of, throwError } from "rxjs";
import type { OpenTelemetryModuleOptions } from "../interfaces";
import { WIDE_EVENT_ROOT_SPAN } from "./wide-event.context";
import { WideEventInterceptor } from "./wide-event.interceptor";
import { WideEventService } from "./wide-event.service";
import { WideEventSpanProcessor } from "./wide-event.span-processor";

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

  it("should mark the span as a wide event on flush", async () => {
    await interceptWithRootSpan(() => of("ok"));

    const [span] = traceExporter.getFinishedSpans();
    expect(span.attributes["nestjs_otel.wide_event"]).toBe(true);
  });

  it("should not let a handler-set field override the wide event marker", async () => {
    const service = new WideEventService();

    await interceptWithRootSpan(() =>
      defer(() => {
        service.set("nestjs_otel.wide_event", false);
        return of("ok");
      })
    );

    const [span] = traceExporter.getFinishedSpans();
    expect(span.attributes["nestjs_otel.wide_event"]).toBe(true);
  });

  it("should not mark the span when the observable is unsubscribed before completion", async () => {
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
    expect(finished.attributes["nestjs_otel.wide_event"]).toBeUndefined();
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

  it("should flush onto the request root span instead of the nested active span", async () => {
    // #given
    const tracer = trace.getTracer("test");
    const rootSpan = tracer.startSpan("http_request");
    const req: Record<symbol, unknown> = {
      [WIDE_EVENT_ROOT_SPAN]: rootSpan,
    };
    const httpExecutionContext = {
      getClass: () => CatsController,
      getHandler: () => CatsController.prototype.findAll,
      getType: () => "http",
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;

    // #when: run the interceptor inside a DIFFERENT (nested) active span
    const nestedSpan = tracer.startSpan("nested_interceptor_span");
    await context.with(trace.setSpan(context.active(), nestedSpan), async () =>
      lastValueFrom(
        interceptor.intercept(
          httpExecutionContext,
          callHandler(() => of("ok"))
        )
      )
    );
    nestedSpan.end();
    rootSpan.end();

    // #then: marker + metadata land on the root span, not the nested one
    const finished = traceExporter.getFinishedSpans();
    const root = finished.find((s) => s.name === "http_request");
    const nested = finished.find((s) => s.name === "nested_interceptor_span");
    expect(root?.attributes["nestjs_otel.wide_event"]).toBe(true);
    expect(root?.attributes["code.function.name"]).toBe(
      "CatsController.findAll"
    );
    expect(nested?.attributes["nestjs_otel.wide_event"]).toBeUndefined();
  });

  it("should read the root span from request.raw (Fastify) when absent on the request", async () => {
    // #given: Fastify middie sets the span on the raw IncomingMessage, while
    // switchToHttp().getRequest() returns the FastifyRequest wrapper.
    const tracer = trace.getTracer("test");
    const rootSpan = tracer.startSpan("http_request");
    const fastifyRequest = { raw: { [WIDE_EVENT_ROOT_SPAN]: rootSpan } };
    const httpExecutionContext = {
      getClass: () => CatsController,
      getHandler: () => CatsController.prototype.findAll,
      getType: () => "http",
      switchToHttp: () => ({ getRequest: () => fastifyRequest }),
    } as unknown as ExecutionContext;

    // #when: run inside a different nested active span
    const nestedSpan = tracer.startSpan("nested_span");
    await context.with(trace.setSpan(context.active(), nestedSpan), async () =>
      lastValueFrom(
        interceptor.intercept(
          httpExecutionContext,
          callHandler(() => of("ok"))
        )
      )
    );
    nestedSpan.end();
    rootSpan.end();

    // #then
    const finished = traceExporter.getFinishedSpans();
    const root = finished.find((s) => s.name === "http_request");
    const nested = finished.find((s) => s.name === "nested_span");
    expect(root?.attributes["nestjs_otel.wide_event"]).toBe(true);
    expect(nested?.attributes["nestjs_otel.wide_event"]).toBeUndefined();
  });

  it("should fall back to the active span when the request root span already ended", async () => {
    // #given: an ephemeral root span (e.g. @fastify/otel phase span) that ends
    // before the flush runs, plus a live nested active span.
    const tracer = trace.getTracer("test");
    const endedRootSpan = tracer.startSpan("ephemeral_phase_span");
    endedRootSpan.end();
    const fastifyRequest = { raw: { [WIDE_EVENT_ROOT_SPAN]: endedRootSpan } };
    const httpExecutionContext = {
      getClass: () => CatsController,
      getHandler: () => CatsController.prototype.findAll,
      getType: () => "http",
      switchToHttp: () => ({ getRequest: () => fastifyRequest }),
    } as unknown as ExecutionContext;

    const activeSpan = tracer.startSpan("handler_span");
    await context.with(trace.setSpan(context.active(), activeSpan), async () =>
      lastValueFrom(
        interceptor.intercept(
          httpExecutionContext,
          callHandler(() => of("ok"))
        )
      )
    );
    activeSpan.end();

    // #then: marker lands on the live active span, not the ended root span
    const finished = traceExporter.getFinishedSpans();
    const active = finished.find((s) => s.name === "handler_span");
    const ended = finished.find((s) => s.name === "ephemeral_phase_span");
    expect(active?.attributes["nestjs_otel.wide_event"]).toBe(true);
    expect(active?.attributes["code.function.name"]).toBe(
      "CatsController.findAll"
    );
    expect(ended?.attributes["nestjs_otel.wide_event"]).toBeUndefined();
  });

  it("should prefer the processor's local-root span over the active span", async () => {
    // #given: a registered local-root span plus a nested active span in the
    // same trace (as instrumentation-nestjs-core would create).
    const processor = new WideEventSpanProcessor();
    const tracer = trace.getTracer("test");
    const rootSpan = tracer.startSpan("GET /actors");
    processor.onStart(rootSpan as never, {} as never);
    const childContext = trace.setSpan(context.active(), rootSpan);
    const nestedSpan = tracer.startSpan(
      "ActorController.findAll",
      undefined,
      childContext
    );

    await context.with(trace.setSpan(context.active(), nestedSpan), async () =>
      lastValueFrom(
        interceptor.intercept(
          executionContext,
          callHandler(() => of("ok"))
        )
      )
    );
    nestedSpan.end();
    rootSpan.end();

    // #then: marker lands on the local-root span, not the nested span
    const finished = traceExporter.getFinishedSpans();
    const root = finished.find((s) => s.name === "GET /actors");
    const nested = finished.find((s) => s.name === "ActorController.findAll");
    expect(root?.attributes["nestjs_otel.wide_event"]).toBe(true);
    expect(root?.attributes["code.function.name"]).toBe(
      "CatsController.findAll"
    );
    expect(nested?.attributes["nestjs_otel.wide_event"]).toBeUndefined();
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
