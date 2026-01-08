/**
 * Tournament Season Utilities
 * 
 * Helper functions for determining NFL season status, game days, and when
 * to use real-time Firebase listeners vs one-time fetches.
 * 
 * Optimizes Firebase costs by only using real-time listeners when team data
 * actually changes (game days and post-game days during active tournaments).
 */

/**
 * Check if NFL season is currently active
 * 
 * NFL regular season: Weeks 1-17 (typically September - early January)
 * Week 17 typically ends around January 7-10
 * 
 * Preseason: August (games start, but tournaments may not be active yet)
 * Regular season: September - Week 17 (early January)
 * 
 * Off-season: After Week 17 through July (no games, no updates needed)
 * 
 * NOTE: This is hardcoded for regular season tournaments.
 * Future tournaments (playoffs, weekly) will need flexible schedule logic.
 */
export function isNFLSeasonActive(): boolean {
  const now = new Date();
  const month = now.getMonth(); // 0-11 (Jan = 0, Dec = 11)
  
  // NFL season months: August (7) through January (0)
  // Week 17 typically ends in early January
  // August is preseason, but tournaments may be active
  return month >= 7 || month === 0;
}

/**
 * Check if tournaments are still active
 * 
 * Tournaments end after Week 17 completion (typically early January).
 * After Week 17, all teams are final and no updates are needed.
 * 
 * NOTE: This is hardcoded for regular season tournaments.
 * Future tournaments (playoffs, weekly) will need flexible schedule logic.
 */
export function isTournamentActive(): boolean {
  if (!isNFLSeasonActive()) {
    return false; // Off-season: tournaments not active
  }
  
  const now = new Date();
  const month = now.getMonth();
  const date = now.getDate();
  
  // Week 17 typically ends around January 7-10
  // After that, tournaments are complete and teams are final
  if (month === 0 && date > 10) {
    return false; // After Jan 10, tournaments are done
  }
  
  return true; // Still in season, tournaments active
}

/**
 * Check if today is a game day
 * 
 * NFL games happen on:
 * - Thursday: 1 game (usually)
 * - Sunday: Most games
 * - Monday: 1 game (usually)
 * 
 * Team data (points, status, rankings) ONLY updates on game days.
 * Non-game days have static team data (player news doesn't change team data).
 * 
 * Only relevant during active tournaments (Weeks 1-17).
 */
export function isGameDay(): boolean {
  if (!isTournamentActive()) return false; // Tournaments end after Week 17
  
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0-6 (Sun = 0, Sat = 6)
  
  // Game days: Thursday (4), Sunday (0), Monday (1)
  return dayOfWeek === 0 || dayOfWeek === 1 || dayOfWeek === 4;
}

/**
 * Check if today is the day after games (for score finalization)
 * 
 * Score updates typically finalize:
 * - Friday (after Thursday games)
 * - Monday (after Sunday games) - Note: Monday is also a game day
 * - Tuesday (after Monday games)
 * 
 * Only relevant during active tournaments (Weeks 1-17).
 */
export function isPostGameDay(): boolean {
  if (!isTournamentActive()) return false; // Tournaments end after Week 17
  
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  // Post-game days: Friday (5), Monday (1), Tuesday (2)
  // Monday counts as both game day and post-game day
  return dayOfWeek === 2 || dayOfWeek === 5 || dayOfWeek === 1;
}

/**
 * Check if today is a game day or post-game day
 * 
 * Combined check for when team data might be updating.
 */
export function isGameDayOrPostGame(): boolean {
  return isGameDay() || isPostGameDay();
}

/**
 * Check if real-time updates are needed
 * 
 * Real-time is ONLY needed when:
 * 1. Tournaments are active (Weeks 1-17, before Week 17 ends)
 * 2. It's a game day OR day after games (for score finalization)
 * 
 * Team data (roster, points, status, rankings) ONLY changes on game days.
 * Non-game days have static team data - player news doesn't change team data.
 * After Week 17, tournaments end and teams are final - no updates needed.
 */
export function shouldUseRealTime(): boolean {
  // Tournaments end after Week 17 - no updates needed after that
  if (!isTournamentActive()) {
    return false; // After Week 17 or off-season: no updates
  }
  
  // Only use real-time on game days + post-game days
  // Non-game days: Team data is static, use one-time fetch
  return isGameDay() || isPostGameDay();
}

