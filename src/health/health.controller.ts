import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/auth.decorators';
import { HealthService } from './health.service';
import { HealthCheckResponseDto } from './dto/get-health.dto';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Get health status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health check successful',
    type: HealthCheckResponseDto,
  })
  getHealth(): HealthCheckResponseDto {
    return this.healthService.getHealth();
  }

  @Get('db')
  @ApiOperation({ summary: 'Check database connectivity' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Database reachable',
    type: HealthCheckResponseDto,
  })
  async getDbHealth(): Promise<HealthCheckResponseDto> {
    return this.healthService.getDbHealth();
  }
}
