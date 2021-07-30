"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenTelemetryCounter = void 0;
const metric_service_1 = require("../metric.service");
const utils_1 = require("../utils");
const OpenTelemetryCounter = (name, options) => ({
    provide: utils_1.getToken(name),
    useFactory(metricService) {
        return metricService.getCounter(name, options);
    },
    inject: [metric_service_1.MetricService],
});
exports.OpenTelemetryCounter = OpenTelemetryCounter;
//# sourceMappingURL=counter.js.map