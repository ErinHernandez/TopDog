/**
 * Draft Data Integration
 * Integrates tournament data collection with existing draft rooms
 */

const { tournamentCollector } = require('./tournamentDataCollector.js');

class DraftDataIntegration {
  constructor() {
    this.currentDraftData = null;
    this.draftStartTime = null;
    this.pickStartTime = null;
  }

  /**
   * Initialize data collection for a draft room
   */
  initializeDraftDataCollection(roomId, participants, tournamentId = null) {
    console.log('🏈 Initializing draft data collection...');
    
    // Create tournament if needed
    if (!tournamentId) {
      const tournament = tournamentCollector.initializeTournament({
        name: `TopDog Draft - ${roomId}`,
        season: 2025,
        format: 'bestball',
        entryFee: 25, // Default, should come from room settings
        openDate: new Date().toISOString()
      });
      tournamentId = tournament.id;
    }

    // Initialize the draft
    const draft = tournamentCollector.initializeDraft({
      id: roomId,
      tournamentId: tournamentId,
      roomNumber: 1,
      participants: participants.map(p => ({
        userId: p.id || p.userId,
        username: p.username || p.name,
        teamName: p.teamName || `${p.username}'s Team`
      }))
    });

    this.currentDraftData = {
      draftId: roomId,
      tournamentId: tournamentId,
      draft: draft,
      pickNumber: 1,
      round: 1
    };

    this.draftStartTime = Date.now();
    
    console.log(`✅ Draft data collection initialized for room ${roomId}`);
    return this.currentDraftData;
  }

  /**
   * Record a pick when it happens in the draft room
   */
  recordDraftPick(pickData) {
    if (!this.currentDraftData) {
      console.warn('⚠️ No draft data collection initialized');
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

    console.log(`📝 Recorded pick ${this.currentDraftData.pickNumber - 1}: ${pickData.playerName} by ${pickData.username}`);
    return recordedPick;
  }

  /**
   * Start timing for the next pick
   */
  startPickTimer(userId) {
    this.pickStartTime = Date.now();
    console.log(`⏱️ Pick timer started for user ${userId}`);
  }

  /**
   * Complete the draft and finalize data collection
   */
  completeDraft() {
    if (!this.currentDraftData) {
      console.warn('⚠️ No draft data to complete');
      return null;
    }

    const completed = tournamentCollector.completeDraft(this.currentDraftData.draftId);
    
    const draftDuration = Math.round((Date.now() - this.draftStartTime) / 1000);
    console.log(`✅ Draft completed in ${draftDuration} seconds`);
    
    // Reset state
    this.currentDraftData = null;
    this.draftStartTime = null;
    this.pickStartTime = null;
    
    return completed;
  }

  /**
   * Calculate remaining positions for leverage analysis
   */
  calculatePositionsRemaining() {
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
  getDraftStatus() {
    if (!this.currentDraftData) return null;
    
    return {
      draftId: this.currentDraftData.draftId,
      tournamentId: this.currentDraftData.tournamentId,
      currentPick: this.currentDraftData.pickNumber,
      currentRound: this.currentDraftData.round,
      participants: this.currentDraftData.draft.participants.length,
      picksRecorded: this.currentDraftData.draft.picks.length
    };
  }

  /**
   * Export draft data for analysis
   */
  exportCurrentDraft(format = 'json') {
    if (!this.currentDraftData) return null;
    
    return tournamentCollector.exportTournamentData(
      this.currentDraftData.tournamentId, 
      format
    );
  }

  /**
   * Update player performance after games (weekly job)
   */
  updateSeasonPerformance(playerPerformanceData) {
    playerPerformanceData.forEach(player => {
      tournamentCollector.updatePlayerPerformance(
        player.playerId,
        player.weeklyPoints,
        player.seasonTotal
      );
    });
    
    console.log(`📊 Updated performance for ${playerPerformanceData.length} players`);
  }
}

// Singleton instance
const draftDataCollector = new DraftDataIntegration();

module.exports = {
  DraftDataIntegration,
  draftDataCollector
};