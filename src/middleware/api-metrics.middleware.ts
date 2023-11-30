import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Counter, Attributes, Histogram, UpDownCounter, ValueType } from '@opentelemetry/api';
import { OpenTelemetryModuleOptions } from '../interfaces';
import { MetricService } from '../metrics/metric.service';
import { OPENTELEMETRY_MODULE_OPTIONS } from '../opentelemetry.constants';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { Request, Response, NextFunction } from 'express';
import * as responseTime from 'response-time';

export enum AttributeNames {
  SERVER_ADDRESS = 'server.address',
  SERVER_PORT = 'server.port',
  HTTP_RESPONSE_STATUS_CODE = 'http.response.status_code',
}

@Injectable()
export class ApiMetricsMiddleware implements NestMiddleware {
  private defaultMetricAttributes: Attributes;

  // https://github.com/open-telemetry/semantic-conventions/blob/main/docs/http/http-metrics.md#metric-httpserveractive_requests
  private httpServerActiveRequests: UpDownCounter;

  // https://github.com/open-telemetry/semantic-conventions/blob/main/docs/http/http-metrics.md#metric-httpserverrequestbodysize
  private httpServerRequestBodySize: Histogram;

  // https://github.com/open-telemetry/semantic-conventions/blob/main/docs/http/http-metrics.md#metric-httpserverresponsebodysize
  private httpServerResponseBodySize: Histogram;

  private httpServerResponseSuccessCount: Counter;
  private httpServerResponseErrorCount: Counter;
  private httpClientRequestErrorCount: Counter;
  private httpServerAbortCount: Counter;

  private readonly ignoreUndefinedRoutes: boolean;

  constructor(
    @Inject(MetricService) private readonly metricService: MetricService,
    @Inject(OPENTELEMETRY_MODULE_OPTIONS) private readonly options: OpenTelemetryModuleOptions = {}
  ) {
    const { defaultAttributes = {}, ignoreUndefinedRoutes = false } =
      options?.metrics?.apiMetrics ?? {};

    this.defaultMetricAttributes = defaultAttributes;
    this.ignoreUndefinedRoutes = ignoreUndefinedRoutes;

    this.httpServerActiveRequests = this.metricService.getUpDownCounter(
      'http.server.active_requests',
      {
        description: 'Total number of active requests',
        unit: 'requests',
        valueType: ValueType.INT,
      }
    );

    this.httpServerRequestBodySize = this.metricService.getHistogram(
      'http.server.request.body.size',
      {
        description: 'Size of HTTP server request bodies.',
        unit: 'By',
      }
    );

    this.httpServerResponseBodySize = this.metricService.getHistogram(
      'http.server.response.body.size',
      {
        description: 'Size of HTTP server response bodies.',
        unit: 'By',
      }
    );

    // Helpers
    this.httpServerAbortCount = this.metricService.getCounter('http.server.abort.count', {
      description: 'Total number of data transfers aborted',
      unit: 'requests',
    });

    this.httpServerResponseSuccessCount = this.metricService.getCounter(
      'http.server.response.success.count',
      {
        description: 'Total number of all successful responses',
        unit: 'responses',
      }
    );

    this.httpServerResponseErrorCount = this.metricService.getCounter(
      'http.server.response.error.count',
      {
        description: 'Total number of all response errors',
      }
    );

    this.httpClientRequestErrorCount = this.metricService.getCounter(
      'http.client.request.error.count',
      {
        description: 'Total number of client error requests',
      }
    );
  }

  use(mReq: Request, mRes: Response, mNext: NextFunction) {
    responseTime((req: Request, res: Response) => {
      const protocol = req.protocol || 'http';
      let path;
      if (req.route) {
        path = req.route.path;
      } else if (this.ignoreUndefinedRoutes) {
        return;
      } else {
        const baseURL = `${protocol}://${req.headers.host}/`;
        const urlObj = new URL(req.url, baseURL);
        path = urlObj.pathname;
      }
      const status = res.statusCode || 500;

      const helperAtributes: Attributes = { ...this.defaultMetricAttributes };

      const baselineAtributes: Attributes = { ...helperAtributes };
      baselineAtributes[SemanticAttributes.HTTP_SCHEME] = protocol;
      baselineAtributes[SemanticAttributes.HTTP_METHOD] = req.method;
      baselineAtributes[AttributeNames.SERVER_ADDRESS] = req.socket.localAddress;
      baselineAtributes[AttributeNames.SERVER_PORT] = req.socket.localPort;

      this.httpServerActiveRequests.add(1, baselineAtributes);

      const attributes: Attributes = { ...baselineAtributes };
      attributes[AttributeNames.HTTP_RESPONSE_STATUS_CODE] = status;
      attributes[SemanticAttributes.HTTP_ROUTE] = path || '/';
      attributes['network.protocol.name'] = protocol;
      attributes['network.protocol.version'] = req.httpVersion;

      const codeClass = this.getStatusCodeClass(status);
      switch (codeClass) {
        case 'success':
          this.httpServerResponseSuccessCount.add(1, helperAtributes);
          break;
        case 'redirect':
          this.httpServerResponseSuccessCount.add(1, helperAtributes);
          break;
        case 'client_error':
          this.httpClientRequestErrorCount.add(1, helperAtributes);
          break;
        case 'server_error':
          this.httpServerResponseErrorCount.add(1, helperAtributes);
          break;
      }

      req.on('end', () => {
        const requestLength = parseInt(req.socket.bytesRead, 10) || 0;
        const responseLength: number = parseInt(res.getHeader('Content-Length'), 10) || 0;
        this.httpServerRequestBodySize.record(requestLength, attributes);
        this.httpServerResponseBodySize.record(responseLength, attributes);
        this.httpServerActiveRequests.add(-1, baselineAtributes);

        if (req.aborted === true) {
          this.httpServerAbortCount.add(1, attributes);
        }
      });
    })(mReq, mRes, mNext);
  }

  private getStatusCodeClass(code: number): string {
    if (code < 200) return 'info';
    if (code < 300) return 'success';
    if (code < 400) return 'redirect';
    if (code < 500) return 'client_error';
    return 'server_error';
  }
}
