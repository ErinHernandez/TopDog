/**
 * CSV to Player Pool Converter
 * Converts CSV files to player pool format
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface PlayerPoolEntry {
  name: string;
  position: string;
  team: string;
  bye: number | null;
  adp: number | null;
}

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Convert CSV file to player pool format
 */
export function convertCsvToPlayerPool(csvPath?: string): PlayerPoolEntry[] {
  const defaultPath = path.join(__dirname, '../Best-Ball-2025---DK-Ranks-22.csv');
  const filePath = csvPath || defaultPath;

  const csv = fs.readFileSync(filePath, 'utf8');
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');

  const nameIdx = headers.indexOf('Name');
  const posIdx = headers.indexOf('Position');
  const teamIdx = headers.indexOf('Team');
  const byeIdx = headers.indexOf('Bye');
  const adpIdx = headers.indexOf('ADP');

  const players: PlayerPoolEntry[] = lines.slice(1).map(line => {
    const cols = line.split(',');
    return {
      name: cols[nameIdx] || '',
      position: cols[posIdx] || '',
      team: cols[teamIdx] || '',
      bye: cols[byeIdx] ? Number(cols[byeIdx]) : null,
      adp: cols[adpIdx] ? Number(cols[adpIdx]) : null,
    };
  });

  return players;
}

// ============================================================================
// SCRIPT EXECUTION
// ============================================================================

// If run directly, output the player pool
if (require.main === module) {
  const players = convertCsvToPlayerPool();
  console.log('export const PLAYER_POOL = ' + JSON.stringify(players, null, 2) + ';');
}

// CommonJS exports for backward compatibility
module.exports = { convertCsvToPlayerPool };
