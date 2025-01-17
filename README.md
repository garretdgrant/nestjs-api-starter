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

This project is a boilerplate application designed to demonstrate my skills and best practices in building scalable, maintainable, and production-ready APIs using NestJS. It serves two main purposes:

1. **Portfolio**: To showcase my ability to create professional-grade APIs, incorporating industry best practices and modern tools.
2. **Starter App**: To act as a foundation for quickly spinning up new APIs.

## Features
- **Swagger Integration**: Automatically generated API documentation with Swagger UI.
- **Health Check Endpoint**: `/health` endpoint to monitor application health and uptime.
- **Test Coverage Enforcement**: Jest configured with a minimum coverage threshold of 85% for branches, functions, lines, and statements.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- [Docker](https://www.docker.com/) (optional for Docker setup)

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

3. Set up environment variables:
   Copy `.env.example` to `.env` and update the variables as needed.
   ```bash
   cp .env.example .env
   ```

4. Start the application:
   ```bash
   pnpm run start:dev
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
- Access the interactive Swagger UI at: [http://localhost:8000/api](http://localhost:8000/api)
- View the OpenAPI schema (JSON format) at: [http://localhost:8000/api-json](http://localhost:8000/api-json)


### Health Check
Check the application's health at:
- [http://localhost:8000/health](http://localhost:8000/health)

## Future Updates
The following features are planned for future updates:
- **CircleCI Configuration**: Add automated builds, tests, and deployments to showcase CI/CD skills.
- **Local Docker Database**: Provide a `docker-compose.yml` file to spin up a local database (e.g., PostgreSQL or MySQL).
- **Multistage Dockerfile**: Create an optimized multistage Dockerfile to demonstrate Docker skills.
- **Advanced Testing**: Add integration tests and mocking for third-party APIs.
- **Security Enhancements**: Implement middleware for security headers and environment variable validation.
- **API Versioning**: Introduce API versioning to support multiple versions of the application.
- **Metrics and Monitoring**: Add tools like New Relic for monitoring and logging.

## Contributions
Contributions are not accepted for this repository, feel free to clone to spin up your own api.

## License
This project is licensed under the MIT License.
