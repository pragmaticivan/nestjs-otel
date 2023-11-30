import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { ValueType, metrics } from '@opentelemetry/api';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { MetricService, OpenTelemetryModule } from '../../../src';
import { AppController } from '../../fixture-app/app.controller';
import { meterData } from '../../../src/metrics/metric-data';

describe('Api Metrics Middleware', () => {
  let app: INestApplication;
  const metricService = {
    getCounter: jest.fn(),
    getUpDownCounter: jest.fn(),
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

    expect(metricService.getCounter).not.toHaveBeenCalled();
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

    expect(metricService.getUpDownCounter).toHaveBeenCalledWith('http.server.active_requests', {
      description: 'Total number of active requests',
      unit: 'requests',
      valueType: ValueType.INT,
    });
    expect(metricService.getHistogram).toHaveBeenCalledTimes(2);
  });

  describe('metric: http.server.active_requests', () => {
    it('succesfully request records', async () => {
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

      const metric = (await promExporter.collect()).resourceMetrics.scopeMetrics[0].metrics.find(el => {
        return el.descriptor.name === 'http.server.active_requests'
      })
      expect(metric?.dataPoints[0].attributes).toEqual({
        'http.scheme': 'http',
        'http.method': 'GET',
        'server.address': expect.any(String),
        'server.port': expect.any(Number),
      });
      expect(metric?.dataPoints[0].value).toEqual(0);
    });
  });

  describe.only('metric: http.server.request.body.size', () => {
    it('succesfully request records', async () => {
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

      await request(app.getHttpServer()).get('/example/4?foo=bar').expect(200);

      const metric = (await promExporter.collect()).resourceMetrics.scopeMetrics[0].metrics.find(el => {
        return el.descriptor.name === 'http.server.request.body.size'
      })

      expect(metric?.dataPoints[0].attributes).toEqual({
        'http.scheme': 'http',
        'http.method': 'GET',
        'server.address': expect.any(String),
        'server.port': expect.any(Number),
        'http.response.status_code': 200,
        'http.route': '/example/:id',
        'network.protocol.name': 'http',
        'network.protocol.version': '1.1'
      });
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
