#!/usr/bin/env node
/**
 * Data Management Script
 * For adding historical stats, ADP, and other data to the player database
 */

const DataManager = require('../lib/dataManager.js');

function showCurrentState() {
  console.log('📊 CURRENT DATABASE STATE');
  console.log('=' .repeat(50));
  
  const dataManager = new DataManager();
  const report = dataManager.generateStatsReport();
  
  console.log(`Total Players: ${report.totalPlayers}`);
  console.log('\nBy Position:');
  Object.entries(report.byPosition).forEach(([pos, count]) => {
    console.log(`  ${pos}: ${count} players`);
  });
  
  console.log('\nData Coverage:');
  console.log(`  Mike Clay Projections: ${report.dataCoverage.projections} players`);
  console.log(`  2024 Historical Stats: ${report.dataCoverage.historical2024} players`);
  console.log(`  2023 Historical Stats: ${report.dataCoverage.historical2023} players`);
  console.log(`  ADP Data: ${report.dataCoverage.adp} players`);
  
  console.log('\nTop 5 Players by Position (Mike Clay Projections):');
  ['QB', 'RB', 'WR', 'TE'].forEach(pos => {
    console.log(`\n${pos}:`);
    const topPlayers = dataManager.getTopPlayers(pos, 5);
    topPlayers.forEach((player, idx) => {
      const pts = player.projections.mikeClay.fantasyPoints.toFixed(1);
      const rank = player.projections.mikeClay.positionRank;
      console.log(`  ${idx + 1}. ${pos}${rank} ${player.name} - ${pts} pts`);
    });
  });
}

function demonstrateDataAddition() {
  console.log('\n📥 DEMONSTRATING DATA ADDITION');
  console.log('=' .repeat(50));
  
  const dataManager = new DataManager();
  
  // Example: Add 2024 historical stats for a few top players
  console.log('\nAdding sample 2024 historical stats...');
  
  const sampleHistoricalStats = [
    {
      name: "Jayden Daniels",
      year: 2024,
      stats: {
        fantasyPoints: 289.5,
        games: 17,
        passing: { attempts: 410, completions: 254, yards: 3568, touchdowns: 25, interceptions: 9 },
        rushing: { attempts: 148, yards: 891, touchdowns: 6 }
      }
    },
    {
      name: "Josh Allen", 
      year: 2024,
      stats: {
        fantasyPoints: 378.2,
        games: 17,
        passing: { attempts: 542, completions: 349, yards: 4306, touchdowns: 28, interceptions: 18 },
        rushing: { attempts: 122, yards: 523, touchdowns: 12 }
      }
    },
    {
      name: "Bijan Robinson",
      year: 2024, 
      stats: {
        fantasyPoints: 268.7,
        games: 17,
        rushing: { attempts: 290, yards: 1463, touchdowns: 8 },
        receiving: { targets: 58, receptions: 43, yards: 313, touchdowns: 1 }
      }
    },
    {
      name: "Ja'Marr Chase",
      year: 2024,
      stats: {
        fantasyPoints: 342.8,
        games: 17,
        receiving: { targets: 145, receptions: 117, yards: 1708, touchdowns: 16 }
      }
    },
    {
      name: "Brock Bowers",
      year: 2024,
      stats: {
        fantasyPoints: 239.1,
        games: 17,
        receiving: { targets: 156, receptions: 112, yards: 1194, touchdowns: 5 }
      }
    }
  ];

  sampleHistoricalStats.forEach(({ name, year, stats }) => {
    dataManager.addHistoricalStats(name, year, stats);
  });
  
  // Example: Add ADP data
  console.log('\nAdding sample ADP data...');
  
  const sampleADP = [
    { name: "Jayden Daniels", adp: 6.2, source: "Underdog Sports" },
    { name: "Josh Allen", adp: 4.1, source: "Underdog Sports" },
    { name: "Bijan Robinson", adp: 2.8, source: "Underdog Sports" },
    { name: "Ja'Marr Chase", adp: 1.3, source: "Underdog Sports" },
    { name: "Saquon Barkley", adp: 3.9, source: "Underdog Sports" }
  ];

  sampleADP.forEach(({ name, adp, source }) => {
    dataManager.addADPData(name, adp, source);
  });

  // Save changes
  console.log('\nSaving changes...');
  dataManager.saveDatabase();
  
  console.log('\n✅ Sample data addition complete!');
}

function showDataStructureExample() {
  console.log('\n🏗️  DATA STRUCTURE TEMPLATE');
  console.log('=' .repeat(50));
  
  console.log(`
The database is designed to store comprehensive player data:

1. PROJECTIONS (Current):
   - Mike Clay ESPN 2025 ✅
   - [Ready for additional sources]

2. HISTORICAL STATS (Ready to add):
   - 2024 season stats
   - 2023 season stats  
   - 2022 season stats
   - Position-specific stats (passing, rushing, receiving)

3. DRAFT DATA (Ready to add):
   - ADP from various sources
   - Expert rankings
   - Positional rankings

4. ADVANCED ANALYTICS (Framework ready):
   - Consistency metrics
   - Ceiling/floor projections
   - Target share, snap share
   - Red zone usage

5. RISK FACTORS (Framework ready):
   - Injury history
   - Age-related risk
   - Situational risk factors

NEXT STEPS FOR DATA ADDITION:
- Provide CSV files with historical stats
- Provide ADP data from draft sites
- Any additional projection sources
- Team information and bye weeks
  `);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';

  switch (command) {
    case 'status':
      showCurrentState();
      break;
    
    case 'demo':
      showCurrentState();
      demonstrateDataAddition();
      showCurrentState();
      break;
    
    case 'structure':
      showDataStructureExample();
      break;
    
    case 'help':
      console.log(`
📊 Data Management Commands:

node scripts/manage_data.js status     - Show current database state
node scripts/manage_data.js demo       - Add sample data and show before/after
node scripts/manage_data.js structure  - Show data structure template
node scripts/manage_data.js help       - Show this help

For adding data programmatically, use the DataManager class:
const dataManager = require('./lib/dataManager.js');
      `);
      break;
    
    default:
      console.log('❌ Unknown command. Use "help" for available commands.');
  }
}

if (require.main === module) {
  main();
}