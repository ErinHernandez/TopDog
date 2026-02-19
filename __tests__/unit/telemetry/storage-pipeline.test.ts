import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock pako before import — must provide `default` export because
// source uses `import pako from 'pako'` (default import).
// vi.mock factory is hoisted, so no external variable references allowed.
vi.mock('pako', () => {
  const gzipFn = vi.fn((input: string) => {
    const encoder = new TextEncoder();
    return encoder.encode(input);
  });
  return {
    default: { gzip: gzipFn },
    gzip: gzipFn,
  };
});

import { StoragePipeline } from '@/lib/studio/telemetry/processing/storage';

describe('StoragePipeline', () => {
  let pipeline: StoragePipeline;
  let mockFirestore: any;
  let mockStorage: any;

  beforeEach(() => {
    vi.useFakeTimers();

    mockFirestore = {
      collection: vi.fn().mockReturnThis(),
      doc: vi.fn().mockReturnThis(),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    mockStorage = {
      file: vi.fn().mockReturnValue({
        save: vi.fn().mockResolvedValue(undefined),
      }),
    };

    pipeline = new StoragePipeline({
      batchSize: 3,
      batchTimeMs: 1000,
      compressionEnabled: false,
    });
    pipeline.initializeClients(mockFirestore, mockStorage);
  });

  afterEach(() => {
    pipeline.clear();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Batch management', () => {
    it('creates a batch when first event is added', () => {
      pipeline.addEvent({ type: 'click' }, 'session1', 'hash1');
      const stats = pipeline.getStorageStats();
      expect(stats.totalBatches).toBe(0); // Not flushed yet
    });

    it('auto-flushes when batch size is reached', async () => {
      pipeline.addEvent({ type: 'click' }, 'session1', 'hash1');
      pipeline.addEvent({ type: 'scroll' }, 'session1', 'hash1');
      pipeline.addEvent({ type: 'draw' }, 'session1', 'hash1');

      // Batch size is 3, so it should auto-flush
      await vi.advanceTimersByTimeAsync(0); // Let promises resolve

      const stats = pipeline.getStorageStats();
      expect(stats.totalBatches).toBe(1);
      expect(stats.totalEvents).toBe(3);
    });

    it('auto-flushes on timer expiry', async () => {
      pipeline.addEvent({ type: 'click' }, 'session1', 'hash1');

      // Advance past batchTimeMs
      await vi.advanceTimersByTimeAsync(1100);

      const stats = pipeline.getStorageStats();
      expect(stats.totalBatches).toBe(1);
      expect(stats.totalEvents).toBe(1);
    });
  });

  describe('Retry logic', () => {
    it('retries failed uploads with exponential backoff', async () => {
      // Eliminate jitter for deterministic timing in this test
      vi.spyOn(Math, 'random').mockReturnValue(0);
      let attempts = 0;
      mockFirestore.set = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts <= 2) return Promise.reject(new Error('Network error'));
        return Promise.resolve();
      });

      pipeline.addEvent({ type: 'click' }, 'session1', 'hash1');

      // First auto-flush attempt (fails)
      await vi.advanceTimersByTimeAsync(1100);
      expect(attempts).toBe(1);

      // Second attempt after backoff (fails)
      await vi.advanceTimersByTimeAsync(2100);
      expect(attempts).toBe(2);

      // Third attempt after longer backoff (succeeds)
      await vi.advanceTimersByTimeAsync(4200);
      expect(attempts).toBe(3);
    });

    it('drops batch after MAX_RETRIES (5) failures', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFirestore.set = vi.fn().mockRejectedValue(new Error('Persistent failure'));

      pipeline.addEvent({ type: 'click' }, 'session1', 'hash1');

      // Trigger initial flush
      await vi.advanceTimersByTimeAsync(1100);

      // Advance through all retry backoffs (exponential: 2s, 4s, 8s, 16s, 32s)
      for (let i = 0; i < 10; i++) {
        await vi.advanceTimersByTimeAsync(60000);
      }

      expect(pipeline.getDroppedBatches()).toBeGreaterThanOrEqual(1);
      errorSpy.mockRestore();
    });

    it('tracks dropped batch count', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockFirestore.set = vi.fn().mockRejectedValue(new Error('Fail'));

      expect(pipeline.getDroppedBatches()).toBe(0);

      pipeline.addEvent({ type: 'click' }, 'session1', 'hash1');

      // Exhaust retries
      for (let i = 0; i < 15; i++) {
        await vi.advanceTimersByTimeAsync(60000);
      }

      expect(pipeline.getDroppedBatches()).toBeGreaterThanOrEqual(1);
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });

  describe('Storage metadata', () => {
    it('returns correct metadata after successful flush', async () => {
      // Only add 2 events (batchSize is 3, so no auto-flush yet)
      pipeline.addEvent({ type: 'click' }, 'session1', 'hash1');
      pipeline.addEvent({ type: 'scroll' }, 'session2', 'hash2');

      // Manual flush before batch is full
      const metadata = await pipeline.flush();

      expect(metadata).not.toBeNull();
      expect(metadata!.eventCount).toBe(2);
      expect(metadata!.sessionIds).toContain('session1');
      expect(metadata!.sessionIds).toContain('session2');
      expect(metadata!.userHashes).toContain('hash1');
      expect(metadata!.userHashes).toContain('hash2');
      expect(metadata!.storageTier).toBe('hot');
    });

    it('returns null when flushing empty batch', async () => {
      const metadata = await pipeline.flush();
      expect(metadata).toBeNull();
    });

    it('tracks compression ratio correctly', async () => {
      // With compression disabled, ratio should be 1:1
      pipeline.addEvent({ type: 'click' }, 'session1', 'hash1');
      const metadata = await pipeline.flush();

      expect(metadata).not.toBeNull();
      // compressionRatio = compressedSize / uncompressedSize
      // With compression disabled, sizes should be equal
      expect(metadata!.compressionRatio).toBe(1);
    });

    it('handles zero-byte batch compression ratio without Infinity', async () => {
      // The StorageMetadata calculation handles division by zero
      const stats = pipeline.getStorageStats();
      expect(stats.compressionRatio).toBe(1); // Default when no data
      expect(Number.isFinite(stats.compressionRatio)).toBe(true);
    });
  });

  describe('Storage stats', () => {
    it('accumulates stats across multiple flushes', async () => {
      // First batch
      pipeline.addEvent({ type: 'click' }, 'session1', 'hash1');
      await pipeline.flush();

      // Second batch
      pipeline.addEvent({ type: 'scroll' }, 'session2', 'hash2');
      pipeline.addEvent({ type: 'draw' }, 'session2', 'hash2');
      await pipeline.flush();

      const stats = pipeline.getStorageStats();
      expect(stats.totalBatches).toBe(2);
      expect(stats.totalEvents).toBe(3);
      expect(stats.totalUploadTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Uploaded batches', () => {
    it('returns all uploaded batch metadata', async () => {
      pipeline.addEvent({ type: 'click' }, 'session1', 'hash1');
      await pipeline.flush();

      pipeline.addEvent({ type: 'scroll' }, 'session2', 'hash2');
      await pipeline.flush();

      const batches = pipeline.getUploadedBatches();
      expect(batches).toHaveLength(2);
      expect(batches[0].batchId).toBeTruthy();
      expect(batches[1].batchId).toBeTruthy();
      expect(batches[0].batchId).not.toBe(batches[1].batchId);
    });
  });

  describe('Batch ID security', () => {
    it('generates hex-format batch IDs using crypto.randomBytes', async () => {
      pipeline.addEvent({ type: 'click' }, 'session1', 'hash1');
      const metadata = await pipeline.flush();

      expect(metadata).not.toBeNull();
      // batchId format: batch_{timestamp}_{12-char hex from randomBytes(6)}
      const parts = metadata!.batchId.split('_');
      const hexPart = parts[parts.length - 1];
      expect(hexPart).toMatch(/^[0-9a-f]{12}$/);
    });
  });

  describe('Archive retry', () => {
    it('retries failed archival and increments droppedBatches on exhaustion', async () => {
      // Reconfigure fake timers: only fake setTimeout/setInterval/Date so that
      // setImmediate and queueMicrotask remain real (needed to flush the Promise
      // chain between archiveBatch retry setTimeout calls).
      vi.useRealTimers();
      vi.useFakeTimers({
        toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
      });

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Make storage save always fail
      mockStorage.file = vi.fn().mockReturnValue({
        save: vi.fn().mockRejectedValue(new Error('Cloud Storage error')),
      });

      const archivePipeline = new StoragePipeline({
        batchSize: 50,
        batchTimeMs: 100,
        hotStorageLimit: 0, // Force archival on every flush
        compressionEnabled: false,
      });
      archivePipeline.initializeClients(mockFirestore, mockStorage);

      archivePipeline.addEvent({ type: 'click' }, 'session1', 'hash1');

      // Advance clock so batch age > hotStorageLimit(0)
      vi.advanceTimersByTime(1);

      // Call flush directly — starts the upload → archive chain as a promise
      const flushPromise = archivePipeline.flush();

      // Interleave microtask processing with timer advancement:
      // archiveBatch retries use setTimeout for backoff. Each cycle:
      // 1) setImmediate flushes microtasks (lets archiveBatch progress to its next setTimeout)
      // 2) advanceTimersByTime fires the pending retry setTimeout
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setImmediate(r));
        vi.advanceTimersByTime(35_000);
      }
      await new Promise((r) => setImmediate(r));
      await flushPromise;

      expect(archivePipeline.getDroppedBatches()).toBeGreaterThanOrEqual(1);

      warnSpy.mockRestore();
      errorSpy.mockRestore();
      archivePipeline.clear();
    });

    it('succeeds after transient archive failures', async () => {
      // Reconfigure fake timers: only fake setTimeout/setInterval/Date so that
      // setImmediate and queueMicrotask remain real (needed to flush the Promise
      // chain between archiveBatch retry setTimeout calls).
      vi.useRealTimers();
      vi.useFakeTimers({
        toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
      });

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      let saveAttempts = 0;
      mockStorage.file = vi.fn().mockReturnValue({
        save: vi.fn().mockImplementation(() => {
          saveAttempts++;
          if (saveAttempts <= 2) return Promise.reject(new Error('Transient error'));
          return Promise.resolve();
        }),
      });

      const archivePipeline = new StoragePipeline({
        batchSize: 50,
        batchTimeMs: 100,
        hotStorageLimit: 0,
        compressionEnabled: false,
      });
      archivePipeline.initializeClients(mockFirestore, mockStorage);

      archivePipeline.addEvent({ type: 'click' }, 'session1', 'hash1');

      // Advance clock so batch age > hotStorageLimit(0)
      vi.advanceTimersByTime(1);

      // Call flush directly — starts the upload → archive chain
      const flushPromise = archivePipeline.flush();

      // Interleave microtask + timer processing for archive retry chain
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setImmediate(r));
        vi.advanceTimersByTime(35_000);
      }
      await new Promise((r) => setImmediate(r));
      await flushPromise;

      // Third attempt should succeed → no dropped batches
      expect(saveAttempts).toBeGreaterThanOrEqual(3);
      expect(archivePipeline.getDroppedBatches()).toBe(0);

      warnSpy.mockRestore();
      archivePipeline.clear();
    });
  });

  describe('Clear and destroy', () => {
    it('clear resets all state', async () => {
      pipeline.addEvent({ type: 'click' }, 'session1', 'hash1');
      await pipeline.flush();

      pipeline.clear();

      const stats = pipeline.getStorageStats();
      expect(stats.totalBatches).toBe(0);
      expect(stats.totalEvents).toBe(0);
    });

    it('destroy flushes remaining data', () => {
      pipeline.addEvent({ type: 'click' }, 'session1', 'hash1');
      // destroy should trigger emergencyFlush
      expect(() => pipeline.destroy()).not.toThrow();
    });
  });
});
