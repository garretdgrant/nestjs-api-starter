// Fixed, fake configuration for end-to-end tests. AppModule skips .env files
// when NODE_ENV is "test", so these are the only values the app sees.
process.env.NODE_ENV = 'test';
process.env.ENVIRONMENT = 'dev';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-only-jwt-secret-that-is-at-least-32-chars';
process.env.JWT_EXPIRES_IN = '15m';
process.env.REFRESH_TOKEN_TTL_DAYS = '30';
