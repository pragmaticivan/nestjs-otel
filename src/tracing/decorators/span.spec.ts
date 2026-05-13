import "reflect-metadata";
import { SetMetadata } from "@nestjs/common";
import { SpanKind, SpanStatusCode } from "@opentelemetry/api";
import {
  InMemorySpanExporter,
  NodeTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import { Span } from "./span";

const TestDecoratorThatSetsMetadata = () => SetMetadata("some-metadata", true);

const symbol = Symbol("testSymbol");

class TestSpan {
  @Span()
  singleSpan() {}

  @Span()
  doubleSpan() {
    return this.singleSpan();
  }

  @Span("foo", { kind: SpanKind.PRODUCER })
  fooProducerSpan() {}

  @Span("bar", (a, b) => ({ attributes: { a, b } }))
  argsInOptions(_a: number, _b: string) {}

  @Span({ kind: SpanKind.PRODUCER })
  implicitSpanNameWithOptions() {}

  @Span((a, b) => ({ attributes: { a, b } }))
  argsInOptionsWithImplicitName(_a: number, _b: string) {}

  @Span()
  error() {
    throw new Error("hello world");
  }

  @Span()
  @TestDecoratorThatSetsMetadata()
  metadata() {}

  @Span()
  [symbol]() {}

  @Span({
    onResult: (result) => ({ attributes: { result } }),
  })
  syncMethod() {
    return "success";
  }

  @Span({
    onResult: (result) => ({ attributes: { result } }),
  })
  async asyncMethod() {
    return "async success";
  }

  @Span({
    onResult: (_result) => {
      throw new Error("onResult error");
    },
  })
  errorInOnResult() {
    return "success";
  }

  @Span()
  async asyncError() {
    throw new Error("async hello world");
  }

  lastLazyThenable?: LazyThenable<string>;

  @Span()
  returnsLazyThenable() {
    this.lastLazyThenable = makeLazyThenable("lazy result");
    return this.lastLazyThenable;
  }

  @Span()
  returnsFailingLazyThenable() {
    return makeFailingLazyThenable(new Error("lazy rejection"));
  }
}

/**
 * Builds a "lazy" thenable in the style of query builders such as Knex,
 * Mongoose Query, or Drizzle: it only performs work when a consumer
 * actually subscribes via `.then()`. The `triggered` flag flips true
 * the moment `.then()` is invoked.
 */
type LazyThenable<T> = PromiseLike<T> & {
  triggered: boolean;
  catch: (onRejected?: (e: unknown) => unknown) => PromiseLike<unknown>;
};

function makeLazyThenable<T>(value: T): LazyThenable<T> {
  const thenable: LazyThenable<T> = {
    triggered: false,
    // biome-ignore lint/suspicious/noThenProperty: <We are testing the behavior of the thenable>
    then(onFulfilled, onRejected) {
      thenable.triggered = true;
      try {
        const result = onFulfilled ? onFulfilled(value) : (value as never);
        return Promise.resolve(result);
      } catch (error) {
        if (onRejected) {
          return Promise.resolve(onRejected(error)) as never;
        }
        return Promise.reject(error) as never;
      }
    },
    catch(onRejected) {
      return thenable.then(undefined, onRejected);
    },
  };
  return thenable;
}

function makeFailingLazyThenable(
  error: Error
): PromiseLike<never> & { triggered: boolean } {
  const thenable = {
    triggered: false,
    // biome-ignore lint/suspicious/noThenProperty: <We are testing the behavior of the thenable>
    then(_onFulfilled: any, onRejected?: any) {
      thenable.triggered = true;
      if (onRejected) {
        return Promise.resolve(onRejected(error)) as never;
      }
      return Promise.reject(error) as never;
    },
    catch(onRejected?: any) {
      return thenable.then(undefined, onRejected);
    },
  };
  return thenable;
}

describe("Span", () => {
  let instance: TestSpan;
  let traceExporter: InMemorySpanExporter;
  let spanProcessor: SimpleSpanProcessor;
  let provider: NodeTracerProvider;

  beforeAll(async () => {
    instance = new TestSpan();
    traceExporter = new InMemorySpanExporter();
    spanProcessor = new SimpleSpanProcessor(traceExporter);

    provider = new NodeTracerProvider({
      spanProcessors: [spanProcessor],
    });
    provider.register();
  });

  afterEach(async () => {
    spanProcessor.forceFlush();
    traceExporter.reset();
  });

  afterAll(async () => {
    await provider.shutdown();
  });

  it("should maintain reflect metadataa", async () => {
    expect(Reflect.getMetadata("some-metadata", instance.metadata)).toEqual(
      true
    );
  });

  it("should preserve the original method name", () => {
    const originalFunctionName = instance.singleSpan.name;
    expect(originalFunctionName).toEqual("singleSpan");
  });

  it("should set correct span", async () => {
    instance.singleSpan();

    const spans = traceExporter.getFinishedSpans();

    expect(spans).toHaveLength(1);
    expect(spans.map((span) => span.name)).toEqual(["TestSpan.singleSpan"]);
  });

  it("should set correct span options", async () => {
    instance.fooProducerSpan();

    const spans = traceExporter.getFinishedSpans();

    expect(spans).toHaveLength(1);
    expect(spans.map((span) => span.kind)).toEqual([SpanKind.PRODUCER]);
  });

  it("should set correct span options with implicit span name", async () => {
    instance.implicitSpanNameWithOptions();

    const spans = traceExporter.getFinishedSpans();

    expect(spans).toHaveLength(1);
    expect(spans[0].name).toEqual("TestSpan.implicitSpanNameWithOptions");
    expect(spans[0].kind).toEqual(SpanKind.PRODUCER);
  });

  it("should set correct span options based on method params", async () => {
    instance.argsInOptions(10, "bar");

    const spans = traceExporter.getFinishedSpans();

    expect(spans).toHaveLength(1);
    expect(spans[0].attributes).toEqual({ a: 10, b: "bar" });
  });

  it("should set correct span options based on method params with implicit span name", async () => {
    instance.argsInOptionsWithImplicitName(10, "bar");

    const spans = traceExporter.getFinishedSpans();

    expect(spans).toHaveLength(1);
    expect(spans[0].attributes).toEqual({ a: 10, b: "bar" });
  });

  it("should set correct span even when calling other method with Span decorator", async () => {
    instance.doubleSpan();

    const spans = traceExporter.getFinishedSpans();

    expect(spans).toHaveLength(2);
    expect(spans.map((span) => span.name)).toEqual([
      "TestSpan.singleSpan",
      "TestSpan.doubleSpan",
    ]);
  });

  it("should propagate errors", () => {
    expect(instance.error).toThrow("hello world");
  });

  it("should set setStatus to ERROR and message to error message", async () => {
    expect(instance.error).toThrow("hello world");

    const spans = traceExporter.getFinishedSpans();

    expect(spans).toHaveLength(1);
    expect(spans[0].status).toEqual({
      code: SpanStatusCode.ERROR,
      message: "hello world",
    });
  });

  it("should set recordException with error", () => {
    expect(instance.error).toThrow("hello world");

    const spans = traceExporter.getFinishedSpans();

    expect(spans).toHaveLength(1);
    // Contain one exception event
    expect(spans[0].events).toHaveLength(1);
    expect(spans[0].events[0]).toEqual({
      name: "exception",
      attributes: expect.anything(),
      droppedAttributesCount: 0,
      time: expect.anything(),
    });
  });

  it("should handle symbols", () => {
    instance[symbol]();

    const spans = traceExporter.getFinishedSpans();

    expect(spans).toHaveLength(1);
    expect(spans.map((span) => span.name)).toEqual([
      "TestSpan.Symbol(testSymbol)",
    ]);
  });

  it("should set attributes from onResult in sync method", async () => {
    const result = instance.syncMethod();
    expect(result).toBe("success");

    const spans = traceExporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    expect(spans[0].attributes).toEqual({ result: "success" });
  });

  it("should set attributes from onResult in async method", async () => {
    const result = await instance.asyncMethod();
    expect(result).toBe("async success");

    const spans = traceExporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    expect(spans[0].attributes).toEqual({ result: "async success" });
  });

  it("should record exception if onResult throws", async () => {
    const result = instance.errorInOnResult();
    expect(result).toBe("success");

    const spans = traceExporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    // Should have error status
    expect(spans[0].status.code).toBe(SpanStatusCode.ERROR);
    expect(spans[0].status.message).toBe("onResult error");
    // Should have exception event
    expect(spans[0].events).toHaveLength(1);
    expect(spans[0].events[0].name).toBe("exception");
  });

  it("should not trigger a lazy thenable returned by the wrapped method", () => {
    const returned = instance.returnsLazyThenable();

    // The decorator must hand the lazy thenable back to the caller untouched.
    // It must NOT subscribe via .then(), which would force-execute query
    // builders such as Knex, Mongoose Query, or Drizzle queries that the
    // caller intended to defer (or compose further) before awaiting.
    expect(instance.lastLazyThenable?.triggered).toBe(false);
    expect(returned).toBe(instance.lastLazyThenable);
  });

  it("should end the span synchronously before the caller awaits a lazy thenable", () => {
    instance.returnsLazyThenable();

    // The span closes as soon as the decorated method returns, before the
    // caller subscribes to the thenable, because the decorator cannot know
    // whether the caller will compose it further or await it at all.
    const spans = traceExporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    expect(spans[0].name).toBe("TestSpan.returnsLazyThenable");
  });

  it("should not record errors from a lazy thenable that rejects after the span has ended", async () => {
    const returned = instance.returnsFailingLazyThenable();

    // Span is already closed — no error recorded yet.
    const spans = traceExporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    expect(spans[0].status.code).toBe(SpanStatusCode.UNSET);
    expect(spans[0].events).toHaveLength(0);

    // Caller awaits the thenable now — it rejects — but the span is gone.
    await expect(Promise.resolve(returned)).rejects.toThrow("lazy rejection");

    // Known limitation: the rejection is invisible to the span.
    expect(traceExporter.getFinishedSpans()[0].events).toHaveLength(0);
  });

  it("should still track results from async (real Promise) methods", async () => {
    const result = await instance.asyncMethod();
    expect(result).toBe("async success");

    const spans = traceExporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    expect(spans[0].name).toBe("TestSpan.asyncMethod");
    expect(spans[0].status.code).toBe(SpanStatusCode.UNSET);
    expect(spans[0].attributes).toEqual({ result: "async success" });
  });

  it("should still track errors thrown by async (real Promise) methods", async () => {
    await expect(instance.asyncError()).rejects.toThrow("async hello world");

    const spans = traceExporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    expect(spans[0].name).toBe("TestSpan.asyncError");
    expect(spans[0].status).toEqual({
      code: SpanStatusCode.ERROR,
      message: "async hello world",
    });
    expect(spans[0].events).toHaveLength(1);
    expect(spans[0].events[0].name).toBe("exception");
  });
});
