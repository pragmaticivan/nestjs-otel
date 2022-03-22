import { context, trace } from '@opentelemetry/api';
import { Span } from './span';
import { NodeSDK, tracing } from '@opentelemetry/sdk-node';

class TestSpan {
  @Span()
  singleSpan() {
    return trace.getSpan(context.active());
  }

  @Span()
  doubleSpan() {
    return this.singleSpan();
  }
}

describe('Span', () => {
  let instance: TestSpan;
  let otelSdk: NodeSDK;

  beforeEach(async () => {
    instance = new TestSpan();

    otelSdk = new NodeSDK({
      traceExporter: new tracing.ConsoleSpanExporter(),
      // Noop Span Processor disables any spans from being outputted
      // by ConsoleSpanExporter.
      // Remove it if you want to debug spans exported.
      spanProcessor: new tracing.NoopSpanProcessor(),
    });

    await otelSdk.start();
  });

  afterEach(async () => {
    await otelSdk.shutdown();
  });

  it('should set correct span', async () => {
    const response = instance.singleSpan();
    expect((response as any).name).toEqual('TestSpan.singleSpan');
  });

  it('should set correct span even when calling other method with Span decorator', async () => {
    const response = instance.doubleSpan();
    expect((response as any).name).toEqual('TestSpan.singleSpan');
  });
});
