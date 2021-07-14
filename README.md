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
const OpenTelemetryModuleConfig = OpenTelemetryModule.forRoot({
  metrics: {
    hostMetrics: true, // Includes Host Metrics
    defaultMetrics: true, // Includes Default Metrics
    apiMetrics: {
      enable: true, // Includes api metrics
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

## API Metrics with Middleware

Impl |Metric |Description| Labels | Metric Type
--- | --- | --- | --- | ---
| ✅ | http_request_total | Total number of HTTP requests.| method, path | Counter |
| ✅ | http_response_total| Total number of HTTP responses.| method, status, path | Counter |
| ✅ | http_response_success_total| Total number of all successful responses.| - | Counter |
| ✅ | http_response_error_total| Total number of all response errors.| - | Counter |
| ✅ | http_request_duration_seconds | HTTP latency value recorder in seconds. | method, status, path | ValueRecorder |
| ✅ | http_client_error_total | Total number of client error requests. | - | Counter |
| ✅ | http_server_error_total | Total number of server error requests. | - | Counter |
|    | http_server_aborts_total | Total number of data transfers aborted by the client. | - | Counter |
|    | http_client_aborts_total | Total number of data transfers aborted by the server. | - | Counter |
|    | http_connection_error_total | Total of connection errors.| - | Counter |
|    | http_request_size_bytes | Current total of incoming bytes. | - | ValueRecorder|
|    | http_response_size_bytes | Current total of outgoing bytes. | - | ValueRecorder |
|    | http_slow_request_total | The server handled slow requests counter - `t=%d`. | - | Counter |

## Prometheus Metrics

When `nodeSDKConfiguration.metricExporter` is defined with a `PrometheusExporter`it will start a new process on port `8081` (default port) and metrics will be available at `http://localhost:8081/metrics`.

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

## Inspiration

* https://github.com/MetinSeylan/Nestjs-OpenTelemetry
* https://github.com/digikare/nestjs-prom
* https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html#actuator.metrics
* https://github.com/prometheus/haproxy_exporter/blob/master/haproxy_exporter.go
* https://github.com/mnadeem/nodejs-opentelemetry-tempo
