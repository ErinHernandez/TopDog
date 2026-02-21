#!/usr/bin/env node

/**
 * Dev Hours & Cost Measurement Script
 * 
 * Scans the codebase, analyzes files for complexity, estimates hours,
 * and calculates costs using role-based rates.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  // Role-based hourly rates
  hourlyRates: {
    frontend: 90,
    backend: 110,
    fullstack: 100,
    infrastructure: 120,
  },
  
  // Lines per hour by role
  linesPerHour: {
    frontend: 62.5,
    backend: 50,
    fullstack: 55,
    infrastructure: 40,
  },
  
  // Complexity multipliers
  complexityMultipliers: {
    simple: 0.8,    // 1-3
    medium: 1.0,    // 4-6
    complex: 1.5,   // 7-8
    veryComplex: 2.5, // 9-10
  },
  
  // Work type multipliers
  workTypeMultipliers: {
    feature: 1.0,
    refactoring: 0.7,
    integration: 1.3,
    infrastructure: 1.2,
    testing: 0.5,
    bugfix: 0.6,
    research: 0.4,
    polish: 0.9,
  },
  
  // Additional time percentages
  additionalTime: {
    testing: 0.20,
    documentation: 0.10,
    codeReview: 0.15,
    debugging: 0.25,
  },
  
  // Directories to scan
  scanDirs: [
    'components',
    'pages',
    'lib',
    'hooks',
    'types',
    'scripts',
    'styles',
  ],
  
  // File extensions to analyze
  codeExtensions: ['.js', '.jsx', '.ts', '.tsx', '.css'],
  
  // Files to exclude
  excludePatterns: [
    'node_modules',
    '.next',
    '.git',
    'dist',
    'build',
    '__tests__',
    'cypress',
    '.cursor',
  ],
};

// Feature area mappings
const FEATURE_AREAS = {
  'draft': ['draft', 'draft-room', 'draftRoom'],
  'payment': ['payment', 'stripe', 'paystack', 'paymongo', 'xendit'],
  'auth': ['auth', 'authentication', 'login', 'signup'],
  'tournament': ['tournament', 'tournaments'],
  'mobile': ['mobile', 'Mobile'],
  'tablet': ['tablet', 'Tablet'],
  'vx2': ['vx2', 'VX2'],
  'vx': ['vx/', 'vx/'],
  'legacy': ['legacy'],
  'user': ['user', 'profile', 'User'],
  'player': ['player', 'Player'],
  'exposure': ['exposure', 'Exposure'],
  'analytics': ['analytics', 'Analytics'],
};

/**
 * Get lines of code for a file
 */
function getLinesOfCode(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch (error) {
    return 0;
  }
}

/**
 * Read file content
 */
function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return '';
  }
}

/**
 * Classify file by role
 */
function classifyRole(filePath, content) {
  const pathLower = filePath.toLowerCase();
  
  // API routes are full-stack
  if (pathLower.includes('/api/') || pathLower.includes('pages/api/')) {
    return 'fullstack';
  }
  
  // Pages are full-stack
  if (pathLower.includes('pages/') && !pathLower.includes('pages/api/')) {
    return 'fullstack';
  }
  
  // Scripts are backend/infrastructure
  if (pathLower.includes('scripts/')) {
    return 'infrastructure';
  }
  
  // Config files are infrastructure
  if (filePath.match(/\.config\.(js|ts|json)$/)) {
    return 'infrastructure';
  }
  
  // Lib utilities - check content
  if (pathLower.includes('lib/')) {
    // Check for API calls, Firebase admin, etc.
    if (content.includes('firebase-admin') || 
        content.includes('fetch(') || 
        content.includes('axios') ||
        content.includes('stripe') ||
        content.includes('paystack') ||
        content.includes('xendit') ||
        content.includes('paymongo')) {
      return 'backend';
    }
    return 'fullstack';
  }
  
  // Components and hooks are frontend
  if (pathLower.includes('components/') || pathLower.includes('hooks/')) {
    return 'frontend';
  }
  
  // Types are full-stack
  if (pathLower.includes('types/')) {
    return 'fullstack';
  }
  
  // CSS is frontend
  if (filePath.endsWith('.css')) {
    return 'frontend';
  }
  
  return 'fullstack';
}

/**
 * Classify file by type
 */
function classifyType(filePath) {
  const pathLower = filePath.toLowerCase();
  const fileName = path.basename(filePath);
  
  if (pathLower.includes('/api/')) {
    return 'API Route';
  }
  
  if (pathLower.includes('pages/') && !pathLower.includes('pages/api/')) {
    return 'Page';
  }
  
  if (pathLower.includes('components/')) {
    return 'Component';
  }
  
  if (pathLower.includes('hooks/')) {
    return 'Hook';
  }
  
  if (pathLower.includes('lib/')) {
    return 'Utility';
  }
  
  if (pathLower.includes('types/')) {
    return 'Type';
  }
  
  if (pathLower.includes('scripts/')) {
    return 'Script';
  }
  
  if (filePath.endsWith('.css')) {
    return 'Style';
  }
  
  if (fileName.match(/\.config\.(js|ts|json)$/)) {
    return 'Config';
  }
  
  return 'Other';
}

/**
 * Calculate complexity score
 */
function calculateComplexity(filePath, content, loc) {
  let score = 0;
  
  // A. Lines of Code
  if (loc <= 50) score += 1;
  else if (loc <= 150) score += 2;
  else if (loc <= 300) score += 3;
  else if (loc <= 500) score += 4;
  else if (loc <= 1000) score += 5;
  else score += 6;
  
  // B. Technical Complexity
  const hasState = /useState|useReducer|useContext|redux|mobx/i.test(content);
  const hasAPI = /fetch\(|axios\.|\.get\(|\.post\(|api\./i.test(content);
  const hasRealtime = /onSnapshot|on\(|websocket|socket\.io|listener/i.test(content);
  const hasAlgorithms = /function.*sort|function.*filter|function.*reduce|algorithm|recursive/i.test(content);
  const hasPayment = /stripe|paystack|paymongo|xendit|payment|transaction/i.test(content);
  const hasSecurity = /auth|authentication|security|encrypt|hash|jwt|token/i.test(content);
  const hasMultiProvider = /provider|router|strategy|factory.*provider/i.test(content);
  
  if (hasMultiProvider && (hasPayment || hasSecurity)) score += 5;
  else if (hasPayment || hasSecurity) score += 5;
  else if (hasRealtime) score += 4;
  else if (hasAlgorithms) score += 4;
  else if (hasAPI) score += 3;
  else if (hasState) score += 2;
  else score += 1;
  
  // C. Integration Complexity
  const importCount = (content.match(/^import\s+.*from\s+['"]/gm) || []).length;
  const hasFirebase = /firebase|firestore/i.test(content);
  const hasMultiplePayments = (content.match(/stripe|paystack|paymongo|xendit/gi) || []).length >= 2;
  const hasExternalAPI = /sportsdataio|espn|nfl\.com|api\./i.test(content);
  
  if (hasMultiplePayments) score += 5;
  else if (importCount >= 6) score += 4;
  else if (importCount >= 3) score += 3;
  else if (hasFirebase || hasExternalAPI) score += 3;
  else if (importCount >= 1) score += 2;
  else score += 1;
  
  // D. Business Logic Complexity
  const hasDraftLogic = /draft.*pick|snake.*draft|pick.*number|draft.*position|adp|autodraft/i.test(content);
  const hasTournament = /tournament|league|season/i.test(content);
  const hasPaymentRouting = /payment.*router|provider.*select|country.*payment/i.test(content);
  const hasFraud = /fraud|risk|detection|suspicious/i.test(content);
  const hasADP = /adp|average.*position|draft.*position/i.test(content);
  const hasCalculations = /calculate|compute|formula|algorithm/i.test(content);
  
  if (hasPaymentRouting || hasFraud) score += 5;
  else if (hasDraftLogic || hasTournament) score += 4;
  else if (hasADP) score += 4;
  else if (hasCalculations) score += 2;
  else score += 1;
  
  // E. Testing & Quality
  const hasTests = /\.test\.|\.spec\.|describe\(|it\(|test\(/i.test(filePath);
  if (hasTests) {
    const testComplexity = (content.match(/describe\(|it\(|test\(/g) || []).length;
    if (testComplexity >= 10) score += 3;
    else if (testComplexity >= 5) score += 2;
    else score += 1;
  }
  
  // Normalize to 1-10 scale (max score is ~25, so divide by 2.5)
  const normalizedScore = Math.min(10, Math.max(1, Math.round(score / 2.5)));
  
  return normalizedScore;
}

/**
 * Get complexity category
 */
function getComplexityCategory(score) {
  if (score <= 3) return 'Simple';
  if (score <= 6) return 'Medium';
  if (score <= 8) return 'Complex';
  return 'Very Complex';
}

/**
 * Classify work type
 */
function classifyWorkType(filePath, content) {
  const pathLower = filePath.toLowerCase();
  const fileName = path.basename(filePath);
  
  // Documentation
  if (filePath.endsWith('.md')) {
    return { primary: 'research', secondary: null };
  }
  
  // Tests
  if (filePath.includes('.test.') || filePath.includes('.spec.')) {
    return { primary: 'testing', secondary: null };
  }
  
  // Config files
  if (fileName.match(/\.config\.(js|ts|json)$/) || fileName === 'package.json') {
    return { primary: 'infrastructure', secondary: null };
  }
  
  // VX2 migration files
  if (pathLower.includes('vx2/') && !pathLower.includes('vx/')) {
    return { primary: 'feature', secondary: 'refactoring' };
  }
  
  // Payment provider files
  if (pathLower.includes('payment') && 
      (pathLower.includes('stripe') || pathLower.includes('paystack') || 
       pathLower.includes('paymongo') || pathLower.includes('xendit'))) {
    return { primary: 'integration', secondary: 'feature' };
  }
  
  // Firebase integration
  if (content.includes('firebase') && (content.includes('initialize') || content.includes('config'))) {
    return { primary: 'integration', secondary: 'infrastructure' };
  }
  
  // Draft logic
  if (pathLower.includes('draft') && (content.includes('pick') || content.includes('snake'))) {
    return { primary: 'feature', secondary: null };
  }
  
  // Scripts
  if (pathLower.includes('scripts/')) {
    return { primary: 'infrastructure', secondary: null };
  }
  
  // Default to feature development
  return { primary: 'feature', secondary: null };
}

/**
 * Detect feature areas
 */
function detectFeatureAreas(filePath) {
  const pathLower = filePath.toLowerCase();
  const areas = [];
  
  for (const [area, keywords] of Object.entries(FEATURE_AREAS)) {
    if (keywords.some(keyword => pathLower.includes(keyword.toLowerCase()))) {
      areas.push(area);
    }
  }
  
  return areas.length > 0 ? areas : ['general'];
}

/**
 * Estimate hours
 */
function estimateHours(loc, role, complexityScore, workType) {
  const linesPerHour = CONFIG.linesPerHour[role] || 55;
  const complexityCategory = getComplexityCategory(complexityScore);
  const complexityMultiplier = CONFIG.complexityMultipliers[complexityCategory.toLowerCase().replace(' ', '')] || 1.0;
  
  // Base hours
  const baseHours = (loc / linesPerHour) * complexityMultiplier;
  
  // Work type multiplier
  const workTypeMultiplier = CONFIG.workTypeMultipliers[workType.primary] || 1.0;
  const adjustedHours = baseHours * workTypeMultiplier;
  
  // Additional time
  const testingTime = adjustedHours * CONFIG.additionalTime.testing;
  const docTime = adjustedHours * CONFIG.additionalTime.documentation;
  const reviewTime = adjustedHours * CONFIG.additionalTime.codeReview;
  const debugTime = adjustedHours * CONFIG.additionalTime.debugging;
  
  const totalHours = adjustedHours + testingTime + docTime + reviewTime + debugTime;
  
  return {
    baseHours: Math.round(baseHours * 100) / 100,
    adjustedHours: Math.round(adjustedHours * 100) / 100,
    totalHours: Math.round(totalHours * 100) / 100,
  };
}

/**
 * Calculate cost
 */
function calculateCost(hours, role) {
  const hourlyRate = CONFIG.hourlyRates[role] || 100;
  return Math.round(hours * hourlyRate * 100) / 100;
}

/**
 * Get technology stack
 */
function getTechnology(filePath) {
  if (filePath.endsWith('.tsx')) return 'TypeScript/TSX';
  if (filePath.endsWith('.ts')) return 'TypeScript';
  if (filePath.endsWith('.jsx')) return 'JavaScript/JSX';
  if (filePath.endsWith('.js')) return 'JavaScript';
  if (filePath.endsWith('.css')) return 'CSS';
  return 'Other';
}

/**
 * Scan directory recursively
 */
function scanDirectory(dirPath, basePath, files = []) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(basePath, fullPath);
      
      // Skip excluded patterns
      if (CONFIG.excludePatterns.some(pattern => relativePath.includes(pattern))) {
        continue;
      }
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath, basePath, files);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (CONFIG.codeExtensions.includes(ext) || entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dirPath}:`, error.message);
  }
  
  return files;
}

/**
 * Analyze a single file
 */
function analyzeFile(filePath, basePath) {
  const relativePath = path.relative(basePath, filePath);
  const content = readFileContent(filePath);
  const loc = getLinesOfCode(filePath);
  
  if (loc === 0) return null;
  
  const role = classifyRole(filePath, content);
  const type = classifyType(filePath);
  const technology = getTechnology(filePath);
  const complexityScore = calculateComplexity(filePath, content, loc);
  const complexityCategory = getComplexityCategory(complexityScore);
  const workType = classifyWorkType(filePath, content);
  const featureAreas = detectFeatureAreas(filePath);
  
  const hours = estimateHours(loc, role, complexityScore, workType);
  const hourlyRate = CONFIG.hourlyRates[role] || 100;
  const cost = calculateCost(hours.totalHours, role);
  
  return {
    filePath: relativePath,
    fileName: path.basename(filePath),
    loc,
    role,
    type,
    technology,
    complexityScore,
    complexityCategory,
    workTypePrimary: workType.primary,
    workTypeSecondary: workType.secondary || '',
    featureAreas: featureAreas.join(', '),
    baseHours: hours.baseHours,
    adjustedHours: hours.adjustedHours,
    totalHours: hours.totalHours,
    hourlyRate,
    cost,
  };
}

/**
 * Main execution
 */
function main() {
  const basePath = process.cwd();
  console.log('Scanning codebase...');
  console.log(`Base path: ${basePath}\n`);
  
  const allFiles = [];
  
  // Scan configured directories
  for (const dir of CONFIG.scanDirs) {
    const dirPath = path.join(basePath, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`Scanning ${dir}...`);
      const files = scanDirectory(dirPath, basePath);
      allFiles.push(...files);
      console.log(`  Found ${files.length} files`);
    }
  }
  
  // Also scan root level config files
  const rootFiles = [
    'next.config.js',
    'tailwind.config.js',
    'postcss.config.js',
    'babel.config.js',
    'jest.config.js',
    'tsconfig.json',
    'package.json',
    'firestore.rules',
    'firestore.indexes.json',
  ];
  
  for (const fileName of rootFiles) {
    const filePath = path.join(basePath, fileName);
    if (fs.existsSync(filePath)) {
      allFiles.push(filePath);
    }
  }
  
  console.log(`\nTotal files to analyze: ${allFiles.length}\n`);
  console.log('Analyzing files...\n');
  
  const results = [];
  let processed = 0;
  
  for (const filePath of allFiles) {
    const result = analyzeFile(filePath, basePath);
    if (result) {
      results.push(result);
    }
    processed++;
    if (processed % 50 === 0) {
      process.stdout.write(`  Processed ${processed}/${allFiles.length} files...\r`);
    }
  }
  
  console.log(`\n  Processed ${processed} files\n`);
  
  // Generate CSV
  const csvPath = path.join(basePath, 'dev-hours-inventory.csv');
  const csvHeader = [
    'File Path',
    'File Name',
    'LOC',
    'Role',
    'Type',
    'Technology',
    'Complexity Score',
    'Complexity Category',
    'Work Type (Primary)',
    'Work Type (Secondary)',
    'Feature Areas',
    'Base Hours',
    'Adjusted Hours',
    'Total Hours',
    'Hourly Rate',
    'Cost',
  ].join(',');
  
  const csvRows = results.map(r => [
    `"${r.filePath}"`,
    `"${r.fileName}"`,
    r.loc,
    r.role,
    `"${r.type}"`,
    `"${r.technology}"`,
    r.complexityScore,
    r.complexityCategory,
    r.workTypePrimary,
    r.workTypeSecondary,
    `"${r.featureAreas}"`,
    r.baseHours,
    r.adjustedHours,
    r.totalHours,
    r.hourlyRate,
    r.cost,
  ].join(','));
  
  const csvContent = [csvHeader, ...csvRows].join('\n');
  fs.writeFileSync(csvPath, csvContent);
  console.log(`CSV report generated: ${csvPath}`);
  
  // Generate JSON
  const jsonPath = path.join(basePath, 'dev-hours-inventory.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`JSON report generated: ${jsonPath}`);
  
  // Print summary
  const totalHours = results.reduce((sum, r) => sum + r.totalHours, 0);
  const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
  const totalLOC = results.reduce((sum, r) => sum + r.loc, 0);
  
  console.log('\n=== SUMMARY ===');
  console.log(`Total Files: ${results.length}`);
  console.log(`Total LOC: ${totalLOC.toLocaleString()}`);
  console.log(`Total Hours: ${totalHours.toFixed(2)}`);
  console.log(`Total Cost: $${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  
  // Breakdown by role
  console.log('\n=== BY ROLE ===');
  const byRole = {};
  results.forEach(r => {
    if (!byRole[r.role]) {
      byRole[r.role] = { hours: 0, cost: 0, count: 0 };
    }
    byRole[r.role].hours += r.totalHours;
    byRole[r.role].cost += r.cost;
    byRole[r.role].count += 1;
  });
  
  for (const [role, data] of Object.entries(byRole)) {
    console.log(`${role}: ${data.count} files, ${data.hours.toFixed(2)} hours, $${data.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  }
  
  console.log('\nAnalysis complete!');
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { analyzeFile, calculateComplexity, estimateHours };

