#!/usr/bin/env node

/**
 * Verify Payment Route Tests
 * 
 * Checks that all payment API routes have corresponding test files.
 * This script is used in CI to enforce test coverage for critical payment paths.
 * 
 * Phase 1: Stop the Bleeding - CODE_REVIEW_HANDOFF_REFINED.md
 */

const fs = require('fs');
const path = require('path');

// Payment route directories to check
const PAYMENT_ROUTE_PATTERNS = [
  'pages/api/stripe',
  'pages/api/paymongo',
  'pages/api/paystack',
  'pages/api/xendit',
  'pages/api/create-payment-intent.js',
];

// Test file patterns
const TEST_PATTERNS = [
  /__tests__\/.*payment.*\.test\.(js|ts|tsx)$/i,
  /__tests__\/.*payment.*\.spec\.(js|ts|tsx)$/i,
  /__tests__\/api\/.*payment.*\.test\.(js|ts|tsx)$/i,
  /__tests__\/api\/.*payment.*\.spec\.(js|ts|tsx)$/i,
];

/**
 * Find all payment route files
 */
function findPaymentRoutes() {
  const routes = [];
  const apiDir = path.join(process.cwd(), 'pages', 'api');
  
  if (!fs.existsSync(apiDir)) {
    return routes;
  }
  
  // Check specific payment directories
  const paymentDirs = ['stripe', 'paymongo', 'paystack', 'xendit'];
  paymentDirs.forEach(dir => {
    const dirPath = path.join(apiDir, dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath, { recursive: true });
      files.forEach(file => {
        if (typeof file === 'string' && /\.(js|ts|tsx)$/.test(file)) {
          routes.push(path.join(dirPath, file));
        }
      });
    }
  });
  
  // Check root payment files
  const rootPaymentFile = path.join(apiDir, 'create-payment-intent.js');
  if (fs.existsSync(rootPaymentFile)) {
    routes.push(rootPaymentFile);
  }
  
  return routes;
}

/**
 * Find all test files
 */
function findTestFiles() {
  const tests = [];
  const testDir = path.join(process.cwd(), '__tests__');
  
  if (!fs.existsSync(testDir)) {
    return tests;
  }
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (TEST_PATTERNS.some(pattern => pattern.test(filePath))) {
        tests.push(filePath);
      }
    });
  }
  
  walkDir(testDir);
  return tests;
}

/**
 * Check if a route has a corresponding test
 */
function hasTest(routePath, testFiles) {
  const routeName = path.basename(routePath, path.extname(routePath));
  const routeDir = path.dirname(routePath);
  
  // Check if any test file matches this route
  return testFiles.some(testPath => {
    const testName = path.basename(testPath, path.extname(testPath));
    const testDir = path.dirname(testPath);
    
    // Match by name (e.g., payment-intent.ts -> payment-intent.test.ts)
    if (testName.toLowerCase().includes(routeName.toLowerCase())) {
      return true;
    }
    
    // Match by directory structure
    const relativeRoute = path.relative(path.join(process.cwd(), 'pages', 'api'), routeDir);
    const relativeTest = path.relative(path.join(process.cwd(), '__tests__'), testDir);
    
    if (relativeTest.includes(relativeRoute) || relativeTest.includes(routeName)) {
      return true;
    }
    
    return false;
  });
}

/**
 * Main verification function
 */
function verifyPaymentTests() {
  console.log('🔍 Verifying payment route test coverage...\n');
  
  const routes = findPaymentRoutes();
  const tests = findTestFiles();
  
  console.log(`Found ${routes.length} payment route(s)`);
  console.log(`Found ${tests.length} payment test file(s)\n`);
  
  const missingTests = [];
  
  routes.forEach(route => {
    const relativeRoute = path.relative(process.cwd(), route);
    if (!hasTest(route, tests)) {
      missingTests.push(relativeRoute);
      console.log(`❌ Missing test: ${relativeRoute}`);
    } else {
      console.log(`✅ Has test: ${relativeRoute}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (missingTests.length > 0) {
    console.log(`\n❌ FAILED: ${missingTests.length} payment route(s) missing tests:`);
    missingTests.forEach(route => {
      console.log(`   - ${route}`);
    });
    console.log('\n💡 Action required: Add tests for all payment routes before merging.');
    console.log('   See CODE_REVIEW_HANDOFF_REFINED.md Phase 1 for details.\n');
    process.exit(1);
  } else {
    console.log('\n✅ SUCCESS: All payment routes have tests!\n');
    process.exit(0);
  }
}

// Run verification
verifyPaymentTests();
