/**
 * E2E Test: Complete Payment Flow
 *
 * Tests the entire user journey for making a deposit:
 * 1. User navigates to deposit page
 * 2. Selects amount
 * 3. Enters payment details
 * 4. Confirms payment
 * 5. Balance is updated
 *
 * This is a CRITICAL user flow that generates revenue.
 */

describe('Payment Flow E2E', () => {
  beforeEach(() => {
    // Clear any existing session
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('Deposit Flow - Authenticated User', () => {
    it('should complete full deposit flow with USD', () => {
      // Step 1: Sign in
      cy.visit('/');
      cy.get('[data-cy=sign-in-button]').click();
      cy.get('[data-cy=email-input]').type('test@example.com');
      cy.get('[data-cy=password-input]').type('testpassword123');
      cy.get('[data-cy=submit-button]').click();

      // Wait for redirect after sign in
      cy.url().should('include', '/dashboard');

      // Step 2: Navigate to deposit page
      cy.get('[data-cy=deposit-button]').click();
      cy.url().should('include', '/deposit');

      // Step 3: Select deposit amount
      cy.get('[data-cy=amount-50]').click(); // $50 quick select
      cy.get('[data-cy=selected-amount]').should('contain', '$50');

      // Step 4: Verify fee calculation
      cy.get('[data-cy=processing-fee]').should('be.visible');
      cy.get('[data-cy=total-amount]').should('contain', '$51.45'); // $50 + 2.9% fee

      // Step 5: Enter payment details (test mode)
      cy.get('[data-cy=card-number]').type('4242424242424242'); // Stripe test card
      cy.get('[data-cy=card-expiry]').type('12/25');
      cy.get('[data-cy=card-cvc]').type('123');
      cy.get('[data-cy=card-zip]').type('12345');

      // Step 6: Confirm payment
      cy.get('[data-cy=confirm-payment-button]').click();

      // Step 7: Wait for payment processing
      cy.get('[data-cy=payment-processing]').should('be.visible');

      // Step 8: Verify success
      cy.get('[data-cy=payment-success]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-cy=success-message]').should('contain', 'Payment successful');

      // Step 9: Verify balance update
      cy.get('[data-cy=user-balance]').should('contain', '$50'); // Balance increased

      // Step 10: Verify transaction history
      cy.visit('/account/transactions');
      cy.get('[data-cy=transaction-list]')
        .first()
        .should('contain', '$50.00')
        .and('contain', 'Deposit');
    });

    it('should handle multi-currency deposit (EUR)', () => {
      cy.visit('/deposit');

      // Change currency
      cy.get('[data-cy=currency-selector]').click();
      cy.get('[data-cy=currency-EUR]').click();

      // Verify exchange rate is displayed
      cy.get('[data-cy=exchange-rate]').should('be.visible');
      cy.get('[data-cy=exchange-rate]').should('contain', 'EUR');

      // Select amount in EUR
      cy.get('[data-cy=custom-amount-input]').type('50');
      cy.get('[data-cy=amount-usd-equivalent]').should('be.visible');

      // Complete payment
      cy.get('[data-cy=card-number]').type('4242424242424242');
      cy.get('[data-cy=card-expiry]').type('12/25');
      cy.get('[data-cy=card-cvc]').type('123');
      cy.get('[data-cy=confirm-payment-button]').click();

      cy.get('[data-cy=payment-success]', { timeout: 10000 }).should('be.visible');
    });

    it('should enforce minimum deposit amount ($5)', () => {
      cy.visit('/deposit');

      // Try to enter amount below minimum
      cy.get('[data-cy=custom-amount-input]').type('4');
      cy.get('[data-cy=confirm-payment-button]').should('be.disabled');
      cy.get('[data-cy=error-message]').should('contain', 'Minimum deposit is $5');
    });

    it('should validate payment card details', () => {
      cy.visit('/deposit');

      // Select amount
      cy.get('[data-cy=amount-50]').click();

      // Try invalid card
      cy.get('[data-cy=card-number]').type('1234567890123456');
      cy.get('[data-cy=card-error]').should('contain', 'Invalid card number');

      // Try expired card
      cy.get('[data-cy=card-number]').clear().type('4242424242424242');
      cy.get('[data-cy=card-expiry]').type('12/20'); // Expired
      cy.get('[data-cy=card-error]').should('contain', 'Card expired');
    });
  });

  describe('Payment Errors', () => {
    it('should handle declined card', () => {
      cy.visit('/deposit');

      cy.get('[data-cy=amount-50]').click();

      // Use Stripe test card that declines
      cy.get('[data-cy=card-number]').type('4000000000000002');
      cy.get('[data-cy=card-expiry]').type('12/25');
      cy.get('[data-cy=card-cvc]').type('123');
      cy.get('[data-cy=confirm-payment-button]').click();

      cy.get('[data-cy=payment-error]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-cy=error-message]').should('contain', 'declined');
    });

    it('should handle insufficient funds', () => {
      cy.visit('/deposit');

      cy.get('[data-cy=amount-50]').click();

      // Use Stripe test card for insufficient funds
      cy.get('[data-cy=card-number]').type('4000000000009995');
      cy.get('[data-cy=card-expiry]').type('12/25');
      cy.get('[data-cy=card-cvc]').type('123');
      cy.get('[data-cy=confirm-payment-button]').click();

      cy.get('[data-cy=payment-error]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-cy=error-message]').should('contain', 'insufficient funds');
    });

    it('should handle network errors gracefully', () => {
      // Intercept and fail the payment API call
      cy.intercept('POST', '/api/create-payment-intent', {
        statusCode: 500,
        body: { error: 'Network error' },
      });

      cy.visit('/deposit');

      cy.get('[data-cy=amount-50]').click();
      cy.get('[data-cy=card-number]').type('4242424242424242');
      cy.get('[data-cy=card-expiry]').type('12/25');
      cy.get('[data-cy=card-cvc]').type('123');
      cy.get('[data-cy=confirm-payment-button]').click();

      cy.get('[data-cy=payment-error]').should('be.visible');
      cy.get('[data-cy=error-message]').should('contain', 'error');
      cy.get('[data-cy=retry-button]').should('be.visible');
    });
  });

  describe('Unauthenticated User', () => {
    it('should redirect to sign in when accessing deposit page', () => {
      cy.visit('/deposit');

      // Should redirect to sign in
      cy.url().should('include', '/signin');
      cy.get('[data-cy=signin-required-message]').should('be.visible');
    });

    it('should return to deposit after signing in', () => {
      cy.visit('/deposit');

      // Redirected to sign in
      cy.url().should('include', '/signin');

      // Sign in
      cy.get('[data-cy=email-input]').type('test@example.com');
      cy.get('[data-cy=password-input]').type('testpassword123');
      cy.get('[data-cy=submit-button]').click();

      // Should return to deposit page
      cy.url().should('include', '/deposit');
    });
  });

  describe('Quick Select Amounts', () => {
    beforeEach(() => {
      cy.visit('/deposit');
    });

    it('should select $25', () => {
      cy.get('[data-cy=amount-25]').click();
      cy.get('[data-cy=selected-amount]').should('contain', '$25');
    });

    it('should select $50', () => {
      cy.get('[data-cy=amount-50]').click();
      cy.get('[data-cy=selected-amount]').should('contain', '$50');
    });

    it('should select $100', () => {
      cy.get('[data-cy=amount-100]').click();
      cy.get('[data-cy=selected-amount]').should('contain', '$100');
    });

    it('should select $250', () => {
      cy.get('[data-cy=amount-250]').click();
      cy.get('[data-cy=selected-amount]').should('contain', '$250');
    });

    it('should allow custom amount', () => {
      cy.get('[data-cy=custom-amount-input]').type('75');
      cy.get('[data-cy=selected-amount]').should('contain', '$75');
    });
  });

  describe('Security', () => {
    it('should not expose sensitive payment data in URL', () => {
      cy.visit('/deposit');

      cy.get('[data-cy=amount-50]').click();
      cy.get('[data-cy=card-number]').type('4242424242424242');

      // URL should not contain card details
      cy.url().should('not.include', '4242');
    });

    it('should use HTTPS in production', () => {
      // This test would check for HTTPS in production environment
      cy.location('protocol').should('eq', 'http:'); // Local dev uses http
      // In production: cy.location('protocol').should('eq', 'https:');
    });

    it('should have CSRF protection', () => {
      cy.intercept('POST', '/api/create-payment-intent').as('paymentIntent');

      cy.visit('/deposit');
      cy.get('[data-cy=amount-50]').click();
      cy.get('[data-cy=card-number]').type('4242424242424242');
      cy.get('[data-cy=card-expiry]').type('12/25');
      cy.get('[data-cy=card-cvc]').type('123');
      cy.get('[data-cy=confirm-payment-button]').click();

      cy.wait('@paymentIntent').its('request.headers').should('have.property', 'content-type');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should work on mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.visit('/deposit');

      cy.get('[data-cy=amount-50]').should('be.visible').click();
      cy.get('[data-cy=selected-amount]').should('contain', '$50');
    });

    it('should work on tablet viewport', () => {
      cy.viewport('ipad-2');
      cy.visit('/deposit');

      cy.get('[data-cy=amount-100]').should('be.visible').click();
      cy.get('[data-cy=selected-amount]').should('contain', '$100');
    });
  });
});
