import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import responseTime from 'response-time';
import * as urlParser from 'url';
import { Counter, Attributes, Histogram, UpDownCounter } from '@opentelemetry/api';
import { DynamicAttributesCallback, OpenTelemetryModuleOptions } from '../interfaces';
import { MetricService } from '../metrics/metric.service';
import { OPENTELEMETRY_MODULE_OPTIONS } from '../opentelemetry.constants';

@Injectable()
export class ApiMetricsMiddleware implements NestMiddleware {
  private dynamicAttributes?: DynamicAttributesCallback;

  private defaultAttributes: Attributes;

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
    @Inject(OPENTELEMETRY_MODULE_OPTIONS) private readonly options: OpenTelemetryModuleOptions = {}
  ) {
    const {
      defaultAttributes = {},
      ignoreUndefinedRoutes = false,
      prefix,
      dynamicAttributes,
    } = options?.metrics?.apiMetrics ?? {};

    this.dynamicAttributes = dynamicAttributes;
    this.defaultAttributes = defaultAttributes;
    this.ignoreUndefinedRoutes = ignoreUndefinedRoutes;

    // Semantic Convention
    this.httpServerRequestCount = this.metricService.getCounter('http.server.request.count', {
      description: 'Total number of HTTP requests',
      unit: 'requests',
      prefix,
    });

    this.httpServerResponseCount = this.metricService.getCounter('http.server.response.count', {
      description: 'Total number of HTTP responses',
      unit: 'responses',
      prefix,
    });

    this.httpServerAbortCount = this.metricService.getCounter('http.server.abort.count', {
      description: 'Total number of data transfers aborted',
      unit: 'requests',
      prefix,
    });

    this.httpServerDuration = this.metricService.getHistogram('http.server.duration', {
      description: 'The duration of the inbound HTTP request',
      unit: 'ms',
      prefix,
    });

    this.httpServerRequestSize = this.metricService.getHistogram('http.server.request.size', {
      description: 'Size of incoming bytes',
      unit: 'By',
      prefix,
    });

    this.httpServerResponseSize = this.metricService.getHistogram('http.server.response.size', {
      description: 'Size of outgoing bytes',
      unit: 'By',
      prefix,
    });

    // Helpers
    this.httpServerResponseSuccessCount = this.metricService.getCounter(
      'http.server.response.success.count',
      {
        description: 'Total number of all successful responses',
        unit: 'responses',
        prefix,
      }
    );

    this.httpServerResponseErrorCount = this.metricService.getCounter(
      'http.server.response.error.count',
      {
        description: 'Total number of all response errors',
        prefix,
      }
    );

    this.httpClientRequestErrorCount = this.metricService.getCounter(
      'http.client.request.error.count',
      {
        description: 'Total number of client error requests',
        prefix,
      }
    );
  }

  use(req: any, res: any, next: any) {
    responseTime((req: any, res: any, time: any) => {
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
      const attributes: Attributes = {
        method,
        status,
        path,
        ...this.defaultAttributes,
        ...this.getDynamicAttributes(req, res),
      };

      this.httpServerRequestSize.record(requestLength, attributes);
      this.httpServerResponseSize.record(responseLength, attributes);

      this.httpServerResponseCount.add(1, attributes);
      this.httpServerDuration.record(time, attributes);

      const codeClass = this.getStatusCodeClass(status);

      switch (codeClass) {
        case 'success':
          this.httpServerResponseSuccessCount.add(1);
          break;
        case 'redirect':
          // TODO: Review what should be appropriate for redirects.
          this.httpServerResponseSuccessCount.add(1);
          break;
        case 'client_error':
          this.httpClientRequestErrorCount.add(1);
          break;
        case 'server_error':
          this.httpServerResponseErrorCount.add(1);
          break;
      }

      req.on('end', () => {
        if (req.aborted === true) {
          this.httpServerAbortCount.add(1);
        }
      });
    })(req, res, next);
  }

  private getDynamicAttributes(req: unknown, res: unknown): Attributes {
    return this.dynamicAttributes?.(req, res) ?? {};
  }

  private getStatusCodeClass(code: number): string {
    if (code < 200) return 'info';
    if (code < 300) return 'success';
    if (code < 400) return 'redirect';
    if (code < 500) return 'client_error';
    return 'server_error';
  }
}
