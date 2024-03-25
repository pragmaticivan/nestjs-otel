import { createParamDecorator } from '@nestjs/common';
import {
  getOrCreateObservableCounter,
  getOrCreateObservableGauge,
  getOrCreateObservableUpDownCounter,
} from '../metric-data';
import { OtelMetricOptions } from '../../interfaces/metric-options.interface';

export const OtelObservableGauge = createParamDecorator(
  (name: string, options?: OtelMetricOptions) => {
    if (!name || name.length === 0) {
      throw new Error('OtelObservableGauge need a name argument');
    }
    return getOrCreateObservableGauge(name, options);
  }
);

export const OtelObservableCounter = createParamDecorator(
  (name: string, options?: OtelMetricOptions) => {
    if (!name || name.length === 0) {
      throw new Error('OtelObservableCounter need a name argument');
    }
    return getOrCreateObservableCounter(name, options);
  }
);

export const OtelObservableUpDownCounter = createParamDecorator(
  (name: string, options?: OtelMetricOptions) => {
    if (!name || name.length === 0) {
      throw new Error('OtelObservableUpDownCounter need a name argument');
    }
    return getOrCreateObservableUpDownCounter(name, options);
  }
);
