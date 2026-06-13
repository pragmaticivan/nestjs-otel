import "reflect-metadata";
import { SetMetadata } from "@nestjs/common";
import { context } from "@opentelemetry/api";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import {
  WIDE_EVENT_CONTEXT_KEY,
  type WideEventBag,
} from "./wide-event.context";
import { WideEventField } from "./wide-event-field.decorator";

const TestDecoratorThatSetsMetadata = () => SetMetadata("some-metadata", true);

class TestService {
  @WideEventField("books.count")
  countBooks() {
    return 3;
  }

  @WideEventField("books.count")
  async countBooksAsync() {
    return 5;
  }

  @WideEventField("order.total", (order: { total: number }) => order.total)
  createOrder() {
    return { total: 42.5 };
  }

  @WideEventField("order.total", () => {
    throw new Error("pick failed");
  })
  createOrderWithFailingPick() {
    return { total: 42.5 };
  }

  @WideEventField("order")
  createObjectWithoutPick() {
    return { total: 42.5 };
  }

  @WideEventField("books.count")
  @TestDecoratorThatSetsMetadata()
  metadata() {
    return 1;
  }
}

describe("WideEventField", () => {
  let instance: TestService;
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
    instance = new TestService();
    bag = new Map();
  });

  it("should record the return value of a sync method", () => {
    const result = withBag(() => instance.countBooks());

    expect(result).toBe(3);
    expect(bag.get("books.count")).toBe(3);
  });

  it("should record the resolved value of an async method", async () => {
    const result = await withBag(() => instance.countBooksAsync());

    expect(result).toBe(5);
    expect(bag.get("books.count")).toBe(5);
  });

  it("should record the picked value", () => {
    const result = withBag(() => instance.createOrder());

    expect(result).toEqual({ total: 42.5 });
    expect(bag.get("order.total")).toBe(42.5);
  });

  it("should not break the method when pick throws", () => {
    const result = withBag(() => instance.createOrderWithFailingPick());

    expect(result).toEqual({ total: 42.5 });
    expect(bag.size).toBe(0);
  });

  it("should skip values that are not valid attribute values", () => {
    const result = withBag(() => instance.createObjectWithoutPick());

    expect(result).toEqual({ total: 42.5 });
    expect(bag.has("order")).toBe(false);
  });

  it("should be a no-op outside a wide event request", () => {
    const result = instance.countBooks();

    expect(result).toBe(3);
    expect(bag.size).toBe(0);
  });

  it("should preserve the original method name", () => {
    expect(instance.countBooks.name).toBe("countBooks");
  });

  it("should maintain reflect metadata", () => {
    expect(Reflect.getMetadata("some-metadata", instance.metadata)).toBe(true);
  });
});
