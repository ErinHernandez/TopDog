/**
 * CloudStorage Archive Tests
 * Tests .topdog archive format (binary container for TopDog projects)
 *
 * Tests the binary archive format via round-trip save/load through
 * createTopdogArchive and extractTopdogArchive methods.
 *
 * Archive format:
 * [0-3]     Magic bytes: "TDOG" (0x54 0x44 0x4F 0x47)
 * [4-5]     Version: 1 (uint16 LE)
 * [6-7]     Flags: 0 (uint16 LE)
 * [8-11]    Metadata length (uint32 LE)
 * [12-15]   Data length (uint32 LE)
 * [16+]     Metadata JSON + Data JSON
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudStorage } from '@/lib/studio/editor/fileio/CloudStorage';
import type { ProjectSaveData } from '@/lib/studio/types/fileio';

/**
 * Helper: Create minimal ProjectSaveData for testing
 */
function createSaveData(): ProjectSaveData {
  return {
    version: 1,
    document: { name: 'Test Project', width: 1920, height: 1080 },
    layerTree: [{ id: 'layer1', name: 'Background', type: 'raster' }],
    history: [{ action: 'create', timestamp: Date.now() }],
    thumbnailBlob: new Blob(['thumbnail'], { type: 'image/jpeg' }),
  };
}

describe('CloudStorage.archive - .topdog format', () => {
  let storage: CloudStorage;

  beforeEach(() => {
    storage = new CloudStorage('test-bucket', 'user123');
  });

  // ============================================================================
  // Round-Trip Tests
  // ============================================================================

  it('round-trip: create archive then extract, verify document data preserved', async () => {
    const saveData = createSaveData();

    // Access private method via type casting for testing
    const archive = await (storage as any).createTopdogArchive(saveData);
    const extracted = await (storage as any).extractTopdogArchive(archive);

    // Verify all data is preserved
    expect(extracted.version).toBe(1);
    expect(extracted.document.name).toBe('Test Project');
    expect(extracted.document.width).toBe(1920);
    expect(extracted.document.height).toBe(1080);
  });

  // ============================================================================
  // Binary Format Tests
  // ============================================================================

  it('archive has correct magic bytes "TDOG" at offset 0-3', async () => {
    const saveData = createSaveData();
    const archive = await (storage as any).createTopdogArchive(saveData);

    const bytes = new Uint8Array(await archive.arrayBuffer());

    // Magic bytes: T=0x54, D=0x44, O=0x4F, G=0x47
    expect(bytes[0]).toBe(0x54); // T
    expect(bytes[1]).toBe(0x44); // D
    expect(bytes[2]).toBe(0x4f); // O
    expect(bytes[3]).toBe(0x47); // G
  });

  it('archive has correct version (1) at offset 4-5', async () => {
    const saveData = createSaveData();
    const archive = await (storage as any).createTopdogArchive(saveData);

    const buffer = await archive.arrayBuffer();
    const view = new DataView(buffer);

    const version = view.getUint16(4, true); // little-endian
    expect(version).toBe(1);
  });

  it('archive stores correct metadata (name, width, height)', async () => {
    const saveData = createSaveData();
    const archive = await (storage as any).createTopdogArchive(saveData);
    const extracted = await (storage as any).extractTopdogArchive(archive);

    // Verify metadata fields
    expect(extracted.document.name).toBe('Test Project');
    expect(extracted.document.width).toBe(1920);
    expect(extracted.document.height).toBe(1080);
  });

  it('archive preserves layerTree data', async () => {
    const saveData = createSaveData();
    saveData.layerTree = [
      { id: 'layer1', name: 'Background', type: 'raster' },
      { id: 'layer2', name: 'Content', type: 'vector' },
    ];

    const archive = await (storage as any).createTopdogArchive(saveData);
    const extracted = await (storage as any).extractTopdogArchive(archive);

    expect(Array.isArray(extracted.layerTree)).toBe(true);
    expect(extracted.layerTree).toHaveLength(2);
    if (Array.isArray(extracted.layerTree)) {
      expect((extracted.layerTree as any[])[0].name).toBe('Background');
      expect((extracted.layerTree as any[])[1].name).toBe('Content');
    }
  });

  it('archive preserves history data', async () => {
    const saveData = createSaveData();
    saveData.history = [
      { action: 'create', timestamp: 1000 },
      { action: 'paint', timestamp: 2000 },
      { action: 'save', timestamp: 3000 },
    ];

    const archive = await (storage as any).createTopdogArchive(saveData);
    const extracted = await (storage as any).extractTopdogArchive(archive);

    expect(Array.isArray(extracted.history)).toBe(true);
    expect(extracted.history).toHaveLength(3);
  });

  // ============================================================================
  // Backward Compatibility Tests
  // ============================================================================

  it('extract handles legacy JSON format (backward compatibility)', async () => {
    // Create a legacy format blob (plain JSON, no binary header)
    const legacyData = {
      version: 1,
      document: { name: 'Legacy Project', width: 640, height: 480 },
      layerTree: [{ id: 'layer1', name: 'Layer', type: 'raster' }],
      history: [{ action: 'create', timestamp: 1000 }],
    };

    const legacyBlob = new Blob([JSON.stringify(legacyData)], { type: 'application/json' });
    const extracted = await (storage as any).extractTopdogArchive(legacyBlob);

    // Should successfully parse legacy format
    expect(extracted.version).toBe(1);
    expect(extracted.document.name).toBe('Legacy Project');
    expect(extracted.document.width).toBe(640);
    expect(extracted.document.height).toBe(480);
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  it('extract throws on corrupted data (< 16 bytes, not JSON)', async () => {
    // Create a blob that's too small and not valid JSON
    const corruptedBlob = new Blob([new Uint8Array([0xaa, 0xbb, 0xcc])]);

    // Should throw because it's < 16 bytes and not valid JSON
    await expect((storage as any).extractTopdogArchive(corruptedBlob)).rejects.toThrow();
  });

  it('extract throws on file with wrong magic bytes that is not JSON', async () => {
    // Create a file with wrong magic bytes and non-JSON content
    const wrongMagic = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00]);
    const blob = new Blob([wrongMagic]);

    // Should throw because magic bytes don't match and content is not JSON
    await expect((storage as any).extractTopdogArchive(blob)).rejects.toThrow();
  });

  it('extract handles empty layerTree gracefully', async () => {
    const saveData = createSaveData();
    saveData.layerTree = [];

    const archive = await (storage as any).createTopdogArchive(saveData);
    const extracted = await (storage as any).extractTopdogArchive(archive);

    // Should handle empty layer tree
    expect(Array.isArray(extracted.layerTree)).toBe(true);
    expect(extracted.layerTree).toHaveLength(0);
  });

  // ============================================================================
  // Size and Structure Tests
  // ============================================================================

  it('archive binary structure: header is 16 bytes', async () => {
    const saveData = createSaveData();
    const archive = await (storage as any).createTopdogArchive(saveData);

    const buffer = await archive.arrayBuffer();
    const view = new DataView(buffer);

    // Read metadata and data lengths from header
    const metadataLen = view.getUint32(8, true);
    const dataLen = view.getUint32(12, true);

    // Total size should be 16 (header) + metadata + data
    const expectedSize = 16 + metadataLen + dataLen;
    expect(buffer.byteLength).toBeGreaterThanOrEqual(expectedSize);
  });

  it('archive contains valid JSON metadata after header', async () => {
    const saveData = createSaveData();
    const archive = await (storage as any).createTopdogArchive(saveData);

    const buffer = await archive.arrayBuffer();
    const view = new DataView(buffer);

    const metadataLen = view.getUint32(8, true);
    const metadataBytes = new Uint8Array(buffer, 16, metadataLen);
    const decoder = new TextDecoder();
    const metadataJson = decoder.decode(metadataBytes);

    // Should be valid JSON
    const metadata = JSON.parse(metadataJson);
    expect(metadata.name).toBe('Test Project');
  });

  it('archive contains valid JSON data after metadata', async () => {
    const saveData = createSaveData();
    const archive = await (storage as any).createTopdogArchive(saveData);

    const buffer = await archive.arrayBuffer();
    const view = new DataView(buffer);

    const metadataLen = view.getUint32(8, true);
    const dataLen = view.getUint32(12, true);
    const dataBytes = new Uint8Array(buffer, 16 + metadataLen, dataLen);
    const decoder = new TextDecoder();
    const dataJson = decoder.decode(dataBytes);

    // Should be valid JSON
    const data = JSON.parse(dataJson);
    expect(data.document).toBeDefined();
    expect(data.layerTree).toBeDefined();
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  it('handles document name with special characters', async () => {
    const saveData = createSaveData();
    saveData.document.name = 'Project "Test" & <special> é ñ';

    const archive = await (storage as any).createTopdogArchive(saveData);
    const extracted = await (storage as any).extractTopdogArchive(archive);

    expect(extracted.document.name).toBe('Project "Test" & <special> é ñ');
  });

  it('handles very large dimension values', async () => {
    const saveData = createSaveData();
    saveData.document.width = 65535;
    saveData.document.height = 65535;

    const archive = await (storage as any).createTopdogArchive(saveData);
    const extracted = await (storage as any).extractTopdogArchive(archive);

    expect(extracted.document.width).toBe(65535);
    expect(extracted.document.height).toBe(65535);
  });

  it('handles empty document name', async () => {
    const saveData = createSaveData();
    saveData.document.name = '';

    const archive = await (storage as any).createTopdogArchive(saveData);
    const extracted = await (storage as any).extractTopdogArchive(archive);

    expect(extracted.document.name).toBe('');
  });

  it('handles undefined history (optional field)', async () => {
    const saveData = createSaveData();
    delete saveData.history;

    const archive = await (storage as any).createTopdogArchive(saveData);
    const extracted = await (storage as any).extractTopdogArchive(archive);

    // History may be undefined or empty array
    expect(extracted.version).toBe(1);
    expect(extracted.document).toBeDefined();
  });

  it('reconstructs thumbnail blob placeholder after extract', async () => {
    const saveData = createSaveData();

    const archive = await (storage as any).createTopdogArchive(saveData);
    const extracted = await (storage as any).extractTopdogArchive(archive);

    // Archive doesn't store thumbnail in binary format, creates placeholder
    expect(extracted.thumbnailBlob).toBeInstanceOf(Blob);
  });
});
