/**
 * Health Monitoring Service for Idesaign
 * 
 * Continuously monitors application and external service health
 * Tracks uptime, incident history, and metrics
 * Provides real-time dashboard data
 */

import { EventEmitter } from 'eventemitter3';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  duration: number; // Check duration in ms
  checks: Record<string, 'healthy' | 'degraded' | 'unhealthy'>;
  metrics?: {
    errorRate5min: number; // Percentage
    p95LatencyMs: number;
    memoryUsagePercent: number;
    firestoreConnections: number;
  };
  errors?: string[];
}

export interface UptimeMetrics {
  overallUptime: number; // Percentage
  last24hUptime: number;
  last7dUptime: number;
  last30dUptime: number;
  incidents24h: number;
  incidents7d: number;
  incidents30d: number;
}

export interface IncidentRecord {
  id: string;
  startTime: Date;
  endTime?: Date;
  severity: 'P1' | 'P2' | 'P3' | 'P4';
  service: string;
  description: string;
  duration?: number; // Minutes
}

export class HealthMonitor extends EventEmitter {
  private checkInterval: NodeJS.Timer | null = null;
  private healthCheckUrl = process.env.HEALTH_CHECK_URL || 'http://localhost:3000/api/health';
  private deepHealthCheckUrl = `${this.healthCheckUrl.replace('/health', '')}/health/deep`;
  private checkIntervalMs = 60000; // 1 minute
  private timeout = 10000; // 10 seconds
  private recentChecks: HealthCheckResult[] = [];
  private incidentHistory: IncidentRecord[] = [];
  private maxHistorySize = 1000; // Keep last 1000 checks
  private lastHealthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  constructor(options?: { checkInterval?: number; timeout?: number }) {
    super();
    if (options?.checkInterval) this.checkIntervalMs = options.checkInterval;
    if (options?.timeout) this.timeout = options.timeout;
  }

  /**
   * Start health monitoring
   */
  public start(): void {
    if (this.checkInterval) {
      console.log('Health monitor already running');
      return;
    }

    console.log(
      `[HealthMonitor] Starting health checks every ${this.checkIntervalMs}ms`
    );

    // Run first check immediately
    this.performCheck();

    // Schedule recurring checks
    this.checkInterval = setInterval(() => {
      this.performCheck();
    }, this.checkIntervalMs);
  }

  /**
   * Stop health monitoring
   */
  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[HealthMonitor] Stopped health checks');
    }
  }

  /**
   * Perform a single health check
   */
  private async performCheck(): Promise<void> {
    try {
      const startTime = Date.now();
      const result = await this.runHealthCheck();
      result.duration = Date.now() - startTime;

      // Store result
      this.recentChecks.push(result);
      if (this.recentChecks.length > this.maxHistorySize) {
        this.recentChecks.shift(); // Remove oldest
      }

      // Detect status change
      if (result.status !== this.lastHealthStatus) {
        this.handleStatusChange(this.lastHealthStatus, result.status, result);
        this.lastHealthStatus = result.status;
      }

      // Emit event
      this.emit('check', result);

      // Check for specific service failures
      for (const [service, status] of Object.entries(result.checks)) {
        if (status !== 'healthy') {
          this.emit(`service_unhealthy:${service}`, { service, status, timestamp: result.timestamp });
        }
      }

      // Log if unhealthy
      if (result.status !== 'healthy') {
        console.warn(
          `[HealthMonitor] Status: ${result.status}, Errors: ${result.errors?.join(', ')}`
        );
      }
    } catch (error) {
      console.error('[HealthMonitor] Health check failed:', error);
      this.emit('check_error', error);
    }
  }

  /**
   * Run quick health check
   */
  private async runHealthCheck(): Promise<HealthCheckResult> {
    try {
      const response = await fetch(this.healthCheckUrl, {
        timeout: this.timeout,
        signal: AbortSignal.timeout(this.timeout)
      } as any);

      if (!response.ok) {
        return {
          status: 'unhealthy',
          timestamp: new Date(),
          duration: 0,
          checks: {},
          errors: [`Health check returned ${response.status}`]
        };
      }

      const data = await response.json();

      return {
        status: data.status || 'unhealthy',
        timestamp: new Date(data.timestamp),
        duration: 0,
        checks: data.checks || {},
        errors: []
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        duration: 0,
        checks: {},
        errors: [String(error)]
      };
    }
  }

  /**
   * Run deep health check (expensive, run less frequently)
   */
  public async runDeepHealthCheck(): Promise<HealthCheckResult> {
    try {
      const response = await fetch(this.deepHealthCheckUrl, {
        timeout: this.timeout * 2,
        signal: AbortSignal.timeout(this.timeout * 2)
      } as any);

      if (!response.ok) {
        return {
          status: 'unhealthy',
          timestamp: new Date(),
          duration: 0,
          checks: {},
          errors: [`Deep health check returned ${response.status}`]
        };
      }

      const data = await response.json();

      return {
        status: data.status || 'unhealthy',
        timestamp: new Date(data.timestamp),
        duration: 0,
        checks: data.checks || {},
        metrics: data.metrics,
        errors: []
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        duration: 0,
        checks: {},
        errors: [String(error)]
      };
    }
  }

  /**
   * Handle status change (healthy → unhealthy, etc.)
   */
  private handleStatusChange(
    oldStatus: string,
    newStatus: string,
    result: HealthCheckResult
  ): void {
    const severity = newStatus === 'unhealthy' ? 'P1' : 'P2';

    if (newStatus === 'unhealthy') {
      // Create incident record
      const incident: IncidentRecord = {
        id: `INC-${Date.now()}`,
        startTime: result.timestamp,
        severity,
        service: 'Application',
        description: `Status changed from ${oldStatus} to ${newStatus}`
      };

      this.incidentHistory.push(incident);
      if (this.incidentHistory.length > this.maxHistorySize) {
        this.incidentHistory.shift();
      }

      this.emit('status_change', { from: oldStatus, to: newStatus, incident });
      console.warn(`[HealthMonitor] Status degraded: ${oldStatus} → ${newStatus}`);
    } else if (oldStatus !== 'healthy' && newStatus === 'healthy') {
      // Recover from incident
      const lastIncident = this.incidentHistory[this.incidentHistory.length - 1];
      if (lastIncident && !lastIncident.endTime) {
        lastIncident.endTime = result.timestamp;
        lastIncident.duration = Math.round(
          (lastIncident.endTime.getTime() - lastIncident.startTime.getTime()) / 1000 / 60
        );
        this.emit('incident_resolved', lastIncident);
        console.info(
          `[HealthMonitor] Recovered from incident in ${lastIncident.duration} minutes`
        );
      }
    }
  }

  /**
   * Get uptime metrics
   */
  public getUptimeMetrics(): UptimeMetrics {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const last24h = this.recentChecks.filter(
      check => now - check.timestamp.getTime() < day
    );
    const last7d = this.recentChecks.filter(
      check => now - check.timestamp.getTime() < day * 7
    );
    const last30d = this.recentChecks.filter(
      check => now - check.timestamp.getTime() < day * 30
    );

    const calculateUptime = (checks: HealthCheckResult[]): number => {
      if (checks.length === 0) return 100;
      const healthy = checks.filter(c => c.status === 'healthy').length;
      return (healthy / checks.length) * 100;
    };

    const countIncidents = (since: number): number => {
      return this.incidentHistory.filter(
        inc => now - inc.startTime.getTime() < since
      ).length;
    };

    return {
      overallUptime: calculateUptime(this.recentChecks),
      last24hUptime: calculateUptime(last24h),
      last7dUptime: calculateUptime(last7d),
      last30dUptime: calculateUptime(last30d),
      incidents24h: countIncidents(day),
      incidents7d: countIncidents(day * 7),
      incidents30d: countIncidents(day * 30)
    };
  }

  /**
   * Get current health status
   */
  public getCurrentStatus(): HealthCheckResult | null {
    return this.recentChecks[this.recentChecks.length - 1] || null;
  }

  /**
   * Get recent checks
   */
  public getRecentChecks(limit: number = 100): HealthCheckResult[] {
    return this.recentChecks.slice(-limit);
  }

  /**
   * Get incident history
   */
  public getIncidentHistory(limit: number = 50): IncidentRecord[] {
    return this.incidentHistory.slice(-limit);
  }

  /**
   * Export metrics for dashboard/monitoring
   */
  public exportMetrics(): Record<string, any> {
    const current = this.getCurrentStatus();
    const uptime = this.getUptimeMetrics();

    return {
      timestamp: new Date().toISOString(),
      health: {
        status: current?.status || 'unknown',
        lastCheck: current?.timestamp || null,
        checks: current?.checks || {}
      },
      metrics: current?.metrics || {},
      uptime,
      incidents: {
        recent: this.getIncidentHistory(10),
        total24h: uptime.incidents24h,
        total7d: uptime.incidents7d,
        total30d: uptime.incidents30d
      }
    };
  }

  /**
   * Export as Prometheus metrics
   */
  public exportPrometheusMetrics(): string {
    const metrics = this.exportMetrics();
    const lines: string[] = [];

    // Status metric (1 = healthy, 0 = unhealthy)
    const statusValue = metrics.health.status === 'healthy' ? 1 : 0;
    lines.push(`# HELP idesaign_health_status Application health status (1=healthy, 0=unhealthy)`);
    lines.push(`# TYPE idesaign_health_status gauge`);
    lines.push(`idesaign_health_status ${statusValue}`);

    // Uptime metrics
    lines.push(`# HELP idesaign_uptime_24h Uptime percentage last 24 hours`);
    lines.push(`# TYPE idesaign_uptime_24h gauge`);
    lines.push(`idesaign_uptime_24h ${metrics.uptime.last24hUptime}`);

    lines.push(`# HELP idesaign_incidents_24h Number of incidents last 24 hours`);
    lines.push(`# TYPE idesaign_incidents_24h gauge`);
    lines.push(`idesaign_incidents_24h ${metrics.incidents.total24h}`);

    // Service-specific checks
    for (const [service, status] of Object.entries(metrics.health.checks)) {
      const statusValue = status === 'healthy' ? 1 : 0;
      lines.push(`idesaign_service_health{service="${service}"} ${statusValue}`);
    }

    // Response time
    if (metrics.metrics?.p95LatencyMs) {
      lines.push(`idesaign_p95_latency_ms ${metrics.metrics.p95LatencyMs}`);
    }

    if (metrics.metrics?.memoryUsagePercent) {
      lines.push(`idesaign_memory_usage_percent ${metrics.metrics.memoryUsagePercent}`);
    }

    if (metrics.metrics?.errorRate5min) {
      lines.push(`idesaign_error_rate_5min ${metrics.metrics.errorRate5min}`);
    }

    return lines.join('\n');
  }
}

// Export singleton instance
export const healthMonitor = new HealthMonitor();

// Example usage:
/*
import { healthMonitor } from './health-monitor';

// Start monitoring
healthMonitor.start();

// Listen for status changes
healthMonitor.on('status_change', ({ from, to, incident }) => {
  console.log(`Status changed: ${from} → ${to}`, incident);
  // Trigger alert, create incident ticket, etc.
});

// Listen for specific service failures
healthMonitor.on('service_unhealthy:firebase_auth', ({ service, status }) => {
  console.log(`Firebase Auth is ${status}`);
  // Trigger specific runbook
});

// Get metrics for dashboard
const metrics = healthMonitor.exportMetrics();
console.log('Current uptime:', metrics.uptime.last24hUptime + '%');

// Export Prometheus metrics
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(healthMonitor.exportPrometheusMetrics());
});

// Stop monitoring
healthMonitor.stop();
*/
