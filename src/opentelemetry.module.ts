import { DynamicModule, Module } from '@nestjs/common';
import { OpenTelemetryCoreModule } from './opentelemetry-core.module';
import { OpenTelemetryModuleOptions } from './interfaces';

@Module({})
export class OpenTelemetryModule {
  static async forRoot(
    options?: OpenTelemetryModuleOptions,
  ): Promise<DynamicModule> {
    return {
      module: OpenTelemetryModule,
      imports: [await OpenTelemetryCoreModule.forRoot(options)],
    };
  }
}
