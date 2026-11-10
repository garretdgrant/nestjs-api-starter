import { ConflictException } from '@nestjs/common';
import { InMemoryPrisma } from '../../test/support/in-memory-prisma';
import { UserService } from './user.service';

describe('UserService', () => {
  const input = { email: 'alice@example.com', passwordHash: 'hash' };
  let prisma: InMemoryPrisma;
  let service: UserService;

  beforeEach(() => {
    prisma = new InMemoryPrisma();
    service = new UserService(prisma.asPrismaService());
  });

  it('creates a user and finds it by email and id', async () => {
    const created = await service.create({ ...input, name: 'Alice' });

    expect(created).toMatchObject({ ...input, name: 'Alice', role: 'USER' });
    await expect(service.findByEmail(input.email)).resolves.toEqual(created);
    await expect(service.findById(created.id)).resolves.toEqual(created);
  });

  it('returns null when no user matches', async () => {
    await expect(service.findByEmail('nobody@example.com')).resolves.toBeNull();
    await expect(service.findById('missing')).resolves.toBeNull();
  });

  it('turns a duplicate email into a 409 conflict', async () => {
    await service.create(input);
    await expect(service.create(input)).rejects.toEqual(
      new ConflictException('Email already in use'),
    );
  });

  it('rethrows other database errors unchanged', async () => {
    const failure = new Error('connection lost');
    prisma.user.create = jest.fn().mockRejectedValue(failure);
    await expect(service.create(input)).rejects.toBe(failure);
  });
});
