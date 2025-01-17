import { Injectable } from '@nestjs/common';
import { HealthCheckResponseDto } from './dto/get-health.dto';

@Injectable()
export class HealthService {
  getHealth(): HealthCheckResponseDto {
    return {
      statusCode: 200,
      message: 'OK',
    };
  }
}
