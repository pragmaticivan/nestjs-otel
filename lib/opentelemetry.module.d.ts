import { DynamicModule } from '@nestjs/common';
import { OpenTelemetryModuleAsyncOptions, OpenTelemetryModuleOptions } from './interfaces';
export declare class OpenTelemetryModule {
    static forRoot(options?: OpenTelemetryModuleOptions): DynamicModule;
    static forRootAsync(options: OpenTelemetryModuleAsyncOptions): DynamicModule;
}
