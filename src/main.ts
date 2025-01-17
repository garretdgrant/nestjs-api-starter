import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { INestApplication } from '@nestjs/common';

export async function createSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('NestJS API Starter Application')
    .setDescription(`Starter application for Garret's API's`)
    .setVersion('0.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, () => document);
}

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await createSwagger(app);
  await app.listen(process.env.PORT ?? 8000);
}

bootstrap();
