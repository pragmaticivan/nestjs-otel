import type {
  DynamicModule,
  INestApplication,
  LoggerService,
} from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";
import type TestAgent from "supertest/lib/agent";

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

export class EmptyLogger implements LoggerService {
  log(_message: string): any {}

  error(_message: string, _trace: string): any {}

  warn(_message: string): any {}

  debug(_message: string): any {}

  verbose(_message: string): any {}
}
