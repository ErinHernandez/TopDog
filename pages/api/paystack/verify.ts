/**
 * Paystack Transaction Verification API
 * 
 * Verifies a Paystack transaction and updates records.
 * Called after user returns from payment or by polling.
 * 
 * GET /api/paystack/verify?reference=xxx
 * POST /api/paystack/verify { reference: "xxx" }
 * 
 * @module pages/api/paystack/verify
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  verifyTransaction,
  findTransactionByReference,
  updateTransactionStatus,
} from '../../../lib/paystack';
import { formatPaystackAmount } from '../../../lib/paystack/currencyConfig';
import { captureError } from '../../../lib/errorTracking';
import { logger } from '../../../lib/structuredLogger';
// Note: Firebase imports removed - balance updates handled by webhook only

// ============================================================================
// TYPES
// ============================================================================

interface VerifyRequest {
  /** Transaction reference */
  reference: string;
}

interface VerifyResponse {
  ok: boolean;
  data?: {
    /** Transaction reference */
    reference: string;
    /** Transaction status */
    status: 'success' | 'failed' | 'pending' | 'processing';
    /** Amount in smallest unit */
    amountSmallestUnit: number;
    /** Currency */
    currency: string;
    /** Formatted amount for display */
    amountFormatted: string;
    /** Payment channel used */
    channel?: string;
    /** Transaction ID in our system */
    transactionId?: string;
    /** Gateway response message */
    gatewayResponse?: string;
    /** When payment was made */
    paidAt?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyResponse>
) {
  if (!['GET', 'POST'].includes(req.method || '')) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({
      ok: false,
      error: { code: 'method_not_allowed', message: 'Only GET and POST are allowed' },
    });
  }
  
  try {
    // Get reference from query or body
    const reference = req.method === 'GET'
      ? (req.query.reference as string)
      : (req.body as VerifyRequest)?.reference;
    
    if (!reference) {
      return res.status(400).json({
        ok: false,
        error: { code: 'missing_reference', message: 'Transaction reference is required' },
      });
    }
    
    // Verify with Paystack
    const verifyResult = await verifyTransaction(reference);
    
    if (!verifyResult.data) {
      return res.status(404).json({
        ok: false,
        error: {
          code: 'transaction_not_found',
          message: verifyResult.error || 'Transaction not found',
        },
      });
    }
    
    const paystackData = verifyResult.data;
    
    // Find our transaction record
    const transaction = await findTransactionByReference(reference);
    
    // Determine status
    const isSuccess = paystackData.status === 'success';
    const isPending = ['pending', 'processing', 'queued'].includes(paystackData.status);
    const isFailed = ['failed', 'abandoned', 'reversed'].includes(paystackData.status);
    
    // Update transaction record if exists and status changed
    // NOTE: Balance crediting is handled ONLY by the webhook handler (handleChargeSuccess)
    // This endpoint should NOT credit balance to prevent double-crediting
    if (transaction) {
      const newStatus = isSuccess ? 'completed' : isFailed ? 'failed' : 'pending';
      
      if (transaction.status !== newStatus) {
        // Only update status for failures - webhook handles success + balance credit
        // This prevents race conditions where verify runs before webhook
        if (isFailed) {
          await updateTransactionStatus(
            transaction.id,
            newStatus,
            paystackData.gateway_response
          );
        }
        // For success, we let the webhook handle it to ensure single source of truth
        // The webhook will update status AND credit balance atomically
      }
    }
    
    // Format response
    const status = isSuccess ? 'success' : isFailed ? 'failed' : isPending ? 'pending' : 'processing';
    
    return res.status(200).json({
      ok: true,
      data: {
        reference: paystackData.reference,
        status,
        amountSmallestUnit: paystackData.amount,
        currency: paystackData.currency,
        amountFormatted: formatPaystackAmount(paystackData.amount, paystackData.currency),
        channel: paystackData.channel,
        transactionId: transaction?.id,
        gatewayResponse: paystackData.gateway_response,
        paidAt: paystackData.paid_at || undefined,
      },
    });
    
  } catch (error) {
    logger.error('Transaction verification error', error as Error, { 
      component: 'paystack', 
      operation: 'verify',
      query: req.query,
      body: req.body,
    });
    await captureError(error as Error, {
      tags: { component: 'paystack', operation: 'verify' },
      extra: { query: req.query, body: req.body },
    });
    
    const message = error instanceof Error ? error.message : 'Verification failed';
    
    return res.status(500).json({
      ok: false,
      error: { code: 'verification_failed', message },
    });
  }
}

// NOTE: Balance crediting has been removed from this endpoint.
// The webhook handler (handleChargeSuccess) is the single source of truth for balance updates.
// This prevents double-crediting when both webhook and verify are called.

