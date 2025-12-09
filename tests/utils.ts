import type {
  DynamicModule,
  INestApplication,
  LoggerService,
} from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { metrics } from "@opentelemetry/api";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { MeterProvider } from "@opentelemetry/sdk-metrics";
import request from "supertest";
import type TestAgent from "supertest/lib/agent";
import { meterData } from "../src/metrics/metric-data";

export type App = INestApplication;

export type TestHarness = {
  testingModule: TestingModule;
  app: App;
  agent: TestAgent<request.Test>;
};

export async function createOpenTelemetryModule(
  module: DynamicModule
): Promise<TestHarness> {
  const testingModule = await Test.createTestingModule({
    imports: [module],
  }).compile();

  const app = testingModule.createNestApplication();
  await app.init();

  const agent = request(app.getHttpServer());

  return {
    testingModule,
    app,
    agent,
  };
}

export async function setupPrometheusExporter(): Promise<{
  exporter: PrometheusExporter;
  meterProvider: MeterProvider;
}> {
  const exporter = new PrometheusExporter({
    preventServerStart: true,
  });
  const meterProvider = new MeterProvider({
    readers: [exporter],
  });
  metrics.setGlobalMeterProvider(meterProvider);
  return { exporter, meterProvider };
}

export async function teardownPrometheusExporter(
  exporter: PrometheusExporter
): Promise<void> {
  metrics.disable();
  meterData.clear();
  if (exporter) {
    await exporter.shutdown();
  }
}

export class EmptyLogger implements LoggerService {
  log(_message: string): any {}

  error(_message: string, _trace: string): any {}

  warn(_message: string): any {}

  debug(_message: string): any {}

  verbose(_message: string): any {}
}
