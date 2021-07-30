"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Span = void 0;
const api_1 = require("@opentelemetry/api");
function Span(param = {}) {
    const { name, setStatus = true } = param;
    return (target, propertyKey, propertyDescriptor) => {
        const method = propertyDescriptor.value;
        propertyDescriptor.value = function PropertyDescriptor(...args) {
            const tracer = api_1.trace.getTracer('default');
            const span = tracer.startSpan(name || `${target.constructor.name}.${propertyKey}`);
            return api_1.context.with(api_1.trace.setSpan(api_1.context.active(), span), () => {
                if (method.constructor.name === 'AsyncFunction') {
                    return method.apply(this, args)
                        .then((r) => {
                        if (setStatus) {
                            span.setStatus({ code: api_1.SpanStatusCode.OK });
                        }
                        return r;
                    })
                        .catch((e) => {
                        if (setStatus) {
                            span.setStatus({ code: api_1.SpanStatusCode.ERROR, message: e.message });
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
exports.Span = Span;
//# sourceMappingURL=span.js.map