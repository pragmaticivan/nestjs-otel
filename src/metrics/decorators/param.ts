import { createParamDecorator } from '@nestjs/common';
import { OtelMetricOptions } from '../../interfaces/metric-options.interface';
import {
  getOrCreateCounter,
  getOrCreateGauge,
  getOrCreateHistogram,
  getOrCreateObservableCounter,
  getOrCreateObservableGauge,
  getOrCreateObservableUpDownCounter,
  getOrCreateUpDownCounter,
} from '../metric-data';

export type MetricParamDecorator = (
  name: string,
  options?: OtelMetricOptions
) => ParameterDecorator;

function createMetricParamDecorator<T>(
  type: string,
  getOrCreateMetric: (name: string, options?: OtelMetricOptions) => T
): MetricParamDecorator {
  return (name: string, options?: OtelMetricOptions): ParameterDecorator => {
    return createParamDecorator(() => {
      if (!name || name.length === 0) {
        throw new Error(`${type} need a name argument`);
      }
      return getOrCreateMetric(name, options);
    })();
  };
}

export const OtelCounter = createMetricParamDecorator('OtelCounter', getOrCreateCounter);
export const OtelUpDownCounter = createMetricParamDecorator(
  'OtelUpDownCounter',
  getOrCreateUpDownCounter
);
export const OtelGauge = createMetricParamDecorator('OtelGauge', getOrCreateGauge);

export const OtelHistogram = createMetricParamDecorator('OtelHistogram', getOrCreateHistogram);

export const OtelObservableGauge = createMetricParamDecorator(
  'OtelObservableGauge',
  getOrCreateObservableGauge
);
export const OtelObservableCounter = createMetricParamDecorator(
  'OtelObservableCounter',
  getOrCreateObservableCounter
);
export const OtelObservableUpDownCounter = createMetricParamDecorator(
  'OtelObservableUpDownCounter',
  getOrCreateObservableUpDownCounter
);
