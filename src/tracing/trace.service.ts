import { Injectable } from "@nestjs/common";
import { context, type Span, trace } from "@opentelemetry/api";
import { OTEL_TRACER_NAME } from "../opentelemetry.constants";

@Injectable()
export class TraceService {
  public getTracer() {
    return trace.getTracer(OTEL_TRACER_NAME);
  }

  public getSpan(): Span | undefined {
    return trace.getSpan(context.active());
  }

  public startSpan(name: string): Span {
    return this.getTracer().startSpan(name);
  }
}
