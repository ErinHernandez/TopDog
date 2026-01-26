/**
 * Security Monitoring and Alerting
 *
 * Provides utilities for monitoring security events, detecting anomalies,
 * and alerting on suspicious activity.
 */

import { logSecurityEvent, SecurityEventType, SecuritySeverity } from './securityLogger';
import { serverLogger } from './logger/serverLogger';

// ============================================================================
// TYPES
// ============================================================================

interface AlertThresholds {
  AUTH_FAILURE_RATE: number;
  CSRF_VIOLATION_RATE: number;
  RATE_LIMIT_VIOLATIONS: number;
  SUSPICIOUS_ACTIVITY_RATE: number;
  PAYMENT_FAILURE_COUNT: number;
  TIME_WINDOW_MS: number;
}

interface IPTrackingData {
  events: Array<{
    type: string;
    timestamp: number;
    metadata: Record<string, unknown>;
  }>;
  firstSeen: number;
  lastSeen: number;
}

interface Anomaly {
  type: string;
  severity: 'low' | 'medium' | 'high';
  count?: number;
  types?: string[];
  description: string;
}

interface AnomalyDetectionResult {
  hasAnomalies: boolean;
  anomalies: Anomaly[];
}

interface IPStatistics {
  ipAddress: string;
  firstSeen: number;
  lastSeen: number;
  totalEvents: number;
  eventCounts: Record<string, number>;
  sessionDuration: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const ALERT_THRESHOLDS: AlertThresholds = {
  // Rate of failed authentication attempts per minute
  AUTH_FAILURE_RATE: 5,
  
  // Rate of CSRF violations per minute
  CSRF_VIOLATION_RATE: 3,
  
  // Rate of rate limit violations per minute
  RATE_LIMIT_VIOLATIONS: 10,
  
  // Rate of suspicious activity events per minute
  SUSPICIOUS_ACTIVITY_RATE: 3,
  
  // Number of failed payment attempts before alert
  PAYMENT_FAILURE_COUNT: 5,
  
  // Time window for rate calculations (milliseconds)
  TIME_WINDOW_MS: 60 * 1000, // 1 minute
};

// In-memory tracking (in production, use Redis or similar)
const eventCounts = new Map<string, number[]>();
const ipTracking = new Map<string, IPTrackingData>();

// ============================================================================
// EVENT TRACKING
// ============================================================================

/**
 * Track a security event for monitoring
 * @param eventType - Type of security event
 * @param ipAddress - IP address of the request
 * @param metadata - Additional metadata
 */
export function trackSecurityEvent(
  eventType: string,
  ipAddress: string,
  metadata: Record<string, unknown> = {}
): void {
  const now = Date.now();
  const key = `${eventType}:${ipAddress}`;
  
  // Get or create event tracking
  if (!eventCounts.has(key)) {
    eventCounts.set(key, []);
  }
  
  const events = eventCounts.get(key)!;
  events.push(now);
  
  // Clean old events (outside time window)
  const cutoff = now - ALERT_THRESHOLDS.TIME_WINDOW_MS;
  const recentEvents = events.filter(timestamp => timestamp > cutoff);
  eventCounts.set(key, recentEvents);
  
  // Track IP-specific patterns
  if (!ipTracking.has(ipAddress)) {
    ipTracking.set(ipAddress, {
      events: [],
      firstSeen: now,
      lastSeen: now,
    });
  }
  
  const ipData = ipTracking.get(ipAddress)!;
  ipData.events.push({ type: eventType, timestamp: now, metadata });
  ipData.lastSeen = now;
  
  // Keep only last 100 events per IP
  if (ipData.events.length > 100) {
    ipData.events = ipData.events.slice(-100);
  }
  
  // Check for alerts
  checkAlerts(eventType, ipAddress, recentEvents.length);
}

/**
 * Check if event rate exceeds thresholds and alert
 */
async function checkAlerts(eventType: string, ipAddress: string, count: number): Promise<void> {
  let threshold: number | null = null;
  let severity: SecuritySeverity = SecuritySeverity.MEDIUM;
  
  switch (eventType) {
    case SecurityEventType.AUTH_FAILURE:
      threshold = ALERT_THRESHOLDS.AUTH_FAILURE_RATE;
      severity = SecuritySeverity.HIGH;
      break;
    case SecurityEventType.CSRF_VIOLATION:
      threshold = ALERT_THRESHOLDS.CSRF_VIOLATION_RATE;
      severity = SecuritySeverity.HIGH;
      break;
    case SecurityEventType.RATE_LIMIT_EXCEEDED:
      threshold = ALERT_THRESHOLDS.RATE_LIMIT_VIOLATIONS;
      severity = SecuritySeverity.MEDIUM;
      break;
    case SecurityEventType.SUSPICIOUS_ACTIVITY:
      threshold = ALERT_THRESHOLDS.SUSPICIOUS_ACTIVITY_RATE;
      severity = SecuritySeverity.HIGH;
      break;
  }
  
  if (threshold && count >= threshold) {
    // Log alert
    logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      severity,
      {
        alertType: 'rate_threshold_exceeded',
        eventType,
        ipAddress,
        count,
        threshold,
        timeWindow: ALERT_THRESHOLDS.TIME_WINDOW_MS,
      },
      null,
      ipAddress
    );
    
    // In production, also send to external alerting service
    if (process.env.NODE_ENV === 'production') {
      // Send to Slack if webhook is configured
      const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (slackWebhookUrl) {
        try {
          await fetch(slackWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `🚨 Security Alert: ${eventType} rate exceeded`,
              blocks: [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `*Security Alert: ${eventType} Rate Exceeded*\n\n*Count:* ${count}/${threshold}\n*IP Address:* ${ipAddress}\n*Time:* ${new Date().toISOString()}`,
                  },
                },
              ],
            }),
          }).catch(err => {
            // Don't fail if Slack webhook fails
            serverLogger.error('Failed to send Slack alert', err instanceof Error ? err : new Error(String(err)));
          });
        } catch (err) {
          serverLogger.error('Error sending Slack alert', err instanceof Error ? err : new Error(String(err)));
        }
      }
      
      // Also send to Sentry for tracking
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Sentry = require('@sentry/nextjs');
        Sentry.captureMessage('Security Alert: Rate Limit Exceeded', {
          level: 'warning',
          extra: {
            eventType,
            count,
            threshold,
            ipAddress,
          },
        });
      } catch (err) {
        // Sentry not available - log warning
        serverLogger.warn(`SECURITY ALERT: ${eventType} rate exceeded: ${count}/${threshold} from ${ipAddress}`);
      }
    } else {
      // Development: log warning
      serverLogger.warn(`SECURITY ALERT: ${eventType} rate exceeded: ${count}/${threshold} from ${ipAddress}`);
    }
  }
}

// ============================================================================
// ANOMALY DETECTION
// ============================================================================

/**
 * Detect anomalies in IP behavior
 * @param ipAddress - IP address to check
 * @returns Anomaly detection results
 */
export function detectAnomalies(ipAddress: string): AnomalyDetectionResult {
  const ipData = ipTracking.get(ipAddress);
  
  if (!ipData || ipData.events.length < 5) {
    return { hasAnomalies: false, anomalies: [] };
  }
  
  const anomalies: Anomaly[] = [];
  const now = Date.now();
  const recentEvents = ipData.events.filter(
    e => now - e.timestamp < ALERT_THRESHOLDS.TIME_WINDOW_MS
  );
  
  // Check for rapid-fire requests
  if (recentEvents.length > 20) {
    anomalies.push({
      type: 'rapid_fire_requests',
      severity: 'high',
      count: recentEvents.length,
      description: 'Unusually high number of requests in short time',
    });
  }
  
  // Check for multiple different event types (potential scanning)
  const eventTypes = new Set(recentEvents.map(e => e.type));
  if (eventTypes.size > 5) {
    anomalies.push({
      type: 'multiple_event_types',
      severity: 'medium',
      types: Array.from(eventTypes),
      description: 'Multiple different security event types from same IP',
    });
  }
  
  // Check for repeated failures
  const failures = recentEvents.filter(
    e => e.type === SecurityEventType.AUTH_FAILURE || 
         e.type === SecurityEventType.CSRF_VIOLATION
  );
  if (failures.length > 10) {
    anomalies.push({
      type: 'repeated_failures',
      severity: 'high',
      count: failures.length,
      description: 'Multiple authentication or CSRF failures',
    });
  }
  
  return {
    hasAnomalies: anomalies.length > 0,
    anomalies,
  };
}

/**
 * Get security statistics for an IP address
 * @param ipAddress - IP address
 * @returns Statistics
 */
export function getIPStatistics(ipAddress: string): IPStatistics | null {
  const ipData = ipTracking.get(ipAddress);
  
  if (!ipData) {
    return null;
  }
  
  const eventCounts: Record<string, number> = {};
  ipData.events.forEach(event => {
    eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
  });
  
  return {
    ipAddress,
    firstSeen: ipData.firstSeen,
    lastSeen: ipData.lastSeen,
    totalEvents: ipData.events.length,
    eventCounts,
    sessionDuration: ipData.lastSeen - ipData.firstSeen,
  };
}

// ============================================================================
// IP REPUTATION
// ============================================================================

/**
 * Check if an IP address should be blocked
 * @param ipAddress - IP address to check
 * @returns True if IP should be blocked
 */
export function shouldBlockIP(ipAddress: string): boolean {
  const anomalies = detectAnomalies(ipAddress);
  
  if (!anomalies.hasAnomalies) {
    return false;
  }
  
  // Block if high severity anomalies detected
  const highSeverityAnomalies = anomalies.anomalies.filter(
    a => a.severity === 'high'
  );
  
  if (highSeverityAnomalies.length >= 2) {
    logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      SecuritySeverity.CRITICAL,
      {
        action: 'ip_blocked',
        ipAddress,
        anomalies: highSeverityAnomalies,
      },
      null,
      ipAddress
    );
    
    return true;
  }
  
  return false;
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Clean up old tracking data
 * Runs periodically to prevent memory leaks
 */
export function cleanupTrackingData(): void {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  // Clean event counts
  for (const [key, events] of eventCounts.entries()) {
    const cutoff = now - ALERT_THRESHOLDS.TIME_WINDOW_MS;
    const recentEvents = events.filter(timestamp => timestamp > cutoff);
    
    if (recentEvents.length === 0) {
      eventCounts.delete(key);
    } else {
      eventCounts.set(key, recentEvents);
    }
  }
  
  // Clean IP tracking
  for (const [ip, data] of ipTracking.entries()) {
    if (now - data.lastSeen > maxAge) {
      ipTracking.delete(ip);
    }
  }
}

// Run cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupTrackingData, 60 * 60 * 1000);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  trackSecurityEvent,
  detectAnomalies,
  getIPStatistics,
  shouldBlockIP,
  cleanupTrackingData,
};
