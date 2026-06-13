import { context } from "@opentelemetry/api";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import {
  WIDE_EVENT_CONTEXT_KEY,
  type WideEventBag,
} from "./wide-event.context";
import { WideEventService } from "./wide-event.service";

describe("WideEventService", () => {
  let service: WideEventService;
  let bag: WideEventBag;
  let provider: NodeTracerProvider;

  const withBag = <T>(fn: () => T): T =>
    context.with(context.active().setValue(WIDE_EVENT_CONTEXT_KEY, bag), fn);

  beforeAll(() => {
    provider = new NodeTracerProvider();
    provider.register();
  });

  afterAll(async () => {
    await provider.shutdown();
  });

  beforeEach(() => {
    service = new WideEventService();
    bag = new Map();
  });

  describe("set", () => {
    it("should write the attribute to the active bag", () => {
      withBag(() => service.set("user.id", "u-1"));

      expect(bag.get("user.id")).toBe("u-1");
    });

    it("should be a no-op when no bag is active", () => {
      expect(() => service.set("user.id", "u-1")).not.toThrow();

      expect(bag.size).toBe(0);
    });
  });

  describe("setMany", () => {
    it("should write all attributes to the active bag", () => {
      withBag(() => service.setMany({ "user.id": "u-1", "cart.items": 3 }));

      expect(Object.fromEntries(bag)).toEqual({
        "user.id": "u-1",
        "cart.items": 3,
      });
    });

    it("should skip undefined values", () => {
      withBag(() => service.setMany({ "user.id": undefined }));

      expect(bag.size).toBe(0);
    });

    it("should be a no-op when no bag is active", () => {
      expect(() => service.setMany({ "user.id": "u-1" })).not.toThrow();
    });
  });

  describe("increment", () => {
    it("should start from 0 when the attribute is absent", () => {
      withBag(() => service.increment("db.queries"));

      expect(bag.get("db.queries")).toBe(1);
    });

    it("should add to the existing value", () => {
      withBag(() => {
        service.increment("db.queries", 2);
        service.increment("db.queries", 3);
      });

      expect(bag.get("db.queries")).toBe(5);
    });

    it("should reset non-numeric values to 0 before adding", () => {
      bag.set("db.queries", "oops");

      withBag(() => service.increment("db.queries"));

      expect(bag.get("db.queries")).toBe(1);
    });

    it("should be a no-op when no bag is active", () => {
      expect(() => service.increment("db.queries")).not.toThrow();
    });
  });

  describe("startTimer", () => {
    it("should record elapsed milliseconds when stopped", () => {
      withBag(() => {
        const stop = service.startTimer("db.duration_ms");
        stop();
      });

      expect(typeof bag.get("db.duration_ms")).toBe("number");
      expect(bag.get("db.duration_ms")).toBeGreaterThanOrEqual(0);
    });

    it("should be a no-op when stopped without an active bag", () => {
      const stop = service.startTimer("db.duration_ms");

      expect(() => stop()).not.toThrow();
      expect(bag.size).toBe(0);
    });
  });
});
