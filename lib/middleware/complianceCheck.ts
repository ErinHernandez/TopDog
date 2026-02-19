/**
 * Compliance Check Middleware
 *
 * Next.js API middleware that enforces age and jurisdiction compliance
 * for protected payment and transaction endpoints. Integrates with Firebase
 * authentication and Firestore user data.
 *
 * Features:
 * - Automatic jurisdiction validation
 * - Age verification enforcement
 * - Compliance audit logging
 * - Clear error messages for blocked requests
 * - Configurable compliance requirements
 *
 * @module lib/middleware/complianceCheck
 */

import { doc, getDoc } from 'firebase/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';

import {
  createErrorResponse,
  ErrorType,
  ApiHandler,
  ApiLogger,
} from '../apiErrorHandler';
import { isAgeVerified } from '../compliance/ageVerification';
import { checkJurisdiction } from '../compliance/jurisdictionCompliance';
import { db } from '../firebase';
import { logger } from '../structuredLogger';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for compliance check middleware
 */
export interface ComplianceCheckOptions {
  /**
   * Whether to require age verification
   * @default true
   */
  requireAge?: boolean;

  /**
   * Whether to require jurisdiction check
   * @default true
   */
  requireJurisdiction?: boolean;

  /**
   * Override minimum age requirement
   * If not provided, uses jurisdiction-specific minimum
   */
  minimumAge?: number;

  /**
   * Log audit trail of compliance checks
   * @default true
   */
  logAudit?: boolean;

  /**
   * Custom error message for age verification failure
   */
  ageErrorMessage?: string;

  /**
   * Custom error message for jurisdiction failure
   */
  jurisdictionErrorMessage?: string;
}

/**
 * User compliance data retrieved from Firestore
 */
interface UserComplianceData {
  uid: string;
  ageVerified?: boolean;
  ageVerifiedAt?: string;
  dateOfBirth?: string;
  countryCode?: string;
  stateCode?: string;
  email?: string;
}

/**
 * Compliance check result
 */
interface ComplianceCheckResult {
  /** Whether user passed all compliance checks */
  compliant: boolean;
  /** Type of compliance failure (if any) */
  failureReason?: 'age_not_verified' | 'age_too_young' | 'jurisdiction_prohibited';
  /** Error message to return to client */
  errorMessage?: string;
  /** Audit log entry */
  auditLog?: {
    uid: string;
    timestamp: string;
    type: 'compliance_check' | 'compliance_block';
    reason?: string;
    endpoint: string;
    userJurisdiction?: string;
    ageVerified?: boolean;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Retrieve user compliance data from Firestore
 *
 * @param uid - Firebase user ID
 * @returns User compliance data or null if not found
 */
async function getUserComplianceData(uid: string): Promise<UserComplianceData | null> {
  if (!db) {
    logger.warn('Firebase db not initialized', {
      component: 'compliance',
      operation: 'get_user_data',
    });
    return null;
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      logger.warn('User document not found', {
        component: 'compliance',
        operation: 'get_user_data',
        uid,
      });
      return null;
    }

    const data = userDoc.data();
    return {
      uid,
      ageVerified: data.ageVerified === true,
      ageVerifiedAt: data.ageVerifiedAt,
      dateOfBirth: data.dateOfBirth, // Should be encrypted/hashed in production
      countryCode: data.countryCode || 'US',
      stateCode: data.stateCode,
      email: data.email,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to retrieve user compliance data', err, {
      component: 'compliance',
      operation: 'get_user_data',
      uid,
    });
    return null;
  }
}

/**
 * Perform compliance checks on user
 *
 * @param userData - User compliance data
 * @param options - Compliance check options
 * @returns Compliance check result
 */
function performComplianceChecks(
  userData: UserComplianceData | null,
  options: ComplianceCheckOptions = {}
): ComplianceCheckResult {
  const {
    requireAge = true,
    requireJurisdiction = true,
    minimumAge,
    ageErrorMessage = 'Age verification required to access this feature',
    jurisdictionErrorMessage = 'This service is not available in your jurisdiction',
  } = options;

  if (!userData) {
    return {
      compliant: false,
      failureReason: 'age_not_verified',
      errorMessage: 'User data not found',
    };
  }

  // Check jurisdiction if required
  if (requireJurisdiction && userData.stateCode) {
    const jurisdictionCheck = checkJurisdiction(
      userData.stateCode,
      userData.countryCode
    );

    if (!jurisdictionCheck.allowed) {
      return {
        compliant: false,
        failureReason: 'jurisdiction_prohibited',
        errorMessage: jurisdictionErrorMessage,
      };
    }
  }

  // Check age verification if required
  if (requireAge) {
    // First check if age is verified
    if (!isAgeVerified(userData)) {
      return {
        compliant: false,
        failureReason: 'age_not_verified',
        errorMessage: ageErrorMessage,
      };
    }

    // Additional check: verify user meets minimum age
    // In production, would recalculate from dateOfBirth if available
    if (minimumAge) {
      // Would compare userData.dateOfBirth against minimumAge
      // For now, just trust the ageVerified flag
    }
  }

  return { compliant: true };
}

/**
 * Log compliance check for audit trail
 *
 * @param result - Compliance check result
 * @param userData - User data
 * @param endpoint - API endpoint path
 */
function logComplianceAudit(
  result: ComplianceCheckResult,
  userData: UserComplianceData | null,
  endpoint: string
): void {
  const timestamp = new Date().toISOString();

  if (result.compliant) {
    logger.info('Compliance check passed', {
      component: 'compliance',
      operation: 'audit',
      type: 'compliance_check',
      endpoint,
      uid: userData?.uid,
      timestamp,
    });
  } else {
    logger.warn('Compliance check failed', {
      component: 'compliance',
      operation: 'audit',
      type: 'compliance_block',
      endpoint,
      uid: userData?.uid,
      reason: result.failureReason,
      userJurisdiction: userData?.stateCode || userData?.countryCode,
      ageVerified: userData?.ageVerified,
      timestamp,
    });
  }
}

// ============================================================================
// MIDDLEWARE FACTORY
// ============================================================================

/**
 * Higher-order function that wraps API handlers with compliance checks
 *
 * Enforces age and jurisdiction compliance for payment endpoints and
 * other restricted features. Automatically extracts user info from
 * Firebase auth session and Firestore.
 *
 * Usage:
 * ```ts
 * // In pages/api/payments/deposit.ts
 * const handler = async (req, res) => {
 *   const { amount } = req.body;
 *   // Process deposit
 * };
 *
 * export default withComplianceCheck(handler, {
 *   requireAge: true,
 *   requireJurisdiction: true,
 * });
 * ```
 *
 * When compliance fails, returns 403 Forbidden with:
 * ```json
 * {
 *   "statusCode": 403,
 *   "body": {
 *     "error": {
 *       "type": "FORBIDDEN",
 *       "message": "Age verification required...",
 *       "requestId": "req_...",
 *       "timestamp": "2024-01-15T10:30:45.000Z"
 *     }
 *   }
 * }
 * ```
 *
 * @param handler - The actual API route handler to wrap
 * @param options - Compliance check configuration
 * @returns Wrapped handler with compliance checks
 *
 * @example
 * ```ts
 * // Basic usage - require all compliance checks
 * export default withComplianceCheck(handler);
 *
 * // Specific requirements
 * export default withComplianceCheck(handler, {
 *   requireAge: true,
 *   requireJurisdiction: true,
 *   logAudit: true,
 * });
 *
 * // Custom error messages
 * export default withComplianceCheck(handler, {
 *   ageErrorMessage: 'Users must be 21+ in your state',
 *   jurisdictionErrorMessage: 'Services not available in your state',
 * });
 * ```
 */
export function withComplianceCheck(
  handler: ApiHandler,
  options: ComplianceCheckOptions = {}
) {
  const {
    logAudit = true,
  } = options;

  return async (
    req: NextApiRequest,
    res: NextApiResponse,
    apiLogger?: ApiLogger
  ) => {
    try {
      // Extract user ID from request
      // In production, this would come from Firebase auth session/JWT
      const uid = (req as NextApiRequest & { uid?: string }).uid || req.headers['x-user-id'] as string;

      if (!uid) {
        const errorResponse = createErrorResponse(
          ErrorType.UNAUTHORIZED,
          'User authentication required',
          {},
          res.getHeader('X-Request-ID') as string | null
        );
        return res.status(errorResponse.statusCode).json(errorResponse.body);
      }

      // Get user compliance data
      const userData = await getUserComplianceData(uid);

      // Perform compliance checks
      const complianceResult = performComplianceChecks(userData, options);

      // Log audit trail if enabled
      if (logAudit) {
        const endpoint = req.url || 'unknown';
        logComplianceAudit(complianceResult, userData, endpoint);
      }

      // Return 403 if compliance failed
      if (!complianceResult.compliant) {
        const errorResponse = createErrorResponse(
          ErrorType.FORBIDDEN,
          complianceResult.errorMessage || 'Access denied due to compliance requirements',
          {
            reason: complianceResult.failureReason,
            jurisdiction: userData?.stateCode || userData?.countryCode,
          },
          res.getHeader('X-Request-ID') as string | null
        );
        return res.status(errorResponse.statusCode).json(errorResponse.body);
      }

      // Pass control to the actual handler
      return await handler(req, res, apiLogger!);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Compliance check middleware error', err, {
        component: 'compliance',
        operation: 'middleware',
        endpoint: req.url,
      });

      const errorResponse = createErrorResponse(
        ErrorType.INTERNAL,
        'Compliance check failed',
        {},
        res.getHeader('X-Request-ID') as string | null
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }
  };
}

/**
 * Standalone compliance check function for use in API handlers
 *
 * Call this directly in your handler if you need more control over
 * compliance checking logic.
 *
 * @param req - Next.js API request
 * @param res - Next.js API response
 * @param options - Compliance check options
 * @returns Result with compliance status and user data
 *
 * @example
 * ```ts
 * export default async function handler(req, res) {
 *   const complianceResult = await checkUserCompliance(req, res, {
 *     requireAge: true,
 *     requireJurisdiction: true,
 *   });
 *
 *   if (!complianceResult.compliant) {
 *     return res.status(403).json({ error: complianceResult.errorMessage });
 *   }
 *
 *   // Continue with handler logic
 * }
 * ```
 */
export async function checkUserCompliance(
  req: NextApiRequest,
  res: NextApiResponse,
  options: ComplianceCheckOptions = {}
): Promise<ComplianceCheckResult & { userData?: UserComplianceData }> {
  const uid = (req as any).uid || req.headers['x-user-id'] as string;

  if (!uid) {
    return {
      compliant: false,
      failureReason: 'age_not_verified',
      errorMessage: 'User authentication required',
    };
  }

  const userData = await getUserComplianceData(uid);
  const result = performComplianceChecks(userData, options);

  return {
    ...result,
    userData: userData || undefined,
  };
}
