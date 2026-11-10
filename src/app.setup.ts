import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Global behaviour shared by the real server and the end-to-end tests. */
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();
}

/** Serves Swagger UI at /swagger and the OpenAPI document at /swagger-json. */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('API Starter')
    .setDescription('NestJS + Prisma starter API with JWT user auth')
    .setVersion('0.0.1')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('swagger', app, () =>
    SwaggerModule.createDocument(app, config),
  );
}
