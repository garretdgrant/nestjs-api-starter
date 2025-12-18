import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const configMock = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: ConfigService,
          useValue: configMock,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('returns a sanitized user object', async () => {
    const user = {
      id: '9eb84096-f8d5-4982-bc16-76325d43eb28',
      email: 'alice@example.com',
      name: 'Alice',
      role: 'USER',
      staffRole: null,
      clientId: '9f6c1f4a-5e8f-4c3d-9a4b-8d2a7c9e5b71',
      hashedPassword: 'hash',
      passwordUpdatedAt: new Date('2024-01-01T00:00:00.000Z'),
      isEmailVerified: false,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    };

    prismaMock.user.findUnique.mockResolvedValue(user);

    const result = await strategy.validate({
      sub: user.id,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
    });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: user.id },
    });
    expect(result).toEqual(
      expect.objectContaining({ id: user.id, email: user.email }),
    );
    expect(
      (result as unknown as { hashedPassword?: string }).hashedPassword,
    ).toBeUndefined();
  });

  it('throws when user no longer exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      strategy.validate({
        sub: 'missing-user-id',
        email: 'alice@example.com',
        role: 'USER',
        clientId: null,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
