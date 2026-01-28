/**
 * PayPal Client Configuration
 *
 * Handles PayPal SDK initialization and provides helper functions
 * for making authenticated API calls to PayPal.
 *
 * Uses the PayPal REST API directly for maximum control.
 */

import { serverLogger } from '../logger/serverLogger';

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

const PAYPAL_MODE = process.env.NODE_ENV === 'production' ? 'live' : 'sandbox';

const PAYPAL_CONFIG = {
  sandbox: {
    clientId: process.env.PAYPAL_SANDBOX_CLIENT_ID,
    clientSecret: process.env.PAYPAL_SANDBOX_CLIENT_SECRET,
    webhookId: process.env.PAYPAL_SANDBOX_WEBHOOK_ID,
    apiBase: 'https://api-m.sandbox.paypal.com',
    webBase: 'https://www.sandbox.paypal.com',
  },
  live: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    webhookId: process.env.PAYPAL_WEBHOOK_ID,
    apiBase: 'https://api-m.paypal.com',
    webBase: 'https://www.paypal.com',
  },
};

/**
 * Get the current PayPal configuration based on environment
 */
export function getPayPalConfig() {
  return PAYPAL_CONFIG[PAYPAL_MODE];
}

// ============================================================================
// ACCESS TOKEN MANAGEMENT
// ============================================================================

interface AccessToken {
  token: string;
  expiresAt: number;
}

let cachedAccessToken: AccessToken | null = null;

/**
 * Get a valid PayPal access token
 * Caches the token and refreshes when expired
 */
export async function getPayPalAccessToken(): Promise<string> {
  const config = getPayPalConfig();

  if (!config.clientId || !config.clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60000) {
    return cachedAccessToken.token;
  }

  try {
    const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

    const response = await fetch(`${config.apiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errorText = await response.text();
      serverLogger.error('PayPal OAuth token request failed', null, {
        status: response.status,
        errorText,
      });
      throw new Error(`Failed to get PayPal access token: ${response.status}`);
    }

    const data = await response.json();

    // Cache the token
    cachedAccessToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    };

    return cachedAccessToken.token;
  } catch (error) {
    serverLogger.error('PayPal OAuth token error', error as Error);
    throw error;
  }
}

// ============================================================================
// API REQUEST HELPERS
// ============================================================================

/**
 * Make an authenticated request to the PayPal API
 */
export async function paypalApiRequest<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
    headers?: Record<string, string>;
    idempotencyKey?: string;
  } = {}
): Promise<T> {
  const config = getPayPalConfig();
  const accessToken = await getPayPalAccessToken();

  const { method = 'GET', body, headers = {}, idempotencyKey } = options;

  const requestHeaders: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add idempotency key for POST requests
  if (idempotencyKey && method === 'POST') {
    requestHeaders['PayPal-Request-Id'] = idempotencyKey;
  }

  const url = `${config.apiBase}${endpoint}`;

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle no content responses
    if (response.status === 204) {
      return {} as T;
    }

    const responseData = await response.json();

    if (!response.ok) {
      serverLogger.error('PayPal API error', undefined, {
        endpoint,
        status: response.status,
        errorData: responseData,
      });

      const error = new Error(
        responseData.message || responseData.details?.[0]?.description || 'PayPal API error'
      ) as Error & { code?: string; details?: unknown };
      error.code = responseData.name || `PAYPAL_${response.status}`;
      error.details = responseData.details;
      throw error;
    }

    return responseData as T;
  } catch (error) {
    if ((error as Error).message?.includes('PayPal API error')) {
      throw error;
    }
    serverLogger.error('PayPal API request failed', error as Error, { endpoint });
    throw error;
  }
}

// ============================================================================
// WEBHOOK SIGNATURE VERIFICATION
// ============================================================================

/**
 * Verify a PayPal webhook signature
 * Uses PayPal's verification API for security
 */
export async function verifyPayPalWebhookSignature(
  headers: Record<string, string>,
  body: string
): Promise<boolean> {
  const config = getPayPalConfig();

  if (!config.webhookId) {
    serverLogger.error('PayPal webhook ID not configured');
    return false;
  }

  try {
    const accessToken = await getPayPalAccessToken();

    const verificationBody = {
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: config.webhookId,
      webhook_event: JSON.parse(body),
    };

    const response = await fetch(`${config.apiBase}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verificationBody),
    });

    if (!response.ok) {
      serverLogger.error('PayPal webhook verification request failed', null, {
        status: response.status,
      });
      return false;
    }

    const result = await response.json();
    return result.verification_status === 'SUCCESS';
  } catch (error) {
    serverLogger.error('PayPal webhook verification error', error as Error);
    return false;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert cents to PayPal amount format (string with 2 decimal places)
 */
export function centsToPayPalAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Convert PayPal amount string to cents
 */
export function paypalAmountToCents(amount: string): number {
  return Math.round(parseFloat(amount) * 100);
}

/**
 * Check if PayPal is configured and enabled
 */
export function isPayPalEnabled(): boolean {
  const config = getPayPalConfig();
  return !!(
    config.clientId &&
    config.clientSecret &&
    process.env.NEXT_PUBLIC_PAYPAL_ENABLED === 'true'
  );
}

/**
 * Get PayPal mode (sandbox or live)
 */
export function getPayPalMode(): 'sandbox' | 'live' {
  return PAYPAL_MODE;
}
