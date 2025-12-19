import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@generated/prisma/client';
import { PrismaService } from '@src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { ClientSignupDto } from './dto/client-signup.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
    },
    client: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const jwtMock = {
    signAsync: jest.fn().mockResolvedValue('signed-jwt'),
  };

  const configMock = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    configMock.get = jest.fn().mockReturnValue('test-secret');
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  const buildDto = (): ClientSignupDto => ({
    contactName: ' Alice ',
    companyName: ' Acme Co ',
    email: ' Alice@Example.com ',
    password: 'supersecret',
    projectName: ' Website ',
    signUpSecret: 'test-secret',
  });

  it('creates client, user, and project atomically and returns sanitized data', async () => {
    const dto = buildDto();
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.client.findUnique.mockResolvedValueOnce(null);

    const tx = {
      client: {
        create: jest.fn(async ({ data }) => ({
          id: 'client-id',
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          ...data,
        })),
      },
      user: {
        create: jest.fn(async ({ data }) => ({
          id: 'user-id',
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          ...data,
        })),
      },
      project: {
        create: jest.fn(async ({ data }) => ({
          id: 'project-id',
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
          description: 'Website',
          status: 'ACTIVE',
          ...data,
        })),
      },
    };

    prismaMock.$transaction.mockImplementation(async (cb) => cb(tx));

    const result = await service.clientSignup(dto);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'alice@example.com' },
    });
    expect(prismaMock.client.findUnique).toHaveBeenCalledWith({
      where: { name: 'Acme Co' },
    });

    const hashedUsed = tx.user.create.mock.calls[0][0].data.hashedPassword;
    expect(await bcrypt.compare(dto.password, hashedUsed)).toBe(true);

    expect(result).toMatchObject({
      accessToken: 'signed-jwt',
      client: { id: 'client-id', name: 'Acme Co' },
      project: { id: 'project-id', clientId: 'client-id', name: 'Website' },
      user: {
        id: 'user-id',
        email: 'alice@example.com',
        clientId: 'client-id',
      },
    });
    expect(
      (result.user as unknown as { hashedPassword?: string }).hashedPassword,
    ).toBeUndefined();
  });

  it('throws conflict when email exists (precheck)', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'existing' });
    await expect(service.clientSignup(buildDto())).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects when signup secret is missing or invalid', async () => {
    configMock.get = jest.fn().mockReturnValue('expected-secret');
    const dto = { ...buildDto(), signUpSecret: 'wrong' };
    await expect(service.clientSignup(dto)).rejects.toThrow(
      'Invalid signup secret',
    );
  });

  it('throws conflict when company exists (precheck)', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.client.findUnique.mockResolvedValueOnce({ id: 'existing' });
    await expect(service.clientSignup(buildDto())).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('maps P2002 unique violation inside transaction to conflict', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.client.findUnique.mockResolvedValueOnce(null);
    prismaMock.$transaction.mockImplementation(async () => {
      throw new Prisma.PrismaClientKnownRequestError('unique constraint', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['email'] },
      });
    });

    await expect(service.clientSignup(buildDto())).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('returns payload after successful login', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      email: 'alice@example.com',
      name: 'Alice',
      role: 'USER',
      staffRole: null,
      clientId: 'c1',
      hashedPassword: 'hashed',
      passwordUpdatedAt: new Date(),
      isEmailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);
    const jwtSpy = jest.spyOn(jwtMock, 'signAsync');
    const dto: LoginDto = { email: 'alice@example.com', password: 'correct' };

    const result = await service.login(dto);

    expect(bcrypt.compare).toHaveBeenCalledWith('correct', 'hashed');
    expect(jwtSpy).toHaveBeenCalledWith({
      sub: 'u1',
      email: 'alice@example.com',
      role: 'USER',
      clientId: 'c1',
    });
    expect(result.user).toMatchObject({
      id: 'u1',
      email: 'alice@example.com',
      clientId: 'c1',
    });
    expect((result.user as any).hashedPassword).toBeUndefined();
    expect(result.accessToken).toBeDefined();
  });

  it('maps P2002 unique violation inside transaction to company conflict', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.client.findUnique.mockResolvedValueOnce(null);
    prismaMock.$transaction.mockImplementation(async () => {
      throw new Prisma.PrismaClientKnownRequestError('unique constraint', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['name'] },
      });
    });

    await expect(service.clientSignup(buildDto())).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rethrows unknown errors after logging', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.client.findUnique.mockResolvedValueOnce(null);
    const unknown = new Error('boom');
    prismaMock.$transaction.mockImplementation(async () => {
      throw unknown;
    });

    await expect(service.clientSignup(buildDto())).rejects.toBe(unknown);
  });

  describe('login', () => {
    it('throws when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      const dto: LoginDto = { email: 'missing@example.com', password: 'pwd' };
      await expect(service.login(dto)).rejects.toThrow('Invalid credentials');
    });

    it('throws when password mismatch', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'u1',
        email: 'alice@example.com',
        name: 'Alice',
        role: 'USER',
        staffRole: null,
        clientId: 'c1',
        hashedPassword: 'hashed',
        passwordUpdatedAt: new Date(),
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);
      const dto: LoginDto = { email: 'alice@example.com', password: 'wrong' };
      await expect(service.login(dto)).rejects.toThrow('Invalid credentials');
    });
  });
});
