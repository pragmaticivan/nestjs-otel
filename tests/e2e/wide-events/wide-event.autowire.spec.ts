import { type INestApplication, Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { OpenTelemetryModule, WideEventInterceptor } from "../../../src";
import { WideEventMiddleware } from "../../../src/wide-events/wide-event.middleware";
import { WideEventController } from "../../fixture-app/wide-event.controller";

@Module({
  imports: [OpenTelemetryModule.forRoot()],
  controllers: [WideEventController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: WideEventInterceptor }],
})
class TestModule {}

describe("Wide Events auto-wired middleware", () => {
  let app: INestApplication;
  const useSpy = vi.spyOn(WideEventMiddleware.prototype, "use");

  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();
    app = testingModule.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should run WideEventMiddleware without any manual middleware wiring", async () => {
    useSpy.mockClear();

    await request(app.getHttpServer()).get("/wide-event/enrich").expect(200);

    expect(useSpy).toHaveBeenCalledTimes(1);
  });
});
