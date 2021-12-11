import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import * as responseTime from 'response-time';
import * as urlParser from 'url';
import { Counter, Attributes, Histogram } from '@opentelemetry/api-metrics';
import { OpenTelemetryModuleOptions } from '../interfaces';
import { MetricService } from '../metrics/metric.service';
import { OPENTELEMETRY_MODULE_OPTIONS } from '../opentelemetry.constants';

export const DEFAULT_LONG_RUNNING_REQUEST_BUCKETS = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, // standard
  30, 60, 120, 300, 600, // Sometimes requests may be really long-running
];
export const DEFAULT_REQUEST_SIZE_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
export const DEFAULT_RESPONSE_SIZE_BUCKETS = [
  5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000,
];

@Injectable()
export class ApiMetricsMiddleware implements NestMiddleware {
  private readonly defaultLongRunningRequestBuckets = DEFAULT_LONG_RUNNING_REQUEST_BUCKETS;

  private readonly defaultRequestSizeBuckets = DEFAULT_REQUEST_SIZE_BUCKETS;

  private readonly defaultResponseSizeBuckets = DEFAULT_RESPONSE_SIZE_BUCKETS;

  private requestTotal: Counter;

  private responseTotal: Counter;

  private responseSuccessTotal: Counter;

  private responseErrorTotal: Counter;

  private responseClientErrorTotal: Counter;

  private responseServerErrorTotal: Counter;

  private serverAbortsTotal: Counter;

  private requestDuration: Histogram;

  private requestSizeHistogram: Histogram;

  private responseSizeHistogram: Histogram;

  private defaultAttributes: Attributes;

  private readonly ignoreUndefinedRoutes: boolean;

  constructor(
    @Inject(MetricService) private readonly metricService: MetricService,
    @Inject(OPENTELEMETRY_MODULE_OPTIONS) private readonly options: OpenTelemetryModuleOptions = {},
  ) {
    this.requestTotal = this.metricService.getCounter('http_request_total', {
      description: 'Total number of HTTP requests',
    });

    this.responseTotal = this.metricService.getCounter('http_response_total', {
      description: 'Total number of HTTP responses',
    });

    this.responseSuccessTotal = this.metricService.getCounter('http_response_success_total', {
      description: 'Total number of all successful responses',
    });

    this.responseErrorTotal = this.metricService.getCounter('http_response_error_total', {
      description: 'Total number of all response errors',
    });

    this.responseClientErrorTotal = this.metricService.getCounter('http_client_error_total', {
      description: 'Total number of client error requests',
    });

    this.responseServerErrorTotal = this.metricService.getCounter('http_server_error_total', {
      description: 'Total number of server error requests',
    });

    this.serverAbortsTotal = this.metricService.getCounter('http_server_aborts_total', {
      description: 'Total number of data transfers aborted',
    });

    const {
      timeBuckets = [], requestSizeBuckets = [], responseSizeBuckets = [], defaultAttributes = {},
      ignoreUndefinedRoutes = false,
    } = options?.metrics?.apiMetrics;

    this.defaultAttributes = defaultAttributes;
    this.ignoreUndefinedRoutes = ignoreUndefinedRoutes;

    this.requestDuration = this.metricService.getHistogram('http_request_duration_seconds', {
      boundaries: timeBuckets.length > 0 ? timeBuckets : this.defaultLongRunningRequestBuckets,
      description: 'HTTP latency value recorder in seconds',
    });

    this.requestSizeHistogram = this.metricService.getHistogram('http_request_size_bytes', {
      boundaries:
        requestSizeBuckets.length > 0 ? requestSizeBuckets : this.defaultRequestSizeBuckets,
      description: 'Current total of incoming bytes',
    });

    this.responseSizeHistogram = this.metricService.getHistogram('http_response_size_bytes', {
      boundaries:
        responseSizeBuckets.length > 0 ? responseSizeBuckets : this.defaultResponseSizeBuckets,
      description: 'Current total of outgoing bytes',
    });
  }

  use(req, res, next) {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    responseTime((req, res, time) => {
      const { route, url, method } = req;
      let path;

      if (route) {
        path = route.path;
      } else if (this.ignoreUndefinedRoutes) {
        return;
      } else {
        path = urlParser.parse(url).pathname;
      }

      this.requestTotal.add(1, { method, path });

      const requestLength = parseInt(req.headers['content-length'], 10) || 0;
      const responseLength: number = parseInt(res.getHeader('Content-Length'), 10) || 0;

      const status = res.statusCode || 500;
      const attributes: Attributes = {
        method, status, path, ...this.defaultAttributes,
      };

      this.requestSizeHistogram.record(requestLength, attributes);
      this.responseSizeHistogram.record(responseLength, attributes);

      this.responseTotal.add(1, attributes);
      this.requestDuration.record(time / 1000, attributes);

      const codeClass = this.getStatusCodeClass(status);

      // eslint-disable-next-line default-case
      switch (codeClass) {
        case 'success':
          this.responseSuccessTotal.add(1);
          break;
        case 'redirect':
          // TODO: Review what should be appropriate for redirects.
          this.responseSuccessTotal.add(1);
          break;
        case 'client_error':
          this.responseErrorTotal.add(1);
          this.responseClientErrorTotal.add(1);
          break;
        case 'server_error':
          this.responseErrorTotal.add(1);
          this.responseServerErrorTotal.add(1);
          break;
      }

      req.on('end', () => {
        if (req.aborted === true) {
          this.serverAbortsTotal.add(1);
        }
      });
    })(req, res, next);
  }

  private getStatusCodeClass(code: number): string {
    if (code < 200) return 'info';
    if (code < 300) return 'success';
    if (code < 400) return 'redirect';
    if (code < 500) return 'client_error';
    return 'server_error';
  }
}
