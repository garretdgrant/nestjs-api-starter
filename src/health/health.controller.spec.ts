import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaService } from '@src/prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  const prismaMock = {
    $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health check response', () => {
    const result = controller.getHealth();
    expect(result).toEqual({
      statusCode: 200,
      message: 'OK',
    });
  });

  it('should return db health response', async () => {
    const result = await controller.getDbHealth();
    expect(prismaMock.$queryRaw).toHaveBeenCalled();
    expect(result).toEqual({
      statusCode: 200,
      message: 'DB OK',
    });
  });
});
