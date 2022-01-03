import { Injectable } from '@nestjs/common';
import {
  MetricOptions, ObservableResult,
} from '@opentelemetry/api-metrics';
import {
  getOrCreateCounter, getOrCreateHistogram,
  getOrCreateObservableCounter, getOrCreateObservableGauge,
  getOrCreateObservableUpDownCounter, getOrCreateUpDownCounter,
} from './metric-data';

@Injectable()
export class MetricService {
  getCounter(name: string, options?: MetricOptions) {
    return getOrCreateCounter(name, options);
  }

  getUpDownCounter(name: string, options?: MetricOptions) {
    return getOrCreateUpDownCounter(name, options);
  }

  getHistogram(name: string, options?: MetricOptions) {
    return getOrCreateHistogram(name, options);
  }

  getObservableCounter(
    name: string,
    options?: MetricOptions,
    callback?: (observableResult: ObservableResult) => void,
  ) {
    return getOrCreateObservableCounter(name, options, callback);
  }

  getObservableGauge(
    name: string,
    options?: MetricOptions,
    callback?: (observableResult: ObservableResult) => void,
  ) {
    return getOrCreateObservableGauge(name, options, callback);
  }

  getObservableUpDownCounter(
    name: string,
    options?: MetricOptions,
    callback?: (observableResult: ObservableResult) => void,
  ) {
    return getOrCreateObservableUpDownCounter(name, options, callback);
  }
}
