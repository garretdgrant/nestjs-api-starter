import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt.guard';
import { IS_PUBLIC_KEY } from './public.decorator';

const mockExecutionContext = (overrides: Partial<any> = {}) =>
  ({
    switchToHttp: () => ({
      getRequest: () => overrides.request ?? {},
      getResponse: () => ({}),
    }),
    getHandler: () => overrides.handler ?? jest.fn(),
    getClass: () => overrides.classRef ?? jest.fn(),
  }) as unknown as ExecutionContext;

describe('JwtAuthGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const guard = new JwtAuthGuard(reflector);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows public routes', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(true);
    const ctx = mockExecutionContext({ request: { path: '/any' } });
    expect(guard.canActivate(ctx)).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledTimes(1);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      IS_PUBLIC_KEY,
      expect.any(Array),
    );
  });

  it('allows swagger and login paths', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(false);
    const swaggerCtx = mockExecutionContext({ request: { path: '/swagger' } });
    const loginCtx = mockExecutionContext({ request: { path: '/auth/login' } });
    expect(guard.canActivate(swaggerCtx)).toBe(true);
    expect(guard.canActivate(loginCtx)).toBe(true);
  });

  it('delegates to AuthGuard for protected routes', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(false);
    const parentProto = Object.getPrototypeOf(JwtAuthGuard.prototype);
    jest.spyOn(parentProto, 'canActivate').mockReturnValue(true as any);
    const ctx = mockExecutionContext({ request: { path: '/protected' } });
    const result = guard.canActivate(ctx);
    expect(result).toBe(true);
  });
});
