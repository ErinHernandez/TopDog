/**
 * PayMongo Webhook Handler
 * 
 * Processes webhook events from PayMongo:
 * - source.chargeable: Source ready to be charged
 * - payment.paid: Payment successful
 * - payment.failed: Payment failed
 * - payout.paid: Payout successful
 * - payout.failed: Payout failed
 * 
 * POST /api/paymongo/webhook
 * 
 * @module pages/api/paymongo/webhook
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import {
  verifyWebhookSignature,
  handleSourceChargeable,
  handlePaymentPaid,
  handlePaymentFailed,
  handlePayoutPaid,
  handlePayoutFailed,
} from '../../../lib/paymongo';
import type { 
  PayMongoWebhookPayload, 
  PayMongoSourceAttributes,
  PayMongoPaymentAttributes,
  PayMongoPayoutAttributes,
} from '../../../lib/paymongo/paymongoTypes';
import { captureError } from '../../../lib/errorTracking';

// ============================================================================
// CONFIG
// ============================================================================

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    // Get raw body for signature verification
    const rawBody = await buffer(req);
    const signature = req.headers['paymongo-signature'] as string;
    
    if (!signature) {
      console.warn('[PayMongo Webhook] Missing signature');
      res.status(400).json({ error: 'Missing signature' });
      return;
    }
    
    // Verify signature
    const isValid = verifyWebhookSignature(rawBody, signature);
    
    if (!isValid) {
      console.warn('[PayMongo Webhook] Invalid signature');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }
    
    // Parse payload
    const payload: PayMongoWebhookPayload = JSON.parse(rawBody.toString());
    const eventType = payload.data.attributes.type;
    const eventData = payload.data.attributes.data;
    
    console.log(`[PayMongo Webhook] Processing ${eventType}`, { 
      eventId: payload.data.id,
      dataId: eventData.id,
    });
    
    let result: { success: boolean; actions: string[] };
    
    // Route to appropriate handler
    switch (eventType) {
      case 'source.chargeable':
        result = await handleSourceChargeable({
          id: eventData.id,
          ...(eventData.attributes as PayMongoSourceAttributes),
        });
        break;
        
      case 'payment.paid':
        result = await handlePaymentPaid({
          id: eventData.id,
          ...(eventData.attributes as PayMongoPaymentAttributes),
        });
        break;
        
      case 'payment.failed':
        result = await handlePaymentFailed({
          id: eventData.id,
          ...(eventData.attributes as PayMongoPaymentAttributes),
        });
        break;
        
      case 'payout.paid':
        result = await handlePayoutPaid({
          id: eventData.id,
          ...(eventData.attributes as PayMongoPayoutAttributes),
        });
        break;
        
      case 'payout.failed':
        result = await handlePayoutFailed({
          id: eventData.id,
          ...(eventData.attributes as PayMongoPayoutAttributes),
        });
        break;
        
      case 'source.expired':
      case 'source.failed':
      case 'source.cancelled':
        // Handle source expiration/failure
        console.log(`[PayMongo Webhook] Source ${eventType}`, { dataId: eventData.id });
        result = { success: true, actions: ['source_terminated'] };
        break;
        
      default:
        console.log(`[PayMongo Webhook] Unhandled event type: ${eventType}`);
        result = { success: true, actions: ['unhandled_event'] };
    }
    
    console.log(`[PayMongo Webhook] ${eventType} processed`, { 
      success: result.success, 
      actions: result.actions,
    });
    
    res.status(200).json({ received: true, ...result });
    
  } catch (error) {
    await captureError(error instanceof Error ? error : new Error('Unknown error'), {
      tags: { component: 'paymongo', operation: 'webhook' },
    });
    
    console.error('[PayMongo Webhook] Error:', error);
    
    // Return 200 to prevent PayMongo from retrying
    // We log the error for investigation
    res.status(200).json({ 
      received: true, 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}


