import { Inject, Injectable } from '@nestjs/common';
import { Meter, MeterProvider } from '@opentelemetry/metrics';
import {
  Counter, UpDownCounter, ValueRecorder, MetricOptions, UnboundMetric,
} from '@opentelemetry/api-metrics';
import { OPENTELEMETRY_METER_PROVIDER } from '../opentelemetry.constants';

export type GenericMetric = Counter | UpDownCounter | ValueRecorder;

export enum MetricType {
  'Counter' = 'Counter',
  'UpDownCounter' = 'UpDownCounter',
  'ValueRecorder' = 'ValueRecorder',
}

@Injectable()
export class MetricService {
  private meter: Meter;

  private meterData: Map<string, GenericMetric> = new Map();

  constructor(@Inject(OPENTELEMETRY_METER_PROVIDER) private readonly meterProvider: MeterProvider) {
    this.meter = this.meterProvider.getMeter('metrics');
  }

  getCounter(name: string, options?: MetricOptions) {
    return this.getOrCreateCounter(name, MetricType.Counter, options);
  }

  getUpDownCounter(name: string, options?: MetricOptions) {
    return this.getOrCreateCounter(name, MetricType.UpDownCounter, options);
  }

  getValueRecorder(name: string, options?: MetricOptions) {
    return this.getOrCreateValueRecorder(name, MetricType.ValueRecorder, options);
  }

  getMeterData(): Map<string, GenericMetric> {
    return this.meterData;
  }

  getMeter(): Meter {
    return this.meter;
  }

  private getOrCreateValueRecorder(
    name: string, type: MetricType, options: MetricOptions,
  ): ValueRecorder {
    if (this.meterData.has(name)) {
      return this.meterData.get(name) as ValueRecorder;
    }
    switch (type) {
      case MetricType.ValueRecorder:
        const valueRecorder = this.meter.createValueRecorder(name, options);
        this.meterData.set(name, valueRecorder);
        return valueRecorder;
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }

  private getOrCreateCounter(
    name: string, type: MetricType, options: MetricOptions,
  ): Counter | UpDownCounter {
    if (this.meterData.has(name)) {
      return this.meterData.get(name) as Counter | UpDownCounter;
    }
    switch (type) {
      case MetricType.Counter:
        const counter = this.meter.createCounter(name, options);
        this.meterData.set(name, counter);
        return counter;
      case MetricType.UpDownCounter:
        const upDownCounter = this.meter.createUpDownCounter(name, options);
        this.meterData.set(name, upDownCounter);
        return upDownCounter;
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }
}
