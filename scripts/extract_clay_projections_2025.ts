#!/usr/bin/env node

/**
 * Extract and parse Mike Clay ESPN 2025 projections from PDF
 */

import * as fs from 'fs';
import pdf from 'pdf-parse';

interface PassingStats {
  attempts?: number;
  completions?: number;
  yards: number;
  tds: number;
  ints?: number;
  sacks?: number;
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
  position?: string;
  name?: string;
  team?: string;
  games?: number;
  passing?: PassingStats;
  rushing?: RushingStats;
  receiving?: ReceivingStats;
  fantasy?: FantasyStats;
}

async function extractClayProjections2025(): Promise<ClayProjection[]> {
  console.log('📊 Extracting Mike Clay ESPN 2025 Projections...\n');

  try {
    // Read the PDF file
    const dataBuffer: Buffer = fs.readFileSync('clay_projections_2025.pdf');
    console.log('📄 PDF loaded, extracting text...');

    // Parse PDF
    const data = await pdf(dataBuffer);
    const text: string = data.text;

    console.log(`📝 Extracted ${text.length} characters of text`);
    console.log(`📄 PDF has ${data.numpages} pages`);

    // Save raw text for inspection
    fs.writeFileSync('clay_projections_2025_raw.txt', text);
    console.log('💾 Raw text saved to: clay_projections_2025_raw.txt');

    // Parse the projections
    const projections: ClayProjection[] = parseClayProjections(text);

    // Save parsed projections
    const outputPath: string = 'clay_projections_2025.json';
    fs.writeFileSync(outputPath, JSON.stringify(projections, null, 2));

    console.log(`\n✅ Parsed projections saved to: ${outputPath}`);
    console.log(`📊 Total players parsed: ${projections.length}`);

    // Show sample projections
    console.log('\n📋 Sample Projections:');
    projections.slice(0, 10).forEach((player: ClayProjection, index: number) => {
      console.log(`${index + 1}. ${player.name} (${player.position}, ${player.team})`);
      console.log(`   Passing: ${player.passing?.attempts || 0} att, ${player.passing?.yards || 0} yds, ${player.passing?.tds || 0} TD, ${player.passing?.ints || 0} INT`);
      console.log(`   Rushing: ${player.rushing?.attempts || 0} att, ${player.rushing?.yards || 0} yds, ${player.rushing?.tds || 0} TD`);
      console.log(`   Receiving: ${player.receiving?.targets || 0} tgts, ${player.receiving?.receptions || 0} rec, ${player.receiving?.yards || 0} yds, ${player.receiving?.tds || 0} TD`);
      console.log(`   Fantasy: ${player.fantasy?.ppr || 0} PPR, ${player.fantasy?.halfPpr || 0} Half-PPR`);
      console.log('');
    });

    // Position breakdown
    const positionCounts: Record<string, number> = {};
    projections.forEach((player: ClayProjection) => {
      if (player.position) {
        positionCounts[player.position] = (positionCounts[player.position] || 0) + 1;
      }
    });

    console.log('📊 Position Breakdown:');
    Object.keys(positionCounts).forEach((pos: string) => {
      console.log(`   ${pos}: ${positionCounts[pos]} players`);
    });

    return projections;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`💥 Error extracting Clay projections: ${errorMessage}`);
    throw error;
  }
}

function parseClayProjections(text: string): ClayProjection[] {
  console.log('🔍 Parsing Clay projections from text...');

  const lines: string[] = text.split('\n');
  const projections: ClayProjection[] = [];
  let currentPosition: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line: string = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Check for position headers
    if (line.match(/^(QB|RB|WR|TE)\s*$/i)) {
      currentPosition = line.toUpperCase();
      console.log(`   Found position: ${currentPosition}`);
      continue;
    }

    // Skip header lines and totals
    if (line.includes('Player') || line.includes('Team') || line.includes('Total') || line.includes('GAMES')) {
      continue;
    }

    // Try to parse player line
    const player: ClayProjection | null = parsePlayerLine(line, currentPosition);
    if (player) {
      projections.push(player);
    }
  }

  console.log(`   Parsed ${projections.length} players`);
  return projections;
}

function parsePlayerLine(line: string, position: string | null): ClayProjection | null {
  // Split by multiple spaces to handle various formats
  const parts: string[] = line.split(/\s+/).filter((part: string) => part.trim());

  if (parts.length < 8) return null;

  try {
    // Try different parsing patterns based on position
    const player: ClayProjection = {
      position: position || undefined,
      fantasy: { ppr: 0, halfPpr: 0 }
    };

    if (position === 'QB') {
      // QB format: Name Team Games Pass_Att Pass_Yards Pass_TD Pass_INT Rush_Att Rush_Yards Rush_TD Fantasy_Points
      if (parts.length >= 10) {
        player.name = parts[0] + ' ' + parts[1];
        player.team = parts[2];
        player.games = parseInt(parts[3]) || 0;
        player.passing = {
          attempts: parseInt(parts[4]) || 0,
          yards: parseInt(parts[5]) || 0,
          tds: parseInt(parts[6]) || 0,
          ints: parseInt(parts[7]) || 0
        };
        player.rushing = {
          attempts: parseInt(parts[8]) || 0,
          yards: parseInt(parts[9]) || 0,
          tds: parseInt(parts[10]) || 0
        };
        player.fantasy = {
          ppr: parseFloat(parts[11]) || 0,
          halfPpr: parseFloat(parts[11]) || 0
        };
      }
    } else if (position === 'RB') {
      // RB format: Name Team Games Rush_Att Rush_Yards Rush_TD Targets Receptions Rec_Yards Rec_TD Fantasy_Points
      if (parts.length >= 11) {
        player.name = parts[0] + ' ' + parts[1];
        player.team = parts[2];
        player.games = parseInt(parts[3]) || 0;
        player.rushing = {
          attempts: parseInt(parts[4]) || 0,
          yards: parseInt(parts[5]) || 0,
          tds: parseInt(parts[6]) || 0
        };
        player.receiving = {
          targets: parseInt(parts[7]) || 0,
          receptions: parseInt(parts[8]) || 0,
          yards: parseInt(parts[9]) || 0,
          tds: parseInt(parts[10]) || 0
        };
        const pprVal: number = parseFloat(parts[11]) || 0;
        player.fantasy = {
          ppr: pprVal,
          halfPpr: pprVal - (player.receiving.receptions * 0.5) || 0
        };
      }
    } else if (position === 'WR' || position === 'TE') {
      // WR/TE format: Name Team Games Targets Receptions Rec_Yards Rec_TD Rush_Att Rush_Yards Rush_TD Fantasy_Points
      if (parts.length >= 11) {
        player.name = parts[0] + ' ' + parts[1];
        player.team = parts[2];
        player.games = parseInt(parts[3]) || 0;
        player.receiving = {
          targets: parseInt(parts[4]) || 0,
          receptions: parseInt(parts[5]) || 0,
          yards: parseInt(parts[6]) || 0,
          tds: parseInt(parts[7]) || 0
        };
        player.rushing = {
          attempts: parseInt(parts[8]) || 0,
          yards: parseInt(parts[9]) || 0,
          tds: parseInt(parts[10]) || 0
        };
        const pprVal: number = parseFloat(parts[11]) || 0;
        player.fantasy = {
          ppr: pprVal,
          halfPpr: pprVal - (player.receiving.receptions * 0.5) || 0
        };
      }
    }

    // Validate player data
    if (player.name && player.team && player.position) {
      return player;
    }

  } catch (error) {
    // Skip lines that can't be parsed
    return null;
  }

  return null;
}

// Run extraction
if (require.main === module) {
  extractClayProjections2025().catch(console.error);
}

export { extractClayProjections2025 };
