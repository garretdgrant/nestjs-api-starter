import { validateEnv } from './env';

describe('validateEnv', () => {
  const valid = {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    JWT_SECRET: 'a'.repeat(32),
  };

  it('applies defaults for optional settings', () => {
    expect(validateEnv(valid)).toMatchObject({
      ENVIRONMENT: 'dev',
      PORT: 8000,
      JWT_EXPIRES_IN: '15m',
      REFRESH_TOKEN_TTL_DAYS: 30,
    });
  });

  it('parses numeric settings', () => {
    const env = validateEnv({
      ...valid,
      ENVIRONMENT: 'prod',
      PORT: '3000',
      JWT_EXPIRES_IN: '1h',
      REFRESH_TOKEN_TTL_DAYS: '7',
    });
    expect(env).toMatchObject({
      ENVIRONMENT: 'prod',
      PORT: 3000,
      JWT_EXPIRES_IN: '1h',
      REFRESH_TOKEN_TTL_DAYS: 7,
    });
  });

  it('reports every problem at once', () => {
    expect(() =>
      validateEnv({
        ENVIRONMENT: 'production',
        JWT_SECRET: 'too-short',
        JWT_EXPIRES_IN: 'soon',
        PORT: 'abc',
      }),
    ).toThrow(
      /ENVIRONMENT must be one of[\s\S]*DATABASE_URL is required[\s\S]*JWT_SECRET[\s\S]*JWT_EXPIRES_IN[\s\S]*PORT must be a positive integer/,
    );
  });
});
