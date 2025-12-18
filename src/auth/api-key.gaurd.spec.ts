import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ApiKeyGuard } from './api-key.gaurd';
import { IS_PUBLIC_KEY } from './public.decorator';

const mockExecutionContext = (overrides: Partial<any> = {}) =>
  ({
    switchToHttp: () => ({
      getRequest: () => overrides.request ?? {},
      getResponse: () => ({}),
    }),
    getHandler: () => overrides.handler ?? jest.fn(),
    getClass: () => overrides.classRef ?? jest.fn(),
  }) as unknown as any;

describe('ApiKeyGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const config = {
    get: jest.fn(),
  } as unknown as ConfigService;

  const guard = new ApiKeyGuard(config, reflector);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows public routes', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(true);
    const ctx = mockExecutionContext({
      request: { path: '/anything' },
    });

    expect(guard.canActivate(ctx)).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledTimes(1);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      IS_PUBLIC_KEY,
      expect.any(Array),
    );
  });

  it('allows whitelisted paths (swagger, root, health)', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(false);
    const urls = ['/swagger', '/swagger-json', '/', '/health'];

    for (const url of urls) {
      const ctx = mockExecutionContext({
        request: { originalUrl: url },
      });
      expect(guard.canActivate(ctx)).toBe(true);
    }
  });

  it('throws when api key missing or mismatched', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(false);
    config.get = jest.fn().mockReturnValue('expected-key');
    const ctx = mockExecutionContext({
      request: {
        originalUrl: '/secure',
        headers: { 'x-api-key': 'wrong' },
      },
    });

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('allows when api key matches', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(false);
    config.get = jest.fn().mockReturnValue('expected-key');
    const ctx = mockExecutionContext({
      request: {
        originalUrl: '/secure',
        headers: { 'x-api-key': 'expected-key' },
      },
    });

    expect(guard.canActivate(ctx)).toBe(true);
  });
});
