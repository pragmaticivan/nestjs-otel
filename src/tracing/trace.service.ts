import { context, trace, Span } from '@opentelemetry/api';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TraceService {
  public getTracer() {
    return trace.getTracer('default');
  }

  public getSpan(): Span {
    return trace.getSpan(context.active());
  }

  public startSpan(name: string): Span {
    return this.getTracer().startSpan(name);
  }
}
