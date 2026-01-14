#!/usr/bin/env node

/**
 * Check TypeScript Errors
 * 
 * Runs TypeScript compiler to check for type errors and reports them.
 * Used during Phase 3: TypeScript Strict Mode migration.
 * 
 * Usage:
 *   node scripts/check-typescript-errors.js [--fix] [--file <path>]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const fileArg = args.find(arg => arg.startsWith('--file='));
const targetFile = fileArg ? fileArg.split('=')[1] : null;

console.log('🔍 Checking TypeScript errors...\n');

try {
  // Run TypeScript compiler
  const command = targetFile 
    ? `npx tsc --noEmit --pretty false ${targetFile}`
    : 'npx tsc --noEmit --pretty false';
  
  const output = execSync(command, { 
    encoding: 'utf8',
    stdio: 'pipe',
    cwd: process.cwd(),
  });
  
  console.log('✅ No TypeScript errors found!\n');
  process.exit(0);
  
} catch (error) {
  const output = error.stdout || error.stderr || error.message;
  
  // Parse error output
  const lines = output.split('\n');
  const errors = [];
  let currentError = null;
  
  for (const line of lines) {
    if (line.includes('.ts(') || line.includes('.tsx(')) {
      // New error - file path with line number
      if (currentError) {
        errors.push(currentError);
      }
      currentError = {
        file: line.trim(),
        message: '',
        code: '',
      };
    } else if (line.trim().startsWith('TS')) {
      // Error code
      if (currentError) {
        currentError.code = line.trim().split(':')[0];
        currentError.message = line.trim();
      }
    } else if (line.trim() && currentError && !currentError.message) {
      // Error message
      currentError.message = line.trim();
    }
  }
  
  if (currentError) {
    errors.push(currentError);
  }
  
  // Group errors by file
  const errorsByFile = {};
  errors.forEach(error => {
    const fileMatch = error.file.match(/^(.+\.tsx?)/);
    if (fileMatch) {
      const file = fileMatch[1];
      if (!errorsByFile[file]) {
        errorsByFile[file] = [];
      }
      errorsByFile[file].push(error);
    }
  });
  
  // Print summary
  console.log(`\n❌ Found ${errors.length} TypeScript error(s) across ${Object.keys(errorsByFile).length} file(s)\n`);
  console.log('='.repeat(60));
  
  // Print errors by file
  Object.entries(errorsByFile).forEach(([file, fileErrors]) => {
    console.log(`\n📄 ${file}`);
    console.log('-'.repeat(60));
    fileErrors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.code || 'Error'}`);
      console.log(`     ${error.message || error.file}`);
    });
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Next Steps:');
  console.log('   1. Review errors above');
  console.log('   2. Fix null/undefined issues');
  console.log('   3. Add proper type guards where needed');
  console.log('   4. Re-run: node scripts/check-typescript-errors.js\n');
  
  // Save errors to file
  const errorsFile = path.join(process.cwd(), 'typescript-errors.json');
  fs.writeFileSync(errorsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalErrors: errors.length,
    errorsByFile,
    rawOutput: output,
  }, null, 2));
  
  console.log(`📁 Full error report saved to: ${errorsFile}\n`);
  
  process.exit(1);
}
