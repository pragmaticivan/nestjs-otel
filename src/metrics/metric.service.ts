import { Injectable } from '@nestjs/common';
import { MetricOptions } from '@opentelemetry/api';
import {
  getOrCreateCounter,
  getOrCreateHistogram,
  getOrCreateObservableCounter,
  getOrCreateObservableGauge,
  getOrCreateObservableUpDownCounter,
  getOrCreateUpDownCounter,
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

  getObservableCounter(name: string, options?: MetricOptions) {
    return getOrCreateObservableCounter(name, options);
  }

  getObservableGauge(name: string, options?: MetricOptions) {
    return getOrCreateObservableGauge(name, options);
  }

  getObservableUpDownCounter(name: string, options?: MetricOptions) {
    return getOrCreateObservableUpDownCounter(name, options);
  }
}
