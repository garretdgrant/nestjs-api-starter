import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Public, Roles } from './auth.decorators';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest, AuthUser } from './auth.types';
import { RolesGuard } from './roles.guard';

class TestController {
  protectedRoute(): void {}

  @Public()
  publicRoute(): void {}

  @Roles(['ADMIN'])
  adminRoute(): void {}
}

function contextFor(
  handler: keyof TestController,
  request: Partial<AuthenticatedRequest>,
): ExecutionContext {
  return {
    getHandler: () => TestController.prototype[handler],
    getClass: () => TestController,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  const jwtService = new JwtService({ secret: 'unit-test-secret' });
  const guard = new AuthGuard(jwtService, new Reflector());
  const bearer = (token: string): Partial<AuthenticatedRequest> => ({
    headers: { authorization: `Bearer ${token}` },
  });

  it('allows public routes without a token', async () => {
    const context = contextFor('publicRoute', { headers: {} });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('rejects a request with no bearer token', async () => {
    for (const headers of [{}, { authorization: 'Basic abc' }]) {
      const context = contextFor('protectedRoute', { headers });
      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    }
  });

  it('attaches the user for a valid token', async () => {
    const token = await jwtService.signAsync({
      sub: 'user-1',
      email: 'alice@example.com',
      role: 'USER',
    });
    const request = bearer(token);

    await expect(
      guard.canActivate(contextFor('protectedRoute', request)),
    ).resolves.toBe(true);
    expect(request.user).toEqual({
      id: 'user-1',
      email: 'alice@example.com',
      role: 'USER',
    });
  });

  it('rejects expired, tampered and wrongly signed tokens', async () => {
    const expired = await jwtService.signAsync({ sub: 'u' }, { expiresIn: -1 });
    const otherSecret = await new JwtService({
      secret: 'another-secret',
    }).signAsync({ sub: 'u' });

    for (const token of [expired, otherSecret, 'not-a-jwt']) {
      const context = contextFor('protectedRoute', bearer(token));
      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    }
  });
});

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());
  const user = (role: AuthUser['role']): Partial<AuthenticatedRequest> => ({
    user: { id: 'user-1', email: 'alice@example.com', role },
  });

  it('allows routes with no role requirement', () => {
    expect(guard.canActivate(contextFor('protectedRoute', user('USER')))).toBe(
      true,
    );
  });

  it('allows a user who has a required role', () => {
    expect(guard.canActivate(contextFor('adminRoute', user('ADMIN')))).toBe(
      true,
    );
  });

  it('forbids a user without the required role', () => {
    expect(() =>
      guard.canActivate(contextFor('adminRoute', user('USER'))),
    ).toThrow(ForbiddenException);
  });
});
