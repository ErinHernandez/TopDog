/**
 * Universal Export System
 * Provides data export capabilities for all users - whales, casuals, streamers
 */

const { tournamentCollector } = require('./tournamentDataCollector.js');
const { DataManager } = require('./dataManager.js');

class UniversalExportSystem {
  constructor() {
    this.exportFormats = ['json', 'csv', 'excel', 'txt'];
    this.exportTypes = ['draft', 'tournament', 'player', 'user', 'historical'];
  }

  /**
   * Export draft data - for anyone who participated
   */
  exportDraftData(draftId, userId, format = 'csv') {
    console.log(`📁 Exporting draft data for user ${userId}...`);
    
    try {
      // Get all picks from the draft
      const allPicks = this.getDraftPicks(draftId);
      const userPicks = allPicks.filter(pick => pick.userId === userId);
      
      const exportData = {
        metadata: {
          draftId,
          userId,
          exportDate: new Date().toISOString(),
          totalPicks: userPicks.length,
          draftFormat: 'Best Ball'
        },
        userPicks: userPicks.map(pick => ({
          round: pick.round,
          pick: pick.pick,
          player: pick.playerName,
          position: pick.position,
          team: pick.team,
          timeUsed: pick.timeUsed,
          adp: pick.analytics?.adp,
          projectedPoints: pick.analytics?.projectedPoints,
          actualPoints: pick.analytics?.actualPoints || 'UNKNOWN'
        })),
        draftSummary: this.generateDraftSummary(userPicks),
        positionBreakdown: this.generatePositionBreakdown(userPicks)
      };

      return this.formatExport(exportData, format);
    } catch (error) {
      console.error('❌ Export error:', error);
      return null;
    }
  }

  /**
   * Export tournament data - for participants and researchers
   */
  exportTournamentData(tournamentId, format = 'csv', options = {}) {
    console.log(`📊 Exporting tournament data...`);
    
    try {
      const tournament = this.getTournament(tournamentId);
      const allPicks = this.getTournamentPicks(tournamentId);
      
      const exportData = {
        metadata: {
          tournamentId,
          tournamentName: tournament?.name || 'TopDog Tournament',
          exportDate: new Date().toISOString(),
          totalPicks: allPicks.length,
          totalDrafts: new Set(allPicks.map(p => p.draftId)).size,
          season: tournament?.season || 2025
        },
        picks: allPicks.map(pick => ({
          draftId: pick.draftId,
          userId: pick.userId,
          round: pick.round,
          overallPick: pick.pick,
          player: pick.playerName,
          position: pick.position,
          team: pick.team,
          timestamp: pick.timestamp,
          timeUsed: pick.timeUsed,
          pickSource: pick.pickSource,
          adp: pick.analytics?.adp,
          ownership: pick.analytics?.ownership,
          projectedPoints: pick.analytics?.projectedPoints,
          actualPoints: pick.analytics?.actualPoints || 'UNKNOWN'
        })),
        analytics: this.generateTournamentAnalytics(allPicks),
        popularPlayers: this.getPopularPlayers(allPicks),
        positionTrends: this.getPositionTrends(allPicks)
      };

      // Apply privacy filters if needed
      if (options.anonymize) {
        exportData.picks = exportData.picks.map(pick => ({
          ...pick,
          userId: `User_${this.hashUserId(pick.userId)}`
        }));
      }

      return this.formatExport(exportData, format);
    } catch (error) {
      console.error('❌ Tournament export error:', error);
      return null;
    }
  }

  /**
   * Export player performance data
   */
  exportPlayerData(playerId, format = 'csv') {
    console.log(`👤 Exporting player data for ${playerId}...`);
    
    try {
      // Get all picks of this player across all tournaments
      const playerPicks = this.getPlayerPicks(playerId);
      
      const exportData = {
        metadata: {
          playerId,
          playerName: playerPicks[0]?.playerName || 'Unknown',
          position: playerPicks[0]?.position,
          team: playerPicks[0]?.team,
          exportDate: new Date().toISOString(),
          totalDrafts: playerPicks.length
        },
        draftHistory: playerPicks.map(pick => ({
          tournamentId: pick.tournamentId,
          draftId: pick.draftId,
          round: pick.round,
          overallPick: pick.pick,
          timestamp: pick.timestamp,
          adp: pick.analytics?.adp,
          ownership: pick.analytics?.ownership,
          projectedPoints: pick.analytics?.projectedPoints,
          actualPoints: pick.analytics?.actualPoints
        })),
        analytics: {
          averageRound: this.calculateAverageRound(playerPicks),
          averageOwnership: this.calculateAverageOwnership(playerPicks),
          totalSeasonPoints: this.calculateTotalPoints(playerPicks),
          draftTrend: this.calculateDraftTrend(playerPicks)
        }
      };

      return this.formatExport(exportData, format);
    } catch (error) {
      console.error('❌ Player export error:', error);
      return null;
    }
  }

  /**
   * Export user draft history
   */
  exportUserHistory(userId, format = 'csv', timeframe = 'season') {
    console.log(`📈 Exporting user history for ${userId}...`);
    
    try {
      const userPicks = this.getUserPicks(userId, timeframe);
      const userDrafts = this.getUserDrafts(userId, timeframe);
      
      const exportData = {
        metadata: {
          userId,
          exportDate: new Date().toISOString(),
          timeframe,
          totalDrafts: userDrafts.length,
          totalPicks: userPicks.length
        },
        draftHistory: userDrafts.map(draft => ({
          tournamentId: draft.tournamentId,
          draftId: draft.draftId,
          draftDate: draft.timestamp,
          totalPicks: draft.picks.length,
          averagePickTime: draft.averagePickTime,
          timeouts: draft.timeouts,
          autodrafts: draft.autodrafts,
          finalRank: draft.finalRank || 'UNKNOWN',
          totalPoints: draft.totalPoints || 'UNKNOWN'
        })),
        pickTendencies: this.calculatePickTendencies(userPicks),
        favoritePositions: this.getFavoritePositions(userPicks),
        performanceMetrics: this.calculateUserPerformance(userDrafts)
      };

      return this.formatExport(exportData, format);
    } catch (error) {
      console.error('❌ User history export error:', error);
      return null;
    }
  }

  /**
   * Format export based on requested format
   */
  formatExport(data, format) {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(data, null, 2);
      
      case 'csv':
        return this.convertToCSV(data);
      
      case 'txt':
        return this.convertToText(data);
      
      case 'excel':
        return this.convertToExcel(data);
      
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Convert data to CSV format
   */
  convertToCSV(data) {
    if (!data.picks && !data.userPicks && !data.draftHistory) {
      return 'No data available for CSV export';
    }

    // Determine the main data array
    let mainData = data.picks || data.userPicks || data.draftHistory;
    if (!Array.isArray(mainData) || mainData.length === 0) {
      return 'No records found for export';
    }

    // Get headers from first record
    const headers = Object.keys(mainData[0]);
    
    // Create CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...mainData.map(record => 
        headers.map(header => {
          const value = record[header];
          // Escape commas and quotes in values
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  /**
   * Convert data to readable text format
   */
  convertToText(data) {
    let output = [];
    
    // Add metadata
    if (data.metadata) {
      output.push('='.repeat(50));
      output.push('EXPORT SUMMARY');
      output.push('='.repeat(50));
      Object.entries(data.metadata).forEach(([key, value]) => {
        output.push(`${key}: ${value}`);
      });
      output.push('');
    }

    // Add main data sections
    Object.entries(data).forEach(([section, content]) => {
      if (section === 'metadata') return;
      
      output.push('-'.repeat(30));
      output.push(section.toUpperCase());
      output.push('-'.repeat(30));
      
      if (Array.isArray(content)) {
        content.forEach((item, index) => {
          output.push(`${index + 1}. ${JSON.stringify(item, null, 2)}`);
        });
      } else if (typeof content === 'object') {
        Object.entries(content).forEach(([key, value]) => {
          output.push(`${key}: ${value}`);
        });
      } else {
        output.push(String(content));
      }
      output.push('');
    });

    return output.join('\n');
  }

  /**
   * Utility functions for data processing
   */
  generateDraftSummary(picks) {
    const positions = {};
    picks.forEach(pick => {
      positions[pick.position] = (positions[pick.position] || 0) + 1;
    });
    
    return {
      totalPicks: picks.length,
      positionCounts: positions,
      averagePickTime: picks.filter(p => p.timeUsed)
        .reduce((sum, p) => sum + p.timeUsed, 0) / picks.filter(p => p.timeUsed).length || 0
    };
  }

  generatePositionBreakdown(picks) {
    const breakdown = {};
    picks.forEach(pick => {
      if (!breakdown[pick.position]) {
        breakdown[pick.position] = [];
      }
      breakdown[pick.position].push({
        round: pick.round,
        player: pick.player,
        adp: pick.adp
      });
    });
    return breakdown;
  }

  // Placeholder methods for data retrieval (would integrate with actual database)
  getDraftPicks(draftId) { return []; }
  getTournament(tournamentId) { return null; }
  getTournamentPicks(tournamentId) { return []; }
  getPlayerPicks(playerId) { return []; }
  getUserPicks(userId, timeframe) { return []; }
  getUserDrafts(userId, timeframe) { return []; }
  
  // Analytics placeholder methods
  generateTournamentAnalytics(picks) { return {}; }
  getPopularPlayers(picks) { return []; }
  getPositionTrends(picks) { return {}; }
  calculateAverageRound(picks) { return 0; }
  calculateAverageOwnership(picks) { return 0; }
  calculateTotalPoints(picks) { return 0; }
  calculateDraftTrend(picks) { return 'stable'; }
  calculatePickTendencies(picks) { return {}; }
  getFavoritePositions(picks) { return {}; }
  calculateUserPerformance(drafts) { return {}; }
  
  hashUserId(userId) {
    // Simple hash for anonymization
    return userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0).toString(36);
  }
}

// Export types for different user needs
const EXPORT_PRESETS = {
  // For casual users - simple, clean data
  casual: {
    formats: ['csv', 'txt'],
    includes: ['picks', 'summary'],
    anonymize: false
  },
  
  // For whales - comprehensive data
  whale: {
    formats: ['json', 'csv', 'excel'],
    includes: ['picks', 'analytics', 'trends', 'ownership'],
    anonymize: false
  },
  
  // For streamers - rich data for content creation
  streamer: {
    formats: ['json', 'csv'],
    includes: ['picks', 'analytics', 'trends', 'popular_players'],
    anonymize: true // Respect user privacy
  },
  
  // For researchers - comprehensive historical data
  researcher: {
    formats: ['json', 'csv'],
    includes: ['all'],
    anonymize: true
  }
};

const exportSystem = new UniversalExportSystem();

module.exports = {
  UniversalExportSystem,
  exportSystem,
  EXPORT_PRESETS
};