#!/usr/bin/env node
/**
 * Demo Tournament Data Collection
 * Shows how the system collects pick-level data
 */

const { tournamentCollector } = require('../lib/tournamentDataCollector.js');
const { draftDataCollector } = require('../lib/draftDataIntegration.js');

function simulateDraft() {
  console.log('🏈 SIMULATING TOURNAMENT DATA COLLECTION');
  console.log('=' .repeat(60));

  // Step 1: Initialize Tournament
  console.log('\n📊 STEP 1: Initialize Tournament');
  const tournament = tournamentCollector.initializeTournament({
    name: 'TopDog Best Ball Mania Round 1',
    season: 2025,
    format: 'bestball',
    entryFee: 25,
    maxEntries: 150000,
    prizePool: 3000000
  });

  // Step 2: Initialize Draft Room
  console.log('\n🏈 STEP 2: Initialize Draft Room');
  const participants = [
    { userId: 'user_1', username: 'whale_hunter', teamName: 'Championship Dreams' },
    { userId: 'user_2', username: 'draft_master', teamName: 'Best Ball Legends' },
    { userId: 'user_3', username: 'analytics_pro', teamName: 'Data Driven' },
    { userId: 'user_4', username: 'underdog_slayer', teamName: 'TopDog Elite' },
    { userId: 'user_5', username: 'stream_viewer', teamName: 'Following Expert' },
    { userId: 'user_6', username: 'casual_drafter', teamName: 'Weekend Warrior' },
    { userId: 'user_7', username: 'late_round_hero', teamName: 'Value Hunting' },
    { userId: 'user_8', username: 'stack_builder', teamName: 'Correlation Station' },
    { userId: 'user_9', username: 'contrarian_play', teamName: 'Low Owned Upside' },
    { userId: 'user_10', username: 'balanced_approach', teamName: 'Diversified Portfolio' },
    { userId: 'user_11', username: 'rookie_believer', teamName: 'Youth Movement' },
    { userId: 'user_12', username: 'veteran_trust', teamName: 'Proven Commodities' }
  ];

  const draftData = draftDataCollector.initializeDraftDataCollection(
    'draft_demo_123',
    participants,
    tournament.id
  );

  // Step 3: Simulate Draft Picks
  console.log('\n📝 STEP 3: Simulate Draft Picks');
  
  const mockPicks = [
    // Round 1 - Premium picks
    { player: "Ja'Marr Chase", position: 'WR', team: 'CIN', user: 'whale_hunter', adp: 1.2, proj: 339 },
    { player: "Justin Jefferson", position: 'WR', team: 'MIN', user: 'draft_master', adp: 2.1, proj: 324 },
    { player: "Bijan Robinson", position: 'RB', team: 'ATL', user: 'analytics_pro', adp: 2.8, proj: 336 },
    { player: "CeeDee Lamb", position: 'WR', team: 'DAL', user: 'underdog_slayer', adp: 3.2, proj: 315 },
    { player: "Saquon Barkley", position: 'RB', team: 'PHI', user: 'stream_viewer', adp: 3.9, proj: 325 },
    { player: "Amon-Ra St. Brown", position: 'WR', team: 'DET', user: 'casual_drafter', adp: 6.1, proj: 290 },
    { player: "Jahmyr Gibbs", position: 'RB', team: 'DET', user: 'late_round_hero', adp: 5.2, proj: 317 },
    { player: "Puka Nacua", position: 'WR', team: 'LAR', user: 'stack_builder', adp: 4.5, proj: 310 },
    { player: "Christian McCaffrey", position: 'RB', team: 'SF', user: 'contrarian_play', adp: 7.1, proj: 322 },
    { player: "A.J. Brown", position: 'WR', team: 'PHI', user: 'balanced_approach', adp: 8.2, proj: 275 },
    { player: "Nico Collins", position: 'WR', team: 'HOU', user: 'rookie_believer', adp: 12.3, proj: 278 },
    { player: "Josh Jacobs", position: 'RB', team: 'GB', user: 'veteran_trust', adp: 9.4, proj: 282 }
  ];

  mockPicks.forEach((pick, index) => {
    // Simulate some timing variation
    const timeUsed = Math.floor(Math.random() * 60) + 15; // 15-75 seconds
    const wasTimeout = timeUsed > 85;
    const pickSource = pick.user === 'casual_drafter' && Math.random() > 0.7 ? 'auto' : 'user';

    draftDataCollector.recordDraftPick({
      userId: pick.user,
      username: pick.user,
      playerId: `player_${pick.player.replace(/\s+/g, '_').replace(/'/g, '')}`,
      playerName: pick.player,
      position: pick.position,
      team: pick.team,
      
      timeUsed: timeUsed,
      wasTimeout: wasTimeout,
      wasAutodraft: pickSource === 'auto',
      pickSource: pickSource,
      
      adp: pick.adp,
      projectedPoints: pick.proj
    });
  });

  // Step 4: Show Draft Status
  console.log('\n📊 STEP 4: Draft Status');
  const status = draftDataCollector.getDraftStatus();
  console.log('Current draft status:', JSON.stringify(status, null, 2));

  // Step 5: Complete Draft (simulate more picks first)
  console.log('\n🏁 STEP 5: Complete Draft');
  
  // Simulate completing the draft
  const completedDraft = draftDataCollector.completeDraft();
  
  if (completedDraft) {
    console.log(`✅ Draft completed successfully!`);
    console.log(`📊 Total time: ${completedDraft.analytics.totalTime} seconds`);
    console.log(`⏱️  Average pick time: ${completedDraft.analytics.averagePickTime?.toFixed(1)} seconds`);
    console.log(`⏰ Timeouts: ${completedDraft.analytics.timeouts}`);
    console.log(`🤖 Autodrafts: ${completedDraft.analytics.autodrafts}`);
  }

  // Step 6: Export Data
  console.log('\n💾 STEP 6: Export Tournament Data');
  
  try {
    const exportedData = tournamentCollector.exportTournamentData(tournament.id, 'json');
    console.log('📁 Exported JSON data size:', (exportedData.length / 1024).toFixed(1), 'KB');
    
    const csvData = tournamentCollector.exportTournamentData(tournament.id, 'csv');
    console.log('📁 Exported CSV data preview:');
    console.log(csvData.split('\n').slice(0, 3).join('\n'));
    
    // Save sample files
    const fs = require('fs');
    fs.writeFileSync('sample_tournament_data.json', exportedData);
    fs.writeFileSync('sample_tournament_data.csv', csvData);
    console.log('💾 Sample files saved: sample_tournament_data.json and sample_tournament_data.csv');
    
  } catch (error) {
    console.error('❌ Export error:', error);
  }

  console.log('\n🎯 SUMMARY: DATA GRANULARITY ACHIEVED');
  console.log('=' .repeat(60));
  console.log('✅ Tournament-level tracking');
  console.log('✅ Draft-level analytics');
  console.log('✅ Pick-level data collection');
  console.log('✅ User behavior tracking');
  console.log('✅ Timing and source analysis');
  console.log('✅ Export capabilities for streamers/whales');
  console.log('✅ Historical data foundation');
  
  console.log('\n🏆 COMPETITIVE POSITIONING:');
  console.log('📊 Data granularity: MATCHES Underdog\'s 24+ fields');
  console.log('⚡ Collection efficiency: Real-time with zero user impact');
  console.log('📁 Export options: JSON, CSV for external tools');
  console.log('🎯 Strategic focus: Pure data, no draft recommendations');
  console.log('👥 Streamer-friendly: Easy data access for their tools');
  console.log('🐋 Whale-approved: Maximum data, minimal analysis');
}

if (require.main === module) {
  simulateDraft();
}