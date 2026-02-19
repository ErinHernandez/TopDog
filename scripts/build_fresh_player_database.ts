#!/usr/bin/env node

/**
 * Build fresh player database from ESPN API data
 */

import * as http from 'http';
import * as fs from 'fs';

interface ESPNStats {
  passingYards: number;
  passingTDs: number;
  passingINTs: number;
  rushingYards: number;
  rushingTDs: number;
  receivingYards: number;
  receivingTDs: number;
  receptions: number;
  targets: number;
  fantasyPoints: number;
}

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  bye: null;
  projections: {
    espn: ESPNStats;
  };
  historical: Record<string, Record<string, unknown>>;
  draft: {
    adp: null;
    tier: null;
    notes: string;
  };
  analytics: {
    risk: string;
    upside: string;
    consistency: string;
  };
  risk: {
    injury: string;
    competition: string;
    situation: string;
  };
}

interface Database {
  meta: {
    lastUpdated: string;
    source: string;
    version: string;
    totalPlayers: number;
  };
  players: {
    QB: Player[];
    RB: Player[];
    WR: Player[];
    TE: Player[];
  };
}

interface HttpResponse {
  success: boolean;
  status: number;
  data?: unknown;
  error?: string;
}

async function buildFreshPlayerDatabase(): Promise<void> {
  console.log('🏗️  Building Fresh Player Database from ESPN API...\n');

  try {
    // Initialize fresh database structure
    const freshDatabase: Database = {
      meta: {
        lastUpdated: new Date().toISOString(),
        source: "ESPN API - Fresh Start",
        version: "1.0.0",
        totalPlayers: 0
      },
      players: {
        QB: [],
        RB: [],
        WR: [],
        TE: []
      }
    };

    console.log('📡 Fetching ESPN preseason statistics...');
    const statsResult: HttpResponse = await makeRequest('http://site.api.espn.com/apis/site/v2/sports/football/nfl/statistics');

    if (!statsResult.success) {
      throw new Error('Failed to fetch ESPN statistics');
    }

    const statsData = statsResult.data as any;
    console.log(`✅ Fetched ${statsData.stats.categories.length} stat categories`);

    // Map of players by ID to avoid duplicates
    const playerMap: Map<string, Player> = new Map();

    // Process fantasy-relevant categories
    const fantasyCategories = statsData.stats.categories.filter((cat: any) =>
      cat.name.includes('pass') || cat.name.includes('rush') || cat.name.includes('receiv') ||
      cat.name.includes('touchdown') || cat.name.includes('attempt') || cat.name.includes('completion')
    );

    console.log(`📊 Processing ${fantasyCategories.length} fantasy-relevant categories...`);

    for (const category of fantasyCategories) {
      if (category.leaders && category.leaders.length > 0) {
        console.log(`   📈 Processing ${category.name}: ${category.leaders.length} leaders`);

        for (const leader of category.leaders) {
          const athlete = leader.athlete;
          const playerId: string = athlete.id;
          const value: number = parseFloat(leader.value) || 0;

          if (!playerMap.has(playerId)) {
            // Create new player entry
            const player: Player = {
              id: playerId,
              name: athlete.displayName,
              position: athlete.position?.abbreviation || 'UNK',
              team: 'UNKNOWN',
              bye: null,
              projections: {
                espn: {
                  passingYards: 0,
                  passingTDs: 0,
                  passingINTs: 0,
                  rushingYards: 0,
                  rushingTDs: 0,
                  receivingYards: 0,
                  receivingTDs: 0,
                  receptions: 0,
                  targets: 0,
                  fantasyPoints: 0
                }
              },
              historical: {
                2024: {},
                2023: {},
                2022: {}
              },
              draft: {
                adp: null,
                tier: null,
                notes: ''
              },
              analytics: {
                risk: 'medium',
                upside: 'medium',
                consistency: 'medium'
              },
              risk: {
                injury: 'medium',
                competition: 'medium',
                situation: 'medium'
              }
            };

            playerMap.set(playerId, player);
          }

          // Update player stats based on category
          const player: Player | undefined = playerMap.get(playerId);
          if (player) {
            updatePlayerStats(player, category.name, value);
          }
        }
      }
    }

    console.log(`\n📊 Found ${playerMap.size} unique players`);

    // Categorize players by position
    for (const [playerId, player] of playerMap) {
      const position: string = player.position.toUpperCase();
      if (['QB', 'RB', 'WR', 'TE'].includes(position)) {
        freshDatabase.players[position as keyof typeof freshDatabase.players].push(player);
      }
    }

    // Count players by position
    Object.keys(freshDatabase.players).forEach((pos: string) => {
      freshDatabase.meta.totalPlayers += freshDatabase.players[pos as keyof typeof freshDatabase.players].length;
      console.log(`   ${pos}: ${freshDatabase.players[pos as keyof typeof freshDatabase.players].length} players`);
    });

    // Save the fresh database
    const outputPath: string = 'data/playerDatabase.json';
    fs.writeFileSync(outputPath, JSON.stringify(freshDatabase, null, 2));

    console.log(`\n✅ Fresh player database saved to: ${outputPath}`);
    console.log(`📊 Total players: ${freshDatabase.meta.totalPlayers}`);

    // Show sample players
    console.log('\n📋 Sample Players:');
    Object.keys(freshDatabase.players).forEach((pos: string) => {
      const players = freshDatabase.players[pos as keyof typeof freshDatabase.players];
      if (players.length > 0) {
        const samplePlayer: Player = players[0]!;
        console.log(`   ${pos}: ${samplePlayer.name} (${samplePlayer.id})`);
        console.log(`      Stats: ${JSON.stringify(samplePlayer.projections.espn)}`);
      }
    });

    console.log('\n🎯 Fresh Database Summary:');
    console.log('   ✅ Built from ESPN preseason statistics');
    console.log('   ✅ Players categorized by position');
    console.log('   ✅ Basic stat projections included');
    console.log('   ✅ Ready for external projection integration');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`💥 Error building fresh database: ${errorMessage}`);
  }
}

function updatePlayerStats(player: Player, categoryName: string, value: number): void {
  const espn = player.projections.espn;

  switch (categoryName) {
    case 'passingYards':
      espn.passingYards = value;
      break;
    case 'passingTouchdowns':
      espn.passingTDs = value;
      break;
    case 'rushingYards':
      espn.rushingYards = value;
      break;
    case 'rushingTouchdowns':
      espn.rushingTDs = value;
      break;
    case 'receivingYards':
      espn.receivingYards = value;
      break;
    case 'receivingTouchdowns':
      espn.receivingTDs = value;
      break;
    case 'receptions':
      espn.receptions = value;
      break;
    case 'passingAttempts':
      // Could be used for completion percentage calculations
      break;
    case 'passingCompletions':
      // Could be used for completion percentage calculations
      break;
  }

  // Calculate basic fantasy points (simple formula)
  const fantasyPoints: number = calculateFantasyPoints(espn);
  espn.fantasyPoints = fantasyPoints;
}

function calculateFantasyPoints(stats: ESPNStats): number {
  // Simple fantasy points calculation (Half-PPR)
  const passingPoints: number = (stats.passingYards * 0.04) + (stats.passingTDs * 4) - (stats.passingINTs * 2);
  const rushingPoints: number = (stats.rushingYards * 0.1) + (stats.rushingTDs * 6);
  const receivingPoints: number = (stats.receivingYards * 0.1) + (stats.receivingTDs * 6) + (stats.receptions * 0.5);

  return Math.round((passingPoints + rushingPoints + receivingPoints) * 100) / 100;
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

// Run build
if (require.main === module) {
  buildFreshPlayerDatabase().catch(console.error);
}

export { buildFreshPlayerDatabase };
