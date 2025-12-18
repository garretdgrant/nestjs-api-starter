import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt.guard';
import { Public } from './public.decorator';
import { SafeUser } from './auth.types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiBody({ type: LoginDto })
  login(
    @Body() dto: LoginDto,
  ): Promise<{ accessToken: string; user: SafeUser }> {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity({ ApiKey: [], JWT: [] })
  @Get('me')
  me(@Request() req: { user: SafeUser }): SafeUser {
    return req.user;
  }
}
