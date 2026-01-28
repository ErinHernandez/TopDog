#!/usr/bin/env node

/**
 * Extract and integrate Underdog Fantasy and DraftKings data
 */

import * as fs from 'fs';
import * as path from 'path';

interface DraftKingsData {
  rank: number | null;
  positionRank: string | null;
  adp: number | null;
  rookie: boolean;
}

interface UnderdogData {
  adp: number | null;
  points: number | null;
  rosterPoints: number | null;
  overallPick: number | null;
  teamPick: number | null;
  source: string | null;
  madePlayoffs: boolean;
}

interface ProjectionData {
  draftkings?: { rank: number | null; adp: number | null } | null;
  underdog?: { adp: number | null; points: number | null } | null;
  espn?: unknown;
}

interface DraftData {
  adp: number | null;
  tier: string | null;
  notes: string;
}

interface AnalyticsData {
  risk: string;
  upside: string;
  consistency: string;
}

interface RiskData {
  injury: string;
  competition: string;
  situation: string;
}

interface Player {
  id: string | null;
  name: string;
  position: string;
  team: string;
  bye: number | null;
  draftkings: DraftKingsData | null;
  underdog: UnderdogData | null;
  projections: ProjectionData;
  historical: Record<string, Record<string, unknown>>;
  draft: DraftData;
  analytics: AnalyticsData;
  risk: RiskData;
}

interface DatabaseMeta {
  lastUpdated: string;
  source: string;
  version: string;
  totalPlayers: number;
  dataSources: {
    underdog: { players: number; tournaments: number };
    draftkings: { players: number; rankings: number };
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

async function extractUnderdogDraftKingsData(): Promise<void> {
  console.log('📊 Extracting Underdog Fantasy and DraftKings Data...\n');

  try {
    // Initialize fresh database structure
    const freshDatabase: Database = {
      meta: {
        lastUpdated: new Date().toISOString(),
        source: "Underdog Fantasy + DraftKings Integration",
        version: "1.0.0",
        totalPlayers: 0,
        dataSources: {
          underdog: { players: 0, tournaments: 0 },
          draftkings: { players: 0, rankings: 0 }
        }
      },
      players: {
        QB: [],
        RB: [],
        WR: [],
        TE: []
      }
    };

    // Map to track unique players by name
    const playerMap: Map<string, Player> = new Map();

    console.log('📈 Processing DraftKings Rankings...');
    await processDraftKingsData(playerMap, freshDatabase);

    console.log('🎯 Processing Underdog Fantasy Data...');
    await processUnderdogData(playerMap, freshDatabase);

    // Convert map to arrays and categorize by position
    for (const [playerName, player] of playerMap) {
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

    // Save the integrated database
    const outputPath: string = 'data/playerDatabase.json';
    fs.writeFileSync(outputPath, JSON.stringify(freshDatabase, null, 2));

    console.log(`\n✅ Integrated player database saved to: ${outputPath}`);
    console.log(`📊 Total players: ${freshDatabase.meta.totalPlayers}`);

    // Show sample players
    console.log('\n📋 Sample Players by Position:');
    Object.keys(freshDatabase.players).forEach((pos: string) => {
      const players = freshDatabase.players[pos as keyof typeof freshDatabase.players];
      if (players.length > 0) {
        const samplePlayer: Player = players[0];
        console.log(`   ${pos}: ${samplePlayer.name} (${samplePlayer.team})`);
        console.log(`      DraftKings: Rank ${samplePlayer.draftkings?.rank || 'N/A'}, ADP ${samplePlayer.draftkings?.adp || 'N/A'}`);
        console.log(`      Underdog: ADP ${samplePlayer.underdog?.adp || 'N/A'}, Points ${samplePlayer.underdog?.points || 'N/A'}`);
      }
    });

    console.log('\n🎯 Data Integration Summary:');
    console.log(`   ✅ DraftKings: ${freshDatabase.meta.dataSources.draftkings.players} players`);
    console.log(`   ✅ Underdog: ${freshDatabase.meta.dataSources.underdog.players} players`);
    console.log(`   ✅ Total unique players: ${freshDatabase.meta.totalPlayers}`);
    console.log(`   ✅ Positions: QB, RB, WR, TE`);
    console.log(`   ✅ Scoring: DraftKings (PPR), Underdog (Half-PPR)`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`💥 Error extracting data: ${errorMessage}`);
  }
}

async function processDraftKingsData(playerMap: Map<string, Player>, database: Database): Promise<void> {
  try {
    const dkData: string = fs.readFileSync('Best-Ball-2025---DK-Ranks-22.csv', 'utf8');
    const lines: string[] = dkData.split('\n');

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line: string = lines[i].trim();
      if (!line) continue;

      const columns: string[] = line.split(',');
      if (columns.length < 10) continue;

      const [id, name, team, wk17, bye, position, rank, prk, adp, rookie] = columns;

      if (!name || !position) continue;

      const playerName: string = name.trim();
      const playerPosition: string = position.trim().toUpperCase();

      if (!['QB', 'RB', 'WR', 'TE'].includes(playerPosition)) continue;

      if (!playerMap.has(playerName)) {
        playerMap.set(playerName, {
          id: id || null,
          name: playerName,
          position: playerPosition,
          team: team || 'UNKNOWN',
          bye: bye ? parseInt(bye) : null,
          draftkings: {
            rank: rank ? parseInt(rank) : null,
            positionRank: prk || null,
            adp: adp ? parseFloat(adp) : null,
            rookie: rookie === 'Rookie'
          },
          underdog: null,
          projections: {
            draftkings: {
              rank: rank ? parseInt(rank) : null,
              adp: adp ? parseFloat(adp) : null
            },
            underdog: null,
            espn: null
          },
          historical: {
            2024: {},
            2023: {},
            2022: {}
          },
          draft: {
            adp: adp ? parseFloat(adp) : null,
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
        });
      } else {
        // Update existing player with DraftKings data
        const player: Player | undefined = playerMap.get(playerName);
        if (player) {
          player.draftkings = {
            rank: rank ? parseInt(rank) : null,
            positionRank: prk || null,
            adp: adp ? parseFloat(adp) : null,
            rookie: rookie === 'Rookie'
          };
          player.projections.draftkings = {
            rank: rank ? parseInt(rank) : null,
            adp: adp ? parseFloat(adp) : null
          };
          player.draft.adp = adp ? parseFloat(adp) : null;
        }
      }

      database.meta.dataSources.draftkings.players++;
    }

    console.log(`   ✅ Processed ${database.meta.dataSources.draftkings.players} DraftKings players`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`   ❌ Error processing DraftKings data: ${errorMessage}`);
  }
}

async function processUnderdogData(playerMap: Map<string, Player>, database: Database): Promise<void> {
  try {
    const underdogDataStr: string = fs.readFileSync('underdog_sample.csv', 'utf8');
    const lines: string[] = underdogDataStr.split('\n');

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line: string = lines[i].trim();
      if (!line) continue;

      const columns: string[] = line.split(',');
      if (columns.length < 15) continue;

      const [draftId, userId, username, draftCreated, draftFilled, draftTime, draftCompleted, draftClock, draftEntryId, tournamentEntryId, tournamentRoundDraftEntryId, tournamentRoundNumber, playerName, playerId, positionName, projectionAdp, source, pickOrder, overallPickNumber, teamPickNumber, pickCreatedTime, pickPoints, rosterPoints, madePlayoffs] = columns;

      if (!playerName || !positionName) continue;

      const playerNameClean: string = playerName.trim();
      const playerPosition: string = positionName.trim().toUpperCase();

      if (!['QB', 'RB', 'WR', 'TE'].includes(playerPosition)) continue;

      const underdogDataObj: UnderdogData = {
        adp: projectionAdp ? parseFloat(projectionAdp) : null,
        points: pickPoints ? parseFloat(pickPoints) : null,
        rosterPoints: rosterPoints ? parseFloat(rosterPoints) : null,
        overallPick: overallPickNumber ? parseInt(overallPickNumber) : null,
        teamPick: teamPickNumber ? parseInt(teamPickNumber) : null,
        source: source || null,
        madePlayoffs: madePlayoffs === '1'
      };

      if (!playerMap.has(playerNameClean)) {
        playerMap.set(playerNameClean, {
          id: playerId || null,
          name: playerNameClean,
          position: playerPosition,
          team: 'UNKNOWN',
          bye: null,
          draftkings: null,
          underdog: underdogDataObj,
          projections: {
            draftkings: null,
            underdog: {
              adp: projectionAdp ? parseFloat(projectionAdp) : null,
              points: pickPoints ? parseFloat(pickPoints) : null
            },
            espn: null
          },
          historical: {
            2024: {},
            2023: {},
            2022: {}
          },
          draft: {
            adp: projectionAdp ? parseFloat(projectionAdp) : null,
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
        });
      } else {
        // Update existing player with Underdog data
        const player: Player | undefined = playerMap.get(playerNameClean);
        if (player) {
          player.underdog = underdogDataObj;
          player.projections.underdog = {
            adp: projectionAdp ? parseFloat(projectionAdp) : null,
            points: pickPoints ? parseFloat(pickPoints) : null
          };
          // Use Underdog ADP if DraftKings ADP is not available
          if (!player.draft.adp && projectionAdp) {
            player.draft.adp = parseFloat(projectionAdp);
          }
        }
      }

      database.meta.dataSources.underdog.players++;
    }

    console.log(`   ✅ Processed ${database.meta.dataSources.underdog.players} Underdog players`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`   ❌ Error processing Underdog data: ${errorMessage}`);
  }
}

// Run extraction
if (require.main === module) {
  extractUnderdogDraftKingsData().catch(console.error);
}

export { extractUnderdogDraftKingsData };
