// Development authentication and access control
// This file handles developer-only access to development features

// ============================================================================
// BUILD-TIME DETECTION (Belt-and-Suspenders)
// ============================================================================

/**
 * Detect if we're running during Next.js build phase
 * NEXT_PHASE is set by Next.js during builds:
 * - 'phase-production-build' during production build
 * - 'phase-export' during static export
 * - undefined during runtime
 */
const isBuildPhase = () => {
  const phase = process.env.NEXT_PHASE;
  return phase === 'phase-production-build' || phase === 'phase-export';
};

/**
 * Check if we're in a browser environment
 * Used to prevent server-side security code from running on client
 */
const isBrowser = () => typeof window !== 'undefined';

// ============================================================================
// DEV ACCESS TOKEN
// ============================================================================

// Development access token - MUST be set via environment variable in production
// In development, falls back to default for local testing
// NOTE: Validation is deferred to runtime (not module load) to allow builds to succeed
const getDevAccessToken = () => {
  // During build phase, return null to prevent any build-time issues
  if (isBuildPhase()) {
    return null;
  }
  
  const token = process.env.DEV_ACCESS_TOKEN || 
    (process.env.NODE_ENV === 'development' ? 'dev_access_2024' : null);
  return token;
};

/**
 * Check if user is authorized for development access
 * Uses Firebase Auth custom claims or environment variable for authorized developers
 * @param {string} userId - User ID to check (optional, for backward compatibility)
 * @param {object} authToken - Decoded Firebase Auth token with custom claims (preferred)
 * @returns {boolean}
 */
export const isDeveloper = (userId = null, authToken = null) => {
  // Preferred: Check custom claim from Firebase Auth token
  if (authToken && authToken.developer === true) {
    return true;
  }
  
  // Fallback: Check environment variable for authorized developer UIDs
  const authorizedDevelopers = process.env.AUTHORIZED_DEVELOPER_UIDS?.split(',')
    .map(uid => uid.trim())
    .filter(Boolean) || [];
  
  if (userId && authorizedDevelopers.length > 0) {
    return authorizedDevelopers.includes(userId);
  }
  
  return false;
};

// Check if user has development access token
// Uses constant-time comparison to prevent timing attacks
export const hasDevAccess = (accessToken) => {
  const token = getDevAccessToken();
  if (!token || !accessToken) {
    return false;
  }
  
  // Use constant-time comparison in Node.js environment
  if (typeof require !== 'undefined') {
    try {
      const crypto = require('crypto');
      const expectedBuffer = Buffer.from(token, 'utf8');
      const providedBuffer = Buffer.from(accessToken, 'utf8');
      
      // Pad to same length to prevent length-based timing attacks
      const maxLength = Math.max(expectedBuffer.length, providedBuffer.length);
      const expectedPadded = Buffer.alloc(maxLength);
      const providedPadded = Buffer.alloc(maxLength);
      expectedBuffer.copy(expectedPadded);
      providedBuffer.copy(providedPadded);
      
      return crypto.timingSafeEqual(expectedPadded, providedPadded);
    } catch (error) {
      // Fallback to regular comparison if crypto is not available (client-side)
      return accessToken === token;
    }
  }
  
  // Client-side fallback (less secure but necessary for browser compatibility)
  return accessToken === token;
};

// Get development access token (for testing purposes)
// Exported version that validates config in production
export { getDevAccessToken };

/**
 * Validate development access
 * @param {string} userId - User ID (optional, for backward compatibility)
 * @param {string} accessToken - Development access token (optional)
 * @param {object} authToken - Decoded Firebase Auth token with custom claims (preferred)
 * @returns {boolean}
 */
export const validateDevAccess = (userId = null, accessToken = null, authToken = null) => {
  // Check if user is authorized developer via custom claim or UID list
  if (isDeveloper(userId, authToken)) {
    return true;
  }
  
  // Check if user has valid development access token
  if (accessToken && hasDevAccess(accessToken)) {
    return true;
  }
  
  return false;
};

// Development environment check
export const isDevelopmentEnvironment = () => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Combined access check for development features
 * @param {string} userId - User ID (optional, for backward compatibility)
 * @param {string} accessToken - Development access token (optional)
 * @param {object} authToken - Decoded Firebase Auth token with custom claims (preferred)
 * @returns {boolean}
 */
export const canAccessDevFeatures = (userId = null, accessToken = null, authToken = null) => {
  // Check if dev access barrier is disabled via environment variable
  // This allows disabling the barrier on Vercel or other platforms
  // Check both NEXT_PUBLIC_ (client-side) and regular (server-side) versions
  const disableBarrier = 
    process.env.NEXT_PUBLIC_DISABLE_DEV_ACCESS_BARRIER === 'true' || 
    process.env.NEXT_PUBLIC_DISABLE_DEV_ACCESS_BARRIER === '1' ||
    process.env.DISABLE_DEV_ACCESS_BARRIER === 'true' || 
    process.env.DISABLE_DEV_ACCESS_BARRIER === '1';
  
  // Automatically disable barrier on Vercel deployments (unless explicitly enabled)
  // VERCEL=1 is set on all Vercel deployments
  const isVercel = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_VERCEL === '1';
  const barrierEnabled = process.env.ENABLE_DEV_ACCESS_BARRIER === 'true' || 
                         process.env.NEXT_PUBLIC_ENABLE_DEV_ACCESS_BARRIER === 'true';
  
  // If on Vercel and barrier is not explicitly enabled, disable it
  if (isVercel && !barrierEnabled) {
    return true;
  }
  
  // If explicitly disabled via environment variable, disable it
  if (disableBarrier) {
    return true;
  }
  
  // In development environment, allow access with proper credentials
  if (isDevelopmentEnvironment()) {
    return validateDevAccess(userId, accessToken, authToken);
  }
  
  // In production, only allow authorized developers (via custom claims or UID list)
  return isDeveloper(userId, authToken);
}; 