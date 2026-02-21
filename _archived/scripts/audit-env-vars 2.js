// File: scripts/audit-env-vars.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const SENSITIVE_PATTERNS = [
  /SECRET/i, /KEY/i, /PASSWORD/i, /TOKEN/i, /PRIVATE/i,
  /CREDENTIAL/i, /API_KEY/i, /AUTH/i, /STRIPE/i, /WEBHOOK/i
];

const CLIENT_SAFE_PREFIXES = ['NEXT_PUBLIC_'];

// Find all env var usages
const findEnvUsages = () => {
  const results = {
    serverOnly: [],
    clientExposed: [],
    potentialLeak: []
  };

  // Get all files using process.env (exclude node_modules and .next)
  const grepOutput = execSync(
    `grep -rn "process\\.env\\." --include="*.js" --include="*.ts" --include="*.tsx" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git . 2>/dev/null || true`,
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );

  const lines = grepOutput.split('\n').filter(Boolean);
  
  lines.forEach(line => {
    // Skip node_modules and .next
    if (line.includes('node_modules') || line.includes('.next')) return;
    
    const match = line.match(/process\.env\.([A-Z_0-9]+)/);
    if (!match) return;

    const envVar = match[1];
    const filePath = line.split(':')[0];
    const isClientFile = filePath.includes('/pages/') || 
                         filePath.includes('/components/') ||
                         (filePath.includes('/app/') && !filePath.includes('/api/'));
    
    const isSensitive = SENSITIVE_PATTERNS.some(p => p.test(envVar));
    const isClientSafe = CLIENT_SAFE_PREFIXES.some(p => envVar.startsWith(p));

    const entry = {
      variable: envVar,
      file: filePath,
      line: line.split(':')[1],
      isSensitive,
      isClientSafe
    };

    if (isClientFile && isSensitive && !isClientSafe) {
      results.potentialLeak.push(entry);
    } else if (isClientFile && isClientSafe) {
      results.clientExposed.push(entry);
    } else {
      results.serverOnly.push(entry);
    }
  });

  return results;
};

// Generate report
const generateReport = (results) => {
  console.log('\n' + '='.repeat(60));
  console.log('ENVIRONMENT VARIABLE SECURITY AUDIT');
  console.log('='.repeat(60));

  if (results.potentialLeak.length > 0) {
    console.log('\n🚨 CRITICAL: POTENTIAL SECRET LEAKS TO CLIENT');
    console.log('-'.repeat(40));
    results.potentialLeak.forEach(({ variable, file, line }) => {
      console.log(`  ❌ ${variable}`);
      console.log(`     File: ${file}:${line}`);
    });
  }

  console.log('\n📊 Summary:');
  console.log(`  Server-only variables: ${results.serverOnly.length}`);
  console.log(`  Client-exposed (NEXT_PUBLIC_): ${results.clientExposed.length}`);
  console.log(`  ⚠️  Potential leaks: ${results.potentialLeak.length}`);

  // Extract unique variables
  const allVars = [...new Set([
    ...results.serverOnly.map(e => e.variable),
    ...results.clientExposed.map(e => e.variable),
    ...results.potentialLeak.map(e => e.variable)
  ])].sort();

  console.log('\n📝 All environment variables found:');
  allVars.forEach(v => console.log(`  - ${v}`));

  return results.potentialLeak.length === 0;
};

// Generate .env.example
const generateEnvExample = (results) => {
  const allVars = [...new Set([
    ...results.serverOnly.map(e => e.variable),
    ...results.clientExposed.map(e => e.variable)
  ])].sort();

  const template = `# Environment Variables Template
# Copy this file to .env.local and fill in values
# Generated: ${new Date().toISOString()}

# ===========================================
# PUBLIC VARIABLES (exposed to client browser)
# ===========================================
${allVars.filter(v => v.startsWith('NEXT_PUBLIC_')).map(v => `${v}=`).join('\n')}

# ===========================================
# SERVER-ONLY VARIABLES (never exposed to client)
# ===========================================
${allVars.filter(v => !v.startsWith('NEXT_PUBLIC_')).map(v => `${v}=`).join('\n')}
`;

  fs.writeFileSync('.env.example', template);
  console.log('\n✅ Generated .env.example');
};

// Main
const results = findEnvUsages();
const passed = generateReport(results);
generateEnvExample(results);

process.exit(passed ? 0 : 1);
