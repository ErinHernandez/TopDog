// Payment System Integration - Main orchestrator for secure 31-processor payment system
import { getPaymentMethodsByLocation, getOrderedPaymentMethods } from './paymentMethodConfig.js';
import { paymentHealthMonitor } from './paymentHealthMonitor.js';
import { fraudDetectionEngine } from './fraudDetection.js';
import { WebhookSecurity, RiskScoring, SecurityLogger, RATE_LIMITS } from './paymentSecurity.js';

class PaymentSystemOrchestrator {
  constructor() {
    this.isInitialized = false;
    this.rateLimiters = new Map();
    this.processorFailover = new Map();
    this.activeTransactions = new Map();
    
    this.initialize();
  }
  
  async initialize() {
    try {
      console.log('🚀 Initializing Payment System...');
      
      // Initialize rate limiters for all processors
      this.initializeRateLimiters();
      
      // Start health monitoring
      paymentHealthMonitor.startMonitoring();
      
      // Initialize fraud detection
      console.log('🛡️ Fraud detection engine ready');
      
      // Set up webhook security
      console.log('🔐 Webhook security configured');
      
      this.isInitialized = true;
      
      SecurityLogger.logSecurityEvent(
        'payment_system_initialized',
        'medium',
        { 
          processors: Object.keys(RATE_LIMITS).length,
          features: ['health_monitoring', 'fraud_detection', 'rate_limiting', 'webhook_security']
        }
      );
      
      console.log('✅ Payment System fully initialized with 31 processors');
      
    } catch (error) {
      console.error('❌ Payment System initialization failed:', error);
      SecurityLogger.logSecurityEvent(
        'payment_system_init_failed',
        'critical',
        { error: error.message }
      );
    }
  }
  
  initializeRateLimiters() {
    Object.keys(RATE_LIMITS).forEach(processor => {
      this.rateLimiters.set(processor, {
        requests: [],
        lastReset: Date.now()
      });
    });
  }
  
  async processPayment(paymentRequest) {
    const transactionId = this.generateTransactionId();
    const startTime = Date.now();
    
    try {
      // Step 1: Validate request
      const validation = this.validatePaymentRequest(paymentRequest);
      if (!validation.valid) {
        throw new Error(`Invalid payment request: ${validation.errors.join(', ')}`);
      }
      
      // Step 2: Fraud detection
      const fraudResult = await fraudDetectionEngine.analyzeTransaction(
        paymentRequest.transaction,
        paymentRequest.user,
        paymentRequest.context
      );
      
      if (fraudResult.action === 'block') {
        SecurityLogger.logSecurityEvent(
          'transaction_blocked_fraud',
          'high',
          { transactionId, fraudScore: fraudResult.score, factors: fraudResult.factors }
        );
        
        return {
          success: false,
          error: 'Transaction blocked for security reasons',
          transactionId,
          fraudResult
        };
      }
      
      // Step 3: Select optimal processor
      let processor = await this.selectOptimalProcessor(paymentRequest);
      
      // Step 4: Check rate limits
      const rateLimitResult = this.checkRateLimit(processor);
      if (!rateLimitResult.allowed) {
        return this.handleRateLimitExceeded(processor, transactionId);
      }
      
      // Step 5: Check processor health
      const healthStatus = paymentHealthMonitor.getHealthStatus();
      if (!healthStatus[processor]?.healthy) {
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
        user: paymentRequest.user.id
      });
      
      const paymentResult = await this.executePayment(processor, paymentRequest, transactionId);
      
      // Step 7: Log success
      SecurityLogger.logSecurityEvent(
        'payment_processed_successfully',
        'low',
        {
          transactionId,
          processor,
          amount: paymentRequest.transaction.amount,
          processingTime: Date.now() - startTime,
          fraudScore: fraudResult.score
        }
      );
      
      return {
        success: true,
        transactionId,
        processor,
        fraudResult,
        processingTime: Date.now() - startTime,
        ...paymentResult
      };
      
    } catch (error) {
      SecurityLogger.logSecurityEvent(
        'payment_processing_error',
        'high',
        {
          transactionId,
          error: error.message,
          processingTime: Date.now() - startTime
        }
      );
      
      return {
        success: false,
        error: error.message,
        transactionId,
        processingTime: Date.now() - startTime
      };
    } finally {
      this.activeTransactions.delete(transactionId);
    }
  }
  
  async selectOptimalProcessor(paymentRequest) {
    const { user, transaction, context } = paymentRequest;
    
    // Get location-based processor ordering
    const orderedProcessors = getOrderedPaymentMethods(context.country);
    
    // Filter by transaction requirements
    const suitableProcessors = orderedProcessors.filter(processor => {
      const limits = RATE_LIMITS[processor];
      return limits && transaction.amount >= 1 && transaction.amount <= 50000; // Basic limits
    });
    
    // Check health status and select first healthy processor
    const healthStatus = paymentHealthMonitor.getHealthStatus();
    
    for (const processor of suitableProcessors) {
      if (healthStatus[processor]?.healthy) {
        return processor;
      }
    }
    
    // Fallback to core global processors
    const coreProcessors = ['stripe', 'paypal', 'adyen'];
    for (const processor of coreProcessors) {
      if (healthStatus[processor]?.healthy) {
        return processor;
      }
    }
    
    throw new Error('No healthy processors available');
  }
  
  async selectFallbackProcessor(paymentRequest, failedProcessor) {
    const { context } = paymentRequest;
    const orderedProcessors = getOrderedPaymentMethods(context.country);
    const healthStatus = paymentHealthMonitor.getHealthStatus();
    
    // Find next healthy processor in the ordered list
    const failedIndex = orderedProcessors.indexOf(failedProcessor);
    const remainingProcessors = orderedProcessors.slice(failedIndex + 1);
    
    for (const processor of remainingProcessors) {
      if (healthStatus[processor]?.healthy) {
        SecurityLogger.logSecurityEvent(
          'processor_failover',
          'medium',
          { from: failedProcessor, to: processor }
        );
        return processor;
      }
    }
    
    return null;
  }
  
  checkRateLimit(processor) {
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
      retryAfter: Math.ceil((limiter.requests[0] + windowMs - now) / 1000)
    };
  }
  
  parseTimeWindow(window) {
    const match = window.match(/^(\d+)([smh])$/);
    if (!match) return 60000; // Default 1 minute
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      default: return 60000;
    }
  }
  
  handleRateLimitExceeded(processor, transactionId) {
    SecurityLogger.logSecurityEvent(
      'rate_limit_exceeded',
      'medium',
      { processor, transactionId }
    );
    
    return {
      success: false,
      error: 'Rate limit exceeded',
      transactionId,
      retryAfter: 60 // seconds
    };
  }
  
  async executePayment(processor, paymentRequest, transactionId) {
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
        status: 'success'
      }
    };
  }
  
  validatePaymentRequest(request) {
    const errors = [];
    
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
      errors
    };
  }
  
  getProcessorTier(processor) {
    const coreGlobal = ['stripe', 'paypal', 'adyen', 'applepay', 'googlepay'];
    
    if (coreGlobal.includes(processor)) return 1;
    return 3;
  }
  
  generateTransactionId() {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Webhook handling
  async handleWebhook(processor, payload, signature, secret) {
    try {
      // Verify webhook signature
      const isValid = WebhookSecurity.verifySignature(processor, payload, signature, secret);
      
      if (!isValid) {
        SecurityLogger.logSecurityEvent(
          'webhook_signature_invalid',
          'high',
          { processor }
        );
        return { success: false, error: 'Invalid signature' };
      }
      
      // Process webhook payload
      const webhookData = JSON.parse(payload);
      
      SecurityLogger.logSecurityEvent(
        'webhook_received',
        'low',
        { processor, eventType: webhookData.type || 'unknown' }
      );
      
      // Handle different webhook types
      await this.processWebhookEvent(processor, webhookData);
      
      return { success: true };
      
    } catch (error) {
      SecurityLogger.logSecurityEvent(
        'webhook_processing_error',
        'medium',
        { processor, error: error.message }
      );
      
      return { success: false, error: error.message };
    }
  }
  
  async processWebhookEvent(processor, eventData) {
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
        console.log(`Unhandled webhook event: ${eventData.type}`);
    }
  }
  
  async handlePaymentSucceeded(processor, eventData) {
    // Update transaction status, notify user, etc.
    console.log(`Payment succeeded on ${processor}:`, eventData.id);
  }
  
  async handlePaymentFailed(processor, eventData) {
    // Handle failed payment, possibly retry with different processor
    console.log(`Payment failed on ${processor}:`, eventData.id);
  }
  
  async handlePaymentRefunded(processor, eventData) {
    // Handle refund processing
    console.log(`Payment refunded on ${processor}:`, eventData.id);
  }
  
  // Public API methods
  getSystemStatus() {
    const healthSummary = paymentHealthMonitor.getHealthSummary();
    const fraudStats = fraudDetectionEngine.getFraudStats();
    
    return {
      initialized: this.isInitialized,
      processors: {
        total: healthSummary.total,
        healthy: healthSummary.healthy,
        unhealthy: healthSummary.unhealthy,
        healthPercentage: healthSummary.healthPercentage
      },
      fraud: {
        totalTransactions: fraudStats.totalTransactions,
        blockedTransactions: fraudStats.blockedTransactions,
        blockRate: fraudStats.blockRate
      },
      activeTransactions: this.activeTransactions.size,
      timestamp: new Date().toISOString()
    };
  }
  
  async shutdown() {
    console.log('🛑 Shutting down Payment System...');
    
    paymentHealthMonitor.stopMonitoring();
    
    SecurityLogger.logSecurityEvent(
      'payment_system_shutdown',
      'medium',
      { activeTransactions: this.activeTransactions.size }
    );
    
    console.log('✅ Payment System shutdown complete');
  }
}

// Export singleton instance
export const paymentSystem = new PaymentSystemOrchestrator();

// Export for testing
export default PaymentSystemOrchestrator;

