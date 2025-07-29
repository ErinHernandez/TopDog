import { db, safeFirebaseOperation, isAuthEnabled } from './firebase';
import { doc, updateDoc, getDoc, setDoc, increment, arrayUnion, serverTimestamp } from 'firebase/firestore';

/**
 * Comprehensive user statistics tracking system
 * Tracks financial, tournament, draft, and performance metrics
 */

// Initialize user statistics when creating a new user
export const initializeUserStats = async (userId) => {
  const userStats = {
    // Basic Info
    id: userId,
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp(),
    
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
    lastLogin: serverTimestamp(),
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

  try {
    await setDoc(doc(db, 'users', userId), userStats);
    return userStats;
  } catch (error) {
    console.error('Error initializing user stats:', error);
    throw error;
  }
};

// Update user statistics for deposits
export const updateDepositStats = async (userId, amount) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await initializeUserStats(userId);
    }
    
    const userData = userDoc.exists() ? userDoc.data() : {};
    const currentTotalDeposits = userData.totalDeposits || 0;
    const currentDepositCount = userData.depositCount || 0;
    const currentLargestDeposit = userData.largestDeposit || 0;
    
    const updates = {
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
    console.error('Error updating deposit stats:', error);
    throw error;
  }
};

// Update user statistics for tournament entries
export const updateTournamentEntryStats = async (userId, tournamentType, entryFee) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await initializeUserStats(userId);
    }
    
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    const updates = {
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
    
    // Set first tournament timestamp if this is the first tournament
    if (!userData.firstTournament) {
      updates.firstTournament = serverTimestamp();
    }
    
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error updating tournament entry stats:', error);
    throw error;
  }
};

// Update user statistics for tournament results
export const updateTournamentResultStats = async (userId, tournamentType, finish, winnings, points) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.warn('User document does not exist for tournament result update');
      return;
    }
    
    const userData = userDoc.data();
    
    const updates = {
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
    if (points) {
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
    console.error('Error updating tournament result stats:', error);
    throw error;
  }
};

// Update draft statistics
export const updateDraftStats = async (userId, draftData) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await initializeUserStats(userId);
    }
    
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    const updates = {
      draftsParticipated: increment(1),
      lastActive: serverTimestamp()
    };
    
    // Update draft position statistics
    if (draftData.position) {
      updates[`draftPositions.${draftData.position}`] = increment(1);
      
      // Update average draft position
      const currentTotalPositions = Object.values(userData.draftPositions || {}).reduce((sum, count) => sum + count, 0);
      const currentAveragePosition = userData.averageDraftPosition || 0;
      updates.averageDraftPosition = (currentAveragePosition * currentTotalPositions + draftData.position) / (currentTotalPositions + 1);
    }
    
    // Update player drafting statistics
    if (draftData.players) {
      const positionCounts = {};
      draftData.players.forEach(player => {
        const position = player.position;
        positionCounts[position] = (positionCounts[position] || 0) + 1;
        updates[`playersDrafted.${position}`] = increment(1);
        updates['playersDrafted.total'] = increment(1);
      });
      
      // Update favorite teams
      const teamCounts = {};
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
    console.error('Error updating draft stats:', error);
    throw error;
  }
};

// Update activity statistics
export const updateActivityStats = async (userId, sessionData = {}) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await initializeUserStats(userId);
    }
    
    const updates = {
      lastActive: serverTimestamp(),
      lastLogin: serverTimestamp(),
      sessionsCount: increment(1)
    };
    
    // Update time spent if provided
    if (sessionData.timeSpent) {
      updates.totalTimeSpent = increment(sessionData.timeSpent);
    }
    
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error updating activity stats:', error);
    throw error;
  }
};

// Mock user stats for development when Firebase is not available
const getMockUserStats = (userId) => ({
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
  lastActive: new Date()
});

// Get comprehensive user statistics
export const getUserStats = async (userId) => {
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
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return null;
    }
    return userDoc.data();
  }, getMockUserStats(userId));
};

// Calculate user rank based on various metrics
export const calculateUserRank = (userStats) => {
  if (!userStats) return null;
  
  const rank = {
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