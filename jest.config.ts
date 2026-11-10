import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.spec.ts',
    '!**/*.module.ts', // wiring only
    '!main.ts', // bootstrap; covered by running the app
    '!app.setup.ts', // exercised by the e2e suite
    '!generated/**', // Prisma client output
    '!prisma/**', // thin database client wrapper; needs a real database
  ],
  coverageDirectory: '../coverage',
  coverageThreshold: {
    global: {
      // Lower than the rest: TypeScript's emitted decorator metadata adds
      // branches that no test can reach.
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};

export default config;
