import { Get, Controller } from '@nestjs/common';
import { Counter } from '@opentelemetry/api';
import { OtelInstanceCounter, OtelMethodCounter } from '../../src/metrics/decorators/common';
import { OtelCounter } from '../../src/metrics/decorators/param';

@OtelInstanceCounter()
@Controller('example')
export class AppController {
  @Get('internal-error')
  exampleError() {
    throw new Error('error example');
  }

  @Get(':id')
  @OtelMethodCounter()
  example(@OtelCounter('example_counter') counter: Counter) {
    counter.add(1);
    return 'example';
  }
}
