/**
 * VX Mock Data Generators
 * 
 * Utilities for generating realistic test data.
 * Use these for:
 * - Component development
 * - Storybook stories
 * - Unit tests
 * - Demo pages
 */

import type { Player, Participant, Pick } from '../shared/types';
import type { FantasyPosition } from '../constants/positions';

// ============================================================================
// PLAYER NAMES
// ============================================================================

const FIRST_NAMES = [
  'Patrick', 'Josh', 'Justin', 'Lamar', 'Joe', 'Jalen', 'Tua', 'Dak',
  'Derrick', 'Austin', 'Christian', 'Saquon', 'Travis', 'Tyreek', 'Ja\'Marr',
  'CeeDee', 'Amon-Ra', 'Garrett', 'Mark', 'Sam', 'George', 'David', 'Bijan',
  'Breece', 'Kenneth', 'De\'Von', 'James', 'Jahmyr', 'Isiah', 'Tank',
];

const LAST_NAMES = [
  'Mahomes', 'Allen', 'Herbert', 'Jackson', 'Burrow', 'Hurts', 'Tagovailoa',
  'Prescott', 'Henry', 'Ekeler', 'McCaffrey', 'Barkley', 'Kelce', 'Hill',
  'Chase', 'Lamb', 'St. Brown', 'Wilson', 'Andrews', 'LaPorta', 'Kittle',
  'Njoku', 'Robinson', 'Hall', 'Walker', 'Achane', 'Cook', 'Gibbs', 'Pacheco',
];

const NFL_TEAMS = [
  'KC', 'BUF', 'LAC', 'BAL', 'CIN', 'PHI', 'MIA', 'DAL', 'TEN', 'SF',
  'CAR', 'NYG', 'DET', 'HOU', 'ARI', 'NYJ', 'CLE', 'MIN', 'CHI', 'GB',
  'ATL', 'JAX', 'LAR', 'SEA', 'DEN', 'LV', 'NE', 'IND', 'TB', 'NO', 'PIT', 'WAS',
];

const PARTICIPANT_NAMES = [
  'NOTTODDMIDDL', 'DraftKing99', 'BestBaller', 'TopDogUser', 'FantasyPro',
  'ChampionMaker', 'DynastyLord', 'SleepPicks', 'ValueHunter', 'ADPMaster',
  'MockDrafter', 'LeagueWinner', 'BoomOrBust', 'SafeFloor', 'HighCeiling',
];

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generate a random player
 */
export function generatePlayer(overrides?: Partial<Player>): Player {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const positions: FantasyPosition[] = ['QB', 'RB', 'WR', 'TE'];
  const position = positions[Math.floor(Math.random() * positions.length)];
  const team = NFL_TEAMS[Math.floor(Math.random() * NFL_TEAMS.length)];
  
  return {
    name: `${firstName} ${lastName}`,
    position,
    team,
    adp: parseFloat((Math.random() * 200 + 1).toFixed(1)),
    bye: Math.floor(Math.random() * 9) + 5,
    projectedPoints: parseFloat((Math.random() * 200 + 100).toFixed(1)),
    ...overrides,
  };
}

/**
 * Generate an array of players
 */
export function generatePlayers(count: number, position?: FantasyPosition): Player[] {
  return Array.from({ length: count }, (_, i) => 
    generatePlayer({
      adp: i + 1 + Math.random() * 0.9,
      ...(position && { position }),
    })
  );
}

/**
 * Generate realistic player pool (sorted by ADP)
 */
export function generatePlayerPool(): Player[] {
  const players: Player[] = [];
  
  // Generate by position with realistic distributions
  const distributions = {
    QB: 30,
    RB: 60,
    WR: 70,
    TE: 24,
  };

  Object.entries(distributions).forEach(([pos, count]) => {
    for (let i = 0; i < count; i++) {
      players.push(generatePlayer({ position: pos as FantasyPosition }));
    }
  });

  // Sort by ADP and reassign sequential ADPs
  players.sort((a, b) => (a.adp || 999) - (b.adp || 999));
  players.forEach((p, i) => {
    p.adp = i + 1 + Math.random() * 0.5;
  });

  return players;
}

/**
 * Generate a participant
 */
export function generateParticipant(overrides?: Partial<Participant>): Participant {
  return {
    name: PARTICIPANT_NAMES[Math.floor(Math.random() * PARTICIPANT_NAMES.length)],
    ...overrides,
  };
}

/**
 * Generate an array of participants
 */
export function generateParticipants(count: number): Participant[] {
  const usedNames = new Set<string>();
  
  return Array.from({ length: count }, (_, i) => {
    let name = PARTICIPANT_NAMES[i % PARTICIPANT_NAMES.length];
    if (usedNames.has(name)) {
      name = `${name}${i}`;
    }
    usedNames.add(name);
    return { name, userId: `user-${i}` };
  });
}

/**
 * Generate a pick
 */
export function generatePick(
  pickNumber: number,
  player: Player,
  participantIndex: number
): Pick {
  return {
    pickNumber,
    player,
    participantIndex,
    timestamp: Date.now() - (1000 * 60 * pickNumber), // Older picks have earlier timestamps
  };
}

/**
 * Generate picks for a partial draft
 */
export function generateDraftPicks(
  pickCount: number,
  totalTeams: number,
  playerPool: Player[]
): Pick[] {
  const picks: Pick[] = [];
  const availablePlayers = [...playerPool];
  
  for (let i = 0; i < pickCount && availablePlayers.length > 0; i++) {
    const pickNumber = i + 1;
    const round = Math.ceil(pickNumber / totalTeams);
    const pickInRound = pickNumber - (round - 1) * totalTeams;
    
    // Snake draft: reverse order on even rounds
    const participantIndex = round % 2 === 0 
      ? totalTeams - pickInRound 
      : pickInRound - 1;
    
    // Pick best available (first player by ADP)
    const player = availablePlayers.shift()!;
    
    picks.push(generatePick(pickNumber, player, participantIndex));
  }
  
  return picks;
}

// ============================================================================
// PRE-BUILT SCENARIOS
// ============================================================================

/**
 * Mock data for a draft in progress
 */
export function createMockDraftInProgress() {
  const participants = generateParticipants(12);
  const playerPool = generatePlayerPool();
  const picks = generateDraftPicks(48, 12, playerPool); // 4 rounds complete
  const availablePlayers = playerPool.slice(48);
  
  return {
    participants,
    picks,
    availablePlayers,
    currentPickNumber: 49,
    userIndex: 0,
    timer: 30,
  };
}

/**
 * Mock data for pre-draft lobby
 */
export function createMockPreDraft() {
  const participants = generateParticipants(12);
  const playerPool = generatePlayerPool();
  
  return {
    participants,
    picks: [],
    availablePlayers: playerPool,
    currentPickNumber: 1,
    userIndex: 0,
    timer: 60,
  };
}

/**
 * Mock data for completed draft
 */
export function createMockCompletedDraft() {
  const participants = generateParticipants(12);
  const playerPool = generatePlayerPool();
  const picks = generateDraftPicks(216, 12, playerPool); // 18 rounds * 12 teams
  
  return {
    participants,
    picks,
    availablePlayers: [],
    currentPickNumber: 217,
    userIndex: 0,
    timer: 0,
  };
}

// ============================================================================
// SPECIFIC PLAYERS (for consistent testing)
// ============================================================================

export const MOCK_PLAYERS = {
  mahomes: {
    name: 'Patrick Mahomes',
    position: 'QB' as FantasyPosition,
    team: 'KC',
    adp: 24.5,
    bye: 6,
    projectedPoints: 380,
  },
  henry: {
    name: 'Derrick Henry',
    position: 'RB' as FantasyPosition,
    team: 'TEN',
    adp: 8.2,
    bye: 5,
    projectedPoints: 250,
  },
  chase: {
    name: "Ja'Marr Chase",
    position: 'WR' as FantasyPosition,
    team: 'CIN',
    adp: 5.1,
    bye: 12,
    projectedPoints: 290,
  },
  kelce: {
    name: 'Travis Kelce',
    position: 'TE' as FantasyPosition,
    team: 'KC',
    adp: 12.8,
    bye: 6,
    projectedPoints: 220,
  },
};

export const MOCK_PARTICIPANTS = generateParticipants(12);

