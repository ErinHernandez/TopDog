#!/usr/bin/env node

/**
 * Integrate all data sources: DraftKings, Underdog, and Clay projections
 */

import * as fs from 'fs';

interface PassingStats {
  attempts: number;
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

interface ProjectionData {
  ppr: number;
  halfPpr: number;
  passing?: PassingStats;
  rushing?: RushingStats;
  receiving?: ReceivingStats;
  games?: number;
}

interface ClayProjection {
  ppr: number;
  halfPpr: number;
}

interface Player {
  id: string | null;
  name: string;
  position: string;
  team: string;
  bye?: number | null;
  draftkings?: Record<string, unknown> | null;
  underdog?: Record<string, unknown> | null;
  projections?: {
    draftkings?: Record<string, unknown> | null;
    underdog?: Record<string, unknown> | null;
    clay?: ProjectionData;
  };
  historical?: Record<string, Record<string, unknown>>;
  draft?: {
    adp?: number | null;
    tier?: string | null;
    notes: string;
  };
  analytics?: {
    risk: string;
    upside: string;
    consistency: string;
  };
  risk?: {
    injury: string;
    competition: string;
    situation: string;
  };
}

interface DatabaseMeta {
  lastUpdated: string;
  source: string;
  version: string;
  totalPlayers: number;
  dataSources: {
    draftkings?: { players: number; rankings: number };
    underdog?: { players: number; tournaments: number };
    clay?: { players: number; projections: number };
  };
}

interface Database {
  meta: DatabaseMeta;
  players: {
    QB: Player[];
    RB: Player[];
    WR: Player[];
    TE: Player[];
  };
}

async function integrateAllSources(): Promise<void> {
  console.log('🔄 Integrating All Data Sources...\n');

  try {
    // Load existing database
    const databasePath: string = 'data/playerDatabase.json';
    let database: Database = {
      meta: {
        lastUpdated: new Date().toISOString(),
        source: "Multi-Source Integration (DraftKings + Underdog + Clay)",
        version: "2.0.0",
        totalPlayers: 0,
        dataSources: {
          draftkings: { players: 0, rankings: 0 },
          underdog: { players: 0, tournaments: 0 },
          clay: { players: 0, projections: 0 }
        }
      },
      players: {
        QB: [],
        RB: [],
        WR: [],
        TE: []
      }
    };

    if (fs.existsSync(databasePath)) {
      database = JSON.parse(fs.readFileSync(databasePath, 'utf8'));
      console.log('📊 Loaded existing database');
    }

    // Map to track unique players by name
    const playerMap: Map<string, Player> = new Map();

    // Load existing players into map
    Object.values(database.players).forEach((positionPlayers: Player[]) => {
      positionPlayers.forEach((player: Player) => {
        playerMap.set(player.name, player);
      });
    });

    console.log(`📈 Current database: ${playerMap.size} players`);

    // Integrate Clay projections if available
    console.log('\n📊 Integrating Clay Projections...');
    await integrateClayProjections(playerMap, database);

    // Convert map back to arrays and categorize by position
    database.players = { QB: [], RB: [], WR: [], TE: [] };

    for (const [playerName, player] of playerMap) {
      const position: string = player.position.toUpperCase();
      if (['QB', 'RB', 'WR', 'TE'].includes(position)) {
        database.players[position as keyof typeof database.players].push(player);
      }
    }

    // Update metadata
    Object.keys(database.players).forEach((pos: string) => {
      database.meta.totalPlayers += database.players[pos as keyof typeof database.players].length;
    });

    // Save the integrated database
    fs.writeFileSync(databasePath, JSON.stringify(database, null, 2));

    console.log(`\n✅ Integrated database saved to: ${databasePath}`);
    console.log(`📊 Total players: ${database.meta.totalPlayers}`);

    // Show summary
    console.log('\n📋 Position Breakdown:');
    Object.keys(database.players).forEach((pos: string) => {
      console.log(`   ${pos}: ${database.players[pos as keyof typeof database.players].length} players`);
    });

    console.log('\n🎯 Data Source Summary:');
    console.log(`   DraftKings: ${database.meta.dataSources.draftkings?.players || 0} players`);
    console.log(`   Underdog: ${database.meta.dataSources.underdog?.players || 0} players`);
    console.log(`   Clay: ${database.meta.dataSources.clay?.players || 0} players`);

    // Show sample integrated players
    console.log('\n📋 Sample Integrated Players:');
    let sampleCount: number = 0;
    Object.keys(database.players).forEach((pos: string) => {
      const players = database.players[pos as keyof typeof database.players];
      if (sampleCount < 3 && players.length > 0) {
        const player: Player = players[0];
        console.log(`${sampleCount + 1}. ${player.name} (${player.position}, ${player.team})`);
        console.log(`   DraftKings: Rank ${(player.draftkings as any)?.rank || 'N/A'}, ADP ${(player.draftkings as any)?.adp || 'N/A'}`);
        console.log(`   Underdog: ADP ${(player.underdog as any)?.adp || 'N/A'}, Points ${(player.underdog as any)?.points || 'N/A'}`);
        console.log(`   Clay: ${player.projections?.clay?.ppr || 'N/A'} PPR, ${player.projections?.clay?.halfPpr || 'N/A'} Half-PPR`);
        console.log('');
        sampleCount++;
      }
    });

    console.log('🎉 Integration complete! Your database now includes:');
    console.log('   ✅ DraftKings rankings and ADP');
    console.log('   ✅ Underdog fantasy data');
    console.log('   ✅ Clay ESPN projections');
    console.log('   ✅ Multiple scoring systems (PPR, Half-PPR)');
    console.log('   ✅ Comprehensive player stats');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`💥 Error integrating sources: ${errorMessage}`);
  }
}

async function integrateClayProjections(playerMap: Map<string, Player>, database: Database): Promise<void> {
  try {
    // Try to load Clay projections
    const clayFiles: string[] = [
      'clay_projections_2025_simple.json',
      'clay_projections_2025_final.json',
      'clay_projections_2025_parsed.json'
    ];

    let clayProjections: Array<{
      name: string;
      position: string;
      team?: string;
      fantasy: ClayProjection;
      passing?: PassingStats;
      rushing?: RushingStats;
      receiving?: ReceivingStats;
      games?: number;
    }> | null = null;

    for (const file of clayFiles) {
      if (fs.existsSync(file)) {
        clayProjections = JSON.parse(fs.readFileSync(file, 'utf8'));
        console.log(`   ✅ Loaded Clay projections from: ${file}`);
        break;
      }
    }

    if (!clayProjections || clayProjections.length === 0) {
      console.log('   ⚠️  No Clay projections found');
      return;
    }

    let integratedCount: number = 0;
    clayProjections.forEach((clayPlayer) => {
      if (clayPlayer.name && clayPlayer.position && clayPlayer.fantasy?.ppr > 0) {
        const playerName: string = clayPlayer.name;

        if (playerMap.has(playerName)) {
          // Update existing player with Clay data
          const player: Player | undefined = playerMap.get(playerName);
          if (player) {
            player.projections = player.projections || {};
            player.projections.clay = {
              ppr: clayPlayer.fantasy.ppr,
              halfPpr: clayPlayer.fantasy.halfPpr,
              passing: clayPlayer.passing,
              rushing: clayPlayer.rushing,
              receiving: clayPlayer.receiving,
              games: clayPlayer.games
            };
            integratedCount++;
          }
        } else {
          // Create new player from Clay data
          const newPlayer: Player = {
            id: null,
            name: playerName,
            position: clayPlayer.position,
            team: clayPlayer.team || 'UNKNOWN',
            bye: null,
            draftkings: null,
            underdog: null,
            projections: {
              draftkings: null,
              underdog: null,
              clay: {
                ppr: clayPlayer.fantasy.ppr,
                halfPpr: clayPlayer.fantasy.halfPpr,
                passing: clayPlayer.passing,
                rushing: clayPlayer.rushing,
                receiving: clayPlayer.receiving,
                games: clayPlayer.games
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

          playerMap.set(playerName, newPlayer);
          integratedCount++;
        }
      }
    });

    if (database.meta.dataSources.clay) {
      database.meta.dataSources.clay.players = integratedCount;
    }
    console.log(`   ✅ Integrated ${integratedCount} Clay projections`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`   ❌ Error integrating Clay projections: ${errorMessage}`);
  }
}

// Run integration
if (require.main === module) {
  integrateAllSources().catch(console.error);
}

export { integrateAllSources };
