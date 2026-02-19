/**
 * Marketplace, Checkout, Notifications Route Definitions
 * @module lib/api-docs/routes/commerce
 */
import type { RouteDefinition } from '../types';

export const commerceRoutes: RouteDefinition[] = [
  // Marketplace
  {
    operationId: 'getMarketplaceCatalog',
    method: 'GET',
    path: '/api/studio/marketplace/catalog',
    summary: 'Browse marketplace catalog',
    description: 'Browse the marketplace catalog of design assets, templates, and add-ons with filtering and pagination.',
    category: 'Marketplace',
    auth: 'optional',
    rateLimit: '200/min',
    parameters: [
      { name: 'category', in: 'query', required: false, description: 'Filter by category', type: 'string' },
      { name: 'sort', in: 'query', required: false, description: 'Sort order', type: 'string', enum: ['popular', 'newest', 'price_asc', 'price_desc'] },
      { name: 'limit', in: 'query', required: false, description: 'Max results', type: 'integer', default: 20 },
      { name: 'cursor', in: 'query', required: false, description: 'Pagination cursor', type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'Catalog items', example: '{"items":[],"nextCursor":"...","total":500}' },
    ],
  },
  {
    operationId: 'getMarketplaceData',
    method: 'GET',
    path: '/api/studio/marketplace/data/{productId}',
    summary: 'Export marketplace product data',
    description: 'Get detailed data for a specific marketplace product including metadata and download info.',
    category: 'Marketplace',
    auth: 'apiKey',
    rateLimit: '100/hour',
    parameters: [
      { name: 'productId', in: 'path', required: true, description: 'Product ID', type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'Product data', example: '{"productId":"prod_abc","name":"...","downloads":42}' },
      { statusCode: 404, description: 'Product not found' },
    ],
  },
  {
    operationId: 'getMarketplaceSample',
    method: 'GET',
    path: '/api/studio/marketplace/sample/{productId}',
    summary: 'Download product sample',
    description: 'Download a preview/sample of a marketplace product before purchasing.',
    category: 'Marketplace',
    auth: 'optional',
    rateLimit: '50/hour',
    parameters: [
      { name: 'productId', in: 'path', required: true, description: 'Product ID', type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'Sample file', contentType: 'application/octet-stream' },
      { statusCode: 404, description: 'Product not found' },
    ],
  },
  {
    operationId: 'getMarketplaceUsage',
    method: 'GET',
    path: '/api/studio/marketplace/usage',
    summary: 'Marketplace usage metrics',
    description: 'Get usage metrics and analytics for marketplace products.',
    category: 'Marketplace',
    auth: 'apiKey',
    rateLimit: '50/hour',
    parameters: [
      { name: 'period', in: 'query', required: false, description: 'Time period', type: 'string', enum: ['7d', '30d', '90d'], default: '30d' },
    ],
    responses: [
      { statusCode: 200, description: 'Usage data', example: '{"totalDownloads":1234,"uniqueUsers":567,"revenue":{"amount":9999,"currency":"USD"}}' },
    ],
  },
  // Checkout
  {
    operationId: 'createCheckoutSession',
    method: 'POST',
    path: '/api/studio/checkout/create-session',
    summary: 'Create Stripe checkout session',
    description: 'Create a Stripe Checkout session for purchasing marketplace items or subscriptions.',
    category: 'Checkout',
    auth: 'bearer',
    rateLimit: '20/hour',
    parameters: [
      { name: 'items', in: 'body', required: true, description: 'Items to purchase', type: 'array' },
      { name: 'successUrl', in: 'body', required: false, description: 'Redirect URL on success', type: 'string' },
      { name: 'cancelUrl', in: 'body', required: false, description: 'Redirect URL on cancel', type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'Checkout session created', example: '{"sessionId":"cs_abc","url":"https://checkout.stripe.com/..."}' },
    ],
  },
  {
    operationId: 'getCustomerPortal',
    method: 'POST',
    path: '/api/studio/checkout/portal',
    summary: 'Stripe customer portal',
    description: 'Create a Stripe Customer Portal session for managing subscriptions and billing.',
    category: 'Checkout',
    auth: 'bearer',
    rateLimit: '10/hour',
    parameters: [
      { name: 'returnUrl', in: 'body', required: false, description: 'Return URL after portal', type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'Portal session', example: '{"url":"https://billing.stripe.com/..."}' },
    ],
  },
  {
    operationId: 'getSubscriptionStatus',
    method: 'GET',
    path: '/api/studio/subscription/status',
    summary: 'Check subscription status',
    description: 'Get the current user\'s subscription status, plan details, and usage limits.',
    category: 'Checkout',
    auth: 'bearer',
    rateLimit: '200/min',
    parameters: [],
    responses: [
      { statusCode: 200, description: 'Subscription status', example: '{"plan":"free","status":"active","limits":{"generations":50,"storage":"1GB"}}' },
    ],
  },
  // Notifications
  {
    operationId: 'listNotifications',
    method: 'GET',
    path: '/api/studio/notifications/list',
    summary: 'List notifications',
    description: 'List user notifications with pagination and optional unread-only filter.',
    category: 'Notifications',
    auth: 'bearer',
    rateLimit: '200/min',
    parameters: [
      { name: 'limit', in: 'query', required: false, description: 'Max results', type: 'integer', default: 20 },
      { name: 'cursor', in: 'query', required: false, description: 'Pagination cursor', type: 'string' },
      { name: 'unreadOnly', in: 'query', required: false, description: 'Only return unread notifications', type: 'boolean', default: false },
    ],
    responses: [
      { statusCode: 200, description: 'Notification list', example: '{"notifications":[],"unreadCount":3,"nextCursor":"..."}' },
    ],
  },
  {
    operationId: 'markNotificationsRead',
    method: 'POST',
    path: '/api/studio/notifications/mark-read',
    summary: 'Mark notifications as read',
    description: 'Mark one or more notifications as read. Pass specific IDs or mark all as read.',
    category: 'Notifications',
    auth: 'bearer',
    rateLimit: '100/hour',
    parameters: [
      { name: 'notificationIds', in: 'body', required: false, description: 'Specific notification IDs (omit for all)', type: 'array' },
    ],
    responses: [
      { statusCode: 200, description: 'Marked as read', example: '{"updated":3}' },
    ],
  },
  {
    operationId: 'getNotificationPreferences',
    method: 'GET',
    path: '/api/studio/notifications/preferences',
    summary: 'Get notification preferences',
    description: 'Get user notification preferences (email, push, in-app settings per category).',
    category: 'Notifications',
    auth: 'bearer',
    rateLimit: '200/min',
    parameters: [],
    responses: [
      { statusCode: 200, description: 'Preferences', example: '{"email":{"likes":true,"follows":true},"push":{"likes":false}}' },
    ],
  },
  {
    operationId: 'updateNotificationPreferences',
    method: 'PUT',
    path: '/api/studio/notifications/preferences',
    summary: 'Update notification preferences',
    description: 'Update user notification preferences.',
    category: 'Notifications',
    auth: 'bearer',
    rateLimit: '20/hour',
    parameters: [
      { name: 'preferences', in: 'body', required: true, description: 'Updated preferences', type: 'object' },
    ],
    responses: [
      { statusCode: 200, description: 'Updated', example: '{"updated":true}' },
    ],
  },
];
