# Database & Auth Setup TODOs (Prisma + JWT)

1. Tooling prep

- Ensure Docker DB is running via `just db-up` (or the existing justfile recipe).
- Install Prisma CLI if not already: `pnpm dlx prisma --version` (or add devDependency `pnpm add -D prisma`).

2. Prisma bootstrap

- `pnpm dlx prisma init --datasource-provider postgresql` (keeps `.env` DATABASE_URL in sync).
- Update `DATABASE_URL` to point at the local Docker DB; add a comment for prod Railway URL reference.

3. Model the user

- In `prisma/schema.prisma`, add a `User` model with fields: `id` (cuid), `email` (unique), `passwordHash`, `name`, `role` (enum: USER/ADMIN), `createdAt/updatedAt`.
- Optional: `refreshTokenHash` for rotating refresh tokens.
- Run `pnpm dlx prisma migrate dev --name init_users` against local DB.
- Generate client: `pnpm dlx prisma generate`.

4. Seed baseline data

- Add `prisma/seed.ts` to create an admin user with a known password (hashed) for local use only.
- Wire `package.json` or `justfile` with `prisma db seed` script; run it after migrations.

5. Wire Prisma into Nest

- Create `PrismaModule`/`PrismaService` (singleton) with proper shutdown hooks.
- Add `PrismaService` to modules needing DB access; update `AppModule` imports.
- Create `UserRepository` abstraction that wraps Prisma user queries (findByEmail, findById, createUser, updateRefreshToken).

6. Password handling

- Add `bcrypt` (or `argon2`) dependency; create `PasswordService` to hash/verify with configured salt rounds (env-backed).
- Never store raw passwords; ensure `UserRepository` only deals with hashes.

7. Auth module (JWT)

- Add `AuthModule` with `AuthService`, `AuthController`, and `JwtModule.registerAsync` pulling `JWT_SECRET`, `JWT_EXPIRES_IN` from env.
- Implement login: validate user by email, compare password hash, issue access (and refresh if desired) tokens.
- Implement signup: create user with hashed password; enforce unique email.
- Add `JwtStrategy` and `JwtAuthGuard` to protect routes; test with `@UseGuards(JwtAuthGuard)` on a sample route.
- Optional: refresh token flow—store hashed refresh token on user and rotate on use.

8. DTOs and validation

- Add DTOs for signup/login/refresh with `class-validator` decorators; use `ValidationPipe` globally if not already.
- Hide sensitive fields in responses (omit passwordHash/refreshTokenHash).

9. Config and env

- Extend `ConfigModule` typings to include `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`.
- Update `.env.example` with placeholders; never commit real secrets.

10. Testing

- Unit tests: services (password, auth), guards, and repositories (mock Prisma).
- E2E: spin up Docker DB, run migrations/seeds, hit signup/login/protected routes with Supertest; assert 401/201/200 paths.

11. Observability and security

- Add basic logging around auth events (without sensitive data).
- Consider rate limiting on auth routes and strong password policy.
- Verify Swagger hides password fields and marks auth endpoints appropriately (bearer scheme).

12. Deployment checklist

- Confirm Railway env vars: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`.
- Ensure Prisma migrations run on deploy (justfile or Railway deploy command).
- Re-test curl against `/health` and a protected route with a valid JWT.
