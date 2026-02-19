import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getProgressReporter,
  resetProgressReporter,
  initializeProgressReporter,
  type ProgressData,
  type RedisClient,
} from '@/lib/studio/infrastructure/queue/progressReporter';

describe('ProgressReporter', () => {
  beforeEach(() => {
    resetProgressReporter();
  });

  afterEach(() => {
    resetProgressReporter();
  });

  describe('updateProgress and getProgress', () => {
    it('stores and retrieves progress', async () => {
      const reporter = getProgressReporter();
      
      await reporter.updateProgress('job-1', 'processing', 50);
      const progress = await reporter.getProgress('job-1');
      
      expect(progress?.stage).toBe('processing');
      expect(progress?.percentComplete).toBe(50);
    });

    it('returns null for unknown job', async () => {
      const reporter = getProgressReporter();
      
      const progress = await reporter.getProgress('unknown-job');
      
      expect(progress).toBeNull();
    });

    it('stores progress with eta', async () => {
      const reporter = getProgressReporter();
      const eta = Date.now() + 60000;
      
      await reporter.updateProgress('job-1', 'encoding', 75, eta);
      const progress = await reporter.getProgress('job-1');
      
      expect(progress?.stage).toBe('encoding');
      expect(progress?.percentComplete).toBe(75);
      expect(progress?.eta).toBe(eta);
    });

    it('stores progress without eta when not provided', async () => {
      const reporter = getProgressReporter();
      
      await reporter.updateProgress('job-1', 'processing', 50);
      const progress = await reporter.getProgress('job-1');
      
      expect(progress?.eta).toBeUndefined();
    });

    it('overwrites previous progress', async () => {
      const reporter = getProgressReporter();
      
      await reporter.updateProgress('job-1', 'step1', 25);
      await reporter.updateProgress('job-1', 'step2', 75);
      
      const progress = await reporter.getProgress('job-1');
      
      expect(progress?.stage).toBe('step2');
      expect(progress?.percentComplete).toBe(75);
    });
  });

  describe('clearProgress', () => {
    it('removes stored progress', async () => {
      const reporter = getProgressReporter();
      
      await reporter.updateProgress('job-1', 'processing', 50);
      await reporter.clearProgress('job-1');
      
      const progress = await reporter.getProgress('job-1');
      
      expect(progress).toBeNull();
    });

    it('does not affect other jobs', async () => {
      const reporter = getProgressReporter();
      
      await reporter.updateProgress('job-1', 'processing', 50);
      await reporter.updateProgress('job-2', 'processing', 50);
      
      await reporter.clearProgress('job-1');
      
      const progress1 = await reporter.getProgress('job-1');
      const progress2 = await reporter.getProgress('job-2');
      
      expect(progress1).toBeNull();
      expect(progress2).toBeDefined();
      expect(progress2?.stage).toBe('processing');
    });

    it('handles clearing non-existent job gracefully', async () => {
      const reporter = getProgressReporter();
      
      await expect(reporter.clearProgress('unknown-job')).resolves.not.toThrow();
    });
  });

  describe('with Redis client', () => {
    it('uses Redis when available', async () => {
      const mockRedis: RedisClient = {
        get: async (key: string) => {
          if (key === 'job:job-1:progress') {
            return JSON.stringify({
              stage: 'processing',
              percentComplete: 50,
            });
          }
          return null;
        },
        setex: async () => {},
        del: async () => {},
      };
      
      initializeProgressReporter(mockRedis);
      const reporter = getProgressReporter();
      
      const progress = await reporter.getProgress('job-1');
      
      expect(progress?.stage).toBe('processing');
      expect(progress?.percentComplete).toBe(50);
    });

    it('stores to Redis with setex', async () => {
      let capturedKey: string | null = null;
      let capturedValue: string | null = null;
      let capturedTtl: number | null = null;

      const mockRedis: RedisClient = {
        get: async () => null,
        setex: async (key: string, ttl: number, value: string) => {
          capturedKey = key;
          capturedTtl = ttl;
          capturedValue = value;
        },
        del: async () => {},
      };
      
      initializeProgressReporter(mockRedis);
      const reporter = getProgressReporter();
      
      await reporter.updateProgress('job-1', 'processing', 50);
      
      expect(capturedKey).toBe('job:job-1:progress');
      expect(capturedTtl).toBe(3600); // 1 hour
      expect(capturedValue).toBeDefined();
      const parsed = JSON.parse(capturedValue!);
      expect(parsed.stage).toBe('processing');
      expect(parsed.percentComplete).toBe(50);
    });

    it('deletes from Redis on clearProgress', async () => {
      let deletedKey: string | null = null;

      const mockRedis: RedisClient = {
        get: async () => null,
        setex: async () => {},
        del: async (key: string) => {
          deletedKey = key;
        },
      };
      
      initializeProgressReporter(mockRedis);
      const reporter = getProgressReporter();
      
      await reporter.clearProgress('job-1');
      
      expect(deletedKey).toBe('job:job-1:progress');
    });

    it('falls back to memory on Redis error on get', async () => {
      const mockRedis: RedisClient = {
        get: async () => {
          throw new Error('Redis connection failed');
        },
        setex: async () => {
          throw new Error('Redis connection failed');
        },
        del: async () => {},
      };

      initializeProgressReporter(mockRedis);
      const reporter = getProgressReporter();

      // Store falls back to memory since setex throws
      await reporter.updateProgress('job-1', 'processing', 50);

      // Get falls back to memory since get throws
      const progress = await reporter.getProgress('job-1');

      expect(progress?.stage).toBe('processing');
      expect(progress?.percentComplete).toBe(50);
    });

    it('falls back to memory on Redis error on update', async () => {
      const mockRedis: RedisClient = {
        get: async () => {
          throw new Error('Redis read failed');
        },
        setex: async () => {
          throw new Error('Redis write failed');
        },
        del: async () => {},
      };

      initializeProgressReporter(mockRedis);
      const reporter = getProgressReporter();

      // Update falls back to memory since setex throws
      await reporter.updateProgress('job-1', 'encoding', 75);

      // Get falls back to memory since get throws
      const progress = await reporter.getProgress('job-1');

      expect(progress?.stage).toBe('encoding');
      expect(progress?.percentComplete).toBe(75);
    });
  });

  describe('multiple jobs', () => {
    it('stores separate progress for each job', async () => {
      const reporter = getProgressReporter();
      
      await reporter.updateProgress('job-1', 'stage1', 25);
      await reporter.updateProgress('job-2', 'stage2', 50);
      await reporter.updateProgress('job-3', 'stage3', 75);
      
      const progress1 = await reporter.getProgress('job-1');
      const progress2 = await reporter.getProgress('job-2');
      const progress3 = await reporter.getProgress('job-3');
      
      expect(progress1?.stage).toBe('stage1');
      expect(progress1?.percentComplete).toBe(25);
      
      expect(progress2?.stage).toBe('stage2');
      expect(progress2?.percentComplete).toBe(50);
      
      expect(progress3?.stage).toBe('stage3');
      expect(progress3?.percentComplete).toBe(75);
    });

    it('handles concurrent updates', async () => {
      const reporter = getProgressReporter();
      
      const updates = Array.from({ length: 10 }, (_, i) =>
        reporter.updateProgress(`job-${i}`, `stage-${i}`, i * 10)
      );
      
      await Promise.all(updates);
      
      const progress5 = await reporter.getProgress('job-5');
      
      expect(progress5?.stage).toBe('stage-5');
      expect(progress5?.percentComplete).toBe(50);
    });
  });

  describe('singleton behavior', () => {
    it('returns same instance on multiple calls', () => {
      const reporter1 = getProgressReporter();
      const reporter2 = getProgressReporter();
      
      expect(reporter1).toBe(reporter2);
    });

    it('returns new instance after reset', () => {
      const reporter1 = getProgressReporter();
      resetProgressReporter();
      const reporter2 = getProgressReporter();
      
      expect(reporter1).not.toBe(reporter2);
    });

    it('clears stored progress on reset', async () => {
      const reporter1 = getProgressReporter();
      await reporter1.updateProgress('job-1', 'processing', 50);
      
      resetProgressReporter();
      const reporter2 = getProgressReporter();
      
      const progress = await reporter2.getProgress('job-1');
      expect(progress).toBeNull();
    });
  });

  describe('data types and edge cases', () => {
    it('handles zero percent complete', async () => {
      const reporter = getProgressReporter();
      
      await reporter.updateProgress('job-1', 'starting', 0);
      const progress = await reporter.getProgress('job-1');
      
      expect(progress?.percentComplete).toBe(0);
    });

    it('handles 100 percent complete', async () => {
      const reporter = getProgressReporter();
      
      await reporter.updateProgress('job-1', 'complete', 100);
      const progress = await reporter.getProgress('job-1');
      
      expect(progress?.percentComplete).toBe(100);
    });

    it('handles decimal percentages', async () => {
      const reporter = getProgressReporter();
      
      await reporter.updateProgress('job-1', 'processing', 33.33);
      const progress = await reporter.getProgress('job-1');
      
      expect(progress?.percentComplete).toBe(33.33);
    });

    it('preserves eta when updating progress', async () => {
      const reporter = getProgressReporter();
      const eta = Date.now() + 120000;
      
      await reporter.updateProgress('job-1', 'stage1', 25, eta);
      const progress1 = await reporter.getProgress('job-1');
      expect(progress1?.eta).toBe(eta);
      
      // Update progress but stage changes, eta should not persist
      await reporter.updateProgress('job-1', 'stage2', 50);
      const progress2 = await reporter.getProgress('job-1');
      expect(progress2?.eta).toBeUndefined();
    });

    it('handles empty stage name', async () => {
      const reporter = getProgressReporter();
      
      await reporter.updateProgress('job-1', '', 50);
      const progress = await reporter.getProgress('job-1');
      
      expect(progress?.stage).toBe('');
    });

    it('handles very large percentages', async () => {
      const reporter = getProgressReporter();
      
      await reporter.updateProgress('job-1', 'processing', 9999.99);
      const progress = await reporter.getProgress('job-1');
      
      expect(progress?.percentComplete).toBe(9999.99);
    });

    it('handles very large eta values', async () => {
      const reporter = getProgressReporter();
      const largeEta = 9999999999999;
      
      await reporter.updateProgress('job-1', 'processing', 50, largeEta);
      const progress = await reporter.getProgress('job-1');
      
      expect(progress?.eta).toBe(largeEta);
    });
  });
});
