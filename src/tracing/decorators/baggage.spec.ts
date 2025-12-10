import { propagation } from "@opentelemetry/api";
import { baggageParamFactory } from "./baggage";

describe("Baggage Decorator", () => {
  // Mock ExecutionContext as it's not used in the factory but required by type
  const mockCtx: any = {};

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return undefined if no baggage is present", () => {
    jest.spyOn(propagation, "getBaggage").mockReturnValue(undefined);
    const result = baggageParamFactory(undefined, mockCtx);
    expect(result).toBeUndefined();
  });

  it("should return the full baggage object if no key is provided", () => {
    const baggage = propagation.createBaggage({
      "test-key": { value: "test-value" },
    });
    jest.spyOn(propagation, "getBaggage").mockReturnValue(baggage);

    const result = baggageParamFactory(undefined, mockCtx);
    expect(result).toBeDefined();
    // @ts-expect-error
    expect(result.getEntry("test-key")?.value).toBe("test-value");
  });

  it("should return a specific value if key is provided", () => {
    const baggage = propagation.createBaggage({
      "test-key": { value: "test-value" },
    });
    jest.spyOn(propagation, "getBaggage").mockReturnValue(baggage);

    const result = baggageParamFactory("test-key", mockCtx);
    expect(result).toBe("test-value");
  });

  it("should return undefined if key is provided but not in baggage", () => {
    const baggage = propagation.createBaggage({
      "other-key": { value: "other-value" },
    });
    jest.spyOn(propagation, "getBaggage").mockReturnValue(baggage);

    const result = baggageParamFactory("test-key", mockCtx);
    expect(result).toBeUndefined();
  });
});
