/**
 * Cypress Custom Commands
 *
 * Enterprise-grade custom commands for the BestBall Fantasy Football Platform.
 * Provides reusable, type-safe commands for common testing operations.
 *
 * @version 2.0.0
 * @updated 2026-01-27
 */

// ============================================================================
// AUTHENTICATION COMMANDS
// ============================================================================

/**
 * Sign in with email and password
 * Uses the application's sign-in modal flow
 */
Cypress.Commands.add('signIn', (email: string, password: string) => {
  cy.log(`Signing in as ${email}`);

  // Click sign in button (may vary based on page)
  cy.get('[data-cy=sign-in-button], [data-cy=login-button]', {
    timeout: 10000,
  })
    .first()
    .click();

  // Fill in credentials
  cy.get('input[placeholder*="Email"], input[placeholder*="email"]').type(
    email
  );
  cy.get('input[placeholder*="Password"], input[type="password"]').type(
    password
  );

  // Submit
  cy.get('button')
    .contains(/sign in|log in/i)
    .click();

  // Wait for redirect or dashboard
  cy.url({ timeout: 15000 }).should('not.include', '/signin');
});

/**
 * Sign in programmatically via API (faster for setup)
 */
Cypress.Commands.add('signInApi', (email: string, password: string) => {
  cy.log(`API sign in as ${email}`);

  // This would hit your auth API directly
  // For Firebase, you'd typically set up a custom token endpoint
  cy.request({
    method: 'POST',
    url: '/api/auth/signin',
    body: { email, password },
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200 && response.body.token) {
      // Store auth token
      window.localStorage.setItem('authToken', response.body.token);
    }
  });
});

/**
 * Sign up a new user
 */
Cypress.Commands.add(
  'signUp',
  (email: string, password: string, username: string) => {
    cy.log(`Signing up ${email} as ${username}`);

    cy.get('[data-cy=sign-up-button]').click();

    cy.get('input[placeholder*="Email"]').type(email);
    cy.get('input[placeholder*="Username"]').type(username);
    cy.get('input[placeholder*="Password"], input[type="password"]')
      .first()
      .type(password);

    // If there's a confirm password field
    cy.get('input[placeholder*="Confirm"], input[type="password"]')
      .last()
      .then(($el) => {
        if ($el.attr('placeholder')?.toLowerCase().includes('confirm')) {
          cy.wrap($el).type(password);
        }
      });

    cy.get('button')
      .contains(/sign up|create account/i)
      .click();
  }
);

/**
 * Sign out the current user
 */
Cypress.Commands.add('signOut', () => {
  cy.log('Signing out');

  // Try multiple possible sign out button selectors
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy=sign-out-button]').length) {
      cy.get('[data-cy=sign-out-button]').click();
    } else if ($body.find('[data-cy=profile-menu]').length) {
      cy.get('[data-cy=profile-menu]').click();
      cy.contains('Sign Out').click();
    } else {
      // Programmatic sign out
      cy.clearLocalStorage();
      cy.clearCookies();
      cy.visit('/');
    }
  });
});

/**
 * Ensure user is authenticated (or sign in if not)
 */
Cypress.Commands.add('ensureAuthenticated', () => {
  const email = Cypress.env('TEST_USER_EMAIL');
  const password = Cypress.env('TEST_USER_PASSWORD');

  cy.visit('/');
  cy.get('body').then(($body) => {
    // Check if already signed in
    if (
      $body.find('[data-cy=user-avatar]').length ||
      $body.find('[data-cy=user-balance]').length
    ) {
      cy.log('Already authenticated');
    } else {
      cy.signIn(email, password);
    }
  });
});

// ============================================================================
// DRAFT ROOM COMMANDS
// ============================================================================

/**
 * Navigate to a specific draft room
 */
Cypress.Commands.add('visitDraftRoom', (roomId: string) => {
  cy.log(`Visiting draft room: ${roomId}`);
  cy.visit(`/draft/vx2/${roomId}`);

  // Wait for draft room to load
  cy.contains('Initializing', { timeout: 5000 }).should('not.exist');
  cy.get('[data-cy=draft-room], .draft-room', { timeout: 15000 }).should(
    'exist'
  );
});

/**
 * Select a player from the player list
 */
Cypress.Commands.add('selectPlayer', (playerName: string) => {
  cy.log(`Selecting player: ${playerName}`);

  // Search for the player
  cy.get('[data-cy=player-search], input[placeholder*="Search"]')
    .clear()
    .type(playerName);

  // Wait for search results
  cy.wait(500);

  // Click the player row
  cy.contains('[data-cy=player-row], .player-row', playerName, {
    timeout: 5000,
  })
    .first()
    .click();
});

/**
 * Draft a player (select and confirm)
 */
Cypress.Commands.add('draftPlayer', (playerName: string) => {
  cy.log(`Drafting player: ${playerName}`);

  cy.selectPlayer(playerName);

  // Click draft button
  cy.get('[data-cy=draft-button], button')
    .contains(/draft|pick/i)
    .click();

  // Confirm if confirmation modal appears
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy=confirm-draft]').length) {
      cy.get('[data-cy=confirm-draft]').click();
    }
  });

  // Wait for pick to register
  cy.wait(1000);
});

/**
 * Add a player to the queue
 */
Cypress.Commands.add('addToQueue', (playerName: string) => {
  cy.log(`Adding to queue: ${playerName}`);

  cy.selectPlayer(playerName);

  cy.get('[data-cy=add-to-queue], button')
    .contains(/queue|add/i)
    .click();
});

/**
 * Filter players by position
 */
Cypress.Commands.add(
  'filterByPosition',
  (position: 'ALL' | 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF') => {
    cy.log(`Filtering by position: ${position}`);

    cy.get(`[data-cy=position-filter-${position}], button`)
      .contains(new RegExp(`^${position}$`, 'i'))
      .click();
  }
);

/**
 * Wait for turn indicator
 */
Cypress.Commands.add('waitForTurn', (timeout = 120000) => {
  cy.log('Waiting for turn...');

  cy.contains(/your pick|your turn|on the clock/i, { timeout }).should(
    'be.visible'
  );
});

// ============================================================================
// PAYMENT COMMANDS
// ============================================================================

/**
 * Navigate to deposit page and select amount
 */
Cypress.Commands.add('selectDepositAmount', (amount: number) => {
  cy.log(`Selecting deposit amount: $${amount}`);

  cy.visit('/deposit');

  // Try quick select first
  cy.get(`[data-cy=amount-${amount}]`).then(($btn) => {
    if ($btn.length) {
      cy.wrap($btn).click();
    } else {
      // Use custom amount
      cy.get('[data-cy=custom-amount-input]').clear().type(String(amount));
    }
  });
});

/**
 * Enter Stripe test card details
 */
Cypress.Commands.add(
  'enterStripeTestCard',
  (cardNumber = '4242424242424242') => {
    cy.log('Entering Stripe test card');

    cy.get('[data-cy=card-number], input[name*="cardNumber"]').type(cardNumber);
    cy.get('[data-cy=card-expiry], input[name*="expiry"]').type('12/28');
    cy.get('[data-cy=card-cvc], input[name*="cvc"]').type('123');

    // Zip code if present
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy=card-zip]').length) {
        cy.get('[data-cy=card-zip]').type('12345');
      }
    });
  }
);

/**
 * Complete a full payment flow
 */
Cypress.Commands.add(
  'completePayment',
  (amount: number, cardNumber = '4242424242424242') => {
    cy.log(`Completing payment: $${amount}`);

    cy.selectDepositAmount(amount);
    cy.enterStripeTestCard(cardNumber);

    cy.get('[data-cy=confirm-payment-button]').click();

    // Wait for success
    cy.get('[data-cy=payment-success]', {
      timeout: Cypress.env('PAYMENT_TIMEOUT'),
    }).should('be.visible');
  }
);

// ============================================================================
// NAVIGATION COMMANDS
// ============================================================================

/**
 * Navigate to a page and wait for load
 */
Cypress.Commands.add('navigateTo', (page: string) => {
  cy.log(`Navigating to: ${page}`);

  const routes: Record<string, string> = {
    home: '/',
    dashboard: '/dashboard',
    deposit: '/deposit',
    withdraw: '/withdraw',
    draft: '/draft',
    draftLobby: '/draft/lobby',
    profile: '/profile',
    settings: '/settings',
    transactions: '/account/transactions',
    tournaments: '/tournaments',
    myTeams: '/my-teams',
  };

  const url = routes[page] || page;
  cy.visit(url);

  // Wait for page to load (hydration complete)
  cy.get('body').should('not.have.class', 'loading');
});

// ============================================================================
// UTILITY COMMANDS
// ============================================================================

/**
 * Wait for API response with alias
 */
Cypress.Commands.add('waitForApi', (alias: string, timeout = 10000) => {
  cy.wait(`@${alias}`, { timeout });
});

/**
 * Check if element is in viewport
 */
Cypress.Commands.add('isInViewport', { prevSubject: true }, (subject) => {
  const rect = subject[0].getBoundingClientRect();
  const windowHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const windowWidth =
    window.innerWidth || document.documentElement.clientWidth;

  const vertInView = rect.top >= 0 && rect.bottom <= windowHeight;
  const horInView = rect.left >= 0 && rect.right <= windowWidth;

  expect(vertInView && horInView).to.be.true;
});

/**
 * Intercept and mock a specific API endpoint
 */
Cypress.Commands.add(
  'mockApi',
  (
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    response: unknown,
    alias?: string
  ) => {
    cy.intercept(method, url, {
      statusCode: 200,
      body: response,
    }).as(alias || 'mockedApi');
  }
);

/**
 * Take a screenshot with timestamp
 */
Cypress.Commands.add('screenshotWithTimestamp', (name: string) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  cy.screenshot(`${name}_${timestamp}`);
});

/**
 * Check for accessibility issues (basic)
 */
Cypress.Commands.add('checkA11y', () => {
  // Check for common accessibility issues
  cy.get('img').each(($img) => {
    cy.wrap($img).should('have.attr', 'alt');
  });

  cy.get('button').each(($btn) => {
    // Should have text content or aria-label
    const hasText = $btn.text().trim().length > 0;
    const hasAriaLabel = $btn.attr('aria-label');
    expect(hasText || hasAriaLabel).to.be.true;
  });
});

/**
 * Debug helper - log element state
 */
Cypress.Commands.add('debugElement', { prevSubject: true }, (subject) => {
  cy.log(`Element: ${subject.selector}`);
  cy.log(`Visible: ${subject.is(':visible')}`);
  cy.log(`Text: ${subject.text().substring(0, 100)}`);
  cy.log(`Classes: ${subject.attr('class')}`);
  return cy.wrap(subject);
});

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare global {
  namespace Cypress {
    interface Chainable {
      // Authentication
      signIn(email: string, password: string): Chainable<void>;
      signInApi(email: string, password: string): Chainable<void>;
      signUp(
        email: string,
        password: string,
        username: string
      ): Chainable<void>;
      signOut(): Chainable<void>;
      ensureAuthenticated(): Chainable<void>;

      // Draft Room
      visitDraftRoom(roomId: string): Chainable<void>;
      selectPlayer(playerName: string): Chainable<void>;
      draftPlayer(playerName: string): Chainable<void>;
      addToQueue(playerName: string): Chainable<void>;
      filterByPosition(
        position: 'ALL' | 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF'
      ): Chainable<void>;
      waitForTurn(timeout?: number): Chainable<void>;

      // Payment
      selectDepositAmount(amount: number): Chainable<void>;
      enterStripeTestCard(cardNumber?: string): Chainable<void>;
      completePayment(amount: number, cardNumber?: string): Chainable<void>;

      // Navigation
      navigateTo(page: string): Chainable<void>;

      // Utilities
      waitForApi(alias: string, timeout?: number): Chainable<void>;
      isInViewport(): Chainable<boolean>;
      mockApi(
        method: 'GET' | 'POST' | 'PUT' | 'DELETE',
        url: string,
        response: unknown,
        alias?: string
      ): Chainable<void>;
      screenshotWithTimestamp(name: string): Chainable<void>;
      checkA11y(): Chainable<void>;
      debugElement(): Chainable<JQuery<HTMLElement>>;
    }
  }
}

export {};
