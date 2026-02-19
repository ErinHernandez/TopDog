/**
 * K6 Load Test: Generation Routes
 * Tests model inference, batch generation, cost estimation, status polling, and A/B comparisons
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import {
  getBaseOptions,
  getStandardHeaders,
  getAuthToken,
  apiConfig,
  generationRouteThresholds,
  p95LatencyMetric,
  trackError,
} from '../k6-config.ts';

// Route-specific metrics
const generateLatency = new Trend('generate_latency_ms');
const estimateLatency = new Trend('estimate_latency_ms');
const statusLatency = new Trend('status_latency_ms');
const batchLatency = new Trend('batch_latency_ms');
const comparisonLatency = new Trend('comparison_latency_ms');
const generationStartedCounter = new Counter('generation_started_count');
const estimationRequestsCounter = new Counter('estimation_requests_count');

export const options = {
  ...getBaseOptions(40), // 40 VUs for generation routes
  thresholds: generationRouteThresholds,
};

/**
 * Test generation endpoint for model inference
 * POST /api/studio/generate/{model}
 * Models: stable-diffusion, dall-e, midjourney, etc.
 */
function testGenerateImage() {
  const models = ['stable-diffusion', 'dall-e', 'midjourney'];
  const model = models[Math.floor(Math.random() * models.length)];
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/generate/${model}`;

  const payload = JSON.stringify({
    prompt: 'a professional portrait of a person in a studio setting',
    negativePrompt: 'blurry, low quality, distorted',
    steps: 30,
    guidanceScale: 7.5,
    seed: Math.floor(Math.random() * 1000000),
    width: 512,
    height: 512,
    scheduler: 'DPMSolverMultistepScheduler',
  });

  const startTime = new Date().getTime();
  const response = http.post(url, payload, {
    headers: getStandardHeaders(getAuthToken()),
    timeout: '60s', // Longer timeout for generation
  });
  const latency = new Date().getTime() - startTime;

  generateLatency.add(latency);
  p95LatencyMetric.add(latency);

  const passed = check(response, {
    'generate status 200 or 202': (r) => r.status === 200 || r.status === 202,
    'generate has valid response': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.success === true && 'data' in body;
      } catch {
        return false;
      }
    },
    'generate latency < 10s': (r) => latency < 10000,
  });

  if (!passed) {
    trackError('generation');
  } else {
    generationStartedCounter.add(1);
  }

  return response.status === 200 ? parseResponse(response)?.data?.jobId : null;
}

/**
 * Test cost estimation endpoint
 * POST /api/studio/generate/estimate
 * Estimates credit/cost for a generation request
 */
function testEstimateGeneration() {
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/generate/estimate`;

  const payload = JSON.stringify({
    model: 'stable-diffusion',
    prompt: 'a professional portrait',
    steps: 30,
    width: 512,
    height: 512,
  });

  const startTime = new Date().getTime();
  const response = http.post(url, payload, {
    headers: getStandardHeaders(getAuthToken()),
    timeout: '5s',
  });
  const latency = new Date().getTime() - startTime;

  estimateLatency.add(latency);
  p95LatencyMetric.add(latency);

  const passed = check(response, {
    'estimate status 200': (r) => r.status === 200,
    'estimate has cost': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.data && 'estimatedCredits' in body.data;
      } catch {
        return false;
      }
    },
    'estimate latency < 1s': (r) => latency < 1000,
  });

  if (!passed) {
    trackError('generation');
  } else {
    estimationRequestsCounter.add(1);
  }
}

/**
 * Test status polling endpoint
 * GET /api/studio/generate/status?jobId={jobId}
 * Simulates real-time progress polling
 */
function testStatusPolling(jobId: string | null) {
  if (!jobId) {
    jobId = `job-${Math.floor(Math.random() * 10000)}`; // Use generated job ID if available
  }

  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/generate/status`;

  const startTime = new Date().getTime();
  const response = http.get(`${url}?jobId=${jobId}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    timeout: '5s',
  });
  const latency = new Date().getTime() - startTime;

  statusLatency.add(latency);
  p95LatencyMetric.add(latency);

  const passed = check(response, {
    'status status 200 or 202': (r) => r.status === 200 || r.status === 202,
    'status has progress': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.data && ('progress' in body.data || 'status' in body.data);
      } catch {
        return false;
      }
    },
    'status latency < 1s': (r) => latency < 1000,
  });

  if (!passed) {
    trackError('generation');
  }
}

/**
 * Test batch generation endpoint
 * POST /api/studio/generate/batch
 * Submits multiple generation requests in a single API call
 */
function testBatchGeneration() {
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/generate/batch`;

  const payload = JSON.stringify({
    model: 'stable-diffusion',
    requests: [
      {
        prompt: 'portrait 1',
        seed: Math.floor(Math.random() * 1000000),
      },
      {
        prompt: 'portrait 2',
        seed: Math.floor(Math.random() * 1000000),
      },
      {
        prompt: 'portrait 3',
        seed: Math.floor(Math.random() * 1000000),
      },
    ],
    parallelizationLevel: 'max',
  });

  const startTime = new Date().getTime();
  const response = http.post(url, payload, {
    headers: getStandardHeaders(getAuthToken()),
    timeout: '60s',
  });
  const latency = new Date().getTime() - startTime;

  batchLatency.add(latency);
  p95LatencyMetric.add(latency);

  const passed = check(response, {
    'batch status 200 or 202': (r) => r.status === 200 || r.status === 202,
    'batch has job ids': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.data && Array.isArray(body.data.jobIds);
      } catch {
        return false;
      }
    },
    'batch latency < 15s': (r) => latency < 15000,
  });

  if (!passed) {
    trackError('generation');
  }
}

/**
 * Test comparison/A/B testing endpoint
 * POST /api/studio/comparison/create
 * Creates A/B comparison between two generated variations
 */
function testCreateComparison() {
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/comparison/create`;

  const payload = JSON.stringify({
    generationIdA: `gen-${Math.floor(Math.random() * 10000)}`,
    generationIdB: `gen-${Math.floor(Math.random() * 10000)}`,
    metadata: {
      promptA: 'version A prompt',
      promptB: 'version B prompt',
      userId: 'test-user',
      comparisonCriteria: ['quality', 'relevance', 'aesthetics'],
    },
  });

  const startTime = new Date().getTime();
  const response = http.post(url, payload, {
    headers: getStandardHeaders(getAuthToken()),
    timeout: '10s',
  });
  const latency = new Date().getTime() - startTime;

  comparisonLatency.add(latency);
  p95LatencyMetric.add(latency);

  const passed = check(response, {
    'comparison status 200': (r) => r.status === 200,
    'comparison has comparison id': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.data && 'comparisonId' in body.data;
      } catch {
        return false;
      }
    },
    'comparison latency < 2s': (r) => latency < 2000,
  });

  if (!passed) {
    trackError('generation');
  }
}

/**
 * Helper to parse response safely
 */
function parseResponse(response: any) {
  try {
    return JSON.parse(response.body as string);
  } catch {
    return null;
  }
}

/**
 * Main test function with weighted distribution
 */
export default function () {
  const rand = Math.random();

  if (rand < 0.35) {
    // 35% generation requests
    const jobId = testGenerateImage();
    sleep(0.5); // Brief pause after generation request
  } else if (rand < 0.55) {
    // 20% cost estimation
    testEstimateGeneration();
  } else if (rand < 0.70) {
    // 15% status polling
    testStatusPolling(null);
  } else if (rand < 0.85) {
    // 15% batch generation
    testBatchGeneration();
  } else {
    // 15% comparisons
    testCreateComparison();
  }

  sleep(0.5 + Math.random() * 1); // 0.5-1.5s between requests
}
