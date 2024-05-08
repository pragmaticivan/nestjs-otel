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

    propertyDescriptor.value = wrappedFunction;

    copyMetadataFromFunctionToFunction(originalFunction, wrappedFunction);
  };
}
