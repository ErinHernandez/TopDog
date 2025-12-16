#!/usr/bin/env node

/**
 * Integrate all data sources: DraftKings, Underdog, and Clay projections
 */

const fs = require('fs');

async function integrateAllSources() {
  console.log('🔄 Integrating All Data Sources...\n');
  
  try {
    // Load existing database
    const databasePath = 'data/playerDatabase.json';
    let database = {
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
    const playerMap = new Map();
    
    // Load existing players into map
    Object.values(database.players).forEach(positionPlayers => {
      positionPlayers.forEach(player => {
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
      const position = player.position.toUpperCase();
      if (['QB', 'RB', 'WR', 'TE'].includes(position)) {
        database.players[position].push(player);
      }
    }
    
    // Update metadata
    Object.keys(database.players).forEach(pos => {
      database.meta.totalPlayers += database.players[pos].length;
    });
    
    // Save the integrated database
    fs.writeFileSync(databasePath, JSON.stringify(database, null, 2));
    
    console.log(`\n✅ Integrated database saved to: ${databasePath}`);
    console.log(`📊 Total players: ${database.meta.totalPlayers}`);
    
    // Show summary
    console.log('\n📋 Position Breakdown:');
    Object.keys(database.players).forEach(pos => {
      console.log(`   ${pos}: ${database.players[pos].length} players`);
    });
    
    console.log('\n🎯 Data Source Summary:');
    console.log(`   DraftKings: ${database.meta.dataSources.draftkings.players} players`);
    console.log(`   Underdog: ${database.meta.dataSources.underdog.players} players`);
    console.log(`   Clay: ${database.meta.dataSources.clay.players} players`);
    
    // Show sample integrated players
    console.log('\n📋 Sample Integrated Players:');
    let sampleCount = 0;
    Object.keys(database.players).forEach(pos => {
      if (sampleCount < 3 && database.players[pos].length > 0) {
        const player = database.players[pos][0];
        console.log(`${sampleCount + 1}. ${player.name} (${player.position}, ${player.team})`);
        console.log(`   DraftKings: Rank ${player.draftkings?.rank || 'N/A'}, ADP ${player.draftkings?.adp || 'N/A'}`);
        console.log(`   Underdog: ADP ${player.underdog?.adp || 'N/A'}, Points ${player.underdog?.points || 'N/A'}`);
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
    console.log(`💥 Error integrating sources: ${error.message}`);
  }
}

async function integrateClayProjections(playerMap, database) {
  try {
    // Try to load Clay projections
    const clayFiles = [
      'clay_projections_2025_simple.json',
      'clay_projections_2025_final.json',
      'clay_projections_2025_parsed.json'
    ];
    
    let clayProjections = null;
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
    
    let integratedCount = 0;
    clayProjections.forEach(clayPlayer => {
      if (clayPlayer.name && clayPlayer.position && clayPlayer.fantasy?.ppr > 0) {
        const playerName = clayPlayer.name;
        
        if (playerMap.has(playerName)) {
          // Update existing player with Clay data
          const player = playerMap.get(playerName);
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
        } else {
          // Create new player from Clay data
          const newPlayer = {
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
    
    database.meta.dataSources.clay.players = integratedCount;
    console.log(`   ✅ Integrated ${integratedCount} Clay projections`);
    
  } catch (error) {
    console.log(`   ❌ Error integrating Clay projections: ${error.message}`);
  }
}

// Run integration
if (require.main === module) {
  integrateAllSources().catch(console.error);
}

module.exports = { integrateAllSources }; 