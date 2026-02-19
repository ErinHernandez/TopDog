/**
 * Draft Data Integration
 * Integrates tournament data collection with existing draft rooms
 */

 
import { createScopedLogger } from './clientLogger';

const { tournamentCollector } = require('./tournamentDataCollector.js');

const logger = createScopedLogger('[DraftDataIntegration]');

// ============================================================================
// TYPES
// ============================================================================

export interface Participant {
  id?: string;
  userId?: string;
  username?: string;
  name?: string;
  teamName?: string;
}

export interface PickDataInput {
  userId: string;
  username?: string;
  playerId?: string;
  playerName: string;
  position: string;
  team: string;
  wasTimeout?: boolean;
  wasAutodraft?: boolean;
  autodrafted?: boolean;
  fromQueue?: boolean;
  queued?: boolean;
  adp?: number | null;
  projectedPoints?: number | null;
}

export interface CurrentDraftData {
  draftId: string;
  tournamentId: string;
  draft: {
    participants: Array<{
      userId: string;
      username: string;
      teamName: string;
      draftPosition: number;
      isActive: boolean;
    }>;
    [key: string]: unknown;
  };
  pickNumber: number;
  round: number;
}

export interface DraftStatus {
  draftId: string;
  tournamentId: string;
  currentPick: number;
  currentRound: number;
  participants: number;
  picksRecorded: number;
}

export interface PlayerPerformanceData {
  playerId: string;
  weeklyPoints: number;
  seasonTotal: number;
}

// ============================================================================
// CLASS
// ============================================================================

class DraftDataIntegration {
  private currentDraftData: CurrentDraftData | null = null;
  private draftStartTime: number | null = null;
  private pickStartTime: number | null = null;

  /**
   * Initialize data collection for a draft room
   */
  initializeDraftDataCollection(
    roomId: string,
    participants: Participant[],
    tournamentId: string | null = null
  ): CurrentDraftData {
    logger.debug('Initializing draft data collection');
    
    // Create tournament if needed
    let finalTournamentId: string = tournamentId || '';
    if (!finalTournamentId) {
      const tournament = tournamentCollector.initializeTournament({
        name: `TopDog Draft - ${roomId}`,
        season: 2025,
        format: 'bestball',
        entryFee: 25, // Default, should come from room settings
        openDate: new Date().toISOString()
      });
      finalTournamentId = tournament.id || '';
    }
    
    if (!finalTournamentId) {
      throw new Error('Failed to create or retrieve tournament ID');
    }

    // Initialize the draft
    const draft = tournamentCollector.initializeDraft({
      id: roomId,
      tournamentId: finalTournamentId,
      roomNumber: 1,
      participants: participants.map(p => ({
        userId: p.id || p.userId || '',
        username: p.username || p.name || 'Unknown',
        teamName: p.teamName || `${p.username || p.name || 'User'}'s Team`
      }))
    });

    this.currentDraftData = {
      draftId: roomId,
      tournamentId: finalTournamentId,
      draft: draft,
      pickNumber: 1,
      round: 1
    };

    this.draftStartTime = Date.now();

    logger.debug('Draft data collection initialized', { roomId });
    return this.currentDraftData;
  }

  /**
   * Record a pick when it happens in the draft room
   */
  recordDraftPick(pickData: PickDataInput): Record<string, unknown> | null {
    if (!this.currentDraftData) {
      logger.warn('No draft data collection initialized');
      return null;
    }

    // Calculate timing
    const pickEndTime = Date.now();
    const timeUsed = this.pickStartTime ? 
      Math.round((pickEndTime - this.pickStartTime) / 1000) : null;

    // Determine pick source based on how it was made
    let pickSource = 'user';
    if (pickData.wasAutodraft || pickData.autodrafted) {
      pickSource = 'auto';
    } else if (pickData.fromQueue || pickData.queued) {
      pickSource = 'queue';
    }

    // Calculate round and overall pick
    const totalParticipants = this.currentDraftData.draft.participants.length;
    const round = Math.ceil(this.currentDraftData.pickNumber / totalParticipants);
    
    const recordedPick = tournamentCollector.recordPick({
      tournamentId: this.currentDraftData.tournamentId,
      draftId: this.currentDraftData.draftId,
      userId: pickData.userId,
      
      round: round,
      pick: this.currentDraftData.pickNumber,
      playerId: pickData.playerId || `player_${pickData.playerName?.replace(/\s+/g, '_')}`,
      playerName: pickData.playerName,
      position: pickData.position,
      team: pickData.team,
      
      timeUsed: timeUsed,
      wasTimeout: pickData.wasTimeout || false,
      wasAutodraft: pickData.wasAutodraft || pickData.autodrafted || false,
      pickSource: pickSource,
      
      adp: pickData.adp || null,
      projectedPoints: pickData.projectedPoints || null,
      positionsRemaining: this.calculatePositionsRemaining()
    });

    // Update counters
    this.currentDraftData.pickNumber++;
    this.currentDraftData.round = Math.ceil(this.currentDraftData.pickNumber / totalParticipants);

    // Reset pick timer for next pick
    this.pickStartTime = Date.now();

    logger.debug('Recorded pick', { pickNumber: this.currentDraftData.pickNumber - 1, playerName: pickData.playerName, username: pickData.username || 'Unknown' });
    return recordedPick;
  }

  /**
   * Start timing for the next pick
   */
  startPickTimer(userId: string): void {
    this.pickStartTime = Date.now();
    logger.debug('Pick timer started', { userId });
  }

  /**
   * Complete the draft and finalize data collection
   */
  completeDraft(): Record<string, unknown> | null {
    if (!this.currentDraftData) {
      logger.warn('No draft data to complete');
      return null;
    }

    const completed = tournamentCollector.completeDraft(this.currentDraftData.draftId);

    const draftDuration = Math.round((Date.now() - (this.draftStartTime || 0)) / 1000);
    logger.debug('Draft completed', { durationSeconds: draftDuration });
    
    // Reset state
    this.currentDraftData = null;
    this.draftStartTime = null;
    this.pickStartTime = null;
    
    return completed as Record<string, unknown> | null;
  }

  /**
   * Calculate remaining positions for leverage analysis
   */
  private calculatePositionsRemaining(): Record<string, number> {
    if (!this.currentDraftData) return {};
    
    const totalRounds = 18;
    const totalParticipants = this.currentDraftData.draft.participants.length;
    const currentRound = this.currentDraftData.round;
    
    // Simple calculation - could be more sophisticated
    const roundsRemaining = totalRounds - currentRound + 1;
    const picksRemaining = roundsRemaining * totalParticipants;
    
    return {
      QB: Math.max(0, picksRemaining * 0.11), // ~11% of remaining picks
      RB: Math.max(0, picksRemaining * 0.33), // ~33% of remaining picks  
      WR: Math.max(0, picksRemaining * 0.44), // ~44% of remaining picks
      TE: Math.max(0, picksRemaining * 0.11)  // ~11% of remaining picks
    };
  }

  /**
   * Get current draft status for debugging
   */
  getDraftStatus(): DraftStatus | null {
    if (!this.currentDraftData) return null;
    
    return {
      draftId: this.currentDraftData.draftId,
      tournamentId: this.currentDraftData.tournamentId,
      currentPick: this.currentDraftData.pickNumber,
      currentRound: this.currentDraftData.round,
      participants: this.currentDraftData.draft.participants.length,
      picksRecorded: (this.currentDraftData.draft.picks as unknown[]).length
    };
  }

  /**
   * Export draft data for analysis
   */
  exportCurrentDraft(format: string = 'json'): string | null {
    if (!this.currentDraftData) return null;
    
    return tournamentCollector.exportTournamentData(
      this.currentDraftData.tournamentId, 
      format
    );
  }

  /**
   * Update player performance after games (weekly job)
   */
  updateSeasonPerformance(playerPerformanceData: PlayerPerformanceData[]): void {
    playerPerformanceData.forEach(player => {
      tournamentCollector.updatePlayerPerformance(
        player.playerId,
        player.weeklyPoints,
        player.seasonTotal
      );
    });

    logger.debug('Updated performance for players', { count: playerPerformanceData.length });
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// Singleton instance
const draftDataCollector = new DraftDataIntegration();

export { DraftDataIntegration, draftDataCollector };

// CommonJS exports for backward compatibility
module.exports = {
  DraftDataIntegration,
  draftDataCollector
};
