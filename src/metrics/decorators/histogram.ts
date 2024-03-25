import { createParamDecorator } from '@nestjs/common';
import { getOrCreateHistogram } from '../metric-data';
import { OtelMetricOptions } from '../../interfaces/metric-options.interface';

export const OtelHistogram = createParamDecorator((name: string, options?: OtelMetricOptions) => {
  if (!name || name.length === 0) {
    throw new Error('OtelHistogram need a name argument');
  }
  return getOrCreateHistogram(name, options);
});
