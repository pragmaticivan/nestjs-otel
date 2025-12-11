import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { MetricService } from "../../../src/metrics/metric.service";
import { meterData } from "../../../src/metrics/metric-data";
import { OpenTelemetryModule } from "../../../src/opentelemetry.module";
import {
  setupPrometheusExporter,
  teardownPrometheusExporter,
} from "../../utils";

describe("MetricService", () => {
  let metricService: MetricService;
  let app: INestApplication;
  let exporter: PrometheusExporter;

  beforeEach(async () => {
    ({ exporter } = await setupPrometheusExporter());
    const moduleRef = await Test.createTestingModule({
      imports: [OpenTelemetryModule.forRoot({})],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    metricService = moduleRef.get<MetricService>(MetricService);
  });

  afterEach(async () => {
    await teardownPrometheusExporter(exporter);
    if (app) {
      await app.close();
    }
  });

  describe("instance", () => {
    it("creates a new metricService instance", async () => {
      expect(metricService).toBeDefined();
    });

    it("creates an empty meterData", async () => {
      expect(meterData.size).toBe(0);
    });
  });

  describe("getCounter", () => {
    it("creates a new counter on meterData on the first time method is called", async () => {
      // Starts empty
      expect(meterData.size).toBe(0);

      const counter = metricService.getCounter("test1");
      counter.add(1);

      // Has new key record
      const data = meterData;
      expect(data.has("test1")).toBeTruthy();
    });

    it("reuses an existing counter on meterData when method is called twice", async () => {
      const counter = metricService.getCounter("test1", {
        description: "test1 description",
      });
      counter.add(1);

      metricService.getCounter("test1");

      expect(meterData.has("test1")).toBeTruthy();

      const collectionResult = await exporter.collect();
      const metric =
        collectionResult.resourceMetrics.scopeMetrics[0].metrics.find(
          (m) => m.descriptor.name === "test1"
        );
      expect(metric?.descriptor.description).toBe("test1 description");
    });

    it("uses prefix when provided", async () => {
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
      // Starts empty
      expect(meterData.size).toBe(0);

      const counter = metricService.getUpDownCounter("test1");
      counter.add(1);

      // Has new key record
      const data = meterData;
      expect(data.has("test1")).toBeTruthy();
    });

    it("reuses an existing upDownCounter on meterData when method is called twice", async () => {
      const counter = metricService.getUpDownCounter("test1", {
        description: "test1 description",
      });
      counter.add(1);

      metricService.getUpDownCounter("test1");
      expect(meterData.has("test1")).toBeTruthy();

      const collectionResult = await exporter.collect();
      const metric =
        collectionResult.resourceMetrics.scopeMetrics[0].metrics.find(
          (m) => m.descriptor.name === "test1"
        );
      expect(metric?.descriptor.description).toBe("test1 description");
    });

    it("uses prefix when provided", async () => {
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
      // Starts empty
      expect(meterData.size).toBe(0);

      metricService.getHistogram("test1");

      // Has new key record
      const data = meterData;
      expect(data.has("test1")).toBeTruthy();
    });

    it("reuses an existing histogram on meterData when method is called twice", async () => {
      const histogram = metricService.getHistogram("test1", {
        description: "test1 description",
      });
      histogram.record(1);

      metricService.getHistogram("test1");
      expect(meterData.has("test1")).toBeTruthy();

      const collectionResult = await exporter.collect();
      const metric =
        collectionResult.resourceMetrics.scopeMetrics[0].metrics.find(
          (m) => m.descriptor.name === "test1"
        );
      expect(metric?.descriptor.description).toBe("test1 description");
    });

    it("uses prefix when provided", async () => {
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
      // Starts empty
      expect(meterData.size).toBe(0);

      const gauge = metricService.getGauge("test1");
      gauge.record(2);

      // Has new key record
      const data = meterData;
      expect(data.has("test1")).toBeTruthy();
    });

    it("reuses an existing gauge on meterData when method is called twice", async () => {
      const gauge = metricService.getGauge("test1", {
        description: "test1 description",
      });
      gauge.record(1);

      metricService.getGauge("test1");

      expect(meterData.has("test1")).toBeTruthy();

      const collectionResult = await exporter.collect();
      const metric =
        collectionResult.resourceMetrics.scopeMetrics[0].metrics.find(
          (m) => m.descriptor.name === "test1"
        );
      expect(metric?.descriptor.description).toBe("test1 description");
    });

    it("uses prefix when provided", async () => {
      // Starts empty
      expect(meterData.size).toBe(0);

      const gauge = metricService.getGauge("test1", {
        prefix: "test_prefix",
      });
      gauge.record(1);

      // Has new key record
      const data = meterData;
      expect(data.has("test_prefix.test1")).toBeTruthy();
    });
  });
});
