# Repository guidance

## Execution and configuration

- Use pnpm for this project. See `package.json` for scripts and `README.md` for local setup.
- Use MCP servers only when the user explicitly authorizes their use. If a server would help, ask and wait for approval before calling it.
- Run lint, build, and server commands only when the user explicitly asks. This includes scripts and Docker helpers that invoke those commands.
- Never read, print, parse, edit, or load real `.env` files, including through scripts or commands that load them indirectly. Use `.env.example` and the setup docs for configuration questions. Ask the user to set required values or run commands that need those files. Never commit secrets.

## Project layout and conventions

- `src/main.ts` is the NestJS entry point. Keep related controllers, services, and providers together under `src/`. Keep controllers thin and put business logic in services.
- Use TypeScript, explicit types on public APIs, and camelCase for variables and functions. Avoid `any` unless necessary. Use PascalCase for classes and follow nearby filenames, such as `user.service.ts`.
- The build outputs to `dist/`. See `Dockerfile` and `justfile` for container workflows.
- Swagger is exposed at `/swagger` and is disabled when `ENVIRONMENT=prod`.

## Verification

- Keep Jest unit tests alongside the code as `*.spec.ts`. Prefer testing observable behavior and mock external calls as needed.
- For routine changes, run relevant unit tests with `pnpm test --runTestsByPath <path>`. `pnpm test` runs the full unit suite.
- End-to-end tests live under `test/` and use `test/jest-e2e.json`. Use `pnpm run test:e2e` for changes that need end-to-end coverage. Use `pnpm run test:cov` to check coverage before PR review. See `jest.config.ts` for the active thresholds.
- Tests never load real environment files: `AppModule` skips `.env` when `NODE_ENV=test` (Jest sets this), and the end-to-end suite supplies fake values from `test/setup-env.ts` and replaces the database with `test/support/in-memory-prisma.ts`. Keep it that way when adding tests.
- Use `pnpm run format:check` to check formatting. The lint command is `pnpm run lint` and requires an explicit request.

## Commits and pull requests

- Keep commits scoped and use Conventional Commit prefixes such as `feat:`, `chore:`, and `docs:`. Reference relevant issues or PRs when applicable.
- Include a concise summary, checks run and their results, configuration or environment changes, and screenshots for UI changes.
- Lint, tests, and coverage are expected to pass before review. Report any checks still pending because of permissions or environment requirements.
