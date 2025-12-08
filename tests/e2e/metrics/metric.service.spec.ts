import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { metrics } from "@opentelemetry/api";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { MeterProvider } from "@opentelemetry/sdk-metrics";
import { MetricService } from "../../../src/metrics/metric.service";
import { meterData } from "../../../src/metrics/metric-data";
import { OpenTelemetryModule } from "../../../src/opentelemetry.module";

describe("MetricService", () => {
  let metricService: MetricService;
  let app: INestApplication;
  let exporter: PrometheusExporter;
  let meterProvider: MeterProvider;

  beforeEach((done) => {
    exporter = new PrometheusExporter({}, () => {
      meterProvider = new MeterProvider({
        readers: [exporter],
      });
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

  describe("instance", () => {
    it("creates a new metricService instance", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot()],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      metricService = moduleRef.get<MetricService>(MetricService);
      expect(metricService).toBeDefined();
    });

    it("creates an empty meterData", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot()],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      expect(meterData.size).toBe(0);
    });
  });

  describe("getCounter", () => {
    it("creates a new counter on meterData on the first time method is called", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot({})],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      metricService = moduleRef.get<MetricService>(MetricService);
      // Starts empty
      expect(meterData.size).toBe(0);

      const counter = metricService.getCounter("test1");
      counter.add(1);

      // Has new key record
      const data = meterData;
      expect(data.has("test1")).toBeTruthy();
    });

    it("reuses an existing counter on meterData when method is called twice", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot({})],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      metricService = moduleRef.get<MetricService>(MetricService);

      const counter = metricService.getCounter("test1", {
        description: "test1 description",
      });
      counter.add(1);

      const existingCounter = metricService.getCounter("test1");

      expect(meterData.has("test1")).toBeTruthy();
      // TODO: The metric class does not expose current description
      // @ts-expect-error
      expect(existingCounter._descriptor.description).toBe("test1 description");
    });

    it("uses prefix when provided", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot({})],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      metricService = moduleRef.get<MetricService>(MetricService);
      // Starts empty
      expect(meterData.size).toBe(0);

      const counter = metricService.getCounter("test1", {
        prefix: "test_prefix",
      });
      counter.add(1);

      // Has new key record
      const data = meterData;
      expect(data.has("test_prefix.test1")).toBeTruthy();
    });
  });

  describe("getUpDownCounter", () => {
    it("creates a new upDownCounter on meterData on the first time method is called", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot({})],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      metricService = moduleRef.get<MetricService>(MetricService);
      // Starts empty
      expect(meterData.size).toBe(0);

      const counter = metricService.getUpDownCounter("test1");
      counter.add(1);

      // Has new key record
      const data = meterData;
      expect(data.has("test1")).toBeTruthy();
    });

    it("reuses an existing upDownCounter on meterData when method is called twice", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot({})],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      metricService = moduleRef.get<MetricService>(MetricService);

      const counter = metricService.getUpDownCounter("test1", {
        description: "test1 description",
      });
      counter.add(1);

      const existingCounter = metricService.getUpDownCounter("test1");
      expect(meterData.has("test1")).toBeTruthy();

      // TODO: The metric class does not expose current description
      // @ts-expect-error
      expect(existingCounter._descriptor.description).toBe("test1 description");
    });

    it("uses prefix when provided", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot({})],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      metricService = moduleRef.get<MetricService>(MetricService);
      // Starts empty
      expect(meterData.size).toBe(0);

      const counter = metricService.getUpDownCounter("test1", {
        prefix: "test_prefix",
      });
      counter.add(1);

      // Has new key record
      const data = meterData;
      expect(data.has("test_prefix.test1")).toBeTruthy();
    });
  });

  describe("getHistogram", () => {
    it("creates a new histogram on meterData on the first time method is called", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot({})],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      metricService = moduleRef.get<MetricService>(MetricService);
      // Starts empty
      expect(meterData.size).toBe(0);

      metricService.getHistogram("test1");

      // Has new key record
      const data = meterData;
      expect(data.has("test1")).toBeTruthy();
    });

    it("reuses an existing histogram on meterData when method is called twice", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot({})],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      metricService = moduleRef.get<MetricService>(MetricService);

      metricService.getHistogram("test1", { description: "test1 description" });

      const existingCounter = metricService.getHistogram("test1");
      expect(meterData.has("test1")).toBeTruthy();

      // TODO: The metric class does not expose current description
      // @ts-expect-error
      expect(existingCounter._descriptor.description).toBe("test1 description");
    });

    it("uses prefix when provided", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot({})],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      metricService = moduleRef.get<MetricService>(MetricService);
      // Starts empty
      expect(meterData.size).toBe(0);

      metricService.getHistogram("test1", { prefix: "test_prefix" });

      // Has new key record
      const data = meterData;
      expect(data.has("test_prefix.test1")).toBeTruthy();
    });
  });

  describe("getGauge", () => {
    it("creates a new gauge on meterData on the first time method is called", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot({})],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      metricService = moduleRef.get<MetricService>(MetricService);
      // Starts empty
      expect(meterData.size).toBe(0);

      const gauge = metricService.getGauge("test1");
      gauge.record(2);

      // Has new key record
      const data = meterData;
      expect(data.has("test1")).toBeTruthy();
    });

    it("reuses an existing gauge on meterData when method is called twice", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot({})],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      metricService = moduleRef.get<MetricService>(MetricService);

      const counter = metricService.getGauge("test1", {
        description: "test1 description",
      });
      counter.record(1);

      const existingCounter = metricService.getGauge("test1");

      expect(meterData.has("test1")).toBeTruthy();
      // TODO: The metric class does not expose current description
      // @ts-expect-error
      expect(existingCounter._descriptor.description).toBe("test1 description");
    });

    it("uses prefix when provided", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenTelemetryModule.forRoot({})],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      metricService = moduleRef.get<MetricService>(MetricService);
      // Starts empty
      expect(meterData.size).toBe(0);

      const counter = metricService.getGauge("test1", {
        prefix: "test_prefix",
      });
      counter.record(1);

      // Has new key record
      const data = meterData;
      expect(data.has("test_prefix.test1")).toBeTruthy();
    });
  });
});
