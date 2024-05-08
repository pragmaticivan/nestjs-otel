import { DynamicModule, INestApplication, LoggerService } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import TestAgent from 'supertest/lib/agent';

export type App = INestApplication;

export interface TestHarness {
  testingModule: TestingModule;
  app: App;
  agent: TestAgent<request.Test>;
}

export async function createOpenTelemetryModule(module: DynamicModule): Promise<TestHarness> {
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
  log(message: string): any {}

  error(message: string, trace: string): any {}

  warn(message: string): any {}

  debug(message: string): any {}

  verbose(message: string): any {}
}
