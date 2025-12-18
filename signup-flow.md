# Client Signup Flow (Creates Client + User + Initial Project)

## Goal

Implement a single signup endpoint that:

1. creates a **Client**
2. creates a **User** attached to that client (always a client user; never staff)
3. creates an initial **Project** attached to that client
4. (optionally) returns an **access JWT** so the user is logged in immediately

This flow must be **atomic** (all-or-nothing) to avoid partial data.

---

## 0) Decisions to lock in (MVP defaults)

- **Staff accounts are NOT created via this endpoint.** (No `staffRole` accepted from client input.)
- Signup always creates a **client user**:
  - `role = USER`
  - `staffRole = null`
  - `clientId = created Client.id`
- Create an initial project for the client with:
  - `Project.status = ACTIVE` (default)
  - `Project.description = "Website"` (default unless you add a field)
- Email verification: optional later; for MVP keep `isEmailVerified = false`

---

## 1) Define the endpoint contract

### Route

- `POST /auth/client-signup`

### Request body (recommended MVP)

- `contactName` (string; becomes `User.name`)
- `companyName` (string; becomes `Client.name`)
- `email` (string; used for login; unique)
- `password` (string)
- `projectName` (string)

### Response (MVP)

Return:

- `user` (safe fields only)
- `client` (safe fields only)
- `project` (safe fields only)
- `accessToken` (optional but recommended for smooth UX)

---

## 2) Validation & sanitization rules (backend)

Implement DTO validation + global validation pipe behavior:

- Reject unknown fields (whitelist)
- Enforce constraints:
  - `email` must be valid
  - `password` length >= 8 (and cap to 72 to avoid hashing edge cases)
  - `contactName` length (e.g., 1–80)
  - `companyName` length (e.g., 2–120)
  - `projectName` length (e.g., 2–120)

Sanitize/normalize:

- `email = trim + lowercase`
- `contactName/companyName/projectName = trim`
- Optional: collapse multiple spaces

Security: ensure the request body cannot set:

- `role`
- `staffRole`
- `clientId`
- `isEmailVerified`
  Those must be server-controlled only.

---

## 3) Pre-flight uniqueness checks (before DB transaction)

You should do 2 checks for friendly errors:

1. Check `User.email` uniqueness:
   - findUnique by email
   - if exists → return Conflict (409) “Email already in use”
2. Check `Client.name` uniqueness (because it’s `@unique`):
   - findUnique by client name
   - if exists → return Conflict (409) “Company name already in use”
   - (Optional enhancement) Instead of failing, auto-suggest or auto-suffix the name, but keep MVP simple and fail with a clear message.

Note: you will still handle race conditions in the transaction (Prisma P2002).

---

## 4) Hashing strategy (backend)

- Hash the password using a modern algorithm
- Never log the raw password
- Store the hash in `User.hashedPassword`
- Set `passwordUpdatedAt = now()` (your schema already does default now)

---

## 5) Atomic create: use a single Prisma transaction

This is the core implementation requirement.

Inside a single transaction:

1. Create `Client`
   - `name = companyName`
2. Create `User`
   - `email = normalized email`
   - `name = contactName`
   - `hashedPassword = computed hash`
   - `role = USER`
   - `staffRole = null`
   - `clientId = created Client.id`
   - `isEmailVerified = false` (or true if you want frictionless MVP)
3. Create `Project`
   - `name = projectName`
   - `clientId = created Client.id`
   - rely on defaults for `status` and `description` unless you add optional request fields

Return the created records from the transaction, selecting only safe fields for `User` (exclude hashedPassword).

---

## 6) Handle race conditions & errors cleanly

Even with pre-checks, collisions can happen.

Implement error mapping:

- Prisma unique constraint error (P2002):
  - if it’s email → return 409 “Email already in use”
  - if it’s client name → return 409 “Company name already in use”
- Any other DB error → return 500 with a generic message (don’t leak internals)

Also ensure:

- You never return the password hash in responses
- You don’t reveal whether an email exists in contexts where that matters (for signup it’s fine to say “already in use”)

---

## 7) Post-create auth behavior (choose one)

Return `{ user, client, project }` and ask frontend to call login.

---

## 8) Guarding & access boundaries

- This endpoint must be publicly accessible (no JWT guard).

---

## 9) Auditing (lightweight MVP)

At minimum:

- Log a structured “client_signup_success” event (no sensitive data):
  - userId, clientId, timestamp, ip (if available)
- Log a “client_signup_failed” event:
  - reason category (validation, conflict, server_error)

If you later add an AuditLog table, this becomes a DB insert.

---

## 10) Testing checklist (MVP)

Write e2e tests that cover:

- ✅ successful signup creates exactly 3 records with correct relationships
- ✅ email uniqueness conflict
- ✅ client name uniqueness conflict
- ✅ validation failures (bad email, short password, missing fields)
- ✅ transaction atomicity:
  - simulate a failure mid-transaction (or force a unique conflict) and confirm no partial records exist

---

## 11) Documentation checklist

In README or /docs:

- Endpoint description + request/response shape
- Notes:
  - Staff users are not created via signup
  - Signup creates Client + User + Project atomically
  - CompanyName must be unique (until changed)
- Required env vars for auth (JWT secret, TTL)
