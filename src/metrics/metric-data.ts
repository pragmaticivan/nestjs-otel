import {
  Counter, MetricOptions, metrics, UpDownCounter,
  Histogram, ObservableGauge, ObservableCounter, ObservableUpDownCounter, ObservableResult,
} from '@opentelemetry/api-metrics';
import { OTEL_METER_NAME } from '../opentelemetry.constants';

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
  options: MetricOptions,
): Histogram {
  if (meterData.has(name)) {
    return meterData.get(name) as Histogram;
  }

  const meter = metrics.getMeterProvider().getMeter(OTEL_METER_NAME);
  const histogram = meter.createHistogram(name, options);
  meterData.set(name, histogram);
  return histogram;
}

export function getOrCreateCounter(
  name: string,
  options: MetricOptions,
): Counter {
  if (meterData.has(name)) {
    return meterData.get(name) as Counter;
  }

  const meter = metrics.getMeterProvider().getMeter(OTEL_METER_NAME);

  const counter = meter.createCounter(name, options);
  meterData.set(name, counter);
  return counter;
}

export function getOrCreateUpDownCounter(
  name: string,
  options: MetricOptions,
): UpDownCounter {
  if (meterData.has(name)) {
    return meterData.get(name) as UpDownCounter;
  }

  const meter = metrics.getMeterProvider().getMeter(OTEL_METER_NAME);

  const upDownCounter = meter.createUpDownCounter(name, options);
  meterData.set(name, upDownCounter);
  return upDownCounter;
}

export function getOrCreateObservableGauge(
  name: string,
  options: MetricOptions,
  callback?: (observableResult: ObservableResult) => void,
): ObservableGauge {
  if (meterData.has(name)) {
    return meterData.get(name) as ObservableGauge;
  }

  const meter = metrics.getMeterProvider().getMeter(OTEL_METER_NAME);

  const observableGauge = meter.createObservableGauge(name, options, callback);
  meterData.set(name, observableGauge);
  return observableGauge;
}

export function getOrCreateObservableCounter(
  name: string,
  options: MetricOptions,
  callback?: (observableResult: ObservableResult) => void,
): ObservableCounter {
  if (meterData.has(name)) {
    return meterData.get(name) as ObservableCounter;
  }

  const meter = metrics.getMeterProvider().getMeter(OTEL_METER_NAME);

  const observableCounter = meter.createObservableCounter(name, options, callback);
  meterData.set(name, observableCounter);
  return observableCounter;
}

export function getOrCreateObservableUpDownCounter(
  name: string,
  options: MetricOptions,
  callback?: (observableResult: ObservableResult) => void,
): ObservableUpDownCounter {
  if (meterData.has(name)) {
    return meterData.get(name) as ObservableUpDownCounter;
  }

  const meter = metrics.getMeterProvider().getMeter(OTEL_METER_NAME);

  const observableCounter = meter.createObservableCounter(name, options, callback);
  meterData.set(name, observableCounter);
  return observableCounter;
}
