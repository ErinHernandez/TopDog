/**
 * Security Event Logger
 * 
 * Logs security-relevant events for monitoring and incident response.
 * All logs should be sent to a secure logging service in production.
 */

import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
};

// Security event severity levels
export const SecuritySeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * Log a security event
 * @param {string} eventType - Type of security event
 * @param {string} severity - Severity level
 * @param {Object} metadata - Additional event metadata
 * @param {string} userId - User ID (if applicable)
 * @param {string} ipAddress - IP address of the request
 */
export async function logSecurityEvent(
  eventType,
  severity = SecuritySeverity.LOW,
  metadata = {},
  userId = null,
  ipAddress = null
) {
  try {
    const event = {
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
      // TODO: Integrate with external logging service (e.g., Sentry, LogRocket, etc.)
      console.log('[Security Event]', event);
    } else {
      console.log('[Security Event]', event);
    }

    // Store in Firestore for audit trail
    try {
      await addDoc(collection(db, 'security_events'), event);
    } catch (error) {
      // Don't fail the request if logging fails, but log the error
      console.error('Failed to log security event to Firestore:', error);
    }

    return event;
  } catch (error) {
    // Never throw - logging should never break the application
    console.error('Error logging security event:', error);
    return null;
  }
}

/**
 * Log authentication success
 */
export async function logAuthSuccess(userId, ipAddress, metadata = {}) {
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
export async function logAuthFailure(userId, ipAddress, reason, metadata = {}) {
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
export async function logAdminAction(adminUserId, action, metadata = {}, ipAddress = null) {
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
  userId,
  transactionId,
  amount,
  currency,
  status,
  metadata = {},
  ipAddress = null
) {
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
export async function logCSRFViolation(userId, endpoint, ipAddress, metadata = {}) {
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
export async function logRateLimitExceeded(userId, endpoint, ipAddress, metadata = {}) {
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
  userId,
  activity,
  severity = SecuritySeverity.HIGH,
  metadata = {},
  ipAddress = null
) {
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
export function getClientIP(req) {
  // Check various headers for IP address (in case of proxies)
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const remoteAddress = req.socket?.remoteAddress;

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
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

