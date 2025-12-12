/**
 * VX Shared Utilities
 * 
 * Common utility functions and data used across VX components.
 * Consolidates duplicated code from multiple components.
 */

// ============================================================================
// NFL TEAM DATA
// ============================================================================

/** Bye weeks for 2025 season */
export const BYE_WEEKS: Record<string, number> = {
  'ARI': 11, 'ATL': 12, 'BAL': 14, 'BUF': 12, 'CAR': 11, 'CHI': 7,
  'CIN': 12, 'CLE': 10, 'DAL': 7, 'DEN': 14, 'DET': 5, 'GB': 10,
  'HOU': 14, 'IND': 14, 'JAX': 12, 'KC': 6, 'LV': 10, 'LAC': 5,
  'LAR': 6, 'MIA': 6, 'MIN': 6, 'NE': 14, 'NO': 12, 'NYG': 11,
  'NYJ': 12, 'PHI': 5, 'PIT': 9, 'SF': 9, 'SEA': 10, 'TB': 11,
  'TEN': 5, 'WAS': 14,
};

/** Full team names for display/search */
export const TEAM_NAMES: Record<string, string> = {
  'ARI': 'Arizona Cardinals', 'ATL': 'Atlanta Falcons', 'BAL': 'Baltimore Ravens',
  'BUF': 'Buffalo Bills', 'CAR': 'Carolina Panthers', 'CHI': 'Chicago Bears',
  'CIN': 'Cincinnati Bengals', 'CLE': 'Cleveland Browns', 'DAL': 'Dallas Cowboys',
  'DEN': 'Denver Broncos', 'DET': 'Detroit Lions', 'GB': 'Green Bay Packers',
  'HOU': 'Houston Texans', 'IND': 'Indianapolis Colts', 'JAX': 'Jacksonville Jaguars',
  'KC': 'Kansas City Chiefs', 'LV': 'Las Vegas Raiders', 'LAC': 'Los Angeles Chargers',
  'LAR': 'Los Angeles Rams', 'MIA': 'Miami Dolphins', 'MIN': 'Minnesota Vikings',
  'NE': 'New England Patriots', 'NO': 'New Orleans Saints', 'NYG': 'New York Giants',
  'NYJ': 'New York Jets', 'PHI': 'Philadelphia Eagles', 'PIT': 'Pittsburgh Steelers',
  'SF': 'San Francisco 49ers', 'SEA': 'Seattle Seahawks', 'TB': 'Tampa Bay Buccaneers',
  'TEN': 'Tennessee Titans', 'WAS': 'Washington Commanders',
};

// ============================================================================
// TEAM UTILITIES
// ============================================================================

/**
 * Get bye week for a team
 * @param team - Team abbreviation (e.g., 'KC', 'BUF')
 * @returns Bye week number or null if not found
 */
export function getByeWeek(team: string): number | null {
  return BYE_WEEKS[team?.toUpperCase()] ?? null;
}

/**
 * Get full team name from abbreviation
 * @param team - Team abbreviation (e.g., 'KC')
 * @returns Full team name or the abbreviation if not found
 */
export function getTeamName(team: string): string {
  return TEAM_NAMES[team?.toUpperCase()] ?? team;
}

// ============================================================================
// PLAYER NAME FORMATTING
// ============================================================================

/**
 * Format player names with abbreviations for long names
 * Handles special cases to keep names readable in compact spaces
 * @param name - Full player name
 * @returns Formatted name with abbreviations if needed
 */
export function formatPlayerName(name: string): string {
  if (!name) return name;
  const lowerName = name.toLowerCase();
  
  // Special case abbreviations
  if (lowerName.includes('clyde') && lowerName.includes('edwards')) {
    return name.replace(/clyde/i, 'C.');
  }
  if (lowerName.includes('rahmondre')) {
    return name.replace(/rahmondre/i, 'R.');
  }
  if (lowerName.includes('anthony') && lowerName.includes('richardson')) {
    return name.replace(/richardson/i, 'Rich.');
  }
  if (lowerName.includes('christopher') || lowerName.includes('christian')) {
    return name.replace(/christopher/i, 'Chris').replace(/christian/i, 'Chris');
  }
  if (lowerName.includes('demarcus')) {
    return name.replace(/demarcus/i, 'D.');
  }
  if (lowerName.includes('deandre')) {
    return name.replace(/deandre/i, "De'Andre");
  }
  if (lowerName.includes('davante')) {
    return name.replace(/davante/i, 'D.');
  }
  if (lowerName.includes('jonathan') && lowerName.includes('taylor')) {
    return name.replace(/jonathan/i, 'J.');
  }
  if (lowerName.includes('marvin') && lowerName.includes('harrison')) {
    return name.replace(/marvin/i, 'M.');
  }
  
  return name;
}

/**
 * Format player name with first initial (for compact displays)
 * Example: "Patrick Mahomes" → "P. Mahomes"
 * @param name - Full player name
 * @returns Name with first name as initial
 */
export function formatPlayerNameShort(name: string): string {
  if (!name) return name;
  const parts = name.split(' ');
  if (parts.length < 2) return name;
  return `${parts[0].charAt(0)}. ${parts.slice(1).join(' ')}`;
}

// ============================================================================
// PICK NUMBER FORMATTING
// ============================================================================

/**
 * Format pick number as round.pick (e.g., "1.01", "2.05")
 * @param pickNumber - Overall pick number (1-indexed)
 * @param totalTeams - Number of teams in draft (default: 12)
 * @returns Formatted pick string
 */
export function formatPickNumber(pickNumber: number, totalTeams: number = 12): string {
  const round = Math.ceil(pickNumber / totalTeams);
  const pick = pickNumber - (round - 1) * totalTeams;
  return `${round}.${pick.toString().padStart(2, '0')}`;
}

/**
 * Get participant index for a pick (handles snake draft)
 * @param pickNumber - Overall pick number (1-indexed)
 * @param totalTeams - Number of teams in draft
 * @returns Participant index (0-indexed)
 */
export function getParticipantForPick(pickNumber: number, totalTeams: number): number {
  const round = Math.ceil(pickNumber / totalTeams);
  const pickInRound = pickNumber - (round - 1) * totalTeams;
  // Snake draft: even rounds go in reverse order
  return round % 2 === 0 ? totalTeams - pickInRound : pickInRound - 1;
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Truncate string to max length without ellipsis
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength);
}

/**
 * Truncate string with ellipsis
 * @param str - String to truncate
 * @param maxLength - Maximum length (including ellipsis)
 * @returns Truncated string with ellipsis if needed
 */
export function truncateWithEllipsis(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

// ============================================================================
// NUMBER UTILITIES
// ============================================================================

/**
 * Format ADP value with one decimal place
 * @param adp - ADP value
 * @returns Formatted ADP string
 */
export function formatADP(adp: number | null | undefined): string {
  if (adp == null) return '-';
  return parseFloat(String(adp)).toFixed(1);
}

/**
 * Format projection value as integer
 * @param projection - Projection value
 * @returns Formatted projection string
 */
export function formatProjection(projection: number | null | undefined): string {
  if (projection == null) return '-';
  return Math.round(parseFloat(String(projection))).toString();
}

