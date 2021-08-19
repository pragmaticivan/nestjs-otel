import otelSDK from './tracing';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  await otelSDK.start();

  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(Logger));

  app.enableShutdownHooks();
  app.enableCors({ origin: '*' });

  const options = new DocumentBuilder()
    .setTitle('Nestjs prom grafana tempo')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  await app.listen(5555);
}
bootstrap();
