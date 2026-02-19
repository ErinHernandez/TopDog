#!/usr/bin/env node
/**
 * TopDog Studio Companion — Entry Point
 *
 * Starts the companion WebSocket server that bridges the Studio web app
 * to local Xcode Simulators and Android Emulators.
 *
 * Usage:
 *   npx ts-node services/studio-companion/index.ts
 *   # or after building:
 *   node dist/services/studio-companion/index.js
 *
 * Options (via environment variables):
 *   COMPANION_PORT=9827     WebSocket server port (default: 9827)
 *
 * The companion runs as a standalone process on the developer's machine.
 * It's started manually when native preview is needed and can be left
 * running in the background. The Studio web app auto-detects it via
 * a WebSocket ping on page load.
 *
 * @module services/studio-companion
 */

import { discoverDevices } from './deviceDiscovery';
import { isAdbAvailable } from './emulatorCapture';
import { isSimctlAvailable } from './simulatorCapture';
import { createCompanionServer } from './wsServer';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.COMPANION_PORT ?? '9827', 10);

// ─────────────────────────────────────────────────────────────────────────────
// STARTUP
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
   
  console.info('');
   
  console.info('  ╔═══════════════════════════════════════════════╗');
   
  console.info('  ║   🐕 TopDog Studio Companion Service         ║');
   
  console.info('  ╚═══════════════════════════════════════════════╝');
   
  console.info('');

  // Check tool availability
  const [hasSimctl, hasAdb] = await Promise.all([
    isSimctlAvailable(),
    isAdbAvailable(),
  ]);

   
  console.info('  Platform support:');
   
  console.info(`    iOS (xcrun simctl):  ${hasSimctl ? '✓ Available' : '✗ Not found'}`);
   
  console.info(`    Android (adb):       ${hasAdb ? '✓ Available' : '✗ Not found'}`);
   
  console.info('');

  if (!hasSimctl && !hasAdb) {

    console.warn('  ⚠ No capture tools found. Install Xcode and/or Android SDK.');

    console.warn('  The companion will still start, but captures will fail.');
     
    console.info('');
  }

  // Discover devices at startup
  try {
    const devices = await discoverDevices();
    if (devices.length > 0) {

      console.info(`  Discovered ${devices.length} device(s):`);
      for (const device of devices) {
        const status = device.isRunning ? '🟢' : '⚪';

        console.info(`    ${status} ${device.name} (${device.platform} ${device.osVersion})`);
      }
    } else {

      console.info('  No devices detected. Start a simulator or emulator for live capture.');
    }

    console.info('');
  } catch (e) {
    // Log the error clearly so users understand why device discovery failed
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.warn('[Companion] Device discovery failed:', errorMessage);
    console.warn('Ensure Xcode/Android SDK is installed and configured');
    console.info('');
    // Non-fatal — discovery will work on demand via WS messages
  }

  // Start WebSocket server
  const wss = createCompanionServer(PORT);

  // Graceful shutdown
  const shutdown = () => {
     
    console.info('\n  Shutting down companion service...');
    wss.close(() => {
       
      console.info('  Companion service stopped.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// ─────────────────────────────────────────────────────────────────────────────
// RUN
// ─────────────────────────────────────────────────────────────────────────────

main().catch((err) => {
   
  console.error('Fatal error starting companion service:', err);
  process.exit(1);
});
