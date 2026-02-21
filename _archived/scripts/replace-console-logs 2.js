// File: scripts/replace-console-logs.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all files with console statements
const findConsoleStatements = () => {
  const output = execSync(
    `grep -rln "console\\." --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git . 2>/dev/null || true`,
    { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
  );
  
  return output.split('\n').filter(f => 
    f && !f.includes('node_modules') && !f.includes('.next') && !f.includes('scripts/')
  );
};

// Determine if file is client or server
const isServerFile = (filePath) => {
  return filePath.includes('/api/') || 
         filePath.includes('/server/') ||
         (filePath.includes('/lib/') && !filePath.includes('/lib/hooks') && !filePath.includes('/lib/logger'));
};

// Generate replacement suggestions
const generateReplacements = () => {
  const files = findConsoleStatements();
  const suggestions = [];

  files.forEach(file => {
    if (!fs.existsSync(file)) return;
    
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const isServer = isServerFile(file);
    const loggerImport = isServer
      ? "import { serverLogger } from '@/lib/logger/serverLogger';"
      : "import { logger } from '@/lib/logger/clientLogger';";
    const loggerName = isServer ? 'serverLogger' : 'logger';

    const replacements = [];
    let hasLoggerImport = content.includes('@/lib/logger');
    
    lines.forEach((line, idx) => {
      // Skip if already using logger
      if (line.includes('logger.') || line.includes('serverLogger.')) return;
      
      if (line.includes('console.log')) {
        replacements.push({
          line: idx + 1,
          original: line.trim(),
          replacement: line.replace(/console\.log\((.*)\)/, `${loggerName}.info($1)`).trim(),
        });
      } else if (line.includes('console.error')) {
        replacements.push({
          line: idx + 1,
          original: line.trim(),
          replacement: line.replace(/console\.error\((.*)\)/, `${loggerName}.error($1)`).trim(),
        });
      } else if (line.includes('console.warn')) {
        replacements.push({
          line: idx + 1,
          original: line.trim(),
          replacement: line.replace(/console\.warn\((.*)\)/, `${loggerName}.warn($1)`).trim(),
        });
      } else if (line.includes('console.debug')) {
        replacements.push({
          line: idx + 1,
          original: line.trim(),
          replacement: line.replace(/console\.debug\((.*)\)/, `${loggerName}.debug($1)`).trim(),
        });
      }
    });

    if (replacements.length > 0) {
      suggestions.push({
        file,
        loggerImport,
        hasLoggerImport,
        replacements,
      });
    }
  });

  return suggestions;
};

const suggestions = generateReplacements();

console.log('\n📝 Console Statement Replacement Plan');
console.log('='.repeat(50));

let totalCount = 0;
suggestions.forEach(({ file, loggerImport, hasLoggerImport, replacements }) => {
  console.log(`\n📄 ${file}`);
  if (!hasLoggerImport) {
    console.log(`   Add import: ${loggerImport}`);
  }
  replacements.forEach(({ line, original, replacement }) => {
    console.log(`   Line ${line}:`);
    console.log(`     - ${original.substring(0, 80)}${original.length > 80 ? '...' : ''}`);
    console.log(`     + ${replacement.substring(0, 80)}${replacement.length > 80 ? '...' : ''}`);
  });
  totalCount += replacements.length;
});

console.log(`\n📊 Total replacements needed: ${totalCount}`);
console.log(`\n📁 Files to update: ${suggestions.length}`);

// Save report
fs.writeFileSync('console-replacement-plan.json', JSON.stringify(suggestions, null, 2));
console.log('\n✅ Saved detailed plan to console-replacement-plan.json');
console.log('\n💡 Tip: Review the plan, then manually apply replacements or use a find/replace tool');
