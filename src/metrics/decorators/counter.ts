import { MetricOptions } from '@opentelemetry/api-metrics';
import { MetricService } from '../metric.service';
import { getToken } from '../utils';

export const OpenTelemetryCounter = (name: string,
  options?: MetricOptions) => ({
  provide: getToken(name),
  useFactory(metricService: MetricService) {
    return metricService.getCounter(name, options);
  },
  inject: [MetricService],
});
