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
exports.ApiMetricsMiddleware = exports.DEFAULT_LONG_RUNNING_REQUEST_BUCKETS = void 0;
const common_1 = require("@nestjs/common");
const responseTime = require("response-time");
const urlParser = require("url");
const metric_service_1 = require("../metrics/metric.service");
const opentelemetry_constants_1 = require("../opentelemetry.constants");
exports.DEFAULT_LONG_RUNNING_REQUEST_BUCKETS = [
    0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
    30, 60, 120, 300, 600,
];
let ApiMetricsMiddleware = class ApiMetricsMiddleware {
    constructor(options = {}, metricService) {
        this.options = options;
        this.metricService = metricService;
        this.defaultLongRunningRequestBuckets = exports.DEFAULT_LONG_RUNNING_REQUEST_BUCKETS;
        this.requestTotal = this.metricService.getCounter('http_request_total', {
            description: 'Total number of HTTP requests',
        });
        this.responseTotal = this.metricService.getCounter('http_response_total', {
            description: 'Total number of HTTP responses',
        });
        this.responseSuccessTotal = this.metricService.getCounter('http_response_success_total', {
            description: 'Total number of all successful responses',
        });
        this.responseErrorTotal = this.metricService.getCounter('http_response_error_total', {
            description: 'Total number of all response errors',
        });
        this.responseClientErrorTotal = this.metricService.getCounter('http_client_error_total', {
            description: 'Total number of client error requests',
        });
        this.responseServerErrorTotal = this.metricService.getCounter('http_server_error_total', {
            description: 'Total number of server error requests',
        });
        const { timeBuckets = [] } = options?.metrics?.apiMetrics;
        this.requestDuration = this.metricService.getValueRecorder('http_request_duration_seconds', {
            boundaries: timeBuckets.length > 0 ? timeBuckets : this.defaultLongRunningRequestBuckets,
            description: 'HTTP latency value recorder in seconds',
        });
    }
    use(req, res, next) {
        responseTime((req, res, time) => {
            const { route, url, method } = req;
            let path;
            if (route) {
                path = route.path;
            }
            else {
                path = urlParser.parse(url).pathname;
            }
            if (path === '/favicon.ico') {
                return;
            }
            const metricPath = '/metrics';
            if (path === metricPath) {
                return;
            }
            this.requestTotal.bind({ method, path }).add(1);
            const status = res.statusCode || 500;
            const labels = { method, status, path };
            this.countResponse(status, labels, time);
        })(req, res, next);
    }
    countResponse(statusCode, labels, time) {
        this.responseTotal.bind(labels).add(1);
        this.requestDuration.bind(labels).record(time / 1000);
        const codeClass = this.getStatusCodeClass(statusCode);
        switch (codeClass) {
            case 'success':
                this.responseSuccessTotal.add(1);
                break;
            case 'redirect':
                this.responseSuccessTotal.add(1);
                break;
            case 'client_error':
                this.responseErrorTotal.add(1);
                this.responseClientErrorTotal.add(1);
                break;
            case 'server_error':
                this.responseErrorTotal.add(1);
                this.responseServerErrorTotal.add(1);
                break;
        }
    }
    getStatusCodeClass(code) {
        if (code < 200)
            return 'info';
        if (code < 300)
            return 'success';
        if (code < 400)
            return 'redirect';
        if (code < 500)
            return 'client_error';
        return 'server_error';
    }
};
ApiMetricsMiddleware = __decorate([
    common_1.Injectable(),
    __param(0, common_1.Inject(opentelemetry_constants_1.OPENTELEMETRY_MODULE_OPTIONS)),
    __param(1, common_1.Inject(metric_service_1.MetricService)),
    __metadata("design:paramtypes", [Object, metric_service_1.MetricService])
], ApiMetricsMiddleware);
exports.ApiMetricsMiddleware = ApiMetricsMiddleware;
//# sourceMappingURL=api-metrics.middleware.js.map