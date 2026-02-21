/**
 * Test Alert System Integration
 * 
 * Verifies all components of the alert system are in place
 */

const fs = require('fs');
const path = require('path');

const checks = [];

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  checks.push({ file: description, exists });
  return exists;
}

function checkDirectory(dirPath, description) {
  const exists = fs.existsSync(dirPath);
  const isDir = exists && fs.statSync(dirPath).isDirectory();
  checks.push({ file: description, exists: isDir });
  return isDir;
}

console.log('🧪 Testing Dynamic Island Alert System Integration...\n');

// Core TypeScript files
console.log('📁 Core Files:');
checkFile('lib/draftAlerts/types.ts', 'Types definition');
checkFile('lib/draftAlerts/constants.ts', 'Constants');
checkFile('lib/draftAlerts/alertManager.ts', 'Alert manager');
checkFile('lib/draftAlerts/audioAlerts.ts', 'Audio alerts');
checkFile('lib/draftAlerts/dynamicIslandAlerts.ts', 'Dynamic Island bridge');
checkFile('lib/draftAlerts/webNotifications.ts', 'Web notifications');
checkFile('lib/draftAlerts/README.md', 'Documentation');

// React hook
console.log('\n⚛️  React Integration:');
checkFile('components/vx2/draft-logic/hooks/useDraftAlerts.ts', 'useDraftAlerts hook');

// iOS files
console.log('\n🍎 iOS Files:');
checkFile('ios/DynamicIsland/Managers/DraftAlertManager.swift', 'DraftAlertManager');
checkFile('ios/DynamicIsland/Widgets/DraftAlertWidget.swift', 'DraftAlertWidget');
checkFile('ios/DynamicIsland/README_ALERTS.md', 'iOS integration guide');
checkFile('ios/DynamicIsland/INTEGRATION_COMPLETE.swift', 'Complete iOS code');

// Service worker
console.log('\n🔧 Service Worker:');
checkFile('public/sw-custom.js', 'Custom handler');
checkFile('scripts/merge-service-worker.js', 'Merge script');

// Sound files
console.log('\n🔊 Sound Files:');
checkDirectory('public/sounds', 'Sounds directory');
checkFile('public/sounds/your-turn.mp3', 'your-turn.mp3');
checkFile('public/sounds/urgent-beep.mp3', 'urgent-beep.mp3');

// Tests
console.log('\n🧪 Tests:');
checkFile('__tests__/lib/draftAlerts/alertManager.test.ts', 'Unit tests');

// Documentation
console.log('\n📚 Documentation:');
checkFile('INTEGRATION_GUIDE_DYNAMIC_ISLAND_ALERTS.md', 'Integration guide');
checkFile('IMPLEMENTATION_COMPLETE.md', 'Implementation summary');

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Summary:');
const passed = checks.filter(c => c.exists).length;
const total = checks.length;
const percentage = ((passed / total) * 100).toFixed(1);

checks.forEach(({ file, exists }) => {
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

console.log('\n' + '='.repeat(50));
console.log(`✅ ${passed}/${total} checks passed (${percentage}%)`);

if (passed === total) {
  console.log('\n🎉 All components are in place!');
  console.log('   Ready for final integration steps.');
} else {
  console.log('\n⚠️  Some components are missing.');
  console.log('   Review the checklist above.');
}

process.exit(passed === total ? 0 : 1);
