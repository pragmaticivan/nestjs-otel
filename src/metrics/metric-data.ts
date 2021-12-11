import {
  Counter, MetricOptions, metrics, UpDownCounter, Histogram,
} from '@opentelemetry/api-metrics';
import { OTEL_METER_NAME } from '../opentelemetry.constants';

export type GenericMetric = Counter | UpDownCounter | Histogram;

export enum MetricType {
  'Counter' = 'Counter',
  'UpDownCounter' = 'UpDownCounter',
  'Histogram' = 'Histogram',
}

export const meterData: Map<string, GenericMetric> = new Map();

export function getOrCreateHistogram(
  name: string,
  type: MetricType,
  options: MetricOptions,
): Histogram {
  if (meterData.has(name)) {
    return meterData.get(name) as Histogram;
  }

  const meter = metrics.getMeterProvider().getMeter(OTEL_METER_NAME);

  switch (type) {
    case MetricType.Histogram:
      const histogram = meter.createHistogram(name, options);
      meterData.set(name, histogram);
      return histogram;
    default:
      throw new Error(`Unknown type: ${type}`);
  }
}

export function getOrCreateCounter(
  name: string,
  type: MetricType,
  options: MetricOptions,
): Counter | UpDownCounter {
  if (meterData.has(name)) {
    return meterData.get(name) as Counter | UpDownCounter;
  }

  const meter = metrics.getMeterProvider().getMeter(OTEL_METER_NAME);

  switch (type) {
    case MetricType.Counter:
      const counter = meter.createCounter(name, options);
      meterData.set(name, counter);
      return counter;
    case MetricType.UpDownCounter:
      const upDownCounter = meter.createUpDownCounter(name, options);
      meterData.set(name, upDownCounter);
      return upDownCounter;
    default:
      throw new Error(`Unknown type: ${type}`);
  }
}
