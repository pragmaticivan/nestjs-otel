import {
  type Counter,
  type Gauge,
  type Histogram,
  metrics,
  type ObservableCounter,
  type ObservableGauge,
  type ObservableUpDownCounter,
  type UpDownCounter,
} from "@opentelemetry/api";
import type { OtelMetricOptions } from "../interfaces/metric-options.interface";
import { OTEL_METER_NAME } from "../opentelemetry.constants";

export type GenericMetric =
  | Counter
  | UpDownCounter
  | Histogram
  | Gauge
  | ObservableGauge
  | ObservableCounter
  | ObservableUpDownCounter;

export enum MetricType {
  Counter = "Counter",
  UpDownCounter = "UpDownCounter",
  Histogram = "Histogram",
  Gauge = "Gauge",
  ObservableGauge = "ObservableGauge",
  ObservableCounter = "ObservableCounter",
  ObservableUpDownCounter = "ObservableUpDownCounter",
}

export const meterData: Map<string, GenericMetric> = new Map();

function getOrCreate(
  name: string,
  // biome-ignore lint/style/useDefaultParameterLast: backward compatibility
  options: OtelMetricOptions = {},
  type: MetricType
): GenericMetric | undefined {
  const nameWithPrefix = options.prefix ? `${options.prefix}.${name}` : name;
  let metric = meterData.get(nameWithPrefix);
  if (metric === undefined) {
    const meter = metrics.getMeterProvider().getMeter(OTEL_METER_NAME);
    metric = meter[`create${type}`](nameWithPrefix, options);
    meterData.set(nameWithPrefix, metric);
  }
  return metric;
}

export function getOrCreateHistogram(
  name: string,
  options: OtelMetricOptions = {}
): Histogram {
  return getOrCreate(name, options, MetricType.Histogram) as Histogram;
}

export function getOrCreateCounter(
  name: string,
  options: OtelMetricOptions = {}
): Counter {
  return getOrCreate(name, options, MetricType.Counter) as Counter;
}

export function getOrCreateGauge(
  name: string,
  options: OtelMetricOptions = {}
): Gauge {
  return getOrCreate(name, options, MetricType.Gauge) as Gauge;
}

export function getOrCreateUpDownCounter(
  name: string,
  options: OtelMetricOptions = {}
): UpDownCounter {
  return getOrCreate(name, options, MetricType.UpDownCounter) as UpDownCounter;
}

export function getOrCreateObservableGauge(
  name: string,
  options: OtelMetricOptions = {}
): ObservableGauge {
  return getOrCreate(
    name,
    options,
    MetricType.ObservableGauge
  ) as ObservableGauge;
}

export function getOrCreateObservableCounter(
  name: string,
  options: OtelMetricOptions = {}
): ObservableCounter {
  return getOrCreate(
    name,
    options,
    MetricType.ObservableCounter
  ) as ObservableCounter;
}

export function getOrCreateObservableUpDownCounter(
  name: string,
  options: OtelMetricOptions = {}
): ObservableUpDownCounter {
  return getOrCreate(
    name,
    options,
    MetricType.ObservableUpDownCounter
  ) as ObservableUpDownCounter;
}
