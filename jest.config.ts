import { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/$1',
    '^@generated/(.*)$': '<rootDir>/../generated/$1',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s', // Include only TypeScript and JavaScript files
    '!**/node_modules/**', // Exclude node_modules
    '!**/dist/**', // Exclude build artifacts
    '!**/src/main.ts', // Exclude main.ts if coverage for it isn't critical
    '!**/*.module.ts', // Exclude module files as they are mostly configuration
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    '/src/main.ts', // Ignore main.ts in coverage
  ],
  coverageThreshold: {
    global: {
      branches: 0, // Temporarily lowered for CI bring-up
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
};

export default config;
