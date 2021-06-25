import {
  DynamicModule, Global, Inject, MiddlewareConsumer, Module, NestModule, Provider,
} from '@nestjs/common';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/metrics';
import { HostMetrics } from '@opentelemetry/host-metrics';
import * as nodeMetrics from 'opentelemetry-node-metrics';
import { TraceService } from './tracing/trace.service';
import {
  OPENTELEMETRY_METER_PROVIDER,
  OPENTELEMETRY_MODULE_OPTIONS,
  OPENTELEMETRY_PROMETHEUS_EXPORTER,
  OPENTELEMETRY_SDK,
} from './opentelemetry.constants';
import { OpenTelemetryModuleOptions } from './interfaces';
import { ApiMetricsMiddleware } from './middleware';
import { MetricService } from './metrics/metric.service';

@Global()
@Module({})
export class OpenTelemetryCoreModule implements NestModule {
  constructor(
    @Inject(OPENTELEMETRY_MODULE_OPTIONS) private readonly options: OpenTelemetryModuleOptions,
  ) {}

  static async register(options: OpenTelemetryModuleOptions): Promise<DynamicModule> {
    const openTelemetryModuleOptions = {
      provide: OPENTELEMETRY_MODULE_OPTIONS,
      useValue: options,
    };

    const providers = [
      openTelemetryModuleOptions,
      await this.createNodeSDKProvider(),
      TraceService,
      MetricService,
    ];

    const {
      enable = false,
    } = options.withPrometheusExporter;

    if (enable) {
      providers.push(this.createPrometheusExporterProvider());
      providers.push(this.createMeterProvider());
    }

    return {
      module: OpenTelemetryCoreModule,
      providers,
      exports: [
        TraceService,
      ],
    };
  }

  configure(consumer: MiddlewareConsumer) {
    const { withHttpMiddleware } = this.options?.withPrometheusExporter;
    if (withHttpMiddleware.enable === true) {
      consumer.apply(ApiMetricsMiddleware).forRoutes('*');
    }
  }

  private static async createNodeSDKProvider(): Promise<Provider> {
    return {
      provide: OPENTELEMETRY_SDK,
      useFactory: async (options: OpenTelemetryModuleOptions, exporter: PrometheusExporter) => {
        const { enable = false } = options?.withPrometheusExporter;
        if (enable) {
          // eslint-disable-next-line no-param-reassign
          options.nodeSDKConfiguration.metricExporter = exporter;
        }
        const sdk = new NodeSDK(options.nodeSDKConfiguration);
        return sdk.start();
      },
      inject: [OPENTELEMETRY_MODULE_OPTIONS, OPENTELEMETRY_PROMETHEUS_EXPORTER],
    };
  }

  private static createPrometheusExporterProvider() {
    return {
      provide: OPENTELEMETRY_PROMETHEUS_EXPORTER,
      useFactory: (options: OpenTelemetryModuleOptions) => {
        const { port = 8081 } = options?.withPrometheusExporter;
        return new PrometheusExporter({ port });
      },
      inject: [OPENTELEMETRY_MODULE_OPTIONS],
    };
  }

  private static createMeterProvider(): Provider {
    return {
      provide: OPENTELEMETRY_METER_PROVIDER,
      useFactory: (exporter: PrometheusExporter, options: OpenTelemetryModuleOptions) => {
        const {
          withDefaultMetrics = false, withHostMetrics = false,
        } = options?.withPrometheusExporter;

        const meterProvider = new MeterProvider({
          exporter,
          interval: 1000,
        });

        if (withDefaultMetrics) {
          nodeMetrics(meterProvider);
        }

        if (withHostMetrics) {
          const hostMetrics = new HostMetrics({ meterProvider, name: 'host-metrics' });
          hostMetrics.start();
        }
        return meterProvider;
      },
      inject: [OPENTELEMETRY_PROMETHEUS_EXPORTER, OPENTELEMETRY_MODULE_OPTIONS],
    };
  }
}
