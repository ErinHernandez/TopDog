/**
 * Cypress Configuration - Enterprise E2E Testing
 *
 * Comprehensive configuration for E2E and component testing
 * of the BestBall Fantasy Football Platform.
 *
 * @version 2.0.0
 * @updated 2026-01-27
 */

import { defineConfig } from 'cypress';

export default defineConfig({
  // ============================================================================
  // E2E CONFIGURATION
  // ============================================================================
  e2e: {
    baseUrl: 'http://localhost:3000',

    // Test file patterns
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',

    // Viewport settings (optimized for draft room)
    viewportWidth: 1280,
    viewportHeight: 720,

    // Timeouts (generous for API-heavy operations)
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 30000,
    pageLoadTimeout: 60000,

    // Video recording for CI debugging
    video: true,
    videoCompression: 32,
    videosFolder: 'cypress/videos',

    // Screenshots on failure
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',

    // Retry configuration for flaky test mitigation
    retries: {
      runMode: 2,      // CI retries
      openMode: 0,     // Local development - no retries
    },

    // Wait for XHR/fetch to complete before assertions
    experimentalRunAllSpecs: true,

    // Test isolation - each test starts fresh
    testIsolation: true,

    // Setup node events for custom tasks
    setupNodeEvents(on, config) {
      // Task for clearing test data
      on('task', {
        // Log to terminal (useful for debugging)
        log(message) {
          console.log(message);
          return null;
        },

        // Database cleanup task
        clearTestData() {
          // In production, this would clear test user data
          // For now, just return success
          return null;
        },

        // Generate test user credentials
        generateTestUser() {
          const timestamp = Date.now();
          return {
            email: `test-${timestamp}@bestball-e2e.test`,
            password: `TestPass${timestamp}!`,
            username: `testuser_${timestamp}`,
          };
        },

        // Read environment variables
        getEnv(name) {
          return process.env[name] || null;
        },
      });

      return config;
    },
  },

  // ============================================================================
  // COMPONENT TESTING CONFIGURATION
  // ============================================================================
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
  },

  // ============================================================================
  // ENVIRONMENT VARIABLES
  // ============================================================================
  env: {
    // API endpoints
    apiUrl: 'http://localhost:3000/api',

    // Test user credentials (for authenticated flows)
    TEST_USER_EMAIL: 'cypress-test@example.com',
    TEST_USER_PASSWORD: 'CypressTest123!',

    // Feature flags
    ENABLE_SLOW_DRAFTS: true,
    VX2_ROLLOUT_PERCENTAGE: 1.0,

    // Timeouts for specific operations
    PAYMENT_TIMEOUT: 15000,
    DRAFT_PICK_TIMEOUT: 10000,
    AUTH_TIMEOUT: 10000,

    // Coverage collection (optional)
    codeCoverage: {
      exclude: ['cypress/**/*.*'],
    },
  },

  // ============================================================================
  // BROWSER CONFIGURATION
  // ============================================================================
  // Chromium-based browsers recommended for WebAuthn/biometrics testing
  experimentalModifyObstructiveThirdPartyCode: true,
  chromeWebSecurity: false, // Allow cross-origin for payment providers

  // Block known analytics/tracking domains in tests
  blockHosts: [
    '*.google-analytics.com',
    '*.googletagmanager.com',
    '*.facebook.com',
    '*.hotjar.com',
    '*.amplitude.com',
  ],

  // ============================================================================
  // REPORTER CONFIGURATION
  // ============================================================================
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'cypress/reporter-config.json',
  },
});
