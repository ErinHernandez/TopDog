/**
 * Draft Room Utility Functions
 * 
 * Extracted from the large [roomId].js file for better organization
 */

/**
 * Generate a random team name from adjectives and nouns
 */
export function getRandomName(): string {
  const adjectives = ['Swift', 'Mighty', 'Brave', 'Clever', 'Fierce', 'Noble', 'Wild', 'Bold', 'Sharp', 'Quick'];
  const nouns = ['Wolf', 'Eagle', 'Lion', 'Tiger', 'Bear', 'Hawk', 'Fox', 'Panther', 'Falcon', 'Jaguar'];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective} ${noun}`;
}

/**
 * Format ADP (Average Draft Position) for display
 * - Returns '-' for invalid ADP
 * - Formats to 1 decimal place
 * - For ADP < 10.0, replaces leading zero with 2 spaces for alignment
 */
export function formatADP(adp: number | null | undefined): string {
  if (!adp || adp <= 0) return '-';
  const formatted = adp.toFixed(1);
  // If ADP is under 10.0, replace leading zero with 2 spaces
  if (adp < 10.0) {
    return formatted.replace(/^0/, '  ');
  }
  return formatted;
}
