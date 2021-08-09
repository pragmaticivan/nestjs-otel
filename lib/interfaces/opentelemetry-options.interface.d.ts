import { ModuleMetadata, Type, Abstract } from '@nestjs/common';
import { NodeSDKConfiguration } from '@opentelemetry/sdk-node';
export declare type OpenTelemetryModuleOptions = {
    nodeSDKConfiguration?: Partial<NodeSDKConfiguration>;
    metrics?: OpenTelemetryMetrics;
    isGlobal?: boolean;
};
export interface OpenTelemetryOptionsFactory {
    createOpenTelemetryOptions(): Promise<OpenTelemetryModuleOptions> | OpenTelemetryModuleOptions;
}
export interface OpenTelemetryModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    name?: string;
    useClass?: Type<OpenTelemetryOptionsFactory>;
    useExisting?: Type<OpenTelemetryOptionsFactory>;
    useFactory?: (...args: any[]) => Promise<OpenTelemetryModuleOptions> | OpenTelemetryModuleOptions;
    inject?: (string | symbol | Function | Type<any> | Abstract<any>)[];
}
export declare type OpenTelemetryMetrics = {
    defaultMetrics?: boolean;
    hostMetrics?: boolean;
    apiMetrics?: {
        enable?: boolean;
        timeBuckets?: number[];
    };
    defaultLabels?: {
        [key: string]: string | number;
    };
};
