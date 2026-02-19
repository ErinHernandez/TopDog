/**
 * Alert Configuration for Idesaign
 * 
 * Define alert rules that trigger on metrics from:
 * - Vercel (function duration, memory, errors)
 * - Sentry (error rates, stack traces)
 * - Custom health endpoints (/api/health, /api/health/deep)
 * - External service monitoring (Stripe, Firebase, Upstash)
 * 
 * Each alert has:
 * - Detection: Metric threshold and window
 * - Routing: Which channels get notified (Slack, PagerDuty, email)
 * - Runbook: Link to response guide
 * - Severity: P1/P2/P3/P4
 */

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertChannel = 'slack' | 'pagerduty' | 'email' | 'sms' | 'webhook';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  
  // Detection configuration
  metric: string; // Metric to monitor (e.g., "error_rate", "p95_latency", "health_status")
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals'; // Comparison operator
  threshold: number; // Threshold value
  window: '1m' | '5m' | '10m' | '15m' | '30m' | '1h' | 'immediate'; // Time window for evaluation
  
  // Response configuration
  severity: AlertSeverity;
  channels: AlertChannel[];
  runbook: string; // Path to runbook section
  
  // Alert suppression
  cooldown?: number; // Minutes to wait before re-alerting (prevents spam)
  enabled: boolean;
  
  // Slack-specific customization
  slack?: {
    channel: string; // e.g., "#operations" or "#incident-critical"
    mentions?: string[]; // e.g., ["@oncall", "@tech-lead"]
    emoji?: string;
  };
}

const alertRules: AlertRule[] = [
  // =============================================================
  // CRITICAL ALERTS (P1) - Immediate response required
  // =============================================================
  
  {
    id: 'alert_001_high_error_rate',
    name: 'High Error Rate (>5%)',
    description: 'Error rate exceeds 5% over 5 minutes - critical user impact',
    metric: 'error_rate_5min',
    condition: 'greater_than',
    threshold: 5,
    window: '5m',
    severity: 'critical',
    channels: ['slack', 'pagerduty', 'email'],
    runbook: '/ops/runbooks/INCIDENT_RESPONSE.md#5-high-error-rate-5-p1p2',
    cooldown: 5,
    enabled: true,
    slack: {
      channel: '#incident-critical',
      mentions: ['@oncall', '@tech-lead'],
      emoji: '🚨'
    }
  },

  {
    id: 'alert_002_health_check_failure',
    name: 'Health Check Failed',
    description: '/api/health endpoint returns non-200 status',
    metric: 'health_check_status',
    condition: 'not_equals',
    threshold: 200,
    window: 'immediate',
    severity: 'critical',
    channels: ['slack', 'pagerduty', 'email', 'sms'],
    runbook: '/ops/runbooks/INCIDENT_RESPONSE.md#detection--triage',
    cooldown: 1,
    enabled: true,
    slack: {
      channel: '#incident-critical',
      mentions: ['@oncall', '@tech-lead', '@cto'],
      emoji: '🔥'
    }
  },

  {
    id: 'alert_003_firebase_auth_down',
    name: 'Firebase Auth Unavailable',
    description: 'Firebase authentication service unhealthy - all auth routes will fail',
    metric: 'firebase_auth_healthy',
    condition: 'equals',
    threshold: 0,
    window: '1m',
    severity: 'critical',
    channels: ['slack', 'pagerduty', 'email', 'sms'],
    runbook: '/ops/runbooks/INCIDENT_RESPONSE.md#1-firebase-auth-down-p1',
    cooldown: 2,
    enabled: true,
    slack: {
      channel: '#incident-critical',
      mentions: ['@oncall', '@tech-lead', '@cto'],
      emoji: '🔐'
    }
  },

  {
    id: 'alert_004_firestore_down',
    name: 'Firestore Database Down',
    description: 'Firestore unavailable - data read/write failures expected',
    metric: 'firestore_healthy',
    condition: 'equals',
    threshold: 0,
    window: '1m',
    severity: 'critical',
    channels: ['slack', 'pagerduty', 'email', 'sms'],
    runbook: '/ops/runbooks/INCIDENT_RESPONSE.md#graceful_degradation.md#firestore-database-critical',
    cooldown: 2,
    enabled: true,
    slack: {
      channel: '#incident-critical',
      mentions: ['@oncall', '@tech-lead', '@cto'],
      emoji: '💾'
    }
  },

  {
    id: 'alert_005_redis_down',
    name: 'Redis Connection Failure',
    description: 'Redis/Upstash unavailable - rate limiting and caching will degrade',
    metric: 'redis_healthy',
    condition: 'equals',
    threshold: 0,
    window: 'immediate',
    severity: 'critical',
    channels: ['slack', 'pagerduty'],
    runbook: '/ops/runbooks/INCIDENT_RESPONSE.md#2-redisupstash-connection-failure-p2',
    cooldown: 1,
    enabled: true,
    slack: {
      channel: '#operations',
      mentions: ['@oncall'],
      emoji: '⚠️'
    }
  },

  {
    id: 'alert_006_stripe_webhook_failures',
    name: 'Stripe Webhook Failure Rate High (>10%)',
    description: 'Stripe webhook endpoint returning errors - payments not being processed',
    metric: 'stripe_webhook_error_rate_15min',
    condition: 'greater_than',
    threshold: 10,
    window: '15m',
    severity: 'critical',
    channels: ['slack', 'pagerduty', 'email'],
    runbook: '/ops/runbooks/INCIDENT_RESPONSE.md#4-stripe-webhook-failure-p2',
    cooldown: 5,
    enabled: true,
    slack: {
      channel: '#incident-payments',
      mentions: ['@oncall', '@payments-team'],
      emoji: '💳'
    }
  },

  {
    id: 'alert_007_deployment_failure',
    name: 'Deployment Failed',
    description: 'Latest Vercel deployment failed - rollback recommended',
    metric: 'deployment_status',
    condition: 'equals',
    threshold: 0, // 0 = failed
    window: 'immediate',
    severity: 'critical',
    channels: ['slack', 'email'],
    runbook: '/ops/runbooks/DEPLOYMENT_CHECKLIST.md',
    cooldown: 2,
    enabled: true,
    slack: {
      channel: '#deployments',
      mentions: ['@oncall'],
      emoji: '❌'
    }
  },

  // =============================================================
  // WARNING ALERTS (P2) - Escalate if not resolved quickly
  // =============================================================

  {
    id: 'alert_008_p95_latency_high',
    name: 'P95 Latency Degradation (>5s)',
    description: 'P95 API latency exceeds 5 seconds - users experiencing slow responses',
    metric: 'p95_latency_ms',
    condition: 'greater_than',
    threshold: 5000,
    window: '5m',
    severity: 'warning',
    channels: ['slack'],
    runbook: '/ops/runbooks/INCIDENT_RESPONSE.md#6-memorycpu-spike---slow-responses-p2',
    cooldown: 10,
    enabled: true,
    slack: {
      channel: '#operations',
      mentions: ['@oncall'],
      emoji: '⏱️'
    }
  },

  {
    id: 'alert_009_rate_limit_429_spike',
    name: 'Rate Limit 429 Spike (>20%)',
    description: 'More than 20% of requests being rate limited - possible DDoS or legitimate traffic surge',
    metric: 'rate_limit_429_rate_10min',
    condition: 'greater_than',
    threshold: 20,
    window: '10m',
    severity: 'warning',
    channels: ['slack', 'pagerduty'],
    runbook: '/ops/runbooks/INCIDENT_RESPONSE.md#7-ddosabuse-attack-p1p2',
    cooldown: 5,
    enabled: true,
    slack: {
      channel: '#operations',
      mentions: ['@oncall'],
      emoji: '🚫'
    }
  },

  {
    id: 'alert_010_ai_circuit_breaker_open',
    name: 'AI Provider Circuit Breaker Open',
    description: 'AI provider (OpenAI/Stability/Replicate) unavailable - fallover activated',
    metric: 'ai_provider_circuit_breaker_state',
    condition: 'equals',
    threshold: 1, // 1 = open (failed)
    window: 'immediate',
    severity: 'warning',
    channels: ['slack'],
    runbook: '/ops/runbooks/INCIDENT_RESPONSE.md#3-ai-provider-outage-p2',
    cooldown: 5,
    enabled: true,
    slack: {
      channel: '#operations',
      mentions: ['@oncall'],
      emoji: '🤖'
    }
  },

  {
    id: 'alert_011_memory_usage_high',
    name: 'Memory Usage High (>80%)',
    description: 'Function memory usage exceeds 80% - potential OOM and timeout risk',
    metric: 'memory_usage_percent',
    condition: 'greater_than',
    threshold: 80,
    window: '5m',
    severity: 'warning',
    channels: ['slack'],
    runbook: '/ops/runbooks/INCIDENT_RESPONSE.md#6-memorycpu-spike---slow-responses-p2',
    cooldown: 10,
    enabled: true,
    slack: {
      channel: '#operations',
      mentions: ['@oncall']
    }
  },

  {
    id: 'alert_012_firestore_cache_hit_low',
    name: 'Firestore Cache Hit Rate Low (<50%)',
    description: 'Cache hit rate below 50% - excessive database queries, increased latency/cost',
    metric: 'firestore_cache_hit_rate',
    condition: 'less_than',
    threshold: 50,
    window: '30m',
    severity: 'warning',
    channels: ['slack'],
    runbook: '/ops/runbooks/GRACEFUL_DEGRADATION.md#redisupstash-high-priority',
    cooldown: 30,
    enabled: true,
    slack: {
      channel: '#operations',
      mentions: ['@oncall']
    }
  },

  {
    id: 'alert_013_write_queue_depth',
    name: 'Write Queue Depth High (>100)',
    description: 'More than 100 writes queued - database or Firestore struggling',
    metric: 'write_queue_depth',
    condition: 'greater_than',
    threshold: 100,
    window: '5m',
    severity: 'warning',
    channels: ['slack'],
    runbook: '/ops/runbooks/GRACEFUL_DEGRADATION.md#firestore-database-critical',
    cooldown: 10,
    enabled: true,
    slack: {
      channel: '#operations',
      mentions: ['@oncall']
    }
  },

  {
    id: 'alert_014_stripe_payment_queue',
    name: 'Stripe Payment Queue Growing (>10)',
    description: 'More than 10 payments queued for processing - Stripe API issues',
    metric: 'stripe_payment_queue_depth',
    condition: 'greater_than',
    threshold: 10,
    window: '15m',
    severity: 'warning',
    channels: ['slack'],
    runbook: '/ops/runbooks/GRACEFUL_DEGRADATION.md#stripe-payment-processing-critical',
    cooldown: 10,
    enabled: true,
    slack: {
      channel: '#incident-payments',
      mentions: ['@oncall', '@payments-team']
    }
  },

  // =============================================================
  // INFORMATIONAL ALERTS (P3/P4) - Non-urgent issues
  // =============================================================

  {
    id: 'alert_015_ssl_cert_expiry',
    name: 'SSL Certificate Expiring Soon (<14 days)',
    description: 'SSL certificate expires in less than 14 days - schedule renewal',
    metric: 'ssl_cert_days_remaining',
    condition: 'less_than',
    threshold: 14,
    window: '1h', // Check once per hour
    severity: 'info',
    channels: ['email'],
    runbook: '/ops/runbooks/DEPLOYMENT_CHECKLIST.md',
    cooldown: 1440, // Only alert once per day
    enabled: true
  },

  {
    id: 'alert_016_sentry_new_error',
    name: 'New Error Pattern Detected',
    description: 'Sentry detected a new error pattern (first 10 occurrences)',
    metric: 'sentry_new_error_count',
    condition: 'greater_than',
    threshold: 0,
    window: 'immediate',
    severity: 'info',
    channels: ['slack'],
    runbook: '/ops/runbooks/INCIDENT_RESPONSE.md#detection--triage',
    cooldown: 5,
    enabled: true,
    slack: {
      channel: '#errors',
      emoji: '📝'
    }
  },

  {
    id: 'alert_017_firestore_cost_spike',
    name: 'Firestore Cost Spike (2x baseline)',
    description: 'Firestore costs increased 2x - possible inefficient queries or cache miss',
    metric: 'firestore_cost_ratio_1h',
    condition: 'greater_than',
    threshold: 2,
    window: '1h',
    severity: 'info',
    channels: ['slack', 'email'],
    runbook: '/ops/runbooks/GRACEFUL_DEGRADATION.md#firestore-database-critical',
    cooldown: 60,
    enabled: true,
    slack: {
      channel: '#operations'
    }
  }
];

// =============================================================
// Alert Routing Configuration
// =============================================================

export const alertChannels = {
  slack: {
    enabled: true,
    webhookUrl: process.env.SLACK_WEBHOOK_CRITICAL,
    defaultChannel: '#incidents',
    retryAttempts: 3,
    retryDelayMs: 1000
  },
  
  pagerduty: {
    enabled: true,
    integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY,
    severity: {
      critical: 'critical',
      warning: 'warning',
      info: 'info'
    }
  },
  
  email: {
    enabled: true,
    provider: 'sendgrid',
    recipients: {
      critical: ['oncall@idesaign.io', 'tech-lead@idesaign.io'],
      warning: ['oncall@idesaign.io'],
      info: ['team@idesaign.io']
    }
  },
  
  sms: {
    enabled: true,
    provider: 'twilio',
    recipients: {
      critical: process.env.ONCALL_PHONE_NUMBERS?.split(',') || [],
      warning: [],
      info: []
    }
  },
  
  webhook: {
    enabled: true,
    endpoints: {
      critical: process.env.WEBHOOK_CRITICAL_URL,
      warning: process.env.WEBHOOK_WARNING_URL
    }
  }
};

// =============================================================
// Alert Severity Mapping
// =============================================================

export const severitySettings = {
  critical: {
    responseTime: '15 minutes',
    escalation: 'L1 → L2 (5min) → L3 (15min)',
    channels: ['slack', 'pagerduty', 'email', 'sms'],
    requiresIncidentTicket: true,
    requiresStatusPageUpdate: true,
    autoEscalationMinutes: 5
  },
  
  warning: {
    responseTime: '1 hour',
    escalation: 'L1 → L2 (30min)',
    channels: ['slack', 'pagerduty', 'email'],
    requiresIncidentTicket: true,
    requiresStatusPageUpdate: false,
    autoEscalationMinutes: 30
  },
  
  info: {
    responseTime: '4 hours',
    escalation: 'L1 only',
    channels: ['slack', 'email'],
    requiresIncidentTicket: false,
    requiresStatusPageUpdate: false,
    autoEscalationMinutes: 240
  }
};

// =============================================================
// Export Configuration
// =============================================================

export default alertRules;

// Helper function to export for consumption by alert system
export function getAlertRules(): AlertRule[] {
  return alertRules.filter(rule => rule.enabled);
}

export function getAlertsByChannel(channel: AlertChannel): AlertRule[] {
  return alertRules.filter(rule => rule.channels.includes(channel) && rule.enabled);
}

export function getAlertsBySeverity(severity: AlertSeverity): AlertRule[] {
  return alertRules.filter(rule => rule.severity === severity && rule.enabled);
}

export function getAlertById(id: string): AlertRule | undefined {
  return alertRules.find(rule => rule.id === id);
}

// Example usage:
/*
const alerts = getAlertRules();
const criticalAlerts = getAlertsBySeverity('critical');
const slackAlerts = getAlertsByChannel('slack');

// Integration with monitoring system:
for (const alert of alerts) {
  monitoringSystem.registerAlert({
    name: alert.name,
    metric: alert.metric,
    condition: alert.condition,
    threshold: alert.threshold,
    window: alert.window,
    onTriggered: async () => {
      await notifyChannels(alert.channels, alert);
      if (severitySettings[alert.severity].requiresIncidentTicket) {
        await createIncidentTicket(alert);
      }
    },
    cooldown: alert.cooldown || 5
  });
}
*/
