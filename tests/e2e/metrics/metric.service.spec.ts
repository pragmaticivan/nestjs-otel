import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { metrics } from '@opentelemetry/api-metrics';
import { OpenTelemetryModule } from '../../../src/opentelemetry.module';
import { meterData } from '../../../src/metrics/metric-data';
import { MetricService } from '../../../src/metrics/metric.service';

describe('MetricService', () => {
  let metricService: MetricService;
  let app: INestApplication;
  let exporter: PrometheusExporter;
  let otelSDK: NodeSDK;

  beforeEach(async () => {
    exporter = new PrometheusExporter({
      preventServerStart: true,
    });

    otelSDK = new NodeSDK({
      metricReader: exporter,
    });

    await otelSDK.start();
    meterData.clear();
  });

  describe('instance', () => {
    it('creates a new metricService instance', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot()],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      metricService = moduleRef.get<MetricService>(MetricService);
      expect(metricService).toBeDefined();
    });

    it('creates an empty meterData', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot()],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      expect(meterData.size).toBe(0);
    });
  });

  describe('getCounter', () => {
    it('creates a new counter on meterData on the first time method is called', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot({
          metrics: {
            apiMetrics: {
              enable: false,
            },
          },
        })],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      metricService = moduleRef.get<MetricService>(MetricService);
      // Starts empty
      expect(meterData.size).toBe(0);

      const counter = metricService.getCounter('test1');
      counter.add(1);

      // Has new key record
      const data = meterData;
      expect(data.has('test1')).toBeTruthy();
    });

    it('reuses an existing counter on meterData when method is called twice', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot({
          metrics: {
            apiMetrics: {
              enable: false,
            },
          },
        })],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      metricService = moduleRef.get<MetricService>(MetricService);

      const counter = metricService.getCounter('test1', { description: 'test1 description' });
      counter.add(1);

      const existingCounter = metricService.getCounter('test1');

      expect(meterData.has('test1')).toBeTruthy();
      // TODO: The metric class does not expose current description
      // @ts-ignore
      // eslint-disable-next-line no-underscore-dangle
      expect(existingCounter._descriptor.description).toBe('test1 description');
    });
  });

  describe('getUpDownCounter', () => {
    it('creates a new upDownCounter on meterData on the first time method is called', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot({
          metrics: {
            apiMetrics: {
              enable: false,
            },
          },
        })],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      metricService = moduleRef.get<MetricService>(MetricService);
      // Starts empty
      expect(meterData.size).toBe(0);

      const counter = metricService.getUpDownCounter('test1');
      counter.add(1);

      // Has new key record
      const data = meterData;
      expect(data.has('test1')).toBeTruthy();
    });

    it('reuses an existing upDownCounter on meterData when method is called twice', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot({
          metrics: {
            apiMetrics: {
              enable: false,
            },
          },
        })],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      metricService = moduleRef.get<MetricService>(MetricService);

      const counter = metricService.getUpDownCounter('test1', { description: 'test1 description' });
      counter.add(1);

      const existingCounter = metricService.getUpDownCounter('test1');
      expect(meterData.has('test1')).toBeTruthy();

      // TODO: The metric class does not expose current description
      // @ts-ignore
      // eslint-disable-next-line no-underscore-dangle
      expect(existingCounter._descriptor.description).toBe('test1 description');
    });
  });

  describe('getHistogram', () => {
    it('creates a new histogram on meterData on the first time method is called', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot({
          metrics: {
            apiMetrics: {
              enable: false,
            },
          },
        })],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      metricService = moduleRef.get<MetricService>(MetricService);
      // Starts empty
      expect(meterData.size).toBe(0);

      const counter = metricService.getHistogram('test1');
      // counter.clear();

      // Has new key record
      const data = meterData;
      expect(data.has('test1')).toBeTruthy();
    });

    it('reuses an existing histogram on meterData when method is called twice', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot({
          metrics: {
            apiMetrics: {
              enable: false,
            },
          },
        })],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      metricService = moduleRef.get<MetricService>(MetricService);

      const counter = metricService.getHistogram('test1', { description: 'test1 description' });
      // counter.clear();

      const existingCounter = metricService.getHistogram('test1');
      expect(meterData.has('test1')).toBeTruthy();

      // TODO: The metric class does not expose current description
      // @ts-ignore
      // eslint-disable-next-line no-underscore-dangle
      expect(existingCounter._descriptor.description).toBe('test1 description');
    });
  });

  afterEach(async () => {
    metrics.disable();
    if (otelSDK) {
      await otelSDK.shutdown();
    }
    if (app) {
      await app.close();
    }
  });
});
