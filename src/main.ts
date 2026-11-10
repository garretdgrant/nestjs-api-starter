import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp, setupSwagger } from './app.setup';
import type { Env } from './config/env';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  const environment = config.get('ENVIRONMENT', { infer: true });
  const port = config.get('PORT', { infer: true });

  configureApp(app);
  if (environment !== 'prod') {
    setupSwagger(app);
  }

  await app.listen(port);
  logger.log(`Listening on port ${port} (ENVIRONMENT=${environment})`);
  if (environment !== 'prod') {
    logger.log(`Swagger UI: http://localhost:${port}/swagger`);
  }
}

void bootstrap();
