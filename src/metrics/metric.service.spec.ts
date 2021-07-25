import { Test } from '@nestjs/testing';
import { OpenTelemetryModule } from '../opentelemetry.module';
import { MetricService } from './metric.service';

describe('MetricService', () => {
  let metricService: MetricService;

  describe('instance', () => {
    it('creates a new metricService instance', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot()],
      }).compile();

      metricService = moduleRef.get<MetricService>(MetricService);

      expect(metricService).toBeDefined();
    });

    it('creates a meter when new instance is created', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot()],
      }).compile();

      metricService = moduleRef.get<MetricService>(MetricService);
      expect(metricService.getMeter()).toBeDefined();
    });

    it('creates an empty meterData', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot()],
      }).compile();

      metricService = moduleRef.get<MetricService>(MetricService);
      expect(metricService.getMeterData().size).toBe(0);
    });

    it('reuses a meterData set when metricService is called twice', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot()],
      }).compile();

      metricService = moduleRef.get<MetricService>(MetricService);
      const currentMeterData = metricService.getMeterData();

      const newMetricService = moduleRef.get<MetricService>(MetricService);
      expect(currentMeterData).toBe(newMetricService.getMeterData());
    });
  });

  describe('getCounter', () => {
    it('creates a new counter on meterData on the first time method is called', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot()],
      }).compile();

      metricService = moduleRef.get<MetricService>(MetricService);
      // Starts empty
      expect(metricService.getMeterData().size).toBe(0);

      const counter = metricService.getCounter('test1');
      counter.add(1);

      // Has new key record
      const data = metricService.getMeterData();
      expect(data.has('test1')).toBeTruthy();
    });
    it('reuses an existing counter on meterData when method is called twice', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot()],
      }).compile();

      metricService = moduleRef.get<MetricService>(MetricService);

      const counter = metricService.getCounter('test1', { description: 'test1 description' });
      counter.add(1);

      const existingCounter = metricService.getCounter('test1');
      expect(metricService.getMeterData().has('test1')).toBeTruthy();

      // TODO: The metric class does not expose current description
      // @ts-ignore
      // eslint-disable-next-line no-underscore-dangle
      expect(existingCounter._options.description).toBe('test1 description');
    });
  });

  describe('getUpDownCounter', () => {
    it('creates a new upDownCounter on meterData on the first time method is called', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot()],
      }).compile();

      metricService = moduleRef.get<MetricService>(MetricService);
      // Starts empty
      expect(metricService.getMeterData().size).toBe(0);

      const counter = metricService.getUpDownCounter('test1');
      counter.add(1);

      // Has new key record
      const data = metricService.getMeterData();
      expect(data.has('test1')).toBeTruthy();
    });
    it('reuses an existing upDownCounter on meterData when method is called twice', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot()],
      }).compile();

      metricService = moduleRef.get<MetricService>(MetricService);

      const counter = metricService.getUpDownCounter('test1', { description: 'test1 description' });
      counter.add(1);

      const existingCounter = metricService.getUpDownCounter('test1');
      expect(metricService.getMeterData().has('test1')).toBeTruthy();

      // TODO: The metric class does not expose current description
      // @ts-ignore
      // eslint-disable-next-line no-underscore-dangle
      expect(existingCounter._options.description).toBe('test1 description');
    });
  });

  describe('getValueRecorder', () => {
    it('creates a new valueRecorder on meterData on the first time method is called', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot()],
      }).compile();

      metricService = moduleRef.get<MetricService>(MetricService);
      // Starts empty
      expect(metricService.getMeterData().size).toBe(0);

      const counter = metricService.getValueRecorder('test1');
      counter.clear();

      // Has new key record
      const data = metricService.getMeterData();
      expect(data.has('test1')).toBeTruthy();
    });
    it('reuses an existing valueRecorder on meterData when method is called twice', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot()],
      }).compile();

      metricService = moduleRef.get<MetricService>(MetricService);

      const counter = metricService.getValueRecorder('test1', { description: 'test1 description' });
      counter.clear();

      const existingCounter = metricService.getValueRecorder('test1');
      expect(metricService.getMeterData().has('test1')).toBeTruthy();

      // TODO: The metric class does not expose current description
      // @ts-ignore
      // eslint-disable-next-line no-underscore-dangle
      expect(existingCounter._options.description).toBe('test1 description');
    });
  });
});
