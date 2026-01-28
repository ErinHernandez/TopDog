/**
 * E2E Support File
 *
 * This file is processed and loaded automatically before E2E test files.
 * Global configuration, custom commands, and behavior modifications live here.
 *
 * @version 2.0.0
 * @updated 2026-01-27
 */

import './commands';

// ============================================================================
// GLOBAL BEFORE EACH
// ============================================================================

beforeEach(() => {
  // Clear application state before each test
  cy.clearLocalStorage();
  cy.clearCookies();

  // Intercept and stub analytics to prevent noise
  cy.intercept('POST', '**/analytics**', { statusCode: 200, body: {} }).as(
    'analytics'
  );
  cy.intercept('POST', '**/collect**', { statusCode: 200, body: {} }).as(
    'googleAnalytics'
  );

  // Handle uncaught exceptions (prevent test failures from app errors)
  cy.on('uncaught:exception', (err) => {
    // Return false to prevent Cypress from failing the test
    // for known non-critical errors
    const ignoredErrors = [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection',
      'Network Error',
      'Load failed',
      "Cannot read properties of null (reading 'style')",
    ];

    if (ignoredErrors.some((msg) => err.message.includes(msg))) {
      return false;
    }

    // Let other errors fail the test
    return true;
  });
});

// ============================================================================
// GLOBAL AFTER EACH
// ============================================================================

afterEach(() => {
  // Capture console errors for debugging
  cy.task('log', `Test completed: ${Cypress.currentTest.title}`);
});

// ============================================================================
// GLOBAL HOOKS FOR SPECIFIC TEST SUITES
// ============================================================================

// Add Firebase auth state listener intercept for auth tests
Cypress.Commands.add('interceptFirebaseAuth', () => {
  cy.intercept('POST', '**/identitytoolkit.googleapis.com/**', (req) => {
    req.continue();
  }).as('firebaseAuth');
});

// ============================================================================
// CUSTOM ASSERTIONS
// ============================================================================

// Add custom Chai assertion for visibility with scroll
chai.Assertion.addMethod('beVisibleWithinViewport', function () {
  const $el = this._obj;
  const isVisible = $el.is(':visible');
  const inViewport = $el[0] ? isElementInViewport($el[0]) : false;

  this.assert(
    isVisible && inViewport,
    'expected #{this} to be visible within viewport',
    'expected #{this} not to be visible within viewport',
    true, // expected
    isVisible && inViewport // actual
  );
});

// Helper function to check if element is in viewport
function isElementInViewport(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Intercept Firebase authentication requests
       */
      interceptFirebaseAuth(): Chainable<void>;
    }
  }
}

export {};
