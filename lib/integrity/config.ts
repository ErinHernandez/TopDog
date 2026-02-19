/**
 * Configuration for collusion detection system
 *
 * Centralized configuration that can be overridden via environment variables
 */

// Helper to parse env vars with defaults
function envNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Risk score weights and thresholds for post-draft analysis
 */
export const RISK_CONFIG = {
  weights: {
    location: envNumber('RISK_WEIGHT_LOCATION', 0.35),
    behavior: envNumber('RISK_WEIGHT_BEHAVIOR', 0.30),
    benefit: envNumber('RISK_WEIGHT_BENEFIT', 0.35),
  },
  thresholds: {
    urgent: envNumber('RISK_THRESHOLD_URGENT', 90),
    review: envNumber('RISK_THRESHOLD_REVIEW', 70),
    monitor: envNumber('RISK_THRESHOLD_MONITOR', 50),
  },
  locationScores: {
    both: 80,      // Same room + same IP
    within50ft: 60, // Same room only
    sameIp: 40,    // Same IP only
    multipleEventsBonus: 15,
    multipleEventsThreshold: 5,
  },
  behaviorAnalysis: {
    significantReach: -15,      // Deviation threshold for "reaching"
    significantValue: 10,       // Deviation threshold for "getting value"
    egregiousReach: -30,        // Very suspicious reach
    roundCorrelationWindow: 24, // Picks within 2 rounds
    minScoreForInclusion: 30,   // Minimum behavior/benefit score to include pair
  },
};

/**
 * Cross-draft analysis configuration
 */
export const CROSS_DRAFT_CONFIG = {
  lookbackDays: envNumber('CROSS_DRAFT_LOOKBACK_DAYS', 90),
  maxHistoryEntries: 20, // Max history items to keep per pair
  thresholds: {
    critical: {
      coLocationRate: envNumber('CRITICAL_COLOCATION_RATE', 0.8),
      minDrafts: envNumber('CRITICAL_MIN_DRAFTS', 5),
    },
    high: {
      coLocationRate: envNumber('HIGH_COLOCATION_RATE', 0.5),
      minDrafts: envNumber('HIGH_MIN_DRAFTS', 3),
      avgRiskScore: envNumber('HIGH_AVG_RISK_SCORE', 60),
    },
    medium: {
      coLocationRate: envNumber('MEDIUM_COLOCATION_RATE', 0.3),
      minDrafts: envNumber('MEDIUM_MIN_DRAFTS', 2),
      avgRiskScore: envNumber('MEDIUM_AVG_RISK_SCORE', 40),
    },
  },
};

/**
 * Admin service configuration
 */
export const ADMIN_CONFIG = {
  defaultMaxResults: 50,
  maxMaxResults: 100,
  evidenceSnapshotMaxSize: 10000, // bytes
};

/**
 * Transaction retry configuration
 */
export const TRANSACTION_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 50,
  maxDelayMs: 200,
};

/**
 * Behavior analysis configuration for PostDraftAnalyzer
 */
export const BEHAVIOR_ANALYSIS_CONFIG = {
  MIN_FLAGGED_PAIRS_FOR_FULL_ANALYSIS: 1,
  MAX_TOTAL_PAIRS_TO_ANALYZE: 20,
  MIN_SCORE_FOR_INCLUSION: 30,
};
