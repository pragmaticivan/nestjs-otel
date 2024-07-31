import { ModuleMetadata, Type, Abstract } from '@nestjs/common';
import { Attributes } from '@opentelemetry/api';
import { RouteInfo } from '@nestjs/common/interfaces';

export type OpenTelemetryModuleOptions = {
  /**
   * OpenTelemetry Metrics Setup
   */
  metrics?: OpenTelemetryMetrics;
};

export interface OpenTelemetryOptionsFactory {
  createOpenTelemetryOptions(): Promise<OpenTelemetryModuleOptions> | OpenTelemetryModuleOptions;
}

/**
 * The options for the asynchronous Terminus module creation
 *
 * @publicApi
 */
export interface OpenTelemetryModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * The name of the module
   */
  name?: string;
  /**
   * The class which should be used to provide the Terminus options
   */
  useClass?: Type<OpenTelemetryOptionsFactory>;
  /**
   * Import existing providers from other module
   */
  useExisting?: Type<OpenTelemetryOptionsFactory>;
  /**
   * The factory which should be used to provide the Terminus options
   */
  useFactory?: (...args: any[]) => Promise<OpenTelemetryModuleOptions> | OpenTelemetryModuleOptions;
  /**
   * The providers which should get injected
   */
  inject?: (string | symbol | Function | Type<any> | Abstract<any>)[];
}

export type DynamicAttributesCallback = (req: unknown, res: unknown) => Attributes;

export type OpenTelemetryMetrics = {
  hostMetrics?: boolean;
  apiMetrics?: {
    enable?: boolean;
    defaultAttributes?: Attributes;
    dynamicAttributes?: DynamicAttributesCallback;
    ignoreRoutes?: (string | RouteInfo)[];
    ignoreUndefinedRoutes?: boolean;
    prefix?: string;
  };
};
