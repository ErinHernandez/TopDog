#!/usr/bin/env node

/**
 * Kill any process using port 3000 and any stray "next dev" processes.
 * This ensures a single dev server uses port 3000 and avoids .next cache
 * corruption from multiple Next processes.
 */

const { execSync } = require('child_process');

try {
  const pids = execSync('lsof -ti:3000', { encoding: 'utf8' }).trim();
  if (pids) {
    const pidList = pids.split('\n').filter(Boolean);
    console.log(`🔪 Killing processes on port 3000: ${pidList.join(', ')}`);
    execSync(`kill -9 ${pidList.join(' ')}`, { stdio: 'inherit' });
  }
} catch (e) {
  // lsof exits 1 when no process uses the port
}

try {
  const nextDevPids = execSync('pgrep -f "next dev"', { encoding: 'utf8' }).trim();
  if (nextDevPids) {
    execSync('pkill -f "next dev"', { stdio: 'ignore' });
    console.log('🔪 Stopped running "next dev" processes');
  }
} catch (e) {
  // pgrep/pkill exit 1 when no matching processes
}
