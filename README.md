<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# NestJS API Starter

This project is a boilerplate application designed to demonstrate my skills and
best practices in building scalable, maintainable, and production-ready APIs
using NestJS. It serves two main purposes:

1. **Portfolio**: To showcase my ability to create professional-grade APIs,
   incorporating industry best practices and modern tools.
2. **Starter App**: To act as a foundation for quickly spinning up new APIs.

## Features

- **Swagger Integration**: Automatically generated API documentation with
  Swagger UI.
- **Health Check Endpoint**: `/health` endpoint to monitor application health
  and uptime.
- **Client Signup Flow**: `POST /auth/client-signup` creates Client + User +
  Project atomically and returns a JWT for immediate login.
- **Test Coverage Enforcement**: Jest configured with a minimum coverage
  threshold of 85% for branches, functions, lines, and statements.
- **Multistage Docker Image**: Efficient Dockerfile design to optimize build and
  runtime images for production-ready deployments.
- **Task Automation with Justfile**: Simplified commands for building, running,
  and cleaning up Docker containers.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- [Docker](https://www.docker.com/) (optional for Docker setup)
- [Just Task Runner](https://www.npmjs.com/package/just-task) (optional for simplifying commands)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/garretdgrant/nestjs-api-starter.git
   cd nestjs-api-starter
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables: Copy `.env.example` to `.env` and update the
   variables as needed.

   ```bash
   cp .env.example .env
   ```

4. Start the application:
   ```bash
   pnpm run start:dev
   ```

### Running with Docker

You can run the application using Docker, either with the `just` command or
manually.

#### Option 1: Using `just`

If you have the `just` task runner installed, use the following commands:

- **Build and run the container**:

  ```bash
  just build-and-run
  ```

  This builds the Docker image and starts the container on port `8000`.

- **Stop and remove the running container**:
  ```bash
  just teardown
  ```
  This stops and removes any containers started by the `build-and-run` command.

#### Option 2: Using Docker Commands

If you don’t have `just`, you can build and run the container manually:

- **Build and run the container**:

  ```bash
  docker build -t nestjs-api-starter .
  docker run -d -p 8000:8000 nestjs-api-starter
  ```

- **Stop and remove the running container**:
  ```bash
  docker ps -q --filter "ancestor=nestjs-api-starter" | xargs -r docker stop
  docker ps -a -q --filter "ancestor=nestjs-api-starter" | xargs -r docker rm
  ```

### Running Tests

Run tests with Jest:

```bash
pnpm run test
```

Generate a coverage report:

```bash
pnpm run test:cov
```

### Swagger UI

- Access the interactive Swagger UI at:
  [http://localhost:8000/api](http://localhost:8000/api)
- View the OpenAPI schema (JSON format) at:
  [http://localhost:8000/api-json](http://localhost:8000/api-json)

### Auth: Client Signup (MVP)

- **Endpoint**: `POST /auth/client-signup` (public)
- **Purpose**: Atomically create a Client, a client User, and an initial Project,
  then return a JWT for immediate login.
- **Request body**:
  ```json
  {
    "contactName": "Alice Doe",
    "companyName": "Acme Co",
    "email": "alice@example.com",
    "password": "supersecret",
    "projectName": "Website"
  }
  ```
- **Response**:
  ```json
  {
    "accessToken": "<jwt>",
    "user": { "id": "...", "email": "...", "role": "USER", "clientId": "..." },
    "client": { "id": "...", "name": "Acme Co" },
    "project": { "id": "...", "clientId": "...", "name": "Website" }
  }
  ```
- Validation: trims input, lowercases email, enforces lengths (email valid,
  password 8–72 chars, names 1–120 chars).
- Errors: `409 Email already in use`, `409 Company name already in use`, or
  validation errors per field.

### Health Check

Check the application's health at:

- [http://localhost:8000/health](http://localhost:8000/health)

## Future Updates

The following features are planned for future updates:

- **CircleCI Configuration**: Add automated builds, tests, and deployments to
  showcase CI/CD skills.
- **Local Docker Database**: Provide a `docker-compose.yml` file to spin up a
  local database (e.g., PostgreSQL or MySQL).
- **Advanced Testing**: Add integration tests and mocking for third-party APIs.
- **Security Enhancements**: Implement middleware for security headers and
  environment variable validation.
- **API Versioning**: Introduce API versioning to support multiple versions of
  the application.
- **Metrics and Monitoring**: Add tools like New Relic for monitoring and
  logging.

## Contributions

Contributions are not accepted for this repository, feel free to clone to spin
up your own API.

## License

This project is licensed under the MIT License.
