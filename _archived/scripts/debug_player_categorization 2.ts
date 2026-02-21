#!/usr/bin/env node

/**
 * Debug player categorization from ESPN API
 */

import * as http from 'http';

interface Athlete {
  id: string;
  displayName: string;
  position?: {
    abbreviation?: string;
    name?: string;
  };
  team?: Record<string, unknown>;
}

interface HttpResponse {
  success: boolean;
  status: number;
  data?: unknown;
  error?: string;
}

async function debugPlayerCategorization(): Promise<void> {
  console.log('🔍 Debugging Player Categorization...\n');

  try {
    const statsResult: HttpResponse = await makeRequest('http://site.api.espn.com/apis/site/v2/sports/football/nfl/statistics');

    if (!statsResult.success) {
      throw new Error('Failed to fetch ESPN statistics');
    }

    const statsData = statsResult.data as any;
    const fantasyCategories = statsData.stats.categories.filter((cat: any) =>
      cat.name.includes('pass') || cat.name.includes('rush') || cat.name.includes('receiv')
    );

    console.log(`📊 Analyzing ${fantasyCategories.length} fantasy categories...\n`);

    const playerMap: Map<string, Athlete> = new Map();

    for (const category of fantasyCategories) {
      if (category.leaders && category.leaders.length > 0) {
        console.log(`📈 Category: ${category.name}`);

        for (const leader of category.leaders.slice(0, 3)) { // Show first 3 players
          const athlete: Athlete = leader.athlete;
          const playerId: string = athlete.id;

          if (!playerMap.has(playerId)) {
            playerMap.set(playerId, athlete);

            console.log(`   Player: ${athlete.displayName} (${playerId})`);
            console.log(`   Position: ${JSON.stringify(athlete.position)}`);
            console.log(`   Team: ${JSON.stringify(athlete.team)}`);
            console.log(`   Value: ${leader.displayValue}`);
            console.log('');
          }
        }
      }
    }

    console.log(`📊 Total unique players found: ${playerMap.size}`);

    // Analyze position data
    const positions: Map<string, string[]> = new Map();
    for (const [playerId, athlete] of playerMap) {
      const pos: string = athlete.position?.abbreviation || athlete.position?.name || 'UNKNOWN';
      if (!positions.has(pos)) {
        positions.set(pos, []);
      }
      const posPlayers = positions.get(pos);
      if (posPlayers) {
        posPlayers.push(athlete.displayName);
      }
    }

    console.log('\n📋 Position Analysis:');
    for (const [pos, players] of positions) {
      console.log(`   ${pos}: ${players.length} players`);
      if (players.length <= 3) {
        console.log(`      ${players.join(', ')}`);
      } else {
        console.log(`      ${players.slice(0, 3).join(', ')}... and ${players.length - 3} more`);
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`💥 Error: ${errorMessage}`);
  }
}

// Helper function to make HTTP requests
function makeRequest(url: string): Promise<HttpResponse> {
  return new Promise((resolve: (value: HttpResponse) => void) => {
    const req = http.get(url, (res) => {
      let data: string = '';

      res.on('data', (chunk: string) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            success: true,
            status: res.statusCode || 0,
            data: jsonData
          });
        } catch (error) {
          resolve({
            success: false,
            status: res.statusCode || 0,
            error: 'Invalid JSON response'
          });
        }
      });
    });

    req.on('error', (error: Error) => {
      resolve({
        success: false,
        status: 0,
        error: error.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        success: false,
        status: 0,
        error: 'Request timeout'
      });
    });
  });
}

// Run debug
if (require.main === module) {
  debugPlayerCategorization().catch(console.error);
}

export { debugPlayerCategorization };
