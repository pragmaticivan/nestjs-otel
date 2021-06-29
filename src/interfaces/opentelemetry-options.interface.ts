import { NodeSDKConfiguration } from '@opentelemetry/sdk-node';

export type OpenTelemetryModuleOptions = {
  nodeSDKConfiguration?: Partial<NodeSDKConfiguration>
  /**
   * OpenTelemetry Metrics Setup
   */
  metrics?: OpenTelemetryMetrics
};

export type OpenTelemetryMetrics = {
  defaultMetrics?: boolean,
  hostMetrics?: boolean,
  apiMetrics?: {
    enable?: boolean,
    timeBuckets: number[]
  },
  defaultLabels?: {
    [key: string]: string | number
  },
};

export interface OpenTelemetryOptionsFactory {
  createOpenTelemetryOptions(
    connectionName?: string,
  ): Promise<OpenTelemetryModuleOptions> | OpenTelemetryModuleOptions;
}
