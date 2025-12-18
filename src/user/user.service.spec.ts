import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { Role, User } from '@generated/prisma/client';
import { PrismaService } from '@src/prisma/prisma.service';
import { UsersService } from './user.service';
import { CreateClientUserDto } from './dto/create-client-user.dto';

describe('UsersService', () => {
  let service: UsersService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  const baseUser: User = {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice',
    role: Role.USER,
    staffRole: null,
    clientId: 'client-1',
    hashedPassword: 'hashed',
    passwordUpdatedAt: new Date('2024-01-01T00:00:00.000Z'),
    isEmailVerified: false,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  it('returns a single user by unique input', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser);

    const result = await service.user({ id: 'user-1' });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
    expect(result).toEqual(baseUser);
  });

  it('returns multiple users with query params', async () => {
    prismaMock.user.findMany.mockResolvedValue([baseUser]);

    const result = await service.users({
      skip: 1,
      take: 2,
      cursor: { id: 'cursor' },
      where: { role: Role.USER },
      orderBy: { createdAt: 'desc' },
    });

    expect(prismaMock.user.findMany).toHaveBeenCalledWith({
      skip: 1,
      take: 2,
      cursor: { id: 'cursor' },
      where: { role: Role.USER },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([baseUser]);
  });

  it('creates a client user, hashes password, and strips sensitive fields', async () => {
    const dto: CreateClientUserDto = {
      email: 'alice@example.com',
      name: 'Alice',
      password: 'plaintext',
      clientId: 'client-1',
      role: Role.USER,
    };
    jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce('hashed-password');
    prismaMock.user.create.mockResolvedValue({
      ...baseUser,
      hashedPassword: 'hashed-password',
    });

    const result = await service.createClientUser(dto);

    expect(bcrypt.hash).toHaveBeenCalledWith('plaintext', 10);
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        email: dto.email,
        name: dto.name,
        role: Role.USER,
        client: { connect: { id: dto.clientId } },
        hashedPassword: 'hashed-password',
      },
    });
    expect(result).toMatchObject({
      id: baseUser.id,
      email: baseUser.email,
      clientId: baseUser.clientId,
      role: Role.USER,
    });
    expect(
      (result as unknown as { hashedPassword?: string }).hashedPassword,
    ).toBeUndefined();
  });

  it('updates a user', async () => {
    prismaMock.user.update.mockResolvedValue(baseUser);

    const result = await service.updateUser({
      where: { id: baseUser.id },
      data: { name: 'New Name' },
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: baseUser.id },
      data: { name: 'New Name' },
    });
    expect(result).toEqual(baseUser);
  });

  it('deletes a user', async () => {
    prismaMock.user.delete.mockResolvedValue(baseUser);

    const result = await service.deleteUser({ id: baseUser.id });

    expect(prismaMock.user.delete).toHaveBeenCalledWith({
      where: { id: baseUser.id },
    });
    expect(result).toEqual(baseUser);
  });
});
