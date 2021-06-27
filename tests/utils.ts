import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { OpenTelemetryModule } from '../src';
import { OpenTelemetryModuleOptions } from '../src/interfaces';

export type Agent = request.SuperTest<request.Test>;
export type App = INestApplication;

export interface TestHarness {
  testingModule: TestingModule;
  app: App;
  agent: Agent;
}

export async function createOpenTelemetryModule(
  options?: OpenTelemetryModuleOptions,
): Promise<TestHarness> {
  const testingModule = await Test.createTestingModule({
    imports: [OpenTelemetryModule.register(options)],
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
