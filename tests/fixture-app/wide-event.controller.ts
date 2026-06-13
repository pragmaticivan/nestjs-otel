import { Controller, Get } from "@nestjs/common";
// biome-ignore lint/style/useImportType: NestJS DI needs the runtime class for design:paramtypes
import { WideEventService } from "../../src/wide-events/wide-event.service";
import { WideEventField } from "../../src/wide-events/wide-event-field.decorator";

@Controller("wide-event")
export class WideEventController {
  constructor(private readonly wideEventService: WideEventService) {}

  @Get("enrich")
  enrich() {
    this.wideEventService.set("user.id", "u-1");
    this.wideEventService.setMany({ "cart.items": 3, "cart.total": 42.5 });
    this.wideEventService.increment("db.queries");
    this.wideEventService.increment("db.queries");
    return "enriched";
  }

  @Get("timer")
  async timer() {
    const stop = this.wideEventService.startTimer("work.duration_ms");
    await new Promise((resolve) => setTimeout(resolve, 5));
    stop();
    return "timed";
  }

  @Get("error")
  error() {
    this.wideEventService.set("user.id", "u-2");
    throw new Error("wide event error");
  }

  @Get("field")
  @WideEventField("books.count", (books: string[]) => books.length)
  field() {
    return ["Book 1", "Book 2"];
  }
}
