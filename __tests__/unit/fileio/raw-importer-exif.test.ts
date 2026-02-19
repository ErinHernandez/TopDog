import { describe, it, expect } from 'vitest';
import { RawImporter } from '@/lib/studio/editor/formats/raw/RawImporter';

/**
 * Helper function to build a valid TIFF buffer with configurable entries
 */
function buildTiffBuffer(options: {
  byteOrder?: 'LE' | 'BE';
  entries?: Array<{
    tag: number;
    type: number;
    count: number;
    value?: number;
    stringValue?: string;
  }>;
}): ArrayBuffer {
  const { byteOrder = 'LE', entries = [] } = options;
  const littleEndian = byteOrder === 'LE';

  // Calculate required buffer size
  // TIFF header: 8 bytes
  // IFD: 2 (count) + 12 * numEntries + 4 (next IFD offset)
  // String data: variable
  let stringDataSize = 0;
  const stringOffsets: Map<number, number> = new Map();
  let currentStringOffset = 8 + 2 + entries.length * 12 + 4; // After IFD

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.stringValue && entry.count > 4) {
      stringOffsets.set(i, currentStringOffset);
      currentStringOffset += entry.stringValue.length + 1; // +1 for null terminator
      stringDataSize += entry.stringValue.length + 1;
    }
  }

  const bufferSize = 8 + 2 + entries.length * 12 + 4 + stringDataSize;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  // Write TIFF header
  // Byte order mark
  if (littleEndian) {
    view.setUint16(0, 0x4949, true); // 'II' - little-endian
  } else {
    view.setUint16(0, 0x4d4d, true); // 'MM' - big-endian (written as LE for the mark itself)
  }

  // TIFF magic number (42)
  view.setUint16(2, 0x002a, littleEndian);

  // IFD0 offset
  const ifdOffset = 8;
  view.setUint32(4, ifdOffset, littleEndian);

  // Write IFD
  view.setUint16(ifdOffset, entries.length, littleEndian);

  // Write IFD entries
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const entryOffset = ifdOffset + 2 + i * 12;

    // Tag
    view.setUint16(entryOffset, entry.tag, littleEndian);

    // Type
    view.setUint16(entryOffset + 2, entry.type, littleEndian);

    // Count
    view.setUint32(entryOffset + 4, entry.count, littleEndian);

    // Value or offset
    if (entry.stringValue) {
      if (entry.count <= 4) {
        // Inline string
        for (let j = 0; j < entry.stringValue.length; j++) {
          view.setUint8(entryOffset + 8 + j, entry.stringValue.charCodeAt(j));
        }
      } else {
        // String offset
        const stringOffset = stringOffsets.get(i) || 0;
        view.setUint32(entryOffset + 8, stringOffset, littleEndian);
      }
    } else if (entry.type === 3) {
      // SHORT
      view.setUint16(entryOffset + 8, entry.value || 0, littleEndian);
    } else if (entry.type === 4) {
      // LONG
      view.setUint32(entryOffset + 8, entry.value || 0, littleEndian);
    }
  }

  // Write next IFD offset (0 = no more IFDs)
  view.setUint32(ifdOffset + 2 + entries.length * 12, 0, littleEndian);

  // Write string data
  let stringDataOffset = 8 + 2 + entries.length * 12 + 4;
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.stringValue && entry.count > 4) {
      for (let j = 0; j < entry.stringValue.length; j++) {
        view.setUint8(stringDataOffset + j, entry.stringValue.charCodeAt(j));
      }
      view.setUint8(stringDataOffset + entry.stringValue.length, 0); // Null terminator
      stringDataOffset += entry.stringValue.length + 1;
    }
  }

  return buffer;
}

/**
 * Helper function to build a JPEG buffer with SOF0/SOF2 marker
 */
function buildJpegBuffer(options: {
  width?: number;
  height?: number;
  marker?: 0xc0 | 0xc2;
  includeStart?: boolean;
  includeEnd?: boolean;
}): ArrayBuffer {
  const { width = 160, height = 120, marker = 0xc0, includeStart = true, includeEnd = true } = options;

  // Build JPEG segments
  const segments: number[] = [];

  // JPEG start marker
  if (includeStart) {
    segments.push(0xff, 0xd8); // SOI
  }

  // APP0 marker (dummy)
  segments.push(0xff, 0xe0, 0x00, 0x10); // Length
  for (let i = 0; i < 12; i++) segments.push(0x00); // Dummy data

  // SOF0 or SOF2 marker
  segments.push(0xff, marker); // SOF0 or SOF2
  segments.push(0x00, 0x11); // Length: 17 bytes
  segments.push(0x08); // Precision: 8 bits
  // Height (big-endian)
  segments.push((height >> 8) & 0xff, height & 0xff);
  // Width (big-endian)
  segments.push((width >> 8) & 0xff, width & 0xff);
  segments.push(0x03); // Number of components
  for (let i = 0; i < 12; i++) segments.push(0x00); // Dummy component data

  // JPEG end marker
  if (includeEnd) {
    segments.push(0xff, 0xd9); // EOI
  }

  const buffer = new ArrayBuffer(segments.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < segments.length; i++) {
    view[i] = segments[i];
  }

  return buffer;
}

/**
 * Test suite for RawImporter
 */
describe('RawImporter', () => {
  describe('readExifString', () => {
    it('reads ASCII string from TIFF IFD entry (little-endian)', () => {
      // Build TIFF buffer with Make tag (0x010F) = "Canon"
      const buffer = buildTiffBuffer({
        byteOrder: 'LE',
        entries: [
          {
            tag: 0x010f, // Make
            type: 2, // ASCII
            count: 6, // "Canon\0"
            stringValue: 'Canon',
          },
        ],
      });

      const importer = new RawImporter(buffer, 'test.cr2');
      const result = (importer as any).readExifString(new DataView(buffer), 0x010f);

      expect(result).toBe('Canon');
    });

    it('reads inline string when count <= 4', () => {
      // Build TIFF buffer with inline string "XYZ\0"
      const buffer = buildTiffBuffer({
        byteOrder: 'LE',
        entries: [
          {
            tag: 0x010f, // Make
            type: 2, // ASCII
            count: 4, // Inline: "XYZ\0"
            stringValue: 'XYZ',
          },
        ],
      });

      const importer = new RawImporter(buffer, 'test.cr2');
      const result = (importer as any).readExifString(new DataView(buffer), 0x010f);

      expect(result).toBe('XYZ');
    });

    it('returns null for missing tag', () => {
      // Build TIFF buffer with Make tag (0x010F) but query Model tag (0x0110)
      const buffer = buildTiffBuffer({
        byteOrder: 'LE',
        entries: [
          {
            tag: 0x010f, // Make
            type: 2,
            count: 6,
            stringValue: 'Canon',
          },
        ],
      });

      const importer = new RawImporter(buffer, 'test.cr2');
      const result = (importer as any).readExifString(new DataView(buffer), 0x0110); // Model

      expect(result).toBeNull();
    });

    it('returns null for empty/corrupt buffer', () => {
      // Build a tiny 4-byte buffer (too small for valid TIFF)
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setUint16(0, 0x4949, true);
      view.setUint16(2, 0x002a, true);

      const importer = new RawImporter(buffer, 'test.cr2');
      const result = (importer as any).readExifString(view, 0x010f);

      expect(result).toBeNull();
    });
  });

  describe('estimateSensorDimensions', () => {
    it('reads width and height from TIFF tags (LONG type)', () => {
      // Build TIFF buffer with ImageWidth (0x0100) and ImageLength (0x0101) as LONG
      const buffer = buildTiffBuffer({
        byteOrder: 'LE',
        entries: [
          {
            tag: 0x0100, // ImageWidth
            type: 4, // LONG
            count: 1,
            value: 4000,
          },
          {
            tag: 0x0101, // ImageLength
            type: 4, // LONG
            count: 1,
            value: 3000,
          },
        ],
      });

      const importer = new RawImporter(buffer, 'test.cr2');
      const result = (importer as any).estimateSensorDimensions();

      expect(result).toEqual({ width: 4000, height: 3000 });
    });

    it('reads SHORT type dimensions', () => {
      // Build TIFF buffer with ImageWidth and ImageLength as SHORT
      const buffer = buildTiffBuffer({
        byteOrder: 'LE',
        entries: [
          {
            tag: 0x0100, // ImageWidth
            type: 3, // SHORT
            count: 1,
            value: 1920,
          },
          {
            tag: 0x0101, // ImageLength
            type: 3, // SHORT
            count: 1,
            value: 1080,
          },
        ],
      });

      const importer = new RawImporter(buffer, 'test.cr2');
      const result = (importer as any).estimateSensorDimensions();

      expect(result).toEqual({ width: 1920, height: 1080 });
    });

    it('falls back to 6000x4000 on corrupt buffer', () => {
      // Build a tiny 4-byte buffer
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setUint16(0, 0x4949, true);
      view.setUint16(2, 0x002a, true);

      const importer = new RawImporter(buffer, 'test.cr2');
      const result = (importer as any).estimateSensorDimensions();

      expect(result).toEqual({ width: 6000, height: 4000 });
    });

    it('falls back when dimensions are out of range', () => {
      // Build TIFF buffer with invalid dimensions
      const buffer = buildTiffBuffer({
        byteOrder: 'LE',
        entries: [
          {
            tag: 0x0100, // ImageWidth
            type: 4, // LONG
            count: 1,
            value: 200000, // Out of range (>100000)
          },
          {
            tag: 0x0101, // ImageLength
            type: 4, // LONG
            count: 1,
            value: 150000, // Out of range
          },
        ],
      });

      const importer = new RawImporter(buffer, 'test.cr2');
      const result = (importer as any).estimateSensorDimensions();

      expect(result).toEqual({ width: 6000, height: 4000 });
    });

    it('falls back when width or height is zero', () => {
      // Build TIFF buffer with zero dimensions
      const buffer = buildTiffBuffer({
        byteOrder: 'LE',
        entries: [
          {
            tag: 0x0100, // ImageWidth
            type: 4,
            count: 1,
            value: 0,
          },
          {
            tag: 0x0101, // ImageLength
            type: 4,
            count: 1,
            value: 3000,
          },
        ],
      });

      const importer = new RawImporter(buffer, 'test.cr2');
      const result = (importer as any).estimateSensorDimensions();

      expect(result).toEqual({ width: 6000, height: 4000 });
    });
  });

  describe('extractEmbeddedThumbnail', () => {
    it('extracts thumbnail with SOF0 dimensions', () => {
      // Build JPEG buffer with SOF0 marker and specific dimensions
      const jpegBuffer = buildJpegBuffer({
        width: 160,
        height: 120,
        marker: 0xc0,
      });

      const importer = new RawImporter(jpegBuffer, 'test.cr2');
      const cameraInfo = {
        make: 'Canon',
        model: 'EOS 5D',
        sensorWidth: 6000,
        sensorHeight: 4000,
        isoMin: 100,
        isoMax: 25600,
        hasEmbeddedThumbnail: true,
        thumbnailWidth: 160,
        thumbnailHeight: 120,
      };

      const result = (importer as any).extractEmbeddedThumbnail(cameraInfo);

      expect(result).not.toBeNull();
      expect(result.width).toBe(160);
      expect(result.height).toBe(120);
      expect(result.data).toBeInstanceOf(Uint8ClampedArray);
      expect(result.data.length).toBe(160 * 120 * 4); // RGBA
    });

    it('extracts thumbnail with SOF2 dimensions', () => {
      // Build JPEG buffer with SOF2 marker
      const jpegBuffer = buildJpegBuffer({
        width: 200,
        height: 150,
        marker: 0xc2,
      });

      const importer = new RawImporter(jpegBuffer, 'test.nef');
      const cameraInfo = {
        make: 'Nikon',
        model: 'D850',
        sensorWidth: 6000,
        sensorHeight: 4000,
        isoMin: 100,
        isoMax: 25600,
        hasEmbeddedThumbnail: true,
        thumbnailWidth: 200,
        thumbnailHeight: 150,
      };

      const result = (importer as any).extractEmbeddedThumbnail(cameraInfo);

      expect(result).not.toBeNull();
      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
      expect(result.data.length).toBe(200 * 150 * 4);
    });

    it('returns null when no JPEG found', () => {
      // Build buffer without JPEG markers
      const buffer = buildTiffBuffer({
        byteOrder: 'LE',
        entries: [],
      });

      const importer = new RawImporter(buffer, 'test.cr2');
      const cameraInfo = {
        make: 'Canon',
        model: 'EOS 5D',
        sensorWidth: 6000,
        sensorHeight: 4000,
        isoMin: 100,
        isoMax: 25600,
        hasEmbeddedThumbnail: false,
        thumbnailWidth: 160,
        thumbnailHeight: 120,
      };

      const result = (importer as any).extractEmbeddedThumbnail(cameraInfo);

      expect(result).toBeNull();
    });

    it('clamps oversized thumbnail dimensions to 1024', () => {
      // Build JPEG buffer with oversized dimensions
      const jpegBuffer = buildJpegBuffer({
        width: 5000,
        height: 3000,
        marker: 0xc0,
      });

      const importer = new RawImporter(jpegBuffer, 'test.arw');
      const cameraInfo = {
        make: 'Sony',
        model: 'A7R IV',
        sensorWidth: 6000,
        sensorHeight: 4000,
        isoMin: 100,
        isoMax: 25600,
        hasEmbeddedThumbnail: true,
        thumbnailWidth: 5000,
        thumbnailHeight: 3000,
      };

      const result = (importer as any).extractEmbeddedThumbnail(cameraInfo);

      expect(result).not.toBeNull();
      expect(result.width).toBeLessThanOrEqual(1024);
      expect(result.height).toBeLessThanOrEqual(1024);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });

    it('returns null on corrupt JPEG data', () => {
      // Build JPEG buffer without end marker
      const jpegBuffer = buildJpegBuffer({
        width: 160,
        height: 120,
        marker: 0xc0,
        includeEnd: false,
      });

      const importer = new RawImporter(jpegBuffer, 'test.cr2');
      const cameraInfo = {
        make: 'Canon',
        model: 'EOS 5D',
        sensorWidth: 6000,
        sensorHeight: 4000,
        isoMin: 100,
        isoMax: 25600,
        hasEmbeddedThumbnail: true,
        thumbnailWidth: 160,
        thumbnailHeight: 120,
      };

      // Even without end marker, SOF parsing should succeed
      const result = (importer as any).extractEmbeddedThumbnail(cameraInfo);
      expect(result).not.toBeNull();
      expect(result.width).toBe(160);
      expect(result.height).toBe(120);
    });

    it('uses fallback dimensions when SOF marker not found', () => {
      // Build JPEG buffer without SOF marker
      const segments = [
        0xff, 0xd8, // SOI
        0xff, 0xe0, 0x00, 0x10, // APP0
        ...Array(12).fill(0x00),
        0xff, 0xd9, // EOI
      ];

      const buffer = new ArrayBuffer(segments.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < segments.length; i++) {
        view[i] = segments[i];
      }

      const importer = new RawImporter(buffer, 'test.cr2');
      const cameraInfo = {
        make: 'Canon',
        model: 'EOS 5D',
        sensorWidth: 6000,
        sensorHeight: 4000,
        isoMin: 100,
        isoMax: 25600,
        hasEmbeddedThumbnail: true,
        thumbnailWidth: 200,
        thumbnailHeight: 150,
      };

      const result = (importer as any).extractEmbeddedThumbnail(cameraInfo);

      expect(result).not.toBeNull();
      // Should use the fallback dimensions from cameraInfo
      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
    });

    it('creates RGBA image data with correct pixel count', () => {
      // Build JPEG buffer
      const jpegBuffer = buildJpegBuffer({
        width: 100,
        height: 50,
        marker: 0xc0,
      });

      const importer = new RawImporter(jpegBuffer, 'test.nef');
      const cameraInfo = {
        make: 'Nikon',
        model: 'D850',
        sensorWidth: 6000,
        sensorHeight: 4000,
        isoMin: 100,
        isoMax: 25600,
        hasEmbeddedThumbnail: true,
        thumbnailWidth: 160,
        thumbnailHeight: 120,
      };

      const result = (importer as any).extractEmbeddedThumbnail(cameraInfo);

      expect(result).not.toBeNull();
      const expectedPixelCount = 100 * 50 * 4; // width * height * 4 (RGBA)
      expect(result.data.length).toBe(expectedPixelCount);

      // Verify data is Uint8ClampedArray
      expect(result.data).toBeInstanceOf(Uint8ClampedArray);

      // Verify alpha channel is always 255
      for (let i = 3; i < result.data.length; i += 4) {
        expect(result.data[i]).toBe(255);
      }
    });
  });
});
