#!/usr/bin/env node

/**
 * Missing Players Report Generator
 * 
 * Analyzes download results and generates a comprehensive report of players
 * without images, including recommendations for paid sources.
 * 
 * Usage:
 *   node scripts/missing-players-report.js
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  playerPoolPath: path.join(__dirname, '..', 'public', 'data', 'player-pool-2025.json'),
  downloadLogPath: path.join(__dirname, '..', 'public', 'players', 'download-log.json'),
  outputPath: path.join(__dirname, '..', 'public', 'players', 'missing-players.json'),
  playersDir: path.join(__dirname, '..', 'public', 'players'),
};

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  console.log('📊 Missing Players Report Generator');
  console.log('='.repeat(50));
  
  // Load player pool
  if (!fs.existsSync(CONFIG.playerPoolPath)) {
    console.error(`❌ Player pool not found: ${CONFIG.playerPoolPath}`);
    process.exit(1);
  }
  
  const poolData = JSON.parse(fs.readFileSync(CONFIG.playerPoolPath, 'utf8'));
  const allPlayers = poolData.players || [];
  console.log(`\n📋 Loaded ${allPlayers.length} players from pool`);
  
  // Load download log
  let downloadResults = [];
  if (fs.existsSync(CONFIG.downloadLogPath)) {
    const logData = JSON.parse(fs.readFileSync(CONFIG.downloadLogPath, 'utf8'));
    downloadResults = logData.results || [];
    console.log(`📥 Loaded ${downloadResults.length} download results`);
  } else {
    console.log('⚠️  No download log found - will check for existing image files');
  }
  
  // Check for existing image files
  const existingImages = new Set();
  if (fs.existsSync(CONFIG.playersDir)) {
    const files = fs.readdirSync(CONFIG.playersDir);
    files.forEach(file => {
      if (file.endsWith('.png') || file.endsWith('.webp')) {
        const playerId = file.replace(/\.(png|webp)$/, '');
        existingImages.add(playerId);
      }
    });
    console.log(`🖼️  Found ${existingImages.size} existing image files`);
  }
  
  // Create success map from download results
  const successMap = new Map();
  downloadResults.forEach(result => {
    if (result.success) {
      successMap.set(result.playerId, result);
    }
  });
  
  // Identify missing players
  const missingPlayers = [];
  const foundPlayers = [];
  
  allPlayers.forEach(player => {
    const hasDownloadResult = successMap.has(player.id);
    const hasImageFile = existingImages.has(player.id);
    
    if (!hasDownloadResult && !hasImageFile) {
      // Find download attempt info
      const attempt = downloadResults.find(r => r.playerId === player.id);
      
      missingPlayers.push({
        id: player.id,
        name: player.name,
        position: player.position,
        team: player.team,
        adp: player.adp,
        attempts: attempt ? attempt.attempts : [],
        lastError: attempt ? attempt.error : 'No download attempted',
        recommendedAction: getRecommendedAction(player, attempt),
      });
    } else {
      foundPlayers.push({
        id: player.id,
        name: player.name,
        position: player.position,
        team: player.team,
        source: hasDownloadResult ? successMap.get(player.id).source : 'existing file',
      });
    }
  });
  
  // Generate report
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalPlayers: allPlayers.length,
      found: foundPlayers.length,
      missing: missingPlayers.length,
      coveragePercent: ((foundPlayers.length / allPlayers.length) * 100).toFixed(1),
      byPosition: {},
      byTeam: {},
    },
    missingPlayers: missingPlayers.sort((a, b) => a.adp - b.adp), // Sort by ADP
    foundPlayers: foundPlayers.length,
    recommendations: generateRecommendations(missingPlayers),
  };
  
  // Calculate by position
  missingPlayers.forEach(player => {
    if (!report.summary.byPosition[player.position]) {
      report.summary.byPosition[player.position] = 0;
    }
    report.summary.byPosition[player.position]++;
  });
  
  // Calculate by team
  missingPlayers.forEach(player => {
    if (!report.summary.byTeam[player.team]) {
      report.summary.byTeam[player.team] = 0;
    }
    report.summary.byTeam[player.team]++;
  });
  
  // Save report
  fs.writeFileSync(CONFIG.outputPath, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 MISSING PLAYERS REPORT');
  console.log('='.repeat(50));
  console.log(`Total Players: ${report.summary.totalPlayers}`);
  console.log(`✅ Found: ${report.summary.found} (${report.summary.coveragePercent}%)`);
  console.log(`❌ Missing: ${report.summary.missing}`);
  
  console.log('\n📊 Missing by Position:');
  Object.entries(report.summary.byPosition)
    .sort((a, b) => b[1] - a[1])
    .forEach(([pos, count]) => {
      console.log(`  ${pos}: ${count}`);
    });
  
  console.log('\n📊 Missing by Team:');
  Object.entries(report.summary.byTeam)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([team, count]) => {
      console.log(`  ${team}: ${count}`);
    });
  
  console.log('\n💡 Recommendations:');
  report.recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });
  
  console.log(`\n📁 Report saved to: ${CONFIG.outputPath}`);
  
  // Print top missing players by ADP
  if (missingPlayers.length > 0) {
    console.log('\n🔝 Top 20 Missing Players (by ADP):');
    missingPlayers.slice(0, 20).forEach((player, i) => {
      console.log(`  ${i + 1}. ${player.name} (${player.position}, ${player.team}) - ADP: ${player.adp}`);
    });
  }
}

function getRecommendedAction(player, attempt) {
  if (!attempt || attempt.attempts.length === 0) {
    return 'Try SportsDataIO free trial or manual upload';
  }
  
  const sources = attempt.attempts.map(a => a.source);
  
  if (sources.includes('thesportsdb') && sources.includes('sportsdataio')) {
    return 'All free sources attempted - use SportsDataIO paid or manual upload';
  }
  
  if (sources.includes('thesportsdb')) {
    return 'Try SportsDataIO free trial';
  }
  
  return 'Try all available sources';
}

function generateRecommendations(missingPlayers) {
  const recommendations = [];
  
  if (missingPlayers.length === 0) {
    return ['All players have images! 🎉'];
  }
  
  const missingCount = missingPlayers.length;
  const highValueMissing = missingPlayers.filter(p => p.adp <= 100).length;
  
  if (missingCount > 100) {
    recommendations.push(`Consider SportsDataIO free trial to download all ${missingCount} missing images at once`);
  }
  
  if (highValueMissing > 0) {
    recommendations.push(`Priority: ${highValueMissing} high-value players (ADP ≤ 100) need images - consider paid source`);
  }
  
  if (missingCount < 50) {
    recommendations.push('Small number of missing players - consider manual uploads for remaining players');
  }
  
  recommendations.push('Ensure fallback system (team logo → initials) is working for missing players');
  
  return recommendations;
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };

