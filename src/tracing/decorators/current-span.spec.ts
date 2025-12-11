import { trace } from "@opentelemetry/api";
import { currentSpanParamFactory } from "./current-span";

describe("CurrentSpan Decorator", () => {
  const mockCtx: any = {};

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return undefined if no span is active", () => {
    jest.spyOn(trace, "getSpan").mockReturnValue(undefined);
    const result = currentSpanParamFactory(undefined, mockCtx);
    expect(result).toBeUndefined();
  });

  it("should return the current span if one is active", () => {
    const mockSpan = { isRecording: () => true } as any;
    jest.spyOn(trace, "getSpan").mockReturnValue(mockSpan);

    const result = currentSpanParamFactory(undefined, mockCtx);
    expect(result).toBe(mockSpan);
  });
});
