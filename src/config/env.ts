export const ENVIRONMENTS = ['dev', 'stag', 'prod'] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

export interface Env {
  ENVIRONMENT: Environment;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  REFRESH_TOKEN_TTL_DAYS: number;
}

const MIN_JWT_SECRET_LENGTH = 32;
const DURATION_PATTERN = /^\d+(ms|s|m|h|d)$/;

function readString(raw: Record<string, unknown>, key: string): string {
  const value = raw[key];
  return typeof value === 'string' ? value.trim() : '';
}

function readPositiveInt(
  raw: Record<string, unknown>,
  key: string,
  fallback: number,
  errors: string[],
): number {
  const value = readString(raw, key);
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    errors.push(`${key} must be a positive integer`);
    return fallback;
  }
  return parsed;
}

/**
 * Validates process environment at startup so a misconfigured app fails fast
 * with a clear message instead of at the first request.
 */
export function validateEnv(raw: Record<string, unknown>): Env {
  const errors: string[] = [];

  const environment = readString(raw, 'ENVIRONMENT') || 'dev';
  if (!ENVIRONMENTS.includes(environment as Environment)) {
    errors.push(`ENVIRONMENT must be one of: ${ENVIRONMENTS.join(', ')}`);
  }

  const databaseUrl = readString(raw, 'DATABASE_URL');
  if (!databaseUrl) {
    errors.push('DATABASE_URL is required');
  }

  const jwtSecret = readString(raw, 'JWT_SECRET');
  if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    errors.push(
      `JWT_SECRET is required and must be at least ${MIN_JWT_SECRET_LENGTH} characters`,
    );
  }

  const jwtExpiresIn = readString(raw, 'JWT_EXPIRES_IN') || '15m';
  if (!DURATION_PATTERN.test(jwtExpiresIn)) {
    errors.push('JWT_EXPIRES_IN must look like 900s, 15m, 1h or 7d');
  }

  const port = readPositiveInt(raw, 'PORT', 8000, errors);
  const refreshTokenTtlDays = readPositiveInt(
    raw,
    'REFRESH_TOKEN_TTL_DAYS',
    30,
    errors,
  );

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n- ${errors.join('\n- ')}`,
    );
  }

  return {
    ...raw,
    ENVIRONMENT: environment as Environment,
    PORT: port,
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: jwtExpiresIn,
    REFRESH_TOKEN_TTL_DAYS: refreshTokenTtlDays,
  };
}
