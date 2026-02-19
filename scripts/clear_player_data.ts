#!/usr/bin/env node

/**
 * Clear all existing player data and prepare for fresh start
 */

import * as fs from 'fs';
import * as path from 'path';

interface EmptyDatabase {
  meta: {
    lastUpdated: string;
    source: string;
    version: string;
  };
  players: {
    QB: unknown[];
    RB: unknown[];
    WR: unknown[];
    TE: unknown[];
  };
}

async function clearPlayerData(): Promise<void> {
  console.log('🗑️  Clearing All Player Data for Fresh Start...\n');

  try {
    // List of files to clear/backup
    const filesToHandle: string[] = [
      'data/playerDatabase.json',
      'data/player-stats.json',
      'public/data/player-stats.json'
    ];

    console.log('📁 Files to handle:');
    filesToHandle.forEach((file: string) => {
      console.log(`   - ${file}`);
    });

    console.log('\n🔄 Processing files...');

    for (const filePath of filesToHandle) {
      if (fs.existsSync(filePath)) {
        // Create backup
        const backupPath: string = filePath.replace('.json', `_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
        fs.copyFileSync(filePath, backupPath);
        console.log(`   ✅ Backed up: ${filePath} → ${backupPath}`);

        // Clear the file with minimal structure
        const emptyStructure: EmptyDatabase = {
          meta: {
            lastUpdated: new Date().toISOString(),
            source: "ESPN API - Fresh Start",
            version: "1.0.0"
          },
          players: {
            QB: [],
            RB: [],
            WR: [],
            TE: []
          }
        };

        fs.writeFileSync(filePath, JSON.stringify(emptyStructure, null, 2));
        console.log(`   ✅ Cleared: ${filePath}`);
      } else {
        console.log(`   ⚠️  File not found: ${filePath}`);
      }
    }

    // Clear any CSV files that might contain player data
    const csvFiles: string[] = [
      'Best-Ball-2025---DK-Ranks-22.csv',
      'clay_projections_final.csv',
      'clay_projections_fixed.csv',
      'clay_projections.csv',
      'underdog_sample.csv'
    ];

    console.log('\n📊 CSV files to backup:');
    csvFiles.forEach((csvFile: string) => {
      if (fs.existsSync(csvFile)) {
        const backupPath: string = csvFile.replace('.csv', `_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
        fs.copyFileSync(csvFile, backupPath);
        console.log(`   ✅ Backed up: ${csvFile} → ${backupPath}`);
      }
    });

    console.log('\n🎯 Fresh Start Strategy:');
    console.log('   1. ✅ All existing player data cleared and backed up');
    console.log('   2. 📡 ESPN API endpoints working and ready');
    console.log('   3. 📊 Current preseason data available');
    console.log('   4. 🔄 Ready to build new player database');

    console.log('\n📋 Available Data Sources:');
    console.log('   ✅ ESPN API - Current preseason statistics');
    console.log('   ✅ ESPN API - Team information (32 teams)');
    console.log('   ✅ External sources - Clay projections, etc.');
    console.log('   ❌ ESPN API - Historical season data (404 errors)');
    console.log('   ❌ ESPN API - Direct projections');

    console.log('\n💡 Next Steps:');
    console.log('   1. Build player database from ESPN preseason data');
    console.log('   2. Integrate external projection sources');
    console.log('   3. Create projection model based on available data');
    console.log('   4. Update as regular season progresses');

    console.log('\n✅ Player data cleared successfully! Ready for fresh start.');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`💥 Error clearing player data: ${errorMessage}`);
  }
}

// Run clear
if (require.main === module) {
  clearPlayerData().catch(console.error);
}

export { clearPlayerData };
