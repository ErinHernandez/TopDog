/**
 * Paystack Webhook Handler
 * 
 * Processes Paystack webhook events for:
 * - charge.success: Successful payments (credits user balance)
 * - charge.failed: Failed payments (updates transaction to failed status)
 * - transfer.success: Successful withdrawals
 * - transfer.failed: Failed withdrawals (restores user balance)
 * - transfer.reversed: Reversed withdrawals (restores user balance)
 * 
 * POST /api/paystack/webhook
 * 
 * @module pages/api/paystack/webhook
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  verifyWebhookSignature,
  handleChargeSuccess,
  handleChargeFailed,
  handleTransferSuccess,
  handleTransferFailed,
} from '../../../lib/paystack';
import type {
  PaystackWebhookPayload,
  ChargeSuccessWebhookData,
  ChargeFailedWebhookData,
  TransferWebhookData,
} from '../../../lib/paystack/paystackTypes';
import { captureError } from '../../../lib/errorTracking';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Disable body parsing to get raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// ============================================================================
// TYPES
// ============================================================================

interface WebhookResponse {
  received: boolean;
  event?: string;
  actions?: string[];
  error?: string;
}

// ============================================================================
// RAW BODY PARSER
// ============================================================================

/**
 * Read raw body from request
 */
async function readRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(data);
    });
    req.on('error', reject);
  });
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WebhookResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      received: false,
      error: 'Only POST is allowed',
    });
  }
  
  try {
    // Read raw body
    const rawBody = await readRawBody(req);
    
    // Get signature from headers
    const signature = req.headers['x-paystack-signature'] as string;
    
    if (!signature) {
      console.warn('[Paystack Webhook] Missing signature header');
      return res.status(401).json({
        received: false,
        error: 'Missing signature',
      });
    }
    
    // Verify signature
    const isValid = verifyWebhookSignature(rawBody, signature);
    
    if (!isValid) {
      console.warn('[Paystack Webhook] Invalid signature');
      return res.status(401).json({
        received: false,
        error: 'Invalid signature',
      });
    }
    
    // Parse body
    const payload = JSON.parse(rawBody) as PaystackWebhookPayload;
    const { event, data } = payload;
    
    console.log(`[Paystack Webhook] Received event: ${event}`);
    
    // Handle events
    let result: { success: boolean; actions: string[] };
    
    switch (event) {
      case 'charge.success':
        result = await handleChargeSuccess(data as ChargeSuccessWebhookData);
        break;
        
      case 'charge.failed':
        result = await handleChargeFailed(data as ChargeFailedWebhookData);
        break;
        
      case 'transfer.success':
        result = await handleTransferSuccess(data as TransferWebhookData);
        break;
        
      case 'transfer.failed':
      case 'transfer.reversed':
        result = await handleTransferFailed(data as TransferWebhookData);
        break;
        
      default:
        // Log unhandled events
        console.log(`[Paystack Webhook] Unhandled event type: ${event}`);
        result = { success: true, actions: ['unhandled_event'] };
    }
    
    // Respond to Paystack
    return res.status(200).json({
      received: true,
      event,
      actions: result.actions,
    });
    
  } catch (error) {
    console.error('[Paystack Webhook] Error:', error);
    await captureError(error as Error, {
      tags: { component: 'paystack', operation: 'webhook' },
    });
    
    // Always return 200 to prevent Paystack from retrying
    // Log the error for manual investigation
    return res.status(200).json({
      received: true,
      error: 'Processing error - logged for investigation',
    });
  }
}

