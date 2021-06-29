import {
  DynamicModule, Global, Inject, Logger,
  MiddlewareConsumer, Module, OnApplicationBootstrap,
  OnApplicationShutdown, Provider,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { HostMetrics } from '@opentelemetry/host-metrics';
import { MeterProvider } from '@opentelemetry/metrics';
import * as nodeMetrics from 'opentelemetry-node-metrics';
import { metrics } from '@opentelemetry/api-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OpenTelemetryModuleOptions } from './interfaces';
import { MetricService } from './metrics/metric.service';
import { ApiMetricsMiddleware } from './middleware';
import {
  OPENTELEMETRY_METER_PROVIDER,
  OPENTELEMETRY_MODULE_OPTIONS,
  OPENTELEMETRY_SDK,
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

  static async forRoot(
    options: OpenTelemetryModuleOptions = { metrics: {} },
  ): Promise<DynamicModule> {
    const openTelemetryModuleOptions = {
      provide: OPENTELEMETRY_MODULE_OPTIONS,
      useValue: options,
    };

    const providers = [
      openTelemetryModuleOptions,
      await this.createNodeSDKProvider(),
      this.createMeterProvider(),
      TraceService,
      MetricService,
    ];

    const exports: Provider[] = [
      TraceService,
      MetricService,
    ];

    return {
      module: OpenTelemetryCoreModule,
      providers,
      exports,
    };
  }

  configure(consumer: MiddlewareConsumer) {
    const {
      apiMetrics = { enable: false },
    } = this.options?.metrics;
    if (apiMetrics.enable === true) {
      consumer.apply(ApiMetricsMiddleware).forRoutes('*');
    }
  }

  async onApplicationBootstrap() {
    const nodeOtelSDK = this.moduleRef.get<NodeSDK>(OPENTELEMETRY_SDK);
    const meterProvider = this.moduleRef.get<MeterProvider>(OPENTELEMETRY_METER_PROVIDER);
    try {
      this.logger.log('NestJS OpenTelemetry starting');
      await nodeOtelSDK.start();
      // Start method sets a custom meter provider
      // when exporter is defined. Overwrites that here.
      // Possible improvements can be found here: https://github.com/open-telemetry/opentelemetry-js/issues/2307
      metrics.setGlobalMeterProvider(meterProvider);
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
      useFactory: (options: OpenTelemetryModuleOptions, meterProvider: MeterProvider) => {
        const sdk = new NodeSDK(
          { ...options.nodeSDKConfiguration },
        );
        return sdk;
      },
      inject: [OPENTELEMETRY_MODULE_OPTIONS, OPENTELEMETRY_METER_PROVIDER],
    };
  }

  private static createMeterProvider(): Provider {
    return {
      provide: OPENTELEMETRY_METER_PROVIDER,
      useFactory: (options: OpenTelemetryModuleOptions) => {
        const {
          defaultMetrics = false, hostMetrics = false,
        } = options?.metrics;

        const meterProvider = new MeterProvider({
          interval: 1000,
          exporter: options?.nodeSDKConfiguration?.metricExporter,
        });

        if (defaultMetrics) {
          nodeMetrics(meterProvider);
        }

        if (hostMetrics) {
          const host = new HostMetrics({ meterProvider, name: 'host-metrics' });
          host.start();
        }

        return meterProvider;
      },
      inject: [OPENTELEMETRY_MODULE_OPTIONS],
    };
  }
}
