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
  CircleCI config that checks and builds the app.

## Quickstart

Prerequisites: [Node.js 26](https://nodejs.org/) (run `nvm use` to pick up `.nvmrc`),
[pnpm](https://pnpm.io/), [Docker](https://www.docker.com/) and
[just](https://github.com/casey/just).

```bash
cp .env.example .env            # then set JWT_SECRET (openssl rand -base64 48)
just bootstrap                  # install dependencies and initialize PostgreSQL
pnpm run start:dev              # API with hot reload on http://localhost:8000
```

`just bootstrap` starts or reuses the local PostgreSQL container, waits for it
to accept connections, applies the checked-in migrations, and generates the
Prisma client. You can rerun it to apply any pending migrations.

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

If port 5433 is already taken, start the database elsewhere with
`just db_port=5434 bootstrap` and change the port in your local `DATABASE_URL`
to match. If the container already exists, run `just stop-local-db` before
changing ports. Its data volume is kept.

### Starting a new project from this starter

1. Change `app` and `db_name` at the top of the `justfile` so containers,
   volumes and databases don't collide with other projects.
2. Update the database name in `.env.example`, and the `name` in
   `package.json`.
3. Update the API title in `src/app.setup.ts`.

## Documentation

- [Authentication](docs/authentication.md): endpoints, token rotation, logout
  behavior and client errors.
- [Development](docs/development.md): where code belongs, adding protected routes,
  schema changes and testing.
- [Configuration and operations](docs/operations.md): environment variables,
  Docker, migrations, health checks and troubleshooting.

## Everyday commands

| Command               | Purpose                                |
| --------------------- | -------------------------------------- |
| `pnpm run start:dev`  | Run with hot reload                    |
| `pnpm test`           | Run unit tests                         |
| `pnpm run test:e2e`   | Run HTTP tests without a database      |
| `pnpm run build`      | Generate the Prisma client and compile |
| `pnpm run start:prod` | Run the compiled app                   |

## License

MIT
