/** biome-ignore-all lint/style/useImportType: backward compatibility */
import {
  DynamicModule,
  Global,
  Inject,
  Module,
  OnApplicationBootstrap,
  Provider,
  Type,
} from "@nestjs/common";
import { metrics } from "@opentelemetry/api";
import { HostMetrics } from "@opentelemetry/host-metrics";
import { MeterProvider } from "@opentelemetry/sdk-metrics";
import {
  OpenTelemetryModuleAsyncOptions,
  OpenTelemetryModuleOptions,
  OpenTelemetryOptionsFactory,
} from "./interfaces";
import { MetricService } from "./metrics/metric.service";
import { OPENTELEMETRY_MODULE_OPTIONS } from "./opentelemetry.constants";
import { TraceService } from "./tracing/trace.service";

/**
 * The internal OpenTelemetry Module which handles the integration
 * with the third party OpenTelemetry library and Nest
 *
 * @internal
 */
@Global()
@Module({})
export class OpenTelemetryCoreModule implements OnApplicationBootstrap {
  constructor(
    @Inject(OPENTELEMETRY_MODULE_OPTIONS)
    private readonly options: OpenTelemetryModuleOptions = {}
  ) {}

  /**
   * Bootstraps the internal OpenTelemetry Module with the given options
   * synchronously and sets the correct providers
   * @param options The options to bootstrap the module synchronously
   */
  static forRoot(options: OpenTelemetryModuleOptions = {}): DynamicModule {
    const openTelemetryModuleOptions = {
      provide: OPENTELEMETRY_MODULE_OPTIONS,
      useValue: options,
    };

    return {
      module: OpenTelemetryCoreModule,
      providers: [openTelemetryModuleOptions, TraceService, MetricService],
      exports: [TraceService, MetricService],
    };
  }

  /**
   * Bootstraps the internal OpenTelemetry Module with the given
   * options asynchronously and sets the correct providers
   * @param options The options to bootstrap the module
   */
  static forRootAsync(options: OpenTelemetryModuleAsyncOptions): DynamicModule {
    const asyncProviders =
      OpenTelemetryCoreModule.createAsyncProviders(options);
    return {
      module: OpenTelemetryCoreModule,
      imports: [...(options.imports || [])],
      providers: [...asyncProviders, TraceService, MetricService],
      exports: [TraceService, MetricService],
    };
  }

  async onApplicationBootstrap() {
    let hostMetrics = false;

    if (this.options?.metrics) {
      hostMetrics =
        this.options.metrics.hostMetrics !== undefined
          ? this.options.metrics.hostMetrics
          : false;
    }

    const meterProvider = metrics.getMeterProvider() as MeterProvider;

    if (hostMetrics) {
      const host = new HostMetrics({ meterProvider, name: "host-metrics" });
      host.start();
    }
  }

  /**
   * Returns the asynchrnous OpenTelemetry options providers depending on the
   * given module options
   * @param options Options for the asynchrnous OpenTelemetry module
   */
  private static createAsyncOptionsProvider(
    options: OpenTelemetryModuleAsyncOptions
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
        (options.useClass ||
          options.useExisting) as Type<OpenTelemetryOptionsFactory>,
      ];
      return {
        provide: OPENTELEMETRY_MODULE_OPTIONS,
        useFactory: async (optionsFactory: OpenTelemetryOptionsFactory) =>
          optionsFactory.createOpenTelemetryOptions(),
        inject,
      };
    }

    throw new Error(
      "Invalid OpenTelemetry module options: either 'useFactory', 'useClass', or 'useExisting' must be provided."
    );
  }

  /**
   * Returns the asynchrnous providers depending on the given module
   * options
   * @param options Options for the asynchrnous OpenTelemetry module
   */
  private static createAsyncProviders(
    options: OpenTelemetryModuleAsyncOptions
  ): Provider[] {
    if (options.useFactory || options.useExisting) {
      return [OpenTelemetryCoreModule.createAsyncOptionsProvider(options)];
    }
    const useClass = options.useClass as Type<OpenTelemetryOptionsFactory>;
    return [
      OpenTelemetryCoreModule.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }
}
