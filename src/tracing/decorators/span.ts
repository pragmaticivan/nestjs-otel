import {
  type Span as ApiSpan,
  type SpanOptions,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";
import { OTEL_TRACER_NAME } from "../../opentelemetry.constants";
import { copyMetadataFromFunctionToFunction } from "../../opentelemetry.utils";

const recordException = (span: ApiSpan, error: any) => {
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
};

type SpanDecoratorOptions<T extends any[]> =
  | SpanOptions
  | ((...args: T) => SpanOptions);

export function Span<T extends any[]>(
  options?: SpanDecoratorOptions<T>
): (
  target: any,
  propertyKey: PropertyKey,
  propertyDescriptor: TypedPropertyDescriptor<(...args: T) => any>
) => void;
export function Span<T extends any[]>(
  name?: string,
  options?: SpanDecoratorOptions<T>
): (
  target: any,
  propertyKey: PropertyKey,
  propertyDescriptor: TypedPropertyDescriptor<(...args: T) => any>
) => void;
export function Span<T extends any[]>(
  nameOrOptions?: string | SpanDecoratorOptions<T>,
  maybeOptions?: SpanDecoratorOptions<T>
) {
  return (
    target: any,
    propertyKey: PropertyKey,
    propertyDescriptor: TypedPropertyDescriptor<(...args: T) => any>
  ) => {
    let name: string;
    let options: SpanDecoratorOptions<T>;
    if (typeof nameOrOptions === "string") {
      name = nameOrOptions;
      options = maybeOptions ?? {};
    } else {
      name = `${target.constructor.name}.${String(propertyKey)}`;
      options = nameOrOptions ?? {};
    }

    const originalFunction = propertyDescriptor.value;

    if (typeof originalFunction !== "function") {
      throw new Error(
        `The @Span decorator can be only used on functions, but ${propertyKey.toString()} is not a function.`
      );
    }

    const wrappedFunction = function PropertyDescriptor(this: any, ...args: T) {
      const tracer = trace.getTracer(OTEL_TRACER_NAME);

      const spanOptions =
        typeof options === "function" ? options(...args) : options;

      return tracer.startActiveSpan(name, spanOptions, (span) => {
        try {
          const result = originalFunction.apply(this, args);

          if (
            result &&
            typeof result.then === "function" &&
            typeof result.catch === "function"
          ) {
            return result
              .catch((error: any) => {
                recordException(span, error);
                // Throw error to propagate it further
                throw error;
              })
              .finally(() => {
                span.end();
              });
          }

          span.end();
          return result;
        } catch (error) {
          recordException(span, error);
          span.end();
          // Throw error to propagate it further
          throw error;
        }
      });
    };

    // Wrap the original function in a proxy to ensure that the function name is preserved.
    // This should also preserve parameters for OpenAPI and other libraries
    // that rely on the function name as metadata key.
    propertyDescriptor.value = new Proxy(originalFunction, {
      apply: (_, thisArg, args: T) => wrappedFunction.apply(thisArg, args),
    });

    copyMetadataFromFunctionToFunction(
      originalFunction,
      propertyDescriptor.value
    );
  };
}
