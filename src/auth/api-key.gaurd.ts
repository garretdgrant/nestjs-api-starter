import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const url: string =
      request?.originalUrl ?? request?.url ?? request?.path ?? '';

    if (
      url.startsWith('/swagger') ||
      url.startsWith('/swagger-json') ||
      url === '/' ||
      url.startsWith('/health')
    ) {
      return true;
    }

    const headerKey =
      request.headers['x-api-key'] || request.headers['x-api_key'];

    const expectedKey = this.configService.get<string>('API_KEY');

    if (!expectedKey || headerKey !== expectedKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
