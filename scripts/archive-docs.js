#!/usr/bin/env node

/**
 * Archive Documentation Cleanup Script
 * 
 * Identifies and moves handoff/status/summary/complete docs to archive
 * Keeps only files referenced in LIBRARY.md or README.md
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ARCHIVE_BASE = path.join(ROOT, 'docs', 'archive');

// Files to KEEP (referenced in LIBRARY.md or README.md)
const KEEP_FILES = new Set([
  // Active work
  'LIBRARY_SYSTEM_HANDOFF.md',
  
  // Complete summaries (referenced)
  'PHASE2_COMPLETE_SUMMARY.md',
  'ENTERPRISE_GRADE_COMPLETE_SUMMARY.md',
  'PHASE3_COMPLETE.md',
  'PHASE1_PAYMENT_ROUTES_COMPLETE.md',
  'PHASE2_AUTH_ROUTES_COMPLETE.md',
  'PHASE3_UTILITY_ROUTES_COMPLETE.md',
  'PHASE4_COMPLETE_SUMMARY.md',
  'PHASE5_COMPLETE_SUMMARY.md',
  'PHASE6_COMPLETE_SUMMARY.md',
  'TEST_COVERAGE_ALL_PHASES_COMPLETE.md',
  'TIER1_COMPLETE_SUMMARY.md',
  'TIER2_COMPLETE_SUMMARY.md',
  'TIER3_COMPLETE_SUMMARY.md',
  'CODE_REVIEW_IMPLEMENTATION_COMPLETE.md',
  'TIER1_TIER2_COMPLETE_FINAL_REPORT.md',
  'REFACTORING_COMPLETE_SUMMARY.md',
  
  // Status files (referenced)
  'ALL_TIERS_IMPLEMENTATION_STATUS.md',
  'CODE_REVIEW_IMPLEMENTATION_STATUS.md',
  'TEST_COVERAGE_IMPLEMENTATION_STATUS.md',
  'TIER2_TYPESCRIPT_PROGRESS_SUMMARY.md',
  'REFACTORING_IMPLEMENTATION_STATUS.md',
  'API_STANDARDIZATION_PROGRESS.md',
  'TIER1_IMPLEMENTATION_STATUS.md',
  'TIER2_IMPLEMENTATION_STATUS.md',
  'TIER3_IMPLEMENTATION_STATUS.md',
  'TIER4_IMPLEMENTATION_STATUS.md',
]);

// Duplicate pairs: [keep, archive]
const DUPLICATES = [
  ['CODE_REVIEW_HANDOFF_REFINED.md', 'CODE_REVIEW_HANDOFF.md'],
  ['DEV_SERVER_FIX_HANDOFF_REFINED.md', 'DEV_SERVER_FIX_HANDOFF.md'],
];

function getFileCategory(filename) {
  if (filename.includes('HANDOFF')) return 'handoffs';
  if (filename.includes('STATUS')) return 'status';
  if (filename.includes('SUMMARY')) return 'summaries';
  if (filename.includes('COMPLETE')) return 'complete';
  return 'other';
}

function shouldArchive(filename) {
  // Keep referenced files
  if (KEEP_FILES.has(filename)) return false;
  
  // Keep the "refined" version of duplicates
  for (const [keep, archive] of DUPLICATES) {
    if (filename === archive) return true;
    if (filename === keep) return false;
  }
  
  // Archive all other handoff/status/summary/complete files
  return filename.match(/(HANDOFF|COMPLETE|STATUS|SUMMARY)/);
}

function main() {
  const files = fs.readdirSync(ROOT)
    .filter(f => f.endsWith('.md'))
    .filter(f => shouldArchive(f));
  
  console.log(`Found ${files.length} files to archive:\n`);
  
  const byCategory = {
    handoffs: [],
    status: [],
    summaries: [],
    complete: [],
    other: []
  };
  
  files.forEach(file => {
    const category = getFileCategory(file);
    byCategory[category].push(file);
  });
  
  // Create archive directories
  Object.keys(byCategory).forEach(cat => {
    const dir = path.join(ARCHIVE_BASE, cat);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // Move files
  let moved = 0;
  files.forEach(file => {
    const category = getFileCategory(file);
    const src = path.join(ROOT, file);
    const dest = path.join(ARCHIVE_BASE, category, file);
    
    try {
      fs.renameSync(src, dest);
      console.log(`✓ Moved ${file} → docs/archive/${category}/`);
      moved++;
    } catch (err) {
      console.error(`✗ Failed to move ${file}: ${err.message}`);
    }
  });
  
  console.log(`\n✅ Archived ${moved} files`);
  console.log(`\nFiles kept in root (referenced in LIBRARY.md/README.md):`);
  KEEP_FILES.forEach(f => {
    if (fs.existsSync(path.join(ROOT, f))) {
      console.log(`  - ${f}`);
    }
  });
}

if (require.main === module) {
  main();
}

module.exports = { shouldArchive, KEEP_FILES };
