import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import * as responseTime from 'response-time';
import * as urlParser from 'url';
import { Counter, ValueRecorder } from '@opentelemetry/api-metrics';
import { OpenTelemetryModuleOptions } from '../interfaces';
import { MetricService } from '../metrics/metric.service';
import { OPENTELEMETRY_MODULE_OPTIONS } from '../opentelemetry.constants';

@Injectable()
export class ApiMetricsMiddleware implements NestMiddleware {
  private readonly defaultDurationMillisecondsBuckets = [
    5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000,
  ];

  private allRequestTotal: Counter;

  private allSuccessTotal: Counter;

  private allErrorsTotal: Counter;

  private allClientErrorTotal: Counter;

  private allServerErrorTotal: Counter;

  private requestTotal: Counter;

  private responseTime: ValueRecorder;

  constructor(
    @Inject(OPENTELEMETRY_MODULE_OPTIONS) private readonly options: OpenTelemetryModuleOptions,
    @Inject(MetricService) private readonly metricService: MetricService,
  ) {
    this.allRequestTotal = this.metricService.getCounter('http_all_request_total');
    this.allSuccessTotal = this.metricService.getCounter('http_all_success_total');
    this.allErrorsTotal = this.metricService.getCounter('http_all_errors_total');
    this.allClientErrorTotal = this.metricService.getCounter('http_all_client_error_total');
    this.allServerErrorTotal = this.metricService.getCounter('http_all_server_error_total');
    this.requestTotal = this.metricService.getCounter('http_request_total');
    this.responseTime = this.metricService.getValueRecorder('http_request_duration_milliseconds', {
      boundaries: this.defaultDurationMillisecondsBuckets,
    });
  }

  use(req, res, next) {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    responseTime((req, res, time) => {
      const { url, method } = req;
      const { path } = urlParser.parse(url);
      if (path === '/favicon.ico') {
        return;
      }
      if (path === this.options?.withPrometheusExporter?.metricPath) {
        return;
      }

      const status = res.statusCode || 500;
      const labels = { method, status, path };

      this.responseTime.bind(labels).record(time);

      this.countResponse(res, labels);
    })(req, res, next);
  }

  private countResponse(res, labels) {
    this.allRequestTotal.add(1);
    this.requestTotal.bind(labels).add(1);

    const codeClass = this.getStatusCodeClass(res.statusCode);

    // eslint-disable-next-line default-case
    switch (codeClass) {
      case 'success':
        this.allSuccessTotal.add(1);
        break;
      case 'redirect':
        this.allSuccessTotal.add(1);
        break;
      case 'client_error':
        this.allErrorsTotal.add(1);
        this.allClientErrorTotal.add(1);
        break;
      case 'server_error':
        this.allErrorsTotal.add(1);
        this.allServerErrorTotal.add(1);
        break;
    }
  }

  private getStatusCodeClass(code: number): string {
    if (code < 200) return 'info';
    if (code < 300) return 'success';
    if (code < 400) return 'redirect';
    if (code < 500) return 'client_error';
    return 'server_error';
  }
}
