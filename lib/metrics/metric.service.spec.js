"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const opentelemetry_module_1 = require("../opentelemetry.module");
const metric_service_1 = require("./metric.service");
describe('MetricService', () => {
    let metricService;
    describe('instance', () => {
        it('creates a new metricService instance', async () => {
            const moduleRef = await testing_1.Test.createTestingModule({
                imports: [opentelemetry_module_1.OpenTelemetryModule.forRoot()],
            }).compile();
            metricService = moduleRef.get(metric_service_1.MetricService);
            expect(metricService).toBeDefined();
        });
        it('creates a meter when new instance is created', async () => {
            const moduleRef = await testing_1.Test.createTestingModule({
                imports: [opentelemetry_module_1.OpenTelemetryModule.forRoot()],
            }).compile();
            metricService = moduleRef.get(metric_service_1.MetricService);
            expect(metricService.getMeter()).toBeDefined();
        });
        it('creates an empty meterData', async () => {
            const moduleRef = await testing_1.Test.createTestingModule({
                imports: [opentelemetry_module_1.OpenTelemetryModule.forRoot()],
            }).compile();
            metricService = moduleRef.get(metric_service_1.MetricService);
            expect(metricService.getMeterData().size).toBe(0);
        });
        it('reuses a meterData set when metricService is called twice', async () => {
            const moduleRef = await testing_1.Test.createTestingModule({
                imports: [opentelemetry_module_1.OpenTelemetryModule.forRoot()],
            }).compile();
            metricService = moduleRef.get(metric_service_1.MetricService);
            const currentMeterData = metricService.getMeterData();
            const newMetricService = moduleRef.get(metric_service_1.MetricService);
            expect(currentMeterData).toBe(newMetricService.getMeterData());
        });
    });
    describe('getCounter', () => {
        it('creates a new counter on meterData on the first time method is called', async () => {
            const moduleRef = await testing_1.Test.createTestingModule({
                imports: [opentelemetry_module_1.OpenTelemetryModule.forRoot()],
            }).compile();
            metricService = moduleRef.get(metric_service_1.MetricService);
            expect(metricService.getMeterData().size).toBe(0);
            const counter = metricService.getCounter('test1');
            counter.add(1);
            const data = metricService.getMeterData();
            expect(data.has('test1')).toBeTruthy();
        });
        it('reuses an existing counter on meterData when method is called twice', async () => {
            const moduleRef = await testing_1.Test.createTestingModule({
                imports: [opentelemetry_module_1.OpenTelemetryModule.forRoot()],
            }).compile();
            metricService = moduleRef.get(metric_service_1.MetricService);
            const counter = metricService.getCounter('test1', { description: 'test1 description' });
            counter.add(1);
            const existingCounter = metricService.getCounter('test1');
            expect(metricService.getMeterData().has('test1')).toBeTruthy();
            expect(existingCounter._options.description).toBe('test1 description');
        });
    });
    describe('getUpDownCounter', () => {
        it('creates a new upDownCounter on meterData on the first time method is called', async () => {
            const moduleRef = await testing_1.Test.createTestingModule({
                imports: [opentelemetry_module_1.OpenTelemetryModule.forRoot()],
            }).compile();
            metricService = moduleRef.get(metric_service_1.MetricService);
            expect(metricService.getMeterData().size).toBe(0);
            const counter = metricService.getUpDownCounter('test1');
            counter.add(1);
            const data = metricService.getMeterData();
            expect(data.has('test1')).toBeTruthy();
        });
        it('reuses an existing upDownCounter on meterData when method is called twice', async () => {
            const moduleRef = await testing_1.Test.createTestingModule({
                imports: [opentelemetry_module_1.OpenTelemetryModule.forRoot()],
            }).compile();
            metricService = moduleRef.get(metric_service_1.MetricService);
            const counter = metricService.getUpDownCounter('test1', { description: 'test1 description' });
            counter.add(1);
            const existingCounter = metricService.getUpDownCounter('test1');
            expect(metricService.getMeterData().has('test1')).toBeTruthy();
            expect(existingCounter._options.description).toBe('test1 description');
        });
    });
    describe('getValueRecorder', () => {
        it('creates a new valueRecorder on meterData on the first time method is called', async () => {
            const moduleRef = await testing_1.Test.createTestingModule({
                imports: [opentelemetry_module_1.OpenTelemetryModule.forRoot()],
            }).compile();
            metricService = moduleRef.get(metric_service_1.MetricService);
            expect(metricService.getMeterData().size).toBe(0);
            const counter = metricService.getValueRecorder('test1');
            counter.clear();
            const data = metricService.getMeterData();
            expect(data.has('test1')).toBeTruthy();
        });
        it('reuses an existing valueRecorder on meterData when method is called twice', async () => {
            const moduleRef = await testing_1.Test.createTestingModule({
                imports: [opentelemetry_module_1.OpenTelemetryModule.forRoot()],
            }).compile();
            metricService = moduleRef.get(metric_service_1.MetricService);
            const counter = metricService.getValueRecorder('test1', { description: 'test1 description' });
            counter.clear();
            const existingCounter = metricService.getValueRecorder('test1');
            expect(metricService.getMeterData().has('test1')).toBeTruthy();
            expect(existingCounter._options.description).toBe('test1 description');
        });
    });
});
//# sourceMappingURL=metric.service.spec.js.map