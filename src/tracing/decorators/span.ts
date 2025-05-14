import { Span as ApiSpan, SpanOptions, SpanStatusCode, trace } from '@opentelemetry/api';
import { copyMetadataFromFunctionToFunction } from '../../opentelemetry.utils';

const recordException = (span: ApiSpan, error: any) => {
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
};

export function Span(name?: string, options: SpanOptions = {}) {
  return (target: any, propertyKey: PropertyKey, propertyDescriptor: PropertyDescriptor) => {
    const originalFunction = propertyDescriptor.value;
    const wrappedFunction = function PropertyDescriptor(...args: any[]) {
      const tracer = trace.getTracer('default');
      const spanName = name || `${target.constructor.name}.${String(propertyKey)}`;

      return tracer.startActiveSpan(spanName, options, span => {
        if (originalFunction.constructor.name === 'AsyncFunction') {
          return (
            originalFunction
              // @ts-ignore
              .apply(this, args)
              // @ts-ignore
              .catch(error => {
                recordException(span, error);
                // Throw error to propagate it further
                throw error;
              })
              .finally(() => {
                span.end();
              })
          );
        }

        try {
          // @ts-ignore
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

    // Wrap the original function in a proxy to ensure that the function name is preserved.
    // This should also preserve parameters for OpenAPI and other libraries
    // that rely on the function name as metadata key.
    propertyDescriptor.value = new Proxy(originalFunction, {
      apply: (_, thisArg, args: any[]) => {
        return wrappedFunction.apply(thisArg, args);
      },
    });

    copyMetadataFromFunctionToFunction(originalFunction, propertyDescriptor.value);
  };
}
