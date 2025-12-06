import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { INestApplication, Logger } from '@nestjs/common';

export async function createSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('EDC Web Backend API')
    .setDescription(`API for edc web design`)
    .setVersion('0.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, () => document);
}

export async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  await createSwagger(app);
  const port = process.env.PORT ?? 8000;
  await app.listen(port);
  logger.log(`🚀 Application is running on http://localhost:${port}`);
}

bootstrap();
