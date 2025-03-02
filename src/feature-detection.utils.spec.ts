import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  detectHttpAdapterTypeAndVersion,
  ExpressVersion,
  FastifyVersion,
  HttpAdapterType,
} from './feature-detection.utils';

function useNest10() {
  jest.mock('@nestjs/testing', () => jest.requireActual('@nestjs/testing10'));
  jest.mock('@nestjs/common', () => jest.requireActual('@nestjs/common10'));
  jest.mock('@nestjs/core', () => jest.requireActual('@nestjs/core10'));
  jest.mock('@nestjs/platform-express', () => jest.requireActual('@nestjs/platform-express10'));
  jest.mock('@nestjs/platform-fastify', () => jest.requireActual('@nestjs/platform-fastify10'));
}

function useNest11() {
  jest.unmock('@nestjs/testing');
  jest.unmock('@nestjs/common');
  jest.unmock('@nestjs/core');
  jest.unmock('@nestjs/platform-express');
  jest.unmock('@nestjs/platform-fastify');
}

describe('FeatureDetectionUtils', () => {
  describe('When using Express adapter', () => {
    async function getExpressApp() {
      const { Module } = await import('@nestjs/common');
      const { Test } = await import('@nestjs/testing');

      @Module({})
      class TestModule {}

      const module = await Test.createTestingModule({
        imports: [TestModule],
      }).compile();
      return module.createNestApplication();
    }

    it('should detect Express version 4 on Nest 10', async () => {
      useNest10();

      const app = await getExpressApp();
      const features = detectHttpAdapterTypeAndVersion(app.getHttpAdapter());
      expect(features).toEqual({
        adapterType: HttpAdapterType.EXPRESS,
        version: ExpressVersion.V4,
      });
    });
    it('should detect Express version 5 on Nest 11', async () => {
      useNest11();
      const app = await getExpressApp();
      const features = detectHttpAdapterTypeAndVersion(app.getHttpAdapter());
      expect(features).toEqual({
        adapterType: HttpAdapterType.EXPRESS,
        version: ExpressVersion.V5,
      });
    });
  });

  describe('When using Fastify adapter', () => {
    async function getFastifyApp() {
      const { Module } = await import('@nestjs/common');
      const { Test } = await import('@nestjs/testing');
      const { FastifyAdapter } = await import('@nestjs/platform-fastify');

      @Module({})
      class TestModule {}

      const module = await Test.createTestingModule({
        imports: [TestModule],
      }).compile();
      return module.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    }

    it('should detect Fastify version 4 on Nest 10', async () => {
      useNest10();

      const app = await getFastifyApp();
      const features = detectHttpAdapterTypeAndVersion(app.getHttpAdapter());
      expect(features).toEqual({
        adapterType: HttpAdapterType.FASTIFY,
        version: FastifyVersion.V4,
      });
    });
    it('should detect Fastify version 5 on Nest 11', async () => {
      useNest11();
      const app = await getFastifyApp();
      const features = detectHttpAdapterTypeAndVersion(app.getHttpAdapter());
      expect(features).toEqual({
        adapterType: HttpAdapterType.FASTIFY,
        version: FastifyVersion.V5,
      });
    });
  });
});
