import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { metrics } from '@opentelemetry/api';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { MetricService, OpenTelemetryModule } from '../../../src';
import { AppController } from '../../fixture-app/app.controller';
import { meterData } from '../../../src/metrics/metric-data';

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
      imports: [
        OpenTelemetryModule.forRoot({
          metrics: {
            apiMetrics: {
              enable: false,
            },
          },
        }),
      ],
    })
      .overrideProvider(MetricService)
      .useValue(metricService)
      .compile();

    app = testingModule.createNestApplication();
    await app.init();

    expect(metricService.getCounter).not.toBeCalled();
  });

  it('registers api metrics when enabled', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [
        OpenTelemetryModule.forRoot({
          metrics: {
            apiMetrics: {
              enable: true,
            },
          },
        }),
      ],
    })
      .overrideProvider(MetricService)
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

  it('registers api request and response metrics with dynamic attributes when has callback', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [
        OpenTelemetryModule.forRoot({
          metrics: {
            apiMetrics: {
              enable: true,
              dynamicAttributes: () => ({ dynamicLabel: 'dynamicLabelValue' }),
            },
          },
        }),
      ],
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
    const { text } = await request(promExporter._server).get('/metrics').expect(200);

    expect(
      /http_server_request_count_total{[^}]*path="\/example\/:id"[^}]*dynamicLabel="dynamicLabelValue"[^}]*} 1/.test(
        text
      )
    ).toBeTruthy();
    expect(
      /http_server_response_count_total{[^}]*path="\/example\/:id"[^}]*dynamicLabel="dynamicLabelValue"[^}]*} 1/.test(
        text
      )
    ).toBeTruthy();
  });

  it('uses custom buckets when provided', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [
        OpenTelemetryModule.forRoot({
          metrics: {
            apiMetrics: {
              enable: true,
            },
          },
        }),
      ],
    })
      .overrideProvider(MetricService)
      .useValue(metricService)
      .compile();

    app = testingModule.createNestApplication();
    await app.init();

    expect(metricService.getHistogram).toHaveBeenCalledWith('http.server.duration', {
      description: 'The duration of the inbound HTTP request',
      unit: 'ms',
    });
  });

  it('uses prefix when provided', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [
        OpenTelemetryModule.forRoot({
          metrics: {
            apiMetrics: {
              enable: true,
              prefix: 'test_prefix',
            },
          },
        }),
      ],
    })
      .overrideProvider(MetricService)
      .useValue(metricService)
      .compile();

    app = testingModule.createNestApplication();
    await app.init();

    expect(metricService.getCounter).toHaveBeenCalledWith(
      'http.server.request.count',
      expect.objectContaining({
        prefix: 'test_prefix',
      })
    );

    expect(metricService.getCounter).toHaveBeenCalledWith(
      'http.server.response.count',
      expect.objectContaining({
        prefix: 'test_prefix',
      })
    );

    expect(metricService.getCounter).toHaveBeenCalledWith(
      'http.server.abort.count',
      expect.objectContaining({
        prefix: 'test_prefix',
      })
    );

    expect(metricService.getHistogram).toHaveBeenCalledWith(
      'http.server.duration',
      expect.objectContaining({
        prefix: 'test_prefix',
      })
    );

    expect(metricService.getHistogram).toHaveBeenCalledWith(
      'http.server.request.size',
      expect.objectContaining({
        prefix: 'test_prefix',
      })
    );

    expect(metricService.getHistogram).toHaveBeenCalledWith(
      'http.server.response.size',
      expect.objectContaining({
        prefix: 'test_prefix',
      })
    );

    expect(metricService.getCounter).toHaveBeenCalledWith(
      'http.server.response.success.count',
      expect.objectContaining({
        prefix: 'test_prefix',
      })
    );

    expect(metricService.getCounter).toHaveBeenCalledWith(
      'http.server.response.error.count',
      expect.objectContaining({
        prefix: 'test_prefix',
      })
    );

    expect(metricService.getCounter).toHaveBeenCalledWith(
      'http.client.request.error.count',
      expect.objectContaining({
        prefix: 'test_prefix',
      })
    );
  });

  describe('metric: http.server.request.count', () => {
    it('succesfully request records', async () => {
      const testingModule = await Test.createTestingModule({
        imports: [
          OpenTelemetryModule.forRoot({
            metrics: {
              apiMetrics: {
                enable: true,
              },
            },
          }),
        ],
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
      const { text } = await request(promExporter._server).get('/metrics').expect(200);
      expect(
        /http_server_request_count_total{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)
      ).toBeTruthy();
    });

    // TODO: Fastify should remove path param and replace it with `:id`
    it.skip('registers successful request records when using Fastify', async () => {
      const testingModule = await Test.createTestingModule({
        imports: [
          OpenTelemetryModule.forRoot({
            metrics: {
              apiMetrics: {
                enable: true,
              },
            },
          }),
        ],
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
      const { text } = await request(promExporter._server).get('/metrics').expect(200);

      expect(
        /http_server_request_count_total{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)
      ).toBeTruthy();
    });
  });

  describe('metric: http.server.response.count', () => {
    it('succesfully request records', async () => {
      const testingModule = await Test.createTestingModule({
        imports: [
          OpenTelemetryModule.forRoot({
            metrics: {
              apiMetrics: {
                enable: true,
              },
            },
          }),
        ],
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
      const { text } = await request(promExporter._server).get('/metrics').expect(200);
      expect(
        /http_server_response_count_total{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)
      ).toBeTruthy();
    });

    // TODO: Fastify should remove path param and replace it with `:id`
    it.skip('registers successful request records when using Fastify', async () => {
      const testingModule = await Test.createTestingModule({
        imports: [
          OpenTelemetryModule.forRoot({
            metrics: {
              apiMetrics: {
                enable: true,
              },
            },
          }),
        ],
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
      const { text } = await request(promExporter._server).get('/metrics').expect(200);

      expect(
        /http_server_response_count_total{[^}]*path="\/example\/:id"[^}]*} 1/.test(text)
      ).toBeTruthy();
    });
  });

  describe('metric: http.server.abort.count', () => {});

  describe('metric: http.server.duration', () => {});

  describe('metric: http.server.request.size', () => {});

  describe('metric: http.server.response.size', () => {});

  describe('metric: http.server.response.success.count', () => {});

  describe('metric: http.server.response.error.count', () => {
    it('succesfully request records', async () => {
      const testingModule = await Test.createTestingModule({
        imports: [
          OpenTelemetryModule.forRoot({
            metrics: {
              apiMetrics: {
                enable: true,
              },
            },
          }),
        ],
        controllers: [AppController],
      }).compile();

      app = testingModule.createNestApplication();
      app.useLogger(false);

      await app.init();

      const agent = request(app.getHttpServer());
      await agent.get('/example/internal-error');

      // Workaround for delay of metrics going to prometheus
      await new Promise(resolve => setTimeout(resolve, 200));

      // TODO: OpenTelemetry exporter does not expose server in a public function.
      // @ts-ignore
      const { text } = await request(promExporter._server).get('/metrics').expect(200);

      expect(/http_server_response_error_count_total 1/.test(text)).toBeTruthy();
    });

    it('succesfully request records when using Fastify', async () => {
      const testingModule = await Test.createTestingModule({
        imports: [
          OpenTelemetryModule.forRoot({
            metrics: {
              apiMetrics: {
                enable: true,
              },
            },
          }),
        ],
        controllers: [AppController],
      }).compile();

      app = testingModule.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
      app.useLogger(false);

      await app.init();
      await app.getHttpAdapter().getInstance().ready();

      const agent = request(app.getHttpServer());
      await agent.get('/example/internal-error');

      // Workaround for delay of metrics going to prometheus
      await new Promise(resolve => setTimeout(resolve, 200));

      // TODO: OpenTelemetry exporter does not expose server in a public function.
      // @ts-ignore
      const { text } = await request(promExporter._server).get('/metrics').expect(200);

      expect(/http_server_response_error_count_total 1/.test(text)).toBeTruthy();
    });
  });

  describe('metric: http.client.request.error.count', () => {
    it('succesfully request records', async () => {
      const testingModule = await Test.createTestingModule({
        imports: [
          OpenTelemetryModule.forRoot({
            metrics: {
              apiMetrics: {
                enable: true,
              },
            },
          }),
        ],
        controllers: [AppController],
      }).compile();

      app = testingModule.createNestApplication();
      await app.init();

      const agent = request(app.getHttpServer());
      await agent.get('/example/4/invalid-route?foo=bar');

      // Workaround for delay of metrics going to prometheus
      await new Promise(resolve => setTimeout(resolve, 200));

      // TODO: OpenTelemetry exporter does not expose server in a public function.
      // @ts-ignore
      const { text } = await request(promExporter._server).get('/metrics').expect(200);

      expect(/http_client_request_error_count_total 1/.test(text)).toBeTruthy();
    });

    it('succesfully request records when using Fastify', async () => {
      const testingModule = await Test.createTestingModule({
        imports: [
          OpenTelemetryModule.forRoot({
            metrics: {
              apiMetrics: {
                enable: true,
              },
            },
          }),
        ],
        controllers: [AppController],
      }).compile();

      app = testingModule.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
      await app.init();
      await app.getHttpAdapter().getInstance().ready();

      const agent = request(app.getHttpServer());
      await agent.get('/example/4/invalid-route?foo=bar');

      // Workaround for delay of metrics going to prometheus
      await new Promise(resolve => setTimeout(resolve, 200));

      // TODO: OpenTelemetry exporter does not expose server in a public function.
      // @ts-ignore
      const { text } = await request(promExporter._server).get('/metrics').expect(200);

      expect(/http_client_request_error_count_total 1/.test(text)).toBeTruthy();
    });
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
