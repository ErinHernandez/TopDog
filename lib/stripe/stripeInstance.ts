/**
 * Stripe Instance Manager
 *
 * Centralized Stripe client initialization with lazy loading.
 * This is shared across all stripe service modules.
 */

import Stripe from 'stripe';

import { serverLogger } from '../logger/serverLogger';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  serverLogger.warn('STRIPE_SECRET_KEY not configured');
}

/**
 * Stripe client instance
 * Initialized lazily to avoid issues in browser context
 */
let stripeInstance: Stripe | null = null;

/**
 * Get or initialize the Stripe client
 */
export function getStripeInstance(): Stripe {
  if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  if (!stripeInstance) {
    const STRIPE_API_VERSION = process.env.STRIPE_API_VERSION || '2025-08-27';
    stripeInstance = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: STRIPE_API_VERSION as Stripe.LatestApiVersion,
      typescript: true,
    });
  }

  return stripeInstance;
}
