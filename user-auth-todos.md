# User Auth TODOs

- [x] Database setup and deployed
- [x] Service deployed
- [x] Prisma integrated
- [x] Define base user model with role enum and migrate (dev + prod)

## Core Auth Models

- [x] Define credentials model (password hash, provider, status)
- [x] Define refresh token / session model (userId, device/userAgent, ip, expiry, revokedAt)
- [x] Decide auth strategy (JWT TTLs, refresh TTL, rotation policy, storage mechanism)
- [x] Add logout + refresh token revocation flow (Done on client side for now)

## Auth Flows

- [ ] Implement signup flow (input validation, hashing, unique email/username checks)
- [ ] Implement login flow with JWT issuance (access + refresh tokens)
- [ ] Protect routes with JWT guards and role-based access control
- [ ] Implement token refresh endpoint with rotation strategy

## Security & Hardening

- [ ] Add rate limiting and account lockout for repeated failed logins
- [ ] Add CSRF protection if using cookie-based refresh tokens
- [ ] Capture audit logs for auth events (signup, login, logout, password change, token refresh)

## Account Recovery & Trust

- [ ] Add email verification flow (token generation, expiry, delivery mechanism)
- [ ] Add password reset flow (token generation, expiry, delivery mechanism)

## Quality & Ops

- [ ] Add e2e tests for auth flows
- [ ] Expand unit tests for services, guards, and strategies
- [ ] Validate env vars on startup (`@nestjs/config` + schema)
- [ ] Document required env vars and local setup steps in README or `/docs`
