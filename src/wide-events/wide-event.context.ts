import {
  type AttributeValue,
  context,
  createContextKey,
} from "@opentelemetry/api";

export const WIDE_EVENT_CONTEXT_KEY = createContextKey(
  "nestjs-otel.wide-event"
);

export const WIDE_EVENT_ROOT_SPAN = Symbol("nestjs-otel.wide-event.root-span");

export type WideEventBag = Map<string, AttributeValue>;

export function getWideEventBag(): WideEventBag | undefined {
  return context.active().getValue(WIDE_EVENT_CONTEXT_KEY) as
    | WideEventBag
    | undefined;
}
