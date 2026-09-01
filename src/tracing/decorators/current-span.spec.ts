import { trace } from "@opentelemetry/api";
import { currentSpanParamFactory } from "./current-span";

describe("CurrentSpan Decorator", () => {
  const mockCtx: any = {};

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return undefined if no span is active", () => {
    vi.spyOn(trace, "getSpan").mockReturnValue(undefined);
    const result = currentSpanParamFactory(undefined, mockCtx);
    expect(result).toBeUndefined();
  });

  it("should return the current span if one is active", () => {
    const mockSpan = { isRecording: () => true } as any;
    vi.spyOn(trace, "getSpan").mockReturnValue(mockSpan);

    const result = currentSpanParamFactory(undefined, mockCtx);
    expect(result).toBe(mockSpan);
  });
});
