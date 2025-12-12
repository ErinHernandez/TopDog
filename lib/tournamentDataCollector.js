/**
 * Tournament Data Collector
 * Captures pick-level data during live drafts for historical analysis
 * Based on Underdog's 24-field data model but optimized for TopDog
 */

const { TournamentDatabase } = require('./tournamentDatabase.js');

class TournamentDataCollector {
  constructor() {
    this.activeDrafts = new Map(); // Track ongoing drafts
    this.pickBuffer = []; // Buffer picks before batch writing
    this.batchSize = 100; // Write in batches of 100 picks
  }

  /**
   * Initialize a new tournament
   */
  initializeTournament(tournamentData) {
    const tournament = {
      id: tournamentData.id || this.generateId(),
      name: tournamentData.name,
      season: tournamentData.season || new Date().getFullYear(),
      format: tournamentData.format || 'bestball',
      
      structure: {
        entryFee: tournamentData.entryFee,
        maxEntries: tournamentData.maxEntries,
        prizePool: tournamentData.prizePool,
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
        seasonStart: tournamentData.seasonStart,
        seasonEnd: tournamentData.seasonEnd
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
    console.log(`✅ Tournament initialized: ${tournament.name} (${tournament.id})`);
    return tournament;
  }

  /**
   * Initialize a new draft room
   */
  initializeDraft(draftData) {
    const draft = {
      id: draftData.id || this.generateId(),
      tournamentId: draftData.tournamentId,
      roomNumber: draftData.roomNumber,
      
      participants: draftData.participants.map((p, idx) => ({
        userId: p.userId,
        username: p.username,
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
    
    console.log(`🏈 Draft room initialized: ${draft.id} with ${draft.participants.length} players`);
    return draft;
  }

  /**
   * Record a pick (core data collection function)
   */
  recordPick(pickData) {
    const pick = {
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
      if (!draft.analytics.positionByRound[pick.round]) {
        draft.analytics.positionByRound[pick.round] = {};
      }
      if (!draft.analytics.positionByRound[pick.round][pick.position]) {
        draft.analytics.positionByRound[pick.round][pick.position] = 0;
      }
      draft.analytics.positionByRound[pick.round][pick.position]++;
    }

    // Batch write if buffer is full
    if (this.pickBuffer.length >= this.batchSize) {
      this.flushPickBuffer();
    }

    console.log(`📝 Pick recorded: ${pick.playerName} (${pick.position}) - Round ${pick.round}, Pick ${pick.pick}`);
    return pick;
  }

  /**
   * Complete a draft and calculate final analytics
   */
  completeDraft(draftId) {
    const draft = this.activeDrafts.get(draftId);
    if (!draft) {
      console.error(`❌ Draft not found: ${draftId}`);
      return;
    }

    // Calculate final draft analytics
    draft.settings.endTime = new Date().toISOString();
    
    const startTime = new Date(draft.settings.startTime);
    const endTime = new Date(draft.settings.endTime);
    draft.analytics.totalTime = Math.round((endTime - startTime) / 1000); // seconds
    
    const validPicks = draft.picks.filter(p => p.timeUsed !== null);
    if (validPicks.length > 0) {
      draft.analytics.averagePickTime = validPicks.reduce((sum, p) => sum + p.timeUsed, 0) / validPicks.length;
    }

    // Calculate ownership rates across this tournament
    this.calculateOwnershipRates(draft.tournamentId);
    
    // Calculate ADP differences
    this.calculateADPDifferences(draftId);

    // Remove from active drafts
    this.activeDrafts.delete(draftId);
    
    // Flush any remaining picks
    this.flushPickBuffer();

    console.log(`✅ Draft completed: ${draftId} - ${draft.analytics.totalTime}s total, ${draft.analytics.averagePickTime?.toFixed(1)}s avg pick`);
    return draft;
  }

  /**
   * Update player performance during the season
   */
  updatePlayerPerformance(playerId, weeklyPoints, seasonTotal) {
    // Find all picks of this player and update their performance
    const picks = this.findPicksByPlayer(playerId);
    
    picks.forEach(pick => {
      pick.analytics.actualPoints = seasonTotal;
      // Could store weekly breakdown if needed
    });

    console.log(`📊 Updated performance for ${playerId}: ${seasonTotal} points across ${picks.length} picks`);
  }

  /**
   * Calculate ownership rates across tournament
   */
  calculateOwnershipRates(tournamentId) {
    const allPicks = this.getAllPicksForTournament(tournamentId);
    const playerCounts = {};
    const totalDrafts = new Set(allPicks.map(p => p.draftId)).size;

    // Count how many times each player was drafted
    allPicks.forEach(pick => {
      if (!playerCounts[pick.playerId]) {
        playerCounts[pick.playerId] = 0;
      }
      playerCounts[pick.playerId]++;
    });

    // Update ownership rates
    allPicks.forEach(pick => {
      const ownership = (playerCounts[pick.playerId] / totalDrafts) * 100;
      pick.analytics.ownership = Math.round(ownership * 10) / 10; // Round to 1 decimal
    });

    console.log(`📊 Calculated ownership rates for ${Object.keys(playerCounts).length} players across ${totalDrafts} drafts`);
  }

  /**
   * Calculate ADP differences
   */
  calculateADPDifferences(draftId) {
    const draft = this.activeDrafts.get(draftId) || this.getDraft(draftId);
    if (!draft) return;

    draft.picks.forEach(pick => {
      if (pick.analytics.adp) {
        pick.analytics.adpDiff = pick.pick - pick.analytics.adp;
      }
    });
  }

  /**
   * Flush pick buffer to database
   */
  flushPickBuffer() {
    if (this.pickBuffer.length === 0) return;

    this.pickBuffer.forEach(pick => {
      TournamentDatabase.addPick(pick);
    });

    console.log(`💾 Flushed ${this.pickBuffer.length} picks to database`);
    this.pickBuffer = [];
  }

  /**
   * Get default scoring system
   */
  getDefaultScoring() {
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
  generateId() {
    return 'td_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  findPicksByPlayer(playerId) {
    // This would query the database in a real implementation
    return this.pickBuffer.filter(p => p.playerId === playerId);
  }

  getAllPicksForTournament(tournamentId) {
    // This would query the database in a real implementation
    return this.pickBuffer.filter(p => p.tournamentId === tournamentId);
  }

  getDraft(draftId) {
    // This would query the database in a real implementation
    return null;
  }

  /**
   * Export functions for historical analysis
   */
  exportTournamentData(tournamentId, format = 'json') {
    const tournament = TournamentDatabase.TOURNAMENT_DATABASE?.tournaments?.[tournamentId];
    const picks = this.getAllPicksForTournament(tournamentId);
    
    const exportData = {
      tournament,
      totalPicks: picks.length,
      totalDrafts: new Set(picks.map(p => p.draftId)).size,
      picks: picks
    };

    if (format === 'csv') {
      return this.convertToCSV(picks);
    }
    
    return JSON.stringify(exportData, null, 2);
  }

  convertToCSV(picks) {
    if (!picks.length) return '';
    
    const headers = [
      'draft_id', 'user_id', 'tournament_id', 'round', 'pick', 'player_name', 
      'position', 'team', 'timestamp', 'time_used', 'pick_source', 'adp', 
      'ownership', 'projected_points', 'actual_points'
    ];
    
    const rows = picks.map(pick => [
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
      pick.analytics.adp,
      pick.analytics.ownership,
      pick.analytics.projectedPoints,
      pick.analytics.actualPoints
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// Singleton instance for app-wide use
const tournamentCollector = new TournamentDataCollector();

module.exports = {
  TournamentDataCollector,
  tournamentCollector
};