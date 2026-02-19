/**
 * Health Check Utility
 *
 * Provides comprehensive health check functionality for critical dependencies:
 * - Firebase/Firestore connectivity
 * - Stripe API connectivity
 * - Payment provider status
 *
 * Includes response time measurements and individual component status reporting.
 */

import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

import { logger } from '../structuredLogger';

// ============================================================================
// TYPES
// ============================================================================

export interface ComponentHealthStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTimeMs: number;
  error?: string;
  timestamp: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  components: {
    firebase: ComponentHealthStatus;
    stripe: ComponentHealthStatus;
    paymentProviders: ComponentHealthStatus;
  };
  overallResponseTimeMs: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const FIREBASE_TIMEOUT_MS = 5000;
const STRIPE_TIMEOUT_MS = 5000;
const PAYMENT_PROVIDER_TIMEOUT_MS = 5000;
const HEALTH_CHECK_CACHE_TTL_MS = 30000; // 30 seconds

let lastHealthCheck: HealthCheckResult | null = null;
let lastHealthCheckTime = 0;

// ============================================================================
// FIREBASE HEALTH CHECK
// ============================================================================

async function checkFirebaseHealth(): Promise<ComponentHealthStatus> {
  const startTime = Date.now();
  const name = 'firebase';

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase health check timeout')), FIREBASE_TIMEOUT_MS)
    );

    // Try to perform a simple query to verify Firestore connectivity
    const db = getFirestore();
    const q = query(collection(db, 'users'), limit(1));

    await Promise.race([getDocs(q), timeoutPromise]);

    const responseTimeMs = Date.now() - startTime;

    return {
      name,
      status: 'healthy',
      responseTimeMs,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.warn('Firebase health check failed', {
      component: 'health-check',
      service: 'firebase',
      error: errorMessage,
      responseTimeMs,
    });

    return {
      name,
      status: 'unhealthy',
      responseTimeMs,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// STRIPE HEALTH CHECK
// ============================================================================

async function checkStripeHealth(): Promise<ComponentHealthStatus> {
  const startTime = Date.now();
  const name = 'stripe';

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Stripe health check timeout')), STRIPE_TIMEOUT_MS)
    );

    // Check Stripe API connectivity
    const stripeApiKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeApiKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    // Use fetch to verify Stripe API is accessible
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), STRIPE_TIMEOUT_MS);

    const response = await fetch('https://api.stripe.com/v1/oauth/authorize', {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${stripeApiKey}`,
      },
    });

    clearTimeout(timeoutId);

    // We expect 401 or 400 as valid responses (meaning API is accessible)
    // Anything else is a network/connectivity issue
    if (response.ok || response.status === 401 || response.status === 400) {
      const responseTimeMs = Date.now() - startTime;
      return {
        name,
        status: 'healthy',
        responseTimeMs,
        timestamp: new Date().toISOString(),
      };
    }

    throw new Error(`Unexpected Stripe API response: ${response.status}`);
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.warn('Stripe health check failed', {
      component: 'health-check',
      service: 'stripe',
      error: errorMessage,
      responseTimeMs,
    });

    return {
      name,
      status: 'unhealthy',
      responseTimeMs,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// PAYMENT PROVIDER HEALTH CHECK
// ============================================================================

async function checkPaymentProviderHealth(): Promise<ComponentHealthStatus> {
  const startTime = Date.now();
  const name = 'paymentProviders';

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Payment provider health check timeout')), PAYMENT_PROVIDER_TIMEOUT_MS)
    );

    // Check PayStack API (common payment provider)
    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!paystackKey) {
      logger.debug('PayStack API key not configured, skipping check', {
        component: 'health-check',
        service: 'paymentProviders',
      });
      // Return degraded if provider not configured
      return {
        name,
        status: 'degraded',
        responseTimeMs: Date.now() - startTime,
        error: 'Payment provider not configured',
        timestamp: new Date().toISOString(),
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PAYMENT_PROVIDER_TIMEOUT_MS);

    const response = await fetch('https://api.paystack.co/bank', {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY || ''}`,
      },
    });

    clearTimeout(timeoutId);

    if (response.ok || response.status === 401 || response.status === 403) {
      const responseTimeMs = Date.now() - startTime;
      return {
        name,
        status: 'healthy',
        responseTimeMs,
        timestamp: new Date().toISOString(),
      };
    }

    throw new Error(`Unexpected payment provider response: ${response.status}`);
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.warn('Payment provider health check failed', {
      component: 'health-check',
      service: 'paymentProviders',
      error: errorMessage,
      responseTimeMs,
    });

    return {
      name,
      status: 'unhealthy',
      responseTimeMs,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// MAIN HEALTH CHECK FUNCTION
// ============================================================================

/**
 * Performs a comprehensive health check of all critical components
 * Results are cached for 30 seconds to avoid excessive external API calls
 *
 * @returns Promise<HealthCheckResult> Complete health check result with component statuses
 */
export async function getHealthStatus(): Promise<HealthCheckResult> {
  const now = Date.now();

  // Return cached result if still valid
  if (lastHealthCheck && now - lastHealthCheckTime < HEALTH_CHECK_CACHE_TTL_MS) {
    return lastHealthCheck;
  }

  const startTime = Date.now();

  logger.debug('Starting health check', {
    component: 'health-check',
    timestamp: new Date().toISOString(),
  });

  // Perform all checks in parallel
  const [firebase, stripe, paymentProviders] = await Promise.all([
    checkFirebaseHealth(),
    checkStripeHealth(),
    checkPaymentProviderHealth(),
  ]);

  // Determine overall status
  const allComponentsHealthy = [firebase, stripe, paymentProviders].every(
    (c) => c.status === 'healthy'
  );
  const anyUnhealthy = [firebase, stripe, paymentProviders].some(
    (c) => c.status === 'unhealthy'
  );

  const overallStatus: 'healthy' | 'degraded' | 'unhealthy' = anyUnhealthy
    ? 'unhealthy'
    : allComponentsHealthy
      ? 'healthy'
      : 'degraded';

  const overallResponseTimeMs = Date.now() - startTime;

  const result: HealthCheckResult = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    components: {
      firebase,
      stripe,
      paymentProviders,
    },
    overallResponseTimeMs,
  };

  // Cache the result
  lastHealthCheck = result;
  lastHealthCheckTime = now;

  logger.debug('Health check complete', {
    component: 'health-check',
    status: result.status,
    overallResponseTimeMs,
  });

  return result;
}

/**
 * Clear the cached health check result
 * Useful for testing or forcing a fresh check
 */
export function clearHealthCheckCache(): void {
  lastHealthCheck = null;
  lastHealthCheckTime = 0;
}
