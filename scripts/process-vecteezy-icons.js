#!/usr/bin/env node

/**
 * Process Vecteezy Currency Icons
 * 
 * Helps process downloaded Vecteezy currency icons:
 * - Renames files to currency-[code].svg format
 * - Replaces black fills with currentColor
 * - Validates and optimizes SVGs
 * 
 * Usage:
 *   node scripts/process-vecteezy-icons.js <source-dir>
 *   node scripts/process-vecteezy-icons.js ~/Downloads/currency-icons-vecteezy
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const OUTPUT_DIR = path.join(__dirname, '../public/icons/currencies');

// Currency name to code mapping (common Vecteezy naming patterns)
const CURRENCY_MAPPING = {
  // Common names
  'dollar': 'usd',
  'usd': 'usd',
  'euro': 'eur',
  'eur': 'eur',
  'yen': 'jpy',
  'jpy': 'jpy',
  'pound': 'gbp',
  'gbp': 'gbp',
  'rupee': 'inr',
  'inr': 'inr',
  'won': 'krw',
  'krw': 'krw',
  'yuan': 'cny',
  'cny': 'cny',
  'peso': 'mxn',
  'mxn': 'mxn',
  'real': 'brl',
  'brl': 'brl',
  'rand': 'zar',
  'zar': 'zar',
  'lira': 'try',
  'try': 'try',
  'ruble': 'rub',
  'rub': 'rub',
  'krona': 'sek',
  'sek': 'sek',
  'franc': 'chf',
  'chf': 'chf',
  'dinar': 'aed',
  'aed': 'aed',
  'riyal': 'sar',
  'sar': 'sar',
  'baht': 'thb',
  'thb': 'thb',
  'ringgit': 'myr',
  'myr': 'myr',
  'rupiah': 'idr',
  'idr': 'idr',
  'dong': 'vnd',
  'vnd': 'vnd',
  'shekel': 'ils',
  'ils': 'ils',
  'taka': 'bdt',
  'bdt': 'bdt',
  'hryvnia': 'uah',
  'uah': 'uah',
  'forint': 'huf',
  'huf': 'huf',
  'zloty': 'pln',
  'pln': 'pln',
  'koruna': 'czk',
  'czk': 'czk',
  'leu': 'ron',
  'ron': 'ron',
  'lev': 'bgn',
  'bgn': 'bgn',
  'kuna': 'hrk',
  'hrk': 'hrk',
  'krona-icelandic': 'isk',
  'isk': 'isk',
  'krone': 'nok',
  'nok': 'nok',
  'krone-danish': 'dkk',
  'dkk': 'dkk',
  'sol': 'pen',
  'pen': 'pen',
  'peso-chilean': 'clp',
  'clp': 'clp',
  'peso-colombian': 'cop',
  'cop': 'cop',
  'peso-dominican': 'dop',
  'dop': 'dop',
  'peso-uruguayan': 'uyu',
  'uyu': 'uyu',
  'dollar-singapore': 'sgd',
  'sgd': 'sgd',
  'dollar-hongkong': 'hkd',
  'hkd': 'hkd',
  'dollar-taiwan': 'twd',
  'twd': 'twd',
  'dollar-australian': 'aud',
  'aud': 'aud',
  'dollar-newzealand': 'nzd',
  'nzd': 'nzd',
  'dollar-canadian': 'cad',
  'cad': 'cad',
  'dollar-jamaican': 'jmd',
  'jmd': 'jmd',
  'naira': 'ngn',
  'ngn': 'ngn',
  'cedi': 'ghs',
  'ghs': 'ghs',
  'shilling-kenyan': 'kes',
  'kes': 'kes',
  'shilling-tanzanian': 'tzs',
  'tzs': 'tzs',
  'shilling-ugandan': 'ugx',
  'ugx': 'ugx',
  'dirham': 'mad',
  'mad': 'mad',
  'pound-egyptian': 'egp',
  'egp': 'egp',
};

// ============================================================================
// UTILITIES
// ============================================================================

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function extractCurrencyCode(filename) {
  // Remove extension
  const name = filename.replace(/\.(svg|SVG)$/, '').toLowerCase();
  
  // Try direct match first
  if (CURRENCY_MAPPING[name]) {
    return CURRENCY_MAPPING[name];
  }
  
  // Try patterns
  // currency-usd.svg -> usd
  const currencyMatch = name.match(/currency-([a-z]{3})/);
  if (currencyMatch) {
    return currencyMatch[1];
  }
  
  // usd.svg -> usd
  if (name.match(/^[a-z]{3}$/)) {
    return name;
  }
  
  // Try partial matches
  for (const [key, code] of Object.entries(CURRENCY_MAPPING)) {
    if (name.includes(key)) {
      return code;
    }
  }
  
  return null;
}

function processSVG(content) {
  let processed = content;
  
  // Ensure viewBox
  if (!processed.includes('viewBox')) {
    processed = processed.replace(
      /<svg([^>]*)>/,
      '<svg$1 viewBox="0 0 24 24" width="24" height="24">'
    );
  }
  
  // Replace black fills with currentColor
  processed = processed.replace(/fill="#000000"/g, 'fill="currentColor"');
  processed = processed.replace(/fill="#000"/g, 'fill="currentColor"');
  processed = processed.replace(/fill="black"/g, 'fill="currentColor"');
  processed = processed.replace(/fill='#000000'/g, "fill='currentColor'");
  processed = processed.replace(/fill='#000'/g, "fill='currentColor'");
  processed = processed.replace(/fill='black'/g, "fill='currentColor'");
  
  // Remove fixed width/height (keep viewBox for scaling)
  processed = processed.replace(/\s+width="[^"]*"/g, '');
  processed = processed.replace(/\s+height="[^"]*"/g, '');
  
  return processed;
}

// ============================================================================
// MAIN PROCESSING
// ============================================================================

function processVecteezyIcons(sourceDir) {
  console.log('🎨 Processing Vecteezy Currency Icons...\n');
  console.log(`📁 Source: ${sourceDir}`);
  console.log(`📁 Output: ${OUTPUT_DIR}\n`);
  
  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Source directory does not exist: ${sourceDir}`);
    process.exit(1);
  }
  
  ensureDir(OUTPUT_DIR);
  
  // Find all SVG files
  const files = fs.readdirSync(sourceDir).filter(f => 
    f.toLowerCase().endsWith('.svg')
  );
  
  if (files.length === 0) {
    console.error('❌ No SVG files found in source directory');
    process.exit(1);
  }
  
  console.log(`📊 Found ${files.length} SVG files\n`);
  
  const processed = [];
  const skipped = [];
  const errors = [];
  
  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const currencyCode = extractCurrencyCode(file);
    
    if (!currencyCode) {
      skipped.push({ file, reason: 'Could not determine currency code' });
      return;
    }
    
    try {
      // Read SVG content
      const content = fs.readFileSync(sourcePath, 'utf8');
      
      // Validate it's an SVG
      if (!content.includes('<svg')) {
        errors.push({ file, reason: 'Not a valid SVG file' });
        return;
      }
      
      // Process SVG
      const processedContent = processSVG(content);
      
      // Write to output
      const outputPath = path.join(OUTPUT_DIR, `currency-${currencyCode}.svg`);
      fs.writeFileSync(outputPath, processedContent, 'utf8');
      
      processed.push({ file, code: currencyCode });
      console.log(`✅ ${currencyCode.toUpperCase()}: Processed (from ${file})`);
      
    } catch (error) {
      errors.push({ file, reason: error.message });
    }
  });
  
  // Summary
  console.log('\n📋 Summary:');
  console.log(`   ✅ Processed: ${processed.length}`);
  console.log(`   ⏭️  Skipped: ${skipped.length}`);
  console.log(`   ❌ Errors: ${errors.length}\n`);
  
  if (skipped.length > 0) {
    console.log('⏭️  Skipped files (could not determine currency code):');
    skipped.forEach(({ file, reason }) => {
      console.log(`   - ${file}: ${reason}`);
    });
    console.log('\n💡 Tip: Rename files manually or add to CURRENCY_MAPPING\n');
  }
  
  if (errors.length > 0) {
    console.log('❌ Errors:');
    errors.forEach(({ file, reason }) => {
      console.log(`   - ${file}: ${reason}`);
    });
    console.log('');
  }
  
  if (processed.length > 0) {
    console.log('✅ Processed icons:');
    processed.forEach(({ code }) => {
      console.log(`   - ${code.toUpperCase()}`);
    });
    console.log('\n💡 Next steps:');
    console.log('   1. Review processed icons');
    console.log('   2. Manually process skipped files if needed');
    console.log('   3. Run: node scripts/validate-currency-icons.js');
    console.log('   4. Test in application\n');
  }
  
  return { processed, skipped, errors };
}

// ============================================================================
// RUN
// ============================================================================

if (require.main === module) {
  const sourceDir = process.argv[2];
  
  if (!sourceDir) {
    console.log(`
Process Vecteezy Currency Icons

Usage:
  node scripts/process-vecteezy-icons.js <source-dir>

Example:
  node scripts/process-vecteezy-icons.js ~/Downloads/currency-icons-vecteezy

What it does:
  1. Finds all SVG files in source directory
  2. Extracts currency code from filename
  3. Renames to currency-[code].svg format
  4. Replaces black fills with currentColor
  5. Optimizes viewBox and attributes
  6. Saves to public/icons/currencies/
    `);
    process.exit(1);
  }
  
  processVecteezyIcons(path.resolve(sourceDir));
}

module.exports = { processVecteezyIcons, extractCurrencyCode, processSVG };

