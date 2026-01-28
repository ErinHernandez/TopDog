/**
 * Security Event Logger
 *
 * Logs security-relevant events for monitoring and incident response.
 * All logs should be sent to a secure logging service in production.
 */

import type { NextApiRequest } from 'next';
import { db } from './firebase';
import { serverLogger } from './logger/serverLogger';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// ============================================================================
// TYPES
// ============================================================================

// Security event types
export const SecurityEventType = {
  AUTH_SUCCESS: 'auth_success',
  AUTH_FAILURE: 'auth_failure',
  AUTH_ATTEMPT: 'auth_attempt',
  ADMIN_ACTION: 'admin_action',
  PAYMENT_TRANSACTION: 'payment_transaction',
  CSRF_VIOLATION: 'csrf_violation',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  DATA_ACCESS: 'data_access',
  CONFIGURATION_CHANGE: 'configuration_change',
} as const;

export type SecurityEventType = typeof SecurityEventType[keyof typeof SecurityEventType];

// Security event severity levels
export const SecuritySeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type SecuritySeverity = typeof SecuritySeverity[keyof typeof SecuritySeverity];

export interface SecurityEventMetadata {
  [key: string]: unknown;
  action?: string;
  endpoint?: string;
  reason?: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  activity?: string;
}

export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  metadata: SecurityEventMetadata;
  userId: string | null;
  ipAddress: string | null;
  timestamp: ReturnType<typeof serverTimestamp> | Date;
  environment: string;
}

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Log a security event
 */
export async function logSecurityEvent(
  eventType: SecurityEventType,
  severity: SecuritySeverity = SecuritySeverity.LOW,
  metadata: SecurityEventMetadata = {},
  userId: string | null = null,
  ipAddress: string | null = null
): Promise<SecurityEvent | null> {
  try {
    const event: SecurityEvent = {
      type: eventType,
      severity,
      metadata,
      userId: userId || null,
      ipAddress: ipAddress || null,
      timestamp: serverTimestamp(),
      environment: process.env.NODE_ENV || 'development',
    };

    // In production, also send to external logging service
    if (process.env.NODE_ENV === 'production') {
      // Send to Sentry if available
      try {
         
        const Sentry = require('@sentry/nextjs');
        Sentry.captureMessage('Security Event', {
          level: 'warning',
          extra: event,
        });
      } catch (err) {
        // Sentry not available - log via serverLogger
        serverLogger.info('Security Event', { ...event, userId: event.userId ?? undefined });
      }
    } else {
      serverLogger.info('Security Event', { ...event, userId: event.userId ?? undefined });
    }

    // Store in Firestore for audit trail
    if (db) {
      try {
        await addDoc(collection(db, 'security_events'), event);
      } catch (error) {
        // Don't fail the request if logging fails, but log the error
        serverLogger.error('Failed to log security event to Firestore', error instanceof Error ? error : new Error(String(error)));
      }
    }

    return event;
  } catch (error) {
    // Never throw - logging should never break the application
    serverLogger.error('Error logging security event', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Log authentication success
 */
export async function logAuthSuccess(
  userId: string,
  ipAddress: string,
  metadata: SecurityEventMetadata = {}
): Promise<SecurityEvent | null> {
  return logSecurityEvent(
    SecurityEventType.AUTH_SUCCESS,
    SecuritySeverity.LOW,
    { ...metadata, action: 'authentication_success' },
    userId,
    ipAddress
  );
}

/**
 * Log authentication failure
 */
export async function logAuthFailure(
  userId: string | null,
  ipAddress: string,
  reason: string,
  metadata: SecurityEventMetadata = {}
): Promise<SecurityEvent | null> {
  return logSecurityEvent(
    SecurityEventType.AUTH_FAILURE,
    SecuritySeverity.MEDIUM,
    { ...metadata, reason, action: 'authentication_failure' },
    userId,
    ipAddress
  );
}

/**
 * Log admin action
 */
export async function logAdminAction(
  adminUserId: string,
  action: string,
  metadata: SecurityEventMetadata = {},
  ipAddress: string | null = null
): Promise<SecurityEvent | null> {
  return logSecurityEvent(
    SecurityEventType.ADMIN_ACTION,
    SecuritySeverity.HIGH,
    { ...metadata, action },
    adminUserId,
    ipAddress
  );
}

/**
 * Log payment transaction
 */
export async function logPaymentTransaction(
  userId: string,
  transactionId: string,
  amount: number,
  currency: string,
  status: string,
  metadata: SecurityEventMetadata = {},
  ipAddress: string | null = null
): Promise<SecurityEvent | null> {
  return logSecurityEvent(
    SecurityEventType.PAYMENT_TRANSACTION,
    SecuritySeverity.HIGH,
    {
      ...metadata,
      transactionId,
      amount,
      currency,
      status,
      action: 'payment_transaction',
    },
    userId,
    ipAddress
  );
}

/**
 * Log CSRF violation
 */
export async function logCSRFViolation(
  userId: string | null,
  endpoint: string,
  ipAddress: string,
  metadata: SecurityEventMetadata = {}
): Promise<SecurityEvent | null> {
  return logSecurityEvent(
    SecurityEventType.CSRF_VIOLATION,
    SecuritySeverity.HIGH,
    {
      ...metadata,
      endpoint,
      action: 'csrf_violation',
    },
    userId,
    ipAddress
  );
}

/**
 * Log rate limit exceeded
 */
export async function logRateLimitExceeded(
  userId: string | null,
  endpoint: string,
  ipAddress: string,
  metadata: SecurityEventMetadata = {}
): Promise<SecurityEvent | null> {
  return logSecurityEvent(
    SecurityEventType.RATE_LIMIT_EXCEEDED,
    SecuritySeverity.MEDIUM,
    {
      ...metadata,
      endpoint,
      action: 'rate_limit_exceeded',
    },
    userId,
    ipAddress
  );
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(
  userId: string | null,
  activity: string,
  severity: SecuritySeverity = SecuritySeverity.HIGH,
  metadata: SecurityEventMetadata = {},
  ipAddress: string | null = null
): Promise<SecurityEvent | null> {
  return logSecurityEvent(
    SecurityEventType.SUSPICIOUS_ACTIVITY,
    severity,
    {
      ...metadata,
      activity,
      action: 'suspicious_activity',
    },
    userId,
    ipAddress
  );
}

/**
 * Get client IP address from request
 */
export function getClientIP(req: NextApiRequest): string {
  // Check various headers for IP address (in case of proxies)
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const remoteAddress = req.socket?.remoteAddress;

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return forwardedValue.split(',')[0].trim();
  }

  if (realIP) {
    return Array.isArray(realIP) ? realIP[0] : realIP;
  }

  return remoteAddress || 'unknown';
}

export default {
  logSecurityEvent,
  logAuthSuccess,
  logAuthFailure,
  logAdminAction,
  logPaymentTransaction,
  logCSRFViolation,
  logRateLimitExceeded,
  logSuspiciousActivity,
  getClientIP,
  SecurityEventType,
  SecuritySeverity,
};
