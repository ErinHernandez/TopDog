#!/usr/bin/env node

/**
 * Firestore Rules Validation Script
 * 
 * Validates that production Firestore rules are being used, not development rules.
 * This should be run before deployment to prevent deploying permissive rules.
 */

const fs = require('fs');
const path = require('path');

const DEVELOPMENT_RULES_PATH = path.join(__dirname, '..', 'firestore.rules');
const PRODUCTION_RULES_PATH = path.join(__dirname, '..', 'firestore.rules.production');

// Patterns that indicate development rules (permissive)
const DEVELOPMENT_PATTERNS = [
  /allow read, write: if true/,
  /match \/\{document=\*\*\}/,
  /WARNING.*development.*production/i,
];

function validateFirestoreRules() {
  console.log('🔍 Validating Firestore rules...\n');
  
  // Check if files exist
  if (!fs.existsSync(DEVELOPMENT_RULES_PATH)) {
    console.error('❌ ERROR: firestore.rules file not found');
    process.exit(1);
  }
  
  if (!fs.existsSync(PRODUCTION_RULES_PATH)) {
    console.error('❌ ERROR: firestore.rules.production file not found');
    process.exit(1);
  }
  
  // Read current rules file
  const currentRules = fs.readFileSync(DEVELOPMENT_RULES_PATH, 'utf8');
  const productionRules = fs.readFileSync(PRODUCTION_RULES_PATH, 'utf8');
  
  // Check if current rules contain development patterns
  const hasDevelopmentPatterns = DEVELOPMENT_PATTERNS.some(pattern => 
    pattern.test(currentRules)
  );
  
  if (hasDevelopmentPatterns) {
    console.error('❌ CRITICAL SECURITY ERROR:');
    console.error('   Development Firestore rules detected in firestore.rules!');
    console.error('   These rules allow unrestricted access to all documents.');
    console.error('\n⚠️  DO NOT DEPLOY TO PRODUCTION with these rules!\n');
    console.error('To fix:');
    console.error('  1. Copy production rules: cp firestore.rules.production firestore.rules');
    console.error('  2. Verify rules are correct');
    console.error('  3. Deploy: firebase deploy --only firestore:rules\n');
    process.exit(1);
  }
  
  // Verify production rules don't have development patterns
  const productionHasDevPatterns = DEVELOPMENT_PATTERNS.some(pattern => 
    pattern.test(productionRules)
  );
  
  if (productionHasDevPatterns) {
    console.error('❌ ERROR: Production rules file contains development patterns!');
    console.error('   Please review firestore.rules.production');
    process.exit(1);
  }
  
  // Check that production rules require authentication
  if (!productionRules.includes('request.auth')) {
    console.warn('⚠️  WARNING: Production rules may not require authentication');
    console.warn('   Please review firestore.rules.production');
  }
  
  console.log('✅ Firestore rules validation passed');
  console.log('   Current rules appear to be production-ready\n');
  
  return true;
}

// Run validation
if (require.main === module) {
  try {
    validateFirestoreRules();
    process.exit(0);
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

module.exports = { validateFirestoreRules };

