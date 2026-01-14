/**
 * Environment Variable Helpers
 * 
 * Safe access to environment variables with proper error handling
 * and production validation.
 */

import { logger } from './structuredLogger';

/**
 * Get base URL with production validation
 * @throws {Error} If NEXT_PUBLIC_BASE_URL is missing in production
 */
export function requireBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  if (!baseUrl) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXT_PUBLIC_BASE_URL is required in production');
    }
    // Only allow fallback in development
    logger.warn('NEXT_PUBLIC_BASE_URL not set, using fallback: https://topdog.gg', {
      component: 'envHelpers',
      fallback: 'https://topdog.gg',
    });
    return 'https://topdog.gg';
  }
  
  return baseUrl;
}

/**
 * Get app URL with production validation
 * @throws {Error} If NEXT_PUBLIC_APP_URL is missing in production
 */
export function requireAppUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  if (!appUrl) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXT_PUBLIC_APP_URL is required in production');
    }
    // Only allow localhost fallback in development
    logger.warn('NEXT_PUBLIC_APP_URL not set, using fallback: http://localhost:3000', {
      component: 'envHelpers',
      fallback: 'http://localhost:3000',
    });
    return 'http://localhost:3000';
  }
  
  return appUrl;
}

/**
 * Get environment variable with validation
 * @param varName - Environment variable name
 * @param defaultValue - Default value (only used in development)
 * @param requiredInProduction - Whether variable is required in production
 * @throws {Error} If variable is required but not set
 */
export function getEnvVar(
  varName: string,
  defaultValue: string | null = null,
  requiredInProduction: boolean = true
): string {
  const value = process.env[varName];
  
  if (!value) {
    if (process.env.NODE_ENV === 'production' && requiredInProduction) {
      throw new Error(`${varName} is required in production but not set`);
    }
    
    if (defaultValue === null) {
      throw new Error(`${varName} is required but not set`);
    }
    
    if (process.env.NODE_ENV !== 'production') {
      logger.warn(`${varName} not set, using default: ${defaultValue}`, {
        component: 'envHelpers',
        varName,
        defaultValue,
      });
    }
    
    return defaultValue;
  }
  
  return value;
}
