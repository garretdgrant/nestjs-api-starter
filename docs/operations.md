# Configuration and operations

[Back to README](../README.md)

## Configuration

Use [`.env.example`](../.env.example) as the local template. Supply deployment
values through the environment. Configuration is validated at startup in
[`src/config/env.ts`](../src/config/env.ts).

| Variable                 | Default  | Meaning                                                           |
| ------------------------ | -------- | ----------------------------------------------------------------- |
| `DATABASE_URL`           | Required | PostgreSQL connection string                                      |
| `JWT_SECRET`             | Required | Signing secret, at least 32 characters; replace the example value |
| `JWT_EXPIRES_IN`         | `15m`    | Access-token duration, such as `900s`, `15m` or `1h`              |
| `REFRESH_TOKEN_TTL_DAYS` | `30`     | Positive integer; lifetime of each new refresh token              |
| `ENVIRONMENT`            | `dev`    | `dev`, `stag` or `prod`; `prod` disables Swagger                  |
| `PORT`                   | `8000`   | HTTP listening port                                               |

`ENVIRONMENT` and `NODE_ENV` serve different purposes. The Docker image sets
`NODE_ENV=production`, but you must also set `ENVIRONMENT=prod` to disable
`/swagger` and `/swagger-json`. Tests use `NODE_ENV=test` to skip `.env` loading.
Prisma CLI commands separately load `.env` when present via `prisma.config.ts`.

## Local database and containers

`just bootstrap` installs dependencies, starts or reuses PostgreSQL 18 on
port 5433, waits for readiness, applies migrations and generates the client.
It uses the database settings at the top of the `justfile`; keep your local
`DATABASE_URL` aligned with them.

| Command                  | Effect                                                   |
| ------------------------ | -------------------------------------------------------- |
| `just start-local-db`    | Start or reuse the database container                    |
| `just stop-local-db`     | Remove the database container; keep its data volume      |
| `just build-and-run`     | Build and run the API on port 8000 against that database |
| `just teardown`          | Remove the API container                                 |
| `pnpm run prisma:studio` | Browse the configured database                           |

`build-and-run` reads `.env` and overrides `DATABASE_URL` to use the database
container's hostname and internal port 5432. Run `just bootstrap` first on a
fresh checkout. Remove an existing API container with `just teardown` before
running `build-and-run` again.

To change the host database port, remove the old container with
`just stop-local-db`, run `just db_port=5434 bootstrap`, and update your local
`DATABASE_URL` to match. The data volume survives container removal; changing
`db_name` or `db_password` does not reinitialize an existing volume.

## Deployment

The runtime image runs as the `node` user and contains compiled code and
production dependencies. It has no migration CLI or schema files. Apply
committed migrations from a checkout or a separate migration job:

```bash
pnpm run prisma:migrate:deploy
```

Point that job at the target database, then start the new API image with its
configuration. Neither container startup nor CircleCI applies migrations
automatically. Use development migration commands only on development databases.

For browser clients on another origin, add CORS configuration in
`src/app.setup.ts`. Behind a reverse proxy, configure Express `trust proxy` for
your actual proxy topology so rate limits use client addresses. Throttling uses
the default in-memory storage; replicas do not share counters.

## Health and common failures

Both health endpoints are public and subject to rate limiting.

| Check or symptom                             | What it means / next step                                                  |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| `GET /health` → `200`, `message: "OK"`       | HTTP app is responding; does not check PostgreSQL                          |
| `GET /health/db` → `200`, `message: "DB OK"` | `SELECT 1` succeeded; does not verify migrations                           |
| `/health/db` → `500`                         | Database query failed; check connection settings and database availability |
| `Invalid environment configuration`          | Fix the variables named in the startup error                               |
| Missing generated Prisma imports             | Run `pnpm run prisma:generate`                                             |
| Missing database tables                      | Apply migrations against the database the API actually uses                |
| Unexpected `401` after refresh               | Check for duplicate refresh calls or reuse of a replaced token             |

There is no scheduled cleanup of expired or revoked refresh-token rows. If you
add one, account for the fact that retained revoked rows enable reuse detection.
