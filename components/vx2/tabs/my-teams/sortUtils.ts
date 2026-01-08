/**
 * Sort Utilities for Teams Tab
 * 
 * Provides sorting functions for team lists and player lists.
 * Philosophy: Data only, no analysis - just raw data sorting.
 */

import type { MyTeam, TeamPlayer, Position } from '../../hooks/data/useMyTeams';

// ============================================================================
// TYPES
// ============================================================================

export type TeamSortOption = 
  | 'draftedAt'      // Draft date
  | 'rank'           // Tournament rank
  | 'projectedPoints' // Total projected points
  | 'projectedPointsThisWeek' // Projected points this week
  | 'projectedPointsRestOfSeason' // Projected points rest of season
  | 'pointsScored'   // Actual points scored
  | 'lastWeekScore'  // Last week's score
  | 'last4WeeksScore' // Last 4 weeks average score
  | 'pointsBackOfFirst' // Points back of 1st place
  | 'pointsBackOfPlayoffs' // Points back of playoffs cutoff
  | 'name'           // Team name (A-Z / Z-A)
  | 'custom'         // Custom user-defined order
  | 'playoffOverlap'; // Playoff weeks only (15, 16, 17)

export type PlayerSortOption =
  | 'pick'           // Draft pick number
  | 'adp'            // Average draft position
  | 'projectedPoints' // Projected points
  | 'position'       // Position (QB, RB, WR, TE)
  | 'nflTeam'        // NFL team (A-Z / Z-A)
  | 'bye'            // Bye week
  | 'name';          // Player name (A-Z / Z-A)

export type SortDirection = 'asc' | 'desc';

export interface TeamSortState {
  primary: TeamSortOption;
  secondary?: TeamSortOption;
  direction: SortDirection;
}

export interface PlayerSortState {
  primary: PlayerSortOption;
  secondary?: PlayerSortOption;
  direction: SortDirection;
}

export interface SortState {
  teamList: TeamSortState;
  playerList: Record<string, PlayerSortState>; // keyed by teamId
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_TEAM_SORT: TeamSortState = {
  primary: 'draftedAt',
  direction: 'desc', // Most recent first
};

export const DEFAULT_PLAYER_SORT: PlayerSortState = {
  primary: 'pick',
  direction: 'asc', // First pick first
};

const POSITION_ORDER: Record<Position, number> = {
  QB: 0,
  RB: 1,
  WR: 2,
  TE: 3,
};

// ============================================================================
// TEAM SORTING
// ============================================================================

/**
 * Compare function for team sorting
 */
function compareTeams(
  a: MyTeam,
  b: MyTeam,
  sortOption: TeamSortOption,
  direction: SortDirection
): number {
  let comparison = 0;
  
  switch (sortOption) {
    case 'draftedAt':
      comparison = new Date(a.draftedAt).getTime() - new Date(b.draftedAt).getTime();
      break;
      
    case 'rank':
      // Handle undefined ranks (put them at the end)
      const rankA = a.rank ?? Number.MAX_SAFE_INTEGER;
      const rankB = b.rank ?? Number.MAX_SAFE_INTEGER;
      comparison = rankA - rankB;
      break;
      
    case 'projectedPoints':
      comparison = a.projectedPoints - b.projectedPoints;
      break;
      
    case 'pointsScored':
      // Use pointsScored if available, otherwise fall back to projectedPoints
      const pointsA = a.pointsScored ?? a.projectedPoints;
      const pointsB = b.pointsScored ?? b.projectedPoints;
      comparison = pointsA - pointsB;
      break;
      
    case 'projectedPointsThisWeek':
      const thisWeekA = a.projectedPointsThisWeek ?? 0;
      const thisWeekB = b.projectedPointsThisWeek ?? 0;
      comparison = thisWeekA - thisWeekB;
      break;
      
    case 'projectedPointsRestOfSeason':
      const restOfSeasonA = a.projectedPointsRestOfSeason ?? 0;
      const restOfSeasonB = b.projectedPointsRestOfSeason ?? 0;
      comparison = restOfSeasonA - restOfSeasonB;
      break;
      
    case 'lastWeekScore':
      const lastWeekA = a.lastWeekScore ?? 0;
      const lastWeekB = b.lastWeekScore ?? 0;
      comparison = lastWeekA - lastWeekB;
      break;
      
    case 'last4WeeksScore':
      const last4WeeksA = a.last4WeeksScore ?? 0;
      const last4WeeksB = b.last4WeeksScore ?? 0;
      comparison = last4WeeksA - last4WeeksB;
      break;
      
    case 'name':
      comparison = a.name.localeCompare(b.name);
      break;
      
    case 'custom':
      // Custom order - load from localStorage (requires userId, handled in sortTeams)
      // This case should not be reached directly, but fallback to 0
      comparison = 0;
      break;
      
    case 'playoffOverlap':
      // Placeholder - will be implemented with playoff data
      comparison = 0;
      break;
      
    default:
      comparison = 0;
  }
  
  return direction === 'desc' ? -comparison : comparison;
}

/**
 * Sort teams by the given sort state
 */
export function sortTeams(teams: MyTeam[], sortState: TeamSortState, userId: string | null = null): MyTeam[] {
  // Return empty array if no teams
  if (teams.length === 0) {
    return [];
  }
  
  // Handle custom order sorting
  if (sortState.primary === 'custom') {
    const customOrder = loadCustomOrder(userId);
    return [...teams].sort((a, b) => {
      const orderA = customOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const orderB = customOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      const comparison = orderA - orderB;
      
      // Secondary sort if equal
      if (comparison === 0 && sortState.secondary) {
        return compareTeams(a, b, sortState.secondary, sortState.direction);
      }
      
      return comparison;
    });
  }
  
  // Handle special cases that require all teams to calculate
  if (sortState.primary === 'pointsBackOfFirst' || sortState.primary === 'pointsBackOfPlayoffs') {
    // Calculate reference points
    let referencePoints: number;
    
    if (sortState.primary === 'pointsBackOfFirst') {
      // Find 1st place team (rank 1, or highest projected points)
      if (teams.length === 0) {
        return [];
      }
      const firstPlaceTeam = teams.find(t => t.rank === 1) || 
        teams.reduce((best, current) => 
          current.projectedPoints > best.projectedPoints ? current : best
        );
      referencePoints = firstPlaceTeam.projectedPoints;
    } else {
      // Find playoff cutoff team (rank 6, or closest)
      if (teams.length === 0) {
        return [];
      }
      const playoffCutoffRank = 6;
      const playoffCutoffTeam = teams.find(t => t.rank === playoffCutoffRank);
      const cutoffTeam = playoffCutoffTeam || 
        teams
          .filter(t => t.rank && t.rank >= playoffCutoffRank)
          .sort((a, b) => (a.rank || 999) - (b.rank || 999))[0] ||
        teams[0]; // Fallback to first team
      referencePoints = cutoffTeam.projectedPoints;
    }
    
    // Calculate points back for each team and sort
    return [...teams].sort((a, b) => {
      const pointsBackA = referencePoints - a.projectedPoints;
      const pointsBackB = referencePoints - b.projectedPoints;
      const comparison = pointsBackA - pointsBackB;
      
      // Apply direction
      const result = sortState.direction === 'desc' ? -comparison : comparison;
      
      // Secondary sort if equal
      if (result === 0 && sortState.secondary) {
        return compareTeams(a, b, sortState.secondary, sortState.direction);
      }
      
      return result;
    });
  }
  
  // Standard sorting for other options
  return [...teams].sort((a, b) => {
    // Primary sort
    const primaryComparison = compareTeams(a, b, sortState.primary, sortState.direction);
    
    // If primary comparison is equal and we have a secondary sort, use it
    if (primaryComparison === 0 && sortState.secondary) {
      return compareTeams(a, b, sortState.secondary, sortState.direction);
    }
    
    return primaryComparison;
  });
}

// ============================================================================
// PLAYER SORTING
// ============================================================================

/**
 * Compare function for player sorting
 */
function comparePlayers(
  a: TeamPlayer,
  b: TeamPlayer,
  sortOption: PlayerSortOption,
  direction: SortDirection
): number {
  let comparison = 0;
  
  switch (sortOption) {
    case 'pick':
      comparison = a.pick - b.pick;
      break;
      
    case 'adp':
      comparison = a.adp - b.adp;
      break;
      
    case 'projectedPoints':
      comparison = a.projectedPoints - b.projectedPoints;
      break;
      
    case 'position':
      comparison = POSITION_ORDER[a.position] - POSITION_ORDER[b.position];
      break;
      
    case 'nflTeam':
      comparison = a.team.localeCompare(b.team);
      break;
      
    case 'bye':
      comparison = a.bye - b.bye;
      break;
      
    case 'name':
      comparison = a.name.localeCompare(b.name);
      break;
      
    default:
      comparison = 0;
  }
  
  return direction === 'desc' ? -comparison : comparison;
}

/**
 * Sort players by the given sort state
 */
export function sortPlayers(players: TeamPlayer[], sortState: PlayerSortState): TeamPlayer[] {
  return [...players].sort((a, b) => {
    // Primary sort
    const primaryComparison = comparePlayers(a, b, sortState.primary, sortState.direction);
    
    // If primary comparison is equal and we have a secondary sort, use it
    if (primaryComparison === 0 && sortState.secondary) {
      return comparePlayers(a, b, sortState.secondary, sortState.direction);
    }
    
    return primaryComparison;
  });
}

// ============================================================================
// PERSISTENCE
// ============================================================================

const STORAGE_KEY = 'topdog_teams_sort_preferences';
const CUSTOM_ORDER_KEY = 'topdog_teams_custom_order';
const STORAGE_VERSION = 1;

interface StoredSortState {
  version: number;
  teamList: TeamSortState;
  playerList: Record<string, PlayerSortState>;
}

/**
 * Load sort preferences from localStorage
 */
export function loadSortPreferences(): SortState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const parsed: StoredSortState = JSON.parse(stored);
    
    // Version check for future migrations
    if (parsed.version !== STORAGE_VERSION) {
      // Handle migration if needed in the future
      return null;
    }
    
    return {
      teamList: parsed.teamList || DEFAULT_TEAM_SORT,
      playerList: parsed.playerList || {},
    };
  } catch (e) {
    console.error('Failed to load sort preferences:', e);
    return null;
  }
}

/**
 * Save sort preferences to localStorage
 */
export function saveSortPreferences(state: SortState): void {
  try {
    const toStore: StoredSortState = {
      version: STORAGE_VERSION,
      teamList: state.teamList,
      playerList: state.playerList,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (e) {
    console.error('Failed to save sort preferences:', e);
  }
}

/**
 * Get default sort state
 */
export function getDefaultSortState(): SortState {
  return {
    teamList: { ...DEFAULT_TEAM_SORT },
    playerList: {},
  };
}

// ============================================================================
// SORT OPTION LABELS
// ============================================================================

export const TEAM_SORT_LABELS: Record<TeamSortOption, string> = {
  draftedAt: 'Draft Date',
  rank: 'Standings',
  projectedPoints: 'Projected Points',
  projectedPointsThisWeek: 'Projected Points\n(This Week)',
  projectedPointsRestOfSeason: 'Projected Points\n(Rest of Season)',
  pointsScored: 'Points Scored',
  lastWeekScore: 'Points Scored\n(Last Week)',
  last4WeeksScore: 'Points Scored\n(Last 4 Weeks)',
  pointsBackOfFirst: 'Points Back\n(1st Place)',
  pointsBackOfPlayoffs: 'Points Back\n(Playoffs)',
  name: 'Team Name',
  custom: 'Custom Order',
  playoffOverlap: 'Playoff Overlap',
};

export const PLAYER_SORT_LABELS: Record<PlayerSortOption, string> = {
  pick: 'Pick #',
  adp: 'ADP',
  projectedPoints: 'Projected Pts',
  position: 'Position',
  nflTeam: 'NFL Team',
  bye: 'Bye Week',
  name: 'Player Name',
};

// ============================================================================
// CUSTOM ORDER MANAGEMENT
// ============================================================================

/**
 * Get custom order storage key for a user
 */
function getCustomOrderKey(userId: string | null): string {
  if (!userId) {
    // Fallback to anonymous key if no user ID
    return CUSTOM_ORDER_KEY;
  }
  return `${CUSTOM_ORDER_KEY}_${userId}`;
}

/**
 * Load custom team order from localStorage
 */
export function loadCustomOrder(userId: string | null = null): Map<string, number> {
  try {
    const key = getCustomOrderKey(userId);
    const stored = localStorage.getItem(key);
    if (!stored) return new Map();
    
    const parsed = JSON.parse(stored);
    return new Map(Object.entries(parsed).map(([id, order]) => [id, order as number]));
  } catch (e) {
    console.error('Failed to load custom order:', e);
    return new Map();
  }
}

/**
 * Save custom team order to localStorage
 */
export function saveCustomOrder(order: Map<string, number>, userId: string | null = null): void {
  try {
    const key = getCustomOrderKey(userId);
    const toStore = Object.fromEntries(order);
    localStorage.setItem(key, JSON.stringify(toStore));
  } catch (e) {
    console.error('Failed to save custom order:', e);
  }
}

/**
 * Update custom order when teams are reordered
 */
export function updateCustomOrder(teamIds: string[], userId: string | null = null): void {
  const order = new Map<string, number>();
  teamIds.forEach((id, index) => {
    order.set(id, index);
  });
  saveCustomOrder(order, userId);
}

/**
 * Clear custom order
 */
export function clearCustomOrder(userId: string | null = null): void {
  try {
    const key = getCustomOrderKey(userId);
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to clear custom order:', e);
  }
}

// ============================================================================
// SORT DIRECTION TOGGLE
// ============================================================================

/**
 * Toggle sort direction
 */
export function toggleDirection(direction: SortDirection): SortDirection {
  return direction === 'asc' ? 'desc' : 'asc';
}

/**
 * Get next sort state when clicking on a sort option
 * If same option: toggle direction
 * If different option: set as primary with default direction
 */
export function getNextTeamSortState(
  current: TeamSortState,
  clickedOption: TeamSortOption
): TeamSortState {
  if (current.primary === clickedOption) {
    return {
      ...current,
      direction: toggleDirection(current.direction),
    };
  }
  
  // Default directions for each sort type
  const defaultDirection: SortDirection = 
    clickedOption === 'name' ? 'asc' : 
    clickedOption === 'rank' ? 'asc' :
    clickedOption === 'custom' ? 'asc' : // Custom order doesn't use direction
    clickedOption === 'draftedAt' ? 'desc' : 
    clickedOption === 'projectedPoints' ? 'desc' :
    clickedOption === 'projectedPointsThisWeek' ? 'desc' :
    clickedOption === 'projectedPointsRestOfSeason' ? 'desc' :
    clickedOption === 'pointsScored' ? 'desc' :
    clickedOption === 'lastWeekScore' ? 'desc' :
    clickedOption === 'last4WeeksScore' ? 'desc' :
    clickedOption === 'pointsBackOfFirst' ? 'asc' : // Lower is better (closer to 1st)
    clickedOption === 'pointsBackOfPlayoffs' ? 'asc' : // Lower is better (closer to playoffs)
    'desc';
  
  return {
    primary: clickedOption,
    secondary: current.primary, // Previous primary becomes secondary
    direction: defaultDirection,
  };
}

export function getNextPlayerSortState(
  current: PlayerSortState,
  clickedOption: PlayerSortOption
): PlayerSortState {
  if (current.primary === clickedOption) {
    return {
      ...current,
      direction: toggleDirection(current.direction),
    };
  }
  
  // Default directions for each sort type
  const defaultDirection: SortDirection = 
    clickedOption === 'name' ? 'asc' : 
    clickedOption === 'nflTeam' ? 'asc' :
    clickedOption === 'pick' ? 'asc' :
    clickedOption === 'adp' ? 'asc' :
    clickedOption === 'bye' ? 'asc' :
    clickedOption === 'position' ? 'asc' : 'desc';
  
  return {
    primary: clickedOption,
    secondary: current.primary, // Previous primary becomes secondary
    direction: defaultDirection,
  };
}

