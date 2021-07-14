import { Module } from '@nestjs/common';
import { OpenTelemetryModule } from 'nestjs-otel';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import {
  CompositePropagator,
  HttpTraceContextPropagator,
  HttpBaggagePropagator,
} from '@opentelemetry/core';
import { BatchSpanProcessor } from '@opentelemetry/tracing';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerPropagator } from '@opentelemetry/propagator-jaeger';
import { B3InjectEncoding, B3Propagator } from '@opentelemetry/propagator-b3';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { LoggerModule } from './logger/logger.module';

const OpenTelemetryModuleConfig = OpenTelemetryModule.forRoot({
  metrics: {
    hostMetrics: true,
    defaultMetrics: true,
    apiMetrics: {
      enable: true,
      timeBuckets: [],
    },
  },
  nodeSDKConfiguration: {
    metricExporter: new PrometheusExporter({
      port: 8081,
    }),
    spanProcessor: new BatchSpanProcessor(new JaegerExporter()),
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
  },
});

@Module({
  imports: [OpenTelemetryModuleConfig, LoggerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
