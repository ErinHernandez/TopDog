/**
 * Comprehensive Player Database Structure
 * For storing projections, historical stats, and research data
 */

import { POSITIONS } from './constants/positions';
import { serverLogger } from './logger/serverLogger';

// ============================================================================
// TYPES
// ============================================================================

export type Position = 'QB' | 'RB' | 'WR' | 'TE';

export interface ProjectionSource {
  fantasyPoints: number | null;
  positionRank: number | null;
  games: number;
  passing?: {
    attempts: number | null;
    completions: number | null;
    yards: number | null;
    touchdowns: number | null;
    interceptions: number | null;
    sacks: number | null;
  };
  rushing?: {
    attempts: number | null;
    yards: number | null;
    touchdowns: number | null;
  };
  receiving?: {
    targets: number | null;
    receptions: number | null;
    yards: number | null;
    touchdowns: number | null;
  };
}

export interface Projections {
  mikeClay: ProjectionSource;
  [key: string]: ProjectionSource;
}

export interface HistoricalSeason {
  fantasyPoints: number | null;
  games: number | null;
  passing?: Record<string, unknown>;
  rushing?: Record<string, unknown>;
  receiving?: Record<string, unknown>;
}

export interface Historical {
  [year: number]: HistoricalSeason;
}

export interface DraftData {
  adp: number | null;
  adpSource: string;
  expertRankings: {
    overall: number | null;
    position: number | null;
  };
}

export interface Analytics {
  consistency: number | null;
  ceiling: number | null;
  floor: number | null;
  snapShare: number | null;
  targetShare: number | null;
  redZoneTargets: number | null;
  goalLineCarries: number | null;
}

export interface Risk {
  injuryHistory: unknown[];
  ageRisk: number | null;
  situationRisk: number | null;
}

export interface PlayerData {
  id: string | null;
  name: string;
  position: Position;
  team: string;
  bye: number | null;
  projections: Projections;
  historical: Historical;
  draft: DraftData;
  analytics: Analytics;
  risk: Risk;
}

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

export interface PlayerDatabaseStructure {
  meta: DatabaseMeta;
  players: Record<Position, PlayerData[]>;
}

// ============================================================================
// DATA
// ============================================================================

/**
 * Main player database structure
 */
const PLAYER_DATABASE: PlayerDatabaseStructure = {
  // Meta information about the database
  meta: {
    lastUpdated: new Date().toISOString(),
    sources: {
      projections: ['Mike Clay ESPN 2025'],
      historical: [],
      adp: [],
      rankings: []
    },
    season: 2025
  },
  
  // Player data organized by position
  players: {
    QB: [],
    RB: [],
    WR: [],
    TE: []
  }
};

/**
 * Template for individual player data structure
 */
export const PLAYER_TEMPLATE: PlayerData = {
  // Basic Info
  id: null,
  name: '',
  position: 'QB',
  team: '',
  bye: null,
  
  // Current Season Projections (2025)
  projections: {
    mikeClay: {
      fantasyPoints: null,
      positionRank: null,
      games: 17,
      // Position-specific stats will be added dynamically
      passing: {
        attempts: null,
        completions: null,
        yards: null,
        touchdowns: null,
        interceptions: null,
        sacks: null
      },
      rushing: {
        attempts: null,
        yards: null,
        touchdowns: null
      },
      receiving: {
        targets: null,
        receptions: null,
        yards: null,
        touchdowns: null
      }
    }
    // Additional projection sources can be added here
    // fantasyPros: { ... },
    // underdog: { ... },
    // etc.
  },
  
  // Historical Statistics
  historical: {
    2024: {
      fantasyPoints: null,
      games: null,
      // Position-specific historical stats
      passing: {},
      rushing: {},
      receiving: {}
    },
    2023: {
      fantasyPoints: null,
      games: null,
      passing: {},
      rushing: {},
      receiving: {}
    },
    2022: {
      fantasyPoints: null,
      games: null,
      passing: {},
      rushing: {},
      receiving: {}
    }
    // Can extend to more years as needed
  },
  
  // Draft and Rankings Data
  draft: {
    adp: null,
    adpSource: '',
    expertRankings: {
      overall: null,
      position: null
    }
  },
  
  // Advanced Analytics (for future expansion)
  analytics: {
    consistency: null,
    ceiling: null,
    floor: null,
    snapShare: null,
    targetShare: null,
    redZoneTargets: null,
    goalLineCarries: null
  },
  
  // Injury/Risk Factors
  risk: {
    injuryHistory: [],
    ageRisk: null,
    situationRisk: null
  }
};

// ============================================================================
// CLASS
// ============================================================================

/**
 * Utility functions for working with player data
 */
class PlayerDatabase {
  static addPlayer(playerData: Partial<PlayerData> & { position: Position }): void {
    const position = playerData.position;
    if (!PLAYER_DATABASE.players[position]) {
      PLAYER_DATABASE.players[position] = [];
    }
    
    // Generate unique ID if not provided
    if (!playerData.id) {
      playerData.id = `${position}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    PLAYER_DATABASE.players[position].push(playerData as PlayerData);
    PLAYER_DATABASE.meta.lastUpdated = new Date().toISOString();
  }
  
  static findPlayer(name: string, position: Position | null = null): PlayerData | null {
    if (position) {
      return PLAYER_DATABASE.players[position]?.find(p => p.name === name) || null;
    }
    
    // Search all positions
    for (const pos of POSITIONS) {
      const player = PLAYER_DATABASE.players[pos as Position]?.find(p => p.name === name);
      if (player) return player;
    }
    return null;
  }
  
  static updatePlayer(name: string, position: Position | null, updates: Partial<PlayerData>): boolean {
    const player = this.findPlayer(name, position);
    if (player) {
      Object.assign(player, updates);
      PLAYER_DATABASE.meta.lastUpdated = new Date().toISOString();
      return true;
    }
    return false;
  }
  
  static getAllPlayers(): PlayerData[] {
    const allPlayers: PlayerData[] = [];
    for (const position of POSITIONS) {
      allPlayers.push(...(PLAYER_DATABASE.players[position as Position] || []));
    }
    return allPlayers;
  }
  
  static getPlayersByPosition(position: Position): PlayerData[] {
    return PLAYER_DATABASE.players[position] || [];
  }
  
  static sortByProjection(position: Position, source: string = 'mikeClay'): PlayerData[] {
    const players = this.getPlayersByPosition(position);
    return players
      .filter(p => (p.projections[source]?.fantasyPoints ?? 0) > 0)
      .sort((a, b) => {
        const aPoints = a.projections[source]?.fantasyPoints ?? 0;
        const bPoints = b.projections[source]?.fantasyPoints ?? 0;
        return bPoints - aPoints;
      });
  }
  
  static exportToJSON(): string {
    return JSON.stringify(PLAYER_DATABASE, null, 2);
  }
  
  static importFromJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString) as Partial<PlayerDatabaseStructure>;
      Object.assign(PLAYER_DATABASE, data);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      serverLogger.error('Error importing player database', error instanceof Error ? error : new Error(errorMessage));
      return false;
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { PLAYER_DATABASE, PlayerDatabase };

// CommonJS exports for backward compatibility
module.exports = {
  PLAYER_DATABASE,
  PLAYER_TEMPLATE,
  PlayerDatabase
};
