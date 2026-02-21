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

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import type { StripeElementsOptions, Appearance, Stripe } from '@stripe/stripe-js';
import React, { useMemo, useState, useEffect } from 'react';

import { createScopedLogger } from '@/lib/clientLogger';

import {
  STATE_COLORS,
  TEXT_COLORS,
  BG_COLORS,
  BORDER_COLORS,
  UI_COLORS,
} from '../core/constants/colors';

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
 * so we use values from vx2/core/constants/colors.ts (same as tokens.css).
 */
export const VX2_STRIPE_APPEARANCE: Appearance = {
  theme: 'night',
  labels: 'floating',

  variables: {
    colorPrimary: STATE_COLORS.active,
    colorBackground: BG_COLORS.secondary,
    colorText: TEXT_COLORS.primary,
    colorTextSecondary: TEXT_COLORS.secondary,
    colorTextPlaceholder: TEXT_COLORS.muted,
    colorDanger: STATE_COLORS.error,
    colorSuccess: STATE_COLORS.success,
    colorWarning: STATE_COLORS.warning,

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
    focusBoxShadow: UI_COLORS.focusBoxShadow,
    focusOutline: 'none',
  },

  rules: {
    '.Input': {
      backgroundColor: BG_COLORS.tertiary,
      border: `1px solid ${BORDER_COLORS.default}`,
      borderRadius: '8px',
      padding: '12px 14px',
      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    },

    '.Input:focus': {
      borderColor: STATE_COLORS.active,
      boxShadow: UI_COLORS.focusBoxShadow,
    },

    '.Input--invalid': {
      borderColor: STATE_COLORS.error,
    },

    '.Input::placeholder': {
      color: TEXT_COLORS.muted,
    },

    '.Label': {
      color: TEXT_COLORS.secondary,
      fontSize: '13px',
      fontWeight: '500',
      marginBottom: '6px',
    },

    '.Error': {
      color: STATE_COLORS.error,
      fontSize: '13px',
      marginTop: '6px',
    },

    '.Tab': {
      backgroundColor: BG_COLORS.tertiary,
      border: `1px solid ${BORDER_COLORS.default}`,
      borderRadius: '8px',
      color: TEXT_COLORS.secondary,
      padding: '10px 16px',
    },

    '.Tab:hover': {
      backgroundColor: BG_COLORS.secondary,
      color: TEXT_COLORS.primary,
    },

    '.Tab--selected': {
      backgroundColor: STATE_COLORS.active,
      borderColor: STATE_COLORS.active,
      color: BG_COLORS.black,
    },

    '.TabIcon': {
      marginRight: '8px',
    },

    '.Block': {
      backgroundColor: BG_COLORS.secondary,
      borderRadius: '8px',
      padding: '16px',
    },

    '.CheckboxInput': {
      backgroundColor: BG_COLORS.tertiary,
      borderColor: BORDER_COLORS.default,
    },

    '.CheckboxInput--checked': {
      backgroundColor: STATE_COLORS.active,
      borderColor: STATE_COLORS.active,
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

    stripePromise
      .then(stripe => {
        if (!stripe) {
          setStripeError('Failed to load Stripe');
        }
      })
      .catch(error => {
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
      logger.warn(
        `Stripe not available: ${stripeError || 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not configured'}`,
      );
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
