#!/usr/bin/env node

/**
 * Parse Mike Clay ESPN 2025 projections from the extracted text
 */

import * as fs from 'fs';

interface PassingStats {
  attempts: number;
  completions: number;
  yards: number;
  tds: number;
  ints: number;
  sacks: number;
}

interface RushingStats {
  attempts: number;
  yards: number;
  tds: number;
}

interface ReceivingStats {
  targets: number;
  receptions: number;
  yards: number;
  tds: number;
}

interface FantasyStats {
  ppr: number;
  halfPpr: number;
}

interface ClayProjection {
  position: string;
  name?: string;
  team?: string;
  games?: number;
  passing?: PassingStats;
  rushing?: RushingStats;
  receiving?: ReceivingStats;
  fantasy: FantasyStats;
}

async function parseClayProjections2025(): Promise<ClayProjection[]> {
  console.log('📊 Parsing Mike Clay ESPN 2025 Projections...\n');

  try {
    // Read the raw text file
    const text: string = fs.readFileSync('clay_projections_2025_raw.txt', 'utf8');
    const lines: string[] = text.split('\n');

    console.log(`📝 Processing ${lines.length} lines of text...`);

    // Parse the projections
    const projections: ClayProjection[] = parseProjections(lines);

    // Save parsed projections
    const outputPath: string = 'clay_projections_2025_parsed.json';
    fs.writeFileSync(outputPath, JSON.stringify(projections, null, 2));

    console.log(`\n✅ Parsed projections saved to: ${outputPath}`);
    console.log(`📊 Total players parsed: ${projections.length}`);

    // Show sample projections
    console.log('\n📋 Sample Projections:');
    projections.slice(0, 10).forEach((player: ClayProjection, index: number) => {
      console.log(`${index + 1}. ${player.name ?? 'Unknown'} (${player.position}, ${player.team ?? 'Unknown'})`);
      if (player.passing) {
        console.log(`   Passing: ${player.passing.attempts} att, ${player.passing.yards} yds, ${player.passing.tds} TD, ${player.passing.ints} INT`);
      }
      if (player.rushing) {
        console.log(`   Rushing: ${player.rushing.attempts} att, ${player.rushing.yards} yds, ${player.rushing.tds} TD`);
      }
      if (player.receiving) {
        console.log(`   Receiving: ${player.receiving.targets} tgts, ${player.receiving.receptions} rec, ${player.receiving.yards} yds, ${player.receiving.tds} TD`);
      }
      console.log(`   Fantasy: ${player.fantasy.ppr} PPR, ${player.fantasy.halfPpr} Half-PPR`);
      console.log('');
    });

    // Position breakdown
    const positionCounts: Record<string, number> = {};
    projections.forEach((player: ClayProjection) => {
      positionCounts[player.position] = (positionCounts[player.position] || 0) + 1;
    });

    console.log('📊 Position Breakdown:');
    Object.keys(positionCounts).forEach((pos: string) => {
      console.log(`   ${pos}: ${positionCounts[pos]} players`);
    });

    return projections;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`💥 Error parsing Clay projections: ${errorMessage}`);
    throw error;
  }
}

function parseProjections(lines: string[]): ClayProjection[] {
  const projections: ClayProjection[] = [];
  let currentPosition: string | null = null;
  let inPlayerSection: boolean = false;

  for (let i = 0; i < lines.length; i++) {
    const line: string = (lines[i]!).trim();

    // Skip empty lines
    if (!line) continue;

    // Check for position headers
    if (line.match(/^(QB|RB|WR|TE)\s*$/i)) {
      currentPosition = line.toUpperCase();
      inPlayerSection = true;
      console.log(`   Found position: ${currentPosition!}`);
      continue;
    }

    // Skip if not in player section or no position set
    if (!inPlayerSection || !currentPosition) continue;

    // Skip header lines and totals
    if (line.includes('PosPlayer') || line.includes('Total') || line.includes('GAMES') ||
        line.includes('TEAM STAT') || line.includes('OFFENSE') || line.includes('DEFENSE')) {
      continue;
    }

    // Try to parse player line
    const player: ClayProjection | null = parsePlayerLine(line, currentPosition!);
    if (player) {
      projections.push(player);
    }
  }

  console.log(`   Parsed ${projections.length} players`);
  return projections;
}

function parsePlayerLine(line: string, position: string): ClayProjection | null {
  // Split by multiple spaces to handle various formats
  const parts: string[] = line.split(/\s+/).filter((part: string) => part.trim());

  if (parts.length < 8) return null;

  try {
    const player: ClayProjection = {
      position: position,
      fantasy: { ppr: 0, halfPpr: 0 }
    };

    if (position === 'QB') {
      // QB format: Name Team Games Att Comp Yds TD INT Sk Att Yds TD Tgt Rec Yd TD Pts Rk
      if (parts.length >= 15) {
        // Handle multi-word names
        let nameIndex: number = 0;
        let teamIndex: number = 1;

        // Find the team (usually 3-letter abbreviation)
        for (let i = 1; i < Math.min(5, parts.length); i++) {
          if ((parts[i]!.length ?? 0) === 3 && /^[A-Z]{3}$/.test(parts[i]!)) {
            teamIndex = i;
            break;
          }
        }

        // Build name from parts before team
        player.name = parts.slice(0, teamIndex).join(' ');
        player.team = parts[teamIndex]!;
        player.games = parseInt(parts[teamIndex + 1]! ?? '0') || 0;

        const statsStart: number = teamIndex + 2;
        if (parts.length >= statsStart + 12) {
          player.passing = {
            attempts: parseInt(parts[statsStart]! ?? '0') || 0,
            completions: parseInt(parts[statsStart + 1]! ?? '0') || 0,
            yards: parseInt(parts[statsStart + 2]! ?? '0') || 0,
            tds: parseInt(parts[statsStart + 3]! ?? '0') || 0,
            ints: parseInt(parts[statsStart + 4]! ?? '0') || 0,
            sacks: parseInt(parts[statsStart + 5]! ?? '0') || 0
          };
          player.rushing = {
            attempts: parseInt(parts[statsStart + 6]! ?? '0') || 0,
            yards: parseInt(parts[statsStart + 7]! ?? '0') || 0,
            tds: parseInt(parts[statsStart + 8]! ?? '0') || 0
          };
          player.receiving = {
            targets: parseInt(parts[statsStart + 9]! ?? '0') || 0,
            receptions: parseInt(parts[statsStart + 10]! ?? '0') || 0,
            yards: parseInt(parts[statsStart + 11]! ?? '0') || 0,
            tds: parseInt(parts[statsStart + 12]! ?? '0') || 0
          };
          player.fantasy.ppr = parseFloat(parts[statsStart + 13]! ?? '0') || 0;
          player.fantasy.halfPpr = parseFloat(parts[statsStart + 13]! ?? '0') || 0; // QBs don't get PPR bonus
        }
      }
    } else if (position === 'RB') {
      // RB format: Name Team Games Att Yds TD Tgt Rec Yd TD Pts Rk
      if (parts.length >= 12) {
        // Handle multi-word names
        let nameIndex: number = 0;
        let teamIndex: number = 1;

        // Find the team (usually 3-letter abbreviation)
        for (let i = 1; i < Math.min(5, parts.length); i++) {
          if (parts[i]!.length === 3 && /^[A-Z]{3}$/.test(parts[i]!)) {
            teamIndex = i;
            break;
          }
        }

        player.name = parts.slice(0, teamIndex).join(' ');
        player.team = parts[teamIndex]!;
        player.games = parseInt(parts[teamIndex + 1]! ?? '0') || 0;

        const statsStart: number = teamIndex + 2;
        if (parts.length >= statsStart + 9) {
          player.rushing = {
            attempts: parseInt(parts[statsStart]! ?? '0') || 0,
            yards: parseInt(parts[statsStart + 1]! ?? '0') || 0,
            tds: parseInt(parts[statsStart + 2]! ?? '0') || 0
          };
          player.receiving = {
            targets: parseInt(parts[statsStart + 3]! ?? '0') || 0,
            receptions: parseInt(parts[statsStart + 4]! ?? '0') || 0,
            yards: parseInt(parts[statsStart + 5]! ?? '0') || 0,
            tds: parseInt(parts[statsStart + 6]! ?? '0') || 0
          };
          player.fantasy.ppr = parseFloat(parts[statsStart + 7]! ?? '0') || 0;
          player.fantasy.halfPpr = parseFloat(parts[statsStart + 7]! ?? '0') - (player.receiving.receptions * 0.5) || 0;
        }
      }
    } else if (position === 'WR' || position === 'TE') {
      // WR/TE format: Name Team Games Tgt Rec Yd TD Att Yds TD Pts Rk
      if (parts.length >= 12) {
        // Handle multi-word names
        let nameIndex: number = 0;
        let teamIndex: number = 1;

        // Find the team (usually 3-letter abbreviation)
        for (let i = 1; i < Math.min(5, parts.length); i++) {
          if ((parts[i]!.length ?? 0) === 3 && /^[A-Z]{3}$/.test(parts[i]! ?? '')) {
            teamIndex = i;
            break;
          }
        }

        player.name = parts.slice(0, teamIndex).join(' ');
        player.team = parts[teamIndex]!;
        player.games = parseInt(parts[teamIndex + 1]! ?? '0') || 0;

        const statsStart: number = teamIndex + 2;
        if (parts.length >= statsStart + 9) {
          player.receiving = {
            targets: parseInt(parts[statsStart]! ?? '0') || 0,
            receptions: parseInt(parts[statsStart + 1]! ?? '0') || 0,
            yards: parseInt(parts[statsStart + 2]! ?? '0') || 0,
            tds: parseInt(parts[statsStart + 3]! ?? '0') || 0
          };
          player.rushing = {
            attempts: parseInt(parts[statsStart + 4]! ?? '0') || 0,
            yards: parseInt(parts[statsStart + 5]! ?? '0') || 0,
            tds: parseInt(parts[statsStart + 6]! ?? '0') || 0
          };
          player.fantasy.ppr = parseFloat(parts[statsStart + 7]! ?? '0') || 0;
          player.fantasy.halfPpr = parseFloat(parts[statsStart + 7]! ?? '0') - (player.receiving.receptions * 0.5) || 0;
        }
      }
    }

    // Validate player data
    if (player.name && player.team && player.fantasy.ppr > 0) {
      return player;
    }

  } catch (error) {
    // Skip lines that can't be parsed
    return null;
  }

  return null;
}

// Run parsing
if (require.main === module) {
  parseClayProjections2025().catch(console.error);
}

export { parseClayProjections2025 };
