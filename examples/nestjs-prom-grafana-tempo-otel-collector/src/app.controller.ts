import { Post } from '@nestjs/common';
import { UploadedFile } from '@nestjs/common';
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { context, trace } from '@opentelemetry/api';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('file')
  getFile(@UploadedFile('file') file: any): string {
    console.log('Should log active span');
    const span = trace.getSpan(context.active());
    console.dir(span);
    span?.end();
    return this.appService.getHello();
  }
}
