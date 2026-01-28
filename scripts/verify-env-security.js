#!/usr/bin/env node

/**
 * Environment Variable Security Verification
 * 
 * Verifies that flagged environment variables are actually safe
 * by checking they're only used in server-side code.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Variables flagged by audit script
const FLAGGED_VARIABLES = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

// Server-only directories (safe)
const SERVER_ONLY_DIRS = [
  '/pages/api/',
  '/lib/',
  '/scripts/',
  '/__tests__/',
];

// Client-side directories (unsafe)
const CLIENT_DIRS = [
  '/components/',
  '/pages/', // Except /pages/api/
  '/app/', // Next.js 13+ app directory
];

function findVariableUsages(variable) {
  const grepOutput = execSync(
    `grep -rn "process\\.env\\.${variable}" --include="*.js" --include="*.ts" --include="*.tsx" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git . 2>/dev/null || true`,
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );

  const lines = grepOutput.split('\n').filter(Boolean);
  const usages = [];

  lines.forEach(line => {
    if (line.includes('node_modules') || line.includes('.next')) return;
    
    const match = line.match(/^([^:]+):(\d+):/);
    if (!match) return;

    const filePath = match[1];
    const lineNum = match[2];
    
    // Check if it's in a server-only directory
    const isServerOnly = SERVER_ONLY_DIRS.some(dir => filePath.includes(dir));
    
    // Check if it's in a client directory (but not API routes)
    const isClientDir = CLIENT_DIRS.some(dir => {
      if (dir === '/pages/' && filePath.includes('/pages/api/')) {
        return false; // API routes are server-only
      }
      return filePath.includes(dir);
    });

    usages.push({
      file: filePath,
      line: lineNum,
      isServerOnly,
      isClientDir,
      safe: isServerOnly && !isClientDir,
    });
  });

  return usages;
}

function verifyVariable(variable) {
  console.log(`\n🔍 Verifying: ${variable}`);
  console.log('-'.repeat(50));

  const usages = findVariableUsages(variable);
  
  if (usages.length === 0) {
    console.log(`  ⚠️  No usages found`);
    return { variable, safe: false, reason: 'No usages found' };
  }

  const unsafeUsages = usages.filter(u => !u.safe);
  
  if (unsafeUsages.length > 0) {
    console.log(`  ❌ UNSAFE: Found ${unsafeUsages.length} unsafe usage(s):`);
    unsafeUsages.forEach(usage => {
      console.log(`     - ${usage.file}:${usage.line}`);
      console.log(`       Server-only: ${usage.isServerOnly}, Client dir: ${usage.isClientDir}`);
    });
    return { variable, safe: false, reason: 'Unsafe usages found', unsafeUsages };
  }

  console.log(`  ✅ SAFE: All ${usages.length} usage(s) are in server-only code`);
  usages.forEach(usage => {
    console.log(`     - ${usage.file}:${usage.line} (server-only)`);
  });

  return { variable, safe: true, usages: usages.length };
}

function main() {
  console.log('='.repeat(60));
  console.log('ENVIRONMENT VARIABLE SECURITY VERIFICATION');
  console.log('='.repeat(60));
  console.log('\nVerifying flagged variables are actually safe...\n');

  const results = FLAGGED_VARIABLES.map(verifyVariable);
  
  const allSafe = results.every(r => r.safe);
  const unsafeCount = results.filter(r => !r.safe).length;

  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`\n✅ Safe variables: ${results.filter(r => r.safe).length}`);
  console.log(`❌ Unsafe variables: ${unsafeCount}`);
  
  if (allSafe) {
    console.log('\n✅ All flagged variables are safe (server-only usage)');
    console.log('   The audit script flags them because they\'re in /pages/,');
    console.log('   but Next.js API routes are server-side only.');
    process.exit(0);
  } else {
    console.log('\n❌ Some variables have unsafe usages!');
    console.log('   Review the unsafe usages above and move them to server-side code.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { verifyVariable, findVariableUsages };
