import { MetricOptions } from '@opentelemetry/api-metrics';
import { MetricService } from '../metric.service';
export declare const OpenTelemetryCounter: (name: string, options?: MetricOptions) => {
    provide: string;
    useFactory(metricService: MetricService): import("@opentelemetry/api-metrics").Counter | import("@opentelemetry/api-metrics").UpDownCounter;
    inject: (typeof MetricService)[];
};
