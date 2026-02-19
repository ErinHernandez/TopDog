/**
 * K6 Load Test: AI Routes
 * Tests AI tool routes: face detection, enhancement, inpainting, background removal, text editing, upscaling
 * Target throughput: 73 req/s combined across all endpoints
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import {
  getBaseOptions,
  getStandardHeaders,
  getAuthToken,
  apiConfig,
  aiRouteThresholds,
  trackLatency,
  trackError,
  p95LatencyMetric,
} from '../k6-config.ts';

// Route-specific metrics
const detectFacesLatency = new Trend('ai_detect_faces_latency_ms');
const enhancePortraitLatency = new Trend('ai_enhance_portrait_latency_ms');
const inpaintLatency = new Trend('ai_inpaint_latency_ms');
const removeBgLatency = new Trend('ai_remove_bg_latency_ms');
const textEditLatency = new Trend('ai_text_edit_latency_ms');
const upscaleLatency = new Trend('ai_upscale_latency_ms');

// Test data: small base64 test images
const SMALL_TEST_IMAGE = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const MEDIUM_TEST_IMAGE = 'iVBORw0KGgoAAAANSUhEUgAAABgAAAABCAYAAABbZ5x6AAAAIklEQVQIHWP8z8DAwMzAwMA' +
  'AwMjAwAjAwADGwMDAwMr6+goDCfTEAAAAASUVORK5CYII=';

export const options = {
  ...getBaseOptions(50), // 50 VUs for AI routes
  thresholds: aiRouteThresholds,
};

/**
 * Test face detection endpoint
 * POST /api/studio/ai/detect-faces
 * Target: 20 req/s
 */
function testDetectFaces() {
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/ai/detect-faces`;
  const payload = JSON.stringify({
    imageBase64: SMALL_TEST_IMAGE,
    detectionConfidence: 0.7,
  });

  const startTime = new Date().getTime();
  const response = http.post(url, payload, {
    headers: getStandardHeaders(getAuthToken()),
    timeout: '10s',
  });
  const latency = new Date().getTime() - startTime;

  detectFacesLatency.add(latency);
  p95LatencyMetric.add(latency);

  const passed = check(response, {
    'detect-faces status 200': (r) => r.status === 200,
    'detect-faces has valid response': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.success === true && 'data' in body;
      } catch {
        return false;
      }
    },
    'detect-faces latency < 5s': (r) => latency < 5000,
  });

  if (!passed) {
    trackError('ai');
  }
}

/**
 * Test portrait enhancement endpoint
 * POST /api/studio/ai/enhance-portrait
 * Target: 15 req/s
 */
function testEnhancePortrait() {
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/ai/enhance-portrait`;
  const payload = JSON.stringify({
    imageBase64: MEDIUM_TEST_IMAGE,
    enhancementLevel: 0.8,
    preserveOriginal: false,
  });

  const startTime = new Date().getTime();
  const response = http.post(url, payload, {
    headers: getStandardHeaders(getAuthToken()),
    timeout: '10s',
  });
  const latency = new Date().getTime() - startTime;

  enhancePortraitLatency.add(latency);
  p95LatencyMetric.add(latency);

  const passed = check(response, {
    'enhance-portrait status 200': (r) => r.status === 200,
    'enhance-portrait has valid response': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.success === true && 'data' in body;
      } catch {
        return false;
      }
    },
    'enhance-portrait latency < 5s': (r) => latency < 5000,
  });

  if (!passed) {
    trackError('ai');
  }
}

/**
 * Test inpainting endpoint
 * POST /api/studio/ai/inpaint
 * Target: 10 req/s
 */
function testInpaint() {
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/ai/inpaint`;
  const payload = JSON.stringify({
    imageBase64: MEDIUM_TEST_IMAGE,
    maskBase64: SMALL_TEST_IMAGE,
    prompt: 'fill with matching background',
  });

  const startTime = new Date().getTime();
  const response = http.post(url, payload, {
    headers: getStandardHeaders(getAuthToken()),
    timeout: '15s',
  });
  const latency = new Date().getTime() - startTime;

  inpaintLatency.add(latency);
  p95LatencyMetric.add(latency);

  const passed = check(response, {
    'inpaint status 200': (r) => r.status === 200,
    'inpaint has valid response': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.success === true && 'data' in body;
      } catch {
        return false;
      }
    },
    'inpaint latency < 8s': (r) => latency < 8000,
  });

  if (!passed) {
    trackError('ai');
  }
}

/**
 * Test background removal endpoint
 * POST /api/studio/ai/remove-bg
 * Target: 15 req/s
 */
function testRemoveBg() {
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/ai/remove-bg`;
  const payload = JSON.stringify({
    imageBase64: MEDIUM_TEST_IMAGE,
    returnAlpha: true,
  });

  const startTime = new Date().getTime();
  const response = http.post(url, payload, {
    headers: getStandardHeaders(getAuthToken()),
    timeout: '10s',
  });
  const latency = new Date().getTime() - startTime;

  removeBgLatency.add(latency);
  p95LatencyMetric.add(latency);

  const passed = check(response, {
    'remove-bg status 200': (r) => r.status === 200,
    'remove-bg has valid response': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.success === true && 'data' in body;
      } catch {
        return false;
      }
    },
    'remove-bg latency < 5s': (r) => latency < 5000,
  });

  if (!passed) {
    trackError('ai');
  }
}

/**
 * Test text editing endpoint
 * POST /api/studio/ai/text-edit
 * Target: 15 req/s
 */
function testTextEdit() {
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/ai/text-edit`;
  const payload = JSON.stringify({
    imageBase64: MEDIUM_TEST_IMAGE,
    textRegions: [
      {
        x: 10,
        y: 20,
        width: 100,
        height: 30,
        newText: 'Updated Text',
        font: 'Arial',
        fontSize: 14,
      },
    ],
  });

  const startTime = new Date().getTime();
  const response = http.post(url, payload, {
    headers: getStandardHeaders(getAuthToken()),
    timeout: '10s',
  });
  const latency = new Date().getTime() - startTime;

  textEditLatency.add(latency);
  p95LatencyMetric.add(latency);

  const passed = check(response, {
    'text-edit status 200': (r) => r.status === 200,
    'text-edit has valid response': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.success === true && 'data' in body;
      } catch {
        return false;
      }
    },
    'text-edit latency < 5s': (r) => latency < 5000,
  });

  if (!passed) {
    trackError('ai');
  }
}

/**
 * Test upscaling endpoint
 * POST /api/studio/ai/upscale
 * Target: 8 req/s
 */
function testUpscale() {
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/ai/upscale`;
  const payload = JSON.stringify({
    imageBase64: MEDIUM_TEST_IMAGE,
    scaleFactor: 2,
    preserveDetails: true,
  });

  const startTime = new Date().getTime();
  const response = http.post(url, payload, {
    headers: getStandardHeaders(getAuthToken()),
    timeout: '20s',
  });
  const latency = new Date().getTime() - startTime;

  upscaleLatency.add(latency);
  p95LatencyMetric.add(latency);

  const passed = check(response, {
    'upscale status 200': (r) => r.status === 200,
    'upscale has valid response': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.success === true && 'data' in body;
      } catch {
        return false;
      }
    },
    'upscale latency < 10s': (r) => latency < 10000,
  });

  if (!passed) {
    trackError('ai');
  }
}

/**
 * Main test function with weighted distribution
 * Distributes load across endpoints to match target throughput
 */
export default function () {
  const rand = Math.random();

  if (rand < 0.27) {
    // 27% → detect-faces (20 req/s)
    testDetectFaces();
  } else if (rand < 0.48) {
    // 21% → enhance-portrait (15 req/s)
    testEnhancePortrait();
  } else if (rand < 0.62) {
    // 14% → inpaint (10 req/s)
    testInpaint();
  } else if (rand < 0.82) {
    // 20% → remove-bg (15 req/s)
    testRemoveBg();
  } else if (rand < 0.93) {
    // 11% → text-edit (8 req/s) — adjusted distribution
    testTextEdit();
  } else {
    // 7% → upscale (5 req/s) — adjusted distribution
    testUpscale();
  }

  sleep(0.5 + Math.random() * 0.5); // 0.5-1.0s between requests
}
