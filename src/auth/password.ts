import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

// scrypt at the OWASP-recommended cost (N=2^17, r=8, p=1). The parameters are
// stored with each hash, so they can be raised later without breaking logins.
const COST = 2 ** 17;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function deriveKey(
  password: string,
  salt: Buffer,
  keyLength: number,
  cost: number,
  blockSize: number,
  parallelization: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      keyLength,
      {
        N: cost,
        r: blockSize,
        p: parallelization,
        // scrypt needs 128 * N * r bytes; Node's default cap is 32 MiB.
        maxmem: 256 * cost * blockSize,
      },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await deriveKey(
    password,
    salt,
    KEY_LENGTH,
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
  );
  return [
    'scrypt',
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString('base64url'),
    key.toString('base64url'),
  ].join('$');
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [scheme, cost, blockSize, parallelization, salt, key] =
    storedHash.split('$');
  if (scheme !== 'scrypt' || !salt || !key) {
    return false;
  }

  const expected = Buffer.from(key, 'base64url');
  try {
    const actual = await deriveKey(
      password,
      Buffer.from(salt, 'base64url'),
      expected.length,
      Number(cost),
      Number(blockSize),
      Number(parallelization),
    );
    return timingSafeEqual(actual, expected);
  } catch {
    // Malformed parameters in the stored hash.
    return false;
  }
}
