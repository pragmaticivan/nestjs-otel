import 'reflect-metadata';
import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import {
  InMemorySpanExporter,
  NodeTracerProvider,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-node';
import { SetMetadata } from '@nestjs/common';
import { Span } from './span';

const TestDecoratorThatSetsMetadata = () => SetMetadata('some-metadata', true);

class TestSpan {
  @Span()
  singleSpan() {}

  @Span()
  doubleSpan() {
    return this.singleSpan();
  }

  @Span('foo', { kind: SpanKind.PRODUCER })
  fooProducerSpan() {}

  @Span()
  error() {
    throw new Error('hello world');
  }

  @Span()
  @TestDecoratorThatSetsMetadata()
  metadata() {}
}

describe('Span', () => {
  let instance: TestSpan;
  let traceExporter: InMemorySpanExporter;
  let spanProcessor: SimpleSpanProcessor;
  let provider: NodeTracerProvider;

  beforeAll(async () => {
    instance = new TestSpan();
    traceExporter = new InMemorySpanExporter();
    spanProcessor = new SimpleSpanProcessor(traceExporter);

    provider = new NodeTracerProvider();
    provider.addSpanProcessor(spanProcessor);
    provider.register();
  });

  afterEach(async () => {
    spanProcessor.forceFlush();
    traceExporter.reset();
  });

  afterAll(async () => {
    await provider.shutdown();
  });

  it('should maintain reflect metadataa', async () => {
    expect(Reflect.getMetadata('some-metadata', instance.metadata)).toEqual(true);
  });

  it('should set correct span', async () => {
    instance.singleSpan();

    const spans = traceExporter.getFinishedSpans();

    expect(spans).toHaveLength(1);
    expect(spans.map(span => span.name)).toEqual(['TestSpan.singleSpan']);
  });

  it('should set correct span options', async () => {
    instance.fooProducerSpan();

    const spans = traceExporter.getFinishedSpans();

    expect(spans).toHaveLength(1);
    expect(spans.map(span => span.kind)).toEqual([SpanKind.PRODUCER]);
  });

  it('should set correct span even when calling other method with Span decorator', async () => {
    instance.doubleSpan();

    const spans = traceExporter.getFinishedSpans();

    expect(spans).toHaveLength(2);
    expect(spans.map(span => span.name)).toEqual(['TestSpan.singleSpan', 'TestSpan.doubleSpan']);
  });

  it('should propagate errors', () => {
    expect(instance.error).toThrowError('hello world');
  });

  it('should set setStatus to ERROR and message to error message', async () => {
    expect(instance.error).toThrowError('hello world');

    const spans = traceExporter.getFinishedSpans();

    expect(spans).toHaveLength(1);
    expect(spans[0].status).toEqual({ code: SpanStatusCode.ERROR, message: 'hello world' });
  });

  it('should set recordException with error', () => {
    expect(instance.error).toThrowError('hello world');

    const spans = traceExporter.getFinishedSpans();

    expect(spans).toHaveLength(1);
    // Contain one exception event
    expect(spans[0].events).toHaveLength(1);
    expect(spans[0].events[0]).toEqual({
      name: 'exception',
      attributes: expect.anything(),
      droppedAttributesCount: 0,
      time: expect.anything(),
    });
  });
});
