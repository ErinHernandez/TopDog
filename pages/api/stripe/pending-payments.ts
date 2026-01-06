/**
 * Pending Payments API Endpoint
 * 
 * GET /api/stripe/pending-payments?userId={userId}
 * 
 * Returns pending async payments (OXXO, Boleto, Pix) for a user.
 * These are payments that require offline action to complete.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebase/firebaseAdmin';
import { createScopedLogger } from '../../../lib/serverLogger';

const logger = createScopedLogger('[API:PendingPayments]');

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// ============================================================================
// TYPES
// ============================================================================

interface PendingPayment {
  id: string;
  type: 'oxxo' | 'boleto' | 'pix';
  amount: number;
  currency: string;
  voucherUrl: string;
  expiresAt: string;
  createdAt: string;
  status: 'pending' | 'expired' | 'cancelled';
}

interface SuccessResponse {
  ok: true;
  data: {
    payments: PendingPayment[];
  };
}

interface ErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

type ApiResponse = SuccessResponse | ErrorResponse;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine payment type from Stripe PaymentIntent
 */
function getPaymentType(paymentIntent: Stripe.PaymentIntent): 'oxxo' | 'boleto' | 'pix' | null {
  const paymentMethodTypes = paymentIntent.payment_method_types || [];
  
  if (paymentMethodTypes.includes('oxxo')) return 'oxxo';
  if (paymentMethodTypes.includes('boleto')) return 'boleto';
  if (paymentMethodTypes.includes('pix')) return 'pix';
  
  // Check next_action for type detection
  const nextAction = paymentIntent.next_action;
  if (nextAction) {
    if (nextAction.type === 'oxxo_display_details') return 'oxxo';
    if (nextAction.type === 'boleto_display_details') return 'boleto';
    if (nextAction.type === 'pix_display_qr_code') return 'pix';
  }
  
  return null;
}

/**
 * Extract voucher URL and expiration from Stripe next_action
 */
function extractVoucherInfo(paymentIntent: Stripe.PaymentIntent): {
  voucherUrl: string | null;
  expiresAt: string | null;
} {
  const nextAction = paymentIntent.next_action;
  
  if (!nextAction) {
    return { voucherUrl: null, expiresAt: null };
  }
  
  // OXXO
  if (nextAction.type === 'oxxo_display_details' && nextAction.oxxo_display_details) {
    return {
      voucherUrl: nextAction.oxxo_display_details.hosted_voucher_url || null,
      expiresAt: nextAction.oxxo_display_details.expires_after 
        ? new Date(nextAction.oxxo_display_details.expires_after * 1000).toISOString()
        : null,
    };
  }
  
  // Boleto
  if (nextAction.type === 'boleto_display_details' && nextAction.boleto_display_details) {
    return {
      voucherUrl: nextAction.boleto_display_details.hosted_voucher_url || null,
      expiresAt: nextAction.boleto_display_details.expires_at
        ? new Date(nextAction.boleto_display_details.expires_at * 1000).toISOString()
        : null,
    };
  }
  
  // Pix
  if (nextAction.type === 'pix_display_qr_code' && nextAction.pix_display_qr_code) {
    return {
      voucherUrl: nextAction.pix_display_qr_code.hosted_instructions_url || null,
      expiresAt: nextAction.pix_display_qr_code.expires_at
        ? new Date(nextAction.pix_display_qr_code.expires_at * 1000).toISOString()
        : null,
    };
  }
  
  return { voucherUrl: null, expiresAt: null };
}

/**
 * Determine payment status
 */
function getPaymentStatus(paymentIntent: Stripe.PaymentIntent): 'pending' | 'expired' | 'cancelled' {
  if (paymentIntent.status === 'canceled') return 'cancelled';
  
  // Check if expired
  const voucherInfo = extractVoucherInfo(paymentIntent);
  if (voucherInfo.expiresAt && new Date(voucherInfo.expiresAt) < new Date()) {
    return 'expired';
  }
  
  return 'pending';
}

// ============================================================================
// API HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      ok: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET requests are allowed',
      },
    });
  }
  
  const { userId } = req.query;
  
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      ok: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'userId is required',
      },
    });
  }
  
  try {
    logger.debug('Fetching pending payments', { userId });
    
    // First, get user's Stripe customer ID from Firebase
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const stripeCustomerId = userData?.stripeCustomerId;
    
    if (!stripeCustomerId) {
      // No Stripe customer = no pending payments
      return res.status(200).json({
        ok: true,
        data: { payments: [] },
      });
    }
    
    // Fetch payment intents that require action (async payment methods)
    const paymentIntents = await stripe.paymentIntents.list({
      customer: stripeCustomerId,
      limit: 20,
    });
    
    // Filter to pending async payments
    const pendingPayments: PendingPayment[] = [];
    
    for (const pi of paymentIntents.data) {
      // Only include payments awaiting action
      if (pi.status !== 'requires_action') continue;
      
      const paymentType = getPaymentType(pi);
      if (!paymentType) continue;
      
      const voucherInfo = extractVoucherInfo(pi);
      if (!voucherInfo.voucherUrl || !voucherInfo.expiresAt) continue;
      
      const status = getPaymentStatus(pi);
      
      pendingPayments.push({
        id: pi.id,
        type: paymentType,
        amount: pi.amount,
        currency: pi.currency.toUpperCase(),
        voucherUrl: voucherInfo.voucherUrl,
        expiresAt: voucherInfo.expiresAt,
        createdAt: new Date(pi.created * 1000).toISOString(),
        status,
      });
    }
    
    logger.debug('Found pending payments', { 
      userId, 
      count: pendingPayments.length,
    });
    
    return res.status(200).json({
      ok: true,
      data: { payments: pendingPayments },
    });
    
  } catch (error) {
    logger.error('Error fetching pending payments', { userId, error });
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return res.status(500).json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: `Failed to fetch pending payments: ${message}`,
      },
    });
  }
}

