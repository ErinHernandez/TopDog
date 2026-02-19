/**
 * Mock Data Generator for Playoff Teams
 * 
 * Generates realistic playoff pod scenarios for development and testing.
 * Supports multiple scenarios: close races, locked-in positions, mixed states.
 */

import type { Position } from '../../components/vx2/hooks/data/useMyTeams';

// ============================================================================
// TYPES
// ============================================================================

export interface PlayoffPlayer {
  id: string;
  name: string;
  team: string;
  position: Position;
  bye: number;
  adp: number;
  pick: number;
  projectedPoints: number;
  weeklyProjections: {
    week15: number;
    week16: number;
    week17: number;
  };
  currentWeekPoints?: number;
  status?: 'active' | 'out' | 'doubtful' | 'questionable';
}

export interface PlayoffTeam {
  id: string;
  name: string;
  tournament: string;
  tournamentId: string;
  rank: number;
  totalTeams: number;
  projectedPoints: number;
  currentPoints: number;
  draftedAt: string;
  players: PlayoffPlayer[];
  playoffRoom: string;
  playoffPod: string;
  bestCaseTotal: number;
  bestCaseRank: number;
  isUserTeam: boolean;
}

export interface PlayoffPod {
  id: string;
  name: string;
  room: string;
  week: 15 | 16 | 17;
  advancementCriteria: 'top1' | 'top2' | 'top4';
  advancementThreshold?: number;
  teams: PlayoffTeam[];
  userTeam: PlayoffTeam;
  opponents: PlayoffTeam[];
}

export type ScenarioType = 
  | 'default'
  | 'close_race'
  | 'locked_in'
  | 'on_the_bubble'
  | 'drawing_dead'
  | 'mixed'
  | 'edge_cases';

// ============================================================================
// PLAYER POOL
// ============================================================================

const PLAYOFF_PLAYER_POOL: Omit<PlayoffPlayer, 'id' | 'pick'>[] = [
  // QBs
  { name: 'Josh Allen', team: 'BUF', position: 'QB', bye: 6, adp: 48.1, projectedPoints: 305, weeklyProjections: { week15: 24.5, week16: 26.2, week17: 23.8 } },
  { name: 'Patrick Mahomes', team: 'KC', position: 'QB', bye: 10, adp: 52.4, projectedPoints: 310, weeklyProjections: { week15: 25.1, week16: 24.8, week17: 25.5 } },
  { name: 'Jalen Hurts', team: 'PHI', position: 'QB', bye: 9, adp: 45.2, projectedPoints: 300, weeklyProjections: { week15: 23.2, week16: 25.1, week17: 24.0 } },
  { name: 'Lamar Jackson', team: 'BAL', position: 'QB', bye: 14, adp: 35.8, projectedPoints: 320, weeklyProjections: { week15: 26.8, week16: 27.2, week17: 25.9 } },
  { name: 'Joe Burrow', team: 'CIN', position: 'QB', bye: 10, adp: 53.9, projectedPoints: 295, weeklyProjections: { week15: 24.0, week16: 23.5, week17: 24.2 } },
  { name: 'Jayden Daniels', team: 'WAS', position: 'QB', bye: 12, adp: 42.8, projectedPoints: 320, weeklyProjections: { week15: 25.5, week16: 26.0, week17: 24.8 } },
  
  // RBs
  { name: 'Bijan Robinson', team: 'ATL', position: 'RB', bye: 12, adp: 2.1, projectedPoints: 260, weeklyProjections: { week15: 18.5, week16: 19.2, week17: 17.8 } },
  { name: 'Saquon Barkley', team: 'PHI', position: 'RB', bye: 9, adp: 7.5, projectedPoints: 260, weeklyProjections: { week15: 19.0, week16: 18.5, week17: 19.5 } },
  { name: 'Breece Hall', team: 'NYJ', position: 'RB', bye: 5, adp: 6.2, projectedPoints: 250, weeklyProjections: { week15: 17.5, week16: 18.0, week17: 16.8 } },
  { name: 'De\'Von Achane', team: 'MIA', position: 'RB', bye: 5, adp: 19.3, projectedPoints: 225, weeklyProjections: { week15: 16.2, week16: 17.0, week17: 15.5 } },
  { name: 'Jahmyr Gibbs', team: 'DET', position: 'RB', bye: 8, adp: 8.5, projectedPoints: 245, weeklyProjections: { week15: 17.0, week16: 17.8, week17: 16.5 } },
  { name: 'Jonathan Taylor', team: 'IND', position: 'RB', bye: 11, adp: 12.3, projectedPoints: 235, weeklyProjections: { week15: 16.5, week16: 17.2, week17: 16.0 } },
  { name: 'Derrick Henry', team: 'BAL', position: 'RB', bye: 14, adp: 10.8, projectedPoints: 240, weeklyProjections: { week15: 17.2, week16: 16.8, week17: 17.5 } },
  { name: 'Travis Etienne', team: 'JAX', position: 'RB', bye: 12, adp: 15.2, projectedPoints: 220, weeklyProjections: { week15: 15.5, week16: 16.0, week17: 15.2 } },
  
  // WRs
  { name: 'Ja\'Marr Chase', team: 'CIN', position: 'WR', bye: 10, adp: 1.1, projectedPoints: 285, weeklyProjections: { week15: 20.5, week16: 21.2, week17: 19.8 } },
  { name: 'CeeDee Lamb', team: 'DAL', position: 'WR', bye: 7, adp: 3.4, projectedPoints: 280, weeklyProjections: { week15: 19.8, week16: 20.5, week17: 19.2 } },
  { name: 'Justin Jefferson', team: 'MIN', position: 'WR', bye: 6, adp: 3.1, projectedPoints: 295, weeklyProjections: { week15: 21.0, week16: 21.5, week17: 20.5 } },
  { name: 'Tyreek Hill', team: 'MIA', position: 'WR', bye: 5, adp: 8.3, projectedPoints: 270, weeklyProjections: { week15: 19.0, week16: 19.5, week17: 18.5 } },
  { name: 'Amon-Ra St. Brown', team: 'DET', position: 'WR', bye: 8, adp: 4.8, projectedPoints: 265, weeklyProjections: { week15: 18.5, week16: 19.2, week17: 18.0 } },
  { name: 'Garrett Wilson', team: 'NYJ', position: 'WR', bye: 5, adp: 15.2, projectedPoints: 240, weeklyProjections: { week15: 17.0, week16: 17.5, week17: 16.5 } },
  { name: 'Puka Nacua', team: 'LAR', position: 'WR', bye: 6, adp: 12.1, projectedPoints: 250, weeklyProjections: { week15: 17.5, week16: 18.0, week17: 17.0 } },
  { name: 'Malik Nabers', team: 'NYG', position: 'WR', bye: 14, adp: 21.8, projectedPoints: 235, weeklyProjections: { week15: 16.5, week16: 17.0, week17: 16.0 } },
  { name: 'Nico Collins', team: 'HOU', position: 'WR', bye: 6, adp: 25.9, projectedPoints: 220, weeklyProjections: { week15: 15.5, week16: 16.0, week17: 15.0 } },
  { name: 'Chris Olave', team: 'NO', position: 'WR', bye: 12, adp: 28.5, projectedPoints: 210, weeklyProjections: { week15: 14.8, week16: 15.2, week17: 14.5 } },
  
  // TEs
  { name: 'Travis Kelce', team: 'KC', position: 'TE', bye: 10, adp: 18.5, projectedPoints: 190, weeklyProjections: { week15: 13.5, week16: 14.0, week17: 13.0 } },
  { name: 'Sam LaPorta', team: 'DET', position: 'TE', bye: 8, adp: 45.2, projectedPoints: 175, weeklyProjections: { week15: 12.5, week16: 13.0, week17: 12.0 } },
  { name: 'George Kittle', team: 'SF', position: 'TE', bye: 14, adp: 51.6, projectedPoints: 175, weeklyProjections: { week15: 12.2, week16: 12.8, week17: 12.0 } },
  { name: 'Trey McBride', team: 'ARI', position: 'TE', bye: 14, adp: 70.8, projectedPoints: 165, weeklyProjections: { week15: 11.5, week16: 12.0, week17: 11.2 } },
  { name: 'Mark Andrews', team: 'BAL', position: 'TE', bye: 14, adp: 55.3, projectedPoints: 170, weeklyProjections: { week15: 12.0, week16: 12.5, week17: 11.8 } },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

let playerIdCounter = 0;

function generatePlayerId(): string {
  return `player-${++playerIdCounter}`;
}

function getRandomPlayer(pool: typeof PLAYOFF_PLAYER_POOL, usedNames: Set<string>): PlayoffPlayer | null {
  const available = pool.filter(p => !usedNames.has(p.name));
  if (available.length === 0) return null;

  const player = available[Math.floor(Math.random() * available.length)]!;
  return {
    ...player,
    id: generatePlayerId(),
    pick: 0, // Will be set later
    name: player.name,
    team: player.team,
    position: player.position,
    bye: player.bye,
    adp: player.adp,
    projectedPoints: player.projectedPoints,
    weeklyProjections: player.weeklyProjections,
  };
}

function generateRoster(pickOffset: number = 0): PlayoffPlayer[] {
  const roster: PlayoffPlayer[] = [];
  const usedNames = new Set<string>();
  
  // Position requirements: 2 QB, 4 RB, 6 WR, 2 TE = 14 players (simplified for testing)
  const requirements = [
    { position: 'QB' as Position, count: 2 },
    { position: 'RB' as Position, count: 4 },
    { position: 'WR' as Position, count: 6 },
    { position: 'TE' as Position, count: 2 },
  ];
  
  let pickNum = 1 + pickOffset;

  requirements.forEach(req => {
    const positionPool = PLAYOFF_PLAYER_POOL.filter(p => p.position === req.position);
    for (let i = 0; i < req.count; i++) {
      const player = getRandomPlayer(positionPool, usedNames);
      if (player) {
        player.pick = pickNum++;
        roster.push(player);
        usedNames.add(player.name);
      }
    }
  });

  return roster;
}

function calculateBestCaseTotal(team: PlayoffTeam, currentWeek: 15 | 16 | 17): number {
  let total = team.currentPoints;
  
  team.players.forEach(player => {
    if (currentWeek <= 15) total += player.weeklyProjections.week15;
    if (currentWeek <= 16) total += player.weeklyProjections.week16;
    if (currentWeek <= 17) total += player.weeklyProjections.week17;
  });
  
  return Math.round(total * 10) / 10;
}

function generateTeamName(index: number, isUserTeam: boolean): string {
  if (isUserTeam) {
    const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return `The TopDog International ${numerals[index % numerals.length]}`;
  }
  
  const adjectives = ['Swift', 'Mighty', 'Golden', 'Thunder', 'Iron', 'Silver', 'Royal', 'Blazing', 'Shadow', 'Storm', 'Crimson'];
  const nouns = ['Eagles', 'Warriors', 'Knights', 'Lions', 'Titans', 'Wolves', 'Dragons', 'Hawks', 'Bears', 'Panthers', 'Falcons'];
  
  return `${adjectives[index % adjectives.length]} ${nouns[index % nouns.length]}`;
}

// ============================================================================
// SCENARIO GENERATORS
// ============================================================================

function generateDefaultScenario(week: 15 | 16 | 17 = 15): PlayoffPod {
  const teams: PlayoffTeam[] = [];
  const baseDate = Date.now();
  
  // Generate 12 teams (1 user + 11 opponents)
  for (let i = 0; i < 12; i++) {
    const isUserTeam = i === 0;
    const roster = generateRoster(i * 14);
    const currentPoints = 1200 + Math.random() * 400; // 1200-1600 points
    
    const team: PlayoffTeam = {
      id: `playoff-team-${i + 1}`,
      name: generateTeamName(i, isUserTeam),
      tournament: 'The TopDog International',
      tournamentId: 'topdog-international',
      rank: i + 1,
      totalTeams: 12,
      projectedPoints: roster.reduce((sum, p) => sum + p.projectedPoints, 0),
      currentPoints: Math.round(currentPoints * 10) / 10,
      draftedAt: new Date(baseDate - (30 - i) * 86400000).toISOString(),
      players: roster,
      playoffRoom: 'Room A',
      playoffPod: 'Pod 1',
      bestCaseTotal: 0, // Will be calculated
      bestCaseRank: 0, // Will be calculated
      isUserTeam,
    };
    
    team.bestCaseTotal = calculateBestCaseTotal(team, week);
    teams.push(team);
  }
  
  // Sort by current points and assign ranks
  teams.sort((a, b) => b.currentPoints - a.currentPoints);
  teams.forEach((team, index) => {
    team.rank = index + 1;
  });
  
  // Calculate best case ranks
  const bestCaseSorted = [...teams].sort((a, b) => b.bestCaseTotal - a.bestCaseTotal);
  bestCaseSorted.forEach((team, index) => {
    team.bestCaseRank = index + 1;
  });
  
  const userTeam = teams.find(t => t.isUserTeam)!;
  const opponents = teams.filter(t => !t.isUserTeam);
  
  return {
    id: 'pod-default-1',
    name: 'Pod 1',
    room: 'Room A',
    week,
    advancementCriteria: 'top2',
    teams,
    userTeam,
    opponents,
  };
}

function generateCloseRaceScenario(week: 15 | 16 | 17 = 15): PlayoffPod {
  const pod = generateDefaultScenario(week);
  
  // Make all teams within 50 points of each other
  const basePoints = 1400;
  pod.teams.forEach((team, index) => {
    team.currentPoints = basePoints + (Math.random() * 50 - 25);
    team.bestCaseTotal = calculateBestCaseTotal(team, week);
  });
  
  // Re-sort and re-rank
  pod.teams.sort((a, b) => b.currentPoints - a.currentPoints);
  pod.teams.forEach((team, index) => {
    team.rank = index + 1;
  });
  
  const bestCaseSorted = [...pod.teams].sort((a, b) => b.bestCaseTotal - a.bestCaseTotal);
  bestCaseSorted.forEach((team, index) => {
    team.bestCaseRank = index + 1;
  });
  
  return pod;
}

function generateLockedInScenario(week: 15 | 16 | 17 = 15): PlayoffPod {
  const pod = generateDefaultScenario(week);
  
  // User team is #1 by a large margin
  const userTeam = pod.teams.find(t => t.isUserTeam)!;
  userTeam.currentPoints = 1800;
  userTeam.bestCaseTotal = calculateBestCaseTotal(userTeam, week);
  
  // Other teams are much lower
  pod.teams.filter(t => !t.isUserTeam).forEach((team, index) => {
    team.currentPoints = 1200 + index * 20;
    team.bestCaseTotal = calculateBestCaseTotal(team, week);
  });
  
  // Re-sort and re-rank
  pod.teams.sort((a, b) => b.currentPoints - a.currentPoints);
  pod.teams.forEach((team, index) => {
    team.rank = index + 1;
  });
  
  const bestCaseSorted = [...pod.teams].sort((a, b) => b.bestCaseTotal - a.bestCaseTotal);
  bestCaseSorted.forEach((team, index) => {
    team.bestCaseRank = index + 1;
  });
  
  return pod;
}

function generateOnTheBubbleScenario(week: 15 | 16 | 17 = 15): PlayoffPod {
  const pod = generateDefaultScenario(week);
  
  // User team is right at the advancement cutoff (rank 2-3)
  const userTeam = pod.teams.find(t => t.isUserTeam)!;
  
  // Set up a tight race for 2nd place
  pod.teams[0]!.currentPoints = 1600; // Clear leader
  userTeam.currentPoints = 1450; // User team
  pod.teams.filter(t => !t.isUserTeam)[1]!.currentPoints = 1448; // Close competitor
  pod.teams.filter(t => !t.isUserTeam)[2]!.currentPoints = 1445; // Another close one
  
  // Recalculate
  pod.teams.forEach(team => {
    team.bestCaseTotal = calculateBestCaseTotal(team, week);
  });
  
  pod.teams.sort((a, b) => b.currentPoints - a.currentPoints);
  pod.teams.forEach((team, index) => {
    team.rank = index + 1;
  });
  
  const bestCaseSorted = [...pod.teams].sort((a, b) => b.bestCaseTotal - a.bestCaseTotal);
  bestCaseSorted.forEach((team, index) => {
    team.bestCaseRank = index + 1;
  });
  
  return pod;
}

function generateDrawingDeadScenario(week: 15 | 16 | 17 = 15): PlayoffPod {
  const pod = generateDefaultScenario(week);
  
  // User team is far behind with no realistic chance
  const userTeam = pod.teams.find(t => t.isUserTeam)!;
  userTeam.currentPoints = 1000;
  userTeam.bestCaseTotal = calculateBestCaseTotal(userTeam, week);
  
  // Top teams are way ahead
  pod.teams.filter(t => !t.isUserTeam).forEach((team, index) => {
    if (index < 4) {
      team.currentPoints = 1700 + index * 10;
    } else {
      team.currentPoints = 1500 + index * 10;
    }
    team.bestCaseTotal = calculateBestCaseTotal(team, week);
  });
  
  // Re-sort and re-rank
  pod.teams.sort((a, b) => b.currentPoints - a.currentPoints);
  pod.teams.forEach((team, index) => {
    team.rank = index + 1;
  });
  
  const bestCaseSorted = [...pod.teams].sort((a, b) => b.bestCaseTotal - a.bestCaseTotal);
  bestCaseSorted.forEach((team, index) => {
    team.bestCaseRank = index + 1;
  });
  
  return pod;
}

function generateMixedScenario(week: 15 | 16 | 17 = 15): PlayoffPod {
  const pod = generateDefaultScenario(week);
  
  // Create a realistic mixed scenario with varied standings
  const pointDistribution = [1650, 1580, 1520, 1480, 1450, 1420, 1380, 1350, 1300, 1250, 1200, 1150];
  
  pod.teams.forEach((team, index) => {
    const dist = pointDistribution[index];
    if (dist !== undefined) {
      team.currentPoints = dist + (Math.random() * 20 - 10);
      team.bestCaseTotal = calculateBestCaseTotal(team, week);
    }
  });
  
  // Re-sort and re-rank
  pod.teams.sort((a, b) => b.currentPoints - a.currentPoints);
  pod.teams.forEach((team, index) => {
    team.rank = index + 1;
  });
  
  const bestCaseSorted = [...pod.teams].sort((a, b) => b.bestCaseTotal - a.bestCaseTotal);
  bestCaseSorted.forEach((team, index) => {
    team.bestCaseRank = index + 1;
  });
  
  return pod;
}

function generateEdgeCasesScenario(week: 15 | 16 | 17 = 15): PlayoffPod {
  const pod = generateDefaultScenario(week);
  
  // Add some edge cases: ties, injured players, etc.
  // Tie at #2
  pod.teams[1]!.currentPoints = 1500;
  pod.teams[2]!.currentPoints = 1500;

  // Some players with injury status
  pod.teams[0]!.players[0]!.status = 'out';
  pod.teams[0]!.players[1]!.status = 'doubtful';
  pod.teams[3]!.players[2]!.status = 'questionable';
  
  // Recalculate
  pod.teams.forEach(team => {
    team.bestCaseTotal = calculateBestCaseTotal(team, week);
  });
  
  pod.teams.sort((a, b) => b.currentPoints - a.currentPoints);
  pod.teams.forEach((team, index) => {
    team.rank = index + 1;
  });
  
  const bestCaseSorted = [...pod.teams].sort((a, b) => b.bestCaseTotal - a.bestCaseTotal);
  bestCaseSorted.forEach((team, index) => {
    team.bestCaseRank = index + 1;
  });
  
  return pod;
}

// ============================================================================
// MAIN EXPORTS
// ============================================================================

export function generatePlayoffPod(scenario: ScenarioType = 'default', week: 15 | 16 | 17 = 15): PlayoffPod {
  // Reset player ID counter for consistent IDs
  playerIdCounter = 0;
  
  switch (scenario) {
    case 'close_race':
      return generateCloseRaceScenario(week);
    case 'locked_in':
      return generateLockedInScenario(week);
    case 'on_the_bubble':
      return generateOnTheBubbleScenario(week);
    case 'drawing_dead':
      return generateDrawingDeadScenario(week);
    case 'mixed':
      return generateMixedScenario(week);
    case 'edge_cases':
      return generateEdgeCasesScenario(week);
    default:
      return generateDefaultScenario(week);
  }
}

export function generateMultiplePods(count: number, scenario: ScenarioType = 'default', week: 15 | 16 | 17 = 15): PlayoffPod[] {
  const pods: PlayoffPod[] = [];
  
  for (let i = 0; i < count; i++) {
    const pod = generatePlayoffPod(scenario, week);
    pod.id = `pod-${scenario}-${i + 1}`;
    pod.name = `Pod ${i + 1}`;
    pods.push(pod);
  }
  
  return pods;
}

export const SCENARIO_DESCRIPTIONS: Record<ScenarioType, string> = {
  default: 'Standard playoff pod with realistic distribution',
  close_race: 'All teams within 50 points - very competitive',
  locked_in: 'User team has commanding lead, locked for advancement',
  on_the_bubble: 'User team right at advancement cutoff',
  drawing_dead: 'User team mathematically eliminated or nearly so',
  mixed: 'Realistic mixed scenario with varied standings',
  edge_cases: 'Includes ties, injuries, and other edge cases',
};

export const ALL_SCENARIOS: ScenarioType[] = [
  'default',
  'close_race',
  'locked_in',
  'on_the_bubble',
  'drawing_dead',
  'mixed',
  'edge_cases',
];

