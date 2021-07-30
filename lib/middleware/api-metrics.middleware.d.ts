import { NestMiddleware } from '@nestjs/common';
import { OpenTelemetryModuleOptions } from '../interfaces';
import { MetricService } from '../metrics/metric.service';
export declare const DEFAULT_LONG_RUNNING_REQUEST_BUCKETS: number[];
export declare class ApiMetricsMiddleware implements NestMiddleware {
    private readonly options;
    private readonly metricService;
    private readonly defaultLongRunningRequestBuckets;
    private requestTotal;
    private responseTotal;
    private responseSuccessTotal;
    private responseErrorTotal;
    private responseClientErrorTotal;
    private responseServerErrorTotal;
    private requestDuration;
    constructor(options: OpenTelemetryModuleOptions, metricService: MetricService);
    use(req: any, res: any, next: any): void;
    private countResponse;
    private getStatusCodeClass;
}
