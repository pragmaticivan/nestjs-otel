import { Injectable } from "@nestjs/common";
import type { Attributes, AttributeValue } from "@opentelemetry/api";
import { getWideEventBag } from "./wide-event.context";

/**
 * Accumulates attributes for the wide event of the current request.
 *
 * All methods are no-ops when called outside a request handled by the
 * WideEventInterceptor.
 *
 * @publicApi
 */
@Injectable()
export class WideEventService {
  /**
   * Set a single attribute on the current wide event.
   */
  set(key: string, value: AttributeValue): void {
    getWideEventBag()?.set(key, value);
  }

  /**
   * Set multiple attributes on the current wide event.
   */
  setMany(attributes: Attributes): void {
    const bag = getWideEventBag();
    if (!bag) {
      return;
    }
    for (const [key, value] of Object.entries(attributes)) {
      if (value !== undefined) {
        bag.set(key, value);
      }
    }
  }

  /**
   * Increment a numeric attribute on the current wide event.
   * Starts from 0 when the attribute is absent or not a number.
   */
  increment(key: string, by = 1): void {
    const bag = getWideEventBag();
    if (!bag) {
      return;
    }
    const current = bag.get(key);
    bag.set(key, (typeof current === "number" ? current : 0) + by);
  }

  /**
   * Start a timer for the given attribute. The returned function stops
   * the timer and records the elapsed time in milliseconds.
   */
  startTimer(key: string): () => void {
    const start = performance.now();
    return () => {
      getWideEventBag()?.set(key, performance.now() - start);
    };
  }
}
