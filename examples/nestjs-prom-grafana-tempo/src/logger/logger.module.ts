import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { logger } from './logger';
import { Module, RequestMethod } from '@nestjs/common';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        logger: logger,
      },
      exclude: [{ method: RequestMethod.ALL, path: 'health' }],
    }),
  ],
  controllers: [],
  providers: [],
})
export class LoggerModule {}
