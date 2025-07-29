describe('Draft Room E2E', () => {
  it('loads the draft lobby', () => {
    cy.visit('/draft');
    cy.contains('Draft Lobby');
  });

  it('creates and joins a draft room', () => {
    cy.visit('/draft');
    cy.get('input[placeholder="New Room Name"]').type('Test Room');
    cy.contains('Create Room').click();
    cy.contains('Test Room');
    cy.contains('Join').click();
    cy.url().should('include', '/draft/');
    cy.contains('Available Players');
  });

  // Add more tests for drafting, queue, rankings, etc.
}); 