import { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
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
    '/src/main.ts'
  ]
};

export default config;
