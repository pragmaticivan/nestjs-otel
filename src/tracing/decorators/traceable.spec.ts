import "reflect-metadata";
import { SetMetadata } from "@nestjs/common";
import { SpanKind } from "@opentelemetry/api";
import {
  InMemorySpanExporter,
  NodeTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import { Traceable } from "./traceable";

const TestDecoratorThatSetsMetadata = () => SetMetadata("some-metadata", true);

@Traceable()
class TestTraceable {
  methodOne() {}

  methodTwo() {
    return this.methodOne();
  }

  @TestDecoratorThatSetsMetadata()
  methodWithMetadata() {}

  async asyncMethod() {
    return new Promise((resolve) => setTimeout(resolve, 10));
  }
}

@Traceable({ kind: SpanKind.PRODUCER })
class TestTraceableWithOptions {
  methodOne() {}
}

describe("Traceable", () => {
  let instance: TestTraceable;
  let instanceWithOptions: TestTraceableWithOptions;
  let traceExporter: InMemorySpanExporter;
  let spanProcessor: SimpleSpanProcessor;
  let provider: NodeTracerProvider;

  beforeAll(async () => {
    instance = new TestTraceable();
    instanceWithOptions = new TestTraceableWithOptions();
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

  it("should trace all methods in the class", async () => {
    instance.methodOne();

    const spans = traceExporter.getFinishedSpans();

    expect(spans).toHaveLength(1);
    expect(spans[0].name).toEqual("TestTraceable.methodOne");
  });

  it("should trace nested calls within the class", async () => {
    instance.methodTwo();

    const spans = traceExporter.getFinishedSpans();

    expect(spans).toHaveLength(2);
    // methodTwo calls methodOne, so we expect both spans.
    // Since it's synchronous, methodOne finishes first (nested), then methodTwo.
    // But wait, startActiveSpan starts a span.
    // methodTwo starts span -> calls methodOne -> starts span -> methodOne ends -> span ends -> methodTwo ends -> span ends.
    // getFinishedSpans returns finished spans.
    // So methodOne span should be first, then methodTwo span.
    expect(spans.map((s) => s.name)).toEqual([
      "TestTraceable.methodOne",
      "TestTraceable.methodTwo",
    ]);
  });

  it("should maintain reflect metadata", async () => {
    expect(
      Reflect.getMetadata("some-metadata", instance.methodWithMetadata)
    ).toEqual(true);
  });

  it("should apply options to all methods", async () => {
    instanceWithOptions.methodOne();

    const spans = traceExporter.getFinishedSpans();

    expect(spans).toHaveLength(1);
    expect(spans[0].name).toEqual("TestTraceableWithOptions.methodOne");
    expect(spans[0].kind).toEqual(SpanKind.PRODUCER);
  });

  it("should preserve the original method name", () => {
    expect(instance.methodOne.name).toEqual("methodOne");
  });

  it("should trace async methods", async () => {
    await instance.asyncMethod();

    const spans = traceExporter.getFinishedSpans();

    expect(spans).toHaveLength(1);
    expect(spans[0].name).toEqual("TestTraceable.asyncMethod");
  });
});
