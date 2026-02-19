/**
 * Centralized API Route Configuration
 * 
 * Provides validated access to environment variables used across API routes.
 * Validates at module load time to fail fast on missing configuration.
 * 
 * @module lib/apiRouteConfig
 */

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a required environment variable, throwing if not set
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Get an optional environment variable with a default value
 */
function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Get an optional environment variable, returning undefined if not set
 */
function optionalEnvOrUndefined(key: string): string | undefined {
  return process.env[key] || undefined;
}

// ============================================================================
// CONFIGURATION OBJECT
// ============================================================================

/**
 * Centralized API configuration
 * 
 * Access environment variables through this object for:
 * - Type safety
 * - Validation at startup
 * - Centralized documentation
 * - Easy mocking in tests
 */
export const apiConfig = {
  /**
   * Stripe payment configuration
   */
  stripe: {
    get secretKey(): string {
      return requireEnv('STRIPE_SECRET_KEY');
    },
    get webhookSecret(): string {
      return requireEnv('STRIPE_WEBHOOK_SECRET');
    },
    get publishableKey(): string {
      return requireEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
    },
  },

  /**
   * Firebase configuration
   */
  firebase: {
    get projectId(): string {
      return requireEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
    },
    get apiKey(): string {
      return requireEnv('NEXT_PUBLIC_FIREBASE_API_KEY');
    },
    get authDomain(): string {
      return optionalEnv(
        'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
        `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`
      );
    },
    get storageBucket(): string | undefined {
      return optionalEnvOrUndefined('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
    },
    get messagingSenderId(): string | undefined {
      return optionalEnvOrUndefined('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
    },
    get appId(): string | undefined {
      return optionalEnvOrUndefined('NEXT_PUBLIC_FIREBASE_APP_ID');
    },
  },

  /**
   * Sentry error tracking configuration
   */
  sentry: {
    get dsn(): string {
      return optionalEnv('SENTRY_DSN', '');
    },
    get enabled(): boolean {
      return !!process.env.SENTRY_DSN;
    },
  },

  /**
   * Data source configuration
   */
  dataSources: {
    get projectionsSource(): string {
      return optionalEnv('DATA_SOURCE_PROJECTIONS', 'sportsdataio');
    },
    get historicalSource(): string {
      return optionalEnv('DATA_SOURCE_HISTORICAL', 'espn_core');
    },
    get sportsdataioApiKey(): string | undefined {
      return optionalEnvOrUndefined('SPORTSDATAIO_API_KEY');
    },
  },

  /**
   * Security and CORS configuration
   */
  security: {
    get allowedOrigins(): string[] {
      return (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);
    },
    get jwtSecret(): string | undefined {
      return optionalEnvOrUndefined('JWT_SECRET');
    },
  },

  /**
   * Environment information
   */
  env: {
    get nodeEnv(): string {
      return process.env.NODE_ENV || 'development';
    },
    get isDevelopment(): boolean {
      return this.nodeEnv === 'development';
    },
    get isProduction(): boolean {
      return this.nodeEnv === 'production';
    },
    get isTest(): boolean {
      return this.nodeEnv === 'test';
    },
  },

  /**
   * Rate limiting configuration
   */
  rateLimiting: {
    get redisUrl(): string | undefined {
      return optionalEnvOrUndefined('REDIS_URL');
    },
    get enabled(): boolean {
      return !!process.env.REDIS_URL;
    },
  },
} as const;

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate that all critical environment variables are set
 * Call this at application startup to fail fast
 */
export function validateApiConfig(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical variables (errors if missing)
  const criticalVars = [
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_API_KEY',
  ];

  for (const varName of criticalVars) {
    if (!process.env[varName]) {
      errors.push(`Missing critical environment variable: ${varName}`);
    }
  }

  // Payment-critical variables (warn if missing in production)
  if (apiConfig.env.isProduction) {
    const paymentVars = [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    ];

    for (const varName of paymentVars) {
      if (!process.env[varName]) {
        warnings.push(`Missing payment variable in production: ${varName}`);
      }
    }
  }

  // Optional but recommended (warn if missing)
  const recommendedVars = [
    { name: 'SENTRY_DSN', description: 'Error tracking disabled' },
    { name: 'REDIS_URL', description: 'Rate limiting disabled' },
  ];

  for (const { name, description } of recommendedVars) {
    if (!process.env[name]) {
      warnings.push(`${name} not set: ${description}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Log configuration status (for startup diagnostics)
 */
export function logConfigStatus(): void {
  const { valid, errors, warnings } = validateApiConfig();
  
  if (!valid) {
    console.error('[apiRouteConfig] Configuration errors:', errors);
  }
  
  if (warnings.length > 0 && apiConfig.env.isDevelopment) {
    console.warn('[apiRouteConfig] Configuration warnings:', warnings);
  }
  
  if (valid && apiConfig.env.isDevelopment) {
    console.info('[apiRouteConfig] Configuration validated successfully');
  }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ApiConfig = typeof apiConfig;
