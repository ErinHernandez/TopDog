/**
 * Health Check API - Edge Function Version
 * 
 * Optimized for high-traffic, low-latency health checks.
 * Runs on Vercel Edge Network for global distribution.
 * 
 * GET /api/health-edge
 * 
 * @module pages/api/health-edge
 */

import type { NextRequest } from 'next/server';
import { withEdgeErrorHandling } from '@/lib/edgeErrorHandler';

// Edge runtime configuration
export const config = {
  runtime: 'edge',
};

// ============================================================================
// TYPES
// ============================================================================

interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  version?: string;
  environment: string;
  responseTimeMs?: number;
  edge?: {
    region: string;
    city?: string;
  };
}

// ============================================================================
// HANDLER
// ============================================================================

async function handler(req: NextRequest): Promise<Response> {
  const startTime = Date.now();
  
  // Get edge region info
  // geo property exists on NextRequest in edge runtime but not in types
   
  const geo = (req as any).geo;
  const region = geo?.region || 'unknown';
  const city = geo?.city;
  
  let overallStatus: 'ok' | 'degraded' | 'error' = 'ok';
  const checks: Record<string, string> = {};
  
  // Check required environment variables
  const hasRequiredEnv = !!(
    process.env.NODE_ENV &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );

  if (!hasRequiredEnv) {
    overallStatus = 'degraded';
    checks.api = 'error';
    checks.env = 'missing';
  } else {
    checks.api = 'ok';
    checks.env = 'ok';
  }

  const responseTime = Date.now() - startTime;

  // Build response
  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: 0, // Edge functions don't have process.uptime()
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'unknown',
    responseTimeMs: responseTime,
    edge: {
      region,
      ...(city && { city }),
    },
  };

  return new Response(JSON.stringify(response), {
    status: overallStatus === 'ok' ? 200 : 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Server-Time': Date.now().toString(),
    },
  });
}

export default withEdgeErrorHandling(handler);
