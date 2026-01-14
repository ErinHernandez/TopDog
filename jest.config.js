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

  // Coverage thresholds - Risk-Based Coverage (Refined Plan)
  // Tier 0: Money touches it (95%+) | Tier 1: Security/Auth (90%+) | Tier 2: Core Logic (80%+)
  // Tier 3: Data Routes (60%+) | Tier 4: UI Components (40%+) | Tier 5: Utilities (Case-by-case)
  coverageThreshold: {
    // Global baseline (achievable)
    global: {
      branches: 50,
      functions: 60,
      lines: 60,
      statements: 60,
    },
    // Tier 0: Payment Routes (95%+)
    './pages/api/stripe/**/*.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './pages/api/paystack/**/*.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './pages/api/paymongo/**/*.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './pages/api/xendit/**/*.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './lib/stripe/**/*.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    // Tier 1: Auth & Security (90%+)
    './lib/apiAuth.js': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './lib/csrfProtection.js': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },

  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
  },

  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.js' }],
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],
}; 