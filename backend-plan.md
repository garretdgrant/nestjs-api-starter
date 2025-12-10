# backend-plan.md

MVP Backend Plan – EDC Client Portal (NestJS API + Postgres)

Goal: Build a small but solid NestJS backend that powers the client dashboard
MVP:

- Clients log in
- They can see their plan + subscription info
- They can submit and view requests
- You (admin) can view/update everything

Stack:

- NestJS (existing starter)
- Postgres (Supabase recommended)
- Prisma (ORM)
- JWT auth (email/password to start)
- Hosted on Railway or Render

You’ll use OpenAI Codex to help write boilerplate as you go.

---

## 1. Project Setup & Tooling

1. Create a new repo, e.g. `edc-client-portal-api`.
2. Copy your existing NestJS starter into this repo.
3. Ensure basic tooling:
   - ESLint / Prettier (if not already)
   - Nest ConfigModule (for env vars)
4. Create `.env` and `.env.example` with at least:
   - `DATABASE_URL=...` (Supabase Postgres connection string)
   - `JWT_SECRET=some-long-random-string`
   - `PORT=3000`
5. Run locally:
   - `npm install`
   - `npm run start:dev`
   - Confirm a basic health endpoint works (e.g. `GET /health`).

Prompt for Codex: “Set up a NestJS app that uses ConfigModule to read
DATABASE_URL, JWT_SECRET, and PORT from .env and expose a simple GET /health
endpoint that returns { status: 'ok' }.”

---

## 2. Database Setup (Supabase + Prisma)

1. Create a Supabase project in a US region close to where your API will be
   hosted.
2. From Supabase settings, copy the Postgres connection string into `.env` as
   `DATABASE_URL`.
3. Install Prisma:
   - `npm install prisma @prisma/client`
   - `npx prisma init`
4. Define a minimal Prisma schema with these models:

   User:
   - id (string or uuid)
   - email (string, unique)
   - passwordHash (string)
   - role (enum: 'admin' | 'client')
   - createdAt, updatedAt (DateTime)

   Client:
   - id
   - name
   - primaryContactName
   - primaryContactEmail
   - websiteUrl (nullable)
   - notes (nullable)
   - createdAt, updatedAt

   Plan:
   - id
   - name (e.g. 'Starter Site', 'Growth Care')
   - type (enum: 'build' | 'care')
   - priceOneTime (nullable, for build packages)
   - priceMonthly (nullable, for care plans)
   - description (nullable)
   - isActive (boolean)

   Subscription:
   - id
   - clientId (FK -> Client)
   - planId (FK -> Plan)
   - status (enum: 'active' | 'paused' | 'canceled') - billingProvider (enum:
     'manual' | 'stripe')
   - billingExternalId (nullable, for Stripe subscription ID etc.)
   - startDate
   - renewsAt (nullable)
   - createdAt, updatedAt

   Request:
   - id
   - clientId (FK -> Client)
   - createdByUserId (FK -> User)
   - title
   - description
   - status (enum: 'new' | 'in_progress' | 'completed' | 'rejected') - priority
     (enum: 'low' | 'normal' | 'high')
   - createdAt, updatedAt

5. Run migrations:
   - `npx prisma migrate dev --name init`
6. Confirm the DB connection by running `npx prisma studio` and checking tables.

Prompt for Codex: “Generate a Prisma schema for Postgres with models User,
Client, Plan, Subscription, and Request, including proper relations and enums as
described. Then add a migration named init.”

---

## 3. NestJS Module Structure

Create these modules:

- `prisma` – PrismaService wrapper
- `auth` – auth service, login route, JWT strategy, guards
- `users` – user entity management (mainly for admin/seed)
- `clients` – client data
- `plans` – website/care plans
- `subscriptions` – client subscriptions to plans
- `requests` – support/change requests from clients

Suggested folder structure under `src`:

- app.module.ts
- prisma/
  - prisma.module.ts
  - prisma.service.ts
- auth/
- users/
- clients/
- plans/
- subscriptions/
- requests/
- common/
  - decorators/
  - guards/
  - interceptors/

Prompt for Codex: “In a NestJS app, create modules and services for auth, users,
clients, plans, subscriptions, and requests, plus a PrismaModule that provides
PrismaService based on @prisma/client and ConfigModule’s DATABASE_URL.”

---

## 4. Authentication & Authorization (MVP)

Goal: simple email/password login that returns a JWT. Two roles: `admin` and
`client`.

1. Install auth dependencies:
   - `npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt`
2. Implement in `auth` module:
   - `POST /auth/login`:
     - body: `email`, `password`
     - look up user by email via Prisma
     - compare `password` with `passwordHash` using bcrypt
     - if OK, issue JWT with payload `{ sub: user.id, role: user.role }`
3. Implement:
   - JwtStrategy
   - JwtAuthGuard
   - `@CurrentUser()` decorator to access current user and role
4. Authorization:
   - Basic guard that checks `user.role === 'admin'` for admin routes.

5. Seeding:
   - Write a simple script (e.g. `npm run seed`) that:
     - creates one admin user (you)
     - creates at least one client user
     - links user to client via foreign key or join pattern you prefer (you can
       keep it simple: a client user is mapped to a Client by clientId field on
       User, or through a separate relation).

Prompt for Codex: “Implement JWT auth in NestJS with a login endpoint that
checks email/password using Prisma + bcrypt, issues a JWT with sub and role,
sets up JwtStrategy, JwtAuthGuard, and a CurrentUser decorator that exposes id
and role on the request.”

---

## 5. Core Client-Facing Endpoints

These endpoints power your Next.js dashboard for clients.

1. `GET /me`
   - Requires auth.
   - If role is `client`:
     - fetch user record
     - fetch associated client
     - fetch active subscriptions with related plans
   - Return JSON with:
     - user
     - client
     - subscriptions (each with plan info)

2. `GET /requests`
   - Requires auth, role = client.
   - Return list of requests for that client (ordered by createdAt desc).

3. `GET /requests/:id`
   - Requires auth, role = client.
   - Return a single request only if it belongs to that client.

4. `POST /requests`
   - Requires auth, role = client.
   - Body: title, description, priority.
   - Create a new Request:
     - clientId = client linked to this user
     - createdByUserId = current user id
     - status defaults to 'new'.

5. (Optional for MVP) `PATCH /requests/:id`
   - Allow client to:
     - add extra clarifications (if status is not completed)
     - or close their own request (status -> 'completed' or 'rejected').

Prompt for Codex: “Create NestJS controllers and services for /me and request
endpoints scoped to the authenticated client. Each request must use the current
user to look up their client and only allow access to their own requests.”

---

## 6. Admin-Facing Endpoints (for You)

Only accessible if `user.role === 'admin'`.

1. `GET /admin/clients`
   - Return all clients with basic info and subscription summary.

2. `GET /admin/clients/:id`
   - Return full client info:
     - client details
     - subscriptions (with plans)
     - recent requests

3. `GET /admin/requests`
   - List all requests with filters by status (optional).

4. `PATCH /admin/requests/:id`
   - Update `status` (new, in_progress, completed, rejected).
   - Optionally add an `internalNotes` field to Request later.

Prompt for Codex: “Implement admin-only NestJS endpoints /admin/clients,
/admin/clients/:id, /admin/requests, and /admin/requests/:id with an AdminGuard
that only allows users whose role is 'admin' to access them.”

---

## 7. Plans & Subscriptions Management

For MVP, you’re manually managing who is on which plan. Billing is still done
via Stripe/Zelle/Venmo outside the app.

1. Seed Plan records:
   - Starter Site – type: 'build', priceOneTime: 1500
   - Growth Site – type: 'build', priceOneTime: 2500
   - Premium Site – type: 'build', priceOneTime: 4000 (or null and indicate
     “starting at”)
   - Basic Care – type: 'care', priceMonthly: 75
   - Growth Care – type: 'care', priceMonthly: 150
   - Premium Care – type: 'care', priceMonthly: 300

2. Endpoints:
   - `GET /plans` (optional client-facing, mostly for UI lists)
   - Admin:
     - `POST /admin/subscriptions` – create a subscription for a client and plan
       (status 'active')
     - `PATCH /admin/subscriptions/:id` – change status or renewsAt.

Prompt for Codex: “Add a seed script that inserts the six predefined plans into
the Plan table, and create endpoints to list plans and manage subscriptions for
clients as an admin.”

---

## 8. Validation, DTOs & Error Handling

1. Use `class-validator` and `class-transformer` for DTOs:
   - Login DTO (`email`, `password`)
   - CreateRequest DTO (`title`, `description`, `priority`)
   - UpdateRequest DTO (`status`, optional new fields)

2. Enable global validation:
   - In `main.ts`, set up `app.useGlobalPipes(new ValidationPipe({ whitelist:
true, forbidNonWhitelisted: true }))`.

3. Return structured error messages (Nest default HttpException is fine for
   MVP).

Prompt for Codex: “Add DTO classes with class-validator for login, request
creation, and update, and configure a global ValidationPipe in main.ts that
whitelists properties and forbids non-whitelisted fields.”

---

## 9. Basic Testing (Optional)

If you want some safety net:

1. Add at least:
   - Unit tests for AuthService (valid and invalid login).
   - E2E test for `/auth/login` and `/me` using Nest TestingModule and
     supertest.

Prompt for Codex: “Create basic Jest unit tests for AuthService login, and an
e2e test file that spins up the Nest app in memory and tests /auth/login and /me
with supertest.”

You can skip this for speed if you want, but it’s nice to have.

---

## 10. Deployment Plan (Railway or Render)

1. Create a service on Railway or Render.
2. Connect GitHub repo.
3. Set build and start commands:
   - Build: `npm run build`
   - Start: `node dist/main.js`
4. Add environment variables in the platform dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `PORT` (for Render/Railway, usually `PORT` is injected; ensure Nest listens
     on it)
5. Deploy.
6. Test:
   - Hit `/health` to confirm API is live.
   - Run login and `/me` calls from Postman or curl.

Optionally:

- Set a custom domain like `api.edcwebdesign.com`.

Prompt for Codex: “Modify main.ts so the Nest app listens on process.env.PORT or
3000 by default, so it works with Render/Railway. Then provide a simple
Dockerfile if needed for deployment.”

---

## 11. Integration with Next.js Frontend (High-Level Overview)

You’ll handle this later, but target these flows:

1. Login page on Next.js:
   - `POST /auth/login` to your API.
   - Store JWT in httpOnly cookie.
2. Dashboard page:
   - Server-side fetch using the JWT cookie:
     - `GET /me` to show plan and subscriptions.
     - `GET /requests` to show recent requests.
3. “New Request” form:
   - `POST /requests` to create a new request.

Your backend is “done enough” when these calls are reliable.

---

## 12. MVP Backend Checklist

You can call backend MVP complete when:

- [ ] NestJS app boots locally with ConfigModule and health endpoint.
- [ ] Supabase Postgres created and `DATABASE_URL` is set.
- [ ] Prisma schema defined (User, Client, Plan, Subscription, Request) and
      migrations applied.
- [ ] Auth module with JWT login works (valid user gets token).
- [ ] `/me` endpoint returns user, client, and subscriptions.
- [ ] Client can list and create requests (`/requests`, `/requests/:id`, `POST
/requests`).
- [ ] Admin endpoints work to view clients and requests and update request
      status.
- [ ] Plan records are seeded and can be associated with subscriptions.
- [ ] API deployed on Railway/Render, reachable over HTTPS.
- [ ] You can manually create a client user, log in as them, and see a realistic
      dashboard payload.

Once this is done, your backend will be ready for you to build the Next.js
dashboard UI on top and start showing clients a legit “portal” experience.
