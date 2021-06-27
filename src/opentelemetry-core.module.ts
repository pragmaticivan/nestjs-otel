import {
  DynamicModule, Global, Inject, Logger,
  MiddlewareConsumer, Module, OnApplicationBootstrap,
  OnApplicationShutdown, Provider,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { HostMetrics } from '@opentelemetry/host-metrics';
import { MeterProvider } from '@opentelemetry/metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import * as nodeMetrics from 'opentelemetry-node-metrics';
import { OpenTelemetryModuleOptions } from './interfaces';
import { MetricService } from './metrics/metric.service';
import { ApiMetricsMiddleware } from './middleware';
import {
  OPENTELEMETRY_METER_PROVIDER,
  OPENTELEMETRY_MODULE_OPTIONS,
  OPENTELEMETRY_PROMETHEUS_EXPORTER, OPENTELEMETRY_SDK,
} from './opentelemetry.constants';
import { TraceService } from './tracing/trace.service';

@Global()
@Module({})
export class OpenTelemetryCoreModule implements OnApplicationShutdown, OnApplicationBootstrap {
  private readonly logger = new Logger('OpenTelemetryModule');

  constructor(
    @Inject(OPENTELEMETRY_MODULE_OPTIONS) private readonly options: OpenTelemetryModuleOptions = {},
    private readonly moduleRef: ModuleRef,
  ) {}

  static async register(
    options: OpenTelemetryModuleOptions = { withPrometheusExporter: {} },
  ): Promise<DynamicModule> {
    const openTelemetryModuleOptions = {
      provide: OPENTELEMETRY_MODULE_OPTIONS,
      useValue: options,
    };

    const providers = [
      openTelemetryModuleOptions,
      await this.createNodeSDKProvider(),
      TraceService,
    ];

    const exports: Provider[] = [
      TraceService,
    ];

    const {
      enable = false,
    } = options?.withPrometheusExporter;

    if (enable) {
      providers.push(this.createPrometheusExporterProvider());
      providers.push(this.createMeterProvider());
      providers.push(MetricService);
      exports.push(MetricService);
    } else {
      // Conditional Injection for factories/static methods is not available yet.
      // More info here: https://github.com/nestjs/nest/issues/7306
      providers.push(this.noopPrometheusExporterProvider());
    }

    return {
      module: OpenTelemetryCoreModule,
      providers,
      exports,
    };
  }

  configure(consumer: MiddlewareConsumer) {
    const {
      withHttpMiddleware = { enable: false },
    } = this.options?.withPrometheusExporter;
    if (withHttpMiddleware.enable === true) {
      consumer.apply(ApiMetricsMiddleware).forRoutes('*');
    }
  }

  async onApplicationBootstrap() {
    const nodeOtelSDK = this.moduleRef.get<NodeSDK>(OPENTELEMETRY_SDK);

    try {
      await nodeOtelSDK.start();
    } catch (e) {
      this.logger.error(e?.message);
    }
  }

  async onApplicationShutdown() {
    const nodeOtelSDK = this.moduleRef.get<NodeSDK>(OPENTELEMETRY_SDK);

    try {
      await nodeOtelSDK.shutdown();
    } catch (e) {
      this.logger.error(e?.message);
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
        return new NodeSDK(options.nodeSDKConfiguration);
      },
      inject: [OPENTELEMETRY_MODULE_OPTIONS, OPENTELEMETRY_PROMETHEUS_EXPORTER],
    };
  }

  private static createPrometheusExporterProvider(): Provider {
    return {
      provide: OPENTELEMETRY_PROMETHEUS_EXPORTER,
      useFactory: (options: OpenTelemetryModuleOptions) => {
        const { port = 8081 } = options?.withPrometheusExporter;
        return new PrometheusExporter({ port });
      },
      inject: [OPENTELEMETRY_MODULE_OPTIONS],
    };
  }

  private static noopPrometheusExporterProvider(): Provider {
    return {
      provide: OPENTELEMETRY_PROMETHEUS_EXPORTER,
      useFactory: () => null,
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
