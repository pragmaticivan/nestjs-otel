import { Counter, MetricOptions } from '@opentelemetry/api-metrics';
import { copyMetadataFromFunctionToFunction } from '../../opentelemetry.utils';
import { getOrCreateCounter } from '../metric-data';

/**
 * Create and increment a counter when a new instance is created
 *
 * @param originalClass
 */
export const OtelInstanceCounter = (options?: MetricOptions) => <
  T extends { new (...args: any[]): {} },
>(
    originalClass: T,
  ) => {
  const name = `app_${originalClass.name}_instances_total`;
  const description = `app_${originalClass.name} object instances total`;
  let counterMetric: Counter;

  const wrappedClass = class extends originalClass {
    constructor(...args) {
      if (!counterMetric) {
        counterMetric = getOrCreateCounter(name, { description, ...options });
      }

      counterMetric.add(1);
      super(...args);
    }
  };

  copyMetadataFromFunctionToFunction(originalClass, wrappedClass);

  return wrappedClass;
};

/**
 * Create and increment a counter when the method is called
 */
export const OtelMethodCounter = (options?: MetricOptions) => (
  target: Object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<(...args: any[]) => any>,
) => {
  const className = target.constructor.name;
  const name = `app_${className}_${propertyKey.toString()}_calls_total`;
  const description = `app_${className}#${propertyKey.toString()} called total`;
  let counterMetric: Counter;

  const originalFunction = descriptor.value;

  const wrappedFunction = function PropertyDescriptor(...args: any[]) {
    if (!counterMetric) {
      counterMetric = getOrCreateCounter(name, { description, ...options });
    }
    counterMetric.add(1);
    return originalFunction.apply(this, args);
  };
  // eslint-disable-next-line no-param-reassign, func-names
  descriptor.value = wrappedFunction;

  copyMetadataFromFunctionToFunction(originalFunction, wrappedFunction);
};
