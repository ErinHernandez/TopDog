/**
 * Universal Export System
 * Provides data export capabilities for all users - whales, casuals, streamers
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports -- legacy modules pending ESM migration
const { DataManager: _DataManager } = require('./dataManager');
// eslint-disable-next-line @typescript-eslint/no-require-imports -- legacy modules pending ESM migration
const { tournamentCollector: _tournamentCollector } = require('./tournamentDataCollector');

// ============================================================================
// TYPES
// ============================================================================

export type ExportFormat = 'json' | 'csv' | 'excel' | 'txt';
export type ExportType = 'draft' | 'tournament' | 'player' | 'user' | 'historical';
export type Timeframe = 'season' | 'all' | 'month' | 'week';

export interface Pick {
  userId: string;
  draftId: string;
  tournamentId: string;
  round: number;
  pick: number;
  playerName: string;
  position: string;
  team: string;
  timestamp: string;
  timeUsed?: number | null;
  pickSource?: string;
  analytics?: {
    adp?: number | null;
    ownership?: number | null;
    projectedPoints?: number | null;
    actualPoints?: number | null;
  };
}

export interface Tournament {
  id: string;
  name?: string;
  season?: number;
}

export interface Draft {
  tournamentId: string;
  draftId: string;
  timestamp: string;
  picks: Pick[];
  averagePickTime?: number;
  timeouts?: number;
  autodrafts?: number;
  finalRank?: string | number;
  totalPoints?: string | number;
}

export interface ExportOptions {
  anonymize?: boolean;
  [key: string]: unknown;
}

export interface ExportPreset {
  formats: ExportFormat[];
  includes: string[];
  anonymize: boolean;
}

export interface DraftExportData {
  metadata: {
    draftId: string;
    userId: string;
    exportDate: string;
    totalPicks: number;
    draftFormat: string;
  };
  userPicks: Array<{
    round: number;
    pick: number;
    player: string;
    position: string;
    team: string;
    timeUsed?: number | null;
    adp?: number | null;
    projectedPoints?: number | null;
    actualPoints?: string | number | null;
  }>;
  draftSummary: {
    totalPicks: number;
    positionCounts: Record<string, number>;
    averagePickTime: number;
  };
  positionBreakdown: Record<
    string,
    Array<{
      round: number;
      player: string;
      adp?: number | null;
    }>
  >;
}

export interface TournamentExportData {
  metadata: {
    tournamentId: string;
    tournamentName: string;
    exportDate: string;
    totalPicks: number;
    totalDrafts: number;
    season: number;
  };
  picks: Array<{
    draftId: string;
    userId: string;
    round: number;
    overallPick: number;
    player: string;
    position: string;
    team: string;
    timestamp: string;
    timeUsed?: number | null;
    pickSource?: string;
    adp?: number | null;
    ownership?: number | null;
    projectedPoints?: number | null;
    actualPoints?: string | number | null;
  }>;
  analytics: Record<string, unknown>;
  popularPlayers: unknown[];
  positionTrends: Record<string, unknown>;
}

// ============================================================================
// CLASS
// ============================================================================

class UniversalExportSystem {
  private exportFormats: ExportFormat[];
  private exportTypes: ExportType[];

  constructor() {
    this.exportFormats = ['json', 'csv', 'excel', 'txt'];
    this.exportTypes = ['draft', 'tournament', 'player', 'user', 'historical'];
  }

  /**
   * Export draft data - for anyone who participated
   */
  exportDraftData(draftId: string, userId: string, format: ExportFormat = 'csv'): string | null {
    try {
      // Get all picks from the draft
      const allPicks = this.getDraftPicks(draftId);
      const userPicks = allPicks.filter(pick => pick.userId === userId);

      const exportData: DraftExportData = {
        metadata: {
          draftId,
          userId,
          exportDate: new Date().toISOString(),
          totalPicks: userPicks.length,
          draftFormat: 'Best Ball',
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
          actualPoints: pick.analytics?.actualPoints || 'UNKNOWN',
        })),
        draftSummary: this.generateDraftSummary(userPicks),
        positionBreakdown: this.generatePositionBreakdown(userPicks),
      };

      return this.formatExport(exportData as unknown as Record<string, unknown>, format);
    } catch {
      return null;
    }
  }

  /**
   * Export tournament data - for participants and researchers
   */
  exportTournamentData(
    tournamentId: string,
    format: ExportFormat = 'csv',
    options: ExportOptions = {},
  ): string | null {
    try {
      const tournament = this.getTournament(tournamentId);
      const allPicks = this.getTournamentPicks(tournamentId);

      const exportData: TournamentExportData = {
        metadata: {
          tournamentId,
          tournamentName: tournament?.name || 'TopDog Tournament',
          exportDate: new Date().toISOString(),
          totalPicks: allPicks.length,
          totalDrafts: new Set(allPicks.map(p => p.draftId)).size,
          season: tournament?.season || 2025,
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
          actualPoints: pick.analytics?.actualPoints || 'UNKNOWN',
        })),
        analytics: this.generateTournamentAnalytics(allPicks),
        popularPlayers: this.getPopularPlayers(allPicks),
        positionTrends: this.getPositionTrends(allPicks),
      };

      // Apply privacy filters if needed
      if (options.anonymize) {
        exportData.picks = exportData.picks.map(pick => ({
          ...pick,
          userId: `User_${this.hashUserId(pick.userId)}`,
        }));
      }

      return this.formatExport(exportData as unknown as Record<string, unknown>, format);
    } catch {
      return null;
    }
  }

  /**
   * Export player performance data
   */
  exportPlayerData(playerId: string, format: ExportFormat = 'csv'): string | null {
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
          totalDrafts: playerPicks.length,
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
          actualPoints: pick.analytics?.actualPoints,
        })),
        analytics: {
          averageRound: this.calculateAverageRound(playerPicks),
          averageOwnership: this.calculateAverageOwnership(playerPicks),
          totalSeasonPoints: this.calculateTotalPoints(playerPicks),
          draftTrend: this.calculateDraftTrend(playerPicks),
        },
      };

      return this.formatExport(exportData as unknown as Record<string, unknown>, format);
    } catch {
      return null;
    }
  }

  /**
   * Export user draft history
   */
  exportUserHistory(
    userId: string,
    format: ExportFormat = 'csv',
    timeframe: Timeframe = 'season',
  ): string | null {
    try {
      const userPicks = this.getUserPicks(userId, timeframe);
      const userDrafts = this.getUserDrafts(userId, timeframe);

      const exportData = {
        metadata: {
          userId,
          exportDate: new Date().toISOString(),
          timeframe,
          totalDrafts: userDrafts.length,
          totalPicks: userPicks.length,
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
          totalPoints: draft.totalPoints || 'UNKNOWN',
        })),
        pickTendencies: this.calculatePickTendencies(userPicks),
        favoritePositions: this.getFavoritePositions(userPicks),
        performanceMetrics: this.calculateUserPerformance(userDrafts),
      };

      return this.formatExport(exportData as unknown as Record<string, unknown>, format);
    } catch {
      return null;
    }
  }

  /**
   * Format export based on requested format
   */
  formatExport(data: Record<string, unknown>, format: ExportFormat): string {
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
  private convertToCSV(data: Record<string, unknown>): string {
    const picks = (data.picks || data.userPicks || data.draftHistory) as unknown[];
    if (!Array.isArray(picks) || picks.length === 0) {
      return 'No records found for export';
    }

    // Get headers from first record
    const headers = Object.keys(picks[0] as Record<string, unknown>);

    // Create CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...picks.map(record => {
        const rec = record as Record<string, unknown>;
        return headers
          .map(header => {
            const value = rec[header];
            // Escape commas and quotes in values
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
          })
          .join(',');
      }),
    ];

    return csvRows.join('\n');
  }

  /**
   * Convert data to readable text format
   */
  private convertToText(data: Record<string, unknown>): string {
    const output: string[] = [];

    // Add metadata
    if (data.metadata) {
      output.push('='.repeat(50));
      output.push('EXPORT SUMMARY');
      output.push('='.repeat(50));
      Object.entries(data.metadata as Record<string, unknown>).forEach(([key, value]) => {
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
      } else if (typeof content === 'object' && content !== null) {
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
   * Convert to Excel format (placeholder - would use library like xlsx)
   */
  private convertToExcel(data: Record<string, unknown>): string {
    // For now, return JSON as Excel would require additional library
    // In production, would use 'xlsx' library
    return JSON.stringify(data, null, 2);
  }

  /**
   * Utility functions for data processing
   */
  private generateDraftSummary(picks: Pick[]): {
    totalPicks: number;
    positionCounts: Record<string, number>;
    averagePickTime: number;
  } {
    const positions: Record<string, number> = {};
    picks.forEach(pick => {
      positions[pick.position] = (positions[pick.position] || 0) + 1;
    });

    const picksWithTime = picks.filter(p => p.timeUsed);
    const avgTime =
      picksWithTime.length > 0
        ? picksWithTime.reduce((sum, p) => sum + (p.timeUsed || 0), 0) / picksWithTime.length
        : 0;

    return {
      totalPicks: picks.length,
      positionCounts: positions,
      averagePickTime: avgTime,
    };
  }

  private generatePositionBreakdown(
    picks: Pick[],
  ): Record<string, Array<{ round: number; player: string; adp?: number | null }>> {
    const breakdown: Record<
      string,
      Array<{ round: number; player: string; adp?: number | null }>
    > = {};
    picks.forEach(pick => {
      if (!breakdown[pick.position]) {
        breakdown[pick.position] = [];
      }
      breakdown[pick.position]!.push({
        round: pick.round,
        player: pick.playerName,
        adp: pick.analytics?.adp,
      });
    });
    return breakdown;
  }

  // ==========================================================================
  // DATA RETRIEVAL — TODO: integrate with actual database layer
  // These methods throw NotImplementedError so callers know the feature is
  // not yet wired up, rather than silently receiving empty data.
  // ==========================================================================

  private getDraftPicks(draftId: string): Pick[] {
    throw new Error(
      `[ExportSystem] getDraftPicks not implemented — draftId: ${draftId}. Wire up Firestore/Prisma query.`,
    );
  }
  private getTournament(tournamentId: string): Tournament | null {
    throw new Error(
      `[ExportSystem] getTournament not implemented — tournamentId: ${tournamentId}. Wire up Firestore/Prisma query.`,
    );
  }
  private getTournamentPicks(tournamentId: string): Pick[] {
    throw new Error(
      `[ExportSystem] getTournamentPicks not implemented — tournamentId: ${tournamentId}. Wire up Firestore/Prisma query.`,
    );
  }
  private getPlayerPicks(playerId: string): Pick[] {
    throw new Error(
      `[ExportSystem] getPlayerPicks not implemented — playerId: ${playerId}. Wire up Firestore/Prisma query.`,
    );
  }
  private getUserPicks(userId: string, timeframe: Timeframe): Pick[] {
    throw new Error(
      `[ExportSystem] getUserPicks not implemented — userId: ${userId}, timeframe: ${timeframe}. Wire up Firestore/Prisma query.`,
    );
  }
  private getUserDrafts(userId: string, timeframe: Timeframe): Draft[] {
    throw new Error(
      `[ExportSystem] getUserDrafts not implemented — userId: ${userId}, timeframe: ${timeframe}. Wire up Firestore/Prisma query.`,
    );
  }

  // Analytics helpers — functional implementations using the Pick[] data
  private generateTournamentAnalytics(picks: Pick[]): Record<string, unknown> {
    if (picks.length === 0) return {};
    const uniqueDrafts = new Set(picks.map(p => p.draftId)).size;
    const uniquePlayers = new Set(picks.map(p => p.playerName)).size;
    return { totalPicks: picks.length, uniqueDrafts, uniquePlayers };
  }

  private getPopularPlayers(
    picks: Pick[],
  ): Array<{ playerName: string; count: number; ownership: number }> {
    const counts: Record<string, number> = {};
    picks.forEach(p => {
      counts[p.playerName] = (counts[p.playerName] || 0) + 1;
    });
    const totalDrafts = new Set(picks.map(p => p.draftId)).size || 1;
    return Object.entries(counts)
      .map(([playerName, count]) => ({
        playerName,
        count,
        ownership: Math.round((count / totalDrafts) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 25);
  }

  private getPositionTrends(picks: Pick[]): Record<string, number> {
    const trends: Record<string, number> = {};
    picks.forEach(p => {
      trends[p.position] = (trends[p.position] || 0) + 1;
    });
    return trends;
  }

  private calculateAverageRound(picks: Pick[]): number {
    if (picks.length === 0) return 0;
    return picks.reduce((sum, p) => sum + p.round, 0) / picks.length;
  }

  private calculateAverageOwnership(picks: Pick[]): number {
    const withOwnership = picks.filter(p => p.analytics?.ownership != null);
    if (withOwnership.length === 0) return 0;
    return (
      withOwnership.reduce((sum, p) => sum + (p.analytics?.ownership || 0), 0) /
      withOwnership.length
    );
  }

  private calculateTotalPoints(picks: Pick[]): number {
    return picks.reduce((sum, p) => {
      const pts = Number(p.analytics?.actualPoints) || 0;
      return sum + pts;
    }, 0);
  }

  private calculateDraftTrend(picks: Pick[]): string {
    if (picks.length < 2) return 'stable';
    const sorted = [...picks].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const firstHalfAvgRound =
      sorted.slice(0, Math.floor(sorted.length / 2)).reduce((s, p) => s + p.round, 0) /
      Math.floor(sorted.length / 2);
    const secondHalfAvgRound =
      sorted.slice(Math.floor(sorted.length / 2)).reduce((s, p) => s + p.round, 0) /
      (sorted.length - Math.floor(sorted.length / 2));
    if (secondHalfAvgRound < firstHalfAvgRound - 1) return 'rising';
    if (secondHalfAvgRound > firstHalfAvgRound + 1) return 'falling';
    return 'stable';
  }

  private calculatePickTendencies(picks: Pick[]): Record<string, unknown> {
    const positions = this.getPositionTrends(picks);
    const total = picks.length || 1;
    const percentages: Record<string, string> = {};
    Object.entries(positions).forEach(([pos, count]) => {
      percentages[pos] = `${Math.round((count / total) * 100)}%`;
    });
    return { positionDistribution: percentages, totalPicks: picks.length };
  }

  private getFavoritePositions(picks: Pick[]): Record<string, unknown> {
    return this.getPositionTrends(picks);
  }

  private calculateUserPerformance(drafts: Draft[]): Record<string, unknown> {
    if (drafts.length === 0) return {};
    const withPoints = drafts.filter(d => d.totalPoints != null);
    const avgPoints =
      withPoints.length > 0
        ? withPoints.reduce((s, d) => s + Number(d.totalPoints || 0), 0) / withPoints.length
        : 0;
    return {
      totalDrafts: drafts.length,
      averageTotalPoints: Math.round(avgPoints * 100) / 100,
      averageTimeouts: drafts.reduce((s, d) => s + (d.timeouts || 0), 0) / drafts.length,
    };
  }

  private hashUserId(userId: string): string {
    // Simple hash for anonymization
    return userId
      .split('')
      .reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0)
      .toString(36);
  }
}

// ============================================================================
// EXPORT PRESETS
// ============================================================================

// Export types for different user needs
export const EXPORT_PRESETS: Record<string, ExportPreset> = {
  // For casual users - simple, clean data
  casual: {
    formats: ['csv', 'txt'],
    includes: ['picks', 'summary'],
    anonymize: false,
  },

  // For whales - comprehensive data
  whale: {
    formats: ['json', 'csv', 'excel'],
    includes: ['picks', 'analytics', 'trends', 'ownership'],
    anonymize: false,
  },

  // For streamers - rich data for content creation
  streamer: {
    formats: ['json', 'csv'],
    includes: ['picks', 'analytics', 'trends', 'popular_players'],
    anonymize: true, // Respect user privacy
  },

  // For researchers - comprehensive historical data
  researcher: {
    formats: ['json', 'csv'],
    includes: ['all'],
    anonymize: true,
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

const exportSystem = new UniversalExportSystem();

export { UniversalExportSystem, exportSystem };
