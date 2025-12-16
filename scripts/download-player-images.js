#!/usr/bin/env node

/**
 * NFL Player Image Download Script
 * 
 * Downloads player headshots from free sources (TheSportsDB, Fantasy Nerds, ESPN CDN)
 * for all players in the player pool.
 * 
 * Usage:
 *   node scripts/download-player-images.js
 *   node scripts/download-player-images.js --source thesportsdb
 *   node scripts/download-player-images.js --source all
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  playerPoolPath: path.join(__dirname, '..', 'public', 'data', 'player-pool-2025.json'),
  outputDir: path.join(__dirname, '..', 'public', 'players'),
  logFile: path.join(__dirname, '..', 'public', 'players', 'download-log.json'),
  
  // Rate limiting
  requestDelay: 150, // ms between requests (TheSportsDB: 30 req/min = 2000ms, using 150ms for safety)
  batchSize: 5,      // concurrent requests per batch
  batchDelay: 1000,  // delay between batches
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000,  // base delay for exponential backoff
  
  // API keys (from environment or defaults)
  thesportsdbApiKey: process.env.THESPORTSDB_API_KEY || '1', // Demo key
  fantasynerdsApiKey: process.env.FANTASYNERDS_API_KEY || null,
  
  // Sources to try (in priority order)
  sources: ['sportsdataio', 'thesportsdb', 'fantasynerds', 'espn'],
};

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

function isValidImage(buffer) {
  // Check for common image file signatures
  const signatures = {
    png: [0x89, 0x50, 0x4E, 0x47],
    jpeg: [0xFF, 0xD8, 0xFF],
    webp: [0x52, 0x49, 0x46, 0x46], // RIFF header
    gif: [0x47, 0x49, 0x46, 0x38], // GIF8
  };
  
  for (const [format, sig] of Object.entries(signatures)) {
    const matches = sig.every((byte, i) => buffer[i] === byte);
    if (matches) return true;
  }
  
  return false;
}

function calculateChecksum(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// ============================================================================
// HTTP DOWNLOAD
// ============================================================================

function downloadImage(url) {
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
        
        // Validate it's actually an image
        if (!isValidImage(buffer)) {
          reject(new Error(`Invalid image format: ${url}`));
          return;
        }
        
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

// ============================================================================
// API SOURCES
// ============================================================================

/**
 * TheSportsDB API
 * Free API with 30 requests/minute limit
 */
async function fetchFromTheSportsDB(playerName) {
  // Try v3 API first
  const searchUrl = `https://www.thesportsdb.com/api/v3/json/${CONFIG.thesportsdbApiKey}/searchplayers.php?p=${encodeURIComponent(playerName)}`;
  
  return new Promise((resolve, reject) => {
    https.get(searchUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          // Check if we got HTML (404 page)
          if (data.trim().startsWith('<!DOCTYPE') || data.trim().startsWith('<html')) {
            reject(new Error('API endpoint not available (404)'));
            return;
          }
          
          const json = JSON.parse(data);
          if (json.player && json.player.length > 0) {
            const player = json.player[0];
            const thumbUrl = player.strThumb || player.strCutout;
            if (thumbUrl && thumbUrl !== 'null' && thumbUrl.startsWith('http')) {
              resolve(thumbUrl);
            } else {
              reject(new Error('No image URL found'));
            }
          } else {
            reject(new Error('Player not found'));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * SportsDataIO API (if API key available)
 * Best quality, comprehensive coverage
 */
async function fetchFromSportsDataIO(playerName, playerId) {
  const sportsDataIOKey = process.env.SPORTSDATAIO_API_KEY;
  if (!sportsDataIOKey) {
    throw new Error('SportsDataIO API key not configured');
  }
  
  // Use existing SportsDataIO integration
  const { getPlayerHeadshot } = require('../lib/sportsdataio');
  
  try {
    const player = await getPlayerHeadshot(sportsDataIOKey, playerName, false);
    if (player && player.headshotUrl) {
      return player.headshotUrl;
    }
    throw new Error('No headshot URL in response');
  } catch (error) {
    throw new Error(`SportsDataIO error: ${error.message}`);
  }
}

/**
 * Fantasy Nerds API
 * Requires API key, uses player ID pattern
 */
async function fetchFromFantasyNerds(playerId) {
  if (!CONFIG.fantasynerdsApiKey) {
    throw new Error('Fantasy Nerds API key not configured');
  }
  
  // Try medium size first
  const url = `https://www.fantasynerds.com/images/nfl/players_medium/${playerId}.png`;
  
  try {
    // Just check if URL exists by attempting download
    await downloadImage(url);
    return url;
  } catch (e) {
    // Try large size
    const largeUrl = `https://www.fantasynerds.com/images/nfl/players_large/${playerId}.png`;
    try {
      await downloadImage(largeUrl);
      return largeUrl;
    } catch (e2) {
      throw new Error('Image not found on Fantasy Nerds');
    }
  }
}

/**
 * ESPN CDN (unofficial, use with caution)
 * Requires ESPN player ID mapping
 */
async function fetchFromESPN(espnPlayerId) {
  if (!espnPlayerId) {
    throw new Error('ESPN player ID required');
  }
  
  const url = `https://a.espncdn.com/i/headshots/nfl/players/full/${espnPlayerId}.png`;
  
  try {
    await downloadImage(url);
    return url;
  } catch (e) {
    throw new Error('Image not found on ESPN CDN');
  }
}

// ============================================================================
// DOWNLOAD WITH RETRY
// ============================================================================

async function downloadWithRetry(url, maxRetries = CONFIG.maxRetries) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await downloadImage(url);
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delayMs = CONFIG.retryDelay * Math.pow(2, attempt);
        await delay(delayMs);
      }
    }
  }
  
  throw lastError;
}

// ============================================================================
// MAIN DOWNLOAD LOGIC
// ============================================================================

async function downloadPlayerImage(player, sources = CONFIG.sources) {
  const result = {
    playerId: player.id,
    playerName: player.name,
    position: player.position,
    team: player.team,
    success: false,
    source: null,
    imageUrl: null,
    error: null,
    attempts: [],
  };
  
  // Try each source in priority order
  for (const source of sources) {
    try {
      let imageUrl;
      
      switch (source) {
        case 'sportsdataio':
          imageUrl = await fetchFromSportsDataIO(player.name, player.id);
          break;
        case 'thesportsdb':
          imageUrl = await fetchFromTheSportsDB(player.name);
          break;
        case 'fantasynerds':
          // Fantasy Nerds uses numeric player IDs, we'd need a mapping
          // For now, skip if no mapping exists
          throw new Error('Fantasy Nerds requires player ID mapping (not implemented)');
        case 'espn':
          // ESPN requires player ID mapping
          throw new Error('ESPN requires player ID mapping (not implemented)');
        default:
          throw new Error(`Unknown source: ${source}`);
      }
      
      // Download the image
      const imageBuffer = await downloadWithRetry(imageUrl);
      
      // Save image
      const webpPath = path.join(CONFIG.outputDir, `${player.id}.webp`);
      const pngPath = path.join(CONFIG.outputDir, `${player.id}.png`);
      
      // For now, save as PNG (we'll optimize to WebP later)
      fs.writeFileSync(pngPath, imageBuffer);
      
      // Also save as WebP placeholder (will be optimized later)
      fs.writeFileSync(webpPath, imageBuffer);
      
      result.success = true;
      result.source = source;
      result.imageUrl = imageUrl;
      result.checksum = calculateChecksum(imageBuffer);
      result.fileSize = imageBuffer.length;
      
      return result;
      
    } catch (error) {
      result.attempts.push({
        source,
        error: error.message,
      });
      // Continue to next source
    }
  }
  
  // All sources failed
  result.error = 'All sources failed';
  return result;
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

async function processBatch(players, batchIndex, totalBatches) {
  console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (${players.length} players)...`);
  
  const results = await Promise.all(
    players.map(async (player, index) => {
      // Add delay to respect rate limits
      if (index > 0) {
        await delay(CONFIG.requestDelay);
      }
      
      try {
        const result = await downloadPlayerImage(player);
        const status = result.success ? '✅' : '❌';
        console.log(`  ${status} ${player.name} (${player.position}, ${player.team})`);
        return result;
      } catch (error) {
        console.error(`  ❌ ${player.name}: ${error.message}`);
        return {
          playerId: player.id,
          playerName: player.name,
          position: player.position,
          team: player.team,
          success: false,
          error: error.message,
        };
      }
    })
  );
  
  return results;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🏈 NFL Player Image Download Script');
  console.log('='.repeat(50));
  
  // Ensure output directory exists
  ensureDir(CONFIG.outputDir);
  
  // Load player pool
  console.log('\n📋 Loading player pool...');
  if (!fs.existsSync(CONFIG.playerPoolPath)) {
    console.error(`❌ Player pool not found: ${CONFIG.playerPoolPath}`);
    process.exit(1);
  }
  
  const poolData = JSON.parse(fs.readFileSync(CONFIG.playerPoolPath, 'utf8'));
  const players = poolData.players || [];
  console.log(`   Found ${players.length} players`);
  
  // Load existing log if it exists
  let downloadLog = {
    startedAt: new Date().toISOString(),
    totalPlayers: players.length,
    results: [],
    summary: {
      success: 0,
      failed: 0,
      bySource: {},
      byPosition: {},
    },
  };
  
  if (fs.existsSync(CONFIG.logFile)) {
    const existing = JSON.parse(fs.readFileSync(CONFIG.logFile, 'utf8'));
    downloadLog = { ...downloadLog, ...existing };
    downloadLog.startedAt = new Date().toISOString();
    console.log(`   Resuming from previous run (${downloadLog.results.length} already processed)`);
  }
  
  // Filter out already processed players
  const processedIds = new Set(downloadLog.results.map(r => r.playerId));
  const remainingPlayers = players.filter(p => !processedIds.has(p.id));
  
  console.log(`   Processing ${remainingPlayers.length} remaining players\n`);
  
  // Process in batches
  const totalBatches = Math.ceil(remainingPlayers.length / CONFIG.batchSize);
  let allResults = [...downloadLog.results];
  
  for (let i = 0; i < remainingPlayers.length; i += CONFIG.batchSize) {
    const batch = remainingPlayers.slice(i, i + CONFIG.batchSize);
    const batchIndex = Math.floor(i / CONFIG.batchSize);
    
    const batchResults = await processBatch(batch, batchIndex, totalBatches);
    allResults.push(...batchResults);
    
    // Save progress after each batch
    downloadLog.results = allResults;
    downloadLog.summary = {
      success: allResults.filter(r => r.success).length,
      failed: allResults.filter(r => !r.success).length,
      bySource: {},
      byPosition: {},
    };
    
    // Calculate source distribution
    allResults.forEach(r => {
      if (r.success && r.source) {
        downloadLog.summary.bySource[r.source] = (downloadLog.summary.bySource[r.source] || 0) + 1;
      }
      downloadLog.summary.byPosition[r.position] = (downloadLog.summary.byPosition[r.position] || 0) + 1;
    });
    
    fs.writeFileSync(CONFIG.logFile, JSON.stringify(downloadLog, null, 2));
    
    // Delay between batches
    if (i + CONFIG.batchSize < remainingPlayers.length) {
      await delay(CONFIG.batchDelay);
    }
  }
  
  // Final summary
  downloadLog.completedAt = new Date().toISOString();
  downloadLog.summary = {
    success: allResults.filter(r => r.success).length,
    failed: allResults.filter(r => !r.success).length,
    bySource: {},
    byPosition: {},
  };
  
  allResults.forEach(r => {
    if (r.success && r.source) {
      downloadLog.summary.bySource[r.source] = (downloadLog.summary.bySource[r.source] || 0) + 1;
    }
    const pos = r.position || 'UNKNOWN';
    if (!downloadLog.summary.byPosition[pos]) {
      downloadLog.summary.byPosition[pos] = { success: 0, failed: 0 };
    }
    if (r.success) {
      downloadLog.summary.byPosition[pos].success++;
    } else {
      downloadLog.summary.byPosition[pos].failed++;
    }
  });
  
  fs.writeFileSync(CONFIG.logFile, JSON.stringify(downloadLog, null, 2));
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 DOWNLOAD SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Players: ${players.length}`);
  console.log(`✅ Successfully Downloaded: ${downloadLog.summary.success}`);
  console.log(`❌ Failed: ${downloadLog.summary.failed}`);
  console.log(`📈 Success Rate: ${((downloadLog.summary.success / players.length) * 100).toFixed(1)}%`);
  console.log('\nBy Source:');
  Object.entries(downloadLog.summary.bySource).forEach(([source, count]) => {
    console.log(`  ${source}: ${count}`);
  });
  console.log('\nBy Position:');
  Object.entries(downloadLog.summary.byPosition).forEach(([pos, stats]) => {
    console.log(`  ${pos}: ${stats.success} success, ${stats.failed} failed`);
  });
  
  console.log(`\n📁 Log saved to: ${CONFIG.logFile}`);
  console.log(`📁 Images saved to: ${CONFIG.outputDir}`);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { downloadPlayerImage, downloadWithRetry };

