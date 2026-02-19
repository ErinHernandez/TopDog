/**
 * Deep Health Check Endpoint
 *
 * Comprehensive health check for all backend subsystems:
 * Redis, cache, job queue. Returns 200 for healthy/degraded, 503 for unhealthy.
 *
 * GET /api/health/deep — public, no auth required.
 *
 * @module pages/api/health/deep
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getRedisClient } from '@/lib/studio/infrastructure/redis/upstashClient';
import { getCacheManager } from '@/lib/studio/infrastructure/cache/cacheManager';
import { getJobQueue } from '@/lib/studio/infrastructure/queue/firestoreJobQueue';
import { serverLogger } from '@/lib/studio/services/serverLogger';

interface RedisCheck {
  status: 'up' | 'down';
  latencyMs?: number;
  error?: string;
}

interface CacheStats {
  l1Hits: number;
  l2Hits: number;
  misses: number;
  l1Size: number;
  evictions: number;
}

interface CacheCheck {
  status: 'up' | 'down';
  stats?: CacheStats;
  hitRate?: number;
  error?: string;
}

interface QueueCheck {
  status: 'up' | 'down';
  pendingJobs: number;
  runningJobs: number;
  oldestPendingAgeMs?: number;
  error?: string;
}

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    redis: RedisCheck;
    cache: CacheCheck;
    queue: QueueCheck;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheckResponse>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      uptime: process.uptime(),
      checks: {
        redis: { status: 'down', error: 'Invalid request method' },
        cache: { status: 'down' },
        queue: { status: 'down', pendingJobs: 0, runningJobs: 0 },
      },
    } as any);
    return;
  }

  const timestamp = new Date().toISOString();
  const version = process.env.APP_VERSION || '1.0.0';
  const uptime = process.uptime();

  let redisCheck: RedisCheck = { status: 'down' };
  let cacheCheck: CacheCheck = { status: 'down' };
  let queueCheck: QueueCheck = {
    status: 'down',
    pendingJobs: 0,
    runningJobs: 0,
  };

  try {
    const redisClient = getRedisClient();
    const startTime = Date.now();
    const redisPingResult = await redisClient.ping();
    const latencyMs = Date.now() - startTime;

    if (redisPingResult) {
      redisCheck = {
        status: 'up',
        ...(latencyMs !== undefined && { latencyMs }),
      };
    } else {
      redisCheck = {
        status: 'down',
        error: 'Ping returned false',
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    redisCheck = {
      status: 'down',
      ...(errorMessage && { error: errorMessage }),
    };
  }

  try {
    const cacheManager = getCacheManager();
    const stats = cacheManager.getStats();

    const totalRequests = stats.l1Hits + stats.l2Hits + stats.misses;
    const hitRate =
      totalRequests > 0 ? ((stats.l1Hits + stats.l2Hits) / totalRequests) * 100 : 0;

    cacheCheck = {
      status: 'up',
      ...(stats && { stats }),
      ...(hitRate !== undefined && { hitRate: Math.round(hitRate * 100) / 100 }),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    cacheCheck = {
      status: 'down',
      ...(errorMessage && { error: errorMessage }),
    };
  }

  try {
    const jobQueue = getJobQueue();

    const pendingJobs = await jobQueue.getJobsByStatus('PENDING');
    const runningJobs = await jobQueue.getJobsByStatus('RUNNING');

    let oldestPendingAgeMs: number | undefined;

    if (pendingJobs && pendingJobs.length > 0) {
      const oldestJob = pendingJobs.reduce((oldest, current) => {
        const oldestTime = oldest.createdAt instanceof Date
          ? oldest.createdAt.getTime()
          : typeof oldest.createdAt === 'number'
            ? oldest.createdAt
            : 0;
        const currentTime = current.createdAt instanceof Date
          ? current.createdAt.getTime()
          : typeof current.createdAt === 'number'
            ? current.createdAt
            : 0;
        return currentTime < oldestTime ? current : oldest;
      });

      const createdTime = oldestJob.createdAt instanceof Date
        ? oldestJob.createdAt.getTime()
        : typeof oldestJob.createdAt === 'number'
          ? oldestJob.createdAt
          : Date.now();

      oldestPendingAgeMs = Date.now() - createdTime;
    }

    queueCheck = {
      status: 'up',
      pendingJobs: pendingJobs?.length ?? 0,
      runningJobs: runningJobs?.length ?? 0,
      ...(oldestPendingAgeMs !== undefined && { oldestPendingAgeMs }),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    queueCheck = {
      status: 'down',
      pendingJobs: 0,
      runningJobs: 0,
      ...(errorMessage && { error: errorMessage }),
    };
  }

  const failedChecks = [
    redisCheck.status === 'down',
    cacheCheck.status === 'down',
    queueCheck.status === 'down',
  ].filter(Boolean).length;

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  let httpStatus: number;

  if (failedChecks === 0) {
    overallStatus = 'healthy';
    httpStatus = 200;
  } else if (failedChecks === 1 && redisCheck.status === 'down') {
    overallStatus = 'degraded';
    httpStatus = 200;
  } else {
    overallStatus = 'unhealthy';
    httpStatus = 503;
  }

  const responsePayload: HealthCheckResponse = {
    status: overallStatus,
    timestamp,
    version,
    uptime,
    checks: {
      redis: redisCheck,
      cache: cacheCheck,
      queue: queueCheck,
    },
  };

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type'
  );
  res.setHeader('X-Health-Status', overallStatus);
  res.setHeader('X-Health-Timestamp', timestamp);

  res.status(httpStatus).json(responsePayload);

  serverLogger.info('health_check_completed', {
    status: overallStatus,
    timestamp,
    redisStatus: redisCheck.status,
    cacheStatus: cacheCheck.status,
    queueStatus: queueCheck.status,
    httpStatus,
  });
}
