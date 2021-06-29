import { NodeSDKConfiguration } from '@opentelemetry/sdk-node';

export type OpenTelemetryModuleOptions = {
  nodeSDKConfiguration?: Partial<NodeSDKConfiguration>
  /**
   * Prometheus Exporter Setup
   */
  withPrometheusExporter?: PrometheusExporterOptions;
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
  }
};

export type PrometheusExporterOptions = {
  enable?: boolean,
  withHttpMiddleware?: {
    enable?: boolean,
    timeBuckets: number[]
  },
  withHostMetrics?: boolean,
  withDefaultMetrics?: boolean,
  defaultLabels?: {
    [key: string]: string | number
  },
  metricPath?: string
  port?: number,
};

export interface OpenTelemetryOptionsFactory {
  createOpenTelemetryOptions(
    connectionName?: string,
  ): Promise<OpenTelemetryModuleOptions> | OpenTelemetryModuleOptions;
}
