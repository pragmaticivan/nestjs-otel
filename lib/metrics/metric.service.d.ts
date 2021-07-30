import { Meter, MeterProvider } from '@opentelemetry/metrics';
import { Counter, UpDownCounter, ValueRecorder, MetricOptions } from '@opentelemetry/api-metrics';
export declare type GenericMetric = Counter | UpDownCounter | ValueRecorder;
export declare enum MetricType {
    'Counter' = "Counter",
    'UpDownCounter' = "UpDownCounter",
    'ValueRecorder' = "ValueRecorder"
}
export declare class MetricService {
    private readonly meterProvider;
    private meter;
    private meterData;
    constructor(meterProvider: MeterProvider);
    getCounter(name: string, options?: MetricOptions): Counter | UpDownCounter;
    getUpDownCounter(name: string, options?: MetricOptions): Counter | UpDownCounter;
    getValueRecorder(name: string, options?: MetricOptions): ValueRecorder;
    getMeterData(): Map<string, GenericMetric>;
    getMeter(): Meter;
    private getOrCreateValueRecorder;
    private getOrCreateCounter;
}
