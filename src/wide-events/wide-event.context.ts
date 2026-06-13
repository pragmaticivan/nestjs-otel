import {
  type AttributeValue,
  context,
  createContextKey,
} from "@opentelemetry/api";

export const WIDE_EVENT_CONTEXT_KEY = createContextKey(
  "nestjs-otel.wide-event"
);

export type WideEventBag = Map<string, AttributeValue>;

export function getWideEventBag(): WideEventBag | undefined {
  return context.active().getValue(WIDE_EVENT_CONTEXT_KEY) as
    | WideEventBag
    | undefined;
}
