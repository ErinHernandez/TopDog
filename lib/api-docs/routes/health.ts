/**
 * Health Route Definitions
 * @module lib/api-docs/routes/health
 */
import type { RouteDefinition } from '../types';

export const healthRoutes: RouteDefinition[] = [
  {
    operationId: 'getHealth',
    method: 'GET',
    path: '/api/health',
    summary: 'Basic health check',
    description: 'Returns basic service health status. No authentication required.',
    category: 'Health',
    auth: 'none',
    rateLimit: 'Unlimited',
    parameters: [],
    responses: [
      {
        statusCode: 200,
        description: 'Service is healthy',
        example: '{"status":"ok","timestamp":"2026-02-12T12:00:00Z"}',
      },
    ],
  },
  {
    operationId: 'getHealthDeep',
    method: 'GET',
    path: '/api/health/deep',
    summary: 'Deep health check with dependencies',
    description:
      'Checks API and all critical dependencies (database, cache, external services). Returns degraded status if any dependency fails.',
    category: 'Health',
    auth: 'none',
    rateLimit: 'Unlimited',
    parameters: [],
    responses: [
      {
        statusCode: 200,
        description: 'All services healthy',
        example: '{"status":"ok","database":"ok","cache":"ok","timestamp":"2026-02-12T12:00:00Z"}',
      },
      {
        statusCode: 503,
        description: 'One or more dependencies unhealthy',
        example: '{"status":"degraded","database":"ok","cache":"error"}',
      },
    ],
  },
];
