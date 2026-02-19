/**
 * TopDog Studio Companion — iOS Simulator Capture
 *
 * Captures a screenshot from a running Xcode Simulator using `xcrun simctl`.
 * The capture is returned as base64-encoded PNG data suitable for streaming
 * over WebSocket to the Studio browser client.
 *
 * Capture flow:
 * 1. `xcrun simctl io <deviceId> screenshot` → writes PNG to temp file
 * 2. Read temp file → base64 encode
 * 3. Extract image dimensions from PNG header
 * 4. Clean up temp file
 * 5. Return FrameData object
 *
 * Latency: ~300-500ms per capture (suitable for ~3-5fps polling).
 * For higher frame rates, a future ScreenCaptureKit backend can replace this.
 *
 * @module services/studio-companion/simulatorCapture
 */

import { execFile } from 'node:child_process';
import { readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface FrameData {
  readonly timestamp: number;
  readonly deviceId: string;
  readonly platform: 'ios';
  readonly renderContext: 'isolated';
  readonly imageData: string; // base64
  readonly width: number;
  readonly height: number;
  readonly languageId: string;
  readonly error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CAPTURE FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Capture a screenshot from an iOS Simulator.
 *
 * @param deviceId - Simulator UDID (or "booted" for the active simulator)
 * @returns FrameData with base64-encoded PNG screenshot
 * @throws If xcrun simctl fails or the simulator is not running
 */
export async function captureSimulator(deviceId: string): Promise<FrameData> {
  const timestamp = Date.now();

  // Generate a unique temp file path to avoid race conditions
  const tempPath = join(tmpdir(), `studio-sim-${timestamp}-${Math.random().toString(36).slice(2, 8)}.png`);

  try {
    // 1. Capture screenshot via xcrun simctl
    await execFileAsync('xcrun', [
      'simctl', 'io', deviceId, 'screenshot',
      '--type=png',
      tempPath,
    ], {
      timeout: 10_000, // 10s timeout — generous for slow machines
    });

    // 2. Read the captured PNG file
    const pngBuffer = await readFile(tempPath);
    const imageData = pngBuffer.toString('base64');

    // 3. Extract dimensions from PNG header (bytes 16-23 of IHDR chunk)
    const { width, height } = extractPngDimensions(pngBuffer);

    return {
      timestamp,
      deviceId,
      platform: 'ios',
      renderContext: 'isolated',
      imageData,
      width,
      height,
      languageId: 'swiftui', // Default; caller can override if needed
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown capture error';

    // Return error frame instead of throwing — lets caller decide how to handle
    return {
      timestamp,
      deviceId,
      platform: 'ios',
      renderContext: 'isolated',
      imageData: '',
      width: 0,
      height: 0,
      languageId: 'swiftui',
      error: `Simulator capture failed: ${message}`,
    };
  } finally {
    // 4. Clean up temp file (best effort)
    try {
      await unlink(tempPath);
    } catch {
      // Ignore cleanup errors — temp dir will be cleared eventually
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PNG DIMENSION EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract width and height from a PNG file's IHDR chunk.
 *
 * PNG format (first 33 bytes):
 *   Bytes 0-7:   PNG signature (89 50 4E 47 0D 0A 1A 0A)
 *   Bytes 8-11:  IHDR chunk length (always 13)
 *   Bytes 12-15: "IHDR" chunk type
 *   Bytes 16-19: Width  (32-bit big-endian unsigned)
 *   Bytes 20-23: Height (32-bit big-endian unsigned)
 *
 * @param buffer - Raw PNG file data
 * @returns Width and height in pixels
 */
function extractPngDimensions(buffer: Buffer): { width: number; height: number } {
  // Validate PNG signature
  const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return { width: 0, height: 0 };
  }

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);

  return { width, height };
}

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if xcrun simctl is available on this system.
 * Returns true if the command exists and responds to `simctl help`.
 */
export async function isSimctlAvailable(): Promise<boolean> {
  try {
    await execFileAsync('xcrun', ['simctl', 'help'], { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}
