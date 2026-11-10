import { randomUUID } from 'node:crypto';
import { Prisma, RefreshToken, User } from '../../src/generated/prisma/client';
import type { PrismaService } from '../../src/prisma/prisma.service';

type RefreshTokenWhere = Partial<
  Pick<RefreshToken, 'id' | 'tokenHash' | 'userId' | 'revokedAt'>
>;

/**
 * Minimal in-memory stand-in for PrismaService covering the queries the auth
 * flow makes, so tests run without a database.
 */
export class InMemoryPrisma {
  users: User[] = [];
  refreshTokens: RefreshToken[] = [];

  user = {
    findUnique: async ({
      where,
    }: {
      where: { id?: string; email?: string };
    }): Promise<User | null> =>
      this.users.find(
        (user) => user.id === where.id || user.email === where.email,
      ) ?? null,

    create: async ({
      data,
    }: {
      data: { email: string; passwordHash: string; name?: string };
    }): Promise<User> => {
      if (this.users.some((user) => user.email === data.email)) {
        throw new Prisma.PrismaClientKnownRequestError(
          'Unique constraint failed',
          { code: 'P2002', clientVersion: 'test' },
        );
      }
      const now = new Date();
      const user: User = {
        id: randomUUID(),
        email: data.email,
        name: data.name ?? null,
        role: 'USER',
        passwordHash: data.passwordHash,
        createdAt: now,
        updatedAt: now,
      };
      this.users.push(user);
      return user;
    },
  };

  refreshToken = {
    create: async ({
      data,
    }: {
      data: Pick<RefreshToken, 'tokenHash' | 'userId' | 'expiresAt'>;
    }): Promise<RefreshToken> => {
      const token: RefreshToken = {
        id: randomUUID(),
        revokedAt: null,
        createdAt: new Date(),
        ...data,
      };
      this.refreshTokens.push(token);
      return token;
    },

    findUnique: async ({
      where,
    }: {
      where: { tokenHash: string };
    }): Promise<(RefreshToken & { user: User }) | null> => {
      const token = this.refreshTokens.find(
        (candidate) => candidate.tokenHash === where.tokenHash,
      );
      const user = this.users.find(
        (candidate) => candidate.id === token?.userId,
      );
      return token && user ? { ...token, user } : null;
    },

    updateMany: async ({
      where,
      data,
    }: {
      where: RefreshTokenWhere;
      data: Partial<RefreshToken>;
    }): Promise<{ count: number }> => {
      const matches = this.refreshTokens.filter((token) =>
        Object.entries(where).every(
          ([key, value]) => token[key as keyof RefreshToken] === value,
        ),
      );
      matches.forEach((token) => Object.assign(token, data));
      return { count: matches.length };
    },
  };

  $queryRaw = async (): Promise<unknown[]> => [{ ok: 1 }];

  asPrismaService(): PrismaService {
    return this as unknown as PrismaService;
  }
}
