/**
 * NFL Constants - Centralized NFL Data
 * 
 * Single source of truth for:
 * - Team information (codes, cities, names)
 * - Bye weeks
 * - Team search mappings
 * 
 * Import from here instead of defining locally in components.
 */

// ============================================================================
// TYPES
// ============================================================================

export type NFLTeamCode = 
  | 'ARI' | 'ATL' | 'BAL' | 'BUF' | 'CAR' | 'CHI'
  | 'CIN' | 'CLE' | 'DAL' | 'DEN' | 'DET' | 'GB'
  | 'HOU' | 'IND' | 'JAX' | 'JAC' | 'KC' | 'LAC' | 'LAR'
  | 'LV' | 'MIA' | 'MIN' | 'NE' | 'NO' | 'NYG'
  | 'NYJ' | 'PHI' | 'PIT' | 'SEA' | 'SF' | 'TB'
  | 'TEN' | 'WAS';

export interface NFLTeam {
  code: NFLTeamCode;
  city: string;
  name: string;
  fullName: string;
}

export interface SearchSuggestion {
  term: string;
  code: NFLTeamCode;
  display: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// ============================================
// NFL TEAMS
// ============================================

export const NFL_TEAMS: Record<NFLTeamCode, NFLTeam> = {
  'ARI': { code: 'ARI', city: 'Arizona', name: 'Cardinals', fullName: 'Arizona Cardinals' },
  'ATL': { code: 'ATL', city: 'Atlanta', name: 'Falcons', fullName: 'Atlanta Falcons' },
  'BAL': { code: 'BAL', city: 'Baltimore', name: 'Ravens', fullName: 'Baltimore Ravens' },
  'BUF': { code: 'BUF', city: 'Buffalo', name: 'Bills', fullName: 'Buffalo Bills' },
  'CAR': { code: 'CAR', city: 'Carolina', name: 'Panthers', fullName: 'Carolina Panthers' },
  'CHI': { code: 'CHI', city: 'Chicago', name: 'Bears', fullName: 'Chicago Bears' },
  'CIN': { code: 'CIN', city: 'Cincinnati', name: 'Bengals', fullName: 'Cincinnati Bengals' },
  'CLE': { code: 'CLE', city: 'Cleveland', name: 'Browns', fullName: 'Cleveland Browns' },
  'DAL': { code: 'DAL', city: 'Dallas', name: 'Cowboys', fullName: 'Dallas Cowboys' },
  'DEN': { code: 'DEN', city: 'Denver', name: 'Broncos', fullName: 'Denver Broncos' },
  'DET': { code: 'DET', city: 'Detroit', name: 'Lions', fullName: 'Detroit Lions' },
  'GB': { code: 'GB', city: 'Green Bay', name: 'Packers', fullName: 'Green Bay Packers' },
  'HOU': { code: 'HOU', city: 'Houston', name: 'Texans', fullName: 'Houston Texans' },
  'IND': { code: 'IND', city: 'Indianapolis', name: 'Colts', fullName: 'Indianapolis Colts' },
  'JAX': { code: 'JAX', city: 'Jacksonville', name: 'Jaguars', fullName: 'Jacksonville Jaguars' },
  'JAC': { code: 'JAC', city: 'Jacksonville', name: 'Jaguars', fullName: 'Jacksonville Jaguars' },
  'KC': { code: 'KC', city: 'Kansas City', name: 'Chiefs', fullName: 'Kansas City Chiefs' },
  'LV': { code: 'LV', city: 'Las Vegas', name: 'Raiders', fullName: 'Las Vegas Raiders' },
  'LAC': { code: 'LAC', city: 'Los Angeles', name: 'Chargers', fullName: 'Los Angeles Chargers' },
  'LAR': { code: 'LAR', city: 'Los Angeles', name: 'Rams', fullName: 'Los Angeles Rams' },
  'MIA': { code: 'MIA', city: 'Miami', name: 'Dolphins', fullName: 'Miami Dolphins' },
  'MIN': { code: 'MIN', city: 'Minnesota', name: 'Vikings', fullName: 'Minnesota Vikings' },
  'NE': { code: 'NE', city: 'New England', name: 'Patriots', fullName: 'New England Patriots' },
  'NO': { code: 'NO', city: 'New Orleans', name: 'Saints', fullName: 'New Orleans Saints' },
  'NYG': { code: 'NYG', city: 'New York', name: 'Giants', fullName: 'New York Giants' },
  'NYJ': { code: 'NYJ', city: 'New York', name: 'Jets', fullName: 'New York Jets' },
  'PHI': { code: 'PHI', city: 'Philadelphia', name: 'Eagles', fullName: 'Philadelphia Eagles' },
  'PIT': { code: 'PIT', city: 'Pittsburgh', name: 'Steelers', fullName: 'Pittsburgh Steelers' },
  'SF': { code: 'SF', city: 'San Francisco', name: '49ers', fullName: 'San Francisco 49ers' },
  'SEA': { code: 'SEA', city: 'Seattle', name: 'Seahawks', fullName: 'Seattle Seahawks' },
  'TB': { code: 'TB', city: 'Tampa Bay', name: 'Buccaneers', fullName: 'Tampa Bay Buccaneers' },
  'TEN': { code: 'TEN', city: 'Tennessee', name: 'Titans', fullName: 'Tennessee Titans' },
  'WAS': { code: 'WAS', city: 'Washington', name: 'Commanders', fullName: 'Washington Commanders' }
};

// ============================================
// BYE WEEKS (2025 Season)
// ============================================

export const BYE_WEEKS: Record<NFLTeamCode | 'JAC', number> = {
  'ARI': 11, 'ATL': 12, 'BAL': 14, 'BUF': 12, 'CAR': 11, 'CHI': 7,
  'CIN': 12, 'CLE': 10, 'DAL': 7, 'DEN': 14, 'DET': 5, 'GB': 10,
  'HOU': 14, 'IND': 14, 'JAX': 12, 'JAC': 12, 'KC': 6, 'LV': 10, 'LAC': 5,
  'LAR': 6, 'MIA': 6, 'MIN': 6, 'NE': 14, 'NO': 12, 'NYG': 11,
  'NYJ': 12, 'PHI': 5, 'PIT': 9, 'SF': 9, 'SEA': 10, 'TB': 11,
  'TEN': 5, 'WAS': 14
};

// ============================================
// TEAM SEARCH MAPPING (for fuzzy search)
// ============================================

export const TEAM_SEARCH_MAPPING: Record<NFLTeamCode, string[]> = {
  'JAC': ['jacksonville', 'jaguars', 'jac', 'jax', 'jville'],
  'ARI': ['arizona', 'cardinals', 'ari', 'az'],
  'ATL': ['atlanta', 'falcons', 'atl'],
  'BAL': ['baltimore', 'ravens', 'bal'],
  'BUF': ['buffalo', 'bills', 'buf'],
  'CAR': ['carolina', 'panthers', 'car'],
  'CHI': ['chicago', 'bears', 'chi'],
  'CIN': ['cincinnati', 'bengals', 'cin'],
  'CLE': ['cleveland', 'browns', 'cle'],
  'DAL': ['dallas', 'cowboys', 'dal'],
  'DEN': ['denver', 'broncos', 'den'],
  'DET': ['detroit', 'lions', 'det'],
  'GB': ['green bay', 'packers', 'gb', 'greenbay'],
  'HOU': ['houston', 'texans', 'hou'],
  'IND': ['indianapolis', 'colts', 'ind'],
  'JAX': ['jacksonville', 'jaguars', 'jax', 'jags'],
  'KC': ['kansas city', 'chiefs', 'kc', 'kansascity'],
  'LAC': ['los angeles chargers', 'chargers', 'lac', 'la chargers', 'lachargers'],
  'LAR': ['los angeles rams', 'rams', 'lar', 'la rams', 'larams'],
  'LV': ['las vegas', 'raiders', 'lv', 'lasvegas', 'oakland'],
  'MIA': ['miami', 'dolphins', 'mia'],
  'MIN': ['minnesota', 'vikings', 'min'],
  'NE': ['new england', 'patriots', 'ne', 'newengland', 'pats'],
  'NO': ['new orleans', 'saints', 'no', 'neworleans'],
  'NYG': ['new york giants', 'giants', 'nyg', 'ny giants', 'nygiants'],
  'NYJ': ['new york jets', 'jets', 'nyj', 'ny jets', 'nyjets'],
  'PHI': ['philadelphia', 'eagles', 'phi', 'philly'],
  'PIT': ['pittsburgh', 'steelers', 'pit'],
  'SEA': ['seattle', 'seahawks', 'sea'],
  'SF': ['san francisco', 'forty niners', '49ers', 'niners', 'sf', 'sanfrancisco'],
  'TB': ['tampa bay', 'buccaneers', 'tb', 'tampa', 'tampabay', 'bucs'],
  'TEN': ['tennessee', 'titans', 'ten'],
  'WAS': ['washington', 'commanders', 'was', 'wsh', 'command']
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get bye week for a team
 * @param teamCode - Team abbreviation (e.g., 'KC')
 * @returns Bye week number or 'TBD'
 */
export const getByeWeek = (teamCode: NFLTeamCode | string): number | 'TBD' => {
  return BYE_WEEKS[teamCode as NFLTeamCode] || 'TBD';
};

/**
 * Get full team name
 * @param teamCode - Team abbreviation
 * @returns Full team name or the code if not found
 */
export const getTeamFullName = (teamCode: NFLTeamCode | string): string => {
  return NFL_TEAMS[teamCode as NFLTeamCode]?.fullName || teamCode;
};

/**
 * Get team city
 * @param teamCode - Team abbreviation
 * @returns City name or empty string
 */
export const getTeamCity = (teamCode: NFLTeamCode | string): string => {
  return NFL_TEAMS[teamCode as NFLTeamCode]?.city || '';
};

/**
 * Get team nickname (e.g., 'Chiefs', 'Eagles')
 * @param teamCode - Team abbreviation
 * @returns Team nickname or the code if not found
 */
export const getTeamName = (teamCode: NFLTeamCode | string): string => {
  return NFL_TEAMS[teamCode as NFLTeamCode]?.name || teamCode;
};

/**
 * Check if a team matches a search query
 * @param teamCode - Team abbreviation
 * @param searchQuery - User's search input
 * @returns True if team matches search
 */
export const teamMatchesSearch = (teamCode: NFLTeamCode | string, searchQuery: string): boolean => {
  const query = searchQuery.toLowerCase().trim();
  if (!query) return true;
  
  const searchTerms = TEAM_SEARCH_MAPPING[teamCode as NFLTeamCode] || [];
  return searchTerms.some(term => term.includes(query) || query.includes(term));
};

/**
 * Get all team codes as an array
 * @returns Array of team codes
 */
export const getAllTeamCodes = (): NFLTeamCode[] => {
  return Object.keys(NFL_TEAMS) as NFLTeamCode[];
};

/**
 * Find team code(s) from a search term (reverse lookup)
 * @param term - Search term (e.g., 'eagles', 'philadelphia', 'los angeles')
 * @returns Team code, array of codes (for ambiguous), or null
 */
export const findTeamByTerm = (term: string): NFLTeamCode | NFLTeamCode[] | null => {
  const lowerTerm = term.toLowerCase().trim();
  
  // Check each team's search terms
  for (const [code, terms] of Object.entries(TEAM_SEARCH_MAPPING)) {
    if (terms.includes(lowerTerm)) {
      return code as NFLTeamCode;
    }
  }
  
  // Handle special case: ambiguous city names
  if (lowerTerm === 'los angeles' || lowerTerm === 'la') {
    return ['LAC', 'LAR'];
  }
  if (lowerTerm === 'new york' || lowerTerm === 'ny') {
    return ['NYG', 'NYJ'];
  }
  
  return null;
};

/**
 * Get matching search suggestions for autocomplete
 * @param query - Partial search query
 * @param limit - Max suggestions to return
 * @returns Array of search suggestions
 */
export const getSearchSuggestions = (query: string, limit: number = 5): SearchSuggestion[] => {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return [];
  
  const suggestions: SearchSuggestion[] = [];
  
  for (const [code, terms] of Object.entries(TEAM_SEARCH_MAPPING)) {
    for (const term of terms) {
      if (term.includes(lowerQuery)) {
        suggestions.push({
          term,
          code: code as NFLTeamCode,
          display: `${term.charAt(0).toUpperCase() + term.slice(1)} (${NFL_TEAMS[code as NFLTeamCode]?.fullName})`
        });
      }
    }
  }
  
  return suggestions.slice(0, limit);
};

/**
 * Get teams sorted by city
 * @returns Array of team objects sorted by city
 */
export const getTeamsByCity = (): NFLTeam[] => {
  return Object.values(NFL_TEAMS).sort((a, b) => a.city.localeCompare(b.city));
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

const nflConstants = {
  NFL_TEAMS,
  BYE_WEEKS,
  TEAM_SEARCH_MAPPING,
  getByeWeek,
  getTeamFullName,
  getTeamCity,
  getTeamName,
  teamMatchesSearch,
  getAllTeamCodes,
  getTeamsByCity,
  findTeamByTerm,
  getSearchSuggestions
};

export default nflConstants;
