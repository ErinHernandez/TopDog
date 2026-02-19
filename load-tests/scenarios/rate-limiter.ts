/**
 * K6 Load Test: Rate Limiter Validation
 * Tests rate limiting enforcement across different user tiers
 * Verifies 429 responses, Retry-After headers, and rate limit recovery
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Gauge, Trend } from 'k6/metrics';
import {
  getBaseOptions,
  getStandardHeaders,
  getAuthToken,
  apiConfig,
  rateLimitThresholds,
  trackError,
} from '../k6-config.ts';

// Rate limit specific metrics
const rateLimitHitsCounter = new Counter('rate_limit_hits');
const validRequestsCounter = new Counter('valid_requests');
const throttledRequestsCounter = new Counter('throttled_requests');
const rateLimitLatency = new Trend('rate_limit_response_latency_ms');
const tierDistribution = {
  free: new Gauge('tier_free_requests'),
  pro: new Gauge('tier_pro_requests'),
  team: new Gauge('tier_team_requests'),
  enterprise: new Gauge('tier_enterprise_requests'),
};

export const options = {
  ...getBaseOptions(20), // 20 VUs for rate limit tests
  thresholds: rateLimitThresholds,
};

/**
 * User tier definitions with rate limits
 */
const userTiers = {
  free: {
    token: 'free-tier-token-test',
    requestsPerMinute: 30,
    requestsPerHour: 500,
    bursts: 5, // Allow 5 burst requests
  },
  pro: {
    token: 'pro-tier-token-test',
    requestsPerMinute: 150,
    requestsPerHour: 5000,
    bursts: 20,
  },
  team: {
    token: 'team-tier-token-test',
    requestsPerMinute: 500,
    requestsPerHour: 20000,
    bursts: 50,
  },
  enterprise: {
    token: 'enterprise-tier-token-test',
    requestsPerMinute: 2000,
    requestsPerHour: 100000,
    bursts: 200,
  },
};

/**
 * Test rate limiting on a single user tier
 * Makes rapid requests to hit rate limits
 */
function testTierRateLimit(tier: keyof typeof userTiers, endpoint: string) {
  const tierConfig = userTiers[tier];
  const url = `${apiConfig.baseUrl}${endpoint}`;

  let hitsLimit = false;
  let requestCount = 0;
  const retryAfterValues: string[] = [];

  // Make requests rapidly to hit rate limit
  const burstLimit = Math.ceil(tierConfig.bursts * 1.2); // Exceed burst limit
  for (let i = 0; i < burstLimit; i++) {
    const startTime = new Date().getTime();
    const response = http.get(url, {
      headers: {
        'Authorization': `Bearer ${tierConfig.token}`,
      },
      timeout: '5s',
    });
    const latency = new Date().getTime() - startTime;

    rateLimitLatency.add(latency);
    requestCount++;

    if (response.status === 429) {
      // Rate limited
      hitsLimit = true;
      rateLimitHitsCounter.add(1);
      throttledRequestsCounter.add(1);

      // Check for Retry-After header
      const retryAfter = response.headers['Retry-After'];
      if (retryAfter) {
        retryAfterValues.push(retryAfter);
      }

      check(response, {
        'rate-limit 429 status': (r) => r.status === 429,
        'rate-limit has Retry-After header': (r) => 'Retry-After' in r.headers,
        'rate-limit error message present': (r) => {
          try {
            const body = JSON.parse(r.body as string);
            return body.error && body.error.includes('rate');
          } catch {
            return false;
          }
        },
      });
    } else if (response.status === 200) {
      validRequestsCounter.add(1);
    }
  }

  // Verify we actually hit the rate limit
  check(hitsLimit, {
    'rate-limit was enforced': () => hitsLimit,
  });

  tierDistribution[tier].set(requestCount);
  return hitsLimit;
}

/**
 * Test rate limit recovery
 * Verifies that limits reset after the window expires
 */
function testRateLimitRecovery(tier: keyof typeof userTiers) {
  const tierConfig = userTiers[tier];
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/health`;

  // Phase 1: Exhaust rate limit
  let response429Count = 0;
  const burstAttempts = Math.ceil(tierConfig.bursts * 1.5);

  for (let i = 0; i < burstAttempts; i++) {
    const response = http.get(url, {
      headers: {
        'Authorization': `Bearer ${tierConfig.token}`,
      },
      timeout: '5s',
    });

    if (response.status === 429) {
      response429Count++;
      // Extract Retry-After value
      const retryAfter = response.headers['Retry-After'];
      if (retryAfter) {
        const waitSeconds = parseInt(retryAfter, 10);
        if (waitSeconds && waitSeconds < 60) {
          sleep(waitSeconds); // Wait for limit to reset
        }
      }
    }
  }

  // Phase 2: After waiting, verify we can make requests again
  sleep(2); // Additional safety buffer
  const recoveryResponse = http.get(url, {
    headers: {
      'Authorization': `Bearer ${tierConfig.token}`,
    },
    timeout: '5s',
  });

  const recovered = check(recoveryResponse, {
    'rate-limit recovery successful': (r) => r.status === 200,
    'recovery requests count correct': () => response429Count > 0,
  });

  return recovered;
}

/**
 * Test per-endpoint rate limits
 * Different endpoints may have different limits
 */
function testEndpointRateLimits(tier: keyof typeof userTiers) {
  const endpoints = [
    '/ai/detect-faces',
    '/ai/enhance-portrait',
    '/files/upload',
    '/generate/estimate',
    '/community/posts',
  ];

  const results = {
    limited: 0,
    unlimited: 0,
  };

  for (const endpoint of endpoints) {
    const url = `${apiConfig.baseUrl}${apiConfig.apiPath}${endpoint}`;
    const tierConfig = userTiers[tier];

    // Make rapid-fire requests
    for (let i = 0; i < 15; i++) {
      const response = http.post(url, JSON.stringify({}), {
        headers: getStandardHeaders(tierConfig.token),
        timeout: '5s',
      });

      if (response.status === 429) {
        results.limited++;
        rateLimitHitsCounter.add(1);
      } else if (response.status === 200 || response.status === 400 || response.status === 401) {
        results.unlimited++;
      }
    }

    sleep(0.5); // Delay between endpoint tests
  }

  return results.limited > 0; // At least some endpoints should be rate limited
}

/**
 * Test concurrent requests and shared rate limit buckets
 * Verify that concurrent requests all count toward limit
 */
function testConcurrentRateLimitBehavior(tier: keyof typeof userTiers) {
  const tierConfig = userTiers[tier];
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/health`;
  const concurrentCount = Math.ceil(tierConfig.bursts * 1.5);

  const responses: any[] = [];

  // Simulate concurrent requests (in k6, not true concurrency, but rapid sequential)
  for (let i = 0; i < concurrentCount; i++) {
    const response = http.get(url, {
      headers: {
        'Authorization': `Bearer ${tierConfig.token}`,
      },
      timeout: '5s',
    });
    responses.push(response);
  }

  // Count 429s and verify they happen
  const rateLimitedCount = responses.filter((r) => r.status === 429).length;

  check(rateLimitedCount > 0, {
    'concurrent requests trigger rate limit': () => rateLimitedCount > 0,
  });

  return rateLimitedCount > 0;
}

/**
 * Test rate limit headers in successful responses
 * Verify X-RateLimit-* headers are present
 */
function testRateLimitHeaders(tier: keyof typeof userTiers) {
  const tierConfig = userTiers[tier];
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/health`;

  const response = http.get(url, {
    headers: {
      'Authorization': `Bearer ${tierConfig.token}`,
    },
    timeout: '5s',
  });

  const passed = check(response, {
    'has X-RateLimit-Limit header': (r) => 'X-RateLimit-Limit' in r.headers,
    'has X-RateLimit-Remaining header': (r) => 'X-RateLimit-Remaining' in r.headers,
    'has X-RateLimit-Reset header': (r) => 'X-RateLimit-Reset' in r.headers,
    'rate-limit-limit is numeric': (r) => {
      const limit = r.headers['X-RateLimit-Limit'];
      return limit && !isNaN(parseInt(limit as string, 10));
    },
    'rate-limit-remaining is numeric': (r) => {
      const remaining = r.headers['X-RateLimit-Remaining'];
      return remaining && !isNaN(parseInt(remaining as string, 10));
    },
  });

  return passed;
}

/**
 * Main test function testing all rate limit scenarios
 */
export default function () {
  const rand = Math.random();

  if (rand < 0.2) {
    // 20% test free tier limits
    testTierRateLimit('free', `${apiConfig.apiPath}/health`);
  } else if (rand < 0.4) {
    // 20% test pro tier limits
    testTierRateLimit('pro', `${apiConfig.apiPath}/health`);
  } else if (rand < 0.6) {
    // 20% test team tier limits
    testTierRateLimit('team', `${apiConfig.apiPath}/health`);
  } else if (rand < 0.75) {
    // 15% test recovery behavior
    const tier = ['free', 'pro', 'team'][Math.floor(Math.random() * 3)] as keyof typeof userTiers;
    testRateLimitRecovery(tier);
  } else if (rand < 0.88) {
    // 13% test per-endpoint limits
    const tier = ['free', 'pro'][Math.floor(Math.random() * 2)] as keyof typeof userTiers;
    testEndpointRateLimits(tier);
  } else if (rand < 0.95) {
    // 7% test headers
    const tier = ['free', 'pro', 'team'][Math.floor(Math.random() * 3)] as keyof typeof userTiers;
    testRateLimitHeaders(tier);
  } else {
    // 5% test concurrent behavior
    const tier = ['free', 'pro'][Math.floor(Math.random() * 2)] as keyof typeof userTiers;
    testConcurrentRateLimitBehavior(tier);
  }

  sleep(0.5 + Math.random() * 1); // Delay between tests
}
