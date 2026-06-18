import type {
  Abstract,
  ExecutionContext,
  ModuleMetadata,
  Type,
} from "@nestjs/common";
import type { Attributes } from "@opentelemetry/api";

export interface OpenTelemetryModuleOptions {
  /**
   * OpenTelemetry Metrics Setup
   */
  metrics?: OpenTelemetryMetrics;
  /**
   * Wide Events Setup, used by the WideEventInterceptor
   */
  wideEvents?: OpenTelemetryWideEvents;
}

export interface OpenTelemetryOptionsFactory {
  createOpenTelemetryOptions():
    | Promise<OpenTelemetryModuleOptions>
    | OpenTelemetryModuleOptions;
}

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

export interface OpenTelemetryMetrics {
  hostMetrics?: boolean;
}

export interface OpenTelemetryWideEvents {
  /**
   * Called at the start of each request to seed baseline attributes
   * (e.g. user/tenant ids derived from the request).
   */
  seed?: (context: ExecutionContext) => Attributes;
}
