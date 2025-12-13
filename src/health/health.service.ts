import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { HealthCheckResponseDto } from './dto/get-health.dto';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth(): HealthCheckResponseDto {
    return {
      statusCode: 200,
      message: 'OK',
    };
  }

  async getDbHealth(): Promise<HealthCheckResponseDto> {
    await this.prisma.$queryRaw`SELECT 1`;
    return {
      statusCode: 200,
      message: 'DB OK',
    };
  }
}
