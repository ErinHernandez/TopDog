/**
 * Data Manager for Player Database
 * Utilities for adding historical stats, ADP, rankings, etc.
 */

import * as fs from 'fs';
import * as path from 'path';

import { serverLogger } from './logger/serverLogger';

// ============================================================================
// TYPES
// ============================================================================

export type Position = 'QB' | 'RB' | 'WR' | 'TE';

export interface DatabaseMeta {
  lastUpdated: string;
  sources: {
    projections: string[];
    historical: string[];
    adp: string[];
    rankings: string[];
  };
  season: number;
}

export interface Player {
  name: string;
  position?: Position;
  team?: string;
  historical?: Record<string, {
    fantasyPoints?: number | null;
    games?: number | null;
    passing?: Record<string, unknown>;
    rushing?: Record<string, unknown>;
    receiving?: Record<string, unknown>;
  }>;
  draft?: {
    adp?: number | null;
    adpSource?: string;
    expertRankings?: {
      overall?: number | null;
      position?: number | null;
    };
  };
  projections?: {
    mikeClay?: {
      fantasyPoints?: number;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface Database {
  meta: DatabaseMeta;
  players: {
    QB: Player[];
    RB: Player[];
    WR: Player[];
    TE: Player[];
  };
}

export interface ImportResult {
  imported: number;
  errors: number;
  duplicateRanks: number[];
  validationErrors: string[];
}

export interface StatsReport {
  totalPlayers: number;
  byPosition: Record<Position, number>;
  dataCoverage: {
    projections: number;
    historical2024: number;
    historical2023: number;
    adp: number;
  };
}

export interface PlayerFilters {
  position?: Position;
  team?: string;
  minProjection?: number;
}

// ============================================================================
// CLASS
// ============================================================================

class DataManager {
  private databasePath: string;
  private database: Database | null = null;

  constructor(databasePath: string = '../data/playerDatabase.json') {
    this.databasePath = path.resolve(__dirname, databasePath);
    this.loadDatabase();
  }

  private loadDatabase(): void {
    try {
      if (fs.existsSync(this.databasePath)) {
        const rawData = fs.readFileSync(this.databasePath, 'utf8');
        this.database = JSON.parse(rawData) as Database;
        serverLogger.debug('Loaded database', { playerCount: this.getTotalPlayers() });
      } else {
        serverLogger.debug('Database not found, creating new one');
        this.database = this.createEmptyDatabase();
      }
    } catch (error) {
      serverLogger.error('Error loading database', error instanceof Error ? error : new Error(String(error)));
      this.database = this.createEmptyDatabase();
    }
  }

  private createEmptyDatabase(): Database {
    return {
      meta: {
        lastUpdated: new Date().toISOString(),
        sources: {
          projections: [],
          historical: [],
          adp: [],
          rankings: []
        },
        season: 2025
      },
      players: {
        QB: [],
        RB: [],
        WR: [],
        TE: []
      }
    };
  }

  /**
   * Save the database to disk with automatic backup.
   * Creates a timestamped backup before saving the updated database.
   *
   * @returns {boolean} True if save was successful, false otherwise
   * @throws Logs errors via serverLogger if save fails
   * @example
   * const success = dataManager.saveDatabase();
   * if (success) console.log('Database saved');
   */
  saveDatabase(): boolean {
    try {
      if (!this.database) {
        serverLogger.error('No database to save');
        return false;
      }

      // Update timestamp
      this.database.meta.lastUpdated = new Date().toISOString();

      // Create backup
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = this.databasePath.replace('.json', `_backup_${timestamp}.json`);

      if (fs.existsSync(this.databasePath)) {
        fs.copyFileSync(this.databasePath, backupPath);
      }

      // Save main database
      fs.writeFileSync(this.databasePath, JSON.stringify(this.database, null, 2));
      serverLogger.info('Database saved successfully', { backup: path.basename(backupPath) });

      return true;
    } catch (error) {
      serverLogger.error('Error saving database', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Find a player by name with fuzzy matching support.
   * First attempts exact match, then partial matches.
   * Optionally filters by position.
   *
   * @param {string} searchName - The player name to search for
   * @param {Position | null} [position=null] - Optional position filter (QB, RB, WR, TE)
   * @returns {Player | null} The matching player or null if not found
   * @example
   * const player = dataManager.findPlayer('Patrick Mahomes', 'QB');
   * const anyPos = dataManager.findPlayer('Tyreek Hill');
   */
  findPlayer(searchName: string, position: Position | null = null): Player | null {
    if (!this.database) return null;

    const normalizedSearch = searchName.toLowerCase().trim();
    
    const searchPositions: Position[] = position ? [position] : ['QB', 'RB', 'WR', 'TE'];
    
    for (const pos of searchPositions) {
      const players = this.database.players[pos] || [];
      
      // Exact match first
      let found = players.find(p => p.name.toLowerCase() === normalizedSearch);
      if (found) return found;
      
      // Partial match
      found = players.find(p => p.name.toLowerCase().includes(normalizedSearch));
      if (found) return found;
      
      // Last name match
      const searchLastName = normalizedSearch.split(' ').pop();
      if (searchLastName) {
        found = players.find(p => p.name.toLowerCase().includes(searchLastName));
        if (found) return found;
      }
    }
    
    return null;
  }

  // Add historical stats for a player
  addHistoricalStats(playerName: string, year: number | string, stats: Record<string, unknown>): boolean {
    if (!this.database) return false;

    const player = this.findPlayer(playerName);
    if (!player) {
      serverLogger.warn('Player not found for historical stats', null, { playerName });
      return false;
    }

    if (!player.historical) {
      player.historical = {};
    }

    const yearStr = String(year);
    if (!player.historical[yearStr]) {
      player.historical[yearStr] = {
        fantasyPoints: null,
        games: null,
        passing: {},
        rushing: {},
        receiving: {}
      };
    }

    // Merge stats
    Object.assign(player.historical[yearStr], stats);

    serverLogger.debug('Added historical stats', { year, playerName: player.name });
    return true;
  }

  // Add ADP data
  addADPData(playerName: string, adp: number, source: string = 'Unknown'): boolean {
    if (!this.database) return false;

    const player = this.findPlayer(playerName);
    if (!player) {
      serverLogger.warn('Player not found for ADP data', null, { playerName });
      return false;
    }

    if (!player.draft) {
      player.draft = {
        adp: null,
        adpSource: '',
        expertRankings: {
          overall: null,
          position: null
        }
      };
    }

    player.draft.adp = adp;
    player.draft.adpSource = source;

    serverLogger.debug('Added ADP data', { playerName: player.name, adp, source });
    return true;
  }

  // Batch import from CSV with validation
  importFromCSV(csvFilePath: string, dataType: 'historical' | 'adp' = 'historical', year: number = 2024): ImportResult {
    if (!this.database) {
      return { imported: 0, errors: 1, duplicateRanks: [], validationErrors: ['Database not loaded'] };
    }

    try {
      const csvData = fs.readFileSync(csvFilePath, 'utf8');
      const lines = csvData.split('\n').filter(line => line.trim());
      const headers = lines[0]!.split(',').map(h => h.trim());
      
      let imported = 0;
      let errors = 0;
      const duplicateRanks = new Set<number>();
      const usedRanks = new Set<number>();
      const validationErrors: string[] = [];

      serverLogger.info('Starting CSV import', { dataType, file: path.basename(csvFilePath), headers: headers.join(', ') });
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i]!.split(',').map(v => v.trim());
        const rowNum = i + 1;

        // Validate row completeness
        if (values.length < headers.length) {
          validationErrors.push(`Row ${rowNum}: Incomplete data (${values.length}/${headers.length} columns)`);
          errors++;
          continue;
        }

        const rowData: Record<string, string> = {};
        headers.forEach((header, idx) => {
          rowData[header] = values[idx]!;
        });

        const playerName = values[0];
        
        // Validate player name
        if (!playerName || playerName.trim() === '') {
          validationErrors.push(`Row ${rowNum}: Missing player name`);
          errors++;
          continue;
        }
        
        if (dataType === 'historical') {
          if (this.addHistoricalStats(playerName, year, rowData)) {
            imported++;
          } else {
            errors++;
          }
        } else if (dataType === 'adp') {
          const adp = parseFloat(values[1]!);
          
          // Validate ADP value
          if (isNaN(adp) || adp <= 0) {
            validationErrors.push(`Row ${rowNum}: Invalid ADP "${values[1]}" for ${playerName}`);
            errors++;
            continue;
          }
          
          // Check for duplicate ranks
          const rank = Math.round(adp);
          if (usedRanks.has(rank)) {
            duplicateRanks.add(rank);
            validationErrors.push(`Row ${rowNum}: Duplicate rank ${rank} for ${playerName}`);
          } else {
            usedRanks.add(rank);
          }
          
          const source = rowData.source || 'CSV Import';
          if (this.addADPData(playerName, adp, source)) {
            imported++;
          } else {
            errors++;
          }
        }
      }

      // Report validation issues
      if (validationErrors.length > 0) {
        serverLogger.warn('Validation errors found during import', null, {
          errorCount: validationErrors.length,
          sampleErrors: validationErrors.slice(0, 10)
        });
      }

      if (duplicateRanks.size > 0) {
        serverLogger.error('Data quality issue: duplicate ranks detected', undefined, {
          duplicateRanks: Array.from(duplicateRanks).join(', ')
        });
      }

      serverLogger.info('Import complete', { imported, errors, duplicateRanks: duplicateRanks.size });
      return { 
        imported, 
        errors, 
        duplicateRanks: Array.from(duplicateRanks),
        validationErrors 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      serverLogger.error('Error importing CSV', error instanceof Error ? error : new Error(errorMessage));
      return { imported: 0, errors: 1, duplicateRanks: [], validationErrors: [errorMessage] };
    }
  }

  // Generate stats report
  generateStatsReport(): StatsReport {
    if (!this.database) {
      return {
        totalPlayers: 0,
        byPosition: { QB: 0, RB: 0, WR: 0, TE: 0 },
        dataCoverage: {
          projections: 0,
          historical2024: 0,
          historical2023: 0,
          adp: 0
        }
      };
    }

    const report: StatsReport = {
      totalPlayers: this.getTotalPlayers(),
      byPosition: {
        QB: 0,
        RB: 0,
        WR: 0,
        TE: 0
      },
      dataCoverage: {
        projections: 0,
        historical2024: 0,
        historical2023: 0,
        adp: 0
      }
    };

    (['QB', 'RB', 'WR', 'TE'] as Position[]).forEach(pos => {
      const players = this.database!.players[pos] || [];
      report.byPosition[pos] = players.length;

      players.forEach(player => {
        if (player.projections?.mikeClay?.fantasyPoints && player.projections.mikeClay.fantasyPoints > 0) {
          report.dataCoverage.projections++;
        }
        if (player.historical?.['2024']?.fantasyPoints) {
          report.dataCoverage.historical2024++;
        }
        if (player.historical?.['2023']?.fantasyPoints) {
          report.dataCoverage.historical2023++;
        }
        if (player.draft?.adp) {
          report.dataCoverage.adp++;
        }
      });
    });

    return report;
  }

  getTotalPlayers(): number {
    if (!this.database) return 0;
    return Object.values(this.database.players).reduce((total, posPlayers) => 
      total + (posPlayers?.length || 0), 0);
  }

  // Utility to add team info to all players
  addTeamInfo(teamMappings: Record<string, string>): number {
    if (!this.database) return 0;

    let updated = 0;
    
    Object.keys(teamMappings).forEach(playerName => {
      const player = this.findPlayer(playerName);
      if (player) {
        player.team = teamMappings[playerName];
        updated++;
      }
    });

    serverLogger.debug('Updated team info', { playersUpdated: updated });
    return updated;
  }

  // Search and filter utilities
  getTopPlayers(position: Position, count: number = 10, sortBy: string = 'mikeClay'): Player[] {
    if (!this.database) return [];

    const players = this.database.players[position] || [];
    
    return players
      .filter(p => {
        const projection = p.projections?.[sortBy] as { fantasyPoints?: number } | undefined;
        return projection?.fantasyPoints && projection.fantasyPoints > 0;
      })
      .sort((a, b) => {
        const aProj = (a.projections?.[sortBy] as { fantasyPoints?: number } | undefined)?.fantasyPoints || 0;
        const bProj = (b.projections?.[sortBy] as { fantasyPoints?: number } | undefined)?.fantasyPoints || 0;
        return bProj - aProj;
      })
      .slice(0, count);
  }

  // Export filtered data
  exportPlayerData(filters: PlayerFilters = {}): Player[] {
    if (!this.database) return [];

    const allPlayers: Player[] = [];
    
    (['QB', 'RB', 'WR', 'TE'] as Position[]).forEach(pos => {
      const players = this.database!.players[pos] || [];
      players.forEach(player => {
        if (this.matchesFilters(player, filters)) {
          allPlayers.push(player);
        }
      });
    });

    return allPlayers;
  }

  private matchesFilters(player: Player, filters: PlayerFilters): boolean {
    if (filters.position && player.position !== filters.position) return false;
    if (filters.team && player.team !== filters.team) return false;
    if (filters.minProjection) {
      const projection = player.projections?.mikeClay?.fantasyPoints;
      if (!projection || projection < filters.minProjection) return false;
    }
    
    return true;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default DataManager;

// CommonJS exports for backward compatibility
module.exports = DataManager;
