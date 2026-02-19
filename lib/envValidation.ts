/**
 * Environment Variable Validation
 *
 * Validates all required environment variables at application startup.
 * Fails fast if critical secrets are missing.
 */

import { serverLogger } from './logger/serverLogger';

// ============================================================================
// TYPES
// ============================================================================

export interface RequiredEnvVars {
  production: string[];
  development: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Required environment variables for production
 */
const REQUIRED_ENV_VARS: RequiredEnvVars = {
  production: [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'FIREBASE_SERVICE_ACCOUNT',
    'NEXT_PUBLIC_BASE_URL',
    'NEXT_PUBLIC_APP_URL',
  ],
  development: [
    // Development has fewer requirements, but still validate critical ones
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  ],
};

/**
 * Optional but recommended environment variables
 */
const RECOMMENDED_ENV_VARS: string[] = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'ALLOWED_ORIGINS',
  'ADMIN_UIDS',
  'DEV_ACCESS_TOKEN',
];

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Validate environment variables
 * @throws {Error} If required variables are missing
 */
export function validateEnvironmentVariables(
  environment: string = process.env.NODE_ENV || 'development'
): boolean {
  const isProduction = environment === 'production';
  const requiredVars = isProduction 
    ? REQUIRED_ENV_VARS.production 
    : REQUIRED_ENV_VARS.development;
  
  const missingVars: string[] = [];
  const warnings: string[] = [];
  
  // Check required variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  // Check recommended variables (warnings only)
  for (const varName of RECOMMENDED_ENV_VARS) {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  }
  
  // Fail fast if required variables are missing
  if (missingVars.length > 0) {
    const errorMessage = [
      `CRITICAL: Missing required environment variables (${environment}):`,
      ...missingVars.map(v => `  - ${v}`),
      '',
      'Please set these variables in your environment or .env file.',
      'For production, all variables must be set before deployment.'
    ].join('\n');
    
    throw new Error(errorMessage);
  }
  
  // Log warnings for recommended variables
  if (warnings.length > 0 && isProduction) {
    serverLogger.warn('Missing recommended environment variables');
    warnings.forEach(v => serverLogger.warn(`Missing: ${v}`));
  }
  
  // Validate specific variable formats
  validateVariableFormats();
  
  return true;
}

/**
 * Validate specific variable formats
 */
function validateVariableFormats(): void {
  // Validate FIREBASE_SERVICE_ACCOUNT is valid JSON
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountEnv) {
    try {
      const serviceAccount = JSON.parse(serviceAccountEnv) as { project_id?: string };
      if (!serviceAccount.project_id) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT must contain project_id');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`FIREBASE_SERVICE_ACCOUNT is not valid JSON: ${errorMessage}`);
    }
  }

  // Validate ALLOWED_ORIGINS format (comma-separated URLs)
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
  if (allowedOriginsEnv) {
    const origins = allowedOriginsEnv.split(',').map(o => o.trim());
    const invalidOrigins = origins.filter(o => !o.startsWith('http://') && !o.startsWith('https://'));
    if (invalidOrigins.length > 0) {
      throw new Error(`ALLOWED_ORIGINS contains invalid URLs: ${invalidOrigins.join(', ')}`);
    }
    // Validate URL format
    origins.forEach(origin => {
      try {
        new URL(origin);
      } catch {
        throw new Error(`ALLOWED_ORIGINS contains invalid URL format: ${origin}`);
      }
    });
  }

  // Validate Stripe Secret Key format (must start with sk_ and be at least 20 chars)
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (stripeSecretKey) {
    if (!stripeSecretKey.startsWith('sk_')) {
      throw new Error('STRIPE_SECRET_KEY must start with "sk_" prefix');
    }
    if (stripeSecretKey.length < 20) {
      throw new Error('STRIPE_SECRET_KEY must be at least 20 characters long');
    }
  }

  // Validate Stripe Webhook Secret format (must start with whsec_ and be at least 20 chars)
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (stripeWebhookSecret) {
    if (!stripeWebhookSecret.startsWith('whsec_')) {
      throw new Error('STRIPE_WEBHOOK_SECRET must start with "whsec_" prefix');
    }
    if (stripeWebhookSecret.length < 20) {
      throw new Error('STRIPE_WEBHOOK_SECRET must be at least 20 characters long');
    }
  }

  // Validate other secret keys have minimum length
  const secretKeys = ['DEV_ACCESS_TOKEN', 'ADMIN_ACCESS_TOKEN'];
  secretKeys.forEach(key => {
    const value = process.env[key];
    if (value && value.length < 20) {
      throw new Error(`${key} must be at least 20 characters long for security`);
    }
  });
}

/**
 * Get environment variable with validation
 * @throws {Error} If variable is required but not set
 */
export function getEnvVar(varName: string, defaultValue: string | null = null): string {
  const value = process.env[varName];
  
  if (!value && defaultValue === null) {
    throw new Error(`Environment variable ${varName} is required but not set`);
  }
  
  return value || defaultValue || '';
}

/**
 * Initialize environment validation
 * Call this at application startup
 */
export function initializeEnvValidation(): boolean {
  try {
    validateEnvironmentVariables();
    serverLogger.info('Environment variables validated successfully');
    return true;
  } catch (error) {
    serverLogger.error('Environment validation failed', error instanceof Error ? error : new Error(String(error)));

    // In production, fail hard
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }

    // In development, warn but continue
    serverLogger.warn('Continuing in development mode, but some features may not work');
    return false;
  }
}

const envValidationExports = {
  validateEnvironmentVariables,
  getEnvVar,
  initializeEnvValidation,
  REQUIRED_ENV_VARS,
  RECOMMENDED_ENV_VARS,
};

export default envValidationExports;
