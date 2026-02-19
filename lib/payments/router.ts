/**
 * Payment Router
 * 
 * Routes payment requests to the appropriate provider based on user country.
 * Implements the strategy pattern for provider selection.
 * 
 * @module lib/payments/router
 */

import { serverLogger } from '../logger/serverLogger';

import type {
  PaymentProvider,
  PaymentProviderName,
  PaymentMethod,
  CreatePaymentRequest,
  CreatePaymentResponse,
  CreateTransferRequest,
  CreateTransferResponse,
} from './types';
import {
  isPaystackCountry,
  isPayMongoCountry,
  isXenditCountry,
  getProviderForCountry,
  getPaymentMethodsForCountry,
  getCurrencyForCountry,
  PAYSTACK_COUNTRIES,
  PAYMONGO_COUNTRIES,
  XENDIT_COUNTRIES,
} from './types';

// ============================================================================
// PROVIDER REGISTRY
// ============================================================================

/**
 * Registry of payment providers
 * Providers register themselves here at module load time
 */
const providerRegistry: Map<PaymentProviderName, PaymentProvider> = new Map();

/**
 * Register a payment provider
 */
export function registerProvider(provider: PaymentProvider): void {
  providerRegistry.set(provider.name, provider);
}

/**
 * Get a registered provider by name
 */
export function getProvider(name: PaymentProviderName): PaymentProvider | undefined {
  return providerRegistry.get(name);
}

/**
 * Check if a provider is registered
 */
export function isProviderRegistered(name: PaymentProviderName): boolean {
  return providerRegistry.has(name);
}

// ============================================================================
// ROUTING LOGIC
// ============================================================================

/**
 * Get the appropriate payment provider for a user's country
 * 
 * @param country - ISO 3166-1 alpha-2 country code
 * @returns The appropriate payment provider, or undefined if none available
 */
export function getProviderForUser(country: string): PaymentProvider | undefined {
  const providerName = getProviderForCountry(country);
  const provider = getProvider(providerName);
  
  // If the preferred provider isn't available, fall back to Stripe
  if (!provider && providerName !== 'stripe') {
    serverLogger.warn(`${providerName} not available for ${country}, falling back to Stripe`);
    return getProvider('stripe');
  }
  
  return provider;
}

/**
 * Get available payment methods for a user
 * 
 * @param country - User's country code
 * @returns Array of available payment methods
 */
export function getAvailablePaymentMethods(country: string): PaymentMethod[] {
  return getPaymentMethodsForCountry(country);
}

/**
 * Get the default currency for a user's country
 * 
 * @param country - User's country code
 * @returns Currency code (e.g., 'USD', 'NGN')
 */
export function getDefaultCurrency(country: string): string {
  return getCurrencyForCountry(country);
}

/**
 * Check if a country uses Paystack
 * 
 * @param country - Country code
 * @returns True if Paystack is the provider for this country
 */
export function usesPaystack(country: string): boolean {
  return isPaystackCountry(country);
}

/**
 * Check if a country uses PayMongo
 * 
 * @param country - Country code
 * @returns True if PayMongo is the provider for this country
 */
export function usesPayMongo(country: string): boolean {
  return isPayMongoCountry(country);
}

/**
 * Check if a country uses Xendit
 * 
 * @param country - Country code
 * @returns True if Xendit is the provider for this country
 */
export function usesXendit(country: string): boolean {
  return isXenditCountry(country);
}

/**
 * Get all Paystack-supported countries
 */
export function getPaystackCountries(): readonly string[] {
  return PAYSTACK_COUNTRIES;
}

/**
 * Get all PayMongo-supported countries
 */
export function getPayMongoCountries(): readonly string[] {
  return PAYMONGO_COUNTRIES;
}

/**
 * Get all Xendit-supported countries
 */
export function getXenditCountries(): readonly string[] {
  return XENDIT_COUNTRIES;
}

// ============================================================================
// PAYMENT OPERATIONS
// ============================================================================

/**
 * Create a payment through the appropriate provider
 * 
 * @param request - Payment creation request
 * @returns Payment creation response
 * @throws Error if no provider is available
 */
export async function createPayment(
  request: CreatePaymentRequest
): Promise<CreatePaymentResponse> {
  const country = request.country || 'US';
  const provider = getProviderForUser(country);
  
  if (!provider) {
    return {
      success: false,
      error: 'No payment provider available for your region',
    };
  }
  
  return provider.createPayment(request);
}

/**
 * Verify a payment through the specified provider
 * 
 * @param providerName - Name of the provider
 * @param reference - Payment reference to verify
 * @returns Verification result
 */
export async function verifyPayment(
  providerName: PaymentProviderName,
  reference: string
): Promise<{ success: boolean; status: string; error?: string }> {
  const provider = getProvider(providerName);
  
  if (!provider) {
    return {
      success: false,
      status: 'failed',
      error: `Provider ${providerName} not available`,
    };
  }
  
  return provider.verifyPayment(reference);
}

/**
 * Create a transfer/payout through the appropriate provider
 * 
 * @param request - Transfer creation request
 * @param providerName - Specific provider to use (defaults to routing by user data)
 * @returns Transfer creation response
 */
export async function createTransfer(
  request: CreateTransferRequest,
  providerName?: PaymentProviderName
): Promise<CreateTransferResponse> {
  // If provider specified, use it; otherwise, we need to determine from user data
  // For transfers, we typically know the provider from the user's payout method
  const provider = providerName 
    ? getProvider(providerName)
    : getProvider('stripe'); // Default to Stripe if not specified
  
  if (!provider) {
    return {
      success: false,
      error: 'No payment provider available for transfers',
    };
  }
  
  return provider.createTransfer(request);
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export {
  isPaystackCountry,
  isPayMongoCountry,
  isXenditCountry,
  getProviderForCountry,
  getCurrencyForCountry,
};

