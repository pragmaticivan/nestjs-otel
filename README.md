<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

# NestJS OpenTelemetry (OTEL)

![Build Status](https://github.com/pragmaticivan/nestjs-otel/actions/workflows/nodejs.yml/badge.svg)
[![NPM](https://img.shields.io/npm/v/nestjs-otel.svg)](https://www.npmjs.com/package/nestjs-otel)
## Description

[OpenTelemetry](https://opentelemetry.io/) module for [Nest](https://github.com/nestjs/nest).

## Why

Setting up observability metrics with nestjs requires multiple libraries and patterns. OpenTelemetry has support for multiple exporters and types of metrics such as Prometheus Metrics.

## Installation

```bash
$ npm i nestjs-otel --save
```

## Setup

Some peers dependencies are required when some configurations are enabled.

```
@opentelemetry/exporter-prometheus
@opentelemetry/host-metrics
@opentelemetry/metrics
opentelemetry-node-metrics
```

`nodeSDKConfiguration` property accepts OpenTelemetry NodeSDK configuration.

```ts
const OpenTelemetryModuleConfig = OpenTelemetryModule.register({
  withPrometheusExporter: {
    enable: true, // Enables prometheus exporter
    withHostMetrics: true, // Includes Host Metrics
    withDefaultMetrics: true, // Includes Default Metrics
    withHttpMiddleware: {  // Includes api metrics
      enable: true,
      timeBuckets: [],
    },
  },
  nodeSDKConfiguration: {
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
  imports: [
    OpenTelemetryModuleConfig,
  ],
})
export class AppModule {}
```

## Span Decorator

If you need, you can define a custom Tracing Span for a method. It works async or sync. Span takes its name from the parameter; but by default, it is the same as the method's name

```ts
import { Span } from 'nestjs-otel';

@Span('CRITICAL_SECTION')
async getBooks() {
    return [`Harry Potter and the Philosopher's Stone`];
}
```

## Tracing Service

In case you need to access native span methods for special logics in the method block:

```ts
import { TraceService } from 'nestjs-otel';

@Injectable()
export class BookService {
  constructor(private readonly traceService: TraceService) {}

  @Span()
  async getBooks() {
    const currentSpan = this.traceService.getSpan(); // --> retrives current span, comes from http or @Span
    await this.doSomething();
    currentSpan.addEvent('event 1');
    currentSpan.end(); // current span end

    const span = this.traceService.startSpan('sub_span'); // start new span
    span.setAttributes({ userId: 1 });
    await this.doSomethingElse();
    span.end(); // new span ends
    return [`Harry Potter and the Philosopher's Stone`];
  }
}
```

## Metric Service

[OpenTelemetry Metrics](https://www.npmjs.com/package/@opentelemetry/metrics) allow a user to collect data and export it to metrics backend like Prometheus.

```ts
import { MetricService } from 'nestjs-otel';
import { Counter } from '@opentelemetry/api-metrics';

@Injectable()
export class BookService {
  private customMetricCounter: Counter;

  constructor(private readonly metricService: MetricService) {
    this.customMetricCounter = this.metricService.getCounter('custom_counter', {
      description: 'Description for counter',
    });
  }

  async getBooks() {
    this.customMetricCounter.add(1);
    return [`Harry Potter and the Philosopher's Stone`];
  }
}
```

## Using with a logger

### Pino

```ts
import Pino, { Logger } from 'pino';
import { LoggerOptions } from 'pino';
import { trace, context } from '@opentelemetry/api';

export const loggerOptions: LoggerOptions = {
  formatters: {
    log(object) {
      const span = trace.getSpan(context.active());
      if (!span) return { ...object };
      const { spanId, traceId } = trace.getSpan(context.active())?.spanContext();
      return { ...object, spanId, traceId };
    },
  },
};

export const logger: Logger = Pino(loggerOptions);
```

## License

[MIT License](https://pragmaticivan.mit-license.org/) © Ivan Santos
