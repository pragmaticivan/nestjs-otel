import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MetricService, OpenTelemetryModule } from '../../src';
import { DEFAULT_LONG_RUNNING_REQUEST_BUCKETS } from '../../src/middleware';
import { AppController } from '../fixture-app/app.controller';
import { EmptyLogger } from '../utils';

describe('Api Metrics Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  let app: INestApplication;
  let exporter: PrometheusExporter;

  const metricService = {
    getCounter: jest.fn(),
    getValueRecorder: jest.fn(),
  };

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

    expect(metricService.getCounter).toBeCalledWith('http_request_total', { description: 'Total number of HTTP requests' });
    expect(metricService.getCounter).toBeCalledWith('http_response_total', { description: 'Total number of HTTP responses' });
    expect(metricService.getCounter).toBeCalledWith('http_response_success_total', { description: 'Total number of all successful responses' });
    expect(metricService.getValueRecorder).toBeCalledWith('http_request_duration_seconds', { description: 'HTTP latency value recorder in seconds', boundaries: DEFAULT_LONG_RUNNING_REQUEST_BUCKETS });
  });

  it('uses custom buckets when provided', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [OpenTelemetryModule.forRoot({
        metrics: {
          apiMetrics: {
            enable: true,
            timeBuckets: [1, 2],
          },
        },
      })],
    }).overrideProvider(MetricService)
      .useValue(metricService)
      .compile();

    app = testingModule.createNestApplication();
    await app.init();

    expect(metricService.getValueRecorder).toBeCalledWith('http_request_duration_seconds', { description: 'HTTP latency value recorder in seconds', boundaries: [1, 2] });
  });

  it('registers successful request records', async () => {
    exporter = new PrometheusExporter({
      port: 8089,
    });

    const testingModule = await Test.createTestingModule({
      imports: [OpenTelemetryModule.forRoot({
        metrics: {
          apiMetrics: {
            enable: true,
          },
          // hostMetrics: true,
        },
        nodeSDKConfiguration: {
          metricExporter: exporter,
        },
      })],
      controllers: [AppController],
    }).compile();

    app = testingModule.createNestApplication();
    await app.init();

    const agent = request(app.getHttpServer());
    await agent.get('/example/4?foo=bar');

    // Workaround for delay of metrics going to prometheus
    await new Promise(resolve => setTimeout(resolve, 1000));

    // TODO: OpenTelemetry exporter does not expose server in a public function.
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    const { text } = await request(exporter._server)
      .get('/metrics')
      .expect(200);

    expect(/http_response_success_total 1/.test(text)).toBeTruthy();
    expect(/http_request_total{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_response_total{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_request_duration_seconds_count{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeTruthy();
    expect(/http_request_duration_seconds_sum{[^}]*path="\/example\/:id"[^}]*}/.test(text)).toBeTruthy();
    expect(/http_request_duration_seconds_bucket{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)).toBeTruthy();
  });

  it('registers unsuccessful request records', async () => {
    exporter = new PrometheusExporter({
      port: 8089,
    });

    const testingModule = await Test.createTestingModule({
      imports: [OpenTelemetryModule.forRoot({
        metrics: {
          apiMetrics: {
            enable: true,
          },
          // hostMetrics: true,
        },
        nodeSDKConfiguration: {
          metricExporter: exporter,
        },
      })],
      controllers: [AppController],
    }).compile();

    app = testingModule.createNestApplication();
    await app.init();

    const agent = request(app.getHttpServer());
    await agent.get('/example/4/invalid-route?foo=bar');

    // Workaround for delay of metrics going to prometheus
    await new Promise(resolve => setTimeout(resolve, 1000));

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
    exporter = new PrometheusExporter({
      port: 8089,
    });

    const testingModule = await Test.createTestingModule({
      imports: [OpenTelemetryModule.forRoot({
        metrics: {
          apiMetrics: {
            enable: true,
          },
          // hostMetrics: true,
        },
        nodeSDKConfiguration: {
          metricExporter: exporter,
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
    await new Promise(resolve => setTimeout(resolve, 1000));

    // TODO: OpenTelemetry exporter does not expose server in a public function.
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    const { text } = await request(exporter._server)
      .get('/metrics')
      .expect(200);

    expect(/http_server_error_total 1/.test(text)).toBeTruthy();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });
});
