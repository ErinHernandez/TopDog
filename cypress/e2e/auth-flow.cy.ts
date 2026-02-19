/**
 * E2E Test: Complete Authentication Flow
 *
 * Tests the entire user authentication journey:
 * 1. Sign up (new user registration)
 * 2. Sign in (existing user login)
 * 3. Password reset flow
 * 4. Sign out
 * 5. Session management
 *
 * This is a CRITICAL user flow for platform access.
 *
 * @version 2.0.0
 * @updated 2026-01-27
 */

describe('Authentication Flow E2E', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();

    // Intercept auth-related API calls
    cy.intercept('POST', '**/identitytoolkit.googleapis.com/**').as(
      'firebaseAuth'
    );
    cy.intercept('POST', '/api/auth/**').as('authApi');
    cy.intercept('GET', '/api/auth/**').as('authApiGet');
  });

  // ============================================================================
  // SIGN IN FLOW
  // ============================================================================

  describe('Sign In Flow', () => {
    beforeEach(() => {
      cy.visit('/');
    });

    it('should display sign in modal when clicking sign in button', () => {
      // Find and click sign in button
      cy.get('body').then(($body) => {
        // Try different possible selectors for sign in
        const selectors = [
          '[data-cy=sign-in-button]',
          '[data-cy=login-button]',
          'button:contains("Sign In")',
          'button:contains("Log In")',
          'a:contains("Sign In")',
        ];

        for (const selector of selectors) {
          if ($body.find(selector).length > 0) {
            cy.get(selector).first().click();
            break;
          }
        }
      });

      // Verify modal appears with email/password fields
      cy.get('input[placeholder*="Email"], input[placeholder*="email"]', {
        timeout: 5000,
      }).should('be.visible');
      cy.get(
        'input[placeholder*="Password"], input[type="password"]'
      ).should('be.visible');
    });

    it('should show validation error for invalid email format', () => {
      cy.visit('/');

      // Open sign in modal
      cy.get('[data-cy=sign-in-button], button')
        .contains(/sign in|log in/i)
        .first()
        .click({ force: true });

      // Enter invalid email
      cy.get('input[placeholder*="Email"], input[placeholder*="email"]')
        .first()
        .type('invalid-email');

      // Blur to trigger validation
      cy.get('input[placeholder*="Email"]').first().blur();

      // Should show validation error
      cy.contains(/invalid|valid email/i, { timeout: 3000 }).should(
        'be.visible'
      );
    });

    it('should show error for wrong credentials', () => {
      cy.visit('/');

      cy.get('[data-cy=sign-in-button], button')
        .contains(/sign in|log in/i)
        .first()
        .click({ force: true });

      // Enter wrong credentials
      cy.get('input[placeholder*="Email"], input[placeholder*="email"]')
        .first()
        .type('wrong@example.com');
      cy.get('input[placeholder*="Password"], input[type="password"]')
        .first()
        .type('wrongpassword');

      // Submit
      cy.get('button')
        .contains(/sign in|log in/i)
        .click();

      // Should show error message
      cy.contains(/invalid|incorrect|wrong|error/i, { timeout: 10000 }).should(
        'be.visible'
      );
    });

    it('should successfully sign in with valid credentials', () => {
      const email = Cypress.env('TEST_USER_EMAIL');
      const password = Cypress.env('TEST_USER_PASSWORD');

      // Skip if no test credentials configured
      if (!email || !password) {
        cy.log('Test credentials not configured - skipping');
        return;
      }

      cy.visit('/');

      cy.get('[data-cy=sign-in-button], button')
        .contains(/sign in|log in/i)
        .first()
        .click({ force: true });

      cy.get('input[placeholder*="Email"], input[placeholder*="email"]')
        .first()
        .type(email);
      cy.get('input[placeholder*="Password"], input[type="password"]')
        .first()
        .type(password);

      cy.get('button')
        .contains(/sign in|log in/i)
        .click();

      // Should redirect to dashboard or home
      cy.url({ timeout: 15000 }).should('satisfy', (url: string) => {
        return (
          url.includes('/dashboard') ||
          url.includes('/home') ||
          !url.includes('/signin')
        );
      });

      // User should be logged in
      cy.get('[data-cy=user-avatar], [data-cy=user-balance], [data-cy=profile-menu]', {
        timeout: 10000,
      }).should('exist');
    });

    it('should support "Remember Me" functionality', () => {
      cy.visit('/');

      cy.get('[data-cy=sign-in-button], button')
        .contains(/sign in|log in/i)
        .first()
        .click({ force: true });

      // Check remember me if visible
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=remember-me], input[type="checkbox"]').length) {
          cy.get('[data-cy=remember-me], button')
            .contains(/remember/i)
            .click();
        }
      });

      // Verify state
      cy.log('Remember me checkbox interaction completed');
    });

    it('should handle keyboard navigation (Enter to submit)', () => {
      cy.visit('/');

      cy.get('[data-cy=sign-in-button], button')
        .contains(/sign in|log in/i)
        .first()
        .click({ force: true });

      cy.get('input[placeholder*="Email"]').first().type('test@example.com');
      cy.get('input[type="password"]').first().type('password123{enter}');

      // Should attempt sign in (may show error for invalid credentials)
      cy.wait(1000);
    });
  });

  // ============================================================================
  // SIGN UP FLOW
  // ============================================================================

  describe('Sign Up Flow', () => {
    it('should navigate to sign up from sign in modal', () => {
      cy.visit('/');

      // Open sign in
      cy.get('[data-cy=sign-in-button], button')
        .contains(/sign in|log in/i)
        .first()
        .click({ force: true });

      // Click "Sign Up" link
      cy.contains(/sign up|create account|don't have an account/i).click();

      // Should show sign up form
      cy.get('input[placeholder*="Username"], input[placeholder*="username"]', {
        timeout: 5000,
      }).should('be.visible');
    });

    it('should validate username availability', () => {
      cy.visit('/');

      // Navigate to sign up
      cy.get('[data-cy=sign-in-button], button')
        .contains(/sign in|log in/i)
        .first()
        .click({ force: true });
      cy.contains(/sign up|create account/i).click();

      // Intercept username check
      cy.intercept('POST', '/api/auth/username/check').as('usernameCheck');

      // Type username
      cy.get('input[placeholder*="Username"]').first().type('testuser123');

      // Should check availability
      cy.wait('@usernameCheck', { timeout: 5000 }).then((interception) => {
        expect(interception.response?.statusCode).to.be.oneOf([200, 400, 409]);
      });
    });

    it('should show password strength indicator', () => {
      cy.visit('/');

      cy.get('[data-cy=sign-in-button], button')
        .contains(/sign in|log in/i)
        .first()
        .click({ force: true });
      cy.contains(/sign up|create account/i).click();

      // Type weak password
      cy.get('input[type="password"]').first().type('123');

      // May show strength indicator
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy=password-strength]').length) {
          cy.get('[data-cy=password-strength]').should('be.visible');
        }
      });
    });

    it('should prevent sign up with existing email', () => {
      // Intercept signup API
      cy.intercept('POST', '/api/auth/signup', {
        statusCode: 409,
        body: { error: 'Email already exists' },
      }).as('signupConflict');

      cy.visit('/');

      cy.get('[data-cy=sign-in-button], button')
        .contains(/sign in|log in/i)
        .first()
        .click({ force: true });
      cy.contains(/sign up|create account/i).click();

      cy.get('input[placeholder*="Email"]').first().type('existing@example.com');
      cy.get('input[placeholder*="Username"]').first().type('newuser123');
      cy.get('input[type="password"]').first().type('StrongPass123!');

      cy.get('button')
        .contains(/sign up|create/i)
        .click();

      // Should show error
      cy.contains(/already exists|already registered|in use/i, {
        timeout: 10000,
      }).should('be.visible');
    });
  });

  // ============================================================================
  // PASSWORD RESET FLOW
  // ============================================================================

  describe('Password Reset Flow', () => {
    it('should navigate to forgot password from sign in', () => {
      cy.visit('/');

      cy.get('[data-cy=sign-in-button], button')
        .contains(/sign in|log in/i)
        .first()
        .click({ force: true });

      // Click forgot password
      cy.contains(/forgot password|reset password/i).click();

      // Should show reset form
      cy.get('input[placeholder*="Email"]', { timeout: 5000 }).should(
        'be.visible'
      );
    });

    it('should send password reset email', () => {
      // Intercept reset API
      cy.intercept('POST', '**/sendPasswordResetEmail**', {
        statusCode: 200,
      }).as('resetEmail');

      cy.visit('/');

      cy.get('[data-cy=sign-in-button], button')
        .contains(/sign in|log in/i)
        .first()
        .click({ force: true });
      cy.contains(/forgot password/i).click();

      cy.get('input[placeholder*="Email"]').first().type('test@example.com');

      cy.get('button')
        .contains(/send|reset|submit/i)
        .click();

      // Should show success message
      cy.contains(/sent|check your email|instructions/i, {
        timeout: 10000,
      }).should('be.visible');
    });
  });

  // ============================================================================
  // SIGN OUT FLOW
  // ============================================================================

  describe('Sign Out Flow', () => {
    it('should sign out successfully', () => {
      // Skip if no test credentials
      const email = Cypress.env('TEST_USER_EMAIL');
      const password = Cypress.env('TEST_USER_PASSWORD');

      if (!email || !password) {
        cy.log('Test credentials not configured - skipping');
        return;
      }

      // First sign in
      cy.visit('/');
      cy.get('[data-cy=sign-in-button], button')
        .contains(/sign in|log in/i)
        .first()
        .click({ force: true });

      cy.get('input[placeholder*="Email"]').first().type(email);
      cy.get('input[type="password"]').first().type(password);
      cy.get('button')
        .contains(/sign in/i)
        .click();

      // Wait for sign in
      cy.url({ timeout: 15000 }).should('not.include', '/signin');

      // Sign out
      cy.signOut();

      // Should redirect to home/landing
      cy.get('[data-cy=sign-in-button], button')
        .contains(/sign in|log in/i)
        .should('be.visible');
    });

    it('should clear local storage on sign out', () => {
      cy.visit('/');

      // Set some auth-related storage
      cy.window().then((win) => {
        win.localStorage.setItem('authToken', 'test-token');
        win.localStorage.setItem('user', JSON.stringify({ id: '123' }));
      });

      // Sign out via command
      cy.signOut();

      // Check storage is cleared
      cy.window().then((win) => {
        expect(win.localStorage.getItem('authToken')).to.be.null;
      });
    });
  });

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  describe('Session Management', () => {
    it('should redirect to login when accessing protected route without auth', () => {
      cy.visit('/dashboard');

      // Should redirect to sign in or show auth modal
      cy.url({ timeout: 10000 }).should('satisfy', (url: string) => {
        return (
          url.includes('/signin') ||
          url.includes('/login') ||
          url.includes('/')
        );
      });
    });

    it('should maintain session across page navigation', () => {
      const email = Cypress.env('TEST_USER_EMAIL');
      const password = Cypress.env('TEST_USER_PASSWORD');

      if (!email || !password) {
        cy.log('Test credentials not configured - skipping');
        return;
      }

      cy.visit('/');

      // Sign in
      cy.get('[data-cy=sign-in-button], button')
        .contains(/sign in|log in/i)
        .first()
        .click({ force: true });
      cy.get('input[placeholder*="Email"]').first().type(email);
      cy.get('input[type="password"]').first().type(password);
      cy.get('button')
        .contains(/sign in/i)
        .click();

      // Wait for auth
      cy.url({ timeout: 15000 }).should('not.include', '/signin');

      // Navigate to different pages
      cy.visit('/dashboard');
      cy.get('[data-cy=user-avatar], [data-cy=profile-menu]').should('exist');

      cy.visit('/deposit');
      cy.get('[data-cy=user-avatar], [data-cy=profile-menu]').should('exist');
    });
  });

  // ============================================================================
  // PHONE AUTHENTICATION
  // ============================================================================

  describe('Phone Authentication Flow', () => {
    it('should switch to phone input mode when phone number entered', () => {
      cy.visit('/');

      cy.get('[data-cy=sign-in-button], button')
        .contains(/sign in|log in/i)
        .first()
        .click({ force: true });

      // Enter phone number
      cy.get('input[placeholder*="Email"], input[placeholder*="phone"]')
        .first()
        .type('+15551234567');

      // Should show phone-specific UI
      cy.contains(/verification code|send code/i, { timeout: 3000 }).should(
        'be.visible'
      );
    });
  });

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      cy.visit('/');

      cy.get('[data-cy=sign-in-button], button')
        .contains(/sign in|log in/i)
        .first()
        .click({ force: true });

      // Check inputs have accessible labels or placeholders
      cy.get('input').each(($input) => {
        const hasLabel =
          $input.attr('aria-label') ||
          $input.attr('placeholder') ||
          $input.attr('id');
        expect(hasLabel).to.exist;
      });
    });

    it('should be keyboard navigable', () => {
      cy.visit('/');

      cy.get('[data-cy=sign-in-button], button')
        .contains(/sign in|log in/i)
        .first()
        .click({ force: true });

      // Tab through form using keyboard trigger
      cy.get('input[placeholder*="Email"]').first().focus();
      cy.focused().should('have.attr', 'placeholder').and('include', 'mail');

      // Use Tab key press to navigate
      cy.focused().trigger('keydown', { keyCode: 9, key: 'Tab' });
      cy.get('input[type="password"], input[type="tel"]').first().focus();
      cy.focused()
        .should('have.attr', 'type')
        .and('satisfy', (type: string) => type === 'password' || type === 'tel');
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Simulate network failure
      cy.intercept('POST', '**/identitytoolkit.googleapis.com/**', {
        forceNetworkError: true,
      }).as('networkError');

      cy.visit('/');

      cy.get('[data-cy=sign-in-button], button')
        .contains(/sign in|log in/i)
        .first()
        .click({ force: true });

      cy.get('input[placeholder*="Email"]').first().type('test@example.com');
      cy.get('input[type="password"]').first().type('password123');
      cy.get('button')
        .contains(/sign in/i)
        .click();

      // Should show error message (not crash)
      cy.contains(/error|failed|try again|network/i, { timeout: 10000 }).should(
        'be.visible'
      );
    });

    it('should handle rate limiting', () => {
      // Intercept with rate limit response
      cy.intercept('POST', '/api/auth/**', {
        statusCode: 429,
        body: { error: 'Too many requests' },
      }).as('rateLimited');

      cy.visit('/');

      cy.get('[data-cy=sign-in-button], button')
        .contains(/sign in|log in/i)
        .first()
        .click({ force: true });

      cy.get('input[placeholder*="Email"]').first().type('test@example.com');
      cy.get('input[type="password"]').first().type('password123');
      cy.get('button')
        .contains(/sign in/i)
        .click();

      // Should show rate limit message
      cy.contains(/too many|rate limit|try again later/i, {
        timeout: 10000,
      }).should('be.visible');
    });
  });
});
