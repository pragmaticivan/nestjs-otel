import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import request from "supertest";
import { OpenTelemetryModule } from "../../../../src";
import { AppController } from "../../../fixture-app/app.controller";
import {
  setupPrometheusExporter,
  teardownPrometheusExporter,
} from "../../../utils";

describe("Common Decorators", () => {
  let app: INestApplication;
  let exporter: PrometheusExporter;

  beforeEach(async () => {
    ({ exporter } = await setupPrometheusExporter());
    const testingModule = await Test.createTestingModule({
      imports: [OpenTelemetryModule.forRoot({})],
      controllers: [AppController],
    }).compile();

    app = testingModule.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await teardownPrometheusExporter(exporter);
    if (app) {
      await app.close();
    }
  });

  describe("Instance counter, method counter & param counter", () => {
    it("creates an instance counter and increase counter when new instance is created", async () => {
      const agent = request(app.getHttpServer());
      await agent.get("/example/4?foo=bar");

      const { text } = await request(
        exporter.getMetricsRequestHandler.bind(exporter)
      )
        .get("/metrics")
        .expect(200);

      expect(/app_AppController_instances_total 1/.test(text)).toBeTruthy();
      expect(/app_AppController_example_calls_total 1/.test(text)).toBeTruthy();

      expect(
        /# HELP example_counter_total An example counter/.test(text)
      ).toBeTruthy();
      expect(/example_counter_total 1/.test(text)).toBeTruthy();

      expect(/# HELP example_gauge An example gauge/.test(text)).toBeTruthy();
      expect(/example_gauge 5/.test(text)).toBeTruthy();

      expect(
        /# HELP example_up_down An example up-down counter/.test(text)
      ).toBeTruthy();
      expect(/example_up_down 2/.test(text)).toBeTruthy();

      expect(
        /# HELP example_histogram An example histogram/.test(text)
      ).toBeTruthy();
      expect(/example_histogram_count 1/.test(text)).toBeTruthy();
      expect(/example_histogram_sum 8/.test(text)).toBeTruthy();
      expect(/example_histogram_bucket{le="5"} 0/.test(text)).toBeTruthy();
      expect(/example_histogram_bucket{le="10"} 1/.test(text)).toBeTruthy();
    });
  });
});
