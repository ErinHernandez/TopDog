#!/usr/bin/env node

/**
 * Bundle Size Analysis Script
 * 
 * Analyzes Next.js bundle size and identifies optimization opportunities.
 * Part of Phase 5: Polish.
 * 
 * Usage:
 *   node scripts/analyze-bundle.js
 * 
 * Requires: npm run build first
 */

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(process.cwd(), '.next');
const STATIC_DIR = path.join(BUILD_DIR, 'static');

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file size
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Find all JS files in directory
 */
function findJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findJSFiles(filePath, fileList);
    } else if (file.endsWith('.js') || file.endsWith('.js.map')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Analyze bundle
 */
function analyzeBundle() {
  console.log('\n📦 Bundle Size Analysis');
  console.log('='.repeat(60));
  
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('\n❌ Build directory not found. Run "npm run build" first.\n');
    process.exit(1);
  }
  
  if (!fs.existsSync(STATIC_DIR)) {
    console.error('\n❌ Static directory not found. Run "npm run build" first.\n');
    process.exit(1);
  }
  
  // Find all JS files
  const jsFiles = findJSFiles(STATIC_DIR);
  
  // Group by chunk
  const chunks = {};
  let totalSize = 0;
  
  jsFiles.forEach(file => {
    if (file.endsWith('.map')) return; // Skip source maps
    
    const relativePath = path.relative(STATIC_DIR, file);
    const chunkName = relativePath.split('/')[0]; // Get chunk directory
    
    if (!chunks[chunkName]) {
      chunks[chunkName] = {
        files: [],
        totalSize: 0,
      };
    }
    
    const size = getFileSize(file);
    chunks[chunkName].files.push({
      path: relativePath,
      size,
    });
    chunks[chunkName].totalSize += size;
    totalSize += size;
  });
  
  // Sort chunks by size
  const sortedChunks = Object.entries(chunks)
    .map(([name, data]) => ({
      name,
      ...data,
    }))
    .sort((a, b) => b.totalSize - a.totalSize);
  
  console.log(`\nTotal Bundle Size: ${formatBytes(totalSize)}`);
  console.log(`Number of Chunks: ${sortedChunks.length}`);
  console.log(`\nChunk Breakdown:\n`);
  
  sortedChunks.forEach((chunk, index) => {
    const percentage = ((chunk.totalSize / totalSize) * 100).toFixed(2);
    console.log(`${index + 1}. ${chunk.name}`);
    console.log(`   Size: ${formatBytes(chunk.totalSize)} (${percentage}%)`);
    console.log(`   Files: ${chunk.files.length}`);
    
    // Show top 3 largest files
    const topFiles = chunk.files
      .sort((a, b) => b.size - a.size)
      .slice(0, 3);
    
    if (topFiles.length > 0) {
      console.log(`   Largest files:`);
      topFiles.forEach(file => {
        const filePercentage = ((file.size / chunk.totalSize) * 100).toFixed(2);
        console.log(`     - ${file.path}: ${formatBytes(file.size)} (${filePercentage}%)`);
      });
    }
    console.log('');
  });
  
  // Recommendations
  console.log('💡 Recommendations:\n');
  
  const largeChunks = sortedChunks.filter(chunk => chunk.totalSize > 200 * 1024); // > 200KB
  if (largeChunks.length > 0) {
    console.log('⚠️  Large chunks (>200KB):');
    largeChunks.forEach(chunk => {
      console.log(`   - ${chunk.name}: ${formatBytes(chunk.totalSize)}`);
      console.log(`     Consider code splitting or lazy loading`);
    });
    console.log('');
  }
  
  if (totalSize > 500 * 1024) { // > 500KB
    console.log('⚠️  Total bundle size exceeds 500KB');
    console.log('   Consider:');
    console.log('   - Code splitting by route');
    console.log('   - Lazy loading heavy components');
    console.log('   - Removing unused dependencies');
    console.log('   - Tree-shaking unused code');
  } else {
    console.log('✅ Total bundle size is reasonable');
  }
  
  console.log('\n');
}

analyzeBundle();
