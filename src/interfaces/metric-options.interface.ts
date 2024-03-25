import { MetricOptions } from '@opentelemetry/api';

export interface OtelMetricOptions extends MetricOptions {
  /**
   * A prefix to add to the name of the metric.
   */
  prefix?: string;
}
