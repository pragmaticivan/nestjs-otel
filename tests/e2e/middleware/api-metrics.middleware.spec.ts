import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { metrics } from '@opentelemetry/api-metrics';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AggregationTemporality, MeterProvider, MetricReader } from '@opentelemetry/sdk-metrics-base';
import { MetricService, OpenTelemetryModule } from '../../../src';
import { AppController } from '../../fixture-app/app.controller';
import { EmptyLogger } from '../../utils';
import { meterData } from '../../../src/metrics/metric-data';

class TestMetricReader extends MetricReader {
  selectAggregationTemporality() {
    return AggregationTemporality.CUMULATIVE;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async onForceFlush() { }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async onShutdown() { }
}

describe('Api Metrics Middleware', () => {
  let app: INestApplication;
  const metricService = {
    getCounter: jest.fn(),
    getHistogram: jest.fn(),
  };

  let promExporter: PrometheusExporter;
  let meterProvider: MeterProvider;

  beforeEach(async () => {
    jest.clearAllMocks();
    promExporter = new PrometheusExporter({
      preventServerStart: true,
    });

    meterProvider = new MeterProvider();
    meterProvider.addMetricReader(promExporter);

    metrics.setGlobalMeterProvider(meterProvider);

    meterData.clear();

    await promExporter.startServer();
  });

  it('does not register api metrics when disabled', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [OpenTelemetryModule.forRoot({
        metrics: {
          apiMetrics: {
            enable: false,
          },
        },
      })],
    }).overrideProvider(MetricService)
      .useValue(metricService)
      .compile();

    app = testingModule.createNestApplication();
    await app.init();

    expect(metricService.getCounter).not.toBeCalled();
  });

  it('registers api metrics when enabled', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [OpenTelemetryModule.forRoot({
        metrics: {
          apiMetrics: {
            enable: true,
          },
        },
      })],
    }).overrideProvider(MetricService)
      .useValue(metricService)
      .compile();

    app = testingModule.createNestApplication();
    await app.init();

    expect(metricService.getCounter).toHaveBeenCalledWith('http.server.request.count', {
      description: 'Total number of HTTP requests',
      unit: 'requests',
    });
    expect(metricService.getHistogram).toHaveBeenCalledTimes(3);
  });

  it('uses custom buckets when provided', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [OpenTelemetryModule.forRoot({
        metrics: {
          apiMetrics: {
            enable: true,
          },
        },
      })],
    }).overrideProvider(MetricService)
      .useValue(metricService)
      .compile();

    app = testingModule.createNestApplication();
    await app.init();

    expect(metricService.getHistogram).toHaveBeenCalledWith('http.server.duration', { description: 'The duration of the inbound HTTP request', unit: 'ms' });
  });

  it.only('registers successful request records', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [OpenTelemetryModule.forRoot({
        metrics: {
          apiMetrics: {
            enable: true,
          },
        },
      })],
      controllers: [AppController],
    }).compile();

    app = testingModule.createNestApplication();
    await app.init();

    const agent = request(app.getHttpServer());
    await agent.get('/example/4?foo=bar');

    // Workaround for delay of metrics going to prometheus
    await new Promise(resolve => setTimeout(resolve, 200));

    // TODO: OpenTelemetry exporter does not expose server in a public function.
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    const { text } = await request(promExporter._server)
      .get('/metrics')
      .expect(200);
    console.log('text', text);
    expect(/http_server_response_count_total{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_server_request_count_total{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_response_total{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_request_duration_seconds_count{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_request_duration_seconds_sum{[^}]*path="\/example\/:id"[^}]*}/.test(text)).toBeTruthy();
    expect(/http_request_duration_seconds_bucket{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_request_size_bytes_count{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_request_size_bytes_sum{[^}]*path="\/example\/:id"[^}]*}/.test(text)).toBeTruthy();
    expect(/http_request_size_bytes_bucket{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_response_size_bytes_count{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_response_size_bytes_sum{[^}]*path="\/example\/:id"[^}]*}/.test(text)).toBeTruthy();
    expect(/http_response_size_bytes_bucket{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeTruthy();
  });

  it('registers unsuccessful request records', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [OpenTelemetryModule.forRoot({
        metrics: {
          apiMetrics: {
            enable: true,
          },
        },
      })],
      controllers: [AppController],
    }).compile();

    app = testingModule.createNestApplication();
    await app.init();

    const agent = request(app.getHttpServer());
    await agent.get('/example/4/invalid-route?foo=bar');

    // Workaround for delay of metrics going to prometheus
    await new Promise(resolve => setTimeout(resolve, 500));

    // TODO: OpenTelemetry exporter does not expose server in a public function.
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    const { text } = await request(exporter._server)
      .get('/metrics')
      .expect(200);

    expect(/http_response_error_total 1/.test(text)).toBeTruthy();
    expect(/http_client_error_total 1/.test(text)).toBeTruthy();
    expect(/http_request_total{[^}]*path="\/example\/4\/invalid-route"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_response_total{[^}]*path="\/example\/4\/invalid-route"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_request_duration_seconds_count{[^}]*path="\/example\/4\/invalid-route"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_request_duration_seconds_sum{[^}]*path="\/example\/4\/invalid-route"[^}]*}/.test(text)).toBeTruthy();
    expect(/http_request_duration_seconds_bucket{[^}]*path="\/example\/4\/invalid-route"[^}]*} 1/.test(text)).toBeTruthy();
  });

  it('registers server error request records', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [OpenTelemetryModule.forRoot({
        metrics: {
          apiMetrics: {
            enable: true,
          },
        },
      })],
      controllers: [AppController],
    }).compile();
    testingModule.useLogger(new EmptyLogger());

    app = testingModule.createNestApplication();
    await app.init();

    const agent = request(app.getHttpServer());
    await agent.get('/example/internal-error');

    // Workaround for delay of metrics going to prometheus
    await new Promise(resolve => setTimeout(resolve, 200));

    // TODO: OpenTelemetry exporter does not expose server in a public function.
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    const { text } = await request(exporter._server)
      .get('/metrics')
      .expect(200);

    expect(/http_server_error_total 1/.test(text)).toBeTruthy();
  });

  it('registers requests with custom attributes', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [OpenTelemetryModule.forRoot({
        metrics: {
          apiMetrics: {
            enable: true,
            defaultAttributes: {
              custom: 'label',
            },
          },
        },
      })],
      controllers: [AppController],
    }).compile();
    testingModule.useLogger(new EmptyLogger());

    app = testingModule.createNestApplication();
    await app.init();

    const agent = request(app.getHttpServer());
    await agent.get('/example/internal-error');

    // Workaround for delay of metrics going to prometheus
    await new Promise(resolve => setTimeout(resolve, 200));

    // TODO: OpenTelemetry exporter does not expose server in a public function.
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    const { text } = await request(exporter._server)
      .get('/metrics')
      .expect(200);

    expect(/custom/.test(text)).toBeTruthy();
  });

  it('registers successful request records when using Fastify', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [OpenTelemetryModule.forRoot({
        metrics: {
          apiMetrics: {
            enable: true,
          },
        },
      })],
      controllers: [AppController],
    }).compile();

    app = testingModule.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const agent = request(app.getHttpServer());
    await agent.get('/example/4?foo=bar');

    // Workaround for delay of metrics going to prometheus
    await new Promise(resolve => setTimeout(resolve, 200));

    // TODO: OpenTelemetry exporter does not expose server in a public function.
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    const { text } = await request(exporter._server)
      .get('/metrics')
      .expect(200);

    expect(/http_response_success_total 1/.test(text)).toBeTruthy();
    expect(/http_request_total{[^}]*path="\/example\/4"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_response_total{[^}]*path="\/example\/4"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_request_duration_seconds_count{[^}]*path="\/example\/4"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_request_duration_seconds_sum{[^}]*path="\/example\/4"[^}]*}/.test(text)).toBeTruthy();
    expect(/http_request_duration_seconds_bucket{[^}]*path="\/example\/4"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_request_size_bytes_count{[^}]*path="\/example\/4"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_request_size_bytes_sum{[^}]*path="\/example\/4"[^}]*}/.test(text)).toBeTruthy();
    expect(/http_request_size_bytes_bucket{[^}]*path="\/example\/4"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_response_size_bytes_count{[^}]*path="\/example\/4"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_response_size_bytes_sum{[^}]*path="\/example\/4"[^}]*}/.test(text)).toBeTruthy();
    expect(/http_response_size_bytes_bucket{[^}]*path="\/example\/4"[^}]*} 1/.test(text)).toBeTruthy();
  });

  it('registers unsuccessful request records when using Fastify', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [OpenTelemetryModule.forRoot({
        metrics: {
          apiMetrics: {
            enable: true,
          },
          // hostMetrics: true,
        },
      })],
      controllers: [AppController],
    }).compile();

    app = testingModule.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const agent = request(app.getHttpServer());
    await agent.get('/example/4/invalid-route?foo=bar');

    // Workaround for delay of metrics going to prometheus
    await new Promise(resolve => setTimeout(resolve, 500));

    // TODO: OpenTelemetry exporter does not expose server in a public function.
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    const { text } = await request(exporter._server)
      .get('/metrics')
      .expect(200);

    expect(/http_response_error_total 1/.test(text)).toBeTruthy();
    expect(/http_client_error_total 1/.test(text)).toBeTruthy();
    expect(/http_request_total{[^}]*path="\/example\/4\/invalid-route"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_response_total{[^}]*path="\/example\/4\/invalid-route"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_request_duration_seconds_count{[^}]*path="\/example\/4\/invalid-route"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_request_duration_seconds_sum{[^}]*path="\/example\/4\/invalid-route"[^}]*}/.test(text)).toBeTruthy();
    expect(/http_request_duration_seconds_bucket{[^}]*path="\/example\/4\/invalid-route"[^}]*} 1/.test(text)).toBeTruthy();
  });

  it('registers server error request records when using Fastify', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [OpenTelemetryModule.forRoot({
        metrics: {
          apiMetrics: {
            enable: true,
          },
        },
      })],
      controllers: [AppController],
    }).compile();
    testingModule.useLogger(new EmptyLogger());

    app = testingModule.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const agent = request(app.getHttpServer());
    await agent.get('/example/internal-error');

    // Workaround for delay of metrics going to prometheus
    await new Promise(resolve => setTimeout(resolve, 200));

    // TODO: OpenTelemetry exporter does not expose server in a public function.
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    const { text } = await request(exporter._server)
      .get('/metrics')
      .expect(200);

    expect(/http_server_error_total 1/.test(text)).toBeTruthy();
  });

  it('registers requests with custom attributes when using Fastify', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [OpenTelemetryModule.forRoot({
        metrics: {
          apiMetrics: {
            enable: true,
            defaultAttributes: {
              custom: 'label',
            },
          },
        },
      })],
      controllers: [AppController],
    }).compile();
    testingModule.useLogger(new EmptyLogger());

    app = testingModule.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const agent = request(app.getHttpServer());
    await agent.get('/example/internal-error');

    // Workaround for delay of metrics going to prometheus
    await new Promise(resolve => setTimeout(resolve, 200));

    // TODO: OpenTelemetry exporter does not expose server in a public function.
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    const { text } = await request(exporter._server)
      .get('/metrics')
      .expect(200);

    expect(/custom/.test(text)).toBeTruthy();
  });

  it('does register non-existing route when ignoreUndefinedRoutes option is disabled', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [OpenTelemetryModule.forRoot({
        metrics: {
          apiMetrics: {
            enable: true,
            ignoreUndefinedRoutes: false,
          },
        },
      })],
      controllers: [AppController],
    }).compile();

    app = testingModule.createNestApplication();
    await app.init();

    const agent = request(app.getHttpServer());
    await agent.get('/thispathdoesnotexist');

    // Workaround for delay of metrics going to prometheus
    await new Promise(resolve => setTimeout(resolve, 200));

    // TODO: OpenTelemetry exporter does not expose server in a public function.
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    const { text } = await request(exporter._server)
      .get('/metrics')
      .expect(200);

    expect(/http_response_error_total 1/.test(text)).toBeTruthy();
    expect(/http_request_total{[^}]*path="\/thispathdoesnotexist"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_response_total{[^}]*path="\/thispathdoesnotexist"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_request_duration_seconds_count{[^}]*path="\/thispathdoesnotexist"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_request_duration_seconds_sum{[^}]*path="\/thispathdoesnotexist"[^}]*}/.test(text)).toBeTruthy();
    expect(/http_request_duration_seconds_bucket{[^}]*path="\/thispathdoesnotexist"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_request_size_bytes_count{[^}]*path="\/thispathdoesnotexist"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_request_size_bytes_sum{[^}]*path="\/thispathdoesnotexist"[^}]*}/.test(text)).toBeTruthy();
    expect(/http_request_size_bytes_bucket{[^}]*path="\/thispathdoesnotexist"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_response_size_bytes_count{[^}]*path="\/thispathdoesnotexist"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_response_size_bytes_sum{[^}]*path="\/thispathdoesnotexist"[^}]*}/.test(text)).toBeTruthy();
    expect(/http_response_size_bytes_bucket{[^}]*path="\/thispathdoesnotexist"[^}]*} 1/.test(text)).toBeTruthy();
  });

  it('does not register non-existing route when ignoreUndefinedRoutes option is enabled', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [OpenTelemetryModule.forRoot({
        metrics: {
          apiMetrics: {
            enable: true,
            ignoreUndefinedRoutes: true,
          },
        },
      })],
      controllers: [AppController],
    }).compile();

    app = testingModule.createNestApplication();
    await app.init();

    const agent = request(app.getHttpServer());
    await agent.get('/thispathdoesnotexist');

    // Workaround for delay of metrics going to prometheus
    await new Promise(resolve => setTimeout(resolve, 200));

    // TODO: OpenTelemetry exporter does not expose server in a public function.
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    const { text } = await request(exporter._server)
      .get('/metrics')
      .expect(200);

    expect(/http_response_error_total 1/.test(text)).toBeFalsy();
    expect(/http_request_total{[^}]*path="\/thispathdoesnotexist"[^}]*} 1/.test(text)).toBeFalsy();
    expect(/http_response_total{[^}]*path="\/thispathdoesnotexist"[^}]*} 1/.test(text)).toBeFalsy();
    expect(/http_request_duration_seconds_count{[^}]*path="\/thispathdoesnotexist"[^}]*} 1/.test(text)).toBeFalsy();
    expect(/http_request_duration_seconds_sum{[^}]*path="\/thispathdoesnotexist"[^}]*}/.test(text)).toBeFalsy();
    expect(/http_request_duration_seconds_bucket{[^}]*path="\/thispathdoesnotexist"[^}]*} 1/.test(text)).toBeFalsy();
    expect(/http_request_size_bytes_count{[^}]*path="\/thispathdoesnotexist"[^}]*} 1/.test(text)).toBeFalsy();
    expect(/http_request_size_bytes_sum{[^}]*path="\/thispathdoesnotexist"[^}]*}/.test(text)).toBeFalsy();
    expect(/http_request_size_bytes_bucket{[^}]*path="\/thispathdoesnotexist"[^}]*} 1/.test(text)).toBeFalsy();
    expect(/http_response_size_bytes_count{[^}]*path="\/thispathdoesnotexist"[^}]*} 1/.test(text)).toBeFalsy();
    expect(/http_response_size_bytes_sum{[^}]*path="\/thispathdoesnotexist"[^}]*}/.test(text)).toBeFalsy();
    expect(/http_response_size_bytes_bucket{[^}]*path="\/thispathdoesnotexist"[^}]*} 1/.test(text)).toBeFalsy();
  });

  it('does not register endpoint when listed in ignoreRoutes explicitly', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [OpenTelemetryModule.forRoot({
        metrics: {
          apiMetrics: {
            enable: true,
            ignoreRoutes: ['/example/4'],
          },
        },
      })],
      controllers: [AppController],
    }).compile();

    app = testingModule.createNestApplication();
    await app.init();

    const agent = request(app.getHttpServer());
    await agent.get('/example/4?foo=bar');

    // Workaround for delay of metrics going to prometheus
    await new Promise(resolve => setTimeout(resolve, 200));

    // TODO: OpenTelemetry exporter does not expose server in a public function.
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    const { text } = await request(exporter._server)
      .get('/metrics')
      .expect(200);

    expect(/http_response_success_total 1/.test(text)).toBeFalsy();
    expect(/http_request_total{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeFalsy();
    expect(/http_response_total{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeFalsy();
    expect(/http_request_duration_seconds_count{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeFalsy();
    expect(/http_request_duration_seconds_sum{[^}]*path="\/example\/:id"[^}]*}/.test(text)).toBeFalsy();
    expect(/http_request_duration_seconds_bucket{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeFalsy();
    expect(/http_request_size_bytes_count{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeFalsy();
    expect(/http_request_size_bytes_sum{[^}]*path="\/example\/:id"[^}]*}/.test(text)).toBeFalsy();
    expect(/http_request_size_bytes_bucket{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeFalsy();
    expect(/http_response_size_bytes_count{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeFalsy();
    expect(/http_response_size_bytes_sum{[^}]*path="\/example\/:id"[^}]*}/.test(text)).toBeFalsy();
    expect(/http_response_size_bytes_bucket{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeFalsy();
  });

  it('does not register endpoint when listed in ignoreRoutes using wildcards', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [OpenTelemetryModule.forRoot({
        metrics: {
          apiMetrics: {
            enable: true,
            ignoreRoutes: ['/(.*)'],
          },
        },
      })],
      controllers: [AppController],
    }).compile();

    app = testingModule.createNestApplication();
    await app.init();

    const agent = request(app.getHttpServer());
    await agent.get('/example/4?foo=bar');

    // Workaround for delay of metrics going to prometheus
    await new Promise(resolve => setTimeout(resolve, 200));

    // TODO: OpenTelemetry exporter does not expose server in a public function.
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    const { text } = await request(exporter._server)
      .get('/metrics')
      .expect(200);

    expect(/http_response_success_total 1/.test(text)).toBeFalsy();
    expect(/http_request_total{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeFalsy();
    expect(/http_response_total{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeFalsy();
    expect(/http_request_duration_seconds_count{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeFalsy();
    expect(/http_request_duration_seconds_sum{[^}]*path="\/example\/:id"[^}]*}/.test(text)).toBeFalsy();
    expect(/http_request_duration_seconds_bucket{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeFalsy();
    expect(/http_request_size_bytes_count{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeFalsy();
    expect(/http_request_size_bytes_sum{[^}]*path="\/example\/:id"[^}]*}/.test(text)).toBeFalsy();
    expect(/http_request_size_bytes_bucket{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeFalsy();
    expect(/http_response_size_bytes_count{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeFalsy();
    expect(/http_response_size_bytes_sum{[^}]*path="\/example\/:id"[^}]*}/.test(text)).toBeFalsy();
    expect(/http_response_size_bytes_bucket{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeFalsy();
  });

  afterEach(async () => {
    metrics.disable();
    if (promExporter) {
      await promExporter.stopServer();
    }
    if (app) {
      await app.close();
    }
  });
});
