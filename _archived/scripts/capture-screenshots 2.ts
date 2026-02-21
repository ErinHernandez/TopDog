/**
 * Screenshot Capture Automation Script
 *
 * This Playwright script automatically navigates through localhost:3000
 * and captures screenshots of all pages and states.
 *
 * Usage:
 *   npx ts-node scripts/capture-screenshots.ts
 *   or
 *   npx playwright test scripts/capture-screenshots.ts
 *
 * Prerequisites:
 *   npm install playwright @playwright/test
 *
 * Part of the world's first enterprise-grade app with zero human-written code.
 */

import { chromium, devices } from 'playwright';
import type { Browser, Page, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  baseUrl: 'http://localhost:3000',
  outputDir: './public/glossary/screenshots/raw',
  viewports: {
    web: { width: 1440, height: 900 },
    ios: { ...devices['iPhone 15 Pro'].viewport, deviceScaleFactor: 3 },
    ipad: { ...devices['iPad Pro 11'].viewport, deviceScaleFactor: 2 },
    android: { ...devices['Pixel 7'].viewport, deviceScaleFactor: 3 },
  },
  // Routes to capture
  routes: [
    '/',
    '/lobby',
    '/draft-room',
    '/my-teams',
    '/settings',
    '/glossary',
  ],
  // Draft states to simulate (if possible)
  draftStates: [
    'pre-draft-lobby',
    'draft-countdown',
    'opponent-picking',
    'user-turn-normal',
    'user-turn-warning',
    'user-turn-urgent',
    'pick-made',
    'draft-complete',
  ],
  // Wait time between actions (ms)
  waitTime: 500,
  // Full page screenshots
  fullPage: true,
};

// ============================================================================
// TYPES
// ============================================================================

interface CaptureResult {
  route: string;
  platform: keyof typeof CONFIG.viewports;
  filename: string;
  path: string;
  width: number;
  height: number;
  timestamp: string;
  success: boolean;
  error?: string;
}

interface CaptureJob {
  id: string;
  startTime: Date;
  results: CaptureResult[];
  errors: string[];
}

// ============================================================================
// UTILITIES
// ============================================================================

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sanitizeFilename(str: string): string {
  return str
    .replace(/^\//, '')
    .replace(/\//g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    || 'index';
}

function generateFilename(
  route: string,
  platform: string,
  state?: string,
  timestamp?: string
): string {
  const routePart = sanitizeFilename(route);
  const timePart = timestamp || new Date().toISOString().replace(/[:.]/g, '-');
  const statePart = state ? `_${state}` : '';
  return `${routePart}_${platform}${statePart}_${timePart}.png`;
}

async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// CAPTURE FUNCTIONS
// ============================================================================

async function captureRoute(
  page: Page,
  route: string,
  platform: keyof typeof CONFIG.viewports,
  outputDir: string,
  state?: string
): Promise<CaptureResult> {
  const viewport = CONFIG.viewports[platform];
  const filename = generateFilename(route, platform, state);
  const outputPath = path.join(outputDir, filename);
  const timestamp = new Date().toISOString();

  try {
    // Set viewport
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });

    // Navigate to route
    const url = `${CONFIG.baseUrl}${route}`;
    console.log(`📸 Capturing: ${url} (${platform})`);

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await wait(CONFIG.waitTime);

    // Wait for any animations to settle
    await page.waitForLoadState('domcontentloaded');

    // Take screenshot
    await page.screenshot({
      path: outputPath,
      fullPage: CONFIG.fullPage,
    });

    console.log(`✅ Saved: ${filename}`);

    return {
      route,
      platform,
      filename,
      path: outputPath,
      width: viewport.width,
      height: viewport.height,
      timestamp,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed: ${route} (${platform}) - ${errorMessage}`);

    return {
      route,
      platform,
      filename,
      path: outputPath,
      width: viewport.width,
      height: viewport.height,
      timestamp,
      success: false,
      error: errorMessage,
    };
  }
}

async function captureDraftStates(
  page: Page,
  platform: keyof typeof CONFIG.viewports,
  outputDir: string
): Promise<CaptureResult[]> {
  const results: CaptureResult[] = [];
  const viewport = CONFIG.viewports[platform];

  // Set viewport
  await page.setViewportSize({
    width: viewport.width,
    height: viewport.height,
  });

  // Navigate to draft room
  const draftUrl = `${CONFIG.baseUrl}/draft-room`;

  try {
    console.log(`🎯 Capturing draft states: ${platform}`);
    await page.goto(draftUrl, { waitUntil: 'networkidle', timeout: 30000 });

    for (const state of CONFIG.draftStates) {
      const filename = generateFilename('/draft-room', platform, state);
      const outputPath = path.join(outputDir, filename);
      const timestamp = new Date().toISOString();

      try {
        // Attempt to trigger state via URL parameter or console command
        // This depends on how your app handles state simulation
        await page.goto(`${draftUrl}?state=${state}`, {
          waitUntil: 'networkidle',
          timeout: 10000,
        });

        // Alternative: Use JavaScript to set state
        await page.evaluate((stateName) => {
          // Check if there's a global state setter
          if ((window as any).__setDraftState) {
            (window as any).__setDraftState(stateName);
          }
          // Or dispatch a custom event
          window.dispatchEvent(
            new CustomEvent('set-draft-state', { detail: stateName })
          );
        }, state);

        await wait(CONFIG.waitTime);

        await page.screenshot({
          path: outputPath,
          fullPage: false, // Just the viewport for draft states
        });

        console.log(`✅ Draft state: ${state}`);

        results.push({
          route: '/draft-room',
          platform,
          filename,
          path: outputPath,
          width: viewport.width,
          height: viewport.height,
          timestamp,
          success: true,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.warn(`⚠️ Could not capture state ${state}: ${errorMessage}`);

        results.push({
          route: '/draft-room',
          platform,
          filename,
          path: outputPath,
          width: viewport.width,
          height: viewport.height,
          timestamp,
          success: false,
          error: errorMessage,
        });
      }
    }
  } catch (error) {
    console.error('Failed to access draft room:', error);
  }

  return results;
}

// ============================================================================
// MAIN CAPTURE JOB
// ============================================================================

async function runCaptureJob(): Promise<CaptureJob> {
  const job: CaptureJob = {
    id: `capture-${Date.now()}`,
    startTime: new Date(),
    results: [],
    errors: [],
  };

  console.log('\n🚀 Starting Screenshot Capture Job');
  console.log('━'.repeat(50));
  console.log(`Job ID: ${job.id}`);
  console.log(`Start Time: ${job.startTime.toISOString()}`);
  console.log(`Output: ${CONFIG.outputDir}`);
  console.log('━'.repeat(50) + '\n');

  // Ensure output directory exists
  ensureDir(CONFIG.outputDir);

  // Launch browser
  const browser: Browser = await chromium.launch({
    headless: true, // Set to false to see the browser
  });

  try {
    // Capture for each platform
    for (const platform of Object.keys(CONFIG.viewports) as Array<
      keyof typeof CONFIG.viewports
    >) {
      console.log(`\n📱 Platform: ${platform.toUpperCase()}`);
      console.log('-'.repeat(30));

      const context: BrowserContext = await browser.newContext({
        viewport: CONFIG.viewports[platform],
        deviceScaleFactor:
          (CONFIG.viewports[platform] as any).deviceScaleFactor || 1,
      });
      const page: Page = await context.newPage();

      // Capture each route
      for (const route of CONFIG.routes) {
        const result = await captureRoute(
          page,
          route,
          platform,
          CONFIG.outputDir
        );
        job.results.push(result);

        if (!result.success && result.error) {
          job.errors.push(`${route} (${platform}): ${result.error}`);
        }
      }

      // Capture draft states (iOS only for now to reduce time)
      if (platform === 'ios') {
        const draftResults = await captureDraftStates(
          page,
          platform,
          CONFIG.outputDir
        );
        job.results.push(...draftResults);

        for (const result of draftResults) {
          if (!result.success && result.error) {
            job.errors.push(
              `/draft-room state (${platform}): ${result.error}`
            );
          }
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  // Summary
  const successful = job.results.filter((r) => r.success).length;
  const failed = job.results.filter((r) => !r.success).length;

  console.log('\n' + '━'.repeat(50));
  console.log('📊 CAPTURE SUMMARY');
  console.log('━'.repeat(50));
  console.log(`Total: ${job.results.length}`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Duration: ${Date.now() - job.startTime.getTime()}ms`);

  if (job.errors.length > 0) {
    console.log('\n⚠️ Errors:');
    job.errors.forEach((err) => console.log(`  - ${err}`));
  }

  // Save job manifest
  const manifestPath = path.join(CONFIG.outputDir, `manifest-${job.id}.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(job, null, 2));
  console.log(`\n📄 Manifest saved: ${manifestPath}`);

  return job;
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

async function main() {
  try {
    await runCaptureJob();
    process.exit(0);
  } catch (error) {
    console.error('Capture job failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
main();

export { runCaptureJob, captureRoute, CONFIG };
