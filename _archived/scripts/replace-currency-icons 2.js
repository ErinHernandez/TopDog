/**
 * Currency Icons Replacement Helper
 * 
 * Assists with replacing placeholder currency icons with designed icons.
 * Provides validation, backup, and replacement utilities.
 * 
 * Usage:
 *   node scripts/replace-currency-icons.js --backup
 *   node scripts/replace-currency-icons.js --validate
 *   node scripts/replace-currency-icons.js --list-missing
 *   node scripts/replace-currency-icons.js --check-source <source-dir>
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const ICONS_DIR = path.join(__dirname, '../public/icons/currencies');
const BACKUP_DIR = path.join(__dirname, '../public/icons/currencies-backup');
const CURRENCY_SYMBOLS_FILE = path.join(__dirname, '../components/vx2/utils/formatting/currency.ts');
const CURRENCY_ICONS_CONFIG = path.join(__dirname, '../lib/stripe/currencyIcons.ts');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all currency codes from CURRENCY_SYMBOLS
 */
function getAllCurrencyCodes() {
  try {
    const content = fs.readFileSync(CURRENCY_SYMBOLS_FILE, 'utf8');
    const codes = [];
    const seen = new Set();
    
    const regex = /^\s+([A-Z]{3}):\s*['"]([^'"]+)['"],?\s*(?:\/\/.*)?$/gm;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const code = match[1];
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
function iconExists(currencyCode) {
  const iconPath = path.join(ICONS_DIR, `currency-${currencyCode.toLowerCase()}.svg`);
  return fs.existsSync(iconPath);
}

/**
 * Check if icon is placeholder (contains Unicode text element)
 */
function isPlaceholder(currencyCode) {
  const iconPath = path.join(ICONS_DIR, `currency-${currencyCode.toLowerCase()}.svg`);
  
  if (!fs.existsSync(iconPath)) {
    return false;
  }
  
  try {
    const content = fs.readFileSync(iconPath, 'utf8');
    // Placeholder icons contain <text> elements with currency symbols
    return content.includes('<text') && content.includes('font-family');
  } catch {
    return false;
  }
}

/**
 * Validate SVG file
 */
function validateSVG(currencyCode) {
  const iconPath = path.join(ICONS_DIR, `currency-${currencyCode.toLowerCase()}.svg`);
  
  if (!fs.existsSync(iconPath)) {
    return { valid: false, error: 'File missing' };
  }
  
  try {
    const content = fs.readFileSync(iconPath, 'utf8');
    
    if (!content.includes('<svg')) {
      return { valid: false, error: 'Not a valid SVG' };
    }
    
    const stats = fs.statSync(iconPath);
    if (stats.size > 100000) {
      return { valid: false, error: `File too large: ${stats.size} bytes` };
    }
    
    if (stats.size < 50) {
      return { valid: false, error: `File too small: ${stats.size} bytes` };
    }
    
    return { valid: true, size: stats.size, isPlaceholder: isPlaceholder(currencyCode) };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Create backup of current icons
 */
function createBackup() {
  console.log('📦 Creating backup of current icons...\n');
  
  if (!fs.existsSync(ICONS_DIR)) {
    console.error('❌ Icon directory does not exist');
    return false;
  }
  
  try {
    // Remove old backup if exists
    if (fs.existsSync(BACKUP_DIR)) {
      fs.rmSync(BACKUP_DIR, { recursive: true });
    }
    
    // Create backup directory
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    
    // Copy all icons
    const files = fs.readdirSync(ICONS_DIR);
    let copied = 0;
    
    files.forEach(file => {
      if (file.endsWith('.svg')) {
        const src = path.join(ICONS_DIR, file);
        const dest = path.join(BACKUP_DIR, file);
        fs.copyFileSync(src, dest);
        copied++;
      }
    });
    
    console.log(`✅ Backup created: ${copied} icons backed up to ${BACKUP_DIR}\n`);
    return true;
  } catch (error) {
    console.error('❌ Error creating backup:', error.message);
    return false;
  }
}

/**
 * List all currencies with placeholder icons
 */
function listPlaceholders() {
  console.log('🔍 Checking for placeholder icons...\n');
  
  const currencies = getAllCurrencyCodes();
  const placeholders = [];
  const realIcons = [];
  const missing = [];
  
  currencies.forEach(code => {
    if (!iconExists(code)) {
      missing.push(code);
    } else {
      const validation = validateSVG(code);
      if (validation.valid && validation.isPlaceholder) {
        placeholders.push(code);
      } else if (validation.valid) {
        realIcons.push(code);
      }
    }
  });
  
  console.log(`📊 Status:`);
  console.log(`   ✅ Real icons: ${realIcons.length}/${currencies.length}`);
  console.log(`   ⏳ Placeholders: ${placeholders.length}/${currencies.length}`);
  console.log(`   ❌ Missing: ${missing.length}/${currencies.length}\n`);
  
  if (placeholders.length > 0) {
    console.log(`⏳ Currencies with placeholder icons (${placeholders.length}):`);
    placeholders.forEach(code => console.log(`   - ${code}`));
    console.log('');
  }
  
  if (realIcons.length > 0) {
    console.log(`✅ Currencies with real icons (${realIcons.length}):`);
    realIcons.forEach(code => console.log(`   - ${code}`));
    console.log('');
  }
  
  if (missing.length > 0) {
    console.log(`❌ Missing icons (${missing.length}):`);
    missing.forEach(code => console.log(`   - ${code}`));
    console.log('');
  }
  
  return { placeholders, realIcons, missing };
}

/**
 * Check source directory for replacement icons
 */
function checkSourceDirectory(sourceDir) {
  console.log(`🔍 Checking source directory: ${sourceDir}\n`);
  
  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Source directory does not exist: ${sourceDir}`);
    return;
  }
  
  const currencies = getAllCurrencyCodes();
  const sourceFiles = fs.readdirSync(sourceDir).filter(f => f.endsWith('.svg'));
  const found = [];
  const missing = [];
  
  currencies.forEach(code => {
    const expectedName = `currency-${code.toLowerCase()}.svg`;
    if (sourceFiles.includes(expectedName)) {
      found.push(code);
    } else {
      missing.push(code);
    }
  });
  
  console.log(`📊 Source Directory Analysis:`);
  console.log(`   ✅ Found: ${found.length}/${currencies.length}`);
  console.log(`   ❌ Missing: ${missing.length}/${currencies.length}`);
  console.log(`   📁 Total files in source: ${sourceFiles.length}\n`);
  
  if (found.length > 0) {
    console.log(`✅ Icons ready to replace (${found.length}):`);
    found.forEach(code => console.log(`   - ${code}`));
    console.log('');
  }
  
  if (missing.length > 0 && missing.length < 50) {
    console.log(`❌ Icons not found in source (${missing.length}):`);
    missing.forEach(code => console.log(`   - ${code}`));
    console.log('');
  }
  
  // Check for extra files
  const extraFiles = sourceFiles.filter(f => {
    const match = f.match(/^currency-([a-z]{3})\.svg$/);
    if (!match) return true;
    return !currencies.includes(match[1].toUpperCase());
  });
  
  if (extraFiles.length > 0) {
    console.log(`ℹ️  Extra files in source (not in currency list):`);
    extraFiles.forEach(f => console.log(`   - ${f}`));
    console.log('');
  }
  
  return { found, missing, extraFiles };
}

/**
 * Validate all icons
 */
function validateAll() {
  console.log('🔍 Validating all currency icons...\n');
  
  const currencies = getAllCurrencyCodes();
  const valid = [];
  const invalid = [];
  const missing = [];
  const placeholders = [];
  const realIcons = [];
  
  currencies.forEach(code => {
    if (!iconExists(code)) {
      missing.push(code);
    } else {
      const validation = validateSVG(code);
      if (validation.valid) {
        valid.push(code);
        if (validation.isPlaceholder) {
          placeholders.push(code);
        } else {
          realIcons.push(code);
        }
      } else {
        invalid.push({ code, error: validation.error });
      }
    }
  });
  
  console.log(`📊 Validation Results:`);
  console.log(`   ✅ Valid icons: ${valid.length}/${currencies.length}`);
  console.log(`   ⏳ Placeholders: ${placeholders.length}`);
  console.log(`   🎨 Real icons: ${realIcons.length}`);
  console.log(`   ❌ Missing: ${missing.length}`);
  console.log(`   ⚠️  Invalid: ${invalid.length}\n`);
  
  if (invalid.length > 0) {
    console.log(`⚠️  Invalid icons:`);
    invalid.forEach(({ code, error }) => {
      console.log(`   - ${code}: ${error}`);
    });
    console.log('');
  }
  
  return { valid, invalid, missing, placeholders, realIcons };
}

// ============================================================================
// MAIN COMMANDS
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case '--backup':
      createBackup();
      break;
      
    case '--list-missing':
    case '--list-placeholders':
      listPlaceholders();
      break;
      
    case '--check-source':
      const sourceDir = args[1];
      if (!sourceDir) {
        console.error('❌ Please provide source directory: --check-source <dir>');
        process.exit(1);
      }
      checkSourceDirectory(path.resolve(sourceDir));
      break;
      
    case '--validate':
      validateAll();
      break;
      
    case '--help':
    default:
      console.log(`
Currency Icons Replacement Helper

Usage:
  node scripts/replace-currency-icons.js <command> [options]

Commands:
  --backup                    Create backup of current icons
  --list-placeholders         List all currencies with placeholder icons
  --list-missing              List all missing currency icons
  --check-source <dir>        Check source directory for replacement icons
  --validate                  Validate all currency icons
  --help                      Show this help message

Examples:
  node scripts/replace-currency-icons.js --backup
  node scripts/replace-currency-icons.js --list-placeholders
  node scripts/replace-currency-icons.js --check-source ./downloaded-icons
  node scripts/replace-currency-icons.js --validate
      `);
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  getAllCurrencyCodes,
  iconExists,
  isPlaceholder,
  validateSVG,
  createBackup,
  listPlaceholders,
  checkSourceDirectory,
  validateAll,
};

