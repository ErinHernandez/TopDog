/**
 * Currency Icons Validation Script
 * 
 * Validates that all currency icons exist and are properly configured.
 * 
 * Usage: node scripts/validate-currency-icons.js
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CURRENCY_ICONS_CONFIG = path.join(__dirname, '../lib/stripe/currencyIcons.ts');
const ICONS_DIR = path.join(__dirname, '../public/icons/currencies');
const CURRENCY_CONFIG = path.join(__dirname, '../lib/stripe/currencyConfig.ts');
const CURRENCY_SYMBOLS_FILE = path.join(__dirname, '../components/vx2/utils/formatting/currency.ts');

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Read currency codes from currencyConfig.ts (TypeScript file)
 * Uses regex to extract currency codes from object definition
 */
function getCurrencyCodesFromConfig() {
  try {
    const content = fs.readFileSync(CURRENCY_CONFIG, 'utf8');
    // Extract currency codes from CURRENCY_CONFIG object
    // Pattern matches: "  USD: {" or "  EUR: {" (with whitespace)
    const matches = content.matchAll(/^\s+([A-Z]{3}):\s*\{/gm);
    const codes = Array.from(matches, m => m[1]);
    
    // Filter out false positives (like "Record" in type definitions)
    const validCodes = codes.filter(code => 
      code.length === 3 && 
      code.match(/^[A-Z]{3}$/) &&
      !['Record', 'Array', 'Set'].includes(code)
    );
    
    return validCodes.sort();
  } catch (error) {
    console.error('Error reading currencyConfig.ts:', error.message);
    return [];
  }
}

/**
 * Read currency codes from currencyIcons.ts (TypeScript file)
 * Uses regex to extract currency codes from object definition
 */
function getCurrencyCodesFromIcons() {
  try {
    const content = fs.readFileSync(CURRENCY_ICONS_CONFIG, 'utf8');
    // Extract currency codes from CURRENCY_ICONS object
    // Pattern matches: "  USD: {" or "  EUR: {" (with whitespace)
    const matches = content.matchAll(/^\s+([A-Z]{3}):\s*\{/gm);
    const codes = Array.from(matches, m => m[1]);
    
    // Filter out false positives
    const validCodes = codes.filter(code => 
      code.length === 3 && 
      code.match(/^[A-Z]{3}$/) &&
      !['Record', 'Array', 'Set'].includes(code)
    );
    
    return validCodes.sort();
  } catch (error) {
    console.error('Error reading currencyIcons.ts:', error.message);
    return [];
  }
}

/**
 * Read currency codes from CURRENCY_SYMBOLS in currency.ts (TypeScript file)
 * This is the source of truth for all supported currencies
 */
function getCurrencyCodesFromSymbols() {
  try {
    const content = fs.readFileSync(CURRENCY_SYMBOLS_FILE, 'utf8');
    const codes = [];
    const seen = new Set();
    
    // Extract currency codes from CURRENCY_SYMBOLS object
    // Pattern: "  USD: '$'," or "  ARS: '$', // comment"
    const regex = /^\s+([A-Z]{3}):\s*['"]([^'"]+)['"],?\s*(?:\/\/.*)?$/gm;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const code = match[1];
      
      // Filter out false positives and avoid duplicates
      if (code.length === 3 && 
          code.match(/^[A-Z]{3}$/) &&
          !['Record', 'Array', 'Set', 'Map'].includes(code) &&
          !seen.has(code)) {
        codes.push(code);
        seen.add(code);
      }
    }
    
    return codes.sort();
  } catch (error) {
    console.error('Error reading currency.ts:', error.message);
    return [];
  }
}

/**
 * Check if icon file exists
 */
function iconFileExists(currencyCode) {
  const iconPath = path.join(ICONS_DIR, `currency-${currencyCode.toLowerCase()}.svg`);
  return fs.existsSync(iconPath);
}

/**
 * Validate SVG file structure
 */
function validateSVG(currencyCode) {
  const iconPath = path.join(ICONS_DIR, `currency-${currencyCode.toLowerCase()}.svg`);
  
  if (!fs.existsSync(iconPath)) {
    return { valid: false, error: 'File does not exist' };
  }
  
  try {
    const content = fs.readFileSync(iconPath, 'utf8');
    
    // Basic SVG validation
    if (!content.includes('<svg')) {
      return { valid: false, error: 'Not a valid SVG file' };
    }
    
    // Check file size (should be reasonable)
    const stats = fs.statSync(iconPath);
    if (stats.size > 100000) { // 100KB
      return { valid: false, error: `File too large: ${stats.size} bytes` };
    }
    
    if (stats.size < 50) { // Too small
      return { valid: false, error: `File too small: ${stats.size} bytes` };
    }
    
    return { valid: true, size: stats.size };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Get icon file size
 */
function getIconFileSize(currencyCode) {
  const iconPath = path.join(ICONS_DIR, `currency-${currencyCode.toLowerCase()}.svg`);
  
  if (!fs.existsSync(iconPath)) {
    return null;
  }
  
  try {
    const stats = fs.statSync(iconPath);
    return stats.size;
  } catch {
    return null;
  }
}

// ============================================================================
// MAIN VALIDATION
// ============================================================================

function validateCurrencyIcons() {
  console.log('🔍 Validating Currency Icons...\n');
  
  // Get currency codes from all sources
  const configCodes = getCurrencyCodesFromConfig();
  const iconCodes = getCurrencyCodesFromIcons();
  const symbolCodes = getCurrencyCodesFromSymbols();
  
  console.log(`📊 Statistics:`);
  console.log(`   - Currencies in currencyConfig.ts (transaction support): ${configCodes.length}`);
  console.log(`   - Currencies in currencyIcons.ts (icon config): ${iconCodes.length}`);
  console.log(`   - Currencies in CURRENCY_SYMBOLS (all supported): ${symbolCodes.length}`);
  console.log(`   - Icon directory: ${ICONS_DIR}`);
  console.log(`   - Icon directory exists: ${fs.existsSync(ICONS_DIR) ? '✅' : '❌'}\n`);
  
  // Check if icon directory exists
  if (!fs.existsSync(ICONS_DIR)) {
    console.log('❌ Icon directory does not exist. Creating...');
    fs.mkdirSync(ICONS_DIR, { recursive: true });
    console.log('✅ Icon directory created.\n');
  }
  
  // Find missing currencies in currencyIcons.ts
  const missingInIcons = configCodes.filter(code => !iconCodes.includes(code));
  if (missingInIcons.length > 0) {
    console.log('⚠️  Currencies in currencyConfig.ts but NOT in currencyIcons.ts:');
    missingInIcons.forEach(code => console.log(`   - ${code}`));
    console.log('');
  }
  
  // Find extra currencies in currencyIcons.ts (not in CURRENCY_SYMBOLS)
  const extraInIcons = iconCodes.filter(code => !symbolCodes.includes(code));
  if (extraInIcons.length > 0) {
    console.log('⚠️  Currencies in currencyIcons.ts but NOT in CURRENCY_SYMBOLS:');
    extraInIcons.forEach(code => console.log(`   - ${code}`));
    console.log('');
  }
  
  // Find currencies in CURRENCY_SYMBOLS but not in currencyIcons.ts
  const missingFromIcons = symbolCodes.filter(code => !iconCodes.includes(code));
  if (missingFromIcons.length > 0) {
    console.log(`ℹ️  Currencies in CURRENCY_SYMBOLS but NOT in currencyIcons.ts: ${missingFromIcons.length}`);
    console.log('   (These will use fallback to getCurrencySymbol())\n');
  }
  
  // Validate icon files - check all currencies in CURRENCY_SYMBOLS
  console.log('📁 Icon File Validation (checking all currencies in CURRENCY_SYMBOLS):\n');
  
  const missingIcons = [];
  const invalidIcons = [];
  const validIcons = [];
  const iconSizes = [];
  
  symbolCodes.forEach(code => {
    const exists = iconFileExists(code);
    const validation = exists ? validateSVG(code) : { valid: false, error: 'File missing' };
    const size = getIconFileSize(code);
    
    if (!exists) {
      missingIcons.push(code);
      console.log(`❌ ${code}: Missing icon file`);
    } else if (!validation.valid) {
      invalidIcons.push({ code, error: validation.error });
      console.log(`⚠️  ${code}: ${validation.error}`);
    } else {
      validIcons.push(code);
      iconSizes.push({ code, size: validation.size });
      console.log(`✅ ${code}: Valid (${validation.size} bytes)`);
    }
  });
  
  // Summary
  console.log('\n📋 Summary:');
  console.log(`   ✅ Valid icons: ${validIcons.length}/${symbolCodes.length} (all currencies in CURRENCY_SYMBOLS)`);
  console.log(`   ❌ Missing icons: ${missingIcons.length}`);
  console.log(`   ⚠️  Invalid icons: ${invalidIcons.length}`);
  console.log(`\n   📊 Breakdown:`);
  console.log(`   - Transaction currencies (currencyConfig.ts): ${configCodes.length}`);
  console.log(`   - Display currencies (CURRENCY_SYMBOLS): ${symbolCodes.length}`);
  console.log(`   - Additional display-only currencies: ${symbolCodes.length - configCodes.length}`);
  
  if (iconSizes.length > 0) {
    const avgSize = iconSizes.reduce((sum, item) => sum + item.size, 0) / iconSizes.length;
    const maxSize = Math.max(...iconSizes.map(item => item.size));
    const minSize = Math.min(...iconSizes.map(item => item.size));
    
    console.log(`\n📏 Icon File Sizes:`);
    console.log(`   - Average: ${Math.round(avgSize)} bytes`);
    console.log(`   - Largest: ${maxSize} bytes (${iconSizes.find(item => item.size === maxSize)?.code})`);
    console.log(`   - Smallest: ${minSize} bytes (${iconSizes.find(item => item.size === minSize)?.code})`);
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (missingIcons.length > 0) {
    console.log(`   - Create ${missingIcons.length} missing icon files`);
    console.log(`   - Missing: ${missingIcons.join(', ')}`);
  }
  
  if (invalidIcons.length > 0) {
    console.log(`   - Fix ${invalidIcons.length} invalid icon files`);
    invalidIcons.forEach(({ code, error }) => {
      console.log(`     - ${code}: ${error}`);
    });
  }
  
  if (iconSizes.length > 0) {
    const largeIcons = iconSizes.filter(item => item.size > 10000);
    if (largeIcons.length > 0) {
      console.log(`   - Optimize ${largeIcons.length} large icon files (>10KB)`);
      largeIcons.forEach(item => {
        console.log(`     - ${item.code}: ${item.size} bytes`);
      });
    }
  }
  
  // Exit code
  const hasErrors = missingIcons.length > 0 || invalidIcons.length > 0;
  if (hasErrors) {
    console.log('\n❌ Validation failed. Please fix the issues above.');
    process.exit(1);
  } else {
    console.log('\n✅ All currency icons are valid!');
    process.exit(0);
  }
}

// ============================================================================
// RUN VALIDATION
// ============================================================================

if (require.main === module) {
  validateCurrencyIcons();
}

module.exports = { validateCurrencyIcons };

