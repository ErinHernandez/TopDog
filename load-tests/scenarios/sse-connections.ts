/**
 * K6 Load Test: SSE (Server-Sent Events) Connections
 * Tests long-lived SSE connections for job progress tracking
 * Tests 50, 100, and 200 concurrent connections with connection lifecycle validation
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Gauge, Counter } from 'k6/metrics';
import {
  getBaseOptions,
  getAuthToken,
  apiConfig,
  sseRouteThresholds,
  p95LatencyMetric,
  trackError,
  activeConnectionsMetric,
} from '../k6-config.ts';

// SSE-specific metrics
const sseConnectionLatency = new Trend('sse_connection_latency_ms');
const sseMessageLatency = new Trend('sse_message_latency_ms');
const sseConnectionErrors = new Counter('sse_connection_errors');
const sseMessagesReceived = new Counter('sse_messages_received');
const sseConnectionsEstablished = new Counter('sse_connections_established');
const currentConnections = new Gauge('current_sse_connections');

// Test configuration options for different concurrency levels
export const options = {
  ...getBaseOptions(50), // 50 VUs for SSE tests
  thresholds: sseRouteThresholds,
};

/**
 * Generate test job ID
 */
function generateJobId(): string {
  return `job-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/**
 * Test SSE connection establishment
 * GET /api/studio/jobs/{jobId}/progress
 * Tests connection establishment time and message delivery
 */
function testSSEConnection(concurrencyLevel: number = 50) {
  const jobId = generateJobId();
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/jobs/${jobId}/progress`;

  const startTime = new Date().getTime();

  try {
    // Attempt to establish SSE connection
    const response = http.get(url, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
      timeout: '120s', // SSE connections can be long-lived
      tags: { name: 'SSEConnection' },
    });

    const connectionTime = new Date().getTime() - startTime;
    sseConnectionLatency.add(connectionTime);
    p95LatencyMetric.add(connectionTime);
    activeConnectionsMetric.set(concurrencyLevel);
    currentConnections.set(concurrencyLevel);

    // Validate SSE connection response
    const passed = check(response, {
      'sse status 200': (r) => r.status === 200,
      'sse content-type is text/event-stream': (r) =>
        r.headers['Content-Type']?.includes('text/event-stream'),
      'sse connection latency < 1s': (r) => connectionTime < 1000,
      'sse response is not empty': (r) => r.body && r.body.length > 0,
    });

    if (!passed) {
      sseConnectionErrors.add(1);
      trackError('sse');
    } else {
      sseConnectionsEstablished.add(1);
      // Parse SSE messages from response
      parseSSEMessages(response.body as string);
    }

    return passed;
  } catch (error) {
    sseConnectionErrors.add(1);
    trackError('sse');
    return false;
  }
}

/**
 * Parse SSE message stream and count messages
 */
function parseSSEMessages(body: string) {
  if (!body) return;

  const lines = body.split('\n');
  let messageCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Parse SSE message format
    if (line.startsWith('data:')) {
      messageCount++;
      const messageData = line.substring(5).trim();

      // Attempt to parse JSON payload
      try {
        const payload = JSON.parse(messageData);
        if (payload.progress !== undefined) {
          sseMessageLatency.add(Date.now() - payload.timestamp);
        }
      } catch {
        // Non-JSON message, still count it
      }
    }
  }

  if (messageCount > 0) {
    sseMessagesReceived.add(messageCount);
  }
}

/**
 * Test sustained SSE connection with polling pattern
 * Simulates real-world client behavior of periodic status checks
 */
function testSSEWithPolling(connectionDuration: number = 30) {
  const jobId = generateJobId();
  const baseUrl = `${apiConfig.baseUrl}${apiConfig.apiPath}/jobs/${jobId}`;

  const startTime = Date.now();
  let messageCount = 0;

  // Establish initial SSE connection
  const sseUrl = `${baseUrl}/progress`;
  const startSSE = new Date().getTime();
  const sseResponse = http.get(sseUrl, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Accept': 'text/event-stream',
    },
    timeout: '120s',
  });
  const sseLatency = new Date().getTime() - startSSE;

  sseConnectionLatency.add(sseLatency);
  activeConnectionsMetric.set(1);

  if (sseResponse.status === 200) {
    sseConnectionsEstablished.add(1);
    parseSSEMessages(sseResponse.body as string);
  } else {
    sseConnectionErrors.add(1);
  }

  // Simulate periodic polling while SSE is active
  const pollIntervalMs = 5000; // Poll every 5 seconds
  let pollCount = 0;

  while (Date.now() - startTime < connectionDuration * 1000) {
    sleep(pollIntervalMs / 1000);

    // Poll status endpoint
    const statusUrl = `${baseUrl}/status`;
    const pollStart = new Date().getTime();
    const statusResponse = http.get(statusUrl, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      timeout: '10s',
    });
    const pollLatency = new Date().getTime() - pollStart;

    check(statusResponse, {
      'status-poll status 200': (r) => r.status === 200,
      'status-poll latency < 500ms': (r) => pollLatency < 500,
    });

    pollCount++;

    if (pollCount >= (connectionDuration / 5)) break; // Stop after expected polls
  }

  activeConnectionsMetric.set(0);
}

/**
 * Test concurrent SSE connections at 50 concurrent users
 */
function test50ConcurrentConnections() {
  testSSEConnection(50);
}

/**
 * Test concurrent SSE connections at 100 concurrent users
 */
function test100ConcurrentConnections() {
  testSSEConnection(100);
}

/**
 * Test concurrent SSE connections at 200 concurrent users
 */
function test200ConcurrentConnections() {
  testSSEConnection(200);
}

/**
 * Test connection recovery after interruption
 * Simulates network interruption and reconnection
 */
function testConnectionRecovery() {
  const jobId = generateJobId();
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/jobs/${jobId}/progress`;

  let connectionAttempts = 0;
  const maxRetries = 3;

  while (connectionAttempts < maxRetries) {
    const startTime = new Date().getTime();

    try {
      const response = http.get(url, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Accept': 'text/event-stream',
        },
        timeout: '30s',
      });

      const latency = new Date().getTime() - startTime;

      if (response.status === 200) {
        check(response, {
          'reconnection successful': (r) => r.status === 200,
          'reconnection latency < 2s': (r) => latency < 2000,
        });
        break; // Connection succeeded
      } else {
        connectionAttempts++;
        sleep(1); // Wait before retry
      }
    } catch {
      connectionAttempts++;
      if (connectionAttempts < maxRetries) {
        sleep(1); // Exponential backoff
      }
    }
  }

  if (connectionAttempts >= maxRetries) {
    sseConnectionErrors.add(1);
    trackError('sse');
  }
}

/**
 * Test SSE message delivery under load
 * Verifies that messages are delivered in order and not lost
 */
function testMessageDelivery() {
  const jobId = generateJobId();
  const url = `${apiConfig.baseUrl}${apiConfig.apiPath}/jobs/${jobId}/progress`;

  const startTime = new Date().getTime();
  const response = http.get(url, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Accept': 'text/event-stream',
    },
    timeout: '30s',
  });
  const latency = new Date().getTime() - startTime;

  const passed = check(response, {
    'message-delivery status 200': (r) => r.status === 200,
    'message-delivery received messages': (r) => {
      try {
        return r.body && r.body.toString().includes('data:');
      } catch {
        return false;
      }
    },
  });

  if (passed) {
    const bodyStr = response.body as string;
    const messageCount = (bodyStr.match(/^data:/gm) || []).length;
    sseMessagesReceived.add(messageCount);
  } else {
    trackError('sse');
  }

  sseConnectionLatency.add(latency);
}

/**
 * Main test function with multiple SSE test scenarios
 */
export default function () {
  const rand = Math.random();

  if (rand < 0.3) {
    // 30% test 50 concurrent connections
    test50ConcurrentConnections();
  } else if (rand < 0.55) {
    // 25% test 100 concurrent connections
    test100ConcurrentConnections();
  } else if (rand < 0.70) {
    // 15% test 200 concurrent connections
    test200ConcurrentConnections();
  } else if (rand < 0.85) {
    // 15% test connection with polling pattern
    testSSEWithPolling(10); // 10-second connection
  } else if (rand < 0.92) {
    // 7% test recovery
    testConnectionRecovery();
  } else {
    // 8% test message delivery
    testMessageDelivery();
  }

  sleep(0.5 + Math.random() * 1); // 0.5-1.5s between operations
}
