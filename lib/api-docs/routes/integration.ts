/**
 * Integration, Webhooks, SMS, Versioning Route Definitions
 * @module lib/api-docs/routes/integration
 */
import type { RouteDefinition } from '../types';

export const integrationRoutes: RouteDefinition[] = [
  // Integration
  {
    operationId: 'designAnalysis',
    method: 'POST',
    path: '/api/studio/integration/design-analysis',
    summary: 'Design accessibility analysis',
    description: 'Analyze a design for accessibility compliance (contrast ratios, color blindness simulation, text readability).',
    category: 'Integration',
    auth: 'bearer',
    rateLimit: '50/hour',
    parameters: [
      { name: 'projectId', in: 'body', required: true, description: 'Project to analyze', type: 'string' },
      { name: 'checks', in: 'body', required: false, description: 'Specific checks to run', type: 'array' },
    ],
    responses: [
      { statusCode: 200, description: 'Analysis results', example: '{"score":85,"issues":[{"type":"contrast","severity":"warning"}]}' },
    ],
  },
  {
    operationId: 'sandboxTransfer',
    method: 'POST',
    path: '/api/studio/integration/sandbox-transfer',
    summary: 'Transfer to sandbox',
    description: 'Transfer project data to a sandbox environment for testing or preview.',
    category: 'Integration',
    auth: 'bearer',
    rateLimit: '20/hour',
    parameters: [
      { name: 'projectId', in: 'body', required: true, description: 'Project to transfer', type: 'string' },
      { name: 'environment', in: 'body', required: false, description: 'Target sandbox', type: 'string', default: 'preview' },
    ],
    responses: [
      { statusCode: 200, description: 'Transfer complete', example: '{"sandboxUrl":"https://sandbox.idesaign.ai/preview/..."}' },
    ],
  },
  {
    operationId: 'telemetryBridge',
    method: 'POST',
    path: '/api/studio/integration/telemetry-bridge',
    summary: 'Telemetry bridge',
    description: 'Bridge telemetry data from external services for unified monitoring.',
    category: 'Integration',
    auth: 'bearer',
    rateLimit: '1000/hour',
    parameters: [
      { name: 'service', in: 'body', required: true, description: 'External service name', type: 'string' },
      { name: 'data', in: 'body', required: true, description: 'Telemetry data payload', type: 'object' },
    ],
    responses: [
      { statusCode: 201, description: 'Data recorded', example: '{"recorded":true}' },
    ],
  },
  // Webhooks
  {
    operationId: 'stripeWebhook',
    method: 'POST',
    path: '/api/studio/webhooks/stripe',
    summary: 'Stripe webhook handler',
    description: 'Receives and processes Stripe payment webhook events (checkout.session.completed, invoice.paid, etc.). Verified via Stripe signature.',
    category: 'Webhooks',
    auth: 'webhook',
    rateLimit: 'Unlimited',
    parameters: [],
    responses: [
      { statusCode: 200, description: 'Event processed', example: '{"received":true}' },
      { statusCode: 400, description: 'Invalid signature' },
    ],
  },
  // SMS
  {
    operationId: 'sendSms',
    method: 'POST',
    path: '/api/cowork/sms/send',
    summary: 'Send SMS',
    description: 'Send an SMS message via Twilio.',
    category: 'SMS',
    auth: 'bearer',
    rateLimit: '100/hour',
    parameters: [
      { name: 'to', in: 'body', required: true, description: 'Recipient phone number (E.164 format)', type: 'string' },
      { name: 'message', in: 'body', required: true, description: 'Message text (max 1600 chars)', type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'SMS sent', example: '{"messageId":"msg_abc","status":"sent"}' },
    ],
  },
  {
    operationId: 'smsInbound',
    method: 'POST',
    path: '/api/cowork/sms/inbound',
    summary: 'Receive inbound SMS',
    description: 'Webhook endpoint for receiving inbound SMS messages from Twilio.',
    category: 'SMS',
    auth: 'webhook',
    rateLimit: 'Unlimited',
    parameters: [],
    responses: [
      { statusCode: 200, description: 'Message received', example: '<?xml version="1.0"?><Response></Response>', contentType: 'text/xml' },
    ],
  },
  {
    operationId: 'smsProcess',
    method: 'POST',
    path: '/api/cowork/sms/process',
    summary: 'Process SMS command',
    description: 'Process an SMS command and generate a response.',
    category: 'SMS',
    auth: 'bearer',
    rateLimit: '100/hour',
    parameters: [
      { name: 'messageId', in: 'body', required: true, description: 'Inbound message ID', type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'Command processed', example: '{"response":"Your project has 12 layers.","action":"info"}' },
    ],
  },
  {
    operationId: 'smsStatus',
    method: 'GET',
    path: '/api/cowork/sms/status',
    summary: 'Check SMS status',
    description: 'Check delivery status of a sent SMS message.',
    category: 'SMS',
    auth: 'bearer',
    rateLimit: '200/min',
    parameters: [
      { name: 'messageId', in: 'query', required: true, description: 'Message ID', type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'Message status', example: '{"messageId":"msg_abc","status":"delivered","deliveredAt":"..."}' },
    ],
  },
  {
    operationId: 'smsReply',
    method: 'POST',
    path: '/api/cowork/sms/reply',
    summary: 'Reply to SMS',
    description: 'Send a reply to an inbound SMS conversation.',
    category: 'SMS',
    auth: 'bearer',
    rateLimit: '100/hour',
    parameters: [
      { name: 'messageId', in: 'body', required: true, description: 'Original message ID to reply to', type: 'string' },
      { name: 'message', in: 'body', required: true, description: 'Reply text', type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'Reply sent', example: '{"replyId":"rpl_xyz","status":"sent"}' },
    ],
  },
  // Versioning
  {
    operationId: 'getApiVersion',
    method: 'GET',
    path: '/api/v1/version',
    summary: 'API version info',
    description: 'Get current API version, supported versions, and deprecation status.',
    category: 'Versioning',
    auth: 'none',
    rateLimit: 'Unlimited',
    parameters: [],
    responses: [
      { statusCode: 200, description: 'Version info', example: '{"current":"v1","supported":["v1"],"deprecated":[]}' },
    ],
  },
];
