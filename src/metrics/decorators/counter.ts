import { createParamDecorator } from '@nestjs/common';
import { getOrCreateCounter } from '../metric-data';
import { OtelMetricOptions } from '../../interfaces/metric-options.interface';

export const OtelCounter = createParamDecorator((name: string, options?: OtelMetricOptions) => {
  if (!name || name.length === 0) {
    throw new Error('OtelCounter need a name argument');
  }
  return getOrCreateCounter(name, options);
});

export const OtelUpDownCounter = createParamDecorator(
  (name: string, options?: OtelMetricOptions) => {
    if (!name || name.length === 0) {
      throw new Error('OtelUpDownCounter need a name argument');
    }
    return getOrCreateCounter(name, options);
  }
);
