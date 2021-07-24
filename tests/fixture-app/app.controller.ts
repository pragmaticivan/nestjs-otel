import {
  Get, Controller,
} from '@nestjs/common';

@Controller('example')
export class AppController {
  @Get(':id')
  example() {
    return 'example';
  }
}
