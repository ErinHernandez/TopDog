/**
 * Component Test Support File
 *
 * This file is processed and loaded automatically before component test files.
 * Global configuration and custom commands for component testing.
 *
 * @version 2.0.0
 * @updated 2026-01-27
 */

import './commands';
import { mount } from 'cypress/react';

// Augment the Cypress namespace to include type definitions for the custom command
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

Cypress.Commands.add('mount', mount);

// Global styles for component tests
beforeEach(() => {
  // Inject Tailwind CSS if available
  cy.document().then((doc) => {
    const style = doc.createElement('style');
    style.textContent = `
      /* Base component test styles */
      body {
        margin: 0;
        padding: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
    `;
    doc.head.appendChild(style);
  });
});

export {};
