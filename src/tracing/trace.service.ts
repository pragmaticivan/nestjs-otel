import { context, trace, Span } from '@opentelemetry/api';
import { Injectable } from '@nestjs/common';

const TRACER = 'default';

@Injectable()
export class TraceService {
  public getTracer() {
    return trace.getTracer(TRACER);
  }

  public getActiveSpan(): Span | undefined {
    return trace.getSpan(context.active());
  }

  /** @deprecated use getActiveSpan method instead */
  public getSpan(): Span | undefined {
    return this.getActiveSpan();
  }

  public startSpan(name: string): Span {
    return this.getTracer().startSpan(name);
  }
}
