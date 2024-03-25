import {
  Counter, UpDownCounter,
  Histogram, ObservableGauge, ObservableCounter, ObservableUpDownCounter,
  metrics,
} from '@opentelemetry/api';
import { OTEL_METER_NAME } from '../opentelemetry.constants';
import { OtelMetricOptions } from '../interfaces/metric-options.interface';

export type GenericMetric =
  Counter |
  UpDownCounter |
  Histogram |
  ObservableGauge |
  ObservableCounter |
  ObservableUpDownCounter;

export enum MetricType {
  'Counter' = 'Counter',
  'UpDownCounter' = 'UpDownCounter',
  'Histogram' = 'Histogram',
  'ObservableGauge' = 'ObservableGauge',
  'ObservableCounter' = 'ObservableCounter',
  'ObservableUpDownCounter' = 'ObservableUpDownCounter',
}

export const meterData: Map<string, GenericMetric> = new Map();

export function getOrCreateHistogram(
  name: string,
  options: OtelMetricOptions = {},
): Histogram {
  const nameWithPrefix = options.prefix ? `${options.prefix}.${name}` : name;
  if (meterData.has(nameWithPrefix)) {
    return meterData.get(nameWithPrefix) as Histogram;
  }

  const meter = metrics.getMeterProvider().getMeter(OTEL_METER_NAME);
  const histogram = meter.createHistogram(nameWithPrefix, options);
  meterData.set(nameWithPrefix, histogram);
  return histogram;
}

export function getOrCreateCounter(
  name: string,
  options: OtelMetricOptions = {},
): Counter {
  const nameWithPrefix = options.prefix ? `${options.prefix}.${name}` : name;
  if (meterData.has(nameWithPrefix)) {
    return meterData.get(nameWithPrefix) as Counter;
  }

  const meter = metrics.getMeterProvider().getMeter(OTEL_METER_NAME);

  const counter = meter.createCounter(nameWithPrefix, options);
  meterData.set(nameWithPrefix, counter);
  return counter;
}

export function getOrCreateUpDownCounter(
  name: string,
  options: OtelMetricOptions = {},
): UpDownCounter {
  const nameWithPrefix = options.prefix ? `${options.prefix}.${name}` : name;
  if (meterData.has(nameWithPrefix)) {
    return meterData.get(nameWithPrefix) as UpDownCounter;
  }

  const meter = metrics.getMeterProvider().getMeter(OTEL_METER_NAME);

  const upDownCounter = meter.createUpDownCounter(nameWithPrefix, options);
  meterData.set(nameWithPrefix, upDownCounter);
  return upDownCounter;
}

export function getOrCreateObservableGauge(
  name: string,
  options: OtelMetricOptions = {},
): ObservableGauge {
  const nameWithPrefix = options.prefix ? `${options.prefix}.${name}` : name;
  if (meterData.has(nameWithPrefix)) {
    return meterData.get(nameWithPrefix) as ObservableGauge;
  }

  const meter = metrics.getMeterProvider().getMeter(OTEL_METER_NAME);

  const observableGauge = meter.createObservableGauge(nameWithPrefix, options);
  meterData.set(nameWithPrefix, observableGauge);
  return observableGauge;
}

export function getOrCreateObservableCounter(
  name: string,
  options: OtelMetricOptions = {},
): ObservableCounter {
  const nameWithPrefix = options.prefix ? `${options.prefix}.${name}` : name;
  if (meterData.has(nameWithPrefix)) {
    return meterData.get(nameWithPrefix) as ObservableCounter;
  }

  const meter = metrics.getMeterProvider().getMeter(OTEL_METER_NAME);

  const observableCounter = meter.createObservableCounter(nameWithPrefix, options);
  meterData.set(nameWithPrefix, observableCounter);
  return observableCounter;
}

export function getOrCreateObservableUpDownCounter(
  name: string,
  options: OtelMetricOptions = {},
): ObservableUpDownCounter {
  const nameWithPrefix = options.prefix ? `${options.prefix}.${name}` : name;
  if (meterData.has(nameWithPrefix)) {
    return meterData.get(nameWithPrefix) as ObservableUpDownCounter;
  }

  const meter = metrics.getMeterProvider().getMeter(OTEL_METER_NAME);

  const observableCounter = meter.createObservableCounter(nameWithPrefix, options);
  meterData.set(nameWithPrefix, observableCounter);
  return observableCounter;
}
