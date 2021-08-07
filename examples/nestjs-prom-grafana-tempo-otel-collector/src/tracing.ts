import {
  CompositePropagator,
  HttpTraceContextPropagator,
  HttpBaggagePropagator,
} from '@opentelemetry/core';
import { BatchSpanProcessor } from '@opentelemetry/tracing';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerPropagator } from '@opentelemetry/propagator-jaeger';
import { B3InjectEncoding, B3Propagator } from '@opentelemetry/propagator-b3';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import * as process from 'process';
import { CollectorTraceExporter, CollectorMetricExporter } from '@opentelemetry/exporter-collector-grpc';

const traceCollectorOptions = {
  url: 'grpc://otel-collector:4317'
};
const metricCollectorOptions = {
  url: 'grpc://otel-collector:4317'
};

const spanExporter = new CollectorTraceExporter(traceCollectorOptions);
const metricExporter = new CollectorMetricExporter(metricCollectorOptions);
const otelSDK = new NodeSDK({
  metricInterval: 6000,
  spanProcessor: new BatchSpanProcessor(spanExporter),
  metricExporter: metricExporter,
  contextManager: new AsyncLocalStorageContextManager(),
  textMapPropagator: new CompositePropagator({
    propagators: [
      new JaegerPropagator(),
      new HttpTraceContextPropagator(),
      new HttpBaggagePropagator(),
      new B3Propagator(),
      new B3Propagator({
        injectEncoding: B3InjectEncoding.MULTI_HEADER,
      }),
    ],
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

export default otelSDK;
// You can also use the shutdown method to gracefully shut down the SDK before process shutdown
// or on some operating system signal.
process.on('SIGTERM', () => {
  otelSDK
    .shutdown()
    .then(
      () => console.log('SDK shut down successfully'),
      (err) => console.log('Error shutting down SDK', err),
    )
    .finally(() => process.exit(0));
});
