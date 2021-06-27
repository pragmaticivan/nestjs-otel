import { INestApplication } from '@nestjs/common';
import { Agent } from 'http';
import { OPENTELEMETRY_MODULE_OPTIONS, TraceService } from '../../src';
import { createOpenTelemetryModule } from '../utils';

describe('OpenTelemetryModule', () => {
  let app: INestApplication;

  describe('#register', () => {
    beforeEach(async () => {
      ({ app } = await createOpenTelemetryModule());
    });

    it('should load module with default configs', async () => {
      expect(app.get(OPENTELEMETRY_MODULE_OPTIONS)).toBeInstanceOf(Object);
    });

    it('should load TraceService with default configs', async () => {
      expect(app.get(TraceService)).toBeInstanceOf(TraceService);
    });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });
});
