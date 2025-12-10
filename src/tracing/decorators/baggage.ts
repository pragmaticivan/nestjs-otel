import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import { context, propagation } from "@opentelemetry/api";

export const baggageParamFactory = (
  key: string | undefined,
  _ctx: ExecutionContext
) => {
  const baggage = propagation.getBaggage(context.active());

  if (!baggage) {
    return;
  }

  if (key) {
    return baggage.getEntry(key)?.value;
  }

  return baggage;
};

/**
 * Decorator to retrieve OpenTelemetry Baggage from the active context.
 *
 * @param key (Optional) The specific baggage key to retrieve.
 *            If provided, returns the value (string) of that key.
 *            If not provided, returns the entire Baggage object.
 */
export const Baggage = createParamDecorator(baggageParamFactory);
