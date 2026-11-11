# Development

[Back to README](../README.md)

## Where code belongs

| Path                | Responsibility                                       |
| ------------------- | ---------------------------------------------------- |
| `src/main.ts`       | Start the app; enable Swagger outside production     |
| `src/app.setup.ts`  | Shared validation, shutdown hooks and Swagger setup  |
| `src/app.module.ts` | Module wiring and global guards                      |
| `src/config/env.ts` | Configuration types, defaults and startup validation |
| `src/auth/`         | Tokens, passwords, guards and auth endpoints         |
| `src/user/`         | User creation and lookups                            |
| `src/prisma/`       | Shared database client                               |
| `src/health/`       | Process and database health endpoints                |
| `prisma/`           | Database schema and committed migrations             |
| `test/`             | HTTP tests and the in-memory database stand-in       |

## Add a feature

1. Keep the controller, service and DTOs together in `src/<feature>/`.
   Put business logic in the service and register the module in `AppModule`.
2. Use DTO classes with validation decorators for inputs. The global pipe
   transforms inputs and rejects fields without validation decorators.
3. Inject `PrismaService` for database access; it is available globally.
   Return deliberate response shapes rather than raw records with private fields.
4. Choose access rules and test success, invalid input and denied access.

Global guards run in order: rate limit → authenticate → check roles.
Routes require a Bearer token unless marked `@Public()`.

```ts
import { Controller, Get } from '@nestjs/common';
import { CurrentUser, Public, Roles } from '../auth/auth.decorators';
import type { AuthUser } from '../auth/auth.types';

@Controller('reports')
export class ReportsController {
  @Get('owner')
  owner(@CurrentUser() user: AuthUser): { userId: string } {
    return { userId: user.id };
  }

  @Roles(['ADMIN'])
  @Get('admin')
  admin(): { message: string } {
    return { message: 'Admins only' };
  }

  @Public()
  @Get('status')
  status(): { available: boolean } {
    return { available: true };
  }
}
```

`@Public()` skips authentication, not rate limiting or role checks. Avoid
combining it with `@Roles()`. Role checks also do not enforce record ownership;
scope user-owned queries using `@CurrentUser()` in your service calls.

## Change the database

Edit `prisma/schema.prisma`, then run against your development database:

```bash
pnpm run prisma:migrate:dev --name add_reports
pnpm run prisma:generate
```

Commit the schema and the new migration directory. The generated client in
`src/generated/prisma/` is ignored; regenerate it after schema changes or pulling
changes that affect it. Generation is explicit here, and also runs during builds.
Use `prisma:migrate:deploy` to apply committed migrations in other environments.

## Verify changes

```bash
pnpm test --runTestsByPath src/auth/auth.service.spec.ts
pnpm run test:e2e
pnpm run test:cov
pnpm run typecheck
pnpm run format:check
```

Keep unit tests beside their implementation as `*.spec.ts`. The HTTP suite
uses the real app wiring and validation, fake configuration from
`test/setup-env.ts`, and `InMemoryPrisma` in place of PostgreSQL. It needs no
database and does not load `.env`. Extend the stand-in when adding database
operations; these tests do not verify SQL, migrations or database concurrency.

Coverage thresholds are 80% branches and 85% functions, lines and statements
for the files included by `jest.config.ts`. The formatting script checks
TypeScript only. For Markdown, use `pnpm exec prettier --check README.md "docs/*.md"`.

CircleCI runs formatting, lint, typechecking, coverage, HTTP tests and a build;
it does not deploy. `pnpm run run:ci` runs the checks locally but omits the build.

## Toolchain maintenance

The repository pins Node to 26.13.0 in `.nvmrc`, `Dockerfile` and
`.circleci/config.yml`; keep those aligned with `package.json`'s engine range.
It uses TypeScript 6 and CommonJS output. The Jest scripts pass
`--experimental-vm-modules` for the NestJS ES module dependencies; use those
scripts rather than invoking Jest directly.
