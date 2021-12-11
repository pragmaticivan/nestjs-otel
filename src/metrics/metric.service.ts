import { Injectable } from '@nestjs/common';
import {
  Counter, UpDownCounter, Histogram, MetricOptions,
} from '@opentelemetry/api-metrics';
import {
  getOrCreateCounter, getOrCreateHistogram, MetricType,
} from './metric-data';

@Injectable()
export class MetricService {
  getCounter(name: string, options?: MetricOptions) {
    return this.getOrCreateCounter(name, MetricType.Counter, options);
  }

  getUpDownCounter(name: string, options?: MetricOptions) {
    return this.getOrCreateCounter(name, MetricType.UpDownCounter, options);
  }

  getHistogram(name: string, options?: MetricOptions) {
    return this.getOrCreateHistogram(name, MetricType.Histogram, options);
  }

  private getOrCreateHistogram(
    name: string,
    type: MetricType,
    options: MetricOptions,
  ): Histogram {
    return getOrCreateHistogram(name, type, options);
  }

  private getOrCreateCounter(
    name: string,
    type: MetricType,
    options: MetricOptions,
  ): Counter | UpDownCounter {
    return getOrCreateCounter(name, type, options);
  }
}
