import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthCheckResponseDto } from './dto/get-health.dto';

@ApiTags('Health') // Groups the endpoint under 'Health' in Swagger UI
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Get health status' }) // Describes the endpoint in SwaggerUI
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health check successful',
    type: HealthCheckResponseDto, // Explicitly specify the response type in SwaggerUI
  })
  getHealth(): HealthCheckResponseDto {
    return this.healthService.getHealth();
  }
}
