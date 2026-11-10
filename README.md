# NestJS API Starter

A starting point for new APIs: NestJS 12, Prisma 7 and PostgreSQL, with user
authentication already working. Clone it, rename it, and start adding your own
modules.

## What's included

- **User auth**: register, login, refresh, logout and "who am I", using
  short-lived JWT access tokens and rotating refresh tokens.
- **Secure by default**: every route requires a token unless marked
  `@Public()`; `@Roles(['ADMIN'])` restricts a route by role; requests are
  rate-limited.
- **PostgreSQL via Prisma**: a `User` and `RefreshToken` schema with one
  initial migration.
- **Swagger UI** at `/swagger` (disabled when `ENVIRONMENT=prod`).
- **Health checks** at `/health` and `/health/db`.
- **Configuration validated at startup**: the app refuses to start with a
  clear message if a required variable is missing.
- **Tests**: Jest unit tests and an end-to-end suite that needs no database.
- **Tooling**: ESLint, Prettier, a multistage Dockerfile, a `justfile`, and a
  CircleCI config that runs checks only.

## Quickstart

Prerequisites: [Node.js 26](https://nodejs.org/) (run `nvm use` to pick up `.nvmrc`),
[pnpm](https://pnpm.io/), [Docker](https://www.docker.com/) and
[just](https://github.com/casey/just).

```bash
pnpm install
cp .env.example .env            # then set JWT_SECRET (openssl rand -base64 48)
just start-local-db             # PostgreSQL 18 on localhost:5432
pnpm run prisma:migrate:dev     # create the tables
pnpm run start:dev              # API with hot reload on http://localhost:8000
```

Then open [http://localhost:8000/swagger](http://localhost:8000/swagger), or
try it from a terminal:

```bash
# Create an account. The response contains accessToken, refreshToken and user.
curl -X POST localhost:8000/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"alice@example.com","password":"correct-horse-battery","name":"Alice"}'

# Call a protected route with the access token.
curl localhost:8000/auth/me -H "Authorization: Bearer <accessToken>"
```

If port 5432 is already taken, start the database elsewhere with
`just db_port=5433 start-local-db` and change the port in `DATABASE_URL`.

### Starting a new project from this starter

1. Change `app` and `db_name` at the top of the `justfile` so containers,
   volumes and databases don't collide with other projects.
2. Update the database name in `.env.example`, and the `name` in
   `package.json`.
3. Update the API title in `src/app.setup.ts`.

## Configuration

Set these in `.env` locally, or in the environment when deployed. See
`.env.example`.

| Variable                 | Required | Default | Purpose                                           |
| ------------------------ | -------- | ------- | ------------------------------------------------- |
| `DATABASE_URL`           | yes      |         | PostgreSQL connection string                      |
| `JWT_SECRET`             | yes      |         | Signs access tokens; at least 32 characters       |
| `JWT_EXPIRES_IN`         | no       | `15m`   | Access token lifetime, such as `15m` or `1h`      |
| `REFRESH_TOKEN_TTL_DAYS` | no       | `30`    | Refresh token lifetime in days                    |
| `ENVIRONMENT`            | no       | `dev`   | `dev`, `stag` or `prod`; `prod` turns Swagger off |
| `PORT`                   | no       | `8000`  | Port the server listens on                        |

## Authentication

| Endpoint              | Auth   | Body                        | Result                              |
| --------------------- | ------ | --------------------------- | ----------------------------------- |
| `POST /auth/register` | public | `email`, `password`, `name` | `201` with tokens and user          |
| `POST /auth/login`    | public | `email`, `password`         | `200` with tokens and user          |
| `POST /auth/refresh`  | public | `refreshToken`              | `200` with a new token pair         |
| `POST /auth/logout`   | public | `refreshToken`              | `204`; the refresh token is revoked |
| `GET /auth/me`        | Bearer |                             | `200` with the signed-in user       |

How it works:

- The **access token** is a JWT that lasts 15 minutes. Send it as
  `Authorization: Bearer <accessToken>`. It carries the user's id, email and
  role, so protected routes do not query the database to authenticate.
- The **refresh token** is a random value that lasts 30 days. Only its SHA-256
  hash is stored. Each one works once: `POST /auth/refresh` returns a new pair
  and revokes the old token.
- If a refresh token that was already used or revoked is presented again, the
  API treats it as possibly stolen and revokes every session for that user, who
  then has to log in again. Clients should make sure they send only one
  refresh request at a time.
- Passwords are hashed with scrypt from Node's built-in `crypto` module, so
  there is no native dependency to compile.
- `register` and `login` allow 10 requests per minute per IP address; all other
  routes allow 100. Behind a reverse proxy, set Express's `trust proxy` so the
  limit applies to the client's address rather than the proxy's.

Protecting your own routes:

```ts
@Controller('reports')
export class ReportsController {
  @Get() // any signed-in user
  list(@CurrentUser() user: AuthUser) {}

  @Roles(['ADMIN']) // admins only
  @Delete(':id')
  remove() {}

  @Public() // no token needed
  @Get('status')
  status() {}
}
```

`Public`, `Roles` and `CurrentUser` come from `src/auth/auth.decorators.ts`.
New users get the `USER` role; to make an admin, set `role` to `ADMIN` on the
row in the database (for example with `pnpm run prisma:studio`).

Not included, to keep the starter small: email verification, password reset,
CORS configuration, and cleanup of expired refresh-token rows.

## Project layout

```
prisma/schema.prisma     Database schema; migrations live beside it
src/main.ts              Entry point
src/app.module.ts        Module wiring and the global guards
src/app.setup.ts         Validation pipe and Swagger setup
src/config/env.ts        Environment validation
src/auth/                Auth endpoints, guards, decorators, password hashing
src/user/                User lookups and creation
src/health/              Health endpoints
src/prisma/              Database client (PrismaService)
src/generated/           Generated Prisma client (not committed)
test/                    End-to-end tests
```

## Commands

| Command                          | What it does                                       |
| -------------------------------- | -------------------------------------------------- |
| `pnpm run start:dev`             | Run with hot reload                                |
| `pnpm run build`                 | Generate the Prisma client and compile to `dist/`  |
| `pnpm run start:prod`            | Run the compiled app                               |
| `pnpm test`                      | Unit tests                                         |
| `pnpm run test:cov`              | Unit tests with coverage thresholds                |
| `pnpm run test:e2e`              | End-to-end tests (in-memory database stand-in)     |
| `pnpm run lint`                  | ESLint                                             |
| `pnpm run typecheck`             | TypeScript check without emitting                  |
| `pnpm run format:check`          | Prettier check (`format:write` to fix)             |
| `pnpm run prisma:migrate:dev`    | Create and apply migrations during development     |
| `pnpm run prisma:migrate:deploy` | Apply existing migrations (staging and production) |
| `pnpm run prisma:studio`         | Browse the database                                |
| `pnpm run run:ci`                | Everything CI runs, in one command                 |

After changing `prisma/schema.prisma`, run `pnpm run prisma:migrate:dev` to
create a migration and regenerate the client.

## Docker

```bash
just start-local-db   # database container on its own Docker network
just build-and-run    # build the image and run it on port 8000
just teardown         # stop and remove the API container
just stop-local-db    # stop the database; its data volume is kept
```

`build-and-run` reads `.env` and points `DATABASE_URL` at the database
container. The image contains only the compiled app and production
dependencies, so apply migrations from your machine or CI with
`pnpm run prisma:migrate:deploy`.

## Notes on the toolchain

- NestJS 12 ships as ES modules. This project stays CommonJS, which works
  through Node's `require(esm)` support. Jest needs the
  `--experimental-vm-modules` flag for this, which the test scripts pass.
- TypeScript is pinned to 6.0: ts-jest, typescript-eslint and the Nest CLI do
  not support TypeScript 7 yet.
- Node is pinned to 26.13.0, the current LTS line, in `.nvmrc`, the
  `Dockerfile` and `.circleci/config.yml`; `package.json` accepts any 26.x from
  26.13.0 up. Update the three pins together.

## License

MIT
