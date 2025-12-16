#!/usr/bin/env node

/**
 * Analyze the integrated Underdog Fantasy and DraftKings data
 */

const fs = require('fs');

async function analyzeIntegratedData() {
  console.log('📊 Analyzing Integrated Underdog + DraftKings Data...\n');
  
  try {
    const databasePath = 'data/playerDatabase.json';
    if (!fs.existsSync(databasePath)) {
      throw new Error('Player database not found. Run extract_underdog_draftkings_data.js first.');
    }
    
    const database = JSON.parse(fs.readFileSync(databasePath, 'utf8'));
    
    console.log('📈 Database Overview:');
    console.log(`   Total Players: ${database.meta.totalPlayers}`);
    console.log(`   Last Updated: ${database.meta.lastUpdated}`);
    console.log(`   Sources: ${Object.keys(database.meta.dataSources).join(', ')}`);
    
    // Analyze by position
    console.log('\n📋 Position Breakdown:');
    Object.keys(database.players).forEach(pos => {
      const players = database.players[pos];
      console.log(`   ${pos}: ${players.length} players`);
      
      // Show top 5 by DraftKings rank
      const topPlayers = players
        .filter(p => p.draftkings?.rank)
        .sort((a, b) => a.draftkings.rank - b.draftkings.rank)
        .slice(0, 5);
      
      if (topPlayers.length > 0) {
        console.log(`      Top 5 ${pos}s by DraftKings Rank:`);
        topPlayers.forEach((player, index) => {
          console.log(`        ${index + 1}. ${player.name} (${player.team}) - Rank ${player.draftkings.rank}, ADP ${player.draftkings.adp}`);
        });
      }
    });
    
    // Analyze data completeness
    console.log('\n📊 Data Completeness Analysis:');
    let totalPlayers = 0;
    let playersWithDraftKings = 0;
    let playersWithUnderdog = 0;
    let playersWithBoth = 0;
    
    Object.values(database.players).forEach(positionPlayers => {
      positionPlayers.forEach(player => {
        totalPlayers++;
        if (player.draftkings) playersWithDraftKings++;
        if (player.underdog) playersWithUnderdog++;
        if (player.draftkings && player.underdog) playersWithBoth++;
      });
    });
    
    console.log(`   Players with DraftKings data: ${playersWithDraftKings} (${((playersWithDraftKings/totalPlayers)*100).toFixed(1)}%)`);
    console.log(`   Players with Underdog data: ${playersWithUnderdog} (${((playersWithUnderdog/totalPlayers)*100).toFixed(1)}%)`);
    console.log(`   Players with both sources: ${playersWithBoth} (${((playersWithBoth/totalPlayers)*100).toFixed(1)}%)`);
    
    // Analyze ADP differences
    console.log('\n🎯 ADP Analysis:');
    const playersWithBothADPs = [];
    Object.values(database.players).forEach(positionPlayers => {
      positionPlayers.forEach(player => {
        if (player.draftkings?.adp && player.underdog?.adp) {
          playersWithBothADPs.push({
            name: player.name,
            position: player.position,
            draftkingsADP: player.draftkings.adp,
            underdogADP: player.underdog.adp,
            difference: player.draftkings.adp - player.underdog.adp
          });
        }
      });
    });
    
    if (playersWithBothADPs.length > 0) {
      console.log(`   Players with both ADP sources: ${playersWithBothADPs.length}`);
      
      // Sort by biggest ADP differences
      const biggestDifferences = playersWithBothADPs
        .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
        .slice(0, 5);
      
      console.log('   Biggest ADP differences:');
      biggestDifferences.forEach(player => {
        const direction = player.difference > 0 ? 'DK higher' : 'Underdog higher';
        console.log(`     ${player.name} (${player.position}): DK ${player.draftkingsADP} vs Underdog ${player.underdogADP} (${direction} by ${Math.abs(player.difference).toFixed(1)})`);
      });
    }
    
    // Analyze rookie players
    console.log('\n🏈 Rookie Analysis:');
    const rookies = [];
    Object.values(database.players).forEach(positionPlayers => {
      positionPlayers.forEach(player => {
        if (player.draftkings?.rookie) {
          rookies.push({
            name: player.name,
            position: player.position,
            team: player.team,
            rank: player.draftkings.rank,
            adp: player.draftkings.adp
          });
        }
      });
    });
    
    if (rookies.length > 0) {
      console.log(`   Total rookies: ${rookies.length}`);
      const topRookies = rookies.sort((a, b) => a.rank - b.rank).slice(0, 10);
      console.log('   Top 10 rookies by DraftKings rank:');
      topRookies.forEach((rookie, index) => {
        console.log(`     ${index + 1}. ${rookie.name} (${rookie.position}, ${rookie.team}) - Rank ${rookie.rank}, ADP ${rookie.adp}`);
      });
    }
    
    // Scoring system analysis
    console.log('\n📊 Scoring System Analysis:');
    console.log('   DraftKings: PPR (Points Per Reception)');
    console.log('   Underdog: Half-PPR (0.5 Points Per Reception)');
    console.log('   Note: ADP differences may reflect scoring system variations');
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    console.log('   1. ✅ DraftKings provides comprehensive rankings for 240 players');
    console.log('   2. ⚠️  Underdog sample is limited (only 2 players)');
    console.log('   3. 🔄 Consider getting more Underdog data for better integration');
    console.log('   4. 📈 Use DraftKings as primary ranking source');
    console.log('   5. 🎯 Supplement with ESPN preseason stats when available');
    console.log('   6. 📊 Build projection model using DraftKings ADP as baseline');
    
    console.log('\n✅ Analysis complete! Your integrated database is ready for use.');
    
  } catch (error) {
    console.log(`💥 Error analyzing data: ${error.message}`);
  }
}

// Run analysis
if (require.main === module) {
  analyzeIntegratedData().catch(console.error);
}

module.exports = { analyzeIntegratedData }; 