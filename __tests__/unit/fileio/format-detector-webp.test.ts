/**
 * FormatDetector WebP Tests
 * Tests WebP format detection and dimension extraction for VP8, VP8L, and VP8X
 *
 * Format specifications:
 * - VP8 lossy: 9d 01 2a start code, dimensions in bytes 26-29 (14-bit little-endian + 1)
 * - VP8L lossless: 2f signature, packed 32-bit at bytes 21-24 (width-1 bits 0-13, height-1 bits 14-27)
 * - VP8X extended: dimensions at bytes 24-26 (width-1) and 27-29 (height-1) in 24-bit LE
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FormatDetector } from '@/lib/studio/editor/fileio/FormatDetector';

/**
 * Helper: Create a WebP blob from raw bytes
 */
function createWebPBlob(bytes: number[]): Blob {
  return new Blob([new Uint8Array(bytes)]);
}

describe('FormatDetector.detectDimensions - WebP Format', () => {
  // ============================================================================
  // VP8 Lossy Tests
  // ============================================================================

  it('detects VP8 lossy WebP dimensions (320x240)', async () => {
    // Build 30 bytes: RIFF header + WEBP + VP8 chunk with valid frame tag
    const bytes = [
      // RIFF header (bytes 0-3)
      0x52, 0x49, 0x46, 0x46, // "RIFF"
      // File size (bytes 4-7, little-endian) - dummy value
      0x1e, 0x00, 0x00, 0x00, // 30
      // WEBP signature (bytes 8-11)
      0x57, 0x45, 0x42, 0x50, // "WEBP"
      // VP8 chunk signature (bytes 12-15)
      0x56, 0x50, 0x38, 0x20, // "VP8 "
      // Chunk size (bytes 16-19)
      0x0a, 0x00, 0x00, 0x00, // 10 bytes
      // Frame tag and start code (bytes 20-25)
      0x00, 0x00, 0x00, 0x9d, 0x01, 0x2a, // start code: 9d 01 2a
      // Width (bytes 26-27, little-endian, 14-bit encoded as width-1)
      // Width 320: 320-1 = 319 = 0x013F -> LE: 0x3F, 0x01
      0x3f, 0x01,
      // Height (bytes 28-29, little-endian, 14-bit encoded as height-1)
      // Height 240: 240-1 = 239 = 0xEF -> LE: 0xEF, 0x00
      0xef, 0x00,
    ];

    const blob = createWebPBlob(bytes);
    const size = await FormatDetector.detectDimensions(blob, 'webp');

    expect(size).toEqual({ width: 320, height: 240 });
  });

  it('returns null for VP8 with invalid start code', async () => {
    const bytes = [
      0x52, 0x49, 0x46, 0x46, 0x1e, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50,
      0x56, 0x50, 0x38, 0x20, // "VP8 "
      0x0a, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00,
      // Invalid start code (should be 9d 01 2a)
      0xaa, 0xbb, 0xcc,
      0x3f, 0x01, 0xef, 0x00,
    ];

    const blob = createWebPBlob(bytes);
    const size = await FormatDetector.detectDimensions(blob, 'webp');

    expect(size).toBeNull();
  });

  // ============================================================================
  // VP8L Lossless Tests
  // ============================================================================

  it('detects VP8L lossless WebP dimensions (800x600)', async () => {
    // Build 25 bytes: RIFF header + WEBP + VP8L chunk
    // For 800x600: width-1=799=0x31F, height-1=599=0x257
    // packed = 799 | (599 << 14) = 799 | 9814016 = 9814815 = 0x95C31F
    // As uint32 LE: 0x1F, 0xC3, 0x95, 0x00
    const bytes = [
      0x52, 0x49, 0x46, 0x46, // "RIFF"
      0x19, 0x00, 0x00, 0x00, // 25
      0x57, 0x45, 0x42, 0x50, // "WEBP"
      0x56, 0x50, 0x38, 0x4c, // "VP8L"
      0x05, 0x00, 0x00, 0x00, // chunk size
      0x2f,                     // signature byte
      0x1f, 0xc3, 0x95, 0x00,  // packed dimensions LE
    ];

    const blob = createWebPBlob(bytes);
    const size = await FormatDetector.detectDimensions(blob, 'webp');

    expect(size).toEqual({ width: 800, height: 600 });
  });

  it('returns null for VP8L with invalid signature byte', async () => {
    const bytes = [
      0x52, 0x49, 0x46, 0x46,
      0x19, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50,
      0x56, 0x50, 0x38, 0x4c, // "VP8L"
      0x05, 0x00, 0x00, 0x00,
      0xaa, // invalid signature (should be 0x2f)
      0x1f, 0xc3, 0x95, 0x00,
    ];

    const blob = createWebPBlob(bytes);
    const size = await FormatDetector.detectDimensions(blob, 'webp');

    expect(size).toBeNull();
  });

  // ============================================================================
  // VP8X Extended Tests
  // ============================================================================

  it('detects VP8X extended WebP dimensions (1920x1080)', async () => {
    // Build 30 bytes: RIFF header + WEBP + VP8X chunk
    // For 1920x1080: width-1=1919=0x77F, height-1=1079=0x437
    // 24-bit LE: width bytes 24-26: 0x7F, 0x07, 0x00
    // 24-bit LE: height bytes 27-29: 0x37, 0x04, 0x00
    const bytes = [
      0x52, 0x49, 0x46, 0x46, // "RIFF" (bytes 0-3)
      0x1e, 0x00, 0x00, 0x00, // file size (bytes 4-7)
      0x57, 0x45, 0x42, 0x50, // "WEBP" (bytes 8-11)
      0x56, 0x50, 0x38, 0x58, // "VP8X" (bytes 12-15)
      0x0a, 0x00, 0x00, 0x00, // chunk size (bytes 16-19)
      0x00, 0x00, 0x00, 0x00, // flags (bytes 20-23)
      // Width-1 at bytes 24-26 (24-bit LE): 1919 = 0x00077F
      0x7f, 0x07, 0x00,
      // Height-1 at bytes 27-29 (24-bit LE): 1079 = 0x000437
      0x37, 0x04, 0x00,
    ];

    const blob = createWebPBlob(bytes);
    const size = await FormatDetector.detectDimensions(blob, 'webp');

    expect(size).toEqual({ width: 1920, height: 1080 });
  });

  it('detects VP8X with minimum dimensions (1x1)', async () => {
    // For 1x1: width-1=0, height-1=0
    const bytes = [
      0x52, 0x49, 0x46, 0x46, // RIFF (bytes 0-3)
      0x1e, 0x00, 0x00, 0x00, // file size (bytes 4-7)
      0x57, 0x45, 0x42, 0x50, // WEBP (bytes 8-11)
      0x56, 0x50, 0x38, 0x58, // VP8X (bytes 12-15)
      0x0a, 0x00, 0x00, 0x00, // chunk size (bytes 16-19)
      0x00, 0x00, 0x00, 0x00, // flags (bytes 20-23)
      // Width-1 = 0 (bytes 24-26)
      0x00, 0x00, 0x00,
      // Height-1 = 0 (bytes 27-29)
      0x00, 0x00, 0x00,
    ];

    const blob = createWebPBlob(bytes);
    const size = await FormatDetector.detectDimensions(blob, 'webp');

    expect(size).toEqual({ width: 1, height: 1 });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  it('returns null for blob smaller than 12 bytes', async () => {
    const bytes = [0x52, 0x49, 0x46, 0x46, 0x00];
    const blob = createWebPBlob(bytes);
    const size = await FormatDetector.detectDimensions(blob, 'webp');

    expect(size).toBeNull();
  });

  it('returns null for non-RIFF header', async () => {
    const bytes = [
      0x00, 0x00, 0x00, 0x00, // Not RIFF
      0x1e, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50, // "WEBP"
      0x56, 0x50, 0x38, 0x20,
    ];

    const blob = createWebPBlob(bytes);
    const size = await FormatDetector.detectDimensions(blob, 'webp');

    expect(size).toBeNull();
  });

  // ============================================================================
  // Cross-Format Tests (Verify Other Formats Still Work)
  // ============================================================================

  it('still detects PNG dimensions correctly', async () => {
    // PNG: dimensions at bytes 16-24 (big-endian)
    // 256x256
    const bytes = [
      0x89, 0x50, 0x4e, 0x47, // PNG header
      0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
      0x00, 0x00, 0x00, 0x0d, // IHDR chunk size
      0x49, 0x48, 0x44, 0x52, // "IHDR"
      // Width (big-endian): 256 = 0x00000100
      0x00, 0x00, 0x01, 0x00,
      // Height (big-endian): 256 = 0x00000100
      0x00, 0x00, 0x01, 0x00,
    ];

    const blob = createWebPBlob(bytes);
    const size = await FormatDetector.detectDimensions(blob, 'png');

    expect(size).toEqual({ width: 256, height: 256 });
  });

  it('still detects GIF dimensions correctly', async () => {
    // GIF: dimensions at bytes 6-10 (little-endian)
    // 128x64
    const bytes = [
      0x47, 0x49, 0x46, // "GIF"
      0x38, 0x39, 0x61, // "89a"
      // Width (LE): 128 = 0x0080
      0x80, 0x00,
      // Height (LE): 64 = 0x0040
      0x40, 0x00,
    ];

    const blob = createWebPBlob(bytes);
    const size = await FormatDetector.detectDimensions(blob, 'gif');

    expect(size).toEqual({ width: 128, height: 64 });
  });

  it('still detects BMP dimensions correctly', async () => {
    // BMP: dimensions at bytes 18-26 (little-endian)
    // 640x480
    const bytes = Array(26).fill(0);
    bytes[0] = 0x42; // "B"
    bytes[1] = 0x4d; // "M"

    // Width (LE): 640 = 0x0280
    bytes[18] = 0x80;
    bytes[19] = 0x02;

    // Height (LE): 480 = 0x01E0
    bytes[22] = 0xe0;
    bytes[23] = 0x01;

    const blob = createWebPBlob(bytes);
    const size = await FormatDetector.detectDimensions(blob, 'bmp');

    expect(size).toEqual({ width: 640, height: 480 });
  });

  it('returns null for JPEG without SOF marker in first 32 bytes', async () => {
    // JPEG: needs SOF marker (0xFFC0-0xFFC3, 0xFFC5-0xFFC7, etc.)
    const bytes = [
      0xff, 0xd8, 0xff, // JPEG SOI
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ];

    const blob = createWebPBlob(bytes);
    const size = await FormatDetector.detectDimensions(blob, 'jpeg');

    expect(size).toBeNull();
  });

  // ============================================================================
  // Format Detection Tests
  // ============================================================================

  it('detectFormat correctly identifies WebP from magic bytes', async () => {
    const bytes = [
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50, // WEBP
    ];

    const blob = createWebPBlob(bytes);
    const format = await FormatDetector.detectFormat(blob);

    expect(format).toBe('webp');
  });

  it('detectFormat correctly identifies PNG from magic bytes', async () => {
    const bytes = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

    const blob = createWebPBlob(bytes);
    const format = await FormatDetector.detectFormat(blob);

    expect(format).toBe('png');
  });

  it('detectFormat returns unknown for random bytes', async () => {
    const bytes = [0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff];

    const blob = createWebPBlob(bytes);
    const format = await FormatDetector.detectFormat(blob);

    expect(format).toBe('unknown');
  });
});
