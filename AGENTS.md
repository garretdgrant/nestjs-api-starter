# Repository Guidelines

## Project Structure & Module Organization

- Application code lives in `src/` (controllers, modules, services); entrypoint is `src/main.ts`.
- Unit tests sit alongside modules as `*.spec.ts` under `src/`; end-to-end tests are in `test/` with `jest-e2e.json`.
- Built artifacts output to `dist/` after `pnpm run build`; Docker image uses the multistage `Dockerfile`.
- Task shortcuts are defined in `justfile` (Docker build/run helpers).

## Build, Test, and Development Commands

- Install: `pnpm install`.
- Local dev server with reload: `pnpm run start:dev`.
- Production build: `pnpm run build`; run compiled app with `pnpm run start:prod`.
- Lint: `pnpm run lint`; format check/write: `pnpm run format:check` / `pnpm run format:write`.
- Tests: `pnpm test` (unit), `pnpm run test:e2e` (e2e), `pnpm run test:cov` (coverage, enforces thresholds).
- Docker: `just build-and-run` to build/run on port 8000; `just teardown` to stop/remove.

## Coding Style & Naming Conventions

- TypeScript throughout; prefer explicit types on public APIs; avoid `any` unless unavoidable.
- ESLint (flat config) enforces no-unused-vars; Prettier handles formatting (run via scripts above).
- Files and classes use PascalCase for Nest modules/services/controllers; variables/functions in camelCase.
- Keep controllers lean, delegate logic to services; group related providers within module folders.

## Testing Guidelines

- Unit and e2e tests use Jest/ts-jest; name files `*.spec.ts`.
- Coverage thresholds: 85% for branches, functions, lines, statements (see `jest.config.ts`); use `pnpm run test:cov` before PRs.
- Prefer testing observable behavior over implementation details; mock external calls as needed.

## Commit & Pull Request Guidelines

- Commit messages follow Conventional Commit patterns seen in history (e.g., `feat: ...`, `chore: ...`, `docs: ...`).
- Keep commits scoped and readable; reference issue/PR numbers when applicable.
- PRs should include: concise summary, screenshots for UI-affecting changes (if any), testing notes/commands run, and any config or env var impacts.
- Ensure lint, tests, and coverage pass before requesting review.

## Security & Configuration Tips

- Copy `.env.example` to `.env` for local setup; never commit secrets.
- Swagger is exposed at `/api`; restrict access or disable in production deployments as needed.
