import { Get, Controller } from '@nestjs/common';
import { OtelInstanceCounter, OtelMethodCounter } from '../../src/metrics/decorators/common';

@OtelInstanceCounter()
@Controller('example')
export class AppController {
  @Get('internal-error')
  exampleError() {
    throw new Error('error example');
  }

  @Get(':id')
  @OtelMethodCounter()
  example() {
    return 'example';
  }
}
