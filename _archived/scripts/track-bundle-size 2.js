// File: scripts/track-bundle-size.js
const fs = require('fs');
const path = require('path');

const BUILD_DIR = '.next';
const STATS_FILE = 'bundle-stats.json';

const getDirectorySize = (dir) => {
  let size = 0;
  if (!fs.existsSync(dir)) return size;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      size += getDirectorySize(filePath);
    } else {
      size += stats.size;
    }
  }
  
  return size;
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const analyzeChunks = () => {
  const chunksDir = path.join(BUILD_DIR, 'static', 'chunks');
  const chunks = {};
  
  if (fs.existsSync(chunksDir)) {
    fs.readdirSync(chunksDir).forEach(file => {
      if (file.endsWith('.js')) {
        const filePath = path.join(chunksDir, file);
        chunks[file] = fs.statSync(filePath).size;
      }
    });
  }
  
  return chunks;
};

const run = () => {
  const clientDir = path.join(BUILD_DIR, 'static');
  const totalSize = getDirectorySize(clientDir);
  const chunks = analyzeChunks();
  
  // Sort chunks by size
  const sortedChunks = Object.entries(chunks)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20);

  console.log('\n📦 Bundle Size Analysis');
  console.log('='.repeat(50));
  console.log(`\nTotal client bundle: ${formatBytes(totalSize)}`);
  
  console.log('\nTop 20 largest chunks:');
  sortedChunks.forEach(([name, size], idx) => {
    console.log(`  ${idx + 1}. ${name}: ${formatBytes(size)}`);
  });

  // Load previous stats if exist
  let previousStats = null;
  if (fs.existsSync(STATS_FILE)) {
    try {
      previousStats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    } catch (e) {
      console.warn('Could not parse previous stats file');
    }
  }

  // Calculate diff
  if (previousStats) {
    const diff = totalSize - previousStats.totalSize;
    const diffPercent = ((diff / previousStats.totalSize) * 100).toFixed(2);
    const sign = diff > 0 ? '+' : '';
    console.log(`\n📊 Change from last build: ${sign}${formatBytes(diff)} (${sign}${diffPercent}%)`);
    
    if (diff > 50 * 1024) { // 50KB increase
      console.log('⚠️  WARNING: Significant bundle size increase!');
    }
  }

  // Save current stats
  const currentStats = {
    timestamp: new Date().toISOString(),
    totalSize,
    chunks,
  };
  fs.writeFileSync(STATS_FILE, JSON.stringify(currentStats, null, 2));
  console.log('\n✅ Stats saved to bundle-stats.json');
};

run();
