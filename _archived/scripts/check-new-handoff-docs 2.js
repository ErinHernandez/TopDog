#!/usr/bin/env node

/**
 * Check for new handoff/status/summary/complete docs in root
 * Non-blocking warning to remind about archiving
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

// Get list of files that match pattern
function getHandoffFiles() {
  try {
    const files = fs.readdirSync(ROOT)
      .filter(f => f.endsWith('.md'))
      .filter(f => f.match(/(HANDOFF|COMPLETE|STATUS|SUMMARY)/));
    return files;
  } catch (err) {
    return [];
  }
}

// Get files that are staged or modified
function getChangedFiles() {
  try {
    const staged = execSync('git diff --cached --name-only --diff-filter=A', { encoding: 'utf8', cwd: ROOT })
      .trim()
      .split('\n')
      .filter(Boolean);
    
    const modified = execSync('git diff --name-only --diff-filter=A', { encoding: 'utf8', cwd: ROOT })
      .trim()
      .split('\n')
      .filter(Boolean);
    
    return [...new Set([...staged, ...modified])];
  } catch (err) {
    return [];
  }
}

function main() {
  const handoffFiles = getHandoffFiles();
  const changedFiles = getChangedFiles();
  
  // Check if any new handoff files are being added
  const newHandoffFiles = changedFiles.filter(f => 
    f.match(/(HANDOFF|COMPLETE|STATUS|SUMMARY)/) && 
    f.endsWith('.md') &&
    !f.includes('docs/archive/')
  );
  
  if (newHandoffFiles.length > 0) {
    console.log('\n⚠️  WARNING: New handoff/status/summary docs detected:');
    newHandoffFiles.forEach(f => console.log(`   - ${f}`));
    console.log('\n💡 Tip: If these are temporary, consider:');
    console.log('   1. Adding them to LIBRARY.md if they\'re important');
    console.log('   2. Running `npm run docs:archive` periodically to clean up');
    console.log('   3. Moving them to docs/archive/ manually if they\'re historical\n');
  }
  
  // Count total handoff files in root
  if (handoffFiles.length > 30) {
    console.log(`\n⚠️  WARNING: ${handoffFiles.length} handoff/status/summary docs in root`);
    console.log('💡 Consider running `npm run docs:archive` to clean up\n');
  }
}

if (require.main === module) {
  main();
}

module.exports = { getHandoffFiles };
