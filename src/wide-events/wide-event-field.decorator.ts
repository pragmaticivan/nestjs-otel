import type { AttributeValue } from "@opentelemetry/api";
import { copyMetadataFromFunctionToFunction } from "../opentelemetry.utils";
import { getWideEventBag } from "./wide-event.context";

const isAttributeValue = (value: unknown): value is AttributeValue =>
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "boolean" ||
  Array.isArray(value);

const record = (
  key: string,
  pick: ((result: any) => AttributeValue) | undefined,
  result: unknown
): void => {
  const bag = getWideEventBag();
  if (!bag) {
    return;
  }
  try {
    const value = pick ? pick(result) : result;
    if (isAttributeValue(value)) {
      bag.set(key, value);
    }
  } catch {
    // a failing pick must never break the decorated method
  }
};

/**
 * Captures the decorated method's return value (resolved value for async
 * methods) as an attribute on the current wide event.
 *
 * No-op when called outside a request handled by the WideEventInterceptor,
 * when `pick` throws, or when the value is not a valid attribute value.
 *
 * @param key The wide event attribute key.
 * @param pick Optional projection of the return value to an attribute value.
 *
 * @publicApi
 */
export function WideEventField<T = any>(
  key: string,
  pick?: (result: T) => AttributeValue
) {
  return (
    _target: any,
    propertyKey: PropertyKey,
    propertyDescriptor: TypedPropertyDescriptor<(...args: any[]) => any>
  ) => {
    const originalFunction = propertyDescriptor.value;

    if (typeof originalFunction !== "function") {
      throw new Error(
        `The @WideEventField decorator can be only used on functions, but ${propertyKey.toString()} is not a function.`
      );
    }

    const wrappedFunction = function WideEventFieldWrapper(
      this: any,
      ...args: any[]
    ) {
      const result = originalFunction.apply(this, args);

      if (result instanceof Promise) {
        return result.then((resolved: unknown) => {
          record(key, pick, resolved);
          return resolved;
        });
      }

      record(key, pick, result);
      return result;
    };

    propertyDescriptor.value = new Proxy(originalFunction, {
      apply: (_, thisArg, args: any[]) => wrappedFunction.apply(thisArg, args),
    });

    copyMetadataFromFunctionToFunction(
      originalFunction,
      propertyDescriptor.value
    );
  };
}
