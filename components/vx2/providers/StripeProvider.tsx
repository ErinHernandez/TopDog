/**
 * Stripe Provider
 * 
 * Wraps the application with Stripe Elements provider.
 * Lazy-loads Stripe.js and configures appearance to match VX2 design system.
 * 
 * @example
 * ```tsx
 * // In _app.tsx or layout
 * <StripeProvider>
 *   <App />
 * </StripeProvider>
 * 
 * // In a component that needs Elements
 * import { useStripe, useElements } from '@stripe/react-stripe-js';
 * ```
 */

import React, { useMemo, useState, useEffect } from 'react';
import { createScopedLogger } from '@/lib/clientLogger';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import type { StripeElementsOptions, Appearance, Stripe } from '@stripe/stripe-js';

const logger = createScopedLogger('[StripeProvider]');

// ============================================================================
// STRIPE INITIALIZATION
// ============================================================================

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Lazy load Stripe.js - only loaded once, then cached
// Wrapped in a function to handle errors gracefully
let stripePromise: Promise<Stripe | null> | null = null;
let stripeLoadError: Error | null = null;

if (stripePublishableKey) {
  try {
    stripePromise = loadStripe(stripePublishableKey).catch((error: unknown): Stripe | null => {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.warn(`Failed to load Stripe.js: ${err.message}`);
      stripeLoadError = err;
      return null;
    });
  } catch (error) {
    logger.warn(`Error initializing Stripe: ${error}`);
    stripeLoadError = error as Error;
    stripePromise = null;
  }
}

// ============================================================================
// VX2 STRIPE APPEARANCE
// ============================================================================

/**
 * Stripe Elements appearance configuration matching VX2 design system.
 * Uses dark theme with VX2 colors from tokens.css custom properties.
 *
 * Note: Stripe Elements doesn't support CSS variables directly,
 * so we use computed values from getComputedStyle.
 */
export const VX2_STRIPE_APPEARANCE: Appearance = {
  theme: 'night',
  labels: 'floating',

  variables: {
    // Colors - using computed values from tokens.css
    colorPrimary: '#60A5FA', // --color-state-active
    colorBackground: '#1f2937', // --bg-secondary
    colorText: '#ffffff', // --text-primary
    colorTextSecondary: '#9ca3af', // --text-secondary
    colorTextPlaceholder: '#6b7280', // --text-muted
    colorDanger: '#EF4444', // --color-state-error
    colorSuccess: '#10B981', // --color-state-success
    colorWarning: '#F59E0B', // --color-state-warning

    // Typography
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSizeBase: '14px',
    fontSizeSm: '13px',
    fontSizeLg: '16px',
    fontWeightNormal: '400',
    fontWeightMedium: '500',
    fontWeightBold: '600',

    // Spacing
    spacingUnit: '4px',
    spacingGridColumn: '16px',
    spacingGridRow: '16px',

    // Border
    borderRadius: '8px',

    // Focus
    focusBoxShadow: '0 0 0 2px rgba(96, 165, 250, 0.25)',
    focusOutline: 'none',
  },

  rules: {
    '.Input': {
      backgroundColor: '#111827', // --bg-tertiary
      border: '1px solid rgba(255, 255, 255, 0.1)', // --border-default
      borderRadius: '8px',
      padding: '12px 14px',
      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    },

    '.Input:focus': {
      borderColor: '#60A5FA', // --color-state-active
      boxShadow: '0 0 0 2px rgba(96, 165, 250, 0.25)',
    },

    '.Input--invalid': {
      borderColor: '#EF4444', // --color-state-error
    },

    '.Input::placeholder': {
      color: '#6b7280', // --text-muted
    },

    '.Label': {
      color: '#9ca3af', // --text-secondary
      fontSize: '13px',
      fontWeight: '500',
      marginBottom: '6px',
    },

    '.Error': {
      color: '#EF4444', // --color-state-error
      fontSize: '13px',
      marginTop: '6px',
    },

    '.Tab': {
      backgroundColor: '#111827', // --bg-tertiary
      border: '1px solid rgba(255, 255, 255, 0.1)', // --border-default
      borderRadius: '8px',
      color: '#9ca3af', // --text-secondary
      padding: '10px 16px',
    },

    '.Tab:hover': {
      backgroundColor: '#1f2937', // --bg-secondary
      color: '#ffffff', // --text-primary
    },

    '.Tab--selected': {
      backgroundColor: '#60A5FA', // --color-state-active
      borderColor: '#60A5FA', // --color-state-active
      color: '#000000',
    },

    '.TabIcon': {
      marginRight: '8px',
    },

    '.Block': {
      backgroundColor: '#1f2937', // --bg-secondary
      borderRadius: '8px',
      padding: '16px',
    },

    '.CheckboxInput': {
      backgroundColor: '#111827', // --bg-tertiary
      borderColor: 'rgba(255, 255, 255, 0.1)', // --border-default
    },

    '.CheckboxInput--checked': {
      backgroundColor: '#60A5FA', // --color-state-active
      borderColor: '#60A5FA', // --color-state-active
    },
  },
};

// ============================================================================
// TYPES
// ============================================================================

export interface StripeProviderProps {
  children: React.ReactNode;
  /** Optional client secret for immediate payment */
  clientSecret?: string;
  /** Optional custom appearance override */
  appearance?: Appearance;
  /** Optional locale */
  locale?: 'en' | 'auto';
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Stripe Elements Provider
 * 
 * Wraps children with Stripe Elements context.
 * Can be used at the app level or around specific payment components.
 */
export function StripeProvider({
  children,
  clientSecret,
  appearance,
  locale = 'en',
}: StripeProviderProps): React.ReactElement | null {
  const [stripeError, setStripeError] = useState<string | null>(null);
  
  // Check if Stripe loaded successfully
  useEffect(() => {
    if (!stripePromise) {
      setStripeError('Stripe not configured');
      return;
    }
    
    stripePromise.then((stripe) => {
      if (!stripe) {
        setStripeError('Failed to load Stripe');
      }
    }).catch((error) => {
      logger.warn(`Stripe load error: ${error}`);
      setStripeError(error.message || 'Failed to load Stripe');
    });
  }, []);
  
  // Merge custom appearance with VX2 defaults
  const finalAppearance = useMemo(() => {
    if (!appearance) return VX2_STRIPE_APPEARANCE;
    
    return {
      ...VX2_STRIPE_APPEARANCE,
      ...appearance,
      variables: {
        ...VX2_STRIPE_APPEARANCE.variables,
        ...appearance.variables,
      },
      rules: {
        ...VX2_STRIPE_APPEARANCE.rules,
        ...appearance.rules,
      },
    };
  }, [appearance]);
  
  // Build Elements options
  const options: StripeElementsOptions = useMemo(() => {
    const opts: StripeElementsOptions = {
      appearance: finalAppearance,
      locale,
    };
    
    if (clientSecret) {
      opts.clientSecret = clientSecret;
    }
    
    return opts;
  }, [clientSecret, finalAppearance, locale]);
  
  // Don't render if Stripe key is not configured or failed to load
  if (!stripePromise || stripeError) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn(`Stripe not available: ${stripeError || 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not configured'}`);
    }
    return <>{children}</>;
  }
  
  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to check if Stripe is available
 */
export function useStripeAvailable(): boolean {
  return !!stripePublishableKey;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { stripePromise };
export default StripeProvider;

