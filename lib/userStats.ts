/**
 * Comprehensive user statistics tracking system
 * Tracks financial, tournament, draft, and performance metrics
 */

import { db, safeFirebaseOperation, isAuthEnabled } from './firebase';
import { doc, updateDoc, getDoc, setDoc, increment, arrayUnion, serverTimestamp, Timestamp } from 'firebase/firestore';

// ============================================================================
// TYPES
// ============================================================================

export interface TournamentCounts {
  topdog: number;
  total: number;
}

export interface TournamentResults {
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;
  topTen: number;
  topFifty: number;
  topHundred: number;
  cashed: number;
  total: number;
}

export interface DraftPositions {
  first: number;
  second: number;
  third: number;
  fourth: number;
  fifth: number;
  sixth: number;
  seventh: number;
  eighth: number;
  ninth: number;
  tenth: number;
  eleventh: number;
  twelfth: number;
}

export interface PlayersDrafted {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
  total: number;
}

export interface TopPicksByPosition {
  QB: string[];
  RB: string[];
  WR: string[];
  TE: string[];
}

export interface Streaks {
  currentWinningStreak: number;
  longestWinningStreak: number;
  currentTournamentStreak: number;
  longestTournamentStreak: number;
}

export interface UserStats {
  // Basic Info
  id: string;
  createdAt: Timestamp | Date;
  lastActive: Timestamp | Date;
  
  // Financial Statistics
  balance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalTournamentEntries: number;
  totalTournamentWinnings: number;
  netProfit: number;
  largestDeposit: number;
  largestWithdrawal: number;
  averageDeposit: number;
  depositCount?: number;
  
  // Tournament Statistics
  tournamentsEntered: TournamentCounts;
  tournamentsCompleted: TournamentCounts;
  tournamentResults: TournamentResults;
  totalEntryFees: TournamentCounts;
  totalWinnings: TournamentCounts;
  
  // Draft Statistics
  draftsParticipated: number;
  draftsCompleted: number;
  draftsAbandoned: number;
  totalPicksMade: number;
  averageDraftPosition: number;
  draftPositions: DraftPositions;
  
  // Player Drafting Statistics
  playersDrafted: PlayersDrafted;
  topPicksByPosition: TopPicksByPosition;
  favoriteTeams: Record<string, number>;
  favoritePlayers: Record<string, number>;
  
  // Performance Statistics
  bestFinish: number | null;
  worstFinish: number | null;
  averageFinish: number;
  totalPoints: number;
  averagePoints: number;
  highestScore: number;
  lowestScore: number;
  
  // Activity Statistics
  daysActive: number;
  lastLogin: Timestamp | Date;
  totalTimeSpent: number; // in minutes
  sessionsCount: number;
  
  // Achievement Statistics
  achievements: string[];
  badges: string[];
  streaks: Streaks;
  
  // Social Statistics
  friendsCount: number;
  followersCount: number;
  followingCount: number;
  totalInteractions: number;
  
  // Preferences
  favoriteTournamentType: string | null;
  preferredDraftPosition: number | null;
  autoDraftEnabled: boolean;
  notificationsEnabled: boolean;
  
  // Timestamps
  firstDeposit: Timestamp | Date | null;
  firstTournament: Timestamp | Date | null;
  firstWin: Timestamp | Date | null;
  lastDeposit: Timestamp | Date | null;
  lastTournament: Timestamp | Date | null;
  lastWin: Timestamp | Date | null;
}

export interface DraftData {
  position?: number;
  players?: Array<{
    position: string;
    team: string;
  }>;
}

export interface SessionData {
  timeSpent?: number;
}

export interface UserRank {
  overall: number;
  financial: number;
  tournament: number;
  draft: number;
  performance: number;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize user statistics when creating a new user
 */
export const initializeUserStats = async (userId: string): Promise<UserStats> => {
  const userStats: UserStats = {
    // Basic Info
    id: userId,
    createdAt: serverTimestamp() as Timestamp,
    lastActive: serverTimestamp() as Timestamp,
    
    // Financial Statistics
    balance: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTournamentEntries: 0,
    totalTournamentWinnings: 0,
    netProfit: 0,
    largestDeposit: 0,
    largestWithdrawal: 0,
    averageDeposit: 0,
    
    // Tournament Statistics
    tournamentsEntered: {
      topdog: 0,
      total: 0
    },
    tournamentsCompleted: {
      topdog: 0,
      total: 0
    },
    tournamentResults: {
      firstPlace: 0,
      secondPlace: 0,
      thirdPlace: 0,
      topTen: 0,
      topFifty: 0,
      topHundred: 0,
      cashed: 0,
      total: 0
    },
    totalEntryFees: {
      topdog: 0,
      total: 0
    },
    totalWinnings: {
      topdog: 0,
      total: 0
    },
    
    // Draft Statistics
    draftsParticipated: 0,
    draftsCompleted: 0,
    draftsAbandoned: 0,
    totalPicksMade: 0,
    averageDraftPosition: 0,
    draftPositions: {
      first: 0,
      second: 0,
      third: 0,
      fourth: 0,
      fifth: 0,
      sixth: 0,
      seventh: 0,
      eighth: 0,
      ninth: 0,
      tenth: 0,
      eleventh: 0,
      twelfth: 0
    },
    
    // Player Drafting Statistics
    playersDrafted: {
      QB: 0,
      RB: 0,
      WR: 0,
      TE: 0,
      total: 0
    },
    topPicksByPosition: {
      QB: [],
      RB: [],
      WR: [],
      TE: []
    },
    favoriteTeams: {},
    favoritePlayers: {},
    
    // Performance Statistics
    bestFinish: null,
    worstFinish: null,
    averageFinish: 0,
    totalPoints: 0,
    averagePoints: 0,
    highestScore: 0,
    lowestScore: 0,
    
    // Activity Statistics
    daysActive: 0,
    lastLogin: serverTimestamp() as Timestamp,
    totalTimeSpent: 0, // in minutes
    sessionsCount: 0,
    
    // Achievement Statistics
    achievements: [],
    badges: [],
    streaks: {
      currentWinningStreak: 0,
      longestWinningStreak: 0,
      currentTournamentStreak: 0,
      longestTournamentStreak: 0
    },
    
    // Social Statistics
    friendsCount: 0,
    followersCount: 0,
    followingCount: 0,
    totalInteractions: 0,
    
    // Preferences
    favoriteTournamentType: null,
    preferredDraftPosition: null,
    autoDraftEnabled: false,
    notificationsEnabled: true,
    
    // Timestamps
    firstDeposit: null,
    firstTournament: null,
    firstWin: null,
    lastDeposit: null,
    lastTournament: null,
    lastWin: null
  };

  if (!db) {
    throw new Error('Firebase db not initialized');
  }
  try {
    await setDoc(doc(db, 'users', userId), userStats);
    return userStats;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error initializing user stats:', errorMessage);
    throw error;
  }
};

// ============================================================================
// UPDATE FUNCTIONS
// ============================================================================

/**
 * Update user statistics for deposits
 */
export const updateDepositStats = async (userId: string, amount: number): Promise<void> => {
  if (!db) {
    throw new Error('Firebase db not initialized');
  }
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await initializeUserStats(userId);
    }
    
    const userData = userDoc.exists() ? (userDoc.data() as Partial<UserStats>) : {};
    const currentTotalDeposits = userData.totalDeposits || 0;
    const currentDepositCount = userData.depositCount || 0;
    const currentLargestDeposit = userData.largestDeposit || 0;
    
    const updates: Record<string, unknown> = {
      balance: increment(amount),
      totalDeposits: increment(amount),
      depositCount: increment(1),
      lastDeposit: serverTimestamp(),
      lastActive: serverTimestamp(),
      netProfit: increment(amount),
      largestDeposit: Math.max(currentLargestDeposit, amount),
      averageDeposit: (currentTotalDeposits + amount) / (currentDepositCount + 1)
    };
    
    // Set first deposit timestamp if this is the first deposit
    if (!userData.firstDeposit) {
      updates.firstDeposit = serverTimestamp();
    }
    
    await updateDoc(userRef, updates);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error updating deposit stats:', errorMessage);
    throw error;
  }
};

/**
 * Update user statistics for tournament entries
 */
export const updateTournamentEntryStats = async (
  userId: string,
  tournamentType: string,
  entryFee: number
): Promise<void> => {
  if (!db) {
    throw new Error('Firebase db not initialized');
  }
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await initializeUserStats(userId);
    }
    
    const updates: Record<string, unknown> = {
      balance: increment(-entryFee),
      totalTournamentEntries: increment(1),
      [`tournamentsEntered.${tournamentType}`]: increment(1),
      [`tournamentsEntered.total`]: increment(1),
      [`totalEntryFees.${tournamentType}`]: increment(entryFee),
      [`totalEntryFees.total`]: increment(entryFee),
      netProfit: increment(-entryFee),
      lastTournament: serverTimestamp(),
      lastActive: serverTimestamp(),
      favoriteTournamentType: tournamentType // Update based on most recent
    };
    
    const userData = userDoc.exists() ? (userDoc.data() as Partial<UserStats>) : {};
    
    // Set first tournament timestamp if this is the first tournament
    if (!userData.firstTournament) {
      updates.firstTournament = serverTimestamp();
    }
    
    await updateDoc(userRef, updates);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error updating tournament entry stats:', errorMessage);
    throw error;
  }
};

/**
 * Update user statistics for tournament results
 */
export const updateTournamentResultStats = async (
  userId: string,
  tournamentType: string,
  finish: number,
  winnings: number,
  points?: number
): Promise<void> => {
  if (!db) {
    throw new Error('Firebase db not initialized');
  }
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.warn('User document does not exist for tournament result update');
      return;
    }
    
    const userData = userDoc.data() as Partial<UserStats>;
    
    const updates: Record<string, unknown> = {
      [`tournamentsCompleted.${tournamentType}`]: increment(1),
      [`tournamentsCompleted.total`]: increment(1),
      totalTournamentWinnings: increment(winnings),
      [`totalWinnings.${tournamentType}`]: increment(winnings),
      [`totalWinnings.total`]: increment(winnings),
      netProfit: increment(winnings),
      balance: increment(winnings),
      lastActive: serverTimestamp()
    };
    
    // Update tournament results based on finish
    if (finish === 1) {
      updates['tournamentResults.firstPlace'] = increment(1);
      updates['tournamentResults.cashed'] = increment(1);
      if (!userData.firstWin) {
        updates.firstWin = serverTimestamp();
      }
      updates.lastWin = serverTimestamp();
    } else if (finish === 2) {
      updates['tournamentResults.secondPlace'] = increment(1);
      updates['tournamentResults.cashed'] = increment(1);
    } else if (finish === 3) {
      updates['tournamentResults.thirdPlace'] = increment(1);
      updates['tournamentResults.cashed'] = increment(1);
    } else if (finish <= 10) {
      updates['tournamentResults.topTen'] = increment(1);
      updates['tournamentResults.cashed'] = increment(1);
    } else if (finish <= 50) {
      updates['tournamentResults.topFifty'] = increment(1);
      updates['tournamentResults.cashed'] = increment(1);
    } else if (finish <= 100) {
      updates['tournamentResults.topHundred'] = increment(1);
      updates['tournamentResults.cashed'] = increment(1);
    }
    
    updates['tournamentResults.total'] = increment(1);
    
    // Update performance statistics
    if (points !== undefined) {
      const currentTotalPoints = userData.totalPoints || 0;
      const currentTournamentCount = userData.tournamentResults?.total || 0;
      
      updates.totalPoints = increment(points);
      updates.averagePoints = (currentTotalPoints + points) / (currentTournamentCount + 1);
      updates.highestScore = Math.max(userData.highestScore || 0, points);
      updates.lowestScore = userData.lowestScore ? Math.min(userData.lowestScore, points) : points;
    }
    
    // Update best/worst finish
    if (finish) {
      if (!userData.bestFinish || finish < userData.bestFinish) {
        updates.bestFinish = finish;
      }
      if (!userData.worstFinish || finish > userData.worstFinish) {
        updates.worstFinish = finish;
      }
      
      const currentTotalFinishes = userData.tournamentResults?.total || 0;
      const currentAverageFinish = userData.averageFinish || 0;
      updates.averageFinish = (currentAverageFinish * currentTotalFinishes + finish) / (currentTotalFinishes + 1);
    }
    
    await updateDoc(userRef, updates);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error updating tournament result stats:', errorMessage);
    throw error;
  }
};

/**
 * Update draft statistics
 */
export const updateDraftStats = async (userId: string, draftData: DraftData): Promise<void> => {
  if (!db) {
    throw new Error('Firebase db not initialized');
  }
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await initializeUserStats(userId);
    }
    
    const userData = userDoc.exists() ? (userDoc.data() as Partial<UserStats>) : {};
    
    const updates: Record<string, unknown> = {
      draftsParticipated: increment(1),
      lastActive: serverTimestamp()
    };
    
    // Update draft position statistics
    if (draftData.position !== undefined) {
      updates[`draftPositions.${draftData.position}`] = increment(1);
      
      // Update average draft position
      const currentTotalPositions = Object.values(userData.draftPositions || {}).reduce((sum, count) => sum + (count as number), 0);
      const currentAveragePosition = userData.averageDraftPosition || 0;
      updates.averageDraftPosition = (currentAveragePosition * currentTotalPositions + draftData.position) / (currentTotalPositions + 1);
    }
    
    // Update player drafting statistics
    if (draftData.players) {
      const positionCounts: Record<string, number> = {};
      draftData.players.forEach(player => {
        const position = player.position;
        positionCounts[position] = (positionCounts[position] || 0) + 1;
        updates[`playersDrafted.${position}`] = increment(1);
        updates['playersDrafted.total'] = increment(1);
      });
      
      // Update favorite teams
      const teamCounts: Record<string, number> = {};
      draftData.players.forEach(player => {
        const team = player.team;
        teamCounts[team] = (teamCounts[team] || 0) + 1;
      });
      
      Object.entries(teamCounts).forEach(([team, count]) => {
        const currentCount = userData.favoriteTeams?.[team] || 0;
        updates[`favoriteTeams.${team}`] = currentCount + count;
      });
    }
    
    await updateDoc(userRef, updates);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error updating draft stats:', errorMessage);
    throw error;
  }
};

/**
 * Update activity statistics
 */
export const updateActivityStats = async (userId: string, sessionData: SessionData = {}): Promise<void> => {
  if (!db) {
    throw new Error('Firebase db not initialized');
  }
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await initializeUserStats(userId);
    }
    
    const updates: Record<string, unknown> = {
      lastActive: serverTimestamp(),
      lastLogin: serverTimestamp(),
      sessionsCount: increment(1)
    };
    
    // Update time spent if provided
    if (sessionData.timeSpent !== undefined) {
      updates.totalTimeSpent = increment(sessionData.timeSpent);
    }
    
    await updateDoc(userRef, updates);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error updating activity stats:', errorMessage);
    throw error;
  }
};

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Mock user stats for development when Firebase is not available
 */
const getMockUserStats = (userId: string): UserStats => ({
  id: userId,
  balance: 100.00,
  totalDeposits: 150.00,
  totalWithdrawals: 0,
  totalTournamentEntries: 2,
  totalTournamentWinnings: 25.00,
  netProfit: -25.00,
  tournamentsEntered: {
    topdog: 1,
    total: 1
  },
  tournamentsCompleted: {
    topdog: 0,
    total: 0
  },
  tournamentResults: {
    firstPlace: 0,
    secondPlace: 0,
    thirdPlace: 0,
    topTen: 0,
    topFifty: 0,
    topHundred: 0,
    cashed: 0,
    total: 0
  },
  totalEntryFees: {
    topdog: 25,
    total: 25
  },
  totalWinnings: {
    topdog: 0,
    total: 0
  },
  draftsParticipated: 2,
  draftsCompleted: 0,
  draftsAbandoned: 0,
  totalPicksMade: 36,
  averageDraftPosition: 6.5,
  playersDrafted: {
    QB: 2,
    RB: 6,
    WR: 8,
    TE: 4,
    total: 20
  },
  createdAt: new Date(),
  lastActive: new Date(),
  largestDeposit: 0,
  largestWithdrawal: 0,
  averageDeposit: 0,
  draftPositions: {
    first: 0,
    second: 0,
    third: 0,
    fourth: 0,
    fifth: 0,
    sixth: 0,
    seventh: 0,
    eighth: 0,
    ninth: 0,
    tenth: 0,
    eleventh: 0,
    twelfth: 0
  },
  topPicksByPosition: {
    QB: [],
    RB: [],
    WR: [],
    TE: []
  },
  favoriteTeams: {},
  favoritePlayers: {},
  bestFinish: null,
  worstFinish: null,
  averageFinish: 0,
  totalPoints: 0,
  averagePoints: 0,
  highestScore: 0,
  lowestScore: 0,
  daysActive: 0,
  lastLogin: new Date(),
  totalTimeSpent: 0,
  sessionsCount: 0,
  achievements: [],
  badges: [],
  streaks: {
    currentWinningStreak: 0,
    longestWinningStreak: 0,
    currentTournamentStreak: 0,
    longestTournamentStreak: 0
  },
  friendsCount: 0,
  followersCount: 0,
  followingCount: 0,
  totalInteractions: 0,
  favoriteTournamentType: null,
  preferredDraftPosition: null,
  autoDraftEnabled: false,
  notificationsEnabled: true,
  firstDeposit: null,
  firstTournament: null,
  firstWin: null,
  lastDeposit: null,
  lastTournament: null,
  lastWin: null
});

/**
 * Get comprehensive user statistics
 */
export const getUserStats = async (userId: string): Promise<UserStats | null> => {
  // Always use mock data on server side
  if (typeof window === 'undefined') {
    return getMockUserStats(userId);
  }

  // If authentication is not enabled, return mock data
  if (!isAuthEnabled()) {
    console.log('🔄 Using mock user stats (Firebase auth not enabled)');
    return getMockUserStats(userId);
  }

  return safeFirebaseOperation(async () => {
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return null;
    }
    return userDoc.data() as UserStats;
  }, getMockUserStats(userId));
};

/**
 * Calculate user rank based on various metrics
 */
export const calculateUserRank = (userStats: UserStats | null): UserRank | null => {
  if (!userStats) return null;
  
  const rank: UserRank = {
    overall: 0,
    financial: 0,
    tournament: 0,
    draft: 0,
    performance: 0
  };
  
  // Financial rank (based on net profit)
  rank.financial = userStats.netProfit || 0;
  
  // Tournament rank (based on total winnings and finish rate)
  const finishRate = userStats.tournamentResults?.total > 0 
    ? (userStats.tournamentResults.cashed / userStats.tournamentResults.total) * 100 
    : 0;
  rank.tournament = (userStats.totalTournamentWinnings || 0) + (finishRate * 100);
  
  // Draft rank (based on participation and completion rate)
  const draftCompletionRate = userStats.draftsParticipated > 0 
    ? (userStats.draftsCompleted / userStats.draftsParticipated) * 100 
    : 0;
  rank.draft = (userStats.draftsParticipated || 0) + (draftCompletionRate * 10);
  
  // Performance rank (based on average finish and points)
  rank.performance = (userStats.averagePoints || 0) - (userStats.averageFinish || 0);
  
  // Overall rank (weighted combination)
  rank.overall = (rank.financial * 0.4) + (rank.tournament * 0.3) + (rank.draft * 0.2) + (rank.performance * 0.1);
  
  return rank;
};
