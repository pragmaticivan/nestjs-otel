import { DynamicModule, Module } from '@nestjs/common';
import { OpenTelemetryCoreModule } from './opentelemetry-core.module';
import { OpenTelemetryModuleAsyncOptions, OpenTelemetryModuleOptions } from './interfaces';

/**
 * The NestJS module for OpenTelemetry
 *
 * @publicApi
 */
@Module({})
export class OpenTelemetryModule {
  /**
   * Bootstraps the OpenTelemetry Module synchronously
   * @param options The options for the OpenTelemetry Module
   */
  static forRoot(options?: OpenTelemetryModuleOptions): DynamicModule {
    return {
      module: OpenTelemetryModule,
      imports: [OpenTelemetryCoreModule.forRoot(options)],
    };
  }

  /**
   * Bootstrap the OpenTelemetry Module asynchronously
   * @see https://dev.to/nestjs/advanced-nestjs-how-to-build-completely-dynamic-nestjs-modules-1370
   * @param options The options for the OpenTelemetry module
   */
  static forRootAsync(options: OpenTelemetryModuleAsyncOptions): DynamicModule {
    return {
      module: OpenTelemetryModule,
      imports: [OpenTelemetryCoreModule.forRootAsync(options)],
    };
  }
}
