/**
 * TopDog Tournament Database Structure
 * Comprehensive historical tournament data storage
 * Designed to match/exceed Underdog's data granularity
 */

// Tournament Database Structure
const TOURNAMENT_DATABASE = {
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
const TOURNAMENT_TEMPLATE = {
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
const DRAFT_TEMPLATE = {
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
const USER_TOURNAMENT_TEMPLATE = {
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
const PICK_TEMPLATE = {
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
const WEEKLY_SCORING_TEMPLATE = {
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

// Database Management Class
class TournamentDatabase {
  static addTournament(tournament) {
    TOURNAMENT_DATABASE.tournaments[tournament.id] = tournament;
    TOURNAMENT_DATABASE.meta.lastUpdated = new Date().toISOString();
    TOURNAMENT_DATABASE.meta.totalTournaments++;
  }
  
  static addDraft(draft) {
    TOURNAMENT_DATABASE.drafts[draft.id] = draft;
  }
  
  static addPick(pick) {
    if (!TOURNAMENT_DATABASE.picks[pick.tournamentId]) {
      TOURNAMENT_DATABASE.picks[pick.tournamentId] = [];
    }
    TOURNAMENT_DATABASE.picks[pick.tournamentId].push(pick);
  }
  
  static getUserTournamentHistory(userId) {
    return TOURNAMENT_DATABASE.users[userId] || null;
  }
  
  static getTournamentAnalytics(tournamentId) {
    const tournament = TOURNAMENT_DATABASE.tournaments[tournamentId];
    const picks = TOURNAMENT_DATABASE.picks[tournamentId] || [];
    
    // Calculate analytics
    const analytics = {
      totalPicks: picks.length,
      averagePickTime: picks.reduce((sum, pick) => sum + (pick.timeUsed || 0), 0) / picks.length,
      timeoutRate: picks.filter(pick => pick.wasTimeout).length / picks.length,
      autodraftRate: picks.filter(pick => pick.wasAutodraft).length / picks.length,
      
      // Position trends
      positionDistribution: this.calculatePositionDistribution(picks),
      
      // Popular picks
      popularPicks: this.calculatePopularPicks(picks),
      
      // Value picks
      valuePicks: this.calculateValuePicks(picks)
    };
    
    return analytics;
  }
  
  static calculatePositionDistribution(picks) {
    const distribution = {};
    picks.forEach(pick => {
      const round = pick.round;
      if (!distribution[round]) distribution[round] = {};
      if (!distribution[round][pick.position]) distribution[round][pick.position] = 0;
      distribution[round][pick.position]++;
    });
    return distribution;
  }
  
  static calculatePopularPicks(picks) {
    const playerCounts = {};
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
      playerCounts[pick.playerId].totalRound += pick.round;
    });
    
    return Object.entries(playerCounts)
      .map(([playerId, data]) => ({
        playerId,
        playerName: data.playerName,
        position: data.position,
        pickCount: data.count,
        pickRate: data.count / (picks.length / 18), // Assuming 18 rounds
        averageRound: data.totalRound / data.count
      }))
      .sort((a, b) => b.pickRate - a.pickRate);
  }
  
  static calculateValuePicks(picks) {
    // Players drafted later than ADP who performed well
    return picks
      .filter(pick => pick.analytics?.adpDiff > 0 && pick.analytics?.actualPoints > pick.analytics?.projectedPoints)
      .sort((a, b) => (b.analytics.actualPoints - b.analytics.projectedPoints) - (a.analytics.actualPoints - a.analytics.projectedPoints));
  }
  
  static exportData() {
    return JSON.stringify(TOURNAMENT_DATABASE, null, 2);
  }
  
  static importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      Object.assign(TOURNAMENT_DATABASE, data);
      return true;
    } catch (error) {
      console.error('Error importing tournament database:', error);
      return false;
    }
  }
}

module.exports = {
  TOURNAMENT_DATABASE,
  TOURNAMENT_TEMPLATE,
  DRAFT_TEMPLATE,
  USER_TOURNAMENT_TEMPLATE,
  PICK_TEMPLATE,
  WEEKLY_SCORING_TEMPLATE,
  TournamentDatabase
};