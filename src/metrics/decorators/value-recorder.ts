import { createParamDecorator } from '@nestjs/common';
import { MetricOptions } from '@opentelemetry/api-metrics';
import { getOrCreateHistogram, MetricType } from '../metric-data';

export const OtelValueRecorder = createParamDecorator((name: string, options?: MetricOptions) => {
  if (!name || name.length === 0) {
    throw new Error('OtelValueRecorder need a name argument');
  }
  return getOrCreateHistogram(name, MetricType.Histogram, options);
});
