import otelSDK from './tracing';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';

async function bootstrap() {
  await otelSDK.start();

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  app.useLogger(app.get(Logger));
  await app.listen(5555, '0.0.0.0', (err, address) => {
    if(err) {
      console.log("err", err)
      process.exit(1)
    }
    console.log(`server listening on ${address}`)
  });
}
bootstrap();
