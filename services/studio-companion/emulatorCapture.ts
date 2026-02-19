/**
 * TopDog Studio Companion — Android Emulator Capture
 *
 * Captures a screenshot from a running Android Emulator using `adb`.
 * Unlike the iOS capture which writes to a temp file, Android's `screencap`
 * can pipe directly to stdout, avoiding disk I/O.
 *
 * Capture flow:
 * 1. `adb -s <deviceId> exec-out screencap -p` → raw PNG bytes on stdout
 * 2. Base64 encode the stdout buffer
 * 3. Extract image dimensions from PNG header
 * 4. Return FrameData object
 *
 * Latency: ~200-400ms per capture (slightly faster than iOS due to no temp file).
 *
 * @module services/studio-companion/emulatorCapture
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface FrameData {
  readonly timestamp: number;
  readonly deviceId: string;
  readonly platform: 'android';
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
 * Capture a screenshot from an Android Emulator.
 *
 * @param deviceId - Emulator serial (e.g. "emulator-5554") or "any" for first available
 * @returns FrameData with base64-encoded PNG screenshot
 * @throws If adb fails or no emulator is running
 */
export async function captureEmulator(deviceId: string): Promise<FrameData> {
  const timestamp = Date.now();

  try {
    // Build adb args: target specific device or let adb pick the default
    const adbArgs = deviceId === 'any'
      ? ['exec-out', 'screencap', '-p']
      : ['-s', deviceId, 'exec-out', 'screencap', '-p'];

    // Capture screenshot — PNG bytes come directly on stdout
    const { stdout } = await execFileAsync('adb', adbArgs, {
      timeout: 10_000,
      encoding: 'buffer' as BufferEncoding,
      maxBuffer: 50 * 1024 * 1024, // 50MB — 4K screenshots can be large
    });

    const pngBuffer = stdout as unknown as Buffer;

    if (!pngBuffer || pngBuffer.length === 0) {
      return {
        timestamp,
        deviceId,
        platform: 'android',
        renderContext: 'isolated',
        imageData: '',
        width: 0,
        height: 0,
        languageId: 'compose',
        error: 'Empty screenshot — is the emulator screen on?',
      };
    }

    // Base64 encode the raw PNG
    const imageData = pngBuffer.toString('base64');

    // Extract dimensions from PNG header
    const { width, height } = extractPngDimensions(pngBuffer);

    return {
      timestamp,
      deviceId,
      platform: 'android',
      renderContext: 'isolated',
      imageData,
      width,
      height,
      languageId: 'compose', // Default; caller can override if needed
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown capture error';

    return {
      timestamp,
      deviceId,
      platform: 'android',
      renderContext: 'isolated',
      imageData: '',
      width: 0,
      height: 0,
      languageId: 'compose',
      error: `Emulator capture failed: ${message}`,
    };
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
 */
function extractPngDimensions(buffer: Buffer): { width: number; height: number } {
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
 * Check if adb is available on this system.
 * Returns true if the command exists and responds to `adb version`.
 */
export async function isAdbAvailable(): Promise<boolean> {
  try {
    await execFileAsync('adb', ['version'], { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}
