import { context, SpanStatusCode, trace } from '@opentelemetry/api';

type Param = {
  name?: string;
  setStatus?: boolean;
};

export function Span(param: Param = {}) {
  const { name, setStatus = true } = param;
  return (
    target: any,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor,
  ) => {
    const method = propertyDescriptor.value;
    // eslint-disable-next-line no-param-reassign
    propertyDescriptor.value = function PropertyDescriptor(...args: any[]) {
      const tracer = trace.getTracer('default');
      const span = tracer.startSpan(
        name || `${target.constructor.name}.${propertyKey}`,
      );

      return context.with(trace.setSpan(context.active(), span), () => {
        if (method.constructor.name === 'AsyncFunction') {
          return method.apply(this, args)
            .then((r) => {
              if (setStatus) {
                span.setStatus({ code: SpanStatusCode.OK });
              }
              return r;
            })
            .catch((e) => {
              if (setStatus) {
                span.setStatus({ code: SpanStatusCode.ERROR, message: e.message });
              }
              throw e;
            })
            .finally(() => {
              span.end();
            });
        }
        const result = method.apply(this, args);
        span.end();
        return result;
      });
    };
  };
}
