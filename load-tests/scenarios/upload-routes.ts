/**
 * K6 Load Test: Upload Routes
 * Tests file upload endpoints with varying file sizes (100KB to 10MB)
 * Includes list and retrieval operations under load
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import {
  getBaseOptions,
  getUploadHeaders,
  getAuthToken,
  apiConfig,
  uploadRouteThresholds,
  p95LatencyMetric,
  trackError,
  testDataSizes,
} from '../k6-config.ts';

// Route-specific metrics
const uploadSmallLatency = new Trend('upload_small_latency_ms');
const uploadMediumLatency = new Trend('upload_medium_latency_ms');
const uploadLargeLatency = new Trend('upload_large_latency_ms');
const uploadXlargeLatency = new Trend('upload_xlarge_latency_ms');
const listFilesLatency = new Trend('list_files_latency_ms');
const retrieveFileLatency = new Trend('retrieve_file_latency_ms');

export const options = {
  ...getBaseOptions(30), // 30 VUs for upload routes (less than AI due to bandwidth)
  thresholds: uploadRouteThresholds,
};

/**
 * Generate binary test data of specified size
 */
function generateBinaryData(sizeBytes: number): ArrayBuffer {
  const buffer = new ArrayBuffer(sizeBytes);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < sizeBytes; i++) {
    view[i] = Math.floor(Math.random() * 256);
  }
  return buffer;
}

/**
 * Test file upload with small file (100 KB)
 * POST /api/studio/files/upload
 */
function testUploadSmall() {
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/files/upload`;
  const fileData = generateBinaryData(testDataSizes.SMALL_IMAGE);

  const formData = {
    file: http.file(fileData, 'test-small.bin', 'application/octet-stream'),
    filename: `test-small-${Date.now()}.bin`,
    category: 'test',
  };

  const startTime = new Date().getTime();
  const response = http.post(url, formData, {
    headers: getUploadHeaders(getAuthToken()),
    timeout: '30s',
  });
  const latency = new Date().getTime() - startTime;

  uploadSmallLatency.add(latency);
  p95LatencyMetric.add(latency);

  const passed = check(response, {
    'upload-small status 200': (r) => r.status === 200,
    'upload-small has valid response': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.success === true && 'data' in body;
      } catch {
        return false;
      }
    },
    'upload-small latency < 3s': (r) => latency < 3000,
  });

  if (!passed) {
    trackError('upload');
  }

  return response.status === 200 ? parseResponse(response)?.data?.fileId : null;
}

/**
 * Test file upload with medium file (1 MB)
 * POST /api/studio/files/upload
 */
function testUploadMedium() {
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/files/upload`;
  const fileData = generateBinaryData(testDataSizes.MEDIUM_IMAGE);

  const formData = {
    file: http.file(fileData, 'test-medium.bin', 'application/octet-stream'),
    filename: `test-medium-${Date.now()}.bin`,
    category: 'test',
  };

  const startTime = new Date().getTime();
  const response = http.post(url, formData, {
    headers: getUploadHeaders(getAuthToken()),
    timeout: '30s',
  });
  const latency = new Date().getTime() - startTime;

  uploadMediumLatency.add(latency);
  p95LatencyMetric.add(latency);

  const passed = check(response, {
    'upload-medium status 200': (r) => r.status === 200,
    'upload-medium has valid response': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.success === true && 'data' in body;
      } catch {
        return false;
      }
    },
    'upload-medium latency < 5s': (r) => latency < 5000,
  });

  if (!passed) {
    trackError('upload');
  }

  return response.status === 200 ? parseResponse(response)?.data?.fileId : null;
}

/**
 * Test file upload with large file (5 MB)
 * POST /api/studio/files/upload
 */
function testUploadLarge() {
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/files/upload`;
  const fileData = generateBinaryData(testDataSizes.LARGE_IMAGE);

  const formData = {
    file: http.file(fileData, 'test-large.bin', 'application/octet-stream'),
    filename: `test-large-${Date.now()}.bin`,
    category: 'test',
  };

  const startTime = new Date().getTime();
  const response = http.post(url, formData, {
    headers: getUploadHeaders(getAuthToken()),
    timeout: '60s',
  });
  const latency = new Date().getTime() - startTime;

  uploadLargeLatency.add(latency);
  p95LatencyMetric.add(latency);

  const passed = check(response, {
    'upload-large status 200': (r) => r.status === 200,
    'upload-large has valid response': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.success === true && 'data' in body;
      } catch {
        return false;
      }
    },
    'upload-large latency < 10s': (r) => latency < 10000,
  });

  if (!passed) {
    trackError('upload');
  }

  return response.status === 200 ? parseResponse(response)?.data?.fileId : null;
}

/**
 * Test file upload with extra-large file (10 MB)
 * POST /api/studio/files/upload
 */
function testUploadXlarge() {
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/files/upload`;
  const fileData = generateBinaryData(testDataSizes.XLARGE_IMAGE);

  const formData = {
    file: http.file(fileData, 'test-xlarge.bin', 'application/octet-stream'),
    filename: `test-xlarge-${Date.now()}.bin`,
    category: 'test',
  };

  const startTime = new Date().getTime();
  const response = http.post(url, formData, {
    headers: getUploadHeaders(getAuthToken()),
    timeout: '120s',
  });
  const latency = new Date().getTime() - startTime;

  uploadXlargeLatency.add(latency);
  p95LatencyMetric.add(latency);

  const passed = check(response, {
    'upload-xlarge status 200': (r) => r.status === 200,
    'upload-xlarge has valid response': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.success === true && 'data' in body;
      } catch {
        return false;
      }
    },
    'upload-xlarge latency < 15s': (r) => latency < 15000,
  });

  if (!passed) {
    trackError('upload');
  }

  return response.status === 200 ? parseResponse(response)?.data?.fileId : null;
}

/**
 * Test file list endpoint with pagination under load
 * GET /api/studio/files/list
 */
function testListFiles() {
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/files/list`;

  const params = {
    page: Math.floor(Math.random() * 10) + 1,
    limit: 50,
  };

  const startTime = new Date().getTime();
  const response = http.get(`${url}?page=${params.page}&limit=${params.limit}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    timeout: '10s',
  });
  const latency = new Date().getTime() - startTime;

  listFilesLatency.add(latency);
  p95LatencyMetric.add(latency);

  const passed = check(response, {
    'list-files status 200': (r) => r.status === 200,
    'list-files has valid response': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.success === true && Array.isArray(body.data);
      } catch {
        return false;
      }
    },
    'list-files latency < 1s': (r) => latency < 1000,
  });

  if (!passed) {
    trackError('upload');
  }
}

/**
 * Test file retrieval endpoint
 * GET /api/studio/files/{fileId}
 */
function testRetrieveFile(fileId: string | null) {
  if (!fileId) {
    return; // Skip if no file ID available
  }

  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/files/${fileId}`;

  const startTime = new Date().getTime();
  const response = http.get(url, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    timeout: '10s',
  });
  const latency = new Date().getTime() - startTime;

  retrieveFileLatency.add(latency);
  p95LatencyMetric.add(latency);

  const passed = check(response, {
    'retrieve-file status 200': (r) => r.status === 200,
    'retrieve-file has valid response': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.success === true && 'data' in body;
      } catch {
        return false;
      }
    },
    'retrieve-file latency < 1s': (r) => latency < 1000,
  });

  if (!passed) {
    trackError('upload');
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
 * Mix upload sizes and test list/retrieve operations
 */
export default function () {
  const rand = Math.random();

  if (rand < 0.25) {
    // 25% small uploads
    testUploadSmall();
  } else if (rand < 0.50) {
    // 25% medium uploads
    testUploadMedium();
  } else if (rand < 0.70) {
    // 20% large uploads
    testUploadLarge();
  } else if (rand < 0.80) {
    // 10% xlarge uploads
    testUploadXlarge();
  } else if (rand < 0.90) {
    // 10% list files
    testListFiles();
  } else {
    // 10% retrieve file (requires previous upload)
    const fileId = `test-file-${Math.floor(Math.random() * 1000)}`;
    testRetrieveFile(fileId);
  }

  sleep(1 + Math.random() * 1); // 1-2s between requests
}
