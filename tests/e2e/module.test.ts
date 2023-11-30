import { INestApplication } from '@nestjs/common';
import { OpenTelemetryModule, OPENTELEMETRY_MODULE_OPTIONS, TraceService } from '../../src';
import { OpenTelemetryModuleOptions, OpenTelemetryOptionsFactory } from '../../src/interfaces';
import { createOpenTelemetryModule } from '../utils';

describe('OpenTelemetryModule', () => {
  let app: INestApplication;

  describe('#forRoot', () => {
    describe('default options', () => {
      beforeEach(async () => {
        ({ app } = await createOpenTelemetryModule(OpenTelemetryModule.forRoot()));
      });

      it('should load module with default configs', async () => {
        expect(app.get(OPENTELEMETRY_MODULE_OPTIONS)).toBeInstanceOf(Object);
      });

      it('should load TraceService with default configs', async () => {
        expect(app.get(TraceService)).toBeInstanceOf(TraceService);
      });
    });
  });

  describe('#forRootAsync', () => {
    describe('default options with factory', () => {
      beforeEach(async () => {
        ({ app } = await createOpenTelemetryModule(OpenTelemetryModule.forRootAsync({
          useFactory: () => ({}),
        })));
      });

      it('should load module with default configs', async () => {
        expect(app.get(OPENTELEMETRY_MODULE_OPTIONS)).toBeInstanceOf(Object);
      });

      it('should load TraceService with default configs', async () => {
        expect(app.get(TraceService)).toBeInstanceOf(TraceService);
      });
    });

    describe('default options with class', () => {
      beforeEach(async () => {
        class OpenTelemetryService implements OpenTelemetryOptionsFactory {
          createOpenTelemetryOptions(): OpenTelemetryModuleOptions {
            return {};
          }
        }

        ({ app } = await createOpenTelemetryModule(OpenTelemetryModule.forRootAsync({
          useClass: OpenTelemetryService,
        })));
      });

      it('should load module with default configs', async () => {
        expect(app.get(OPENTELEMETRY_MODULE_OPTIONS)).toBeInstanceOf(Object);
      });

      it('should load TraceService with default configs', async () => {
        expect(app.get(TraceService)).toBeInstanceOf(TraceService);
      });
    });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });
});
