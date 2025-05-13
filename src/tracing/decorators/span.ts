import { Span as ApiSpan, SpanOptions, SpanStatusCode, trace } from '@opentelemetry/api';
import { copyMetadataFromFunctionToFunction } from '../../opentelemetry.utils';

const recordException = (span: ApiSpan, error: any) => {
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
};

export function Span<T extends any[]>(name?: string, options: SpanOptions = {}) {
  return (
    target: any,
    propertyKey: PropertyKey,
    propertyDescriptor: TypedPropertyDescriptor<(...args: T) => any>
  ) => {
    const originalFunction = propertyDescriptor.value;

    if (typeof originalFunction !== 'function') {
      throw new Error(
        `The @Span decorator can be only used on functions, but ${propertyKey.toString()} is not a function.`
      );
    }

    const wrappedFunction = function PropertyDescriptor(this: any, ...args: T) {
      const tracer = trace.getTracer('default');
      const spanName = name || `${target.constructor.name}.${String(propertyKey)}`;

      return tracer.startActiveSpan(spanName, options, span => {
        if (originalFunction.constructor.name === 'AsyncFunction') {
          return originalFunction
            .apply(this, args)
            .catch((error: any) => {
              recordException(span, error);
              // Throw error to propagate it further
              throw error;
            })
            .finally(() => {
              span.end();
            });
        }

        try {
          return originalFunction.apply(this, args);
        } catch (error) {
          recordException(span, error);
          // Throw error to propagate it further
          throw error;
        } finally {
          span.end();
        }
      });
    };

    propertyDescriptor.value = wrappedFunction;

    copyMetadataFromFunctionToFunction(originalFunction, wrappedFunction);
  };
}
