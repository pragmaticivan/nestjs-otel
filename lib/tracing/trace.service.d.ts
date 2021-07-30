import { Span } from '@opentelemetry/api';
export declare class TraceService {
    getSpan(): Span;
    startSpan(name: string): Span;
}
