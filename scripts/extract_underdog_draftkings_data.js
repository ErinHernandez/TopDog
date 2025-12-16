#!/usr/bin/env node

/**
 * Extract and integrate Underdog Fantasy and DraftKings data
 */

const fs = require('fs');
const path = require('path');

async function extractUnderdogDraftKingsData() {
  console.log('📊 Extracting Underdog Fantasy and DraftKings Data...\n');
  
  try {
    // Initialize fresh database structure
    const freshDatabase = {
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
    const playerMap = new Map();
    
    console.log('📈 Processing DraftKings Rankings...');
    await processDraftKingsData(playerMap, freshDatabase);
    
    console.log('🎯 Processing Underdog Fantasy Data...');
    await processUnderdogData(playerMap, freshDatabase);
    
    // Convert map to arrays and categorize by position
    for (const [playerName, player] of playerMap) {
      const position = player.position.toUpperCase();
      if (['QB', 'RB', 'WR', 'TE'].includes(position)) {
        freshDatabase.players[position].push(player);
      }
    }
    
    // Count players by position
    Object.keys(freshDatabase.players).forEach(pos => {
      freshDatabase.meta.totalPlayers += freshDatabase.players[pos].length;
      console.log(`   ${pos}: ${freshDatabase.players[pos].length} players`);
    });
    
    // Save the integrated database
    const outputPath = 'data/playerDatabase.json';
    fs.writeFileSync(outputPath, JSON.stringify(freshDatabase, null, 2));
    
    console.log(`\n✅ Integrated player database saved to: ${outputPath}`);
    console.log(`📊 Total players: ${freshDatabase.meta.totalPlayers}`);
    
    // Show sample players
    console.log('\n📋 Sample Players by Position:');
    Object.keys(freshDatabase.players).forEach(pos => {
      if (freshDatabase.players[pos].length > 0) {
        const samplePlayer = freshDatabase.players[pos][0];
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
    console.log(`💥 Error extracting data: ${error.message}`);
  }
}

async function processDraftKingsData(playerMap, database) {
  try {
    const dkData = fs.readFileSync('Best-Ball-2025---DK-Ranks-22.csv', 'utf8');
    const lines = dkData.split('\n');
    
    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split(',');
      if (columns.length < 10) continue;
      
      const [id, name, team, wk17, bye, position, rank, prk, adp, rookie] = columns;
      
      if (!name || !position) continue;
      
      const playerName = name.trim();
      const playerPosition = position.trim().toUpperCase();
      
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
        const player = playerMap.get(playerName);
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
      
      database.meta.dataSources.draftkings.players++;
    }
    
    console.log(`   ✅ Processed ${database.meta.dataSources.draftkings.players} DraftKings players`);
    
  } catch (error) {
    console.log(`   ❌ Error processing DraftKings data: ${error.message}`);
  }
}

async function processUnderdogData(playerMap, database) {
  try {
    const underdogData = fs.readFileSync('underdog_sample.csv', 'utf8');
    const lines = underdogData.split('\n');
    
    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split(',');
      if (columns.length < 15) continue;
      
      const [draftId, userId, username, draftCreated, draftFilled, draftTime, draftCompleted, draftClock, draftEntryId, tournamentEntryId, tournamentRoundDraftEntryId, tournamentRoundNumber, playerName, playerId, positionName, projectionAdp, source, pickOrder, overallPickNumber, teamPickNumber, pickCreatedTime, pickPoints, rosterPoints, madePlayoffs] = columns;
      
      if (!playerName || !positionName) continue;
      
      const playerNameClean = playerName.trim();
      const playerPosition = positionName.trim().toUpperCase();
      
      if (!['QB', 'RB', 'WR', 'TE'].includes(playerPosition)) continue;
      
      const underdogData = {
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
          team: 'UNKNOWN', // Underdog data doesn't include team
          bye: null,
          draftkings: null,
          underdog: underdogData,
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
        const player = playerMap.get(playerNameClean);
        player.underdog = underdogData;
        player.projections.underdog = {
          adp: projectionAdp ? parseFloat(projectionAdp) : null,
          points: pickPoints ? parseFloat(pickPoints) : null
        };
        // Use Underdog ADP if DraftKings ADP is not available
        if (!player.draft.adp && projectionAdp) {
          player.draft.adp = parseFloat(projectionAdp);
        }
      }
      
      database.meta.dataSources.underdog.players++;
    }
    
    console.log(`   ✅ Processed ${database.meta.dataSources.underdog.players} Underdog players`);
    
  } catch (error) {
    console.log(`   ❌ Error processing Underdog data: ${error.message}`);
  }
}

// Run extraction
if (require.main === module) {
  extractUnderdogDraftKingsData().catch(console.error);
}

module.exports = { extractUnderdogDraftKingsData }; 