/**
 * Clay Data Integrator
 * 
 * Integrates Clay projections data into the player database by processing
 * PDF pages, parsing player data, and managing data integration workflows.
 */

import { parsePlayerData, processMultipleRealClayPdfPages } from './realPdfProcessor';
import * as fs from 'fs/promises';

// ============================================================================
// TYPES
// ============================================================================

export interface ParsedPlayer {
  rank: number;
  name: string;
  position: string;
  team: string;
  passYards: number;
  passTDs: number;
  rushYards: number;
  rushTDs: number;
  recYards: number;
  recTDs: number;
  fantasyPoints: number;
}

export interface ProcessedPage {
  page: number;
  playerCount: number;
  players: ParsedPlayer[];
}

export interface PlayerSummary {
  totalPlayers: number;
  byPosition: {
    QB: number;
    RB: number;
    WR: number;
    TE: number;
  };
  topPlayers: Array<{
    rank: number;
    name: string;
    position: string;
    team: string;
    fantasyPoints: number;
  }>;
  averageFantasyPoints: {
    QB: number;
    RB: number;
    WR: number;
    TE: number;
  };
}

export interface IntegrationResult {
  totalPlayers: number;
  processedPages: ProcessedPage[];
  players: ParsedPlayer[];
  summary: PlayerSummary;
}

export interface DatabasePlayer {
  name: string;
  position: string;
  team: string;
  rank?: number;
  projections?: {
    passYards: number;
    passTDs: number;
    rushYards: number;
    rushTDs: number;
    recYards: number;
    recTDs: number;
    fantasyPoints: number;
  };
  [key: string]: unknown;
}

export interface FormattedPlayer {
  name: string;
  position: string;
  team: string;
  rank: number;
  projections: {
    passYards: number;
    passTDs: number;
    rushYards: number;
    rushTDs: number;
    recYards: number;
    recTDs: number;
    fantasyPoints: number;
  };
  source: string;
  lastUpdated: string;
}

export interface DatabaseComparison {
  newPlayers: ParsedPlayer[];
  updatedPlayers: Array<{
    existing: DatabasePlayer;
    clay: ParsedPlayer;
  }>;
  unchangedPlayers: ParsedPlayer[];
  missingPlayers: DatabasePlayer[];
}

export interface ExportData {
  metadata: {
    source: string;
    exportDate: string;
    totalPlayers: number;
  };
  players: FormattedPlayer[];
}

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Integrate Clay projections data into the player database
 */
export async function integrateClayProjections(
  pdfUrl: string,
  startPage: number = 1,
  endPage: number = 5
): Promise<IntegrationResult> {
  try {
    console.log('🏈 Starting Clay projections integration...');
    
    // Process multiple pages of the real Clay PDF
    const results = await processMultipleRealClayPdfPages(pdfUrl, startPage, endPage, 'read');
    
    const allPlayers: ParsedPlayer[] = [];
    const processedPages: ProcessedPage[] = [];
    
    // Parse player data from each page
    for (const pageResult of results) {
      if (pageResult.success && pageResult.result && 'text' in pageResult.result) {
        console.log(`📊 Parsing player data from page ${pageResult.page}...`);
        
        const players = parsePlayerData(pageResult.result.text);
        console.log(`✅ Found ${players.length} players on page ${pageResult.page}`);
        
        allPlayers.push(...players);
        processedPages.push({
          page: pageResult.page,
          playerCount: players.length,
          players: players
        });
      } else {
        const errorMessage = pageResult.error || 'Unknown error';
        console.warn(`⚠️ Page ${pageResult.page} failed: ${errorMessage}`);
      }
    }
    
    // Remove duplicates and sort by rank
    const uniquePlayers = removeDuplicatePlayers(allPlayers);
    
    console.log(`🎉 Integration complete! Found ${uniquePlayers.length} unique players across ${processedPages.length} pages`);
    
    return {
      totalPlayers: uniquePlayers.length,
      processedPages: processedPages,
      players: uniquePlayers,
      summary: generatePlayerSummary(uniquePlayers)
    };
    
  } catch (error) {
    console.error('Error integrating Clay projections:', error);
    throw error;
  }
}

/**
 * Remove duplicate players based on name and position
 */
export function removeDuplicatePlayers(players: ParsedPlayer[]): ParsedPlayer[] {
  const seen = new Set<string>();
  const unique: ParsedPlayer[] = [];
  
  for (const player of players) {
    const key = `${player.name}-${player.position}-${player.team}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(player);
    }
  }
  
  // Sort by rank
  return unique.sort((a, b) => a.rank - b.rank);
}

/**
 * Generate summary statistics
 */
export function generatePlayerSummary(players: ParsedPlayer[]): PlayerSummary {
  const summary: PlayerSummary = {
    totalPlayers: players.length,
    byPosition: {
      QB: players.filter(p => p.position === 'QB').length,
      RB: players.filter(p => p.position === 'RB').length,
      WR: players.filter(p => p.position === 'WR').length,
      TE: players.filter(p => p.position === 'TE').length
    },
    topPlayers: players.slice(0, 10).map(p => ({
      rank: p.rank,
      name: p.name,
      position: p.position,
      team: p.team,
      fantasyPoints: p.fantasyPoints
    })),
    averageFantasyPoints: {
      QB: calculateAverage(players.filter(p => p.position === 'QB'), 'fantasyPoints'),
      RB: calculateAverage(players.filter(p => p.position === 'RB'), 'fantasyPoints'),
      WR: calculateAverage(players.filter(p => p.position === 'WR'), 'fantasyPoints'),
      TE: calculateAverage(players.filter(p => p.position === 'TE'), 'fantasyPoints')
    }
  };
  
  return summary;
}

/**
 * Calculate average for a property
 */
export function calculateAverage(players: ParsedPlayer[], property: keyof ParsedPlayer): number {
  if (players.length === 0) return 0;
  const sum = players.reduce((acc, player) => {
    const value = player[property];
    return acc + (typeof value === 'number' ? value : 0);
  }, 0);
  return Math.round((sum / players.length) * 100) / 100;
}

/**
 * Format player data for database integration
 */
export function formatPlayerForDatabase(player: ParsedPlayer): FormattedPlayer {
  return {
    name: player.name,
    position: player.position,
    team: player.team,
    rank: player.rank,
    projections: {
      passYards: player.passYards || 0,
      passTDs: player.passTDs || 0,
      rushYards: player.rushYards || 0,
      rushTDs: player.rushTDs || 0,
      recYards: player.recYards || 0,
      recTDs: player.recTDs || 0,
      fantasyPoints: player.fantasyPoints
    },
    source: 'Clay Projections 2025',
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Export players to JSON file
 */
export async function exportPlayersToJson(
  players: ParsedPlayer[],
  filename: string = 'clay_projections_export.json'
): Promise<string> {
  try {
    const exportData: ExportData = {
      metadata: {
        source: 'ESPN Clay Projections 2025',
        exportDate: new Date().toISOString(),
        totalPlayers: players.length
      },
      players: players.map(formatPlayerForDatabase)
    };
    
    await fs.writeFile(filename, JSON.stringify(exportData, null, 2));
    console.log(`💾 Exported ${players.length} players to ${filename}`);
    
    return filename;
  } catch (error) {
    console.error('Error exporting players:', error);
    throw error;
  }
}

/**
 * Compare with existing player database
 */
export function compareWithExistingDatabase(
  clayPlayers: ParsedPlayer[],
  existingPlayers: DatabasePlayer[]
): DatabaseComparison {
  const comparison: DatabaseComparison = {
    newPlayers: [],
    updatedPlayers: [],
    unchangedPlayers: [],
    missingPlayers: []
  };
  
  for (const clayPlayer of clayPlayers) {
    const existingPlayer = existingPlayers.find(p => 
      p.name === clayPlayer.name && p.position === clayPlayer.position
    );
    
    if (!existingPlayer) {
      comparison.newPlayers.push(clayPlayer);
    } else {
      // Check if projections have changed
      const hasChanges = 
        existingPlayer.projections?.fantasyPoints !== clayPlayer.fantasyPoints ||
        existingPlayer.rank !== clayPlayer.rank;
      
      if (hasChanges) {
        comparison.updatedPlayers.push({
          existing: existingPlayer,
          clay: clayPlayer
        });
      } else {
        comparison.unchangedPlayers.push(clayPlayer);
      }
    }
  }
  
  // Find players in existing database not in Clay projections
  for (const existingPlayer of existingPlayers) {
    const inClay = clayPlayers.find(p => 
      p.name === existingPlayer.name && p.position === existingPlayer.position
    );
    
    if (!inClay) {
      comparison.missingPlayers.push(existingPlayer);
    }
  }
  
  return comparison;
}

// CommonJS exports for backward compatibility
module.exports = {
  integrateClayProjections,
  removeDuplicatePlayers,
  generatePlayerSummary,
  formatPlayerForDatabase,
  exportPlayersToJson,
  compareWithExistingDatabase
};
