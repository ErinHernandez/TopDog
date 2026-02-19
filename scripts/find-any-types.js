// File: scripts/find-any-types.js
const { execSync } = require('child_process');
const fs = require('fs');

const CRITICAL_PATHS = [
  'payment', 'stripe', 'billing', 'checkout',
  'auth', 'login', 'session', 'token',
  'security', 'csrf', 'admin'
];

const findAnyTypes = () => {
  const output = execSync(
    `grep -rn ": any" --include="*.ts" --include="*.tsx" . 2>/dev/null || true`,
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );

  const results = {
    critical: [],
    standard: []
  };

  output.split('\n').filter(Boolean).forEach(line => {
    if (line.includes('node_modules') || line.includes('.next')) return;
    
    const [file, lineNum, ...rest] = line.split(':');
    const content = rest.join(':').trim();
    
    const isCritical = CRITICAL_PATHS.some(p => 
      file.toLowerCase().includes(p)
    );

    const entry = { file, lineNum, content };
    
    if (isCritical) {
      results.critical.push(entry);
    } else {
      results.standard.push(entry);
    }
  });

  return results;
};

const results = findAnyTypes();

console.log('\n🔴 CRITICAL PATH `any` TYPES (Must fix immediately):');
console.log('='.repeat(50));
results.critical.forEach(({ file, lineNum, content }) => {
  console.log(`\n${file}:${lineNum}`);
  console.log(`  ${content}`);
});

console.log(`\n\n📊 Summary:`);
console.log(`  Critical path: ${results.critical.length}`);
console.log(`  Standard: ${results.standard.length}`);
console.log(`  Total: ${results.critical.length + results.standard.length}`);

// Generate fix suggestions
fs.writeFileSync('any-types-report.json', JSON.stringify(results, null, 2));
console.log('\n✅ Saved report to any-types-report.json');
