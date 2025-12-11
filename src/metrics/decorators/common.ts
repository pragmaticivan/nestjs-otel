import type { Counter } from "@opentelemetry/api";
import type { OtelMetricOptions } from "../../interfaces/metric-options.interface";
import { copyMetadataFromFunctionToFunction } from "../../opentelemetry.utils";
import { getOrCreateCounter } from "../metric-data";

/**
 * Create and increment a counter when a new instance is created
 *
 * @param originalClass
 */
export const OtelInstanceCounter =
  (options?: OtelMetricOptions & { name?: string }) =>
  <T extends { new (...args: any[]): {} }>(originalClass: T) => {
    const name = options?.name || `app.${originalClass.name}.instances.total`;
    const description =
      options?.description ||
      `app.${originalClass.name} object instances total`;
    let counterMetric: Counter;

    const wrappedClass = class extends originalClass {
      constructor(...args: any[]) {
        if (!counterMetric) {
          counterMetric = getOrCreateCounter(name, { description, ...options });
        }

        counterMetric.add(1);
        super(...args);
      }
    };
    Object.defineProperty(wrappedClass, "name", { value: originalClass.name });

    copyMetadataFromFunctionToFunction(originalClass, wrappedClass);

    return wrappedClass;
  };

/**
 * Create and increment a counter when the method is called
 */
export const OtelMethodCounter =
  (options?: OtelMetricOptions & { name?: string }) =>
  (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => any>
  ) => {
    const className = target.constructor.name;
    const name =
      options?.name || `app.${className}.${propertyKey.toString()}.calls.total`;
    const description =
      options?.description ||
      `app.${className}#${propertyKey.toString()} called total`;
    let counterMetric: Counter;

    const originalFunction = descriptor.value;
    if (!originalFunction) {
      return;
    }

    const wrappedFunction = function PropertyDescriptor(
      this: any,
      ...args: any[]
    ) {
      if (!counterMetric) {
        counterMetric = getOrCreateCounter(name, { description, ...options });
      }
      counterMetric.add(1);
      return originalFunction.apply(this, args);
    };
    descriptor.value = new Proxy(originalFunction, {
      apply: (_, thisArg, args: any[]) => wrappedFunction.apply(thisArg, args),
    });

    copyMetadataFromFunctionToFunction(originalFunction, descriptor.value);
  };
