import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import * as responseTime from 'response-time';
import * as urlParser from 'url';
import { Counter, Labels, ValueRecorder } from '@opentelemetry/api-metrics';
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

enum StatusCodeClass {
  info,
  success,
  redirect,
  clientError,
  serverError,
}

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

  private requestDuration: ValueRecorder;

  private requestSizeValueRecorder: ValueRecorder;

  private responseSizeValueRecorder: ValueRecorder;

  private defaultLabels: Labels;

  private readonly ignoreUndefinedRoutes: boolean;

  constructor(
    @Inject(OPENTELEMETRY_MODULE_OPTIONS) private readonly options: OpenTelemetryModuleOptions = {},
    @Inject(MetricService) private readonly metricService: MetricService,
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
      timeBuckets = [], requestSizeBuckets = [], responseSizeBuckets = [], defaultLabels = {},
      ignoreUndefinedRoutes = false,
    } = options?.metrics?.apiMetrics;

    this.defaultLabels = defaultLabels;
    this.ignoreUndefinedRoutes = ignoreUndefinedRoutes;

    this.requestDuration = this.metricService.getValueRecorder('http_request_duration_seconds', {
      boundaries: timeBuckets.length > 0 ? timeBuckets : this.defaultLongRunningRequestBuckets,
      description: 'HTTP latency value recorder in seconds',
    });

    this.requestSizeValueRecorder = this.metricService.getValueRecorder('http_request_size_bytes', {
      boundaries:
        requestSizeBuckets.length > 0 ? requestSizeBuckets : this.defaultRequestSizeBuckets,
      description: 'Current total of incoming bytes',
    });

    this.responseSizeValueRecorder = this.metricService.getValueRecorder('http_response_size_bytes', {
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

      this.requestTotal.bind({ method, path }).add(1);

      const requestLength = parseInt(req.headers['content-length'], 10) || 0;
      const responseLength: number = parseInt(res.getHeader('Content-Length'), 10) || 0;

      const status = res.statusCode || 500;
      const labels: Labels = {
        method, status, path, ...this.defaultLabels,
      };

      this.requestSizeValueRecorder.bind(labels).record(requestLength);
      this.responseSizeValueRecorder.bind(labels).record(responseLength);

      this.responseTotal.bind(labels).add(1);
      this.requestDuration.bind(labels).record(time / 1000);

      const codeClass = this.getStatusCodeClass(status);

      // eslint-disable-next-line default-case
      switch (codeClass) {
        case StatusCodeClass.success:
          this.responseSuccessTotal.bind(labels).add(1);
          break;
        case StatusCodeClass.redirect:
        // TODO: Review what should be appropriate for redirects.
          this.responseSuccessTotal.bind(labels).add(1);
          break;
        case StatusCodeClass.clientError:
          this.responseErrorTotal.bind(labels).add(1);
          this.responseClientErrorTotal.bind(labels).add(1);
          break;
        case StatusCodeClass.serverError:
          this.responseErrorTotal.bind(labels).add(1);
          this.responseServerErrorTotal.bind(labels).add(1);
          break;
      }

      req.on('end', () => {
        if (req.aborted === true) {
          this.serverAbortsTotal.add(1);
        }
      });
    })(req, res, next);
  }

  private getStatusCodeClass(code: number): StatusCodeClass {
    if (code < 200) return StatusCodeClass.info;
    if (code < 300) return StatusCodeClass.success;
    if (code < 400) return StatusCodeClass.redirect;
    if (code < 500) return StatusCodeClass.clientError;
    return StatusCodeClass.serverError;
  }
}
