import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  it('verifies the original password and rejects others', async () => {
    const hash = await hashPassword('correct-horse-battery');

    expect(hash).toMatch(/^scrypt\$131072\$8\$1\$/);
    expect(hash).not.toContain('correct-horse-battery');
    await expect(verifyPassword('correct-horse-battery', hash)).resolves.toBe(
      true,
    );
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('salts each hash', async () => {
    const [first, second] = await Promise.all([
      hashPassword('same-password'),
      hashPassword('same-password'),
    ]);
    expect(first).not.toEqual(second);
  });

  it('returns false for a malformed stored hash', async () => {
    await expect(verifyPassword('anything', '')).resolves.toBe(false);
    await expect(verifyPassword('anything', 'bcrypt$abc')).resolves.toBe(false);
    await expect(
      verifyPassword('anything', 'scrypt$3$8$1$c2FsdA$a2V5'),
    ).resolves.toBe(false);
  });
});
