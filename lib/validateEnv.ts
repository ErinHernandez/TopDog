/**
 * Startup Environment Variable Validation
 *
 * Validates that all required environment variables are set before the app
 * starts serving requests. Fails fast with clear error messages.
 *
 * Usage:
 *   import { validateEnv } from '@/lib/validateEnv';
 *   validateEnv(); // throws if critical vars are missing
 *
 * Call from instrumentation.ts register() or _app.tsx getInitialProps.
 */

// ============================================================================
// TYPES
// ============================================================================

interface EnvVarSpec {
  name: string;
  required: boolean;
  /** Description shown in error messages */
  description: string;
  /** If true, only required on server (NEXT_RUNTIME=nodejs) */
  serverOnly?: boolean;
  /** If true, only required in production */
  productionOnly?: boolean;
}

interface ValidationResult {
  missing: string[];
  warnings: string[];
  ok: boolean;
}

// ============================================================================
// REQUIRED VARIABLES
// ============================================================================

const ENV_SPECS: EnvVarSpec[] = [
  // Firebase (client)
  { name: 'NEXT_PUBLIC_FIREBASE_API_KEY', required: true, description: 'Firebase client API key' },
  { name: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', required: true, description: 'Firebase auth domain' },
  { name: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', required: true, description: 'Firebase project ID' },

  // Firebase (server)
  {
    name: 'FIREBASE_ADMIN_PROJECT_ID',
    required: true,
    serverOnly: true,
    description: 'Firebase Admin project ID',
  },

  // Stripe
  {
    name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    required: true,
    description: 'Stripe publishable key',
  },
  { name: 'STRIPE_SECRET_KEY', required: true, serverOnly: true, description: 'Stripe secret key' },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: true,
    serverOnly: true,
    productionOnly: true,
    description: 'Stripe webhook signing secret',
  },

  // Sentry (optional but warn if DSN set without environment)
  { name: 'NEXT_PUBLIC_SENTRY_DSN', required: false, description: 'Sentry error tracking DSN' },
  {
    name: 'NEXT_PUBLIC_SENTRY_ENVIRONMENT',
    required: false,
    description: 'Sentry environment tag',
  },

  // App
  { name: 'NEXT_PUBLIC_APP_URL', required: false, description: 'Public application URL' },
];

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate environment variables and return structured result.
 */
export function checkEnv(): ValidationResult {
  const isServer = typeof window === 'undefined';
  const isProduction = process.env.NODE_ENV === 'production';

  const missing: string[] = [];
  const warnings: string[] = [];

  for (const spec of ENV_SPECS) {
    // Skip server-only checks on client
    if (spec.serverOnly && !isServer) continue;
    // Skip production-only checks in development
    if (spec.productionOnly && !isProduction) continue;

    const value = process.env[spec.name];

    if (!value || value.trim() === '') {
      if (spec.required) {
        missing.push(`${spec.name} — ${spec.description}`);
      } else {
        warnings.push(`${spec.name} not set — ${spec.description}`);
      }
    }
  }

  // Cross-check: if Sentry DSN is set, environment should also be set
  if (process.env.NEXT_PUBLIC_SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT) {
    warnings.push(
      'NEXT_PUBLIC_SENTRY_DSN is set but NEXT_PUBLIC_SENTRY_ENVIRONMENT is not — errors will be tagged as "development"',
    );
  }

  return { missing, warnings, ok: missing.length === 0 };
}

/**
 * Validate environment variables at startup.
 * Throws in production if critical vars are missing.
 * Logs warnings in development.
 */
export function validateEnv(): void {
  const result = checkEnv();
  const isProduction = process.env.NODE_ENV === 'production';

  // Log warnings
  for (const w of result.warnings) {
    console.warn(`[env] WARNING: ${w}`);
  }

  if (!result.ok) {
    const message = [
      '[env] Missing required environment variables:',
      ...result.missing.map(m => `  - ${m}`),
      '',
      'Set these in .env.local or your deployment environment.',
    ].join('\n');

    if (isProduction) {
      throw new Error(message);
    } else {
      console.warn(message);
    }
  }
}
