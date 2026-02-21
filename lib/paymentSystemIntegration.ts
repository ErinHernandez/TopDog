/**
 * Payment System Integration - Main orchestrator for secure 31-processor payment system
 */

import { createScopedLogger } from './clientLogger';
import { fraudDetectionEngine, FraudResult } from './fraudDetection';
import { paymentHealthMonitor } from './paymentHealthMonitor';
import {
  getPaymentMethodsByLocation,
  getOrderedPaymentMethods,
  type PaymentMethodId,
} from './paymentMethodConfig';
import { WebhookSecurity, RiskScoring, SecurityLogger, RATE_LIMITS } from './paymentSecurity';

const logger = createScopedLogger('[PaymentSystem]');

// ============================================================================
// TYPES
// ============================================================================

export interface User {
  id: string;
  [key: string]: unknown;
}

export interface Transaction {
  amount: number;
  currency?: string;
  [key: string]: unknown;
}

export interface PaymentContext {
  country: string;
  [key: string]: unknown;
}

export interface PaymentRequest {
  transaction: Transaction;
  user: User;
  context: PaymentContext;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

export interface RateLimiter {
  requests: number[];
  lastReset: number;
}

export interface ActiveTransaction {
  processor: string;
  startTime: number;
  fraudScore: number;
  user: string;
}

export interface PaymentResult {
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  processorResponse: {
    id: string;
    status: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  processor?: string;
  fraudResult?: FraudResult;
  processingTime?: number;
  error?: string;
  retryAfter?: number;
  [key: string]: unknown;
}

export interface WebhookResult {
  success: boolean;
  error?: string;
}

export interface WebhookEvent {
  type: string;
  id: string;
  [key: string]: unknown;
}

export interface SystemStatus {
  initialized: boolean;
  processors: {
    total: number;
    healthy: number;
    unhealthy: number;
    healthPercentage: number;
  };
  fraud: {
    totalTransactions: number;
    blockedTransactions: number;
    blockRate: number;
  };
  activeTransactions: number;
  timestamp: string;
}

// ============================================================================
// CLASS
// ============================================================================

class PaymentSystemOrchestrator {
  private isInitialized: boolean = false;
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private processorFailover: Map<string, unknown> = new Map();
  private activeTransactions: Map<string, ActiveTransaction> = new Map();

  constructor() {
    this.initialize();
  }

  async initialize(): Promise<void> {
    try {
      logger.debug('Initializing Payment System');

      // Initialize rate limiters for all processors
      this.initializeRateLimiters();

      // Start health monitoring
      paymentHealthMonitor.startMonitoring();

      // Initialize fraud detection
      logger.debug('Fraud detection engine ready');

      // Set up webhook security
      logger.debug('Webhook security configured');

      this.isInitialized = true;

      SecurityLogger.logSecurityEvent('payment_system_initialized', 'medium', {
        processors: Object.keys(RATE_LIMITS).length,
        features: ['health_monitoring', 'fraud_detection', 'rate_limiting', 'webhook_security'],
      });

      logger.debug('Payment System fully initialized', { processorCount: 31 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        'Payment System initialization failed',
        error instanceof Error ? error : new Error(errorMessage),
      );
      SecurityLogger.logSecurityEvent('payment_system_init_failed', 'critical', {
        error: errorMessage,
      });
    }
  }

  private initializeRateLimiters(): void {
    Object.keys(RATE_LIMITS).forEach(processor => {
      this.rateLimiters.set(processor, {
        requests: [],
        lastReset: Date.now(),
      });
    });
  }

  async processPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    const transactionId = this.generateTransactionId();
    const startTime = Date.now();

    try {
      // Step 1: Validate request
      const validation = this.validatePaymentRequest(paymentRequest);
      if (!validation.valid) {
        throw new Error(`Invalid payment request: ${validation.errors.join(', ')}`);
      }

      // Step 2: Select optimal processor (needed for fraud detection)
      let processor = await this.selectOptimalProcessor(paymentRequest);

      // Step 3: Fraud detection
      // Transform Transaction to match fraudDetection.Transaction interface
      const { amount, id, ...restTransaction } = paymentRequest.transaction;
      const fraudTransaction: import('./fraudDetection').Transaction = {
        id: transactionId,
        amount: amount,
        processor: processor,
        userId: paymentRequest.user.id,
        ...restTransaction,
      };
      // Transform User to match fraudDetection.User interface
      const { id: userId, ...restUser } = paymentRequest.user;
      const fraudUser: import('./fraudDetection').User = {
        id: userId,
        registrationCountry: (paymentRequest.context.country as string) || 'US',
        ...restUser,
      };
      const fraudResult = await fraudDetectionEngine.analyzeTransaction(
        fraudTransaction,
        fraudUser,
        paymentRequest.context as import('./fraudDetection').TransactionContext,
      );

      if (fraudResult.action === 'block') {
        SecurityLogger.logSecurityEvent('transaction_blocked_fraud', 'high', {
          transactionId,
          fraudScore: fraudResult.score,
          factors: fraudResult.factors,
        });

        return {
          success: false,
          error: 'Transaction blocked for security reasons',
          transactionId,
          fraudResult,
        };
      }

      // Step 4: Check rate limits
      const rateLimitResult = this.checkRateLimit(processor);
      if (!rateLimitResult.allowed) {
        return this.handleRateLimitExceeded(processor, transactionId);
      }

      // Step 5: Check processor health
      const healthStatus = paymentHealthMonitor.getHealthStatus();
      const processorKey = processor as keyof typeof healthStatus;
      if (!healthStatus[processorKey]?.healthy) {
        const fallbackProcessor = await this.selectFallbackProcessor(paymentRequest, processor);
        if (!fallbackProcessor) {
          throw new Error('No healthy processors available');
        }
        processor = fallbackProcessor;
      }

      // Step 6: Process payment
      this.activeTransactions.set(transactionId, {
        processor,
        startTime,
        fraudScore: fraudResult.score,
        user: paymentRequest.user.id,
      });

      const paymentResult = await this.executePayment(processor, paymentRequest, transactionId);

      // Step 7: Log success
      SecurityLogger.logSecurityEvent('payment_processed_successfully', 'low', {
        transactionId,
        processor,
        amount: paymentRequest.transaction.amount,
        processingTime: Date.now() - startTime,
        fraudScore: fraudResult.score,
      });

      return {
        success: true,
        transactionId,
        processor,
        fraudResult,
        processingTime: Date.now() - startTime,
        ...paymentResult,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      SecurityLogger.logSecurityEvent('payment_processing_error', 'high', {
        transactionId,
        error: errorMessage,
        processingTime: Date.now() - startTime,
      });

      return {
        success: false,
        error: errorMessage,
        transactionId,
        processingTime: Date.now() - startTime,
      };
    } finally {
      this.activeTransactions.delete(transactionId);
    }
  }

  private async selectOptimalProcessor(paymentRequest: PaymentRequest): Promise<string> {
    const { user, transaction, context } = paymentRequest;

    // Get location-based processor ordering
    const orderedProcessors = getOrderedPaymentMethods(context.country) as string[];

    // Filter by transaction requirements
    const suitableProcessors = orderedProcessors.filter(processor => {
      const limits = RATE_LIMITS[processor as keyof typeof RATE_LIMITS];
      return limits && transaction.amount >= 1 && transaction.amount <= 50000; // Basic limits
    });

    // Check health status and select first healthy processor
    const healthStatus = paymentHealthMonitor.getHealthStatus();

    for (const processor of suitableProcessors) {
      const processorKey = processor as keyof typeof healthStatus;
      if (healthStatus[processorKey]?.healthy) {
        return processor;
      }
    }

    // Fallback to core global processors
    const coreProcessors = ['stripe', 'paypal', 'adyen'];
    for (const processor of coreProcessors) {
      const processorKey = processor as keyof typeof healthStatus;
      if (healthStatus[processorKey]?.healthy) {
        return processor;
      }
    }

    throw new Error('No healthy processors available');
  }

  private async selectFallbackProcessor(
    paymentRequest: PaymentRequest,
    failedProcessor: string,
  ): Promise<string | null> {
    const { context } = paymentRequest;
    const orderedProcessors = getOrderedPaymentMethods(context.country);
    const healthStatus = paymentHealthMonitor.getHealthStatus();

    // Find next healthy processor in the ordered list
    const failedIndex = orderedProcessors.indexOf(failedProcessor as PaymentMethodId);
    const remainingProcessors = orderedProcessors.slice(failedIndex + 1);

    for (const processor of remainingProcessors) {
      const processorKey = processor as keyof typeof healthStatus;
      if (healthStatus[processorKey]?.healthy) {
        SecurityLogger.logSecurityEvent('processor_failover', 'medium', {
          from: failedProcessor,
          to: processor,
        });
        return processor;
      }
    }

    return null;
  }

  private checkRateLimit(processor: string): RateLimitResult {
    const limits = RATE_LIMITS[processor];
    const limiter = this.rateLimiters.get(processor);

    if (!limits || !limiter) {
      return { allowed: true };
    }

    const now = Date.now();
    const windowMs = this.parseTimeWindow(limits.window);

    // Clean old requests
    limiter.requests = limiter.requests.filter(time => now - time < windowMs);

    // Check if under limit
    if (limiter.requests.length < limits.requests) {
      limiter.requests.push(now);
      return { allowed: true };
    }

    return {
      allowed: false,
      retryAfter: Math.ceil((limiter.requests[0]! + windowMs - now) / 1000),
    };
  }

  private parseTimeWindow(window: string): number {
    const match = window.match(/^(\d+)([smh])$/);
    if (!match) return 60000; // Default 1 minute

    const value = parseInt(match[1]!, 10);
    const unit = match[2]!;

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      default:
        return 60000;
    }
  }

  private handleRateLimitExceeded(processor: string, transactionId: string): PaymentResponse {
    SecurityLogger.logSecurityEvent('rate_limit_exceeded', 'medium', { processor, transactionId });

    return {
      success: false,
      error: 'Rate limit exceeded',
      transactionId,
      retryAfter: 60, // seconds
    };
  }

  private async executePayment(
    processor: string,
    paymentRequest: PaymentRequest,
    transactionId: string,
  ): Promise<PaymentResult> {
    // Mock payment execution (in production, this would call actual processor APIs)
    const { transaction } = paymentRequest;

    // Simulate processing time based on processor tier
    const tier = this.getProcessorTier(processor);
    const processingTime = tier === 1 ? 500 : tier === 2 ? 1000 : 1500;

    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Simulate success/failure (95% success rate)
    const success = Math.random() > 0.05;

    if (!success) {
      throw new Error(`Payment failed on ${processor}`);
    }

    return {
      paymentId: `${processor}_${transactionId}`,
      amount: transaction.amount,
      currency: transaction.currency || 'USD',
      status: 'completed',
      processorResponse: {
        id: `${processor}_${Date.now()}`,
        status: 'success',
      },
    };
  }

  private validatePaymentRequest(request: PaymentRequest): ValidationResult {
    const errors: string[] = [];

    if (!request.transaction) errors.push('Missing transaction data');
    if (!request.user) errors.push('Missing user data');
    if (!request.context) errors.push('Missing context data');

    if (request.transaction) {
      if (!request.transaction.amount || request.transaction.amount <= 0) {
        errors.push('Invalid transaction amount');
      }
      if (request.transaction.amount > 50000) {
        errors.push('Transaction amount exceeds maximum limit');
      }
    }

    if (request.user && !request.user.id) {
      errors.push('Missing user ID');
    }

    if (request.context && !request.context.country) {
      errors.push('Missing country context');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private getProcessorTier(processor: string): number {
    const coreGlobal = ['stripe', 'paypal', 'adyen', 'applepay', 'googlepay'];

    if (coreGlobal.includes(processor)) return 1;
    return 3;
  }

  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Webhook handling
  async handleWebhook(
    processor: string,
    payload: string,
    signature: string,
    secret: string,
  ): Promise<WebhookResult> {
    try {
      // Verify webhook signature
      const isValid = WebhookSecurity.verifySignature(processor, payload, signature, secret);

      if (!isValid) {
        SecurityLogger.logSecurityEvent('webhook_signature_invalid', 'high', { processor });
        return { success: false, error: 'Invalid signature' };
      }

      // Process webhook payload
      const webhookData = JSON.parse(payload) as WebhookEvent;

      SecurityLogger.logSecurityEvent('webhook_received', 'low', {
        processor,
        eventType: webhookData.type || 'unknown',
      });

      // Handle different webhook types
      await this.processWebhookEvent(processor, webhookData);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      SecurityLogger.logSecurityEvent('webhook_processing_error', 'medium', {
        processor,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  private async processWebhookEvent(processor: string, eventData: WebhookEvent): Promise<void> {
    // Handle different webhook event types
    switch (eventData.type) {
      case 'payment.succeeded':
        await this.handlePaymentSucceeded(processor, eventData);
        break;
      case 'payment.failed':
        await this.handlePaymentFailed(processor, eventData);
        break;
      case 'payment.refunded':
        await this.handlePaymentRefunded(processor, eventData);
        break;
      default:
        logger.debug('Unhandled webhook event', { type: eventData.type });
    }
  }

  private async handlePaymentSucceeded(processor: string, eventData: WebhookEvent): Promise<void> {
    // Update transaction status, notify user, etc.
    logger.debug('Payment succeeded', { processor, eventId: eventData.id });
  }

  private async handlePaymentFailed(processor: string, eventData: WebhookEvent): Promise<void> {
    // Handle failed payment, possibly retry with different processor
    logger.debug('Payment failed', { processor, eventId: eventData.id });
  }

  private async handlePaymentRefunded(processor: string, eventData: WebhookEvent): Promise<void> {
    // Handle refund processing
    logger.debug('Payment refunded', { processor, eventId: eventData.id });
  }

  // Public API methods
  getSystemStatus(): SystemStatus {
    const healthSummary = paymentHealthMonitor.getHealthSummary();
    const fraudStats = fraudDetectionEngine.getFraudStats();

    return {
      initialized: this.isInitialized,
      processors: {
        total: healthSummary.total,
        healthy: healthSummary.healthy,
        unhealthy: healthSummary.unhealthy,
        healthPercentage: healthSummary.healthPercentage,
      },
      fraud: {
        totalTransactions: fraudStats.totalTransactions,
        blockedTransactions: fraudStats.blockedTransactions,
        blockRate: fraudStats.blockRate,
      },
      activeTransactions: this.activeTransactions.size,
      timestamp: new Date().toISOString(),
    };
  }

  async shutdown(): Promise<void> {
    logger.debug('Shutting down Payment System');

    paymentHealthMonitor.stopMonitoring();

    SecurityLogger.logSecurityEvent('payment_system_shutdown', 'medium', {
      activeTransactions: this.activeTransactions.size,
    });

    logger.debug('Payment System shutdown complete');
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export singleton instance
export const paymentSystem = new PaymentSystemOrchestrator();

// Export for testing
export default PaymentSystemOrchestrator;
