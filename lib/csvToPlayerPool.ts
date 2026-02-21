/**
 * CSV to Player Pool Converter
 * Converts CSV files to player pool format
 */

import * as fs from 'fs';
import * as path from 'path';

import type { PlayerPoolEntry } from '@/types/player';

// ============================================================================
// TYPES
// ============================================================================

// Re-export type for backward compatibility
export type { PlayerPoolEntry } from '@/types/player';

// ============================================================================
// FUNCTIONS
// ============================================================================

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_CSV_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_ROWS = 10_000;
const REQUIRED_HEADERS = ['Name', 'Position', 'Team'] as const;
const VALID_POSITIONS = new Set(['QB', 'RB', 'WR', 'TE', 'K', 'DEF', 'DST', 'FLEX']);

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Convert CSV file to player pool format.
 * Validates file size, header structure, row limits, and field types.
 *
 * @throws {Error} If file is too large, missing required headers, or exceeds row limit
 */
export function convertCsvToPlayerPool(csvPath?: string): PlayerPoolEntry[] {
  const defaultPath = path.join(__dirname, '../Best-Ball-2025---DK-Ranks-22.csv');
  const filePath = csvPath || defaultPath;

  // Validate file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`[csvToPlayerPool] File not found: ${filePath}`);
  }

  // Validate file size before reading into memory
  const stat = fs.statSync(filePath);
  if (stat.size > MAX_CSV_SIZE_BYTES) {
    throw new Error(
      `[csvToPlayerPool] File too large: ${(stat.size / 1024 / 1024).toFixed(1)} MB exceeds ${MAX_CSV_SIZE_BYTES / 1024 / 1024} MB limit`,
    );
  }

  const csv = fs.readFileSync(filePath, 'utf8');
  const lines = csv.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('[csvToPlayerPool] CSV must have a header row and at least one data row');
  }

  // Validate headers
  const headers = lines[0]!.split(',').map(h => h.trim());
  const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    throw new Error(
      `[csvToPlayerPool] Missing required CSV headers: ${missingHeaders.join(', ')}. Found: ${headers.join(', ')}`,
    );
  }

  // Validate row count
  const dataLines = lines.slice(1).filter(line => line.trim().length > 0);
  if (dataLines.length > MAX_ROWS) {
    throw new Error(
      `[csvToPlayerPool] CSV exceeds ${MAX_ROWS} row limit (found ${dataLines.length} rows)`,
    );
  }

  const nameIdx = headers.indexOf('Name');
  const posIdx = headers.indexOf('Position');
  const teamIdx = headers.indexOf('Team');
  const byeIdx = headers.indexOf('Bye');
  const adpIdx = headers.indexOf('ADP');

  const players: PlayerPoolEntry[] = [];
  const skipped: string[] = [];

  for (const line of dataLines) {
    const cols = line.split(',').map(c => c.trim());
    const name = cols[nameIdx] || '';
    const position = cols[posIdx] || '';

    // Skip rows with empty name
    if (!name) {
      skipped.push(`Row skipped: empty name`);
      continue;
    }

    // Warn on unrecognized position but don't skip
    if (position && !VALID_POSITIONS.has(position.toUpperCase())) {
      skipped.push(`Warning: unrecognized position "${position}" for player "${name}"`);
    }

    const byeRaw = cols[byeIdx] || '';
    const adpRaw = cols[adpIdx] || '';
    const bye = byeRaw ? Number(byeRaw) : null;
    const adp = adpRaw ? Number(adpRaw) : null;

    players.push({
      name,
      position: position as PlayerPoolEntry['position'],
      team: cols[teamIdx] || '',
      bye: bye !== null && !isNaN(bye) ? bye : null,
      adp: adp !== null && !isNaN(adp) ? adp : null,
      proj: '',
    });
  }

  if (players.length === 0) {
    throw new Error('[csvToPlayerPool] No valid player rows found after parsing');
  }

  return players;
}

// ============================================================================
// SCRIPT EXECUTION
// ============================================================================

// If run directly via ts-node, output the player pool
// Usage: npx ts-node lib/csvToPlayerPool.ts
if (typeof require !== 'undefined' && require.main === module) {
  const players = convertCsvToPlayerPool();
  // eslint-disable-next-line no-console -- CLI script output
  console.info(`export const PLAYER_POOL = ${JSON.stringify(players, null, 2)};`);
}
