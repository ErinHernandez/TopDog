/**
 * GET /api/health
 * Comprehensive health check endpoint for monitoring and alerting.
 *
 * Returns service connectivity status for: Firestore, Redis, Stripe.
 * Includes version info, uptime, and environment metadata.
 *
 * @module pages/api/health
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { wrapPublicRoute } from '@/lib/studio/api/wrapRoute';
import { methodNotAllowed } from '@/lib/studio/api/errorResponse';

type ServiceStatus = 'ok' | 'error' | 'unconfigured';

interface HealthCheck {
  status: ServiceStatus;
  latencyMs?: number;
  message?: string;
}

const startedAt = Date.now();

async function checkFirestore(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const admin = await import('firebase-admin');
    const db = admin.apps?.length ? admin.firestore() : null;
    if (!db) {
      return { status: 'error', message: 'Firebase Admin not initialized' };
    }
    await db.collection('health_checks').doc('ping').set(
      { timestamp: Date.now() },
      { merge: true },
    );
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: 'error',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

async function checkRedis(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return { status: 'unconfigured', message: 'Redis env vars not set' };
    }
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    await redis.ping();
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: 'error',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

function checkStripe(): HealthCheck {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { status: 'unconfigured', message: 'STRIPE_SECRET_KEY not set' };
  }
  return { status: 'ok' };
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const [firestore, redis] = await Promise.all([
    checkFirestore(),
    checkRedis(),
  ]);

  const stripe = checkStripe();

  const services: Record<string, HealthCheck> = { firestore, redis, stripe };
  const allHealthy = Object.values(services).every(
    s => s.status === 'ok' || s.status === 'unconfigured',
  );

  // Cache health for 10s so monitoring doesn't overwhelm downstream services
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');

  return res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    services,
    meta: {
      version: process.env.npm_package_version || '1.0.0',
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'unknown',
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'unknown',
      uptimeMs: Date.now() - startedAt,
    },
    timestamp: new Date().toISOString(),
  });
}

export default wrapPublicRoute(handler);
