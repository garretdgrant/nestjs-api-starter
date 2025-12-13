# User Auth TODOs

- [x] Database setup and deployed
- [x] Service deployed
- [x] Prisma integrated
- [x] Define base user model with role enum and migrate (dev + prod)
- [ ] Define credentials/refresh tokens/permissions models
- [ ] Implement signup flow (input validation, hashing, unique email/username checks)
- [ ] Implement login flow with JWT issuance (access + refresh tokens)
- [ ] Add token refresh endpoint and rotation strategy
- [ ] Protect routes with guards and role-based access control
- [ ] Add password reset flow (token generation, expiry, delivery mechanism)
- [ ] Add email verification flow (token, expiry, delivery)
- [ ] Capture audit logs for auth events (login, logout, password change)
- [ ] Add rate limiting / lockout for repeated failed logins
- [ ] Add e2e tests for auth flows; expand unit tests for services/guards/strategies
- [ ] Document required env vars and local setup steps in README or /docs
