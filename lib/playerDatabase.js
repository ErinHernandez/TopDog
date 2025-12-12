/**
 * Comprehensive Player Database Structure
 * For storing projections, historical stats, and research data
 */

import { POSITIONS } from '../components/draft/v3/constants/positions';

// Main player database structure
const PLAYER_DATABASE = {
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

// Template for individual player data structure
const PLAYER_TEMPLATE = {
  // Basic Info
  id: null,
  name: '',
  position: '',
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

// Utility functions for working with player data
class PlayerDatabase {
  static addPlayer(playerData) {
    const position = playerData.position;
    if (!PLAYER_DATABASE.players[position]) {
      PLAYER_DATABASE.players[position] = [];
    }
    
    // Generate unique ID if not provided
    if (!playerData.id) {
      playerData.id = `${position}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    PLAYER_DATABASE.players[position].push(playerData);
    PLAYER_DATABASE.meta.lastUpdated = new Date().toISOString();
  }
  
  static findPlayer(name, position = null) {
    if (position) {
      return PLAYER_DATABASE.players[position]?.find(p => p.name === name);
    }
    
    // Search all positions
    for (const pos of POSITIONS) {
      const player = PLAYER_DATABASE.players[pos]?.find(p => p.name === name);
      if (player) return player;
    }
    return null;
  }
  
  static updatePlayer(name, position, updates) {
    const player = this.findPlayer(name, position);
    if (player) {
      Object.assign(player, updates);
      PLAYER_DATABASE.meta.lastUpdated = new Date().toISOString();
      return true;
    }
    return false;
  }
  
  static getAllPlayers() {
    const allPlayers = [];
    for (const position of POSITIONS) {
      allPlayers.push(...(PLAYER_DATABASE.players[position] || []));
    }
    return allPlayers;
  }
  
  static getPlayersByPosition(position) {
    return PLAYER_DATABASE.players[position] || [];
  }
  
  static sortByProjection(position, source = 'mikeClay') {
    const players = this.getPlayersByPosition(position);
    return players
      .filter(p => p.projections[source]?.fantasyPoints > 0)
      .sort((a, b) => b.projections[source].fantasyPoints - a.projections[source].fantasyPoints);
  }
  
  static exportToJSON() {
    return JSON.stringify(PLAYER_DATABASE, null, 2);
  }
  
  static importFromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      Object.assign(PLAYER_DATABASE, data);
      return true;
    } catch (error) {
      console.error('Error importing player database:', error);
      return false;
    }
  }
}

// CommonJS exports
module.exports = {
  PLAYER_DATABASE,
  PLAYER_TEMPLATE,
  PlayerDatabase
};