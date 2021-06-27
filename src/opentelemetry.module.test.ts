import { Test } from '@nestjs/testing';
import { OPENTELEMETRY_MODULE_OPTIONS } from './opentelemetry.constants';
import { OpenTelemetryModule } from './opentelemetry.module';

describe('OpenTelemetryModule', () => {
  it('boots successfully', async () => {
    const rootModule = await Test.createTestingModule({
      imports: [
        OpenTelemetryModule.register(),
      ],
    }).compile();

    expect(rootModule.get(OPENTELEMETRY_MODULE_OPTIONS)).toBeInstanceOf(Object);
  });
});
