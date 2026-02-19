/**
 * Payment Processor Health Monitoring System
 * Monitors health of payment processors with circuit breakers and alerting
 */

import { serverLogger } from './logger/serverLogger';
import { GLOBAL_PAYMENT_METHODS, PaymentMethodId } from './paymentMethodConfig';
import { HEALTH_CHECKS, SecurityLogger } from './paymentSecurity';
import { cleanupRegistry } from '@/lib/cleanup/cleanupRegistry';

// ============================================================================
// TYPES
// ============================================================================

export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

export interface ProcessorStatus {
  isHealthy: boolean;
  lastCheck: Date | null;
  responseTime: number;
  errorCount: number;
  totalRequests: number;
  uptime: number;
  consecutiveFailures: number;
  lastError: string | null;
  circuitBreakerState: CircuitBreakerState;
}

export interface CircuitBreaker {
  failureCount: number;
  lastFailureTime: number | null;
  nextRetryTime: number | null;
  state: CircuitBreakerState;
}

export interface HealthCheckResult {
  healthy: boolean;
  details?: unknown;
}

export interface ProcessorHealthResult {
  processor: PaymentMethodId;
  healthy: boolean;
  responseTime: number;
  error?: string;
}

export interface AlertThresholds {
  responseTime: number;
  errorRate: number;
  uptime: number;
}

export interface ProcessorHealthStatus {
  healthy: boolean;
  responseTime: number;
  uptime: number;
  lastCheck: Date | null;
  circuitBreakerState: CircuitBreakerState;
  consecutiveFailures: number;
}

export interface HealthSummary {
  total: number;
  healthy: number;
  unhealthy: number;
  healthPercentage: number;
  timestamp: string;
}

// ============================================================================
// CLASS
// ============================================================================

class PaymentHealthMonitor {
  private processorStatus: Map<PaymentMethodId, ProcessorStatus>;
  private circuitBreakers: Map<PaymentMethodId, CircuitBreaker>;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly alertThresholds: AlertThresholds;

  constructor() {
    this.processorStatus = new Map();
    this.circuitBreakers = new Map();
    this.alertThresholds = {
      responseTime: 5000, // 5 seconds
      errorRate: 0.05,    // 5%
      uptime: 0.999       // 99.9%
    };
    
    this.initializeProcessors();
  }
  
  private initializeProcessors(): void {
    GLOBAL_PAYMENT_METHODS.forEach(processor => {
      this.processorStatus.set(processor, {
        isHealthy: true,
        lastCheck: null,
        responseTime: 0,
        errorCount: 0,
        totalRequests: 0,
        uptime: 1.0,
        consecutiveFailures: 0,
        lastError: null,
        circuitBreakerState: 'closed' // closed, open, half-open
      });
      
      this.circuitBreakers.set(processor, {
        failureCount: 0,
        lastFailureTime: null,
        nextRetryTime: null,
        state: 'closed'
      });
    });
  }
  
  startMonitoring(): void {
    serverLogger.info('Starting payment processor health monitoring');

    // Initial health check
    this.performHealthChecks();

    // Schedule regular health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, HEALTH_CHECKS.ping_interval);

    cleanupRegistry.register('payment-health-monitor', () => this.stopMonitoring(), 'interval');

    SecurityLogger.logSecurityEvent(
      'health_monitoring_started',
      'medium',
      { processors: GLOBAL_PAYMENT_METHODS.length }
    );
  }
  
  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    cleanupRegistry.unregister('payment-health-monitor');
    serverLogger.info('Payment processor health monitoring stopped');
  }
  
  async performHealthChecks(): Promise<void> {
    const promises = GLOBAL_PAYMENT_METHODS.map(processor => 
      this.checkProcessorHealth(processor)
    );
    
    const results = await Promise.allSettled(promises);
    
    // Analyze results and trigger alerts if needed
    this.analyzeHealthResults(results);
  }
  
  async checkProcessorHealth(processor: PaymentMethodId): Promise<ProcessorHealthResult> {
    const startTime = Date.now();
    const status = this.processorStatus.get(processor);
    
    if (!status) {
      throw new Error(`Processor ${processor} not found in status map`);
    }

    try {
      // Skip if circuit breaker is open
      if (this.isCircuitBreakerOpen(processor)) {
        return this.handleCircuitBreakerOpen(processor);
      }
      
      // Perform health check based on processor type
      const healthResult = await this.performProcessorSpecificCheck(processor);
      
      const responseTime = Date.now() - startTime;
      
      // Update status
      status.lastCheck = new Date();
      status.responseTime = responseTime;
      status.totalRequests++;
      status.consecutiveFailures = 0;
      status.isHealthy = healthResult.healthy;
      
      if (healthResult.healthy) {
        this.resetCircuitBreaker(processor);
      }
      
      return { processor, healthy: healthResult.healthy, responseTime };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return this.handleProcessorError(processor, errorMessage, Date.now() - startTime);
    }
  }
  
  private async performProcessorSpecificCheck(processor: PaymentMethodId): Promise<HealthCheckResult> {
    // Tier-based health check strategies
    const tier = this.getProcessorTier(processor);
    
    switch (tier) {
      case 1: // Core Global - comprehensive checks
        return await this.comprehensiveHealthCheck(processor);
      case 2: // Regional Champions - standard checks
        return await this.standardHealthCheck(processor);
      case 3: // Strategic Local - basic checks
        return await this.basicHealthCheck(processor);
      default:
        return await this.basicHealthCheck(processor);
    }
  }
  
  private async comprehensiveHealthCheck(processor: PaymentMethodId): Promise<HealthCheckResult> {
    // For Tier 1 processors, perform multiple checks
    const checks = [
      this.pingEndpoint(processor),
      this.validateAPIKey(processor),
      this.checkRateLimit(processor)
    ];
    
    const results = await Promise.allSettled(checks);
    const healthyChecks = results.filter(r => r.status === 'fulfilled' && r.value).length;
    
    return {
      healthy: healthyChecks >= 2, // At least 2 out of 3 checks must pass
      details: results
    };
  }
  
  private async standardHealthCheck(processor: PaymentMethodId): Promise<HealthCheckResult> {
    // For Tier 2 processors, perform basic endpoint ping
    const pingResult = await this.pingEndpoint(processor);
    return {
      healthy: pingResult,
      details: { ping: pingResult }
    };
  }
  
  private async basicHealthCheck(processor: PaymentMethodId): Promise<HealthCheckResult> {
    // For Tier 3 processors, simple connectivity check
    try {
      const timeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 3000)
      );
      
      const check = this.pingEndpoint(processor);
      await Promise.race([check, timeout]);
      
      return { healthy: true, details: { basic: true } };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { healthy: false, details: { error: errorMessage } };
    }
  }
  
  private async pingEndpoint(processor: PaymentMethodId): Promise<boolean> {
    // Mock health check endpoints (in production, these would be real API calls)
    const mockEndpoints: Record<PaymentMethodId, string> = {
      stripe: 'https://api.stripe.com/healthcheck',
      paypal: 'https://api.paypal.com/v1/notifications/webhooks-event-types',
      adyen: 'https://checkout-test.adyen.com/v70/paymentMethods',
      applepay: '',
      googlepay: ''
    };
    
    const endpoint = mockEndpoints[processor];
    if (!endpoint) {
      // For processors without specific endpoints, return healthy
      return true;
    }
    
    try {
      // In production, this would be an actual HTTP request
      // For now, simulate with random success/failure
      const success = Math.random() > 0.05; // 95% success rate
      
      if (!success) {
        throw new Error(`Health check failed for ${processor}`);
      }
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      SecurityLogger.logSecurityEvent(
        'processor_health_check_failed',
        'medium',
        { processor, error: errorMessage }
      );
      return false;
    }
  }
  
  private async validateAPIKey(processor: PaymentMethodId): Promise<boolean> {
    // Mock API key validation
    // In production, this would validate the actual API key
    return Math.random() > 0.02; // 98% success rate
  }
  
  private async checkRateLimit(processor: PaymentMethodId): Promise<boolean> {
    // Mock rate limit check
    // In production, this would check current rate limit status
    return Math.random() > 0.01; // 99% success rate
  }
  
  private handleProcessorError(
    processor: PaymentMethodId,
    error: string,
    responseTime: number
  ): ProcessorHealthResult {
    const status = this.processorStatus.get(processor);
    
    if (!status) {
      return { processor, healthy: false, error, responseTime };
    }
    
    status.lastCheck = new Date();
    status.responseTime = responseTime;
    status.totalRequests++;
    status.errorCount++;
    status.consecutiveFailures++;
    status.lastError = error;
    status.isHealthy = false;
    
    // Update circuit breaker
    this.updateCircuitBreaker(processor);
    
    SecurityLogger.logSecurityEvent(
      'processor_error',
      status.consecutiveFailures > 3 ? 'high' : 'medium',
      {
        processor,
        error: error,
        consecutiveFailures: status.consecutiveFailures,
        responseTime
      }
    );
    
    return { processor, healthy: false, error, responseTime };
  }
  
  private updateCircuitBreaker(processor: PaymentMethodId): void {
    const breaker = this.circuitBreakers.get(processor);
    const status = this.processorStatus.get(processor);
    
    if (!breaker || !status) {
      return;
    }
    
    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();
    
    // Open circuit breaker if failure threshold exceeded
    if (breaker.failureCount >= HEALTH_CHECKS.failure_threshold) {
      breaker.state = 'open';
      breaker.nextRetryTime = Date.now() + (60 * 1000); // 1 minute
      status.circuitBreakerState = 'open';
      
      SecurityLogger.logSecurityEvent(
        'circuit_breaker_opened',
        'high',
        { processor, failureCount: breaker.failureCount }
      );
    }
  }
  
  private resetCircuitBreaker(processor: PaymentMethodId): void {
    const breaker = this.circuitBreakers.get(processor);
    const status = this.processorStatus.get(processor);
    
    if (!breaker || !status) {
      return;
    }
    
    if (breaker.state !== 'closed') {
      breaker.failureCount = 0;
      breaker.state = 'closed';
      breaker.nextRetryTime = null;
      status.circuitBreakerState = 'closed';
      
      SecurityLogger.logSecurityEvent(
        'circuit_breaker_closed',
        'medium',
        { processor }
      );
    }
  }
  
  private isCircuitBreakerOpen(processor: PaymentMethodId): boolean {
    const breaker = this.circuitBreakers.get(processor);
    
    if (!breaker) {
      return false;
    }
    
    if (breaker.state === 'open') {
      // Check if it's time to try half-open
      if (breaker.nextRetryTime && Date.now() >= breaker.nextRetryTime) {
        breaker.state = 'half-open';
        const status = this.processorStatus.get(processor);
        if (status) {
          status.circuitBreakerState = 'half-open';
        }
        return false; // Allow one attempt
      }
      return true;
    }
    
    return false;
  }
  
  private handleCircuitBreakerOpen(processor: PaymentMethodId): ProcessorHealthResult {
    return {
      processor,
      healthy: false,
      error: 'Circuit breaker open',
      responseTime: 0
    };
  }
  
  private getProcessorTier(processor: PaymentMethodId): number {
    const coreGlobal: PaymentMethodId[] = ['stripe', 'paypal', 'adyen', 'applepay', 'googlepay'];
    
    if (coreGlobal.includes(processor)) return 1;
    return 3;
  }
  
  private analyzeHealthResults(results: PromiseSettledResult<ProcessorHealthResult>[]): void {
    const unhealthyProcessors = results
      .filter((result): result is PromiseFulfilledResult<ProcessorHealthResult> => 
        result.status === 'fulfilled' && !result.value.healthy
      )
      .map(result => result.value.processor);
    
    if (unhealthyProcessors.length > 0) {
      SecurityLogger.logSecurityEvent(
        'processors_unhealthy',
        unhealthyProcessors.length > 5 ? 'critical' : 'high',
        { unhealthyProcessors, count: unhealthyProcessors.length }
      );
    }
    
    // Check if critical processors are down
    const criticalProcessors: PaymentMethodId[] = ['stripe', 'paypal', 'adyen'];
    const criticalDown = unhealthyProcessors.filter(p => criticalProcessors.includes(p));
    
    if (criticalDown.length > 0) {
      SecurityLogger.logSecurityEvent(
        'critical_processors_down',
        'critical',
        { criticalDown }
      );
      
      // Trigger emergency alerts
      this.triggerEmergencyAlert(criticalDown);
    }
  }
  
  private triggerEmergencyAlert(criticalProcessors: PaymentMethodId[]): void {
    serverLogger.error('CRITICAL: Core payment processors are down!', new Error(`Processors down: ${criticalProcessors.join(', ')}`));
    
    // In production, this would trigger:
    // - PagerDuty alerts
    // - Slack notifications
    // - SMS alerts to on-call engineers
    // - Email notifications to management
  }
  
  getHealthStatus(): Record<PaymentMethodId, ProcessorHealthStatus> {
    const status: Record<string, ProcessorHealthStatus> = {};
    
    this.processorStatus.forEach((data, processor) => {
      status[processor] = {
        healthy: data.isHealthy,
        responseTime: data.responseTime,
        uptime: data.totalRequests > 0 ? 1 - (data.errorCount / data.totalRequests) : 1,
        lastCheck: data.lastCheck,
        circuitBreakerState: data.circuitBreakerState,
        consecutiveFailures: data.consecutiveFailures
      };
    });
    
    return status as Record<PaymentMethodId, ProcessorHealthStatus>;
  }
  
  getHealthSummary(): HealthSummary {
    const total = GLOBAL_PAYMENT_METHODS.length;
    const healthy = Array.from(this.processorStatus.values()).filter(s => s.isHealthy).length;
    const unhealthy = total - healthy;
    
    return {
      total,
      healthy,
      unhealthy,
      healthPercentage: (healthy / total) * 100,
      timestamp: new Date().toISOString()
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// Export singleton instance
export const paymentHealthMonitor = new PaymentHealthMonitor();

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production') {
  paymentHealthMonitor.startMonitoring();
}

export default PaymentHealthMonitor;
