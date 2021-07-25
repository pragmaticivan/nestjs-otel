import {
  Get, Controller,
} from '@nestjs/common';

@Controller('example')
export class AppController {
  @Get('internal-error')
  exampleError() {
    throw new Error('error example');
  }

  @Get(':id')
  example() {
    return 'example';
  }
}
