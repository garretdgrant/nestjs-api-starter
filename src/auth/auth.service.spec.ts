import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InMemoryPrisma } from '../../test/support/in-memory-prisma';
import type { Env } from '../config/env';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const credentials = {
    email: 'alice@example.com',
    password: 'correct-horse-battery',
  };
  let prisma: InMemoryPrisma;
  let jwtService: JwtService;
  let service: AuthService;

  beforeEach(() => {
    prisma = new InMemoryPrisma();
    jwtService = new JwtService({
      secret: 'unit-test-secret',
      signOptions: { expiresIn: '15m' },
    });
    const config = {
      get: () => 30,
    } as unknown as ConfigService<Env, true>;
    service = new AuthService(
      new UserService(prisma.asPrismaService()),
      prisma.asPrismaService(),
      jwtService,
      config,
    );
  });

  describe('register', () => {
    it('stores a hashed password and returns a token pair', async () => {
      const result = await service.register({ ...credentials, name: 'Alice' });

      expect(prisma.users).toHaveLength(1);
      expect(prisma.users[0].passwordHash).toMatch(/^scrypt\$/);
      expect(result.user).toEqual({
        id: prisma.users[0].id,
        email: credentials.email,
        name: 'Alice',
        role: 'USER',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      const payload = await jwtService.verifyAsync(result.accessToken);
      expect(payload).toMatchObject({
        sub: result.user.id,
        email: credentials.email,
        role: 'USER',
      });
    });

    it('stores only a hash of the refresh token, with an expiry', async () => {
      const before = Date.now();
      const result = await service.register(credentials);

      const [stored] = prisma.refreshTokens;
      expect(stored.tokenHash).not.toEqual(result.refreshToken);
      expect(stored.tokenHash).toMatch(/^[0-9a-f]{64}$/);
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      expect(stored.expiresAt.getTime()).toBeGreaterThanOrEqual(
        before + thirtyDays,
      );
    });

    it('rejects an email that is already registered', async () => {
      await service.register(credentials);
      await expect(service.register(credentials)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await service.register(credentials);
    });

    it('returns tokens for valid credentials', async () => {
      const result = await service.login(credentials);
      expect(result.accessToken).toEqual(expect.any(String));
      expect(result.refreshToken).toEqual(expect.any(String));
    });

    it('rejects a wrong password and an unknown email the same way', async () => {
      const wrongPassword = service.login({
        ...credentials,
        password: 'wrong-password',
      });
      const unknownEmail = service.login({
        ...credentials,
        email: 'nobody@example.com',
      });

      await expect(wrongPassword).rejects.toEqual(
        new UnauthorizedException('Invalid credentials'),
      );
      await expect(unknownEmail).rejects.toEqual(
        new UnauthorizedException('Invalid credentials'),
      );
    });
  });

  describe('refresh', () => {
    it('issues a new pair and revokes the token that was used', async () => {
      const first = await service.register(credentials);
      const second = await service.refresh(first.refreshToken);

      expect(second.refreshToken).not.toEqual(first.refreshToken);
      expect(prisma.refreshTokens).toHaveLength(2);
      expect(prisma.refreshTokens[0].revokedAt).toBeInstanceOf(Date);
      expect(prisma.refreshTokens[1].revokedAt).toBeNull();
    });

    it('rejects an unknown token', async () => {
      await expect(service.refresh('unknown')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects an expired token', async () => {
      const { refreshToken } = await service.register(credentials);
      prisma.refreshTokens[0].expiresAt = new Date(Date.now() - 1000);

      await expect(service.refresh(refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('revokes all of the user’s tokens when a spent token is replayed', async () => {
      const first = await service.register(credentials);
      await service.refresh(first.refreshToken);
      await service.login(credentials);

      await expect(service.refresh(first.refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.refreshTokens).toHaveLength(3);
      expect(
        prisma.refreshTokens.every((token) => token.revokedAt !== null),
      ).toBe(true);
    });
  });

  describe('logout', () => {
    it('revokes the token so it can no longer be refreshed', async () => {
      const { refreshToken } = await service.register(credentials);
      await service.logout(refreshToken);

      expect(prisma.refreshTokens[0].revokedAt).toBeInstanceOf(Date);
      await expect(service.refresh(refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('ignores an unknown token', async () => {
      await expect(service.logout('unknown')).resolves.toBeUndefined();
    });
  });

  describe('me', () => {
    it('returns the user without the password hash', async () => {
      const { user } = await service.register(credentials);
      const result = await service.me(user.id);

      expect(result).toEqual(user);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('rejects a token whose user was deleted', async () => {
      await expect(service.me('missing-id')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
