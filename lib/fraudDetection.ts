/**
 * Advanced Fraud Detection System for Payment Processing
 */

import { getPaymentMethodsByLocation } from './paymentMethodConfig';
import { RiskScoring, FRAUD_RULES, SecurityLogger, type RiskScoreResult } from './paymentSecurity';

// ============================================================================
// TYPES
// ============================================================================

export interface Transaction {
  id: string;
  amount: number;
  processor: string;
  userId?: string;
  [key: string]: unknown;
}

export interface User {
  id: string;
  registrationCountry: string;
  transactionsLastHour?: number;
  failedAttemptsLastHour?: number;
  deviceCount?: number;
  [key: string]: unknown;
}

export interface TransactionContext {
  ipAddress?: string;
  deviceId?: string;
  country: string;
  newDevice?: boolean;
  sessionId?: string;
  deviceFingerprint?: DeviceFingerprint;
  typingPattern?: TypingPattern;
  mousePattern?: MousePattern;
  sessionDuration?: number;
  [key: string]: unknown;
}

export interface DeviceFingerprint {
  browser?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  [key: string]: unknown;
}

export interface TypingPattern {
  avgSpeed: number;
  [key: string]: unknown;
}

export interface MousePattern {
  straightLines: number;
  perfectCurves: number;
  [key: string]: unknown;
}

export interface FraudResult {
  action: 'approve' | 'block' | 'review' | 'challenge' | 'monitor' | 'manual_review';
  score: number;
  factors: string[];
  method: string;
  timestamp: string;
  metadata?: {
    confidence?: string;
    breakdown?: {
      risk: number;
      ml: number;
      behavior: number;
    };
    requiresReview?: boolean;
    additionalVerification?: boolean;
  };
}

export interface BlacklistResult {
  blocked: boolean;
  reasons: string[];
}

export interface FraudRulesResult {
  blocked: boolean;
  score: number;
  reasons: string[];
}

export interface MLResult {
  score: number;
  factors: string[];
  features: Record<string, number>;
  recommendation: 'approve' | 'review' | 'decline';
}

export interface BehaviorResult {
  score: number;
  factors: string[];
  recommendation: 'approve' | 'review';
}

export interface PatternViolations {
  violations: string[];
  score: number;
}

export interface CombinedScore {
  score: number;
  factors: string[];
  breakdown: {
    risk: number;
    ml: number;
    behavior: number;
  };
}

export interface UserSession {
  userId: string;
  transactions: Array<{
    id: string;
    amount: number;
    processor: string;
    timestamp: number;
    fraudScore: number;
    action: string;
  }>;
  countries: Set<string>;
  devices: Set<string>;
  startTime: number;
}

export interface DeviceFingerprintData {
  [key: string]: unknown;
  lastSeen: number;
  transactionCount: number;
  riskScore: number;
}

export interface TransactionHistoryRecord {
  transaction: Transaction;
  context: TransactionContext;
  decision: FraudResult;
  timestamp: number;
}

export interface FraudStats {
  totalTransactions: number;
  blockedTransactions: number;
  reviewTransactions: number;
  blockRate: number;
  reviewRate: number;
  timestamp: string;
}

// ============================================================================
// FRAUD DETECTION ENGINE
// ============================================================================

class FraudDetectionEngine {
  private userSessions: Map<string, UserSession>;
  private deviceFingerprints: Map<string, DeviceFingerprintData>;
  private transactionHistory: Map<string, TransactionHistoryRecord[]>;
  private blacklistedIPs: Set<string>;
  private blacklistedDevices: Set<string>;
  private suspiciousPatterns: Map<string, unknown>;
  private mlWeights: {
    amount: number;
    velocity: number;
    geography: number;
    device: number;
    time: number;
  };

  constructor() {
    this.userSessions = new Map(); // Track user behavior
    this.deviceFingerprints = new Map(); // Track device information
    this.transactionHistory = new Map(); // Track transaction patterns
    this.blacklistedIPs = new Set();
    this.blacklistedDevices = new Set();
    this.suspiciousPatterns = new Map();
    
    // Machine learning model weights (simplified)
    this.mlWeights = {
      amount: 0.25,
      velocity: 0.30,
      geography: 0.20,
      device: 0.15,
      time: 0.10
    };
    
    this.initializeBlacklists();
  }
  
  private initializeBlacklists(): void {
    // Initialize with known bad actors (in production, load from database)
    this.blacklistedIPs.add('192.168.1.100'); // Example
    this.blacklistedDevices.add('suspicious-device-id');
  }
  
  async analyzeTransaction(
    transaction: Transaction,
    user: User,
    context: TransactionContext
  ): Promise<FraudResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: Quick blacklist checks
      const blacklistResult = this.checkBlacklists(context);
      if (blacklistResult.blocked) {
        return this.createFraudResult('block', 100, blacklistResult.reasons, 'immediate_block');
      }
      
      // Step 2: Real-time fraud rules
      const rulesResult = await this.applyFraudRules(transaction, user, context);
      if (rulesResult.blocked) {
        return this.createFraudResult('block', rulesResult.score, rulesResult.reasons, 'rules_violation');
      }
      
      // Step 3: Risk scoring
      const riskResult = RiskScoring.calculateRiskScore(transaction, user, context);
      
      // Step 4: Machine learning analysis
      const mlResult = this.applyMachineLearning(transaction, user, context);
      
      // Step 5: Behavioral analysis
      const behaviorResult = this.analyzeBehavior(transaction, user, context);
      
      // Step 6: Combine all scores
      const finalScore = this.combineScores([riskResult, mlResult, behaviorResult]);
      
      // Step 7: Make decision
      const decision = this.makeDecision(finalScore);
      
      // Step 8: Update tracking data
      this.updateTrackingData(transaction, user, context, decision);
      
      // Step 9: Log results
      this.logFraudAnalysis(transaction, decision, Date.now() - startTime);
      
      return decision;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      SecurityLogger.logSecurityEvent(
        'fraud_detection_error',
        'high',
        { error: errorMessage, transaction: transaction.id }
      );
      
      // Fail safe - allow transaction but flag for review
      return this.createFraudResult('review', 50, ['system_error'], 'error_fallback');
    }
  }
  
  private checkBlacklists(context: TransactionContext): BlacklistResult {
    const reasons: string[] = [];
    
    if (context.ipAddress && this.blacklistedIPs.has(context.ipAddress)) {
      reasons.push('blacklisted_ip');
    }
    
    if (context.deviceId && this.blacklistedDevices.has(context.deviceId)) {
      reasons.push('blacklisted_device');
    }
    
    return {
      blocked: reasons.length > 0,
      reasons
    };
  }
  
  private async applyFraudRules(
    transaction: Transaction,
    user: User,
    context: TransactionContext
  ): Promise<FraudRulesResult> {
    const violations: string[] = [];
    let score = 0;
    
    // Velocity checks
    const userTransactions = this.getUserRecentTransactions(user.id);
    const recentCount = userTransactions.filter(t => 
      Date.now() - (t.timestamp as number) < 60000 // Last minute
    ).length;
    
    if (recentCount > FRAUD_RULES.velocity_checks.max_transactions_per_minute) {
      violations.push('velocity_exceeded');
      score += 40;
    }
    
    // Amount checks
    const hourlyAmount = userTransactions
      .filter(t => Date.now() - (t.timestamp as number) < 3600000) // Last hour
      .reduce((sum, t) => sum + (t.amount as number), 0);
    
    if (hourlyAmount + transaction.amount > FRAUD_RULES.velocity_checks.max_amount_per_hour) {
      violations.push('amount_limit_exceeded');
      score += 35;
    }
    
    // Geographic checks
    if (FRAUD_RULES.geographic_anomalies.enabled) {
      const countryChanges = this.getCountryChangesToday(user.id);
      if (countryChanges > FRAUD_RULES.geographic_anomalies.max_country_changes_per_day) {
        violations.push('excessive_country_changes');
        score += 30;
      }
    }
    
    // Pattern checks
    const patternViolations = this.checkTransactionPatterns(transaction, userTransactions);
    violations.push(...patternViolations.violations);
    score += patternViolations.score;
    
    return {
      blocked: score > 80, // Block if score too high
      score,
      reasons: violations
    };
  }
  
  private applyMachineLearning(
    transaction: Transaction,
    user: User,
    context: TransactionContext
  ): MLResult {
    // Simplified ML model (in production, use real ML service)
    let mlScore = 0;
    const features: Record<string, number> = {};
    
    // Amount feature
    features.amount = Math.min(transaction.amount / 10000, 1); // Normalize to 0-1
    mlScore += features.amount * this.mlWeights.amount * 100;
    
    // Velocity feature
    const recentTransactions = this.getUserRecentTransactions(user.id);
    features.velocity = Math.min(recentTransactions.length / 10, 1);
    mlScore += features.velocity * this.mlWeights.velocity * 100;
    
    // Geography feature
    features.geography = context.country !== user.registrationCountry ? 1 : 0;
    mlScore += features.geography * this.mlWeights.geography * 100;
    
    // Device feature
    features.device = context.newDevice ? 1 : 0;
    mlScore += features.device * this.mlWeights.device * 100;
    
    // Time feature
    const hour = new Date().getHours();
    features.time = (hour >= 2 && hour <= 6) ? 1 : 0;
    mlScore += features.time * this.mlWeights.time * 100;
    
    return {
      score: Math.min(mlScore, 100),
      factors: ['ml_analysis'],
      features,
      recommendation: mlScore > 70 ? 'decline' : mlScore > 40 ? 'review' : 'approve'
    };
  }
  
  private analyzeBehavior(
    transaction: Transaction,
    user: User,
    context: TransactionContext
  ): BehaviorResult {
    const behaviorScore = 0;
    const factors: string[] = [];
    
    // Check typing patterns (if available)
    if (context.typingPattern) {
      const normalPattern = this.getUserTypingPattern(user.id);
      if (normalPattern && this.isTypingPatternAnomalous(context.typingPattern, normalPattern)) {
        factors.push('anomalous_typing');
      }
    }
    
    // Check mouse movement patterns
    if (context.mousePattern) {
      if (this.isBotLikeMouseMovement(context.mousePattern)) {
        factors.push('bot_like_behavior');
      }
    }
    
    // Check session duration
    const sessionDuration = context.sessionDuration || 0;
    if (sessionDuration < 30000) { // Less than 30 seconds
      factors.push('rushed_transaction');
    }
    
    return {
      score: factors.length * 15, // 15 points per behavioral anomaly
      factors,
      recommendation: factors.length > 2 ? 'review' : 'approve'
    };
  }
  
  private checkTransactionPatterns(
    transaction: Transaction,
    userTransactions: Transaction[]
  ): PatternViolations {
    const violations: string[] = [];
    let score = 0;
    
    // Check for round number patterns
    const roundNumbers = userTransactions.filter(t => (t.amount as number) % 100 === 0).length;
    const totalTransactions = userTransactions.length;
    
    if (totalTransactions > 5 && roundNumbers / totalTransactions > FRAUD_RULES.transaction_patterns.round_number_threshold) {
      violations.push('suspicious_round_numbers');
      score += 25;
    }
    
    // Check for rapid succession
    const lastTransaction = userTransactions[userTransactions.length - 1];
    if (lastTransaction && Date.now() - (lastTransaction.timestamp as number) < 30000) {
      violations.push('rapid_succession');
      score += 20;
    }
    
    // Check for duplicate amounts
    const duplicateAmounts = userTransactions.filter(t => (t.amount as number) === transaction.amount).length;
    if (duplicateAmounts >= FRAUD_RULES.transaction_patterns.duplicate_amount_threshold) {
      violations.push('duplicate_amounts');
      score += 15;
    }
    
    return { violations, score };
  }
  
  private combineScores(results: [RiskScoreResult, MLResult, BehaviorResult]): CombinedScore {
    const weights = {
      risk: 0.4,
      ml: 0.35,
      behavior: 0.25
    };
    
    const combinedScore = 
      (results[0].score * weights.risk) +
      (results[1].score * weights.ml) +
      (results[2].score * weights.behavior);
    
    const allFactors = results.flatMap(r => r.factors || []);
    
    return {
      score: Math.min(combinedScore, 100),
      factors: [...new Set(allFactors)], // Remove duplicates
      breakdown: {
        risk: results[0].score,
        ml: results[1].score,
        behavior: results[2].score
      }
    };
  }
  
  private makeDecision(scoreResult: CombinedScore): FraudResult {
    const { score, factors, breakdown } = scoreResult;
    
    let action: FraudResult['action'];
    let confidence: string;
    
    if (score >= 90) {
      action = 'block';
      confidence = 'high';
    } else if (score >= 70) {
      action = 'manual_review';
      confidence = 'high';
    } else if (score >= 50) {
      action = 'challenge'; // Require additional verification
      confidence = 'medium';
    } else if (score >= 30) {
      action = 'monitor'; // Allow but watch closely
      confidence = 'medium';
    } else {
      action = 'approve';
      confidence = 'high';
    }
    
    return this.createFraudResult(action, score, factors, 'comprehensive_analysis', {
      confidence,
      breakdown,
      requiresReview: action === 'manual_review',
      additionalVerification: action === 'challenge'
    });
  }
  
  private createFraudResult(
    action: FraudResult['action'],
    score: number,
    factors: string[],
    method: string,
    metadata: FraudResult['metadata'] = {}
  ): FraudResult {
    return {
      action,
      score,
      factors,
      method,
      timestamp: new Date().toISOString(),
      metadata
    };
  }
  
  private updateTrackingData(
    transaction: Transaction,
    user: User,
    context: TransactionContext,
    decision: FraudResult
  ): void {
    // Update user session data
    const sessionKey = `${user.id}_${context.sessionId || 'default'}`;
    const session = this.userSessions.get(sessionKey) || {
      userId: user.id,
      transactions: [],
      countries: new Set<string>(),
      devices: new Set<string>(),
      startTime: Date.now()
    };
    
    session.transactions.push({
      id: transaction.id,
      amount: transaction.amount,
      processor: transaction.processor,
      timestamp: Date.now(),
      fraudScore: decision.score,
      action: decision.action
    });
    
    session.countries.add(context.country);
    if (context.deviceId) {
      session.devices.add(context.deviceId);
    }
    
    this.userSessions.set(sessionKey, session);
    
    // Update device fingerprint
    if (context.deviceFingerprint && context.deviceId) {
      this.deviceFingerprints.set(context.deviceId, {
        ...context.deviceFingerprint,
        lastSeen: Date.now(),
        transactionCount: (this.deviceFingerprints.get(context.deviceId)?.transactionCount || 0) + 1,
        riskScore: decision.score
      });
    }
    
    // Update transaction history
    const userHistory = this.transactionHistory.get(user.id) || [];
    userHistory.push({
      transaction,
      context,
      decision,
      timestamp: Date.now()
    });
    
    // Keep only last 100 transactions per user
    if (userHistory.length > 100) {
      userHistory.splice(0, userHistory.length - 100);
    }
    
    this.transactionHistory.set(user.id, userHistory);
  }
  
  private logFraudAnalysis(transaction: Transaction, decision: FraudResult, processingTime: number): void {
    const severity: 'low' | 'medium' | 'high' | 'critical' = decision.action === 'block' ? 'high' : 
                    decision.action === 'manual_review' ? 'medium' : 'low';
    
    SecurityLogger.logSecurityEvent(
      'fraud_analysis_completed',
      severity,
      {
        transactionId: transaction.id,
        userId: transaction.userId,
        action: decision.action,
        score: decision.score,
        factors: decision.factors,
        processingTime,
        processor: transaction.processor
      }
    );
  }
  
  // Helper methods
  private getUserRecentTransactions(userId: string): Transaction[] {
    const history = this.transactionHistory.get(userId) || [];
    const oneHourAgo = Date.now() - 3600000;
    return history
      .filter(h => h.timestamp > oneHourAgo)
      .map(h => h.transaction);
  }
  
  private getCountryChangesToday(userId: string): number {
    const history = this.transactionHistory.get(userId) || [];
    const oneDayAgo = Date.now() - 86400000;
    const countries = new Set<string>();
    
    history
      .filter(h => h.timestamp > oneDayAgo)
      .forEach(h => countries.add(h.context.country));
    
    return countries.size;
  }
  
  private getUserTypingPattern(userId: string): TypingPattern | null {
    // In production, load from user profile
    return null;
  }
  
  private isTypingPatternAnomalous(current: TypingPattern, normal: TypingPattern): boolean {
    // Compare typing patterns (simplified)
    return Math.abs(current.avgSpeed - normal.avgSpeed) > 50;
  }
  
  private isBotLikeMouseMovement(mousePattern: MousePattern): boolean {
    // Detect bot-like mouse movements (simplified)
    return mousePattern.straightLines > 0.8 || mousePattern.perfectCurves > 0.5;
  }
  
  // Public API methods
  addToBlacklist(type: 'ip' | 'device', value: string): void {
    switch (type) {
      case 'ip':
        this.blacklistedIPs.add(value);
        break;
      case 'device':
        this.blacklistedDevices.add(value);
        break;
    }
    
    SecurityLogger.logSecurityEvent(
      'blacklist_updated',
      'medium',
      { type, value }
    );
  }
  
  removeFromBlacklist(type: 'ip' | 'device', value: string): void {
    switch (type) {
      case 'ip':
        this.blacklistedIPs.delete(value);
        break;
      case 'device':
        this.blacklistedDevices.delete(value);
        break;
    }
    
    SecurityLogger.logSecurityEvent(
      'blacklist_removed',
      'low',
      { type, value }
    );
  }
  
  getFraudStats(): FraudStats {
    const now = Date.now();
    const oneDay = 86400000;
    
    let totalTransactions = 0;
    let blockedTransactions = 0;
    let reviewTransactions = 0;
    
    this.transactionHistory.forEach(history => {
      history.forEach(record => {
        if (now - record.timestamp < oneDay) {
          totalTransactions++;
          if (record.decision.action === 'block') blockedTransactions++;
          if (record.decision.action === 'manual_review') reviewTransactions++;
        }
      });
    });
    
    return {
      totalTransactions,
      blockedTransactions,
      reviewTransactions,
      blockRate: totalTransactions > 0 ? (blockedTransactions / totalTransactions) * 100 : 0,
      reviewRate: totalTransactions > 0 ? (reviewTransactions / totalTransactions) * 100 : 0,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const fraudDetectionEngine = new FraudDetectionEngine();

export default FraudDetectionEngine;
