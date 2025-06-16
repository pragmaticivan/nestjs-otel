import { Injectable } from '@nestjs/common';
import {
  getOrCreateCounter,
  getOrCreateHistogram,
  getOrCreateGauge,
  getOrCreateObservableCounter,
  getOrCreateObservableGauge,
  getOrCreateObservableUpDownCounter,
  getOrCreateUpDownCounter,
} from './metric-data';
import { OtelMetricOptions } from '../interfaces/metric-options.interface';

@Injectable()
export class MetricService {
  getCounter(name: string, options?: OtelMetricOptions) {
    return getOrCreateCounter(name, options);
  }

  getUpDownCounter(name: string, options?: OtelMetricOptions) {
    return getOrCreateUpDownCounter(name, options);
  }

  getHistogram(name: string, options?: OtelMetricOptions) {
    return getOrCreateHistogram(name, options);
  }

  getGauge(name: string, options?: OtelMetricOptions) {
    return getOrCreateGauge(name, options);
  }

  getObservableCounter(name: string, options?: OtelMetricOptions) {
    return getOrCreateObservableCounter(name, options);
  }

  getObservableGauge(name: string, options?: OtelMetricOptions) {
    return getOrCreateObservableGauge(name, options);
  }

  getObservableUpDownCounter(name: string, options?: OtelMetricOptions) {
    return getOrCreateObservableUpDownCounter(name, options);
  }
}
