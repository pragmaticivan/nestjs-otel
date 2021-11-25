import { Injectable } from '@nestjs/common';
import {
  Counter, UpDownCounter, ValueRecorder, MetricOptions,
} from '@opentelemetry/api-metrics';
import {
  getOrCreateCounter, getOrCreateValueRecorder, MetricType,
} from './metric-data';

@Injectable()
export class MetricService {
  getCounter(name: string, options?: MetricOptions) {
    return this.getOrCreateCounter(name, MetricType.Counter, options);
  }

  getUpDownCounter(name: string, options?: MetricOptions) {
    return this.getOrCreateCounter(name, MetricType.UpDownCounter, options);
  }

  getValueRecorder(name: string, options?: MetricOptions) {
    return this.getOrCreateValueRecorder(name, MetricType.ValueRecorder, options);
  }

  private getOrCreateValueRecorder(
    name: string,
    type: MetricType,
    options: MetricOptions,
  ): ValueRecorder {
    return getOrCreateValueRecorder(name, type, options);
  }

  private getOrCreateCounter(
    name: string,
    type: MetricType,
    options: MetricOptions,
  ): Counter | UpDownCounter {
    return getOrCreateCounter(name, type, options);
  }
}
