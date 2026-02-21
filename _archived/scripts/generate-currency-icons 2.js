/**
 * Generate Currency Icon SVGs
 * 
 * Creates placeholder SVG icons for all currencies using their Unicode symbols.
 * These are functional placeholders until official icons can be added.
 * 
 * Usage: node scripts/generate-currency-icons.js
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const ICONS_DIR = path.join(__dirname, '../public/icons/currencies');
const CURRENCY_SYMBOLS_FILE = path.join(__dirname, '../components/vx2/utils/formatting/currency.ts');

// ============================================================================
// SVG TEMPLATE
// ============================================================================

/**
 * Generate SVG icon from Unicode symbol
 */
function generateSVGIcon(currencyCode, unicodeSymbol) {
  // Escape HTML entities for special characters
  const escapedSymbol = unicodeSymbol
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <text 
    x="12" 
    y="16" 
    font-family="system-ui, -apple-system, sans-serif" 
    font-size="16" 
    font-weight="600" 
    text-anchor="middle" 
    fill="currentColor"
    dominant-baseline="middle"
  >${escapedSymbol}</text>
</svg>`;
}

// ============================================================================
// READ CURRENCY CONFIG
// ============================================================================

/**
 * Read currency codes and Unicode symbols from CURRENCY_SYMBOLS in currency.ts
 */
function getCurrencyData() {
  try {
    const content = fs.readFileSync(CURRENCY_SYMBOLS_FILE, 'utf8');
    const currencies = [];
    const seen = new Set();
    
    // Extract currency code and symbol from CURRENCY_SYMBOLS object
    // Pattern: "  USD: '$'," or "  ARS: '$', // comment"
    // Pattern: "  ILS: '₪'," or "  CNY: '¥', // comment"
    const regex = /^\s+([A-Z]{3}):\s*['"]([^'"]+)['"],?\s*(?:\/\/.*)?$/gm;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const code = match[1];
      const unicode = match[2];
      
      // Filter out false positives (like Record, Array, etc.)
      // Avoid duplicates
      if (code.length === 3 && 
          code.match(/^[A-Z]{3}$/) && 
          !['Record', 'Array', 'Set', 'Map'].includes(code) &&
          !seen.has(code)) {
        currencies.push({ code, unicode });
        seen.add(code);
      }
    }
    
    return currencies.sort((a, b) => a.code.localeCompare(b.code));
  } catch (error) {
    console.error('Error reading currency.ts:', error.message);
    return [];
  }
}

// ============================================================================
// GENERATE ICONS
// ============================================================================

function generateCurrencyIcons() {
  console.log('🎨 Generating Currency Icons...\n');
  
  // Ensure directory exists
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
    console.log('✅ Created icon directory\n');
  }
  
  // Get currency data
  const currencies = getCurrencyData();
  
  if (currencies.length === 0) {
    console.error('❌ No currencies found in configuration');
    process.exit(1);
  }
  
  if (currencies.length === 0) {
    console.error('❌ No currencies found in CURRENCY_SYMBOLS');
    process.exit(1);
  }
  
  console.log(`📊 Found ${currencies.length} currencies in CURRENCY_SYMBOLS\n`);
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  // Generate icon for each currency
  currencies.forEach(({ code, unicode }) => {
    const filename = `currency-${code.toLowerCase()}.svg`;
    const filepath = path.join(ICONS_DIR, filename);
    
    // Check if file already exists
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  ${code}: Already exists (${filename})`);
      skipped++;
      return;
    }
    
    try {
      const svg = generateSVGIcon(code, unicode);
      fs.writeFileSync(filepath, svg, 'utf8');
      console.log(`✅ ${code}: Created (${filename}) - Symbol: ${unicode}`);
      created++;
    } catch (error) {
      console.error(`❌ ${code}: Error - ${error.message}`);
      errors++;
    }
  });
  
  // Summary
  console.log('\n📋 Summary:');
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📁 Total: ${currencies.length}`);
  
  if (created > 0) {
    console.log('\n💡 Next Steps:');
    console.log('   1. Review generated icons');
    console.log('   2. Optimize with SVGO: npx svgo -f public/icons/currencies');
    console.log('   3. Replace with official icons when available');
    console.log('   4. Run validation: node scripts/validate-currency-icons.js');
  }
  
  if (errors > 0) {
    process.exit(1);
  }
}

// ============================================================================
// RUN
// ============================================================================

if (require.main === module) {
  generateCurrencyIcons();
}

module.exports = { generateCurrencyIcons, generateSVGIcon };

