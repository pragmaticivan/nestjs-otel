import {
  DynamicModule, Global, Inject, Logger,
  MiddlewareConsumer, Module, OnApplicationBootstrap,
  OnApplicationShutdown, Provider, Type,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { HostMetrics } from '@opentelemetry/host-metrics';
import { MeterProvider } from '@opentelemetry/metrics';
import * as nodeMetrics from 'opentelemetry-node-metrics';
import { metrics } from '@opentelemetry/api-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OpenTelemetryModuleAsyncOptions, OpenTelemetryModuleOptions, OpenTelemetryOptionsFactory } from './interfaces';
import { MetricService } from './metrics/metric.service';
import { ApiMetricsMiddleware } from './middleware';
import {
  OPENTELEMETRY_METER_PROVIDER,
  OPENTELEMETRY_MODULE_OPTIONS,
  OPENTELEMETRY_SDK,
} from './opentelemetry.constants';
import { TraceService } from './tracing/trace.service';
import { OpenTelemetryModule } from './opentelemetry.module';

/**
 * The internal OpenTelemetry Module which handles the integration
 * with the third party OpenTelemetry library and Nest
 *
 * @internal
 */
@Global()
@Module({})
export class OpenTelemetryCoreModule implements OnApplicationShutdown, OnApplicationBootstrap {
  private readonly logger = new Logger('OpenTelemetryModule');

  constructor(
    @Inject(OPENTELEMETRY_MODULE_OPTIONS) private readonly options: OpenTelemetryModuleOptions = {},
    private readonly moduleRef: ModuleRef,
  ) {}

  /**
   * Bootstraps the internal OpenTelemetry Module with the given options
   * synchronously and sets the correct providers
   * @param options The options to bootstrap the module synchronously
   */
  static forRoot(
    options: OpenTelemetryModuleOptions = { metrics: {} },
  ): DynamicModule {
    const openTelemetryModuleOptions = {
      provide: OPENTELEMETRY_MODULE_OPTIONS,
      useValue: options,
    };

    return {
      module: OpenTelemetryCoreModule,
      providers: [
        openTelemetryModuleOptions,
        this.createNodeSDKProvider(),
        this.createMeterProvider(),
        TraceService,
        MetricService,
      ],
      exports: [
        TraceService,
        MetricService,
      ],
    };
  }

  /**
   * Bootstraps the internal OpenTelemetry Module with the given
   * options asynchronously and sets the correct providers
   * @param options The options to bootstrap the module
   */
  static forRootAsync(options: OpenTelemetryModuleAsyncOptions): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options);
    return {
      module: OpenTelemetryModule,
      imports: [...(options.imports || [])],
      providers: [
        ...asyncProviders,
        this.createNodeSDKProvider(),
        this.createMeterProvider(),
        TraceService,
        MetricService,
      ],
      exports: [
        TraceService,
        MetricService,
      ],
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

  private static createNodeSDKProvider(): Provider {
    return {
      provide: OPENTELEMETRY_SDK,
      useFactory: (options?: OpenTelemetryModuleOptions) => {
        const sdk = new NodeSDK(
          { ...options.nodeSDKConfiguration },
        );
        return sdk;
      },
      inject: [OPENTELEMETRY_MODULE_OPTIONS],
    };
  }

  private static createMeterProvider(): Provider {
    return {
      provide: OPENTELEMETRY_METER_PROVIDER,
      useFactory: (options: OpenTelemetryModuleOptions) => {
        let defaultMetrics; let
          hostMetrics;

        if (options?.metrics) {
          defaultMetrics = options.metrics.defaultMetrics
            !== undefined ? options.metrics.defaultMetrics : false;
          hostMetrics = options.metrics.hostMetrics
            !== undefined ? options.metrics.hostMetrics : false;
        }

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

  /**
   * Returns the asynchrnous OpenTelemetry options providers depending on the
   * given module options
   * @param options Options for the asynchrnous OpenTelemetry module
   */
  private static createAsyncOptionsProvider(
    options: OpenTelemetryModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: OPENTELEMETRY_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    if (options.useClass || options.useExisting) {
      const inject = [
        (options.useClass || options.useExisting) as Type<
        OpenTelemetryOptionsFactory
        >,
      ];
      return {
        provide: OPENTELEMETRY_MODULE_OPTIONS,
        // eslint-disable-next-line max-len
        useFactory: async (optionsFactory: OpenTelemetryOptionsFactory) => optionsFactory.createOpenTelemetryOptions(),
        inject,
      };
    }

    throw new Error();
  }

  /**
   * Returns the asynchrnous providers depending on the given module
   * options
   * @param options Options for the asynchrnous OpenTelemetry module
   */
  private static createAsyncProviders(
    options: OpenTelemetryModuleAsyncOptions,
  ): Provider[] {
    if (options.useFactory || options.useExisting) {
      return [this.createAsyncOptionsProvider(options)];
    }
    const useClass = options.useClass as Type<OpenTelemetryOptionsFactory>;
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
        inject: [...(options.inject || [])],
      },
    ];
  }
}
