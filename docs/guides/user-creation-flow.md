# User Creation Flow (Client Users)

This documents how the current user creation endpoint is wired so new DTOs/controllers/services can follow the same recipe.

## Components

- Validation (global): `src/main.ts` uses `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- DTO: `src/user/dto/create-client-user.dto.ts` (class-validator + Swagger metadata).
- Controller: `src/user/user.controller.ts` (`POST /users`).
- Service: `src/user/user.service.ts` (hashing, role guard, Prisma create, response sanitization).
- Schema: `prisma/schema.prisma` (User model requires `clientId`, `hashedPassword`; `Role` enum is `USER | ADMIN`).

## Request Shape (DTO)

- Fields: `email` (required, email), `name` (optional string), `password` (required, 8-128 chars), `clientId` (required UUID), `role` (optional; allowed values constrained to `USER`; defaults to `USER`).
- class-validator decorators enforce format; extra/unknown fields are rejected by the global pipe.
- Swagger decorators describe examples and allowed enums.

## Controller Pattern (`user.controller.ts`)

- `@ApiTags('users')`, `@ApiBody({ type: CreateClientUserDto })`, `@ApiCreatedResponse(...)`.
- Method signature: `createClientUser(@Body() dto: CreateClientUserDto)`.
- Returns the service result (user without `hashedPassword`).

## Service Pattern (`user.service.ts`)

- Validates role server-side: only `Role.USER` is accepted for API-created client users; otherwise throws `BadRequestException`.
- Hashes password with `bcrypt` before persisting.
- Connects the user to the provided `clientId`; fails if the client does not exist.
- Returns a sanitized user (`stripSensitive`) that omits `hashedPassword`.

## Notes / Gotchas

- `clientId` must exist; if not, Prisma will throw a relation error.
- `role: ADMIN` is blocked in the service even if sent in the payload.
- Keep Prisma Client generated (`pnpm run prisma:generate`) so DTO types stay in sync with the enum.
- The global validation pipe will 400 on unknown properties or invalid formats; use it for all DTOs.

## Adding New DTO + Endpoint (Recipe)

1. Define a DTO with class-validator decorators and Swagger `@ApiProperty` hints.
2. Ensure only allowed enum values are exposed (use tuples + `IsIn`).
3. Use the DTO in the controller method signature and add `@ApiBody`/response decorators.
4. In the service, enforce business rules (role guards, hashing, tenancy checks) and strip sensitive fields before returning.
5. If the payload links relations, validate existence or handle Prisma relation errors.
6. Update tests/e2e to cover happy path and rejection cases (invalid payload, disallowed role, missing relations).
