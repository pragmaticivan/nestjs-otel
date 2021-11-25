import { createParamDecorator } from '@nestjs/common';
import { MetricOptions } from '@opentelemetry/api-metrics';
import { getOrCreateCounter, getOrCreateValueRecorder, MetricType } from '../metric-data';

export const OtelCounter = createParamDecorator((name: string, options?: MetricOptions) => {
  if (!name || name.length === 0) {
    throw new Error('OtelCounter need a name argument');
  }
  return getOrCreateCounter(name, MetricType.Counter, options);
});

export const OtelUpDownCounter = createParamDecorator((name: string, options?: MetricOptions) => {
  if (!name || name.length === 0) {
    throw new Error('OtelUpDownCounter need a name argument');
  }
  return getOrCreateCounter(name, MetricType.UpDownCounter, options);
});
