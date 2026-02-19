#!/usr/bin/env node

/**
 * Remove Clay projections for all positions and replace with "xx"
 * This script removes Clay projections and sets proj to "xx" for all players
 */

import * as fs from 'fs';
import * as path from 'path';

interface PlayerData {
  name: string;
  position: string;
  clayProj?: number;
  clayRank?: number;
  clayGames?: number;
  clayProjections?: Record<string, unknown>;
  clayLastUpdated?: string;
  proj?: string;
}

interface PositionCount {
  [key: string]: number;
}

function replaceAllProjectionsWithXX(): void {
  console.log(
    '🔧 Removing Clay projections and replacing with "xx" for all positions...\n'
  );

  try {
    // Load current player pool
    const playerPoolPath: string = path.join(__dirname, '../lib/playerPool.js');
    const playerPoolContent: string = fs.readFileSync(playerPoolPath, 'utf8');

    // Extract the player pool array
    const playerPoolMatch: RegExpMatchArray | null = playerPoolContent.match(
      /export const PLAYER_POOL = (\[[\s\S]*?\]);/
    );
    if (!playerPoolMatch) {
      throw new Error('Could not find PLAYER_POOL export in playerPool.js');
    }

    const playerPool: PlayerData[] = eval(playerPoolMatch[1]!);
    console.log(`📊 Loaded ${playerPool.length} players from player pool`);

    // Count players by position before processing
    const positionCounts: PositionCount = {};
    playerPool.forEach((player) => {
      const pos: string = player.position;
      positionCounts[pos] = (positionCounts[pos] || 0) + 1;
    });

    console.log('📊 Players by position:');
    Object.entries(positionCounts).forEach(([pos, count]) => {
      console.log(`   ${pos}: ${count} players`);
    });

    // Replace projections for all players
    let modifiedCount = 0;
    const updatedPlayerPool: PlayerData[] = playerPool.map((player) => {
      // Create a new player object without Clay fields and with "xx" projection
      const {
        clayProj: _clayProj,
        clayRank: _clayRank,
        clayGames: _clayGames,
        clayProjections: _clayProjections,
        clayLastUpdated: _clayLastUpdated,
        proj: _proj,
        ...playerWithoutClay
      } = player;

      modifiedCount++;
      return {
        ...playerWithoutClay,
        proj: 'xx'
      };
    });

    console.log(`✅ Replaced projections with "xx" for ${modifiedCount} players`);

    // Create the updated file content
    const updatedContent = `/**
 * Updated Player Pool with Integrated Database Data
 *
 * This file contains all players with their projections, rankings, and statistics
 * from the integrated player database. All projections replaced with "xx".
 *
 * Generated: ${new Date().toISOString()}
 * Total Players: ${updatedPlayerPool.length}
 * Source: Integrated Player Database (DraftKings rankings only)
 */

export const PLAYER_POOL = ${JSON.stringify(updatedPlayerPool, null, 2)};
`;

    // Write the updated file
    fs.writeFileSync(playerPoolPath, updatedContent);
    console.log(`💾 Updated playerPool.js successfully`);

    // Summary
    console.log('\n📋 Summary:');
    console.log(`   Total players: ${updatedPlayerPool.length}`);
    console.log(`   Players processed: ${modifiedCount}`);
    console.log('\n✅ All projections successfully replaced with "xx"');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error replacing projections:', errorMessage);
    process.exit(1);
  }
}

// Run the script
replaceAllProjectionsWithXX();
