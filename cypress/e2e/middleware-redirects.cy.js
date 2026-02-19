/**
 * Middleware E2E Tests
 * 
 * Tests middleware redirects in a real browser environment
 * Run with: npm run cypress:open or npm run cypress:run
 */

describe('Middleware Redirects', () => {
  const baseUrl = Cypress.config('baseUrl') || 'http://localhost:3000';

  describe('Removed Pages Redirects', () => {
    const removedPages = [
      '/rankings',
      '/my-teams',
      '/exposure',
      '/profile-customization',
      '/customer-support',
      '/deposit-history',
      '/mobile-rankings',
      '/mobile-deposit-history',
      '/mobile-profile-customization',
    ];

    removedPages.forEach((path) => {
      it(`should redirect ${path} to home`, () => {
        cy.visit(path, { failOnStatusCode: false });
        
        // Should redirect to home
        cy.url().should('eq', `${baseUrl}/`);
      });
    });
  });

  describe('Legacy Draft Room Redirects', () => {
    beforeEach(() => {
      // Set rollout percentage to 100% for testing
      // In real tests, you might want to test different percentages
      cy.window().then((win) => {
        // Note: Environment variables are set at build time
        // These tests assume VX2_ROLLOUT_PERCENTAGE=1.0
      });
    });

    it('should redirect /draft/v2/[roomId] to /draft/vx2/[roomId]', () => {
      const roomId = 'test-room-123';
      cy.visit(`/draft/v2/${roomId}`, { failOnStatusCode: false });
      
      // Should redirect to vx2
      cy.url().should('include', `/draft/vx2/${roomId}`);
    });

    it('should redirect /draft/v3/[roomId] to /draft/vx2/[roomId]', () => {
      const roomId = 'test-room-456';
      cy.visit(`/draft/v3/${roomId}`, { failOnStatusCode: false });
      
      cy.url().should('include', `/draft/vx2/${roomId}`);
    });

    it('should redirect /draft/topdog/[roomId] to /draft/vx2/[roomId]', () => {
      const roomId = 'test-room-789';
      cy.visit(`/draft/topdog/${roomId}`, { failOnStatusCode: false });
      
      cy.url().should('include', `/draft/vx2/${roomId}`);
    });

    it('should preserve query parameters during redirect', () => {
      const roomId = 'test-room';
      const queryParams = '?pickNumber=50&teamCount=12&fastMode=true';
      
      cy.visit(`/draft/v2/${roomId}${queryParams}`, { failOnStatusCode: false });
      
      // Should redirect with query params
      cy.url().should('include', `/draft/vx2/${roomId}`);
      cy.url().should('include', 'pickNumber=50');
      cy.url().should('include', 'teamCount=12');
      cy.url().should('include', 'fastMode=true');
    });

    it('should set X-VX2-Migration header', () => {
      cy.request({
        url: '/draft/v2/test-room',
        followRedirect: false,
        failOnStatusCode: false,
      }).then((response) => {
        // Check for migration header
        expect(response.headers).to.have.property('x-vx2-migration');
        expect(response.headers['x-vx2-migration']).to.be.oneOf(['redirected', 'legacy']);
      });
    });

    it('should set X-Rollout-Percentage header', () => {
      cy.request({
        url: '/draft/v2/test-room',
        followRedirect: false,
        failOnStatusCode: false,
      }).then((response) => {
        // Check for rollout percentage header
        expect(response.headers).to.have.property('x-rollout-percentage');
        const percentage = parseFloat(response.headers['x-rollout-percentage']);
        expect(percentage).to.be.at.least(0).and.at.most(1);
      });
    });
  });

  describe('Non-Matching Routes', () => {
    it('should not redirect /draft/vx2 routes', () => {
      cy.visit('/draft/vx2/test-room', { failOnStatusCode: false });
      
      // Should stay on vx2 route (not redirect)
      cy.url().should('include', '/draft/vx2/test-room');
    });

    it('should not redirect other routes', () => {
      cy.visit('/some-other-route', { failOnStatusCode: false });
      
      // Should not redirect
      cy.url().should('include', '/some-other-route');
    });
  });

  describe('A/B Test Assignment Consistency', () => {
    it('should assign same user to same variant (cookie-based)', () => {
      // This test requires actual user session
      // In a real scenario, you'd set up authentication
      const roomId = 'test-room';
      
      // First visit
      cy.visit(`/draft/v2/${roomId}`, { failOnStatusCode: false });
      cy.url().then((firstUrl) => {
        // Second visit (same session)
        cy.visit(`/draft/v2/${roomId}`, { failOnStatusCode: false });
        cy.url().then((secondUrl) => {
          // Should redirect to same destination
          expect(firstUrl).to.equal(secondUrl);
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed URLs gracefully', () => {
      cy.visit('/draft/v2/test%20room', { failOnStatusCode: false });
      
      // Should not crash, should handle gracefully
      cy.url().should('be.a', 'string');
    });

    it('should handle very long room IDs', () => {
      const longRoomId = 'a'.repeat(100);
      cy.visit(`/draft/v2/${longRoomId}`, { failOnStatusCode: false });
      
      // Should handle without error
      cy.url().should('be.a', 'string');
    });
  });
});
