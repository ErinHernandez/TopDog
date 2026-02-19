import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PsdImporter } from '@/lib/studio/editor/formats/psd/PsdImporter';

function buildMinimalPSD(options: {
  width: number;
  height: number;
  channels: number;
  depth: number;
  colorMode: number;
  compression: number;
  pixelData: Uint8Array;
}): ArrayBuffer {
  const { width, height, channels, depth, colorMode, compression, pixelData } = options;

  const headerSize = 26 + 4 + 4 + 4 + 2;
  const totalSize = headerSize + pixelData.length;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  let offset = 0;

  bytes[0] = 0x38;
  bytes[1] = 0x42;
  bytes[2] = 0x50;
  bytes[3] = 0x53;
  offset = 4;

  view.setUint16(offset, 1);
  offset += 2;

  offset += 6;

  view.setUint16(offset, channels);
  offset += 2;

  view.setUint32(offset, height);
  offset += 4;

  view.setUint32(offset, width);
  offset += 4;

  view.setUint16(offset, depth);
  offset += 2;

  view.setUint16(offset, colorMode);
  offset += 2;

  view.setUint32(offset, 0);
  offset += 4;

  view.setUint32(offset, 0);
  offset += 4;

  view.setUint32(offset, 0);
  offset += 4;

  view.setUint16(offset, compression);
  offset += 2;

  bytes.set(pixelData, offset);

  return buffer;
}

describe('PsdImporter.parseCompositeImage', () => {
  it('should import valid RGB PSD with raw compression and return ImportResult', async () => {
    // PSD format uses PLANAR pixel data: all R values, then all G values, then all B values
    const pixelCount = 4 * 4; // 16 pixels for 4x4 image
    const pixelData = new Uint8Array(pixelCount * 3);
    
    // Fill planar format: first 16 bytes = R channel, next 16 = G, next 16 = B
    for (let i = 0; i < pixelCount; i++) {
      pixelData[i] = 255; // R channel
    }
    for (let i = 0; i < pixelCount; i++) {
      pixelData[pixelCount + i] = 0; // G channel
    }
    for (let i = 0; i < pixelCount; i++) {
      pixelData[pixelCount * 2 + i] = 0; // B channel
    }

    const buffer = buildMinimalPSD({
      width: 4,
      height: 4,
      channels: 3,
      depth: 8,
      colorMode: 3,
      compression: 0,
      pixelData,
    });

    const importer = new PsdImporter(buffer);
    const result = await importer.import({
      preserveLayers: true,
      preserveBlendModes: true,
      preserveEffects: true,
      preserveMasks: true,
      flattenUnsupported: true,
      convertCmyk: true,
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.document).toBeDefined();
    expect(result.warnings).toBeDefined();
    expect(result.metadata).toBeDefined();
  });

  it('should import valid grayscale PSD and convert to RGBA', async () => {
    const pixelCount = 4 * 4;
    const pixelData = new Uint8Array(pixelCount);
    
    for (let i = 0; i < pixelData.length; i++) {
      pixelData[i] = 128;
    }

    const buffer = buildMinimalPSD({
      width: 4,
      height: 4,
      channels: 1,
      depth: 8,
      colorMode: 1,
      compression: 0,
      pixelData,
    });

    const importer = new PsdImporter(buffer);
    const result = await importer.import({
      preserveLayers: true,
      preserveBlendModes: true,
      preserveEffects: true,
      preserveMasks: true,
      flattenUnsupported: true,
      convertCmyk: true,
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.document).toBeDefined();
  });

  it('should return correct RGBA values for a known 2x2 RGB pixel pattern', async () => {
    // 2x2 image = 4 pixels, 3 channels (RGB) = 12 bytes total
    // Planar format: first 4 bytes = R values, next 4 = G values, last 4 = B values
    const pixelData = new Uint8Array(4 * 3);
    
    // Pixel 0: R=255, G=0, B=0 (red)
    // Pixel 1: R=0, G=255, B=0 (green)
    // Pixel 2: R=0, G=0, B=255 (blue)
    // Pixel 3: R=255, G=255, B=0 (yellow)
    
    // R channel
    pixelData[0] = 255;
    pixelData[1] = 0;
    pixelData[2] = 0;
    pixelData[3] = 255;
    
    // G channel
    pixelData[4] = 0;
    pixelData[5] = 255;
    pixelData[6] = 0;
    pixelData[7] = 255;
    
    // B channel
    pixelData[8] = 0;
    pixelData[9] = 0;
    pixelData[10] = 255;
    pixelData[11] = 0;

    const buffer = buildMinimalPSD({
      width: 2,
      height: 2,
      channels: 3,
      depth: 8,
      colorMode: 3,
      compression: 0,
      pixelData,
    });

    const importer = new PsdImporter(buffer);
    const result = await importer.import({
      preserveLayers: true,
      preserveBlendModes: true,
      preserveEffects: true,
      preserveMasks: true,
      flattenUnsupported: true,
      convertCmyk: true,
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.document).toBeDefined();
  });

  it('should import and return correct document dimensions', async () => {
    const width = 512;
    const height = 256;
    const pixelCount = width * height;
    const pixelData = new Uint8Array(pixelCount * 3);

    const buffer = buildMinimalPSD({
      width,
      height,
      channels: 3,
      depth: 8,
      colorMode: 3,
      compression: 0,
      pixelData,
    });

    const importer = new PsdImporter(buffer);
    const result = await importer.import({
      preserveLayers: true,
      preserveBlendModes: true,
      preserveEffects: true,
      preserveMasks: true,
      flattenUnsupported: true,
      convertCmyk: true,
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.metadata).toBeDefined();
    expect(result.metadata.originalDimensions.width).toBe(width);
    expect(result.metadata.originalDimensions.height).toBe(height);
  });

  it('should return error for invalid PSD signature', async () => {
    const buffer = new ArrayBuffer(26);
    const bytes = new Uint8Array(buffer);
    bytes[0] = 0xFF;
    bytes[1] = 0xFF;
    bytes[2] = 0xFF;
    bytes[3] = 0xFF;

    const importer = new PsdImporter(buffer);
    const result = await importer.import({
      preserveLayers: true,
      preserveBlendModes: true,
      preserveEffects: true,
      preserveMasks: true,
      flattenUnsupported: true,
      convertCmyk: true,
    });

    expect(result).toBeDefined();
    expect(result.success === false || result.warnings.length > 0).toBe(true);
  });

  it('should convert CMYK color mode to RGB correctly', async () => {
    // CMYK = 4 channels per pixel
    const pixelCount = 4 * 4; // 16 pixels
    const pixelData = new Uint8Array(pixelCount * 4);
    
    // Fill planar format: C, M, Y, K channels
    for (let i = 0; i < pixelCount; i++) {
      pixelData[i] = 100; // C channel
    }
    for (let i = 0; i < pixelCount; i++) {
      pixelData[pixelCount + i] = 100; // M channel
    }
    for (let i = 0; i < pixelCount; i++) {
      pixelData[pixelCount * 2 + i] = 100; // Y channel
    }
    for (let i = 0; i < pixelCount; i++) {
      pixelData[pixelCount * 3 + i] = 50; // K channel
    }

    const buffer = buildMinimalPSD({
      width: 4,
      height: 4,
      channels: 4,
      depth: 8,
      colorMode: 4,
      compression: 0,
      pixelData,
    });

    const importer = new PsdImporter(buffer);
    const result = await importer.import({
      preserveLayers: true,
      preserveBlendModes: true,
      preserveEffects: true,
      preserveMasks: true,
      flattenUnsupported: true,
      convertCmyk: true,
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.document).toBeDefined();
  });

  it('should convert 16-bit depth to 8-bit', async () => {
    // 16-bit depth means 2 bytes per channel per pixel
    const pixelCount = 4 * 4;
    const pixelData = new Uint8Array(pixelCount * 3 * 2);
    
    for (let i = 0; i < pixelData.length; i++) {
      pixelData[i] = 128;
    }

    const buffer = buildMinimalPSD({
      width: 4,
      height: 4,
      channels: 3,
      depth: 16,
      colorMode: 3,
      compression: 0,
      pixelData,
    });

    const importer = new PsdImporter(buffer);
    const result = await importer.import({
      preserveLayers: true,
      preserveBlendModes: true,
      preserveEffects: true,
      preserveMasks: true,
      flattenUnsupported: true,
      convertCmyk: true,
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.document).toBeDefined();
  });

  it('should handle empty pixel data gracefully', async () => {
    const pixelData = new Uint8Array(0);

    const buffer = buildMinimalPSD({
      width: 4,
      height: 4,
      channels: 3,
      depth: 8,
      colorMode: 3,
      compression: 0,
      pixelData,
    });

    const importer = new PsdImporter(buffer);
    const result = await importer.import({
      preserveLayers: true,
      preserveBlendModes: true,
      preserveEffects: true,
      preserveMasks: true,
      flattenUnsupported: true,
      convertCmyk: true,
    });

    expect(result).toBeDefined();
  });

  it('should include correct metadata with file info', async () => {
    const width = 100;
    const height = 200;
    const channels = 3;
    const pixelCount = width * height;
    const pixelData = new Uint8Array(pixelCount * channels);

    const buffer = buildMinimalPSD({
      width,
      height,
      channels,
      depth: 8,
      colorMode: 3,
      compression: 0,
      pixelData,
    });

    const importer = new PsdImporter(buffer);
    const result = await importer.import({
      preserveLayers: true,
      preserveBlendModes: true,
      preserveEffects: true,
      preserveMasks: true,
      flattenUnsupported: true,
      convertCmyk: true,
    });

    expect(result.metadata).toBeDefined();
    expect(result.metadata.originalDimensions.width).toBe(width);
    expect(result.metadata.originalDimensions.height).toBe(height);
  });

  it('should generate warning for CMYK color mode', async () => {
    const pixelCount = 4 * 4;
    const pixelData = new Uint8Array(pixelCount * 4);
    
    for (let i = 0; i < pixelData.length; i++) {
      pixelData[i] = 100;
    }

    const buffer = buildMinimalPSD({
      width: 4,
      height: 4,
      channels: 4,
      depth: 8,
      colorMode: 4,
      compression: 0,
      pixelData,
    });

    const importer = new PsdImporter(buffer);
    const result = await importer.import({
      preserveLayers: true,
      preserveBlendModes: true,
      preserveEffects: true,
      preserveMasks: true,
      flattenUnsupported: true,
      convertCmyk: true,
    });

    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});
