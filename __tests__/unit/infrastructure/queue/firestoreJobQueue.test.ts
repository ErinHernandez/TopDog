import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  FirestoreJobQueue,
  Job,
  JobStatus,
  JobType,
  resetJobQueue,
  getJobQueue,
  getJobStore,
} from '@/lib/studio/infrastructure/queue/firestoreJobQueue';

describe('FirestoreJobQueue', () => {
  beforeEach(() => {
    resetJobQueue();
  });

  afterEach(() => {
    resetJobQueue();
  });

  describe('enqueueJob', () => {
    it('returns a string job ID', async () => {
      const queue = getJobQueue();
      const jobId = await queue.enqueueJob(JobType.AI_GENERATION, { prompt: 'test' });
      
      expect(typeof jobId).toBe('string');
      expect(jobId.length).toBeGreaterThan(0);
    });

    it('sets correct default values for new jobs', async () => {
      const queue = getJobQueue();
      const payload = { prompt: 'test' };
      const jobId = await queue.enqueueJob(JobType.AI_GENERATION, payload);
      
      const job = await queue.getJobStatus(jobId);
      
      expect(job).toBeDefined();
      expect(job?.status).toBe(JobStatus.PENDING);
      expect(job?.priority).toBe(0);
      expect(job?.retries).toBe(0);
      expect(job?.maxRetries).toBe(5); // default
      expect(job?.payload).toEqual(payload);
    });

    it('respects custom options', async () => {
      const queue = getJobQueue();
      const jobId = await queue.enqueueJob(
        JobType.IMAGE_EXPORT,
        { imageId: '123' },
        {
          maxRetries: 3,
          priority: 10,
          userId: 'user-123',
        }
      );
      
      const job = await queue.getJobStatus(jobId);
      
      expect(job?.maxRetries).toBe(3);
      expect(job?.priority).toBe(10);
      expect(job?.userId).toBe('user-123');
    });

    it('stores createdAt timestamp', async () => {
      const queue = getJobQueue();
      const before = Date.now();
      const jobId = await queue.enqueueJob(JobType.BATCH_OPERATION, {});
      const after = Date.now();
      
      const job = await queue.getJobStatus(jobId);
      
      expect(job?.createdAt).toBeGreaterThanOrEqual(before);
      expect(job?.createdAt).toBeLessThanOrEqual(after);
    });
  });

  describe('claimNextJob', () => {
    it('returns null when queue is empty', async () => {
      const queue = getJobQueue();
      const job = await queue.claimNextJob([JobType.AI_GENERATION]);
      
      expect(job).toBeNull();
    });

    it('returns first PENDING job matching types', async () => {
      const queue = getJobQueue();
      const jobId = await queue.enqueueJob(JobType.AI_GENERATION, { prompt: 'test' });
      
      const job = await queue.claimNextJob([JobType.AI_GENERATION]);
      
      expect(job).toBeDefined();
      expect(job?.id).toBe(jobId);
      expect(job?.status).toBe(JobStatus.RUNNING);
    });

    it('returns highest priority job first', async () => {
      const queue = getJobQueue();
      const lowPriorityId = await queue.enqueueJob(
        JobType.AI_GENERATION,
        { prompt: 'low' },
        { priority: 1 }
      );
      const highPriorityId = await queue.enqueueJob(
        JobType.AI_GENERATION,
        { prompt: 'high' },
        { priority: 10 }
      );
      
      const job = await queue.claimNextJob([JobType.AI_GENERATION]);
      
      expect(job?.id).toBe(highPriorityId);
    });

    it('respects createdAt ordering for same priority', async () => {
      const queue = getJobQueue();
      const firstId = await queue.enqueueJob(
        JobType.AI_GENERATION,
        { prompt: 'first' },
        { priority: 5 }
      );
      
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const secondId = await queue.enqueueJob(
        JobType.AI_GENERATION,
        { prompt: 'second' },
        { priority: 5 }
      );
      
      const job = await queue.claimNextJob([JobType.AI_GENERATION]);
      
      expect(job?.id).toBe(firstId);
    });

    it('sets status to RUNNING and startedAt', async () => {
      const queue = getJobQueue();
      const jobId = await queue.enqueueJob(JobType.IMAGE_EXPORT, {});
      
      const before = Date.now();
      const job = await queue.claimNextJob([JobType.IMAGE_EXPORT]);
      const after = Date.now();
      
      expect(job?.status).toBe(JobStatus.RUNNING);
      expect(job?.startedAt).toBeGreaterThanOrEqual(before);
      expect(job?.startedAt).toBeLessThanOrEqual(after);
    });

    it('only returns jobs matching specified types', async () => {
      const queue = getJobQueue();
      await queue.enqueueJob(JobType.AI_GENERATION, {});
      const imageJobId = await queue.enqueueJob(JobType.IMAGE_EXPORT, {});
      
      const job = await queue.claimNextJob([JobType.IMAGE_EXPORT]);
      
      expect(job?.id).toBe(imageJobId);
    });

    it('ignores non-PENDING jobs', async () => {
      const queue = getJobQueue();
      const jobId = await queue.enqueueJob(JobType.AI_GENERATION, {});
      await queue.claimNextJob([JobType.AI_GENERATION]);
      
      // This should be RUNNING now
      const secondJob = await queue.claimNextJob([JobType.AI_GENERATION]);
      
      expect(secondJob).toBeNull();
    });
  });

  describe('completeJob', () => {
    it('sets status to COMPLETED', async () => {
      const queue = getJobQueue();
      const jobId = await queue.enqueueJob(JobType.AI_GENERATION, {});
      
      await queue.completeJob(jobId, { success: true });
      const job = await queue.getJobStatus(jobId);
      
      expect(job?.status).toBe(JobStatus.COMPLETED);
    });

    it('stores result', async () => {
      const queue = getJobQueue();
      const jobId = await queue.enqueueJob(JobType.IMAGE_EXPORT, {});
      const result = { imageUrl: 'https://example.com/image.png' };
      
      await queue.completeJob(jobId, result);
      const job = await queue.getJobStatus(jobId);
      
      expect(job?.result).toEqual(result);
    });

    it('sets completedAt timestamp', async () => {
      const queue = getJobQueue();
      const jobId = await queue.enqueueJob(JobType.AI_GENERATION, {});
      
      const before = Date.now();
      await queue.completeJob(jobId, {});
      const after = Date.now();
      
      const job = await queue.getJobStatus(jobId);
      
      expect(job?.completedAt).toBeGreaterThanOrEqual(before);
      expect(job?.completedAt).toBeLessThanOrEqual(after);
    });
  });

  describe('failJob', () => {
    it('increments retries', async () => {
      const queue = getJobQueue();
      const jobId = await queue.enqueueJob(JobType.AI_GENERATION, {}, { maxRetries: 3 });
      
      await queue.failJob(jobId, 'Network error');
      const job = await queue.getJobStatus(jobId);
      
      expect(job?.retries).toBe(1);
      expect(job?.error).toBe('Network error');
    });

    it('moves job back to PENDING for retry', async () => {
      const queue = getJobQueue();
      const jobId = await queue.enqueueJob(JobType.AI_GENERATION, {}, { maxRetries: 3 });
      
      await queue.failJob(jobId, 'Temporary error');
      const job = await queue.getJobStatus(jobId);
      
      expect(job?.status).toBe(JobStatus.PENDING);
    });

    it('moves to DEAD_LETTER after max retries exceeded', async () => {
      const queue = getJobQueue();
      const jobId = await queue.enqueueJob(JobType.AI_GENERATION, {}, { maxRetries: 2 });
      
      await queue.failJob(jobId, 'Error 1');
      await queue.failJob(jobId, 'Error 2');
      const job = await queue.getJobStatus(jobId);
      
      expect(job?.status).toBe(JobStatus.DEAD_LETTER);
      expect(job?.retries).toBe(2);
    });

    it('stores error message', async () => {
      const queue = getJobQueue();
      const jobId = await queue.enqueueJob(JobType.AI_GENERATION, {});
      const errorMsg = 'GPU out of memory';
      
      await queue.failJob(jobId, errorMsg);
      const job = await queue.getJobStatus(jobId);
      
      expect(job?.error).toBe(errorMsg);
    });
  });

  describe('exponential backoff', () => {
    it('calculates 1s delay for first retry', async () => {
      const queue = getJobQueue();
      const jobId = await queue.enqueueJob(JobType.AI_GENERATION, {}, { maxRetries: 5 });
      const before = await queue.getJobStatus(jobId);
      const beforeTime = before?.createdAt ?? 0;
      
      await queue.failJob(jobId, 'Error');
      const after = await queue.getJobStatus(jobId);
      const afterTime = after?.createdAt ?? 0;
      
      const delay = afterTime - beforeTime;
      expect(delay).toBe(1000);
    });

    it('calculates 2s delay for second retry', async () => {
      const queue = getJobQueue();
      const jobId = await queue.enqueueJob(JobType.AI_GENERATION, {}, { maxRetries: 5 });
      
      await queue.failJob(jobId, 'Error 1');
      const after1 = await queue.getJobStatus(jobId);
      const time1 = after1?.createdAt ?? 0;
      
      await queue.failJob(jobId, 'Error 2');
      const after2 = await queue.getJobStatus(jobId);
      const time2 = after2?.createdAt ?? 0;
      
      const delay = time2 - time1;
      expect(delay).toBe(2000);
    });

    it('calculates exponential sequence: 1s, 2s, 4s, 8s, 16s', async () => {
      const queue = getJobQueue();
      const jobId = await queue.enqueueJob(JobType.AI_GENERATION, {}, { maxRetries: 6 });
      
      const times: number[] = [];
      const expected = [1000, 2000, 4000, 8000, 16000];
      
      let job = await queue.getJobStatus(jobId);
      times.push(job?.createdAt ?? 0);
      
      for (let i = 0; i < 5; i++) {
        await queue.failJob(jobId, `Error ${i + 1}`);
        job = await queue.getJobStatus(jobId);
        times.push(job?.createdAt ?? 0);
      }
      
      for (let i = 0; i < expected.length; i++) {
        const delay = times[i + 1] - times[i];
        expect(delay).toBe(expected[i]);
      }
    });
  });

  describe('getJobStatus', () => {
    it('returns null for non-existent job', async () => {
      const queue = getJobQueue();
      const job = await queue.getJobStatus('nonexistent-id');
      
      expect(job).toBeNull();
    });

    it('returns job data by ID', async () => {
      const queue = getJobQueue();
      const jobId = await queue.enqueueJob(JobType.BATCH_OPERATION, { count: 100 });
      
      const job = await queue.getJobStatus(jobId);
      
      expect(job?.id).toBe(jobId);
      expect(job?.type).toBe(JobType.BATCH_OPERATION);
      expect(job?.payload).toEqual({ count: 100 });
    });
  });

  describe('getJobsByStatus', () => {
    it('returns empty array when no jobs match status', async () => {
      const queue = getJobQueue();
      const jobs = await queue.getJobsByStatus(JobStatus.COMPLETED);
      
      expect(jobs).toEqual([]);
    });

    it('filters jobs by status', async () => {
      const queue = getJobQueue();
      const pendingId = await queue.enqueueJob(JobType.AI_GENERATION, {});
      const completedId = await queue.enqueueJob(JobType.IMAGE_EXPORT, {});
      
      await queue.completeJob(completedId, {});
      
      const pending = await queue.getJobsByStatus(JobStatus.PENDING);
      const completed = await queue.getJobsByStatus(JobStatus.COMPLETED);
      
      expect(pending.length).toBe(1);
      expect(pending[0]?.id).toBe(pendingId);
      
      expect(completed.length).toBe(1);
      expect(completed[0]?.id).toBe(completedId);
    });

    it('respects limit parameter', async () => {
      const queue = getJobQueue();
      await queue.enqueueJob(JobType.AI_GENERATION, {});
      await queue.enqueueJob(JobType.AI_GENERATION, {});
      await queue.enqueueJob(JobType.AI_GENERATION, {});
      
      const jobs = await queue.getJobsByStatus(JobStatus.PENDING, 2);
      
      expect(jobs.length).toBe(2);
    });
  });

  describe('configuration', () => {
    it('uses custom default max retries', async () => {
      const store = getJobStore();
      const queue = new FirestoreJobQueue(store, { defaultMaxRetries: 10 });
      
      const jobId = await queue.enqueueJob(JobType.AI_GENERATION, {});
      const job = await queue.getJobStatus(jobId);
      
      expect(job?.maxRetries).toBe(10);
    });

    it('allows option to override default max retries', async () => {
      const queue = getJobQueue();
      const jobId = await queue.enqueueJob(
        JobType.AI_GENERATION,
        {},
        { maxRetries: 2 }
      );
      
      const job = await queue.getJobStatus(jobId);
      expect(job?.maxRetries).toBe(2);
    });
  });

  describe('job isolation', () => {
    it('claiming one job does not affect others', async () => {
      const queue = getJobQueue();
      const id1 = await queue.enqueueJob(JobType.AI_GENERATION, { id: 1 });
      const id2 = await queue.enqueueJob(JobType.AI_GENERATION, { id: 2 });
      
      const claimed1 = await queue.claimNextJob([JobType.AI_GENERATION]);
      expect(claimed1?.id).toBe(id1);
      
      const job2 = await queue.getJobStatus(id2);
      expect(job2?.status).toBe(JobStatus.PENDING);
    });
  });
});
