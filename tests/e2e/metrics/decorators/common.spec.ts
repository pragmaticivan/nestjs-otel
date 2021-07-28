import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { metrics } from '@opentelemetry/api-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { NodeSDK } from '@opentelemetry/sdk-node';
import * as request from 'supertest';
import { OpenTelemetryModule } from '../../../../src';
import { meterData } from '../../../../src/metrics/metric-data';
import { AppController } from '../../../fixture-app/app.controller';

describe('Common Decorators', () => {
  let app: INestApplication;
  let exporter: PrometheusExporter;
  let otelSDK: NodeSDK;

  beforeEach(async () => {
    exporter = new PrometheusExporter({
      preventServerStart: true,
    });

    otelSDK = new NodeSDK({
      metricExporter: exporter,
      metricInterval: 100,
    });

    await otelSDK.start();
    await exporter.startServer();
  });

  describe('Instance counter & Method counter', () => {
    it('creates an instance counter and increase counter when new instance is created', async () => {
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
      const { text } = await request(exporter._server)
        .get('/metrics')
        .expect(200);
      expect(/app_AppController_instances_total 1/.test(text)).toBeTruthy();
      expect(/app_AppController_example_calls_total 1/.test(text)).toBeTruthy();
    });
  });

  afterEach(async () => {
    metrics.disable();
    meterData.clear();
    if (exporter) {
      await exporter.stopServer();
    }
    if (otelSDK) {
      await otelSDK.shutdown();
    }
    if (app) {
      await app.close();
    }
  });
});
