/**
 * Admin Route Definitions
 * @module lib/api-docs/routes/admin
 */
import type { RouteDefinition } from '../types';

const adminBase = {
  auth: 'admin' as const,
  rateLimit: '100/min',
};

export const adminRoutes: RouteDefinition[] = [
  // Core Admin
  {
    ...adminBase,
    operationId: 'getAdminAnalytics',
    method: 'GET',
    path: '/api/studio/admin/analytics',
    summary: 'Platform analytics',
    description: 'Get platform-wide analytics including user counts, generation stats, and revenue data.',
    category: 'Admin',
    parameters: [
      { name: 'period', in: 'query', required: false, description: 'Time period', type: 'string', enum: ['7d', '30d', '90d'], default: '30d' },
    ],
    responses: [
      { statusCode: 200, description: 'Analytics data', example: '{"users":{"total":5000,"active":1200},"generations":{"total":50000},"revenue":{}}' },
    ],
  },
  {
    ...adminBase,
    operationId: 'getAccessLogs',
    method: 'GET',
    path: '/api/studio/admin/access-logs',
    summary: 'API access logs',
    description: 'Query API access logs with filtering by endpoint, user, status code, and time range.',
    category: 'Admin',
    parameters: [
      { name: 'endpoint', in: 'query', required: false, description: 'Filter by endpoint path', type: 'string' },
      { name: 'userId', in: 'query', required: false, description: 'Filter by user ID', type: 'string' },
      { name: 'statusCode', in: 'query', required: false, description: 'Filter by status code', type: 'integer' },
      { name: 'limit', in: 'query', required: false, description: 'Max results', type: 'integer', default: 50 },
      { name: 'offset', in: 'query', required: false, description: 'Pagination offset', type: 'integer', default: 0 },
    ],
    responses: [
      { statusCode: 200, description: 'Access logs', example: '{"logs":[],"total":5000}' },
    ],
  },
  {
    ...adminBase,
    operationId: 'manageFeatureFlags',
    method: 'GET',
    path: '/api/studio/admin/features',
    summary: 'List feature flags',
    description: 'List all feature flags with their current status and configuration.',
    category: 'Admin',
    parameters: [],
    responses: [
      { statusCode: 200, description: 'Feature flags', example: '{"flags":[{"key":"newEditor","enabled":true,"rollout":100}]}' },
    ],
  },
  {
    ...adminBase,
    operationId: 'updateFeatureFlag',
    method: 'PUT',
    path: '/api/studio/admin/features',
    summary: 'Update feature flag',
    description: 'Update a feature flag\'s enabled state, rollout percentage, or targeting rules.',
    category: 'Admin',
    parameters: [
      { name: 'key', in: 'body', required: true, description: 'Feature flag key', type: 'string' },
      { name: 'enabled', in: 'body', required: false, description: 'Enable/disable flag', type: 'boolean' },
      { name: 'rollout', in: 'body', required: false, description: 'Rollout percentage (0-100)', type: 'integer' },
    ],
    responses: [
      { statusCode: 200, description: 'Flag updated', example: '{"key":"newEditor","enabled":true,"rollout":50}' },
    ],
  },
  {
    ...adminBase,
    operationId: 'getAdminRevenue',
    method: 'GET',
    path: '/api/studio/admin/revenue',
    summary: 'Revenue reporting',
    description: 'Get revenue reports with breakdowns by product, period, and payment method.',
    category: 'Admin',
    parameters: [
      { name: 'period', in: 'query', required: false, description: 'Time period', type: 'string', default: '30d' },
      { name: 'groupBy', in: 'query', required: false, description: 'Group by dimension', type: 'string', enum: ['day', 'week', 'month', 'product'] },
    ],
    responses: [
      { statusCode: 200, description: 'Revenue data', example: '{"total":{"amount":99999,"currency":"USD"},"breakdown":[]}' },
    ],
  },
  {
    ...adminBase,
    operationId: 'getSubscriptionOverview',
    method: 'GET',
    path: '/api/studio/admin/subscriptions/overview',
    summary: 'Subscription overview',
    description: 'Get overview of all subscriptions including counts by plan, churn rate, and MRR.',
    category: 'Admin',
    parameters: [],
    responses: [
      { statusCode: 200, description: 'Subscription overview', example: '{"totalActive":3000,"mrr":15000,"churnRate":0.02,"byPlan":{}}' },
    ],
  },
  {
    ...adminBase,
    operationId: 'getEnvStatus',
    method: 'GET',
    path: '/api/studio/admin/env-status',
    summary: 'Environment status',
    description: 'Get current environment configuration status and validation results.',
    category: 'Admin',
    parameters: [],
    responses: [
      { statusCode: 200, description: 'Environment status', example: '{"env":"production","valid":true,"warnings":[]}' },
    ],
  },
  // Admin Audit
  {
    ...adminBase,
    operationId: 'listAuditLogs',
    method: 'GET',
    path: '/api/studio/admin/audit/list',
    summary: 'Query audit logs',
    description: 'Query the admin audit log with filtering by category, severity, actor, time range, and success status.',
    category: 'Admin Audit',
    parameters: [
      { name: 'category', in: 'query', required: false, description: 'Filter by category', type: 'string', enum: ['admin', 'auth', 'content', 'security', 'system', 'user', 'integration'] },
      { name: 'severity', in: 'query', required: false, description: 'Filter by severity', type: 'string', enum: ['low', 'medium', 'high'] },
      { name: 'actorId', in: 'query', required: false, description: 'Filter by actor user ID', type: 'string' },
      { name: 'startTime', in: 'query', required: false, description: 'Start of time range (epoch ms or ISO)', type: 'string' },
      { name: 'endTime', in: 'query', required: false, description: 'End of time range (epoch ms or ISO)', type: 'string' },
      { name: 'success', in: 'query', required: false, description: 'Filter by success/failure', type: 'boolean' },
      { name: 'limit', in: 'query', required: false, description: 'Max results (max 200)', type: 'integer', default: 50 },
      { name: 'startAfter', in: 'query', required: false, description: 'Cursor for pagination', type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'Audit log entries', example: '{"entries":[],"total":1500,"hasMore":true}' },
    ],
  },
  {
    ...adminBase,
    operationId: 'getAuditSummary',
    method: 'GET',
    path: '/api/studio/admin/audit/summary',
    summary: 'Audit log summary',
    description: 'Get aggregate statistics for audit logs over a time period. Defaults to last 24 hours.',
    category: 'Admin Audit',
    parameters: [
      { name: 'startTime', in: 'query', required: false, description: 'Start of time range', type: 'string' },
      { name: 'endTime', in: 'query', required: false, description: 'End of time range', type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'Summary statistics', example: '{"total":450,"byCategory":{"admin":100,"auth":200},"bySeverity":{"low":300},"failedCount":5}' },
    ],
  },
  {
    ...adminBase,
    operationId: 'exportAuditLogs',
    method: 'GET',
    path: '/api/studio/admin/audit/export',
    summary: 'Export audit logs as CSV',
    description: 'Export filtered audit logs as a downloadable CSV file. Same filters as list endpoint, limit defaults to 1000 (max 5000).',
    category: 'Admin Audit',
    parameters: [
      { name: 'category', in: 'query', required: false, description: 'Filter by category', type: 'string' },
      { name: 'severity', in: 'query', required: false, description: 'Filter by severity', type: 'string' },
      { name: 'startTime', in: 'query', required: false, description: 'Start time', type: 'string' },
      { name: 'endTime', in: 'query', required: false, description: 'End time', type: 'string' },
      { name: 'limit', in: 'query', required: false, description: 'Max rows (max 5000)', type: 'integer', default: 1000 },
    ],
    responses: [
      { statusCode: 200, description: 'CSV file download', contentType: 'text/csv', headers: { 'Content-Disposition': { description: 'Attachment filename', type: 'string', example: 'attachment; filename="audit-export.csv"' } } },
    ],
  },
  // Admin Buyers
  {
    ...adminBase,
    operationId: 'listBuyers',
    method: 'GET',
    path: '/api/studio/admin/buyers',
    summary: 'List marketplace buyers',
    description: 'List all marketplace buyers with search and pagination.',
    category: 'Admin Buyers',
    parameters: [
      { name: 'search', in: 'query', required: false, description: 'Search by name or email', type: 'string' },
      { name: 'limit', in: 'query', required: false, description: 'Max results', type: 'integer', default: 20 },
      { name: 'offset', in: 'query', required: false, description: 'Pagination offset', type: 'integer', default: 0 },
    ],
    responses: [
      { statusCode: 200, description: 'Buyer list', example: '{"buyers":[],"total":150}' },
    ],
  },
  {
    ...adminBase,
    operationId: 'getBuyer',
    method: 'GET',
    path: '/api/studio/admin/buyers/{buyerId}',
    summary: 'Get buyer details',
    description: 'Get detailed information about a specific marketplace buyer.',
    category: 'Admin Buyers',
    parameters: [
      { name: 'buyerId', in: 'path', required: true, description: 'Buyer ID', type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'Buyer details', example: '{"buyerId":"buy_abc","name":"...","purchases":[]}' },
      { statusCode: 404, description: 'Buyer not found' },
    ],
  },
  {
    ...adminBase,
    operationId: 'manageBuyerApiKey',
    method: 'POST',
    path: '/api/studio/admin/buyers/{buyerId}/api-key',
    summary: 'Manage buyer API key',
    description: 'Generate, rotate, or revoke a buyer\'s API key for marketplace access.',
    category: 'Admin Buyers',
    parameters: [
      { name: 'buyerId', in: 'path', required: true, description: 'Buyer ID', type: 'string' },
      { name: 'action', in: 'body', required: true, description: 'Key action', type: 'string', enum: ['generate', 'rotate', 'revoke'] },
    ],
    responses: [
      { statusCode: 200, description: 'API key action result', example: '{"apiKey":"ik_live_...","action":"generate","expiresAt":"..."}' },
    ],
  },
  // Admin Products
  {
    ...adminBase,
    operationId: 'listAdminProducts',
    method: 'GET',
    path: '/api/studio/admin/products',
    summary: 'List marketplace products',
    description: 'List all marketplace products with status and sales data.',
    category: 'Admin Products',
    parameters: [
      { name: 'status', in: 'query', required: false, description: 'Filter by status', type: 'string', enum: ['active', 'draft', 'archived'] },
      { name: 'limit', in: 'query', required: false, description: 'Max results', type: 'integer', default: 20 },
    ],
    responses: [
      { statusCode: 200, description: 'Product list', example: '{"products":[],"total":50}' },
    ],
  },
  {
    ...adminBase,
    operationId: 'listProductReleases',
    method: 'GET',
    path: '/api/studio/admin/products/{productId}/releases',
    summary: 'List product releases',
    description: 'List version releases for a specific marketplace product.',
    category: 'Admin Products',
    parameters: [
      { name: 'productId', in: 'path', required: true, description: 'Product ID', type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'Release list', example: '{"releases":[{"version":"1.2.0","releasedAt":"..."}]}' },
    ],
  },
  // Admin Observability
  {
    ...adminBase,
    operationId: 'getObservabilityAlerts',
    method: 'GET',
    path: '/api/studio/admin/observability/alerts',
    summary: 'List alert configurations',
    description: 'List all configured observability alerts with their current status.',
    category: 'Admin Observability',
    parameters: [],
    responses: [
      { statusCode: 200, description: 'Alert configs', example: '{"alerts":[{"id":"alt_1","name":"High Error Rate","status":"active"}]}' },
    ],
  },
  {
    ...adminBase,
    operationId: 'getObservabilityIncidents',
    method: 'GET',
    path: '/api/studio/admin/observability/incidents',
    summary: 'List incidents',
    description: 'List recent incidents and their resolution status.',
    category: 'Admin Observability',
    parameters: [
      { name: 'status', in: 'query', required: false, description: 'Filter by status', type: 'string', enum: ['open', 'investigating', 'resolved'] },
      { name: 'limit', in: 'query', required: false, description: 'Max results', type: 'integer', default: 20 },
    ],
    responses: [
      { statusCode: 200, description: 'Incident list', example: '{"incidents":[],"total":5}' },
    ],
  },
  {
    ...adminBase,
    operationId: 'getObservabilityMetrics',
    method: 'GET',
    path: '/api/studio/admin/observability/metrics',
    summary: 'Get platform metrics',
    description: 'Get real-time platform metrics including latency, error rates, and throughput.',
    category: 'Admin Observability',
    parameters: [
      { name: 'metric', in: 'query', required: false, description: 'Specific metric', type: 'string', enum: ['latency', 'errors', 'throughput', 'all'], default: 'all' },
      { name: 'period', in: 'query', required: false, description: 'Time period', type: 'string', default: '1h' },
    ],
    responses: [
      { statusCode: 200, description: 'Metrics data', example: '{"latency":{"p50":45,"p99":200},"errorRate":0.001,"throughput":500}' },
    ],
  },
];
