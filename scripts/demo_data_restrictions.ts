#!/usr/bin/env node
/**
 * Demo Data Access Restrictions
 * Shows how data access is controlled during active seasons
 */

interface DataAccessControl {
  getCurrentPeriod(): string;
  getPeriodMessage(): string;
  getDataAvailabilityStatus(): string;
  validateExportRequest(type: string, userId: string | null, requesterId: string): ValidationResult;
  getAvailableDataTypes(userId: string): { available: DataType[]; restricted: DataType[] };
  isDraftPeriodActive(): boolean;
  isSeasonActive(): boolean;
}

interface ValidationResult {
  allowed: boolean;
  reason?: string;
}

interface DataType {
  label: string;
  reason?: string;
}

interface PeriodEntry {
  name: string;
  personal: string;
  tournament: string;
  player: string;
  aggregated: string;
}

interface TestCase {
  type: string;
  userId: string | null;
  requesterId: string;
  label: string;
}

const { dataAccessControl } = require('../lib/dataAccessControl.js') as {
  dataAccessControl: DataAccessControl;
};

function demonstrateDataRestrictions(): void {
  console.log('🔒 DATA ACCESS CONTROL DEMONSTRATION');
  console.log('='.repeat(60));

  // Current period status
  const period: string = dataAccessControl.getCurrentPeriod();
  const message: string = dataAccessControl.getPeriodMessage();
  const status: string = dataAccessControl.getDataAvailabilityStatus();

  console.log(`\n📅 CURRENT PERIOD: ${period.toUpperCase()}`);
  console.log(`📢 Status: ${message}`);
  console.log(`⏰ Data Status: ${status}`);

  // Test different data access scenarios
  console.log('\n🔍 DATA ACCESS TESTING');
  console.log('-'.repeat(40));

  const testCases: TestCase[] = [
    {
      type: 'personal',
      userId: 'user123',
      requesterId: 'user123',
      label: "User's own draft data"
    },
    {
      type: 'personal',
      userId: 'user123',
      requesterId: 'user456',
      label: "Another user's draft data"
    },
    { type: 'tournament', userId: null, requesterId: 'user123', label: 'Tournament analytics' },
    { type: 'player', userId: null, requesterId: 'user123', label: 'Player performance data' },
    { type: 'aggregated', userId: null, requesterId: 'user123', label: 'League statistics' }
  ];

  testCases.forEach((testCase) => {
    const validation: ValidationResult = dataAccessControl.validateExportRequest(
      testCase.type,
      testCase.userId,
      testCase.requesterId
    );

    const statusIcon = validation.allowed ? '✅ ALLOWED' : '❌ RESTRICTED';
    console.log(`${statusIcon}: ${testCase.label}`);
    if (!validation.allowed) {
      console.log(`   Reason: ${validation.reason}`);
    }
  });

  // Show what data is available by type
  console.log('\n📊 AVAILABLE DATA TYPES');
  console.log('-'.repeat(40));

  const { available, restricted }: { available: DataType[]; restricted: DataType[] } =
    dataAccessControl.getAvailableDataTypes('user123');

  console.log('\n✅ CURRENTLY AVAILABLE:');
  available.forEach((item) => {
    console.log(`   • ${item.label}`);
  });

  console.log('\n❌ CURRENTLY RESTRICTED:');
  restricted.forEach((item) => {
    console.log(`   • ${item.label}`);
    console.log(`     → ${item.reason}`);
  });

  // Season timeline
  console.log('\n📅 SEASON TIMELINE');
  console.log('-'.repeat(40));

  const isDraftActive: boolean = dataAccessControl.isDraftPeriodActive();
  const isSeasonActive: boolean = dataAccessControl.isSeasonActive();

  console.log(`Draft Period Active: ${isDraftActive ? 'YES' : 'NO'}`);
  console.log(`NFL Season Active: ${isSeasonActive ? 'YES' : 'NO'}`);

  // Show what happens in different periods
  console.log('\n🔄 DATA ACCESS BY PERIOD');
  console.log('-'.repeat(40));

  const periods: PeriodEntry[] = [
    { name: 'Offseason', personal: '✅', tournament: '✅', player: '✅', aggregated: '✅' },
    { name: 'Draft Period', personal: '✅', tournament: '❌', player: '❌', aggregated: '❌' },
    { name: 'NFL Season', personal: '✅', tournament: '❌', player: '❌', aggregated: '❌' },
    { name: 'Post-Season', personal: '✅', tournament: '✅', player: '✅', aggregated: '✅' }
  ];

  console.log('Period          | Personal | Tournament | Player | Aggregated');
  console.log('----------------|----------|------------|--------|------------');
  periods.forEach((period) => {
    const line = `${period.name.padEnd(15)} | ${period.personal.padEnd(8)} | ${period.tournament.padEnd(10)} | ${period.player.padEnd(6)} | ${period.aggregated}`;
    console.log(line);
  });

  console.log('\n🎯 STRATEGIC BENEFITS');
  console.log('-'.repeat(40));
  console.log('✅ Maintains competitive integrity during active play');
  console.log('✅ Prevents unfair advantages from historical data');
  console.log('✅ Protects user privacy during competition');
  console.log('✅ Still allows personal data access for users');
  console.log('✅ Creates anticipation for post-season data release');
  console.log('✅ Levels playing field between casual and whale users');

  console.log('\n🏆 COMPETITIVE ADVANTAGE');
  console.log('-'.repeat(40));
  console.log('• More transparent than competitors about restrictions');
  console.log('• Clear communication about when data will be available');
  console.log('• Personal data always accessible (better than some sites)');
  console.log('• Protects the integrity that whales value');
  console.log('• Shows commitment to fair competition');

  console.log('\n📝 IMPLEMENTATION NOTES');
  console.log('-'.repeat(40));
  console.log('• Restrictions are automatically enforced at API level');
  console.log('• Users see clear explanations when data is restricted');
  console.log('• Export UI shows countdown to data availability');
  console.log('• Personal draft data always remains accessible');
  console.log('• System respects competitive season timeline');
}

if (require.main === module) {
  demonstrateDataRestrictions();
}

export { demonstrateDataRestrictions };
