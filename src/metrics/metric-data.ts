import {
  Counter, MetricOptions, metrics, UpDownCounter, ValueRecorder,
} from '@opentelemetry/api-metrics';
import { OTEL_METER_NAME } from '../opentelemetry.constants';

export type GenericMetric = Counter | UpDownCounter | ValueRecorder;

export enum MetricType {
  'Counter' = 'Counter',
  'UpDownCounter' = 'UpDownCounter',
  'ValueRecorder' = 'ValueRecorder',
}

export const meterData: Map<string, GenericMetric> = new Map();

export function getOrCreateValueRecorder(
  name: string, type: MetricType, options: MetricOptions,
): ValueRecorder {
  if (meterData.has(name)) {
    return meterData.get(name) as ValueRecorder;
  }

  const meter = metrics.getMeterProvider().getMeter(OTEL_METER_NAME);

  switch (type) {
    case MetricType.ValueRecorder:
      const valueRecorder = meter.createValueRecorder(name, options);
      meterData.set(name, valueRecorder);
      return valueRecorder;
    default:
      throw new Error(`Unknown type: ${type}`);
  }
}

export function getOrCreateCounter(
  name: string, type: MetricType, options: MetricOptions,
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
