import type { SpanOptions } from "@opentelemetry/api";
import { Span } from "./span";

/**
 * Decorator that applies the @Span decorator to all methods of a class.
 *
 * @param options SpanOptions to be applied to all methods
 */
export function Traceable(options?: SpanOptions) {
  return (target: any) => {
    for (const propertyKey of Object.getOwnPropertyNames(target.prototype)) {
      if (propertyKey === "constructor") {
        continue;
      }

      const descriptor = Object.getOwnPropertyDescriptor(
        target.prototype,
        propertyKey
      );

      if (descriptor && typeof descriptor.value === "function") {
        // Apply Span decorator
        // Span() returns a decorator function: (target, propertyKey, descriptor) => void
        Span(options)(target.prototype, propertyKey, descriptor);

        // Re-define the property with the modified descriptor
        Object.defineProperty(target.prototype, propertyKey, descriptor);
      }
    }
  };
}
