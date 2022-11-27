import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import * as responseTime from 'response-time';
import * as urlParser from 'url';
import {
  Counter, MetricAttributes, Histogram, UpDownCounter,
} from '@opentelemetry/api';
import { OpenTelemetryModuleOptions } from '../interfaces';
import { MetricService } from '../metrics/metric.service';
import { OPENTELEMETRY_MODULE_OPTIONS } from '../opentelemetry.constants';

@Injectable()
export class ApiMetricsMiddleware implements NestMiddleware {
  private defaultMetricAttributes: MetricAttributes;

  private httpServerRequestCount: Counter;

  private httpServerResponseCount: Counter;

  private httpServerDuration: Histogram;

  private httpServerRequestSize: Histogram;

  private httpServerResponseSize: Histogram;

  private httpServerResponseSuccessCount: Counter;

  private httpServerResponseErrorCount: Counter;

  private httpClientRequestErrorCount: Counter;

  private httpServerAbortCount: Counter;

  private readonly ignoreUndefinedRoutes: boolean;

  constructor(
    @Inject(MetricService) private readonly metricService: MetricService,
    @Inject(OPENTELEMETRY_MODULE_OPTIONS) private readonly options: OpenTelemetryModuleOptions = {},
  ) {
    const {
      defaultAttributes = {},
      ignoreUndefinedRoutes = false,
    } = options?.metrics?.apiMetrics ?? {};

    this.defaultMetricAttributes = defaultAttributes;
    this.ignoreUndefinedRoutes = ignoreUndefinedRoutes;

    // Semantic Convention
    this.httpServerRequestCount = this.metricService.getCounter('http.server.request.count', {
      description: 'Total number of HTTP requests',
      unit: 'requests',
    });

    this.httpServerResponseCount = this.metricService.getCounter('http.server.response.count', {
      description: 'Total number of HTTP responses',
      unit: 'responses',
    });

    this.httpServerAbortCount = this.metricService.getCounter('http.server.abort.count', {
      description: 'Total number of data transfers aborted',
      unit: 'requests',
    });

    this.httpServerDuration = this.metricService.getHistogram('http.server.duration', {
      description: 'The duration of the inbound HTTP request',
      unit: 'ms',
    });

    this.httpServerRequestSize = this.metricService.getHistogram('http.server.request.size', {
      description: 'Size of incoming bytes',
      unit: 'By',
    });

    this.httpServerResponseSize = this.metricService.getHistogram('http.server.response.size', {
      description: 'Size of outgoing bytes',
      unit: 'By',
    });

    // Helpers
    this.httpServerResponseSuccessCount = this.metricService.getCounter('http.server.response.success.count', {
      description: 'Total number of all successful responses',
      unit: 'responses',
    });

    this.httpServerResponseErrorCount = this.metricService.getCounter('http.server.response.error.count', {
      description: 'Total number of all response errors',
    });

    this.httpClientRequestErrorCount = this.metricService.getCounter('http.client.request.error.count', {
      description: 'Total number of client error requests',
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

      this.httpServerRequestCount.add(1, { method, path });

      const requestLength = parseInt(req.headers['content-length'], 10) || 0;
      const responseLength: number = parseInt(res.getHeader('Content-Length'), 10) || 0;

      const status = res.statusCode || 500;
      const attributes: MetricAttributes = {
        method, status, path, ...this.defaultMetricAttributes,
      };

      this.httpServerRequestSize.record(requestLength, attributes);
      this.httpServerResponseSize.record(responseLength, attributes);

      this.httpServerResponseCount.add(1, attributes);
      this.httpServerDuration.record(time / 1000, attributes);

      const codeClass = this.getStatusCodeClass(status);

      // eslint-disable-next-line default-case
      switch (codeClass) {
        case 'success':
          this.httpServerResponseSuccessCount.add(1);
          break;
        case 'redirect':
          // TODO: Review what should be appropriate for redirects.
          this.httpServerResponseSuccessCount.add(1);
          break;
        case 'client_error':
          this.httpServerResponseErrorCount.add(1);
          this.httpClientRequestErrorCount.add(1);
          break;
        case 'server_error':
          this.httpServerResponseErrorCount.add(1);
          this.httpClientRequestErrorCount.add(1);
          break;
      }

      req.on('end', () => {
        if (req.aborted === true) {
          this.httpServerAbortCount.add(1);
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
