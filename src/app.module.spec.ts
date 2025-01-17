import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';

describe('AppModule', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should include HealthModule', () => {
    const healthModule = app.get(HealthModule);
    expect(healthModule).toBeDefined();
  });

  it('should include AppController', () => {
    const appController = app.get(AppController);
    expect(appController).toBeDefined();
  });

  it('should include AppService', () => {
    const appService = app.get(AppService);
    expect(appService).toBeDefined();
  });
});
