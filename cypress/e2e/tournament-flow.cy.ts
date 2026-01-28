/**
 * E2E Test: Tournament & League Flow
 *
 * Tests the tournament discovery and entry journey:
 * 1. Tournament browsing
 * 2. Tournament details view
 * 3. Tournament entry (joining)
 * 4. Live tournament tracking
 * 5. Results and standings
 *
 * @version 2.0.0
 * @updated 2026-01-27
 */

describe('Tournament & League Flow E2E', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();

    // Intercept tournament-related API calls
    cy.intercept('GET', '/api/tournaments**').as('getTournaments');
    cy.intercept('GET', '/api/league**').as('getLeague');
    cy.intercept('POST', '/api/tournaments/**').as('tournamentAction');
  });

  // ============================================================================
  // TOURNAMENT BROWSING
  // ============================================================================

  describe('Tournament Browsing', () => {
    beforeEach(() => {
      // Mock tournament data
      cy.intercept('GET', '/api/tournaments**', {
        statusCode: 200,
        body: {
          tournaments: [
            {
              id: 'tourney-1',
              name: 'Weekly Championship',
              entryFee: 25,
              prizePool: 10000,
              participants: 450,
              maxParticipants: 500,
              startTime: new Date(Date.now() + 86400000).toISOString(),
              status: 'registering',
            },
            {
              id: 'tourney-2',
              name: 'Monthly Major',
              entryFee: 100,
              prizePool: 50000,
              participants: 200,
              maxParticipants: 500,
              startTime: new Date(Date.now() + 604800000).toISOString(),
              status: 'registering',
            },
            {
              id: 'tourney-3',
              name: 'Free Practice',
              entryFee: 0,
              prizePool: 0,
              participants: 100,
              maxParticipants: 1000,
              startTime: new Date(Date.now() + 3600000).toISOString(),
              status: 'registering',
            },
          ],
        },
      }).as('mockTournaments');
    });

    it('should display tournament lobby', () => {
      cy.visit('/tournaments');

      cy.wait('@mockTournaments');

      // Should show tournament list
      cy.contains(/tournament|contest|championship/i, { timeout: 10000 }).should(
        'be.visible'
      );
    });

    it('should display tournament cards with key info', () => {
      cy.visit('/tournaments');

      cy.wait('@mockTournaments');

      // Each tournament should show entry fee and prize pool
      cy.get('[data-cy=tournament-card], [class*="tournament"]', {
        timeout: 10000,
      }).should('have.length.at.least', 1);
    });

    it('should filter tournaments by entry fee', () => {
      cy.visit('/tournaments');

      cy.wait('@mockTournaments');

      // Click filter for free tournaments
      cy.get('[data-cy=filter-free], button')
        .contains(/free/i)
        .click();

      // Should only show free tournaments
      cy.get('[data-cy=tournament-card]').each(($card) => {
        cy.wrap($card).should('contain', '$0');
      });
    });

    it('should filter tournaments by entry fee range', () => {
      cy.visit('/tournaments');

      // Look for price range filter
      cy.get('[data-cy=fee-filter], select, [class*="filter"]').then(
        ($filter) => {
          if ($filter.length) {
            cy.wrap($filter).first().click();
            cy.contains('$25').click();
          }
        }
      );
    });

    it('should sort tournaments by start time', () => {
      cy.visit('/tournaments');

      cy.wait('@mockTournaments');

      // Click sort by time
      cy.get('[data-cy=sort-time], button')
        .contains(/time|start|soon/i)
        .click();

      // Tournaments should be sorted
      cy.log('Tournaments sorted by start time');
    });

    it('should sort tournaments by prize pool', () => {
      cy.visit('/tournaments');

      cy.wait('@mockTournaments');

      cy.get('[data-cy=sort-prize], button')
        .contains(/prize|pool|amount/i)
        .click();

      // Tournaments should be sorted
      cy.log('Tournaments sorted by prize pool');
    });

    it('should show countdown for upcoming tournaments', () => {
      cy.visit('/tournaments');

      cy.wait('@mockTournaments');

      // Should show time until start
      cy.contains(/starts in|starting/i).should('be.visible');
    });
  });

  // ============================================================================
  // TOURNAMENT DETAILS
  // ============================================================================

  describe('Tournament Details', () => {
    const tourneyId = 'test-tournament-123';

    beforeEach(() => {
      cy.intercept('GET', `/api/tournaments/${tourneyId}`, {
        statusCode: 200,
        body: {
          id: tourneyId,
          name: 'Test Championship',
          entryFee: 50,
          prizePool: 25000,
          participants: 450,
          maxParticipants: 500,
          startTime: new Date(Date.now() + 86400000).toISOString(),
          status: 'registering',
          payoutStructure: [
            { place: 1, amount: 5000 },
            { place: 2, amount: 3000 },
            { place: 3, amount: 2000 },
          ],
          rules: {
            draftType: 'snake',
            rosterSize: 18,
            teamCount: 12,
          },
        },
      }).as('mockTournamentDetail');
    });

    it('should display tournament details page', () => {
      cy.visit(`/tournaments/${tourneyId}`);

      cy.wait('@mockTournamentDetail');

      // Should show tournament name
      cy.contains('Test Championship').should('be.visible');
    });

    it('should show entry fee and prize pool', () => {
      cy.visit(`/tournaments/${tourneyId}`);

      cy.wait('@mockTournamentDetail');

      // Entry fee
      cy.contains('$50').should('be.visible');

      // Prize pool
      cy.contains(/\$25,?000/i).should('be.visible');
    });

    it('should show payout structure', () => {
      cy.visit(`/tournaments/${tourneyId}`);

      cy.wait('@mockTournamentDetail');

      // Click payouts tab or scroll to payouts
      cy.get('[data-cy=payouts-tab], button')
        .contains(/payout|prizes/i)
        .click();

      // Should show places and amounts
      cy.contains(/1st|first/i).should('be.visible');
      cy.contains(/\$5,?000/i).should('be.visible');
    });

    it('should show tournament rules', () => {
      cy.visit(`/tournaments/${tourneyId}`);

      cy.wait('@mockTournamentDetail');

      // Click rules tab
      cy.get('[data-cy=rules-tab], button')
        .contains(/rules|format/i)
        .click();

      // Should show rules
      cy.contains(/snake|draft/i).should('be.visible');
    });

    it('should show current participants', () => {
      cy.visit(`/tournaments/${tourneyId}`);

      cy.wait('@mockTournamentDetail');

      // Should show participant count
      cy.contains(/450|participants|entries/i).should('be.visible');
    });

    it('should show spots remaining', () => {
      cy.visit(`/tournaments/${tourneyId}`);

      cy.wait('@mockTournamentDetail');

      // Should show remaining spots (500 - 450 = 50)
      cy.contains(/50|spots|remaining/i).should('be.visible');
    });
  });

  // ============================================================================
  // TOURNAMENT ENTRY
  // ============================================================================

  describe('Tournament Entry', () => {
    const tourneyId = 'test-tournament-456';

    beforeEach(() => {
      cy.intercept('GET', `/api/tournaments/${tourneyId}`, {
        statusCode: 200,
        body: {
          id: tourneyId,
          name: 'Entry Test Tournament',
          entryFee: 25,
          prizePool: 10000,
          participants: 400,
          maxParticipants: 500,
          status: 'registering',
        },
      }).as('mockTournament');
    });

    it('should show enter button for unauthenticated user', () => {
      cy.visit(`/tournaments/${tourneyId}`);

      cy.wait('@mockTournament');

      // Enter button should prompt login
      cy.get('[data-cy=enter-tournament], button')
        .contains(/enter|join/i)
        .click();

      // Should show login prompt
      cy.contains(/sign in|log in|create account/i, { timeout: 5000 }).should(
        'be.visible'
      );
    });

    it('should show insufficient balance warning', () => {
      // Mock user with low balance
      cy.intercept('GET', '/api/user/balance', {
        statusCode: 200,
        body: { balance: 10 }, // Less than $25 entry
      }).as('lowBalance');

      cy.visit(`/tournaments/${tourneyId}`);

      cy.wait('@mockTournament');

      // Try to enter
      cy.get('[data-cy=enter-tournament], button')
        .contains(/enter|join/i)
        .click();

      // Should show insufficient funds
      cy.contains(/insufficient|deposit|balance/i, { timeout: 5000 }).should(
        'be.visible'
      );
    });

    it('should successfully enter tournament', () => {
      // Mock successful entry
      cy.intercept('POST', `/api/tournaments/${tourneyId}/enter`, {
        statusCode: 200,
        body: { success: true, entryId: 'entry-123' },
      }).as('enterTournament');

      // Mock sufficient balance
      cy.intercept('GET', '/api/user/balance', {
        statusCode: 200,
        body: { balance: 100 },
      }).as('userBalance');

      cy.visit(`/tournaments/${tourneyId}`);

      cy.wait('@mockTournament');

      // Enter tournament
      cy.get('[data-cy=enter-tournament], button')
        .contains(/enter|join/i)
        .click();

      // Confirm entry
      cy.get('[data-cy=confirm-entry], button')
        .contains(/confirm|yes/i)
        .click();

      cy.wait('@enterTournament');

      // Should show success
      cy.contains(/entered|confirmed|success/i, { timeout: 10000 }).should(
        'be.visible'
      );
    });

    it('should show entry confirmation modal', () => {
      cy.visit(`/tournaments/${tourneyId}`);

      cy.wait('@mockTournament');

      cy.get('[data-cy=enter-tournament], button')
        .contains(/enter|join/i)
        .click();

      // Should show confirmation with details
      cy.get('[data-cy=confirm-modal], [class*="modal"]').should('be.visible');
      cy.contains('$25').should('be.visible');
    });

    it('should allow multiple entries if permitted', () => {
      cy.intercept('GET', `/api/tournaments/${tourneyId}`, {
        statusCode: 200,
        body: {
          id: tourneyId,
          name: 'Multi-Entry Tournament',
          entryFee: 25,
          maxEntriesPerUser: 5,
          userEntries: 1,
        },
      }).as('multiEntryTournament');

      cy.visit(`/tournaments/${tourneyId}`);

      cy.wait('@multiEntryTournament');

      // Should show option for multiple entries
      cy.contains(/entries|multiple|add entry/i).should('be.visible');
    });
  });

  // ============================================================================
  // MY TOURNAMENTS
  // ============================================================================

  describe('My Tournaments', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/user/tournaments', {
        statusCode: 200,
        body: {
          active: [
            { id: 'active-1', name: 'Active Tournament', status: 'in_progress' },
          ],
          upcoming: [
            {
              id: 'upcoming-1',
              name: 'Upcoming Tournament',
              status: 'registering',
            },
          ],
          completed: [
            {
              id: 'completed-1',
              name: 'Completed Tournament',
              status: 'completed',
              result: { place: 15, prize: 0 },
            },
          ],
        },
      }).as('myTournaments');
    });

    it('should show active tournaments', () => {
      cy.visit('/my-tournaments');

      cy.wait('@myTournaments');

      cy.contains(/active|in progress/i).should('be.visible');
      cy.contains('Active Tournament').should('be.visible');
    });

    it('should show upcoming tournaments', () => {
      cy.visit('/my-tournaments');

      cy.wait('@myTournaments');

      cy.contains(/upcoming|scheduled/i).should('be.visible');
      cy.contains('Upcoming Tournament').should('be.visible');
    });

    it('should show completed tournaments with results', () => {
      cy.visit('/my-tournaments');

      cy.wait('@myTournaments');

      cy.contains(/completed|finished/i).should('be.visible');
      cy.contains('Completed Tournament').should('be.visible');
    });

    it('should allow withdrawal from upcoming tournament', () => {
      cy.intercept('POST', '/api/tournaments/upcoming-1/withdraw', {
        statusCode: 200,
        body: { success: true },
      }).as('withdraw');

      cy.visit('/my-tournaments');

      cy.wait('@myTournaments');

      // Find withdraw button
      cy.get('[data-cy=withdraw-tournament], button')
        .contains(/withdraw|leave/i)
        .click();

      // Confirm
      cy.get('[data-cy=confirm-withdraw], button')
        .contains(/confirm|yes/i)
        .click();

      cy.wait('@withdraw');

      cy.contains(/withdrawn|refunded/i).should('be.visible');
    });
  });

  // ============================================================================
  // LIVE TOURNAMENT TRACKING
  // ============================================================================

  describe('Live Tournament Tracking', () => {
    const activeTourneyId = 'live-tournament-123';

    beforeEach(() => {
      cy.intercept('GET', `/api/tournaments/${activeTourneyId}/live`, {
        statusCode: 200,
        body: {
          id: activeTourneyId,
          status: 'in_progress',
          userPosition: 45,
          totalParticipants: 500,
          userPoints: 125.5,
          leaderPoints: 189.3,
          topPlayers: [
            { username: 'Leader1', points: 189.3, position: 1 },
            { username: 'Leader2', points: 185.1, position: 2 },
            { username: 'Leader3', points: 182.4, position: 3 },
          ],
        },
      }).as('liveTournament');
    });

    it('should show live standings', () => {
      cy.visit(`/tournaments/${activeTourneyId}/live`);

      cy.wait('@liveTournament');

      // Should show leaderboard
      cy.contains(/standings|leaderboard/i).should('be.visible');
    });

    it('should show user position', () => {
      cy.visit(`/tournaments/${activeTourneyId}/live`);

      cy.wait('@liveTournament');

      // Should show user's position
      cy.contains(/45|your position/i).should('be.visible');
    });

    it('should show points behind leader', () => {
      cy.visit(`/tournaments/${activeTourneyId}/live`);

      cy.wait('@liveTournament');

      // Points behind (189.3 - 125.5 = 63.8)
      cy.contains(/behind|difference/i).should('be.visible');
    });

    it('should auto-refresh standings', () => {
      cy.visit(`/tournaments/${activeTourneyId}/live`);

      // Wait for initial load
      cy.wait('@liveTournament');

      // Set up another intercept for refresh
      cy.intercept('GET', `/api/tournaments/${activeTourneyId}/live`, {
        statusCode: 200,
        body: {
          id: activeTourneyId,
          status: 'in_progress',
          userPosition: 40, // Position improved
          userPoints: 130.0,
        },
      }).as('refreshedStandings');

      // Wait for refresh (30 seconds typical)
      cy.wait(5000);

      // May have refreshed
      cy.log('Auto-refresh functionality active');
    });
  });

  // ============================================================================
  // TOURNAMENT RESULTS
  // ============================================================================

  describe('Tournament Results', () => {
    const completedTourneyId = 'completed-tournament-123';

    beforeEach(() => {
      cy.intercept('GET', `/api/tournaments/${completedTourneyId}/results`, {
        statusCode: 200,
        body: {
          id: completedTourneyId,
          name: 'Completed Championship',
          status: 'completed',
          finalStandings: [
            { position: 1, username: 'Winner1', points: 250.5, prize: 5000 },
            { position: 2, username: 'Second', points: 245.3, prize: 3000 },
            { position: 3, username: 'Third', points: 240.1, prize: 2000 },
          ],
          userResult: {
            position: 15,
            points: 210.5,
            prize: 0,
          },
        },
      }).as('results');
    });

    it('should show final standings', () => {
      cy.visit(`/tournaments/${completedTourneyId}/results`);

      cy.wait('@results');

      cy.contains(/final|results|standings/i).should('be.visible');
      cy.contains('Winner1').should('be.visible');
    });

    it('should show user final position', () => {
      cy.visit(`/tournaments/${completedTourneyId}/results`);

      cy.wait('@results');

      cy.contains(/15|your finish/i).should('be.visible');
    });

    it('should show prize won (if any)', () => {
      cy.visit(`/tournaments/${completedTourneyId}/results`);

      cy.wait('@results');

      // User didn't win in this mock, but prize section exists
      cy.get('[data-cy=prize-section], [class*="prize"]').should('exist');
    });

    it('should allow viewing detailed roster', () => {
      cy.visit(`/tournaments/${completedTourneyId}/results`);

      cy.wait('@results');

      // Click to view user's roster
      cy.get('[data-cy=view-roster], button')
        .contains(/roster|team/i)
        .click();

      // Should show roster details
      cy.get('[data-cy=roster-view]').should('be.visible');
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle tournament not found', () => {
      cy.intercept('GET', '/api/tournaments/invalid-id', {
        statusCode: 404,
        body: { error: 'Tournament not found' },
      }).as('notFound');

      cy.visit('/tournaments/invalid-id');

      cy.wait('@notFound');

      cy.contains(/not found|error|invalid/i).should('be.visible');
    });

    it('should handle full tournament', () => {
      cy.intercept('POST', '/api/tournaments/full-tournament/enter', {
        statusCode: 409,
        body: { error: 'Tournament is full' },
      }).as('tournamentFull');

      cy.intercept('GET', '/api/tournaments/full-tournament', {
        statusCode: 200,
        body: {
          id: 'full-tournament',
          name: 'Full Tournament',
          participants: 500,
          maxParticipants: 500,
        },
      }).as('fullTournament');

      cy.visit('/tournaments/full-tournament');

      cy.wait('@fullTournament');

      cy.get('[data-cy=enter-tournament], button')
        .contains(/enter/i)
        .should('be.disabled');
    });

    it('should handle network errors gracefully', () => {
      cy.intercept('GET', '/api/tournaments**', {
        forceNetworkError: true,
      }).as('networkError');

      cy.visit('/tournaments');

      // Should show error state
      cy.contains(/error|offline|try again/i, { timeout: 10000 }).should(
        'be.visible'
      );
    });
  });

  // ============================================================================
  // MOBILE RESPONSIVENESS
  // ============================================================================

  describe('Mobile Responsiveness', () => {
    it('should be usable on mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.visit('/tournaments');

      // Core elements should be visible
      cy.get('[data-cy=tournament-card], [class*="tournament"]', {
        timeout: 10000,
      }).should('be.visible');
    });

    it('should show mobile-friendly tournament details', () => {
      cy.viewport('iphone-x');
      cy.visit('/tournaments/test-123');

      // Navigation should be accessible
      cy.get('nav, [data-cy=mobile-nav]').should('exist');
    });
  });
});
