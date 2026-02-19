#!/usr/bin/env node

/**
 * Currency Icons Download Script
 * 
 * Downloads currency icons from available sources and replaces placeholders.
 * 
 * Usage:
 *   node scripts/download-currency-icons.js
 *   node scripts/download-currency-icons.js --source github
 *   node scripts/download-currency-icons.js --source all
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

// ============================================================================
// CONFIGURATION
// ============================================================================

const ICONS_DIR = path.join(__dirname, '../public/icons/currencies');
const TEMP_DIR = path.join(__dirname, '../temp-currency-icons');
const CURRENCY_SYMBOLS_FILE = path.join(__dirname, '../components/vx2/utils/formatting/currency.ts');

// ============================================================================
// UTILITIES
// ============================================================================

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isValidSVG(buffer) {
  const content = buffer.toString('utf8');
  return content.includes('<svg') || content.includes('<?xml');
}

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${url}`));
        return;
      }
      
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
    });
    
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function getCurrencyCodes() {
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

// ============================================================================
// SOURCE: GitHub ccy-icons
// ============================================================================

/**
 * Download from ccy-icons GitHub repo
 * https://github.com/DominicTobias/ccy-icons
 */
async function downloadFromGitHub() {
  console.log('📦 Downloading from GitHub ccy-icons...\n');
  console.log('Using direct download method (GitHub raw files)...\n');
  
  // Try direct download first (more reliable)
  return await downloadFromGitHubDirect();
}

/**
 * Try to download directly from GitHub raw content
 */
async function downloadFromGitHubDirect() {
  console.log('📥 Downloading from GitHub raw files...\n');
  
  // Try different possible repository structures
  const baseUrls = [
    'https://raw.githubusercontent.com/DominicTobias/ccy-icons/master/svg',
    'https://raw.githubusercontent.com/DominicTobias/ccy-icons/main/svg',
    'https://raw.githubusercontent.com/DominicTobias/ccy-icons/master',
  ];
  
  const currencies = getCurrencyCodes();
  let downloaded = 0;
  let failed = 0;
  let testedUrls = new Set();
  
  console.log(`📊 Attempting to download ${currencies.length} currency icons...\n`);
  
  for (const code of currencies) {
    const codeLower = code.toLowerCase();
    const patterns = [
      `${codeLower}.svg`,
      `${code}.svg`,
      `currency-${codeLower}.svg`,
    ];
    
    let found = false;
    for (const baseUrl of baseUrls) {
      for (const pattern of patterns) {
        const url = `${baseUrl}/${pattern}`;
        
        // Skip if we already tested this URL
        if (testedUrls.has(url)) continue;
        testedUrls.add(url);
        
        try {
          const buffer = await downloadFile(url);
          
          if (isValidSVG(buffer)) {
            let svgContent = buffer.toString('utf8');
            
            // Optimize SVG - ensure proper attributes
            if (!svgContent.includes('viewBox')) {
              svgContent = svgContent.replace(
                /<svg([^>]*)>/,
                '<svg$1 viewBox="0 0 24 24" width="24" height="24">'
              );
            }
            
            // Replace fill colors with currentColor for theming
            svgContent = svgContent.replace(/fill="[^"]*"/g, 'fill="currentColor"');
            svgContent = svgContent.replace(/fill='[^']*'/g, "fill='currentColor'");
            
            // Remove width/height if they're fixed (keep viewBox for scaling)
            svgContent = svgContent.replace(/\s+width="[^"]*"/g, '');
            svgContent = svgContent.replace(/\s+height="[^"]*"/g, '');
            
            const destPath = path.join(ICONS_DIR, `currency-${codeLower}.svg`);
            fs.writeFileSync(destPath, svgContent, 'utf8');
            console.log(`✅ ${code}: Downloaded from ${baseUrl}`);
            downloaded++;
            found = true;
            await delay(150); // Rate limiting
            break;
          }
        } catch (error) {
          // Try next pattern/URL
          continue;
        }
      }
      
      if (found) break;
    }
    
    if (!found) {
      // Don't log every failure to avoid spam, just count
      failed++;
      if (failed <= 10) {
        console.log(`⚠️  ${code}: Not found in repository`);
      }
    }
    
    // Progress indicator
    if ((downloaded + failed) % 20 === 0) {
      console.log(`   Progress: ${downloaded + failed}/${currencies.length}...`);
    }
  }
  
  if (failed > 10) {
    console.log(`   ... and ${failed - 10} more not found`);
  }
  
  console.log(`\n📋 Summary: ${downloaded} downloaded, ${failed} not found in repository\n`);
  return { downloaded, failed };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🎨 Currency Icons Download Script\n');
  console.log('This script will attempt to download currency icons from available sources.\n');
  
  ensureDir(ICONS_DIR);
  
  const args = process.argv.slice(2);
  let source = 'github';
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source' && args[i + 1]) {
      source = args[i + 1];
      break;
    } else if (args[i].startsWith('--source=')) {
      source = args[i].split('=')[1];
      break;
    } else if (!args[i].startsWith('--')) {
      source = args[i];
      break;
    }
  }
  
  let result = { downloaded: 0, failed: 0 };
  
  switch (source) {
    case 'github':
      result = await downloadFromGitHub();
      break;
      
    case 'all':
      console.log('📥 Trying all sources...\n');
      result = await downloadFromGitHub();
      break;
      
    default:
      console.log(`Unknown source: ${source}`);
      console.log('Available sources: github, all');
      process.exit(1);
  }
  
  // Cleanup temp directory
  if (fs.existsSync(TEMP_DIR)) {
    // Keep it for now in case user wants to check
    console.log(`\n💡 Temp files kept in: ${TEMP_DIR}`);
    console.log('   You can delete this directory after verifying icons.\n');
  }
  
  // Validate
  console.log('🔍 Validating downloaded icons...\n');
  try {
    execSync('node scripts/validate-currency-icons.js', { stdio: 'inherit' });
  } catch {
    console.log('⚠️  Validation script had issues, but icons may still be valid');
  }
  
  console.log('\n✅ Download complete!');
  console.log(`   Downloaded: ${result.downloaded}`);
  console.log(`   Not found: ${result.failed}`);
  console.log('\n💡 Next steps:');
  console.log('   1. Review downloaded icons');
  console.log('   2. Fill gaps from other sources (see docs/CURRENCY_ICONS_DOWNLOAD_GUIDE.md)');
  console.log('   3. Run: node scripts/validate-currency-icons.js');
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { downloadFromGitHub, downloadFromGitHubDirect };

