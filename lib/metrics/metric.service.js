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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricService = exports.MetricType = void 0;
const common_1 = require("@nestjs/common");
const metrics_1 = require("@opentelemetry/metrics");
const opentelemetry_constants_1 = require("../opentelemetry.constants");
var MetricType;
(function (MetricType) {
    MetricType["Counter"] = "Counter";
    MetricType["UpDownCounter"] = "UpDownCounter";
    MetricType["ValueRecorder"] = "ValueRecorder";
})(MetricType = exports.MetricType || (exports.MetricType = {}));
let MetricService = class MetricService {
    constructor(meterProvider) {
        this.meterProvider = meterProvider;
        this.meterData = new Map();
        this.meter = this.meterProvider.getMeter('metrics');
    }
    getCounter(name, options) {
        return this.getOrCreateCounter(name, MetricType.Counter, options);
    }
    getUpDownCounter(name, options) {
        return this.getOrCreateCounter(name, MetricType.UpDownCounter, options);
    }
    getValueRecorder(name, options) {
        return this.getOrCreateValueRecorder(name, MetricType.ValueRecorder, options);
    }
    getMeterData() {
        return this.meterData;
    }
    getMeter() {
        return this.meter;
    }
    getOrCreateValueRecorder(name, type, options) {
        if (this.meterData.has(name)) {
            return this.meterData.get(name);
        }
        switch (type) {
            case MetricType.ValueRecorder:
                const valueRecorder = this.meter.createValueRecorder(name, options);
                this.meterData.set(name, valueRecorder);
                return valueRecorder;
            default:
                throw new Error(`Unknown type: ${type}`);
        }
    }
    getOrCreateCounter(name, type, options) {
        if (this.meterData.has(name)) {
            return this.meterData.get(name);
        }
        switch (type) {
            case MetricType.Counter:
                const counter = this.meter.createCounter(name, options);
                this.meterData.set(name, counter);
                return counter;
            case MetricType.UpDownCounter:
                const upDownCounter = this.meter.createUpDownCounter(name, options);
                this.meterData.set(name, upDownCounter);
                return upDownCounter;
            default:
                throw new Error(`Unknown type: ${type}`);
        }
    }
};
MetricService = __decorate([
    common_1.Injectable(),
    __param(0, common_1.Inject(opentelemetry_constants_1.OPENTELEMETRY_METER_PROVIDER)),
    __metadata("design:paramtypes", [metrics_1.MeterProvider])
], MetricService);
exports.MetricService = MetricService;
//# sourceMappingURL=metric.service.js.map