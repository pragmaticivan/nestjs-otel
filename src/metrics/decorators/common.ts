import { Counter, MetricOptions } from '@opentelemetry/api-metrics';
import { getOrCreateCounter, getOrCreateValueRecorder, MetricType } from '../metric-data';

/**
 * Create and increment a counter when a new instance is created
 *
 * @param ctor
 */
export const OtelInstanceCounter = (
  options?: MetricOptions,
) => <T extends { new(...args: any[]): {} }>(ctor: T) => {
  const name = `app_${ctor.name}_instances_total`;
  const description = `app_${ctor.name} object instances total`;
  let counterMetric: Counter;

  return class extends ctor {
    constructor(...args) {
      if (!counterMetric) {
        counterMetric = getOrCreateCounter(name, MetricType.Counter, { description, ...options });
      }

      counterMetric.add(1);
      super(...args);
    }
  };
};

/**
 * Create and increment a counter when the method is called
 */
export const OtelMethodCounter = (
  options?: MetricOptions,
) => (
  target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<(...args: any[]
  ) => any>,
) => {
  const className = target.constructor.name;
  const name = `app_${className}_${propertyKey.toString()}_calls_total`;
  const description = `app_${className}#${propertyKey.toString()} called total`;
  let counterMetric: Counter;
  const methodFunc = descriptor.value;
  // eslint-disable-next-line no-param-reassign
  descriptor.value = function (...args: any[]) {
    if (!counterMetric) {
      counterMetric = getOrCreateCounter(name, MetricType.Counter, { description, ...options });
    }
    counterMetric.add(1);
    return methodFunc.apply(this, args);
  };
};
