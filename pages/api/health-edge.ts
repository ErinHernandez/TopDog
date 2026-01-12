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

export default async function handler(req: NextRequest) {
  const startTime = Date.now();
  
  // Get edge region info
  const region = req.geo?.region || 'unknown';
  const city = req.geo?.city;
  
  let overallStatus: 'ok' | 'degraded' | 'error' = 'ok';
  const checks: Record<string, string> = {};
  
  try {
    // Check required environment variables
    const hasRequiredEnv = !!(
      process.env.NODE_ENV &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    );

    if (!hasRequiredEnv) {
      overallStatus = 'degraded';
      checks.api = 'error';
    } else {
      checks.api = 'ok';
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
        // Add server timestamp for latency compensation
        'X-Server-Time': Date.now().toString(),
      },
    });

  } catch (error) {
    const response: HealthResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: 0,
      environment: process.env.NODE_ENV || 'unknown',
      edge: {
        region: req.geo?.region || 'unknown',
      },
    };

    return new Response(JSON.stringify(response), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'X-Server-Time': Date.now().toString(),
      },
    });
  }
}
