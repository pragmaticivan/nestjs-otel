import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { detectHttpAdapterType, HttpAdapterType } from './feature-detection.utils';

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
    it('should detect Express version 5 on Nest 11', async () => {
      const app = await getExpressApp();
      const adapterType = detectHttpAdapterType(app.getHttpAdapter());
      expect(adapterType).toEqual(HttpAdapterType.EXPRESS);
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

    it('should detect Fastify version 5 on Nest 11', async () => {
      const app = await getFastifyApp();
      const adapterType = detectHttpAdapterType(app.getHttpAdapter());
      expect(adapterType).toEqual(HttpAdapterType.FASTIFY);
    });
  });
});
