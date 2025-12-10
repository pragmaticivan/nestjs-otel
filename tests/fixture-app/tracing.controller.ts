import { Controller, Get } from "@nestjs/common";
import type { Span as ApiSpan } from "@opentelemetry/api";
import { Baggage } from "../../src/tracing/decorators/baggage";
import { CurrentSpan } from "../../src/tracing/decorators/current-span";
import { Span } from "../../src/tracing/decorators/span";
import { Traceable } from "../../src/tracing/decorators/traceable";

@Controller("tracing")
export class TracingController {
  @Get("span")
  @Span()
  span() {
    return "span";
  }

  @Get("span-with-name")
  @Span("custom-span-name")
  spanWithName() {
    return "span-with-name";
  }

  @Get("span-on-result")
  @Span({
    onResult: (result) => ({ attributes: { result } }),
  })
  spanOnResult() {
    return "success";
  }

  @Get("current-span")
  @Span()
  currentSpan(@CurrentSpan() span: ApiSpan) {
    span.setAttribute("custom.attribute", "value");
    return "current-span";
  }

  @Get("baggage")
  baggage(@Baggage("test-baggage") baggageValue: string) {
    return { baggageValue };
  }
}

@Traceable()
@Controller("traceable")
export class TraceableController {
  @Get("method")
  method() {
    return "traceable-method";
  }
}
