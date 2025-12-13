import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { INestApplication, Logger } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';

export async function createSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('EDC Web Backend API')
    .setDescription(`API for edc web design`)
    .setVersion('0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'JWT',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'API key required on protected routes',
      },
      'ApiKey',
    )
    .addSecurityRequirements('ApiKey')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, () => document);
}

export async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await createSwagger(app);
  logger.log(`ENVIRONMENT=${process.env.ENVIRONMENT ?? 'undefined'}`);
  logger.log(`DATABASE_URL=${process.env.DATABASE_URL ?? 'undefined'}`);
  logger.log(
    `LOCAL_DATABASE_URL=${process.env.LOCAL_DATABASE_URL ?? 'undefined'}`,
  );
  const port = process.env.PORT ?? 8000;
  await app.listen(port);
  logger.log(`🚀 Application is running on http://localhost:${port}`);
}

bootstrap();
