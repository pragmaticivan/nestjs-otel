import { DynamicModule, MiddlewareConsumer, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { OpenTelemetryModuleAsyncOptions, OpenTelemetryModuleOptions } from './interfaces';
export declare class OpenTelemetryCoreModule implements OnApplicationShutdown, OnApplicationBootstrap {
    private readonly options;
    private readonly moduleRef;
    private readonly logger;
    constructor(options: OpenTelemetryModuleOptions, moduleRef: ModuleRef);
    static forRoot(options?: OpenTelemetryModuleOptions): DynamicModule;
    static forRootAsync(options: OpenTelemetryModuleAsyncOptions): DynamicModule;
    configure(consumer: MiddlewareConsumer): void;
    onApplicationBootstrap(): Promise<void>;
    onApplicationShutdown(): Promise<void>;
    private static createNodeSDKProvider;
    private static createMeterProvider;
    private static createAsyncOptionsProvider;
    private static createAsyncProviders;
}
