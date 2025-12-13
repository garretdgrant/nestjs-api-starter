import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { HealthCheckResponseDto } from './dto/get-health.dto';
import { PrismaService } from '@src/prisma/prisma.service';

describe('HealthService', () => {
  let service: HealthService;
  const prismaMock = {
    $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
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

  it('should return db health response', async () => {
    const result = await service.getDbHealth();
    expect(prismaMock.$queryRaw).toHaveBeenCalled();
    expect(result).toEqual({
      statusCode: 200,
      message: 'DB OK',
    });
  });
});
