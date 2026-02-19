/**
 * Tournament Data Collector
 * Captures pick-level data during live drafts for historical analysis
 * Based on Underdog's 24-field data model but optimized for TopDog
 */

 
import { serverLogger } from './logger/serverLogger';

const { TournamentDatabase } = require('./tournamentDatabase');

// ============================================================================
// TYPES
// ============================================================================

export interface TournamentData {
  id?: string;
  name: string;
  season?: number;
  format?: string;
  entryFee: number;
  maxEntries?: number;
  prizePool?: number;
  payoutStructure?: Array<{ place: number; payout: number }>;
  scoring?: Record<string, unknown>;
  openDate?: string;
  seasonStart?: string;
  seasonEnd?: string;
}

export interface DraftData {
  id?: string;
  tournamentId: string;
  roomNumber?: number;
  participants: Array<{
    userId: string;
    username?: string;
    teamName?: string;
  }>;
}

export interface PickData {
  tournamentId: string;
  draftId: string;
  userId: string;
  round: number;
  pick: number;
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  timeUsed?: number | null;
  wasTimeout?: boolean;
  wasAutodraft?: boolean;
  pickSource?: string;
  adp?: number | null;
  projectedPoints?: number | null;
  positionsRemaining?: Record<string, number>;
}

export interface Draft {
  id: string;
  tournamentId: string;
  roomNumber: number;
  participants: Array<{
    userId: string;
    username: string;
    teamName: string;
    draftPosition: number;
    isActive: boolean;
  }>;
  settings: {
    type: string;
    rounds: number;
    timePerPick: number;
    startTime: string;
    endTime: string | null;
  };
  picks: Array<Record<string, unknown>>;
  analytics: {
    totalTime: number | null;
    averagePickTime: number | null;
    timeouts: number;
    autodrafts: number;
    positionByRound: Record<string, Record<string, number>>;
    draftGrades: unknown[];
  };
}

export interface Tournament {
  id: string;
  name: string;
  season: number;
  format: string;
  structure: {
    entryFee: number;
    maxEntries: number | null;
    prizePool: number | null;
    payoutStructure: Array<{ place: number; payout: number }>;
    draftType: string;
    rounds: number;
    draftTime: number;
    positions: {
      QB: number;
      RB: number;
      WR: number;
      TE: number;
    };
  };
  scoring: Record<string, unknown>;
  dates: {
    opened: string;
    draftStart: string | null;
    draftEnd: string | null;
    seasonStart: string | null;
    seasonEnd: string | null;
  };
  results: {
    winner: string | null;
    topScores: unknown[];
    averageScore: number | null;
    totalEntrants: number;
  };
  analytics: {
    popularPicks: unknown[];
    contrarian: unknown[];
    busts: unknown[];
    draftTrends: {
      averageDraftTime: number | null;
      timeouts: number;
      autodrafts: number;
    };
  };
}

// ============================================================================
// CLASS
// ============================================================================

class TournamentDataCollector {
  private activeDrafts: Map<string, Draft>;
  private pickBuffer: Array<Record<string, unknown>>;
  private readonly batchSize: number;

  constructor() {
    this.activeDrafts = new Map(); // Track ongoing drafts
    this.pickBuffer = []; // Buffer picks before batch writing
    this.batchSize = 100; // Write in batches of 100 picks
  }

  /**
   * Initialize a new tournament
   */
  initializeTournament(tournamentData: TournamentData): Tournament {
    const tournament: Tournament = {
      id: tournamentData.id || this.generateId(),
      name: tournamentData.name,
      season: tournamentData.season || new Date().getFullYear(),
      format: tournamentData.format || 'bestball',
      
      structure: {
        entryFee: tournamentData.entryFee,
        maxEntries: tournamentData.maxEntries || null,
        prizePool: tournamentData.prizePool || null,
        payoutStructure: tournamentData.payoutStructure || [],
        
        draftType: 'snake',
        rounds: 18,
        draftTime: 90,
        positions: {
          QB: 2,
          RB: 6, 
          WR: 8,
          TE: 3
        }
      },
      
      scoring: tournamentData.scoring || this.getDefaultScoring(),
      
      dates: {
        opened: tournamentData.openDate || new Date().toISOString(),
        draftStart: null,
        draftEnd: null,
        seasonStart: tournamentData.seasonStart || null,
        seasonEnd: tournamentData.seasonEnd || null
      },
      
      results: {
        winner: null,
        topScores: [],
        averageScore: null,
        totalEntrants: 0
      },
      
      analytics: {
        popularPicks: [],
        contrarian: [],
        busts: [],
        draftTrends: {
          averageDraftTime: null,
          timeouts: 0,
          autodrafts: 0
        }
      }
    };

    TournamentDatabase.addTournament(tournament);
    serverLogger.info('Tournament initialized', { name: tournament.name, id: tournament.id });
    return tournament;
  }

  /**
   * Initialize a new draft room
   */
  initializeDraft(draftData: DraftData): Draft {
    const draft: Draft = {
      id: draftData.id || this.generateId(),
      tournamentId: draftData.tournamentId,
      roomNumber: draftData.roomNumber || 1,
      
      participants: draftData.participants.map((p, idx) => ({
        userId: p.userId,
        username: p.username || `User ${idx + 1}`,
        teamName: p.teamName || `Team ${idx + 1}`,
        draftPosition: idx + 1,
        isActive: true
      })),
      
      settings: {
        type: 'snake',
        rounds: 18,
        timePerPick: 90,
        startTime: new Date().toISOString(),
        endTime: null
      },
      
      picks: [],
      
      analytics: {
        totalTime: null,
        averagePickTime: null,
        timeouts: 0,
        autodrafts: 0,
        positionByRound: {},
        draftGrades: []
      }
    };

    this.activeDrafts.set(draft.id, draft);
    TournamentDatabase.addDraft(draft);

    serverLogger.info('Draft room initialized', { draftId: draft.id, participants: draft.participants.length });
    return draft;
  }

  /**
   * Record a pick (core data collection function)
   */
  recordPick(pickData: PickData): Record<string, unknown> {
    const pick: Record<string, unknown> = {
      id: this.generateId(),
      tournamentId: pickData.tournamentId,
      draftId: pickData.draftId,
      userId: pickData.userId,
      
      // Pick details
      round: pickData.round,
      pick: pickData.pick, // Overall pick number
      playerId: pickData.playerId,
      playerName: pickData.playerName,
      position: pickData.position,
      team: pickData.team,
      
      // Pick context
      timestamp: new Date().toISOString(),
      timeUsed: pickData.timeUsed || null,
      wasTimeout: pickData.wasTimeout || false,
      wasAutodraft: pickData.wasAutodraft || false,
      pickSource: pickData.pickSource || 'user', // 'user', 'queue', 'auto'
      
      // Analytics (populated post-draft)
      analytics: {
        adp: pickData.adp || null,
        adpDiff: null, // Will calculate later
        ownership: null, // Will calculate across tournament
        projectedPoints: pickData.projectedPoints || null,
        actualPoints: null, // Updated weekly during season
        
        expectedValue: null,
        leverage: null,
        
        positionRank: null,
        positionsRemaining: pickData.positionsRemaining || {}
      }
    };

    // Add to buffer
    this.pickBuffer.push(pick);
    
    // Update active draft
    const draft = this.activeDrafts.get(pickData.draftId);
    if (draft) {
      draft.picks.push(pick);

      // Update draft analytics
      if (pick.wasTimeout) draft.analytics.timeouts++;
      if (pick.wasAutodraft) draft.analytics.autodrafts++;

      // Track position by round
      if (!draft.analytics.positionByRound[pickData.round]) {
        draft.analytics.positionByRound[pickData.round] = {};
      }
      if (!draft.analytics.positionByRound[pickData.round]![pickData.position]) {
        draft.analytics.positionByRound[pickData.round]![pickData.position] = 0;
      }
      draft.analytics.positionByRound[pickData.round]![pickData.position]!++;
    }

    // Batch write if buffer is full
    if (this.pickBuffer.length >= this.batchSize) {
      this.flushPickBuffer();
    }

    serverLogger.debug('Pick recorded', { playerName: pickData.playerName, position: pickData.position, round: pickData.round, pick: pickData.pick });
    return pick;
  }

  /**
   * Complete a draft and calculate final analytics
   */
  completeDraft(draftId: string): Draft | undefined {
    const draft = this.activeDrafts.get(draftId);
    if (!draft) {
      serverLogger.error('Draft not found', new Error(`Draft not found: ${draftId}`));
      return;
    }

    // Calculate final draft analytics
    draft.settings.endTime = new Date().toISOString();
    
    const startTime = new Date(draft.settings.startTime);
    const endTime = new Date(draft.settings.endTime);
    draft.analytics.totalTime = Math.round((endTime.getTime() - startTime.getTime()) / 1000); // seconds
    
    const validPicks = draft.picks.filter((p: Record<string, unknown>) => p.timeUsed !== null);
    if (validPicks.length > 0) {
      const totalTime = validPicks.reduce((sum: number, p: Record<string, unknown>) => 
        sum + (p.timeUsed as number), 0);
      draft.analytics.averagePickTime = totalTime / validPicks.length;
    }

    // Calculate ownership rates across this tournament
    this.calculateOwnershipRates(draft.tournamentId);
    
    // Calculate ADP differences
    this.calculateADPDifferences(draftId);

    // Remove from active drafts
    this.activeDrafts.delete(draftId);
    
    // Flush any remaining picks
    this.flushPickBuffer();

    serverLogger.info('Draft completed', { draftId, totalTime: draft.analytics.totalTime, avgPickTime: draft.analytics.averagePickTime?.toFixed(1) });
    return draft;
  }

  /**
   * Update player performance during the season
   */
  updatePlayerPerformance(playerId: string, weeklyPoints: number, seasonTotal: number): void {
    // Find all picks of this player and update their performance
    const picks = this.findPicksByPlayer(playerId);
    
    picks.forEach(pick => {
      const analytics = pick.analytics as Record<string, unknown>;
      analytics.actualPoints = seasonTotal;
      // Could store weekly breakdown if needed
    });

    serverLogger.debug('Updated performance', { playerId, seasonTotal, picksCount: picks.length });
  }

  /**
   * Calculate ownership rates across tournament
   */
  private calculateOwnershipRates(tournamentId: string): void {
    const allPicks = this.getAllPicksForTournament(tournamentId);
    const playerCounts: Record<string, number> = {};
    const totalDrafts = new Set(allPicks.map(p => p.draftId as string)).size || 1;

    // Count how many times each player was drafted
    allPicks.forEach(pick => {
      const playerId = pick.playerId as string;
      if (!playerCounts[playerId]) {
        playerCounts[playerId] = 0;
      }
      playerCounts[playerId]++;
    });

    // Update ownership rates
    allPicks.forEach(pick => {
      const playerId = pick.playerId as string;
      const ownership = (playerCounts[playerId]! / totalDrafts) * 100;
      const analytics = pick.analytics as Record<string, unknown>;
      analytics.ownership = Math.round(ownership * 10) / 10; // Round to 1 decimal
    });

    serverLogger.debug('Calculated ownership rates', { playersCount: Object.keys(playerCounts).length, draftsCount: totalDrafts });
  }

  /**
   * Calculate ADP differences
   */
  private calculateADPDifferences(draftId: string): void {
    const draft = this.activeDrafts.get(draftId);
    if (!draft) return;

    draft.picks.forEach((pick: Record<string, unknown>) => {
      const analytics = pick.analytics as Record<string, unknown> | undefined;
      if (analytics?.adp) {
        analytics.adpDiff = (pick.pick as number) - (analytics.adp as number);
      }
    });
  }

  /**
   * Flush pick buffer to database
   */
  private flushPickBuffer(): void {
    if (this.pickBuffer.length === 0) return;

    this.pickBuffer.forEach(pick => {
      TournamentDatabase.addPick(pick);
    });

    serverLogger.debug('Flushed picks to database', { count: this.pickBuffer.length });
    this.pickBuffer = [];
  }

  /**
   * Get default scoring system
   */
  private getDefaultScoring(): Record<string, unknown> {
    return {
      passing: {
        yards: 0.04,
        touchdowns: 4,
        interceptions: -2,
        twoPointConversions: 2
      },
      rushing: {
        yards: 0.1,
        touchdowns: 6,
        twoPointConversions: 2
      },
      receiving: {
        receptions: 0.5, // Half PPR
        yards: 0.1,
        touchdowns: 6,
        twoPointConversions: 2
      }
    };
  }

  /**
   * Utility functions
   */
  private generateId(): string {
    return `td_${  Date.now()  }_${  Math.random().toString(36).substr(2, 9)}`;
  }

  private findPicksByPlayer(playerId: string): Array<Record<string, unknown>> {
    // This would query the database in a real implementation
    return this.pickBuffer.filter(p => p.playerId === playerId);
  }

  private getAllPicksForTournament(tournamentId: string): Array<Record<string, unknown>> {
    // This would query the database in a real implementation
    return this.pickBuffer.filter(p => p.tournamentId === tournamentId);
  }

  private getDraft(draftId: string): Draft | null {
    // This would query the database in a real implementation
    return this.activeDrafts.get(draftId) || null;
  }

  /**
   * Export functions for historical analysis
   */
  exportTournamentData(tournamentId: string, format: string = 'json'): string {
     
    const tournament = TournamentDatabase.TOURNAMENT_DATABASE?.tournaments?.[tournamentId];
    const picks = this.getAllPicksForTournament(tournamentId);
    
    const exportData = {
      tournament,
      totalPicks: picks.length,
      totalDrafts: new Set(picks.map(p => p.draftId as string)).size,
      picks: picks
    };

    if (format === 'csv') {
      return this.convertToCSV(picks);
    }
    
    return JSON.stringify(exportData, null, 2);
  }

  private convertToCSV(picks: Array<Record<string, unknown>>): string {
    if (!picks.length) return '';
    
    const headers = [
      'draft_id', 'user_id', 'tournament_id', 'round', 'pick', 'player_name', 
      'position', 'team', 'timestamp', 'time_used', 'pick_source', 'adp', 
      'ownership', 'projected_points', 'actual_points'
    ];
    
    const rows = picks.map(pick => {
      const analytics = pick.analytics as Record<string, unknown>;
      return [
        pick.draftId,
        pick.userId,
        pick.tournamentId,
        pick.round,
        pick.pick,
        pick.playerName,
        pick.position,
        pick.team,
        pick.timestamp,
        pick.timeUsed,
        pick.pickSource,
        analytics.adp,
        analytics.ownership,
        analytics.projectedPoints,
        analytics.actualPoints
      ];
    });

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// Singleton instance for app-wide use
const tournamentCollector = new TournamentDataCollector();

export { TournamentDataCollector, tournamentCollector };

// CommonJS exports for backward compatibility
module.exports = {
  TournamentDataCollector,
  tournamentCollector
};
