/** biome-ignore-all lint/style/useImportType: backward compatibility */
import { Controller, Get } from "@nestjs/common";
import { Counter, Gauge, Histogram, UpDownCounter } from "@opentelemetry/api";
import {
  OtelInstanceCounter,
  OtelMethodCounter,
} from "../../src/metrics/decorators/common";
import {
  OtelCounter,
  OtelGauge,
  OtelHistogram,
  OtelUpDownCounter,
} from "../../src/metrics/decorators/param";

@OtelInstanceCounter()
@Controller("example")
export class AppController {
  @Get("internal-error")
  exampleError() {
    throw new Error("error example");
  }

  @Get(":id")
  @OtelMethodCounter()
  example(
    @OtelCounter("example_counter", { description: "An example counter" })
    counter: Counter,
    @OtelGauge("example_gauge", { description: "An example gauge" })
    gauge: Gauge,
    @OtelUpDownCounter("example_up_down", {
      description: "An example up-down counter",
    })
    upDownCounter: UpDownCounter,
    @OtelHistogram("example_histogram", { description: "An example histogram" })
    histogram: Histogram
  ) {
    counter.add(1);
    upDownCounter.add(2);
    gauge.record(5);
    histogram.record(8);
    return "example";
  }
}
