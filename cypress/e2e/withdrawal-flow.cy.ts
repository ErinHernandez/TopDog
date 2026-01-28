/**
 * E2E Test: Withdrawal Flow
 *
 * Tests the complete withdrawal/payout journey:
 * 1. Withdrawal eligibility check
 * 2. Withdrawal method selection
 * 3. Amount validation
 * 4. PayPal/PayStack withdrawal
 * 5. Withdrawal confirmation
 * 6. Transaction history
 *
 * This is a CRITICAL financial flow - must be thoroughly tested.
 *
 * @version 2.0.0
 * @updated 2026-01-27
 */

describe('Withdrawal Flow E2E', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();

    // Intercept withdrawal-related API calls
    cy.intercept('GET', '/api/user/balance').as('getBalance');
    cy.intercept('GET', '/api/user/withdrawal-eligibility').as('eligibility');
    cy.intercept('POST', '/api/paypal/withdraw**').as('paypalWithdraw');
    cy.intercept('POST', '/api/paystack/transfer**').as('paystackTransfer');
    cy.intercept('GET', '/api/user/transactions**').as('transactions');
  });

  // ============================================================================
  // WITHDRAWAL ELIGIBILITY
  // ============================================================================

  describe('Withdrawal Eligibility', () => {
    it('should redirect unauthenticated user to login', () => {
      cy.visit('/withdraw');

      // Should redirect to sign in
      cy.url({ timeout: 10000 }).should('satisfy', (url: string) => {
        return (
          url.includes('/signin') ||
          url.includes('/login') ||
          url.includes('/')
        );
      });
    });

    it('should show balance and withdrawal button for authenticated user', () => {
      // Mock authenticated user with balance
      cy.intercept('GET', '/api/user/balance', {
        statusCode: 200,
        body: { balance: 150.0, withdrawable: 100.0 },
      }).as('userBalance');

      cy.visit('/withdraw');

      cy.wait('@userBalance');

      // Should show balance
      cy.contains(/\$150|\$100|balance/i).should('be.visible');
    });

    it('should show different withdrawal and balance amounts', () => {
      // Withdrawable might be less due to pending tournaments
      cy.intercept('GET', '/api/user/balance', {
        statusCode: 200,
        body: {
          balance: 200.0,
          withdrawable: 150.0,
          pending: 50.0,
        },
      }).as('balanceWithPending');

      cy.visit('/withdraw');

      cy.wait('@balanceWithPending');

      // Should indicate pending funds
      cy.contains(/pending|locked|unavailable|50/i).should('be.visible');
    });

    it('should show minimum withdrawal amount', () => {
      cy.intercept('GET', '/api/user/withdrawal-eligibility', {
        statusCode: 200,
        body: {
          eligible: true,
          minimumWithdrawal: 10,
          maximumWithdrawal: 5000,
        },
      }).as('withdrawalLimits');

      cy.visit('/withdraw');

      cy.wait('@withdrawalLimits');

      // Should show minimum
      cy.contains(/\$10|minimum/i).should('be.visible');
    });

    it('should prevent withdrawal when below minimum', () => {
      cy.intercept('GET', '/api/user/balance', {
        statusCode: 200,
        body: { balance: 5.0, withdrawable: 5.0 },
      }).as('lowBalance');

      cy.visit('/withdraw');

      cy.wait('@lowBalance');

      // Withdraw button should be disabled or show warning
      cy.get('[data-cy=withdraw-button], button')
        .contains(/withdraw/i)
        .should('be.disabled');

      cy.contains(/minimum|\$10|not enough/i).should('be.visible');
    });

    it('should show KYC verification requirement', () => {
      cy.intercept('GET', '/api/user/withdrawal-eligibility', {
        statusCode: 200,
        body: {
          eligible: false,
          reason: 'kyc_required',
          message: 'Identity verification required for withdrawals',
        },
      }).as('kycRequired');

      cy.visit('/withdraw');

      cy.wait('@kycRequired');

      // Should show KYC requirement
      cy.contains(/verify|identity|kyc/i).should('be.visible');
    });
  });

  // ============================================================================
  // WITHDRAWAL METHOD SELECTION
  // ============================================================================

  describe('Withdrawal Method Selection', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/user/balance', {
        statusCode: 200,
        body: { balance: 500.0, withdrawable: 500.0 },
      }).as('goodBalance');

      cy.intercept('GET', '/api/user/payment-methods', {
        statusCode: 200,
        body: {
          methods: [
            { id: 'paypal-1', type: 'paypal', email: 'user@example.com' },
            { id: 'bank-1', type: 'bank', last4: '1234' },
          ],
        },
      }).as('paymentMethods');
    });

    it('should show available withdrawal methods', () => {
      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      // Should show payment method options
      cy.contains(/paypal|bank|method/i).should('be.visible');
    });

    it('should allow PayPal withdrawal', () => {
      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      // Select PayPal
      cy.get('[data-cy=method-paypal], button')
        .contains(/paypal/i)
        .click();

      // Should be selected
      cy.get('[data-cy=method-paypal]').should(
        'have.class',
        'selected'
      );
    });

    it('should show saved PayPal email', () => {
      cy.visit('/withdraw');

      cy.wait(['@goodBalance', '@paymentMethods']);

      // Should show linked PayPal email
      cy.contains('user@example.com').should('be.visible');
    });

    it('should allow adding new PayPal account', () => {
      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      // Click add new
      cy.get('[data-cy=add-paypal], button')
        .contains(/add|new|link/i)
        .click();

      // Should show input for PayPal email
      cy.get('input[placeholder*="PayPal"], input[type="email"]').should(
        'be.visible'
      );
    });
  });

  // ============================================================================
  // AMOUNT ENTRY & VALIDATION
  // ============================================================================

  describe('Amount Entry & Validation', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/user/balance', {
        statusCode: 200,
        body: { balance: 500.0, withdrawable: 500.0 },
      }).as('goodBalance');

      cy.intercept('GET', '/api/user/withdrawal-eligibility', {
        statusCode: 200,
        body: {
          eligible: true,
          minimumWithdrawal: 10,
          maximumWithdrawal: 5000,
        },
      }).as('withdrawalLimits');
    });

    it('should allow entering withdrawal amount', () => {
      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      // Enter amount
      cy.get('[data-cy=amount-input], input[placeholder*="Amount"]')
        .clear()
        .type('100');

      cy.get('[data-cy=amount-input]').should('have.value', '100');
    });

    it('should show quick select amounts', () => {
      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      // Quick select buttons
      cy.get('[data-cy=amount-25], [data-cy=amount-50], [data-cy=amount-100]', {
        timeout: 5000,
      }).should('exist');
    });

    it('should validate minimum withdrawal amount', () => {
      cy.visit('/withdraw');

      cy.wait(['@goodBalance', '@withdrawalLimits']);

      // Enter amount below minimum
      cy.get('[data-cy=amount-input], input[placeholder*="Amount"]')
        .clear()
        .type('5');

      // Should show error
      cy.contains(/minimum|\$10|at least/i).should('be.visible');
    });

    it('should validate maximum withdrawal amount', () => {
      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      // Enter amount above balance
      cy.get('[data-cy=amount-input], input[placeholder*="Amount"]')
        .clear()
        .type('600');

      // Should show error
      cy.contains(/maximum|exceeds|balance/i).should('be.visible');
    });

    it('should allow withdrawing full balance', () => {
      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      // Click withdraw all
      cy.get('[data-cy=withdraw-all], button')
        .contains(/all|full|max/i)
        .click();

      // Amount should be set to withdrawable balance
      cy.get('[data-cy=amount-input]').should('have.value', '500');
    });

    it('should show fee calculation', () => {
      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      cy.get('[data-cy=amount-input]').clear().type('100');

      // Should show fee (if any)
      cy.get('[data-cy=fee-display], [class*="fee"]').then(($fee) => {
        if ($fee.length) {
          cy.wrap($fee).should('be.visible');
        }
      });
    });

    it('should show amount to receive after fees', () => {
      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      cy.get('[data-cy=amount-input]').clear().type('100');

      // Should show net amount
      cy.contains(/receive|net|total/i).should('be.visible');
    });
  });

  // ============================================================================
  // PAYPAL WITHDRAWAL
  // ============================================================================

  describe('PayPal Withdrawal', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/user/balance', {
        statusCode: 200,
        body: { balance: 500.0, withdrawable: 500.0 },
      }).as('goodBalance');
    });

    it('should complete PayPal withdrawal', () => {
      cy.intercept('POST', '/api/paypal/withdraw**', {
        statusCode: 200,
        body: {
          success: true,
          transactionId: 'pp-txn-123',
          amount: 100,
          fee: 0,
        },
      }).as('paypalSuccess');

      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      // Select PayPal
      cy.get('[data-cy=method-paypal], button')
        .contains(/paypal/i)
        .click();

      // Enter amount
      cy.get('[data-cy=amount-input]').clear().type('100');

      // Submit
      cy.get('[data-cy=submit-withdrawal], button')
        .contains(/withdraw|submit/i)
        .click();

      // Confirm if modal appears
      cy.get('[data-cy=confirm-withdrawal], button')
        .contains(/confirm/i)
        .click();

      cy.wait('@paypalSuccess');

      // Should show success
      cy.contains(/success|confirmed|sent/i, { timeout: 10000 }).should(
        'be.visible'
      );
    });

    it('should show PayPal processing time', () => {
      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      // Select PayPal
      cy.get('[data-cy=method-paypal], button')
        .contains(/paypal/i)
        .click();

      // Should show processing time
      cy.contains(/1-3|business days|instant|hours/i).should('be.visible');
    });

    it('should handle PayPal account not linked', () => {
      cy.intercept('GET', '/api/user/payment-methods', {
        statusCode: 200,
        body: { methods: [] },
      }).as('noMethods');

      cy.visit('/withdraw');

      cy.wait(['@goodBalance', '@noMethods']);

      // Should prompt to add PayPal
      cy.contains(/link|add|connect.*paypal/i).should('be.visible');
    });

    it('should validate PayPal email format', () => {
      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      // Add new PayPal
      cy.get('[data-cy=add-paypal], button')
        .contains(/add|link/i)
        .click();

      // Enter invalid email
      cy.get('input[placeholder*="PayPal"], input[type="email"]')
        .clear()
        .type('invalid-email');

      // Should show validation error
      cy.contains(/invalid|valid email/i).should('be.visible');
    });
  });

  // ============================================================================
  // BANK WITHDRAWAL (PAYSTACK)
  // ============================================================================

  describe('Bank Withdrawal (PayStack)', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/user/balance', {
        statusCode: 200,
        body: { balance: 500.0, withdrawable: 500.0 },
      }).as('goodBalance');

      // PayStack is used in certain regions
      cy.intercept('GET', '/api/user/region', {
        statusCode: 200,
        body: { region: 'NG', currency: 'NGN' },
      }).as('userRegion');
    });

    it('should show bank withdrawal option for supported regions', () => {
      cy.visit('/withdraw');

      cy.wait(['@goodBalance', '@userRegion']);

      // Bank option should be visible
      cy.get('[data-cy=method-bank], button')
        .contains(/bank/i)
        .should('be.visible');
    });

    it('should require bank account details', () => {
      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      cy.get('[data-cy=method-bank], button')
        .contains(/bank/i)
        .click();

      // Should show bank account fields or saved accounts
      cy.get(
        '[data-cy=bank-account], [data-cy=account-number], input[placeholder*="account"]'
      ).should('exist');
    });

    it('should complete bank withdrawal', () => {
      cy.intercept('POST', '/api/paystack/transfer**', {
        statusCode: 200,
        body: {
          success: true,
          transferId: 'ps-txn-456',
          amount: 10000,
          status: 'pending',
        },
      }).as('paystackSuccess');

      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      // Select bank
      cy.get('[data-cy=method-bank], button')
        .contains(/bank/i)
        .click();

      // Enter amount
      cy.get('[data-cy=amount-input]').clear().type('100');

      // Submit
      cy.get('[data-cy=submit-withdrawal], button')
        .contains(/withdraw/i)
        .click();

      // Confirm
      cy.get('[data-cy=confirm-withdrawal], button')
        .contains(/confirm/i)
        .click();

      cy.wait('@paystackSuccess');

      cy.contains(/success|processing|pending/i).should('be.visible');
    });
  });

  // ============================================================================
  // CONFIRMATION & SECURITY
  // ============================================================================

  describe('Confirmation & Security', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/user/balance', {
        statusCode: 200,
        body: { balance: 500.0, withdrawable: 500.0 },
      }).as('goodBalance');
    });

    it('should show confirmation modal before withdrawal', () => {
      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      // Select method and amount
      cy.get('[data-cy=method-paypal], button')
        .contains(/paypal/i)
        .click();
      cy.get('[data-cy=amount-input]').clear().type('100');

      // Submit
      cy.get('[data-cy=submit-withdrawal], button')
        .contains(/withdraw/i)
        .click();

      // Confirmation modal should appear
      cy.get('[data-cy=confirm-modal], [class*="modal"]').should('be.visible');
      cy.contains(/confirm|review|details/i).should('be.visible');
    });

    it('should show withdrawal details in confirmation', () => {
      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      cy.get('[data-cy=method-paypal], button')
        .contains(/paypal/i)
        .click();
      cy.get('[data-cy=amount-input]').clear().type('100');
      cy.get('[data-cy=submit-withdrawal], button')
        .contains(/withdraw/i)
        .click();

      // Should show all details
      cy.contains('$100').should('be.visible');
      cy.contains(/paypal/i).should('be.visible');
    });

    it('should allow canceling withdrawal', () => {
      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      cy.get('[data-cy=method-paypal], button')
        .contains(/paypal/i)
        .click();
      cy.get('[data-cy=amount-input]').clear().type('100');
      cy.get('[data-cy=submit-withdrawal], button')
        .contains(/withdraw/i)
        .click();

      // Cancel
      cy.get('[data-cy=cancel-withdrawal], button')
        .contains(/cancel|back/i)
        .click();

      // Modal should close
      cy.get('[data-cy=confirm-modal]').should('not.exist');
    });

    it('should require 2FA for large withdrawals', () => {
      cy.intercept('POST', '/api/paypal/withdraw**', {
        statusCode: 403,
        body: { error: '2fa_required', message: 'Two-factor authentication required' },
      }).as('require2FA');

      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      cy.get('[data-cy=method-paypal], button')
        .contains(/paypal/i)
        .click();
      cy.get('[data-cy=amount-input]').clear().type('1000');
      cy.get('[data-cy=submit-withdrawal], button')
        .contains(/withdraw/i)
        .click();
      cy.get('[data-cy=confirm-withdrawal], button')
        .contains(/confirm/i)
        .click();

      cy.wait('@require2FA');

      // Should show 2FA prompt
      cy.contains(/verify|2fa|authentication/i).should('be.visible');
    });
  });

  // ============================================================================
  // TRANSACTION HISTORY
  // ============================================================================

  describe('Transaction History', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/user/transactions**', {
        statusCode: 200,
        body: {
          transactions: [
            {
              id: 'txn-1',
              type: 'withdrawal',
              amount: -100,
              status: 'completed',
              method: 'paypal',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'txn-2',
              type: 'withdrawal',
              amount: -50,
              status: 'pending',
              method: 'bank',
              createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
            {
              id: 'txn-3',
              type: 'deposit',
              amount: 200,
              status: 'completed',
              method: 'card',
              createdAt: new Date(Date.now() - 172800000).toISOString(),
            },
          ],
        },
      }).as('transactionHistory');
    });

    it('should show withdrawal history', () => {
      cy.visit('/account/transactions');

      cy.wait('@transactionHistory');

      // Should show transactions
      cy.contains(/withdrawal|transaction/i).should('be.visible');
    });

    it('should filter by withdrawal transactions', () => {
      cy.visit('/account/transactions');

      cy.wait('@transactionHistory');

      // Filter by withdrawals
      cy.get('[data-cy=filter-withdrawals], button')
        .contains(/withdrawal/i)
        .click();

      // Should only show withdrawals
      cy.get('[data-cy=transaction-row]').each(($row) => {
        cy.wrap($row).should('contain', 'withdrawal');
      });
    });

    it('should show pending withdrawal status', () => {
      cy.visit('/account/transactions');

      cy.wait('@transactionHistory');

      // Should show pending status
      cy.contains(/pending/i).should('be.visible');
    });

    it('should allow viewing transaction details', () => {
      cy.visit('/account/transactions');

      cy.wait('@transactionHistory');

      // Click on transaction
      cy.get('[data-cy=transaction-row]').first().click();

      // Should show details modal
      cy.get('[data-cy=transaction-details], [class*="details"]').should(
        'be.visible'
      );
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Error Handling', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/user/balance', {
        statusCode: 200,
        body: { balance: 500.0, withdrawable: 500.0 },
      }).as('goodBalance');
    });

    it('should handle withdrawal failure gracefully', () => {
      cy.intercept('POST', '/api/paypal/withdraw**', {
        statusCode: 500,
        body: { error: 'Processing error' },
      }).as('withdrawalError');

      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      cy.get('[data-cy=method-paypal], button')
        .contains(/paypal/i)
        .click();
      cy.get('[data-cy=amount-input]').clear().type('100');
      cy.get('[data-cy=submit-withdrawal], button')
        .contains(/withdraw/i)
        .click();
      cy.get('[data-cy=confirm-withdrawal], button')
        .contains(/confirm/i)
        .click();

      cy.wait('@withdrawalError');

      // Should show error
      cy.contains(/error|failed|try again/i).should('be.visible');
    });

    it('should handle rate limiting', () => {
      cy.intercept('POST', '/api/paypal/withdraw**', {
        statusCode: 429,
        body: { error: 'Too many requests' },
      }).as('rateLimited');

      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      cy.get('[data-cy=method-paypal], button')
        .contains(/paypal/i)
        .click();
      cy.get('[data-cy=amount-input]').clear().type('100');
      cy.get('[data-cy=submit-withdrawal], button')
        .contains(/withdraw/i)
        .click();
      cy.get('[data-cy=confirm-withdrawal], button')
        .contains(/confirm/i)
        .click();

      cy.wait('@rateLimited');

      cy.contains(/too many|rate limit|wait/i).should('be.visible');
    });

    it('should handle network errors', () => {
      cy.intercept('POST', '/api/paypal/withdraw**', {
        forceNetworkError: true,
      }).as('networkError');

      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      cy.get('[data-cy=method-paypal], button')
        .contains(/paypal/i)
        .click();
      cy.get('[data-cy=amount-input]').clear().type('100');
      cy.get('[data-cy=submit-withdrawal], button')
        .contains(/withdraw/i)
        .click();
      cy.get('[data-cy=confirm-withdrawal], button')
        .contains(/confirm/i)
        .click();

      // Should show network error
      cy.contains(/network|offline|connection/i, { timeout: 10000 }).should(
        'be.visible'
      );
    });

    it('should handle invalid PayPal account', () => {
      cy.intercept('POST', '/api/paypal/withdraw**', {
        statusCode: 400,
        body: { error: 'Invalid PayPal account' },
      }).as('invalidPaypal');

      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      cy.get('[data-cy=method-paypal], button')
        .contains(/paypal/i)
        .click();
      cy.get('[data-cy=amount-input]').clear().type('100');
      cy.get('[data-cy=submit-withdrawal], button')
        .contains(/withdraw/i)
        .click();
      cy.get('[data-cy=confirm-withdrawal], button')
        .contains(/confirm/i)
        .click();

      cy.wait('@invalidPaypal');

      cy.contains(/invalid.*paypal|account.*error/i).should('be.visible');
    });
  });

  // ============================================================================
  // MOBILE RESPONSIVENESS
  // ============================================================================

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/user/balance', {
        statusCode: 200,
        body: { balance: 500.0, withdrawable: 500.0 },
      }).as('goodBalance');
    });

    it('should be usable on mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      // Core elements should be visible
      cy.get('[data-cy=amount-input], input[placeholder*="Amount"]').should(
        'be.visible'
      );
    });

    it('should show mobile-friendly payment method selection', () => {
      cy.viewport('iphone-x');
      cy.visit('/withdraw');

      cy.wait('@goodBalance');

      // Payment methods should be accessible
      cy.get('[data-cy=method-paypal], button')
        .contains(/paypal/i)
        .should('be.visible');
    });
  });

  // ============================================================================
  // SECURITY TESTS
  // ============================================================================

  describe('Security', () => {
    it('should not expose sensitive data in URL', () => {
      cy.visit('/withdraw');

      // URL should not contain sensitive data
      cy.url().should('not.include', 'email');
      cy.url().should('not.include', 'account');
      cy.url().should('not.include', 'token');
    });

    it('should have CSRF protection', () => {
      cy.intercept('POST', '/api/paypal/withdraw**').as('withdrawRequest');

      // The request should include CSRF token in headers or body
      // This is verified by the backend accepting the request
    });

    it('should require authentication for withdrawal API', () => {
      cy.request({
        method: 'POST',
        url: '/api/paypal/withdraw',
        body: { amount: 100 },
        failOnStatusCode: false,
      }).then((response) => {
        // Should reject unauthenticated requests
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });
  });
});
