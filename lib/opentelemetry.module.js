"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var OpenTelemetryModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenTelemetryModule = void 0;
const common_1 = require("@nestjs/common");
const opentelemetry_core_module_1 = require("./opentelemetry-core.module");
let OpenTelemetryModule = OpenTelemetryModule_1 = class OpenTelemetryModule {
    static forRoot(options) {
        return {
            module: OpenTelemetryModule_1,
            imports: [opentelemetry_core_module_1.OpenTelemetryCoreModule.forRoot(options)],
        };
    }
    static forRootAsync(options) {
        return {
            module: OpenTelemetryModule_1,
            imports: [opentelemetry_core_module_1.OpenTelemetryCoreModule.forRootAsync(options)],
        };
    }
};
OpenTelemetryModule = OpenTelemetryModule_1 = __decorate([
    common_1.Module({})
], OpenTelemetryModule);
exports.OpenTelemetryModule = OpenTelemetryModule;
//# sourceMappingURL=opentelemetry.module.js.map