import { createParamDecorator } from '@nestjs/common';
import { MetricOptions } from '@opentelemetry/api-metrics';
import { getOrCreateHistogram } from '../metric-data';

export const OtelHistogram = createParamDecorator((name: string, options?: MetricOptions) => {
  if (!name || name.length === 0) {
    throw new Error('OtelHistogram need a name argument');
  }
  return getOrCreateHistogram(name, options);
});
