import { Span as ApiSpan, SpanOptions, SpanStatusCode, trace } from '@opentelemetry/api';
import { copyMetadataFromFunctionToFunction } from '../../opentelemetry.utils';
import { TRACER } from '../constants';

const recordException = (span: ApiSpan, error: any) => {
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
};

export function Span(name?: string, options: SpanOptions = {}) {
  return (target: any, propertyKey: string, propertyDescriptor: PropertyDescriptor) => {
    const originalFunction = propertyDescriptor.value;
    const wrappedFunction = function PropertyDescriptor(...args: any[]) {
      const tracer = trace.getTracer(TRACER);
      const spanName = name || `${target.constructor.name}.${propertyKey}`;

      return tracer.startActiveSpan(spanName, options, span => {
        if (originalFunction.constructor.name === 'AsyncFunction') {
          return originalFunction
            .apply(this, args)
            .catch(error => {
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
    // eslint-disable-next-line no-param-reassign
    propertyDescriptor.value = wrappedFunction;

    copyMetadataFromFunctionToFunction(originalFunction, wrappedFunction);
  };
}
