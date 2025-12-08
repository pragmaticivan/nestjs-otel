import { Injectable } from "@nestjs/common";
import { context, type Span, trace } from "@opentelemetry/api";

@Injectable()
export class TraceService {
  public getTracer() {
    return trace.getTracer("default");
  }

  public getSpan(): Span | undefined {
    return trace.getSpan(context.active());
  }

  public startSpan(name: string): Span {
    return this.getTracer().startSpan(name);
  }
}
