/**
 * TopDog Tournament Database Structure
 * Comprehensive historical tournament data storage
 * Designed to match/exceed Underdog's data granularity
 */

import { serverLogger } from './logger/serverLogger';

// ============================================================================
// TYPES
// ============================================================================

export type DraftType = 'snake' | 'linear' | 'auction';
export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'FLEX' | 'DST' | 'K';

export interface PayoutStructure {
  place: number;
  payout: number;
}

export interface PositionCounts {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
  FLEX: number;
  DST: number;
  K: number;
}

export interface ScoringSystem {
  passing: {
    yards: number;
    touchdowns: number;
    interceptions: number;
    twoPointConversions: number;
  };
  rushing: {
    yards: number;
    touchdowns: number;
    twoPointConversions: number;
  };
  receiving: {
    receptions: number;
    yards: number;
    touchdowns: number;
    twoPointConversions: number;
  };
}

export interface TournamentStructure {
  entryFee: number | null;
  maxEntries: number | null;
  totalEntrants: number | null;
  prizePool: number | null;
  payoutStructure: PayoutStructure[];
  draftType: DraftType;
  rounds: number;
  draftTime: number;
  positions: PositionCounts;
}

export interface TournamentDates {
  opened: string | null;
  draftStart: string | null;
  draftEnd: string | null;
  seasonStart: string | null;
  seasonEnd: string | null;
  payoutsProcessed: string | null;
}

export interface TopScore {
  userId: string;
  teamName: string;
  totalPoints: number;
  payout: number;
}

export interface TournamentResults {
  winner: string | null;
  topScores: TopScore[];
  averageScore: number | null;
  medianScore: number | null;
  highScore: number | null;
  lowScore: number | null;
}

export interface PopularPick {
  playerId: string;
  pickRate: number;
  averageRound: number;
}

export interface DraftTrends {
  averageDraftTime: number | null;
  timeouts: number;
  autodrafts: number;
}

export interface TournamentAnalytics {
  popularPicks: PopularPick[];
  contrarian: unknown[];
  busts: unknown[];
  positionalTrends: Record<string, unknown>;
  draftTrends: DraftTrends;
}

export interface Tournament {
  id: string;
  name: string;
  season: number;
  week: number | null;
  format: string;
  structure: TournamentStructure;
  scoring: ScoringSystem;
  dates: TournamentDates;
  results: TournamentResults;
  analytics: TournamentAnalytics;
}

export interface Participant {
  userId: string;
  draftPosition: number;
  teamName: string;
}

export interface DraftSettings {
  type: DraftType;
  rounds: number;
  timePerPick: number;
  startTime: string | null;
  endTime: string | null;
}

export interface PickAnalytics {
  adp: number | null;
  adpDiff: number | null;
  ownership: number | null;
  projectedPoints: number | null;
  actualPoints: number | null;
  expectedValue: number | null;
  leverage: number | null;
  positionRank: number | null;
  positionsRemaining: Record<string, number>;
}

export interface Pick {
  id: string;
  tournamentId: string;
  draftId: string;
  userId: string;
  round: number | null;
  pick: number | null;
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  timestamp: string | null;
  timeUsed: number | null;
  wasTimeout: boolean;
  wasAutodraft: boolean;
  analytics: PickAnalytics;
}

export interface DraftAnalytics {
  totalTime: number | null;
  averagePickTime: number | null;
  timeouts: number;
  autodrafts: number;
  positionByRound: Record<string, Record<string, number>>;
  draftGrades: Array<{
    userId: string;
    grade: string;
    reasoning: string;
  }>;
}

export interface Draft {
  id: string;
  tournamentId: string;
  roomNumber: number | null;
  participants: Participant[];
  settings: DraftSettings;
  picks: Pick[];
  analytics: DraftAnalytics;
}

export interface OverallStats {
  totalTournaments: number;
  totalWinnings: number;
  totalSpent: number;
  netProfit: number;
  winRate: number;
  averageFinish: number | null;
  bestFinish: number | null;
  worstFinish: number | null;
}

export interface PositionalBias {
  early: number;
  middle: number;
  late: number;
}

export interface DraftTendencies {
  favoritePositionsByRound: Record<string, unknown>;
  averagePickTime: number | null;
  timeoutRate: number;
  autodraftRate: number;
  frequentPicks: unknown[];
  avoidedPlayers: unknown[];
  positionalBias: {
    QB: PositionalBias;
    RB: PositionalBias;
    WR: PositionalBias;
    TE: PositionalBias;
  };
}

export interface UserTournamentHistory {
  userId: string;
  tournaments: Record<string, unknown>;
  overallStats: OverallStats;
  seasonalStats: Record<string, unknown>;
  draftTendencies: DraftTendencies;
}

export interface Lineup {
  QB: unknown[];
  RB: unknown[];
  WR: unknown[];
  TE: unknown[];
  FLEX: unknown[];
  DST: unknown[];
  K: unknown[];
}

export interface Performance {
  weeklyRank: number | null;
  overallRank: number | null;
  percentile: number | null;
  optimalPoints: number | null;
  pointsLeft: number | null;
  optimalLineup: Record<string, unknown>;
  luckFactor: number | null;
  strengthOfSchedule: number | null;
}

export interface WeeklyScoring {
  tournamentId: string;
  week: number | null;
  userId: string;
  lineup: Lineup;
  weeklyPoints: number | null;
  totalPoints: number | null;
  performance: Performance;
}

export interface DatabaseMeta {
  lastUpdated: string;
  dataSources: string[];
  seasons: number[];
  totalTournaments: number;
}

export interface TournamentDatabaseStructure {
  meta: DatabaseMeta;
  tournaments: Record<string, Tournament>;
  drafts: Record<string, Draft>;
  users: Record<string, UserTournamentHistory>;
  picks: Record<string, Pick[]>;
  scoring: Record<string, WeeklyScoring>;
}

// ============================================================================
// TEMPLATES
// ============================================================================

// Tournament Database Structure
export const TOURNAMENT_DATABASE: TournamentDatabaseStructure = {
  meta: {
    lastUpdated: new Date().toISOString(),
    dataSources: ['TopDog Internal', 'Underdog Analysis'],
    seasons: [],
    totalTournaments: 0
  },
  
  // Tournament Categories
  tournaments: {
    // Keyed by tournament ID
  },
  
  drafts: {
    // Keyed by draft ID
  },
  
  users: {
    // Keyed by user ID
  },
  
  picks: {
    // Individual pick records
  },
  
  scoring: {
    // Weekly scoring data
  }
};

// Tournament Template
export const TOURNAMENT_TEMPLATE: Tournament = {
  // Basic Info
  id: '',
  name: '',
  season: 2024,
  week: null, // null for season-long
  format: '', // 'bestball', 'draft-and-hold', etc.
  
  // Contest Structure
  structure: {
    entryFee: null,
    maxEntries: null,
    totalEntrants: null,
    prizePool: null,
    payoutStructure: [], // Array of {place: 1, payout: 1000}
    
    // Draft Settings
    draftType: 'snake', // 'snake', 'linear', 'auction'
    rounds: 18,
    draftTime: 90, // seconds per pick
    positions: {
      QB: 2,
      RB: 6,
      WR: 8,
      TE: 3,
      FLEX: 0,
      DST: 0,
      K: 0
    }
  },
  
  // Scoring System
  scoring: {
    passing: {
      yards: 0.04, // 1 point per 25 yards
      touchdowns: 4,
      interceptions: -2,
      twoPointConversions: 2
    },
    rushing: {
      yards: 0.1, // 1 point per 10 yards
      touchdowns: 6,
      twoPointConversions: 2
    },
    receiving: {
      receptions: 0.5, // Half PPR
      yards: 0.1,
      touchdowns: 6,
      twoPointConversions: 2
    },
  },
  
  // Tournament Dates
  dates: {
    opened: null,
    draftStart: null,
    draftEnd: null,
    seasonStart: null,
    seasonEnd: null,
    payoutsProcessed: null
  },
  
  // Results
  results: {
    winner: null,
    topScores: [], // Array of {userId, teamName, totalPoints, payout}
    averageScore: null,
    medianScore: null,
    highScore: null,
    lowScore: null
  },
  
  // Analytics
  analytics: {
    popularPicks: [], // {playerId, pickRate, averageRound}
    contrarian: [], // Low-owned high-scoring players
    busts: [], // High-owned low-scoring players
    positionalTrends: {},
    draftTrends: {
      averageDraftTime: null,
      timeouts: 0,
      autodrafts: 0
    }
  }
};

// Draft Room Template
export const DRAFT_TEMPLATE: Draft = {
  id: '',
  tournamentId: '',
  roomNumber: null,
  
  // Participants
  participants: [], // Array of {userId, draftPosition, teamName}
  
  // Draft Settings
  settings: {
    type: 'snake',
    rounds: 18,
    timePerPick: 90,
    startTime: null,
    endTime: null
  },
  
  // Pick History
  picks: [], // Array of {round, pick, playerId, userId, timestamp, timeUsed}
  
  // Draft Analytics
  analytics: {
    totalTime: null,
    averagePickTime: null,
    timeouts: 0,
    autodrafts: 0,
    
    // Position trends by round
    positionByRound: {},
    
    // User draft grades (if available)
    draftGrades: [] // {userId, grade, reasoning}
  }
};

// User Tournament History Template
export const USER_TOURNAMENT_TEMPLATE: UserTournamentHistory = {
  userId: '',
  tournaments: {}, // Keyed by tournament ID
  
  // Overall Stats
  overallStats: {
    totalTournaments: 0,
    totalWinnings: 0,
    totalSpent: 0,
    netProfit: 0,
    winRate: 0,
    averageFinish: null,
    bestFinish: null,
    worstFinish: null
  },
  
  // Seasonal Stats
  seasonalStats: {}, // Keyed by season year
  
  // Draft Tendencies
  draftTendencies: {
    favoritePositionsByRound: {},
    averagePickTime: null,
    timeoutRate: 0,
    autodraftRate: 0,
    
    // Player preferences
    frequentPicks: [], // Players drafted most often
    avoidedPlayers: [], // Players never/rarely drafted
    
    // Positional preferences
    positionalBias: {
      QB: { early: 0, middle: 0, late: 0 },
      RB: { early: 0, middle: 0, late: 0 },
      WR: { early: 0, middle: 0, late: 0 },
      TE: { early: 0, middle: 0, late: 0 }
    }
  }
};

// Individual Pick Template
export const PICK_TEMPLATE: Pick = {
  id: '',
  tournamentId: '',
  draftId: '',
  userId: '',
  
  // Pick Details
  round: null,
  pick: null, // Overall pick number
  playerId: '',
  playerName: '',
  position: '',
  team: '',
  
  // Pick Context
  timestamp: null,
  timeUsed: null, // seconds
  wasTimeout: false,
  wasAutodraft: false,
  
  // Pick Analytics
  analytics: {
    adp: null, // Average draft position
    adpDiff: null, // Difference from ADP (positive = reached)
    ownership: null, // Percentage owned in this tournament
    projectedPoints: null,
    actualPoints: null,
    
    // Value metrics
    expectedValue: null,
    leverage: null, // Low ownership, high upside
    
    // Positional context
    positionRank: null, // Where this player was drafted among his position
    positionsRemaining: {} // How many of each position left
  }
};

// Weekly Scoring Template
export const WEEKLY_SCORING_TEMPLATE: WeeklyScoring = {
  tournamentId: '',
  week: null,
  userId: '',
  
  // Lineup
  lineup: {
    QB: [],
    RB: [],
    WR: [],
    TE: [],
    FLEX: [],
    DST: [],
    K: []
  },
  
  // Scoring
  weeklyPoints: null,
  totalPoints: null, // Season total through this week
  
  // Performance
  performance: {
    weeklyRank: null,
    overallRank: null,
    percentile: null,
    
    // Optimal lineup analysis
    optimalPoints: null, // Best possible lineup this week
    pointsLeft: null, // Difference from optimal
    optimalLineup: {},
    
    // Luck metrics
    luckFactor: null, // How lucky/unlucky lineups were
    strengthOfSchedule: null
  }
};

// ============================================================================
// DATABASE MANAGEMENT CLASS
// ============================================================================

class TournamentDatabase {
  static addTournament(tournament: Tournament): void {
    TOURNAMENT_DATABASE.tournaments[tournament.id] = tournament;
    TOURNAMENT_DATABASE.meta.lastUpdated = new Date().toISOString();
    TOURNAMENT_DATABASE.meta.totalTournaments++;
  }
  
  static addDraft(draft: Draft): void {
    TOURNAMENT_DATABASE.drafts[draft.id] = draft;
  }
  
  static addPick(pick: Pick): void {
    if (!TOURNAMENT_DATABASE.picks[pick.tournamentId]) {
      TOURNAMENT_DATABASE.picks[pick.tournamentId] = [];
    }
    TOURNAMENT_DATABASE.picks[pick.tournamentId].push(pick);
  }
  
  static getUserTournamentHistory(userId: string): UserTournamentHistory | null {
    return TOURNAMENT_DATABASE.users[userId] || null;
  }
  
  static getTournamentAnalytics(tournamentId: string): {
    totalPicks: number;
    averagePickTime: number;
    timeoutRate: number;
    autodraftRate: number;
    positionDistribution: Record<string, Record<string, number>>;
    popularPicks: Array<{
      playerId: string;
      playerName: string;
      position: string;
      pickCount: number;
      pickRate: number;
      averageRound: number;
    }>;
    valuePicks: Pick[];
  } {
    const tournament = TOURNAMENT_DATABASE.tournaments[tournamentId];
    const picks = TOURNAMENT_DATABASE.picks[tournamentId] || [];
    
    // Calculate analytics
    const analytics = {
      totalPicks: picks.length,
      averagePickTime: picks.length > 0
        ? picks.reduce((sum, pick) => sum + (pick.timeUsed || 0), 0) / picks.length
        : 0,
      timeoutRate: picks.length > 0
        ? picks.filter(pick => pick.wasTimeout).length / picks.length
        : 0,
      autodraftRate: picks.length > 0
        ? picks.filter(pick => pick.wasAutodraft).length / picks.length
        : 0,
      
      // Position trends
      positionDistribution: this.calculatePositionDistribution(picks),
      
      // Popular picks
      popularPicks: this.calculatePopularPicks(picks),
      
      // Value picks
      valuePicks: this.calculateValuePicks(picks)
    };
    
    return analytics;
  }
  
  private static calculatePositionDistribution(picks: Pick[]): Record<string, Record<string, number>> {
    const distribution: Record<string, Record<string, number>> = {};
    picks.forEach(pick => {
      const round = String(pick.round);
      if (!distribution[round]) distribution[round] = {};
      if (!distribution[round][pick.position]) distribution[round][pick.position] = 0;
      distribution[round][pick.position]++;
    });
    return distribution;
  }
  
  private static calculatePopularPicks(picks: Pick[]): Array<{
    playerId: string;
    playerName: string;
    position: string;
    pickCount: number;
    pickRate: number;
    averageRound: number;
  }> {
    const playerCounts: Record<string, {
      count: number;
      totalRound: number;
      playerName: string;
      position: string;
    }> = {};
    
    picks.forEach(pick => {
      if (!playerCounts[pick.playerId]) {
        playerCounts[pick.playerId] = {
          count: 0,
          totalRound: 0,
          playerName: pick.playerName,
          position: pick.position
        };
      }
      playerCounts[pick.playerId].count++;
      playerCounts[pick.playerId].totalRound += pick.round || 0;
    });
    
    return Object.entries(playerCounts)
      .map(([playerId, data]) => ({
        playerId,
        playerName: data.playerName,
        position: data.position,
        pickCount: data.count,
        pickRate: picks.length > 0 ? data.count / (picks.length / 18) : 0, // Assuming 18 rounds
        averageRound: data.count > 0 ? data.totalRound / data.count : 0
      }))
      .sort((a, b) => b.pickRate - a.pickRate);
  }
  
  private static calculateValuePicks(picks: Pick[]): Pick[] {
    // Players drafted later than ADP who performed well
    return picks
      .filter(pick => {
        const adpDiff = pick.analytics?.adpDiff;
        const actualPoints = pick.analytics?.actualPoints;
        const projectedPoints = pick.analytics?.projectedPoints;
        return adpDiff !== null && adpDiff !== undefined && adpDiff > 0 &&
               actualPoints !== null && actualPoints !== undefined &&
               projectedPoints !== null && projectedPoints !== undefined &&
               actualPoints > projectedPoints;
      })
      .sort((a, b) => {
        const aDiff = (b.analytics.actualPoints || 0) - (b.analytics.projectedPoints || 0);
        const bDiff = (a.analytics.actualPoints || 0) - (a.analytics.projectedPoints || 0);
        return aDiff - bDiff;
      });
  }
  
  static exportData(): string {
    return JSON.stringify(TOURNAMENT_DATABASE, null, 2);
  }
  
  static importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString) as TournamentDatabaseStructure;
      Object.assign(TOURNAMENT_DATABASE, data);
      return true;
    } catch (error) {
      serverLogger.error('Error importing tournament database', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { TournamentDatabase };

// CommonJS exports for backward compatibility
module.exports = {
  TOURNAMENT_DATABASE,
  TOURNAMENT_TEMPLATE,
  DRAFT_TEMPLATE,
  USER_TOURNAMENT_TEMPLATE,
  PICK_TEMPLATE,
  WEEKLY_SCORING_TEMPLATE,
  TournamentDatabase
};
