import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import { context, trace } from "@opentelemetry/api";

export const currentSpanParamFactory = (
  _data: unknown,
  _ctx: ExecutionContext
) => {
  const span = trace.getSpan(context.active());
  return span;
};

/**
 * Decorator to retrieve the current OpenTelemetry Span from the active context.
 *
 * @returns The current Span or undefined if no span is active.
 */
export const CurrentSpan = createParamDecorator(currentSpanParamFactory);
