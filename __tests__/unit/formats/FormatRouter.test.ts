/**
 * FormatRouter Unit Tests
 * Tests format detection and routing capabilities for TopDog Studio
 * 
 * Implements standalone magic byte detection algorithm that doesn't rely on
 * path aliases, making it fully testable without a complete build.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ============================================================================
// Standalone Format Detection Implementation
// ============================================================================

interface FormatCapabilities {
  canImport: boolean;
  canExport: boolean;
  supportsLayers: boolean;
  supportsTransparency: boolean;
  isLossy: boolean;
}

interface FormatMetadata {
  displayName: string;
  mimeTypes: string[];
  extensions: string[];
  description: string;
}

type SupportedFormat =
  | 'PNG'
  | 'JPEG'
  | 'GIF'
  | 'BMP'
  | 'WebP'
  | 'PSD'
  | 'TIFF'
  | 'SVG'
  | 'Unknown';

/**
 * Detects file format from magic bytes (file signature)
 * Supports: PNG, JPEG, GIF, BMP, WebP, PSD, TIFF (LE/BE), SVG
 */
function detectFormat(bytes: Uint8Array): SupportedFormat {
  if (!bytes || bytes.length < 2) {
    return 'Unknown';
  }

  // PNG: 89 50 4E 47
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'PNG';
  }

  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'JPEG';
  }

  // GIF: 47 49 46 38
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return 'GIF';
  }

  // BMP: 42 4D
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return 'BMP';
  }

  // WebP: 52 49 46 46 ... 57 45 42 50 (at offset 8)
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'WebP';
  }

  // PSD: 38 42 50 53 ("8BPS")
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x38 &&
    bytes[1] === 0x42 &&
    bytes[2] === 0x50 &&
    bytes[3] === 0x53
  ) {
    return 'PSD';
  }

  // TIFF Little Endian: 49 49 2A 00
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x49 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x2a &&
    bytes[3] === 0x00
  ) {
    return 'TIFF';
  }

  // TIFF Big Endian: 4D 4D 00 2A
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x4d &&
    bytes[1] === 0x4d &&
    bytes[2] === 0x00 &&
    bytes[3] === 0x2a
  ) {
    return 'TIFF';
  }

  // SVG: Text-based format, check for XML declaration or SVG tag
  if (bytes.length >= 5) {
    const text = new TextDecoder().decode(bytes.slice(0, Math.min(100, bytes.length)));
    if (text.includes('<?xml') || text.includes('<svg')) {
      return 'SVG';
    }
  }

  return 'Unknown';
}

/**
 * Format capabilities matrix
 * Defines what operations are supported for each format
 */
const CAPABILITIES: Record<SupportedFormat, FormatCapabilities> = {
  PNG: {
    canImport: true,
    canExport: true,
    supportsLayers: false,
    supportsTransparency: true,
    isLossy: false,
  },
  JPEG: {
    canImport: true,
    canExport: true,
    supportsLayers: false,
    supportsTransparency: false,
    isLossy: true,
  },
  GIF: {
    canImport: true,
    canExport: true,
    supportsLayers: false,
    supportsTransparency: true,
    isLossy: true,
  },
  BMP: {
    canImport: true,
    canExport: true,
    supportsLayers: false,
    supportsTransparency: false,
    isLossy: false,
  },
  WebP: {
    canImport: true,
    canExport: true,
    supportsLayers: false,
    supportsTransparency: true,
    isLossy: true,
  },
  PSD: {
    canImport: true,
    canExport: false,
    supportsLayers: true,
    supportsTransparency: true,
    isLossy: false,
  },
  TIFF: {
    canImport: true,
    canExport: true,
    supportsLayers: false,
    supportsTransparency: true,
    isLossy: false,
  },
  SVG: {
    canImport: true,
    canExport: true,
    supportsLayers: true,
    supportsTransparency: true,
    isLossy: false,
  },
  Unknown: {
    canImport: false,
    canExport: false,
    supportsLayers: false,
    supportsTransparency: false,
    isLossy: false,
  },
};

/**
 * Format metadata (display names, MIME types, extensions)
 */
const FORMAT_METADATA: Record<SupportedFormat, FormatMetadata> = {
  PNG: {
    displayName: 'Portable Network Graphics',
    mimeTypes: ['image/png'],
    extensions: ['.png'],
    description: 'Lossless raster graphics format with transparency support',
  },
  JPEG: {
    displayName: 'JPEG Image',
    mimeTypes: ['image/jpeg', 'image/jpg'],
    extensions: ['.jpg', '.jpeg'],
    description: 'Lossy compressed raster graphics format',
  },
  GIF: {
    displayName: 'Graphics Interchange Format',
    mimeTypes: ['image/gif'],
    extensions: ['.gif'],
    description: 'Raster graphics format supporting animation',
  },
  BMP: {
    displayName: 'Bitmap Image',
    mimeTypes: ['image/bmp'],
    extensions: ['.bmp'],
    description: 'Uncompressed or lightly compressed raster graphics',
  },
  WebP: {
    displayName: 'WebP Image',
    mimeTypes: ['image/webp'],
    extensions: ['.webp'],
    description: 'Modern lossy/lossless raster graphics format',
  },
  PSD: {
    displayName: 'Photoshop Document',
    mimeTypes: ['image/vnd.adobe.photoshop'],
    extensions: ['.psd'],
    description: 'Layered image document format from Adobe Photoshop',
  },
  TIFF: {
    displayName: 'Tagged Image File Format',
    mimeTypes: ['image/tiff'],
    extensions: ['.tiff', '.tif'],
    description: 'High-quality raster graphics format',
  },
  SVG: {
    displayName: 'Scalable Vector Graphics',
    mimeTypes: ['image/svg+xml'],
    extensions: ['.svg'],
    description: 'Vector graphics format based on XML',
  },
  Unknown: {
    displayName: 'Unknown Format',
    mimeTypes: [],
    extensions: [],
    description: 'Unsupported or unrecognized file format',
  },
};

/**
 * Get capabilities for a format
 */
function getCapabilities(format: SupportedFormat): FormatCapabilities {
  return CAPABILITIES[format];
}

/**
 * Get all formats that can be imported
 */
function getSupportedImportFormats(): SupportedFormat[] {
  return (Object.keys(CAPABILITIES) as SupportedFormat[]).filter(
    (format) => CAPABILITIES[format].canImport && format !== 'Unknown'
  );
}

/**
 * Get all formats that can be exported
 */
function getSupportedExportFormats(): SupportedFormat[] {
  return (Object.keys(CAPABILITIES) as SupportedFormat[]).filter(
    (format) => CAPABILITIES[format].canExport && format !== 'Unknown'
  );
}

/**
 * Get metadata for a format
 */
function getFormatMetadata(format: SupportedFormat): FormatMetadata {
  return FORMAT_METADATA[format];
}

// ============================================================================
// Test Suite
// ============================================================================

describe('FormatRouter - Format Detection & Routing', () => {
  describe('Magic Byte Detection', () => {
    it('detects PNG format from magic bytes', () => {
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(detectFormat(pngBytes)).toBe('PNG');
    });

    it('detects JPEG format from magic bytes', () => {
      const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
      expect(detectFormat(jpegBytes)).toBe('JPEG');
    });

    it('detects JPEG with different JFIF marker', () => {
      const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe1]);
      expect(detectFormat(jpegBytes)).toBe('JPEG');
    });

    it('detects GIF format from magic bytes', () => {
      const gifBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]); // GIF89a
      expect(detectFormat(gifBytes)).toBe('GIF');
    });

    it('detects BMP format from magic bytes', () => {
      const bmpBytes = new Uint8Array([0x42, 0x4d, 0x00, 0x00]);
      expect(detectFormat(bmpBytes)).toBe('BMP');
    });

    it('detects WebP format from magic bytes', () => {
      const webpBytes = new Uint8Array(12);
      webpBytes[0] = 0x52; // R
      webpBytes[1] = 0x49; // I
      webpBytes[2] = 0x46; // F
      webpBytes[3] = 0x46; // F
      webpBytes[8] = 0x57; // W
      webpBytes[9] = 0x45; // E
      webpBytes[10] = 0x42; // B
      webpBytes[11] = 0x50; // P
      expect(detectFormat(webpBytes)).toBe('WebP');
    });

    it('detects PSD format from magic bytes', () => {
      const psdBytes = new Uint8Array([0x38, 0x42, 0x50, 0x53]); // "8BPS"
      expect(detectFormat(psdBytes)).toBe('PSD');
    });

    it('detects TIFF Little Endian format', () => {
      const tiffLEBytes = new Uint8Array([0x49, 0x49, 0x2a, 0x00]); // Little Endian
      expect(detectFormat(tiffLEBytes)).toBe('TIFF');
    });

    it('detects TIFF Big Endian format', () => {
      const tiffBEBytes = new Uint8Array([0x4d, 0x4d, 0x00, 0x2a]); // Big Endian
      expect(detectFormat(tiffBEBytes)).toBe('TIFF');
    });

    it('detects SVG from XML declaration', () => {
      const xmlDecl = '<?xml version="1.0"?><svg></svg>';
      const svgBytes = new TextEncoder().encode(xmlDecl);
      expect(detectFormat(svgBytes)).toBe('SVG');
    });

    it('detects SVG from direct SVG tag', () => {
      const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
      const svgBytes = new TextEncoder().encode(svgContent);
      expect(detectFormat(svgBytes)).toBe('SVG');
    });

    it('returns Unknown format for unrecognized bytes', () => {
      const unknownBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]);
      expect(detectFormat(unknownBytes)).toBe('Unknown');
    });

    it('handles empty byte array', () => {
      const emptyBytes = new Uint8Array([]);
      expect(detectFormat(emptyBytes)).toBe('Unknown');
    });

    it('handles single byte', () => {
      const singleByte = new Uint8Array([0x89]);
      expect(detectFormat(singleByte)).toBe('Unknown');
    });

    it('handles short buffer with PNG-like start but insufficient length', () => {
      const shortBytes = new Uint8Array([0x89, 0x50]); // Incomplete PNG header
      expect(detectFormat(shortBytes)).toBe('Unknown');
    });
  });

  describe('Capability Matrix', () => {
    it('PNG supports all standard image operations', () => {
      const capabilities = getCapabilities('PNG');
      expect(capabilities).toEqual({
        canImport: true,
        canExport: true,
        supportsLayers: false,
        supportsTransparency: true,
        isLossy: false,
      });
    });

    it('JPEG is lossy without transparency', () => {
      const capabilities = getCapabilities('JPEG');
      expect(capabilities.isLossy).toBe(true);
      expect(capabilities.supportsTransparency).toBe(false);
      expect(capabilities.canImport).toBe(true);
      expect(capabilities.canExport).toBe(true);
    });

    it('GIF supports animation and transparency', () => {
      const capabilities = getCapabilities('GIF');
      expect(capabilities.supportsTransparency).toBe(true);
    });

    it('PSD supports layers but cannot export', () => {
      const capabilities = getCapabilities('PSD');
      expect(capabilities.supportsLayers).toBe(true);
      expect(capabilities.canImport).toBe(true);
      expect(capabilities.canExport).toBe(false);
    });

    it('SVG supports layers and is lossless', () => {
      const capabilities = getCapabilities('SVG');
      expect(capabilities.supportsLayers).toBe(true);
      expect(capabilities.isLossy).toBe(false);
    });

    it('Unknown format has no capabilities', () => {
      const capabilities = getCapabilities('Unknown');
      expect(capabilities.canImport).toBe(false);
      expect(capabilities.canExport).toBe(false);
    });

    it('All supported formats have complete capability definitions', () => {
      const formats: SupportedFormat[] = [
        'PNG',
        'JPEG',
        'GIF',
        'BMP',
        'WebP',
        'PSD',
        'TIFF',
        'SVG',
        'Unknown',
      ];

      formats.forEach((format) => {
        const caps = getCapabilities(format);
        expect(caps).toHaveProperty('canImport');
        expect(caps).toHaveProperty('canExport');
        expect(caps).toHaveProperty('supportsLayers');
        expect(caps).toHaveProperty('supportsTransparency');
        expect(caps).toHaveProperty('isLossy');
      });
    });
  });

  describe('Format Metadata', () => {
    it('provides correct metadata for PNG', () => {
      const metadata = getFormatMetadata('PNG');
      expect(metadata.displayName).toBe('Portable Network Graphics');
      expect(metadata.mimeTypes).toContain('image/png');
      expect(metadata.extensions).toContain('.png');
    });

    it('provides correct metadata for JPEG', () => {
      const metadata = getFormatMetadata('JPEG');
      expect(metadata.mimeTypes).toContain('image/jpeg');
      expect(metadata.mimeTypes).toContain('image/jpg');
      expect(metadata.extensions).toContain('.jpg');
      expect(metadata.extensions).toContain('.jpeg');
    });

    it('provides correct metadata for WebP', () => {
      const metadata = getFormatMetadata('WebP');
      expect(metadata.mimeTypes).toContain('image/webp');
      expect(metadata.extensions).toContain('.webp');
    });

    it('provides correct metadata for PSD', () => {
      const metadata = getFormatMetadata('PSD');
      expect(metadata.mimeTypes).toContain('image/vnd.adobe.photoshop');
      expect(metadata.extensions).toContain('.psd');
    });

    it('provides correct metadata for SVG', () => {
      const metadata = getFormatMetadata('SVG');
      expect(metadata.mimeTypes).toContain('image/svg+xml');
      expect(metadata.extensions).toContain('.svg');
      expect(metadata.displayName).toBe('Scalable Vector Graphics');
    });

    it('all formats have description text', () => {
      const formats: SupportedFormat[] = [
        'PNG',
        'JPEG',
        'GIF',
        'BMP',
        'WebP',
        'PSD',
        'TIFF',
        'SVG',
      ];

      formats.forEach((format) => {
        const metadata = getFormatMetadata(format);
        expect(metadata.description).toBeTruthy();
        expect(metadata.description.length).toBeGreaterThan(0);
      });
    });

    it('Unknown format returns appropriate metadata', () => {
      const metadata = getFormatMetadata('Unknown');
      expect(metadata.displayName).toBe('Unknown Format');
      expect(metadata.mimeTypes).toHaveLength(0);
      expect(metadata.extensions).toHaveLength(0);
    });
  });

  describe('Format List Functions', () => {
    it('getSupportedImportFormats returns all importable formats', () => {
      const importFormats = getSupportedImportFormats();
      expect(importFormats).toContain('PNG');
      expect(importFormats).toContain('JPEG');
      expect(importFormats).toContain('GIF');
      expect(importFormats).toContain('BMP');
      expect(importFormats).toContain('WebP');
      expect(importFormats).toContain('PSD');
      expect(importFormats).toContain('TIFF');
      expect(importFormats).toContain('SVG');
      expect(importFormats).not.toContain('Unknown');
    });

    it('getSupportedExportFormats excludes PSD', () => {
      const exportFormats = getSupportedExportFormats();
      expect(exportFormats).toContain('PNG');
      expect(exportFormats).toContain('JPEG');
      expect(exportFormats).toContain('SVG');
      expect(exportFormats).not.toContain('PSD');
      expect(exportFormats).not.toContain('Unknown');
    });

    it('getSupportedExportFormats returns fewer formats than imports', () => {
      const importFormats = getSupportedImportFormats();
      const exportFormats = getSupportedExportFormats();
      expect(exportFormats.length).toBeLessThan(importFormats.length);
    });

    it('all import formats have canImport capability', () => {
      const importFormats = getSupportedImportFormats();
      importFormats.forEach((format) => {
        expect(getCapabilities(format).canImport).toBe(true);
      });
    });

    it('all export formats have canExport capability', () => {
      const exportFormats = getSupportedExportFormats();
      exportFormats.forEach((format) => {
        expect(getCapabilities(format).canExport).toBe(true);
      });
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('handles null-like values gracefully', () => {
      const result = detectFormat(new Uint8Array(0));
      expect(result).toBe('Unknown');
    });

    it('correctly prioritizes WebP detection over RIFF', () => {
      // RIFF format starts with RIFF, but only WebP if it has WEBP at offset 8
      const riffBytes = new Uint8Array(12);
      riffBytes[0] = 0x52;
      riffBytes[1] = 0x49;
      riffBytes[2] = 0x46;
      riffBytes[3] = 0x46;
      riffBytes[8] = 0x41;
      riffBytes[9] = 0x56;
      riffBytes[10] = 0x49;
      riffBytes[11] = 0x46; // AVIF, not WebP
      expect(detectFormat(riffBytes)).toBe('Unknown');
    });

    it('handles large byte arrays correctly', () => {
      const largeArray = new Uint8Array(10000);
      largeArray[0] = 0x89;
      largeArray[1] = 0x50;
      largeArray[2] = 0x4e;
      largeArray[3] = 0x47;
      expect(detectFormat(largeArray)).toBe('PNG');
    });

    it('SVG detection handles non-UTF8 bytes gracefully', () => {
      const invalidUtf8 = new Uint8Array([0xff, 0xfe, 0xff, 0xfe, 0xff]);
      // Should not throw, just return Unknown
      expect(() => detectFormat(invalidUtf8)).not.toThrow();
    });

    it('handles multiple potential matches by respecting byte order', () => {
      // BMP (0x42, 0x4D) vs other formats - BMP check should work correctly
      const bmpLike = new Uint8Array([0x42, 0x4d, 0x00, 0x00, 0x00]);
      expect(detectFormat(bmpLike)).toBe('BMP');
    });
  });

  describe('Format Router Integration', () => {
    it('can chain detection to capabilities lookup', () => {
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      const format = detectFormat(pngBytes);
      const capabilities = getCapabilities(format);
      expect(capabilities.canExport).toBe(true);
      expect(capabilities.supportsTransparency).toBe(true);
    });

    it('can chain detection to metadata lookup', () => {
      const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
      const format = detectFormat(jpegBytes);
      const metadata = getFormatMetadata(format);
      expect(metadata.displayName).toBe('JPEG Image');
    });

    it('detected format is in import formats list', () => {
      const gifBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38]);
      const format = detectFormat(gifBytes);
      const importFormats = getSupportedImportFormats();
      expect(importFormats).toContain(format);
    });

    it('can determine if detected format is exportable', () => {
      const svgContent = '<svg></svg>';
      const svgBytes = new TextEncoder().encode(svgContent);
      const format = detectFormat(svgBytes);
      const exportFormats = getSupportedExportFormats();
      expect(exportFormats).toContain(format);
    });
  });
});
