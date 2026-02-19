/**
 * K6 Load Testing Configuration
 * Shared options, stages, thresholds, and custom metrics for Idesaign load tests
 * Supports multiple virtual user configurations and detailed latency tracking
 */

import { Trend, Counter, Rate, Gauge } from 'k6/metrics';

// Custom metrics for detailed latency analysis
export const p95LatencyMetric = new Trend('p95_latency_ms', { unit: 'ms' });
export const p99LatencyMetric = new Trend('p99_latency_ms', { unit: 'ms' });
export const errorRateMetric = new Rate('error_rate');
export const requestsPerSecondMetric = new Gauge('requests_per_second');
export const activeConnectionsMetric = new Gauge('active_connections');
export const contentLengthMetric = new Trend('response_size_bytes', { unit: 'bytes' });

// Categorized error tracking
export const aiErrorMetric = new Counter('ai_route_errors');
export const uploadErrorMetric = new Counter('upload_route_errors');
export const generationErrorMetric = new Counter('generation_route_errors');
export const sseErrorMetric = new Counter('sse_route_errors');
export const communityErrorMetric = new Counter('community_route_errors');

/**
 * Get base k6 options with configurable virtual users
 * @param vus Virtual users (defaults to 10)
 * @param duration Test duration in seconds (defaults to 480)
 * @returns k6 options object
 */
export function getBaseOptions(vus: number = 10, duration: number = 480) {
  return {
    vus,
    stages: [
      // Ramp up: 0 → target VUs over 1 minute
      { duration: '1m', target: vus },
      // Sustained load: maintain target VUs for 5 minutes
      { duration: '5m', target: vus },
      // Spike: increase to 1.5x target VUs for 1 minute
      { duration: '1m', target: Math.ceil(vus * 1.5) },
      // Ramp down: return to 0 VUs over 1 minute
      { duration: '1m', target: 0 },
    ],
    thresholds: {
      // HTTP metrics
      http_req_duration: ['p(95)<5000', 'p(99)<10000'],
      http_req_failed: ['rate<0.01'],
      http_reqs: ['count>100'],

      // Custom p95/p99 latency thresholds (per route)
      p95_latency_ms: ['p(95)<5000'],
      p99_latency_ms: ['p(99)<10000'],

      // Error rate threshold
      error_rate: ['rate<0.01'],

      // Response size threshold (prevent memory leaks)
      response_size_bytes: ['p(95)<10485760'], // 10MB
    },
  };
}

/**
 * Configuration for AI routes (face detection, enhancement, inpainting, etc.)
 */
export const aiRouteThresholds = {
  http_req_duration: ['p(95)<5000', 'p(99)<8000'],
  http_req_failed: ['rate<0.01'],
};

/**
 * Configuration for upload routes (file uploads with varying sizes)
 */
export const uploadRouteThresholds = {
  http_req_duration: ['p(95)<10000', 'p(99)<15000'], // Larger files
  http_req_failed: ['rate<0.02'],
};

/**
 * Configuration for generation routes (model inference, batch processing)
 */
export const generationRouteThresholds = {
  http_req_duration: ['p(95)<10000', 'p(99)<15000'],
  http_req_failed: ['rate<0.02'],
};

/**
 * Configuration for SSE connections (long-lived connections, progress streams)
 */
export const sseRouteThresholds = {
  http_req_duration: ['p(95)<1000', 'p(99)<2000'], // Fast connection establishment
  http_req_failed: ['rate<0.01'],
};

/**
 * Configuration for community routes (social, gallery, prompts)
 */
export const communityRouteThresholds = {
  http_req_duration: ['p(95)<1000', 'p(99)<2000'],
  http_req_failed: ['rate<0.01'],
};

/**
 * Rate limit testing configuration
 */
export const rateLimitThresholds = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.05'], // Higher allowed failure rate for rate limit tests
};

/**
 * Standard request headers for all routes
 */
export function getStandardHeaders(authToken: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
    'User-Agent': 'k6-load-test/1.0',
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate',
  };
}

/**
 * Headers for multipart file uploads
 */
export function getUploadHeaders(authToken: string) {
  return {
    'Authorization': `Bearer ${authToken}`,
    'User-Agent': 'k6-load-test/1.0',
  };
}

/**
 * Get request timeout configuration based on route type
 */
export const timeoutConfig = {
  // Fast endpoints (reads, cache hits)
  FAST: '10s',
  // Standard endpoints (API calls, moderate processing)
  STANDARD: '30s',
  // Long endpoints (image generation, batch processing)
  LONG: '120s',
  // Very long endpoints (heavy generation, large uploads)
  VERY_LONG: '300s',
};

/**
 * Virtual user profiles for different load scenarios
 */
export const vuProfiles = {
  // Light load: 10 VUs, simulates 10 concurrent users
  light: { vus: 10, description: 'Light load (10 concurrent users)' },
  // Standard load: 50 VUs, simulates 50 concurrent users
  standard: { vus: 50, description: 'Standard load (50 concurrent users)' },
  // Heavy load: 100 VUs, simulates 100 concurrent users
  heavy: { vus: 100, description: 'Heavy load (100 concurrent users)' },
  // Stress test: 200 VUs, simulates 200 concurrent users
  stress: { vus: 200, description: 'Stress test (200 concurrent users)' },
  // Spike test: 500 VUs for burst testing
  spike: { vus: 500, description: 'Spike test (500 concurrent users)' },
};

/**
 * Test data constants
 */
export const testDataSizes = {
  // Image sizes for upload tests
  SMALL_IMAGE: 100 * 1024, // 100 KB
  MEDIUM_IMAGE: 1 * 1024 * 1024, // 1 MB
  LARGE_IMAGE: 5 * 1024 * 1024, // 5 MB
  XLARGE_IMAGE: 10 * 1024 * 1024, // 10 MB

  // JSON payload sizes
  SMALL_PAYLOAD: 1024, // 1 KB
  MEDIUM_PAYLOAD: 100 * 1024, // 100 KB
};

/**
 * API base configuration
 */
export const apiConfig = {
  baseUrl: __ENV.BASE_URL || 'http://localhost:3000',
  apiPath: '/api/studio',
  timeout: timeoutConfig.STANDARD,
};

/**
 * Get auth token from environment or use test token
 */
export function getAuthToken(): string {
  return __ENV.AUTH_TOKEN || 'test-auth-token-load-test-12345';
}

/**
 * Utility to track custom metrics
 */
export function trackLatency(latencyMs: number, percentile: 'p95' | 'p99') {
  if (percentile === 'p95') {
    p95LatencyMetric.add(latencyMs);
  } else {
    p99LatencyMetric.add(latencyMs);
  }
}

/**
 * Utility to track errors by category
 */
export function trackError(category: 'ai' | 'upload' | 'generation' | 'sse' | 'community') {
  errorRateMetric.add(1);
  switch (category) {
    case 'ai':
      aiErrorMetric.add(1);
      break;
    case 'upload':
      uploadErrorMetric.add(1);
      break;
    case 'generation':
      generationErrorMetric.add(1);
      break;
    case 'sse':
      sseErrorMetric.add(1);
      break;
    case 'community':
      communityErrorMetric.add(1);
      break;
  }
}
