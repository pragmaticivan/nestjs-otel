"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var OpenTelemetryCoreModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenTelemetryCoreModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const host_metrics_1 = require("@opentelemetry/host-metrics");
const metrics_1 = require("@opentelemetry/metrics");
const nodeMetrics = require("opentelemetry-node-metrics");
const api_metrics_1 = require("@opentelemetry/api-metrics");
const sdk_node_1 = require("@opentelemetry/sdk-node");
const metric_service_1 = require("./metrics/metric.service");
const middleware_1 = require("./middleware");
const opentelemetry_constants_1 = require("./opentelemetry.constants");
const trace_service_1 = require("./tracing/trace.service");
const opentelemetry_module_1 = require("./opentelemetry.module");
let OpenTelemetryCoreModule = OpenTelemetryCoreModule_1 = class OpenTelemetryCoreModule {
    constructor(options = {}, moduleRef) {
        this.options = options;
        this.moduleRef = moduleRef;
        this.logger = new common_1.Logger('OpenTelemetryModule');
    }
    static forRoot(options = { metrics: {} }) {
        const openTelemetryModuleOptions = {
            provide: opentelemetry_constants_1.OPENTELEMETRY_MODULE_OPTIONS,
            useValue: options,
        };
        return {
            module: OpenTelemetryCoreModule_1,
            providers: [
                openTelemetryModuleOptions,
                this.createNodeSDKProvider(),
                this.createMeterProvider(),
                trace_service_1.TraceService,
                metric_service_1.MetricService,
            ],
            exports: [
                trace_service_1.TraceService,
                metric_service_1.MetricService,
            ],
            global: options.isGlobal,
        };
    }
    static forRootAsync(options) {
        const asyncProviders = this.createAsyncProviders(options);
        return {
            module: opentelemetry_module_1.OpenTelemetryModule,
            imports: [...(options.imports || [])],
            providers: [
                ...asyncProviders,
                this.createNodeSDKProvider(),
                this.createMeterProvider(),
                trace_service_1.TraceService,
                metric_service_1.MetricService,
            ],
            exports: [
                trace_service_1.TraceService,
                metric_service_1.MetricService,
            ],
        };
    }
    configure(consumer) {
        const { apiMetrics = { enable: false }, } = this.options?.metrics;
        if (apiMetrics.enable === true) {
            consumer.apply(middleware_1.ApiMetricsMiddleware).forRoutes('*');
        }
    }
    async onApplicationBootstrap() {
        const nodeOtelSDK = this.moduleRef.get(opentelemetry_constants_1.OPENTELEMETRY_SDK);
        const meterProvider = this.moduleRef.get(opentelemetry_constants_1.OPENTELEMETRY_METER_PROVIDER);
        try {
            this.logger.log('NestJS OpenTelemetry starting');
            await nodeOtelSDK.start();
            api_metrics_1.metrics.setGlobalMeterProvider(meterProvider);
        }
        catch (e) {
            this.logger.error(e?.message);
        }
    }
    async onApplicationShutdown() {
        const nodeOtelSDK = this.moduleRef.get(opentelemetry_constants_1.OPENTELEMETRY_SDK);
        try {
            await nodeOtelSDK.shutdown();
        }
        catch (e) {
            this.logger.error(e?.message);
        }
    }
    static createNodeSDKProvider() {
        return {
            provide: opentelemetry_constants_1.OPENTELEMETRY_SDK,
            useFactory: (options) => {
                const sdk = new sdk_node_1.NodeSDK({ ...options.nodeSDKConfiguration });
                return sdk;
            },
            inject: [opentelemetry_constants_1.OPENTELEMETRY_MODULE_OPTIONS],
        };
    }
    static createMeterProvider() {
        return {
            provide: opentelemetry_constants_1.OPENTELEMETRY_METER_PROVIDER,
            useFactory: (options) => {
                let defaultMetrics;
                let hostMetrics;
                if (options?.metrics) {
                    defaultMetrics = options.metrics.defaultMetrics
                        !== undefined ? options.metrics.defaultMetrics : false;
                    hostMetrics = options.metrics.hostMetrics
                        !== undefined ? options.metrics.hostMetrics : false;
                }
                const meterProvider = new metrics_1.MeterProvider({
                    interval: 1000,
                    exporter: options?.nodeSDKConfiguration?.metricExporter,
                });
                if (defaultMetrics) {
                    nodeMetrics(meterProvider);
                }
                if (hostMetrics) {
                    const host = new host_metrics_1.HostMetrics({ meterProvider, name: 'host-metrics' });
                    host.start();
                }
                return meterProvider;
            },
            inject: [opentelemetry_constants_1.OPENTELEMETRY_MODULE_OPTIONS],
        };
    }
    static createAsyncOptionsProvider(options) {
        if (options.useFactory) {
            return {
                provide: opentelemetry_constants_1.OPENTELEMETRY_MODULE_OPTIONS,
                useFactory: options.useFactory,
                inject: options.inject || [],
            };
        }
        if (options.useClass || options.useExisting) {
            const inject = [
                (options.useClass || options.useExisting),
            ];
            return {
                provide: opentelemetry_constants_1.OPENTELEMETRY_MODULE_OPTIONS,
                useFactory: async (optionsFactory) => optionsFactory.createOpenTelemetryOptions(),
                inject,
            };
        }
        throw new Error();
    }
    static createAsyncProviders(options) {
        if (options.useFactory || options.useExisting) {
            return [this.createAsyncOptionsProvider(options)];
        }
        const useClass = options.useClass;
        return [
            this.createAsyncOptionsProvider(options),
            {
                provide: useClass,
                useClass,
                inject: [...(options.inject || [])],
            },
        ];
    }
};
OpenTelemetryCoreModule = OpenTelemetryCoreModule_1 = __decorate([
    common_1.Module({}),
    __param(0, common_1.Inject(opentelemetry_constants_1.OPENTELEMETRY_MODULE_OPTIONS)),
    __metadata("design:paramtypes", [Object, core_1.ModuleRef])
], OpenTelemetryCoreModule);
exports.OpenTelemetryCoreModule = OpenTelemetryCoreModule;
//# sourceMappingURL=opentelemetry-core.module.js.map