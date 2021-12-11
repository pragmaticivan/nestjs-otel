import { createParamDecorator } from '@nestjs/common';
import { MetricOptions } from '@opentelemetry/api-metrics';
import { getOrCreateCounter, MetricType } from '../metric-data';

export const OtelCounter = createParamDecorator((name: string, options?: MetricOptions) => {
  if (!name || name.length === 0) {
    throw new Error('OtelCounter need a name argument');
  }
  return getOrCreateCounter(name, options);
});

export const OtelUpDownCounter = createParamDecorator((name: string, options?: MetricOptions) => {
  if (!name || name.length === 0) {
    throw new Error('OtelUpDownCounter need a name argument');
  }
  return getOrCreateCounter(name, options);
});
