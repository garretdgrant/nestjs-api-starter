import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// The Prisma CLI does not load .env on its own. Load it when present so local
// commands work; in CI and containers the variables come from the environment.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Not needed by `prisma generate`; migrate commands fail clearly without it.
    url: process.env.DATABASE_URL ?? '',
  },
});
