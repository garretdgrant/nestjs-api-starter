import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { HealthCheckResponseDto } from './dto/get-health.dto';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return health check response', () => {
    const expectedResponse: HealthCheckResponseDto = {
      statusCode: 200,
      message: 'OK',
    };
    const result = service.getHealth();
    expect(result).toEqual(expectedResponse);
  });
});
