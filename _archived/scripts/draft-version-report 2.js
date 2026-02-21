#!/usr/bin/env node

/**
 * Draft Version Usage Report
 * 
 * Generates a report of draft version usage from Firestore analytics data.
 * Used for Phase 4: Draft Version Consolidation.
 * 
 * Usage:
 *   node scripts/draft-version-report.js [--days 30] [--format json]
 */

const { getDb } = require('../lib/firebase-utils');
const { collection, query, where, getDocs, Timestamp } = require('firebase/firestore');

/**
 * Get draft version statistics from Firestore
 */
async function getDraftVersionStats(days = 30) {
  const db = getDb();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const q = query(
    collection(db, 'draftVersionAnalytics'),
    where('timestamp', '>=', Timestamp.fromDate(cutoffDate))
  );
  
  const snapshot = await getDocs(q);
  const stats = {
    v2: 0,
    v3: 0,
    vx: 0,
    vx2: 0,
    total: 0,
  };
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const version = data.version;
    if (stats.hasOwnProperty(version)) {
      stats[version]++;
      stats.total++;
    }
  });
  
  return {
    ...stats,
    percentages: {
      v2: stats.total > 0 ? ((stats.v2 / stats.total) * 100).toFixed(2) : '0.00',
      v3: stats.total > 0 ? ((stats.v3 / stats.total) * 100).toFixed(2) : '0.00',
      vx: stats.total > 0 ? ((stats.vx / stats.total) * 100).toFixed(2) : '0.00',
      vx2: stats.total > 0 ? ((stats.vx2 / stats.total) * 100).toFixed(2) : '0.00',
    },
  };
}

/**
 * Generate recommendations based on stats
 */
function generateRecommendations(stats) {
  const recommendations = [];
  const vx2Percent = parseFloat(stats.percentages.vx2);
  const legacyPercent = parseFloat(stats.percentages.v2) + 
                        parseFloat(stats.percentages.v3) + 
                        parseFloat(stats.percentages.vx);
  
  if (vx2Percent < 80) {
    recommendations.push({
      severity: 'warning',
      message: `vx2 adoption is ${vx2Percent}% (below 80%). Consider migration campaign.`,
    });
  }
  
  if (legacyPercent > 20) {
    recommendations.push({
      severity: 'warning',
      message: `Legacy versions (v2/v3/vx) still have ${legacyPercent}% usage. Deprecation timeline may need adjustment.`,
    });
  }
  
  if (vx2Percent >= 95) {
    recommendations.push({
      severity: 'success',
      message: `vx2 adoption is excellent (${vx2Percent}%). Safe to proceed with deprecation.`,
    });
  }
  
  if (legacyPercent < 5) {
    recommendations.push({
      severity: 'success',
      message: `Legacy versions have minimal usage (${legacyPercent}%). Hard deprecation recommended.`,
    });
  }
  
  return recommendations;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const daysIndex = args.indexOf('--days');
  const days = daysIndex !== -1 && args[daysIndex + 1] 
    ? parseInt(args[daysIndex + 1], 10) 
    : 30;
  
  const formatJson = args.includes('--format') && args[args.indexOf('--format') + 1] === 'json';
  
  console.log(`\n📊 Draft Version Usage Report (Last ${days} days)`);
  console.log('='.repeat(60));
  
  try {
    const stats = await getDraftVersionStats(days);
    
    if (formatJson) {
      console.log(JSON.stringify({
        days,
        stats,
        recommendations: generateRecommendations(stats),
        generatedAt: new Date().toISOString(),
      }, null, 2));
      return;
    }
    
    console.log(`\nTotal Sessions: ${stats.total}`);
    console.log(`\nVersion Distribution:`);
    console.log(`  v2:  ${stats.v2.toString().padStart(6)} (${stats.percentages.v2}%)`);
    console.log(`  v3:  ${stats.v3.toString().padStart(6)} (${stats.percentages.v3}%)`);
    console.log(`  vx:  ${stats.vx.toString().padStart(6)} (${stats.percentages.vx}%)`);
    console.log(`  vx2: ${stats.vx2.toString().padStart(6)} (${stats.percentages.vx2}%)`);
    
    const recommendations = generateRecommendations(stats);
    if (recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      recommendations.forEach(rec => {
        const icon = rec.severity === 'success' ? '✅' : '⚠️';
        console.log(`  ${icon}  ${rec.message}`);
      });
    }
    
    console.log(`\n📅 Report generated: ${new Date().toISOString()}\n`);
    
  } catch (error) {
    console.error('❌ Error generating report:', error);
    process.exit(1);
  }
}

main();
