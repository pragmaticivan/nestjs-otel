import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { metrics } from '@opentelemetry/api';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import request from 'supertest';
import { OpenTelemetryModule } from '../../../../src';
import { meterData } from '../../../../src/metrics/metric-data';
import { AppController } from '../../../fixture-app/app.controller';

describe('Common Decorators', () => {
  let app: INestApplication;
  let exporter: PrometheusExporter;
  let meterProvider: MeterProvider;

  beforeEach(done => {
    exporter = new PrometheusExporter({}, () => {
      meterProvider = new MeterProvider();
      meterProvider.addMetricReader(exporter);
      metrics.setGlobalMeterProvider(meterProvider);
      done();
    });
  });

  afterEach(async () => {
    metrics.disable();
    meterData.clear();
    if (exporter) {
      await exporter.stopServer();
      await exporter.shutdown();
    }
    if (app) {
      await app.close();
    }
  });

  describe('Instance counter & Method counter', () => {
    it('creates an instance counter and increase counter when new instance is created', async () => {
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

      // TODO: OpenTelemetry exporter does not expose server in a public function.
      // @ts-ignore
      const { text } = await request(exporter._server).get('/metrics').expect(200);

      expect(/app_AppController_instances_total 1/.test(text)).toBeTruthy();
      expect(/app_AppController_example_calls_total 1/.test(text)).toBeTruthy();
    });
  });
});
