import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getJobWorker,
  resetJobWorker,
  ProcessJobResult,
} from '@/lib/studio/infrastructure/queue/jobWorker';
import {
  getJobQueue,
  JobType,
  JobStatus,
  resetJobQueue,
} from '@/lib/studio/infrastructure/queue/firestoreJobQueue';

describe('JobWorker', () => {
  beforeEach(() => {
    resetJobWorker();
    resetJobQueue();
  });

  afterEach(() => {
    resetJobWorker();
    resetJobQueue();
  });

  describe('registerJobHandler', () => {
    it('stores handler for job type', async () => {
      const worker = getJobWorker();
      const handler = async (job: any) => ({ success: true });
      
      worker.registerJobHandler(JobType.AI_GENERATION, handler);
      
      expect(worker.getRegisteredTypes()).toContain(JobType.AI_GENERATION);
    });

    it('allows multiple handlers for different types', async () => {
      const worker = getJobWorker();
      const handler1 = async (job: any) => ({ type: 'ai' });
      const handler2 = async (job: any) => ({ type: 'image' });
      
      worker.registerJobHandler(JobType.AI_GENERATION, handler1);
      worker.registerJobHandler(JobType.IMAGE_EXPORT, handler2);
      
      const types = worker.getRegisteredTypes();
      expect(types).toContain(JobType.AI_GENERATION);
      expect(types).toContain(JobType.IMAGE_EXPORT);
    });

    it('allows overwriting handler for same type', async () => {
      const worker = getJobWorker();
      let callCount = 0;
      
      worker.registerJobHandler(JobType.AI_GENERATION, async () => {
        callCount++;
        return {};
      });
      
      worker.registerJobHandler(JobType.AI_GENERATION, async () => {
        callCount += 10;
        return {};
      });
      
      const queue = getJobQueue();
      const jobId = await queue.enqueueJob(JobType.AI_GENERATION, {});
      
      await worker.processNextJob([JobType.AI_GENERATION]);
      
      expect(callCount).toBe(10);
    });
  });

  describe('processNextJob', () => {
    it('returns { processed: false } when no jobs available', async () => {
      const worker = getJobWorker();
      worker.registerJobHandler(JobType.AI_GENERATION, async () => ({}));
      
      const result = await worker.processNextJob([JobType.AI_GENERATION]);
      
      expect(result.processed).toBe(false);
      expect(result.jobId).toBeUndefined();
    });

    it('returns { processed: false } when no types specified and none registered', async () => {
      const worker = getJobWorker();
      
      const result = await worker.processNextJob();
      
      expect(result.processed).toBe(false);
    });

    it('claims and processes next job', async () => {
      const worker = getJobWorker();
      const queue = getJobQueue();
      let handlerCalled = false;
      
      worker.registerJobHandler(JobType.AI_GENERATION, async () => {
        handlerCalled = true;
        return { generated: true };
      });
      
      const jobId = await queue.enqueueJob(JobType.AI_GENERATION, { prompt: 'test' });
      const result = await worker.processNextJob([JobType.AI_GENERATION]);
      
      expect(result.processed).toBe(true);
      expect(result.jobId).toBe(jobId);
      expect(handlerCalled).toBe(true);
    });

    it('passes job to handler with correct data', async () => {
      const worker = getJobWorker();
      const queue = getJobQueue();
      let receivedJob: any = null;
      
      worker.registerJobHandler(JobType.AI_GENERATION, async (job) => {
        receivedJob = job;
        return {};
      });
      
      const payload = { prompt: 'test', temperature: 0.7 };
      const jobId = await queue.enqueueJob(JobType.AI_GENERATION, payload);
      
      await worker.processNextJob([JobType.AI_GENERATION]);
      
      expect(receivedJob.id).toBe(jobId);
      expect(receivedJob.payload).toEqual(payload);
      expect(receivedJob.type).toBe(JobType.AI_GENERATION);
    });

    it('marks job as COMPLETED on success', async () => {
      const worker = getJobWorker();
      const queue = getJobQueue();
      
      worker.registerJobHandler(JobType.AI_GENERATION, async () => ({
        text: 'generated',
      }));
      
      const jobId = await queue.enqueueJob(JobType.AI_GENERATION, {});
      await worker.processNextJob([JobType.AI_GENERATION]);
      
      const job = await queue.getJobStatus(jobId);
      
      expect(job?.status).toBe(JobStatus.COMPLETED);
    });

    it('stores handler result in job', async () => {
      const worker = getJobWorker();
      const queue = getJobQueue();
      const expectedResult = { imageUrl: 'https://example.com/img.png' };
      
      worker.registerJobHandler(JobType.IMAGE_EXPORT, async () => expectedResult);
      
      const jobId = await queue.enqueueJob(JobType.IMAGE_EXPORT, {});
      await worker.processNextJob([JobType.IMAGE_EXPORT]);
      
      const job = await queue.getJobStatus(jobId);
      
      expect(job?.result).toEqual(expectedResult);
    });

    it('returns result in response', async () => {
      const worker = getJobWorker();
      const queue = getJobQueue();
      const expectedResult = { count: 42 };
      
      worker.registerJobHandler(JobType.BATCH_OPERATION, async () => expectedResult);
      
      await queue.enqueueJob(JobType.BATCH_OPERATION, {});
      const result = await worker.processNextJob([JobType.BATCH_OPERATION]);
      
      expect(result.result).toEqual(expectedResult);
    });

    it('marks job as FAILED and increments retries on handler error', async () => {
      const worker = getJobWorker();
      const queue = getJobQueue();
      
      worker.registerJobHandler(JobType.AI_GENERATION, async () => {
        throw new Error('Handler failed');
      });
      
      const jobId = await queue.enqueueJob(JobType.AI_GENERATION, {}, { maxRetries: 3 });
      await worker.processNextJob([JobType.AI_GENERATION]);
      
      const job = await queue.getJobStatus(jobId);
      
      expect(job?.status).toBe(JobStatus.PENDING); // Should be back to PENDING for retry
      expect(job?.retries).toBe(1);
      expect(job?.error).toBe('Handler failed');
    });

    it('returns error in result when handler throws', async () => {
      const worker = getJobWorker();
      const queue = getJobQueue();
      
      worker.registerJobHandler(JobType.AI_GENERATION, async () => {
        throw new Error('Network timeout');
      });
      
      const jobId = await queue.enqueueJob(JobType.AI_GENERATION, {});
      const result = await worker.processNextJob([JobType.AI_GENERATION]);
      
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Network timeout');
    });

    it('handles non-Error exceptions', async () => {
      const worker = getJobWorker();
      const queue = getJobQueue();
      
      worker.registerJobHandler(JobType.AI_GENERATION, async () => {
        // eslint-disable-next-line no-throw-literal
        throw 'string error';
      });
      
      await queue.enqueueJob(JobType.AI_GENERATION, {});
      const result = await worker.processNextJob([JobType.AI_GENERATION]);
      
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('string error');
    });

    it('throws error if no handler registered for claimed job', async () => {
      const worker = getJobWorker();
      const queue = getJobQueue();

      // Register handler for one type
      worker.registerJobHandler(JobType.AI_GENERATION, async () => ({}));

      // Enqueue different type (no handler registered for IMAGE_EXPORT)
      const jobId = await queue.enqueueJob(JobType.IMAGE_EXPORT, {});

      // Worker claims the PENDING job but has no handler for IMAGE_EXPORT
      const result = await worker.processNextJob([JobType.IMAGE_EXPORT]);

      expect(result.processed).toBe(true);
      expect(result.error?.message).toContain('No handler registered');
    });

    it('processes only specified types when types parameter provided', async () => {
      const worker = getJobWorker();
      const queue = getJobQueue();
      let processingType: JobType | null = null;
      
      worker.registerJobHandler(JobType.AI_GENERATION, async (job) => {
        processingType = job.type;
        return {};
      });
      worker.registerJobHandler(JobType.IMAGE_EXPORT, async (job) => {
        processingType = job.type;
        return {};
      });
      
      await queue.enqueueJob(JobType.IMAGE_EXPORT, {});
      const result = await worker.processNextJob([JobType.AI_GENERATION]);
      
      expect(result.processed).toBe(false);
      expect(processingType).toBeNull();
    });

    it('uses registered types when none specified', async () => {
      const worker = getJobWorker();
      const queue = getJobQueue();
      
      worker.registerJobHandler(JobType.AI_GENERATION, async () => ({ done: true }));
      
      const jobId = await queue.enqueueJob(JobType.AI_GENERATION, {});
      const result = await worker.processNextJob();
      
      expect(result.processed).toBe(true);
      expect(result.jobId).toBe(jobId);
    });
  });

  describe('getRegisteredTypes', () => {
    it('returns empty array when no handlers registered', async () => {
      const worker = getJobWorker();
      
      const types = worker.getRegisteredTypes();
      
      expect(types).toEqual([]);
    });

    it('returns registered handler types', async () => {
      const worker = getJobWorker();
      
      worker.registerJobHandler(JobType.AI_GENERATION, async () => ({}));
      worker.registerJobHandler(JobType.IMAGE_EXPORT, async () => ({}));
      
      const types = worker.getRegisteredTypes();
      
      expect(types.length).toBe(2);
      expect(types).toContain(JobType.AI_GENERATION);
      expect(types).toContain(JobType.IMAGE_EXPORT);
    });
  });

  describe('singleton behavior', () => {
    it('returns same instance on multiple calls', () => {
      const worker1 = getJobWorker();
      const worker2 = getJobWorker();
      
      expect(worker1).toBe(worker2);
    });

    it('returns new instance after reset', () => {
      const worker1 = getJobWorker();
      resetJobWorker();
      const worker2 = getJobWorker();
      
      expect(worker1).not.toBe(worker2);
    });

    it('clears handlers on reset', () => {
      const worker1 = getJobWorker();
      worker1.registerJobHandler(JobType.AI_GENERATION, async () => ({}));
      
      resetJobWorker();
      const worker2 = getJobWorker();
      
      expect(worker2.getRegisteredTypes()).toEqual([]);
    });
  });

  describe('complex scenarios', () => {
    it('processes multiple jobs in sequence', async () => {
      const worker = getJobWorker();
      const queue = getJobQueue();
      let processedCount = 0;
      
      worker.registerJobHandler(JobType.BATCH_OPERATION, async () => {
        processedCount++;
        return { processed: true };
      });
      
      const id1 = await queue.enqueueJob(JobType.BATCH_OPERATION, {});
      const id2 = await queue.enqueueJob(JobType.BATCH_OPERATION, {});
      
      const result1 = await worker.processNextJob([JobType.BATCH_OPERATION]);
      const result2 = await worker.processNextJob([JobType.BATCH_OPERATION]);
      
      expect(result1.processed).toBe(true);
      expect(result2.processed).toBe(true);
      expect(processedCount).toBe(2);
    });

    it('handles async handlers correctly', async () => {
      const worker = getJobWorker();
      const queue = getJobQueue();
      
      worker.registerJobHandler(JobType.AI_GENERATION, async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { delayed: true };
      });
      
      const jobId = await queue.enqueueJob(JobType.AI_GENERATION, {});
      const result = await worker.processNextJob([JobType.AI_GENERATION]);
      
      expect(result.processed).toBe(true);
      expect(result.result).toEqual({ delayed: true });
    });
  });
});
