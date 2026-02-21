#!/usr/bin/env node

/**
 * Check for New `any` Types
 * 
 * Scans TypeScript files for `any` types and blocks them in CI.
 * This enforces the "no new `any` types" rule from Phase 3.
 * 
 * Usage:
 *   node scripts/check-any-types.js [--allow-existing]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files/directories to check
const CHECK_PATHS = [
  'pages/api',
  'lib',
  'components',
  'hooks',
];

// Patterns to match `any` types
const ANY_PATTERNS = [
  /:\s*any\b/g,                    // : any
  /as\s+any\b/g,                   // as any
  /<any>/g,                        // <any>
  /Array<any>/g,                   // Array<any>
  /Record<string,\s*any>/g,        // Record<string, any>
  /Promise<any>/g,                 // Promise<any>
];

// Files to exclude (legacy code that's being migrated)
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /coverage/,
  /cypress/,
  /__tests__/,
  /\.d\.ts$/,                      // Type definition files
  /components\/vx\//,              // Legacy vx components (excluded in tsconfig)
];

/**
 * Check if file should be excluded
 */
function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * Find all TypeScript files
 */
function findTypeScriptFiles(dir) {
  const files = [];
  
  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (shouldExclude(fullPath)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

/**
 * Check file for `any` types
 */
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  ANY_PATTERNS.forEach((pattern, index) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const line = content.split('\n')[lineNumber - 1];
      
      issues.push({
        file: filePath,
        line: lineNumber,
        column: match.index - content.lastIndexOf('\n', match.index),
        match: match[0],
        context: line.trim(),
      });
    }
  });
  
  return issues;
}

/**
 * Main function
 */
function main() {
  const allowExisting = process.argv.includes('--allow-existing');
  
  console.log('🔍 Checking for `any` types in TypeScript files...\n');
  
  const allIssues = [];
  
  CHECK_PATHS.forEach(checkPath => {
    const fullPath = path.join(process.cwd(), checkPath);
    if (!fs.existsSync(fullPath)) {
      return;
    }
    
    const files = findTypeScriptFiles(fullPath);
    
    files.forEach(file => {
      const issues = checkFile(file);
      if (issues.length > 0) {
        allIssues.push(...issues);
      }
    });
  });
  
  if (allIssues.length === 0) {
    console.log('✅ No `any` types found!\n');
    process.exit(0);
  }
  
  // Group by file
  const issuesByFile = {};
  allIssues.forEach(issue => {
    if (!issuesByFile[issue.file]) {
      issuesByFile[issue.file] = [];
    }
    issuesByFile[issue.file].push(issue);
  });
  
  console.log(`\n❌ Found ${allIssues.length} `any` type(s) in ${Object.keys(issuesByFile).length} file(s)\n`);
  console.log('='.repeat(60));
  
  // Print issues by file
  Object.entries(issuesByFile).forEach(([file, issues]) => {
    const relativePath = path.relative(process.cwd(), file);
    console.log(`\n📄 ${relativePath}`);
    console.log('-'.repeat(60));
    issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. Line ${issue.line}: ${issue.match}`);
      console.log(`     ${issue.context.substring(0, 60)}...`);
    });
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Action Required:');
  console.log('   1. Replace `any` types with proper types');
  console.log('   2. Use `unknown` if type is truly unknown');
  console.log('   3. Use generics for flexible types');
  console.log('   4. Use union types for multiple possibilities');
  console.log('\n📖 See: docs/PHASE3_TYPESCRIPT_STRICT_MODE.md\n');
  
  // Save report
  const reportPath = path.join(process.cwd(), 'any-types-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalIssues: allIssues.length,
    issuesByFile,
  }, null, 2));
  
  console.log(`📁 Full report saved to: ${reportPath}\n`);
  
  if (allowExisting) {
    console.log('⚠️  --allow-existing flag set, exiting with success\n');
    process.exit(0);
  }
  
  process.exit(1);
}

main();
