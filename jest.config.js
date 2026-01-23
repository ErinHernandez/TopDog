module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // Test file matching patterns
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],

  // Paths to ignore when looking for test files
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/__tests__/__mocks__/',
    '/__tests__/factories/',
  ],

  // Code coverage configuration
  collectCoverageFrom: [
    "components/**/*.{js,jsx,ts,tsx}",
    "lib/**/*.{js,jsx,ts,tsx}",
    "pages/**/*.{js,jsx,ts,tsx}",
    "hooks/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/coverage/**",
    "!**/cypress/**",
  ],

  // Coverage thresholds - Enterprise Implementation Guide v2.0
  // Tier 0: Payment & Security (95%+) | Tier 1: Core Business Logic (90%+)
  coverageThreshold: {
    // Global minimum
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
    // Tier 0: Payment & Security (95%+)
    './pages/api/payment/**/*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './pages/api/stripe/**/*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './pages/api/paystack/**/*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './pages/api/paymongo/**/*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './pages/api/xendit/**/*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './lib/auth*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './lib/security*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './lib/stripe/**/*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    // Tier 1: Core Business Logic (90%+)
    './pages/api/draft/**/*.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './pages/api/league/**/*.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './lib/draft*.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './lib/apiAuth.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './lib/csrfProtection.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // Services Layer (90%+) - Critical for query safety
    './lib/services/**/*.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // Monitoring (85%+)
    './lib/monitoring/**/*.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // Slow Drafts API (85%+) - Performance critical
    './pages/api/slow-drafts/**/*.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },

  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    // Mock Next.js server modules for testing
    '^next/server$': '<rootDir>/__tests__/__mocks__/next-server.js',
    // Mock whatwg-encoding to prevent ESM issues
    '^whatwg-encoding$': '<rootDir>/__tests__/__mocks__/whatwg-encoding.js',
  },

  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.js' }],
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],
}; 