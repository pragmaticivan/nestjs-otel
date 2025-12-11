import type { Abstract, ModuleMetadata, Type } from "@nestjs/common";

export type OpenTelemetryModuleOptions = {
  /**
   * OpenTelemetry Metrics Setup
   */
  metrics?: OpenTelemetryMetrics;
};

export type OpenTelemetryOptionsFactory = {
  createOpenTelemetryOptions():
    | Promise<OpenTelemetryModuleOptions>
    | OpenTelemetryModuleOptions;
};

/**
 * The options for the asynchronous OpenTelemetry module creation
 *
 * @publicApi
 */
export interface OpenTelemetryModuleAsyncOptions
  extends Pick<ModuleMetadata, "imports"> {
  /**
   * The name of the module
   */
  name?: string;
  /**
   * The class which should be used to provide the OpenTelemetry options
   */
  useClass?: Type<OpenTelemetryOptionsFactory>;
  /**
   * Import existing providers from other module
   */
  useExisting?: Type<OpenTelemetryOptionsFactory>;
  /**
   * The factory which should be used to provide the OpenTelemetry options
   */
  useFactory?: (
    ...args: any[]
  ) => Promise<OpenTelemetryModuleOptions> | OpenTelemetryModuleOptions;
  /**
   * The providers which should get injected
   */
  inject?: (string | symbol | Function | Type<any> | Abstract<any>)[];
}

export type OpenTelemetryMetrics = {
  hostMetrics?: boolean;
};
