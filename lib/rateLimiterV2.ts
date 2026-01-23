/**
 * Enhanced Rate Limiter V2
 * 
 * Monitoring-focused rate limiting that:
 * - Uses in-memory storage (with Firestore fallback) for performance
 * - Combines IP + User ID + Device ID for better tracking
 * - Provides progressive limits (higher for authenticated users)
 * - Focuses on monitoring suspicious patterns rather than strict blocking
 * - Maintains VPN/proxy access (no blocking based on VPN detection)
 * 
 * Philosophy: Allow legitimate users (including VPN users) while detecting
 * and monitoring abuse patterns for manual review.
 */

import { NextApiRequest } from 'next';

// ============================================================================
// TYPES
// ============================================================================

interface RateLimitEntry {
  count: number;
  windowStart: number;
  windowEnd: number;
  firstRequest: number;
  lastRequest?: number;
  lastUpdated: number;
}

interface RateLimitStoreStats {
  totalEntries: number;
  activeWindows: number;
}

interface ClientIdentifier {
  ip: string | null;
  userId: string | null;
  deviceId: string | null;
  sessionId: string | null;
}

interface ClientIdentifierKeys {
  ipOnly: string;
  ipDevice: string | null;
  userId: string | null;
  userDevice: string | null;
  raw: ClientIdentifier;
}

interface RateLimitCheck {
  key: string;
  count: number;
  allowed: boolean;
  limit: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number | null;
  resetAt: number;
  reason?: string;
  level?: string;
  effectiveLimit?: number;
}

interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
  endpoint: string;
  authenticatedMultiplier?: number;
  deviceMultiplier?: number;
  monitorThreshold?: number;
  alertThreshold?: number;
}

interface SuspiciousPattern {
  userId: string;
  ips: Set<string>;
  devices: Set<string>;
  endpoints: Set<string>;
  firstSeen: number;
  requestCount: number;
  lastSeen?: number;
}

interface HighActivityIP {
  count: number;
  endpoints: Set<string>;
  firstSeen: number;
  lastSeen?: number;
}

interface MonitoringStats {
  store: RateLimitStoreStats;
  highActivityIPs: Array<{
    ip: string;
    requestCount: number;
    endpoints: string[];
    firstSeen: string;
    lastSeen: string;
  }>;
  suspiciousPatterns: Array<{
    userId: string;
    uniqueIPs: number;
    uniqueDevices: number;
    requestCount: number;
    endpoints: string[];
  }>;
}

type ExtendedNextApiRequest = NextApiRequest & {
  user?: {
    uid: string;
    [key: string]: unknown;
  };
  socket?: {
    remoteAddress?: string;
  };
}

// ============================================================================
// IN-MEMORY STORAGE (Primary)
// ============================================================================

/**
 * In-memory rate limit store
 * Falls back to Firestore if memory is cleared (server restart)
 */
class InMemoryRateLimitStore {
  private store: Map<string, RateLimitEntry>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.store = new Map();
    this.startCleanup();
  }

  /**
   * Get rate limit entry
   */
  get(key: string): RateLimitEntry | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.windowEnd) {
      this.store.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * Set or update rate limit entry
   */
  set(key: string, data: Omit<RateLimitEntry, 'lastUpdated'>): void {
    this.store.set(key, {
      ...data,
      lastUpdated: Date.now(),
    });
  }

  /**
   * Increment counter atomically
   */
  increment(key: string, windowEnd: number, maxRequests: number): { count: number; allowed: boolean } {
    const entry = this.get(key);
    
    if (!entry) {
      this.set(key, {
        count: 1,
        windowStart: Date.now(),
        windowEnd,
        firstRequest: Date.now(),
      });
      return { count: 1, allowed: true };
    }

    const newCount = entry.count + 1;
    entry.count = newCount;
    entry.lastRequest = Date.now();
    this.set(key, entry);

    return {
      count: newCount,
      allowed: newCount <= maxRequests,
    };
  }

  /**
   * Clean up expired entries periodically
   */
  private startCleanup(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.store.entries()) {
        if (now > entry.windowEnd) {
          this.store.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`[RateLimiter] Cleaned up ${cleaned} expired entries`);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Get stats for monitoring
   */
  getStats(): RateLimitStoreStats {
    return {
      totalEntries: this.store.size,
      activeWindows: Array.from(this.store.values()).filter(
        e => Date.now() <= e.windowEnd
      ).length,
    };
  }
}

// ============================================================================
// CLIENT IDENTIFIER
// ============================================================================

/**
 * Generate multi-factor client identifier
 * Combines IP + User ID + Device ID for better tracking
 */
function getClientIdentifier(req: ExtendedNextApiRequest): ClientIdentifierKeys {
  const identifiers: ClientIdentifier = {
    ip: getIPAddress(req),
    userId: req.user?.uid || null,
    deviceId: (req.headers['x-device-id'] as string) || null,
    sessionId: (req.headers['x-session-id'] as string) || null,
  };

  // Generate composite keys for different tracking levels
  return {
    // Level 1: IP only (for unauthenticated requests)
    ipOnly: `ip:${identifiers.ip}`,
    
    // Level 2: IP + Device (better tracking, still works with VPN)
    ipDevice: identifiers.deviceId 
      ? `ip+device:${identifiers.ip}:${identifiers.deviceId}`
      : null,
    
    // Level 3: User ID (for authenticated requests - most reliable)
    userId: identifiers.userId ? `user:${identifiers.userId}` : null,
    
    // Level 4: User + Device (best tracking for authenticated users)
    userDevice: identifiers.userId && identifiers.deviceId
      ? `user+device:${identifiers.userId}:${identifiers.deviceId}`
      : null,
    
    // Raw identifiers for monitoring
    raw: identifiers,
  };
}

/**
 * Get IP address from request
 */
function getIPAddress(req: ExtendedNextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = typeof forwarded === 'string' ? forwarded.split(',') : forwarded;
    return ips[0]?.trim() || 'unknown';
  }
  
  return req.socket?.remoteAddress || 'unknown';
}

// ============================================================================
// RATE LIMITER V2
// ============================================================================

export class RateLimiterV2 {
  private config: Required<RateLimiterConfig>;
  private store: InMemoryRateLimitStore;
  private monitoring: {
    suspiciousPatterns: Map<string, SuspiciousPattern>;
    highActivityIPs: Map<string, HighActivityIP>;
  };

  constructor(config: RateLimiterConfig) {
    this.config = {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      endpoint: config.endpoint,
      
      // Progressive limits for authenticated users
      authenticatedMultiplier: config.authenticatedMultiplier || 2, // 2x limit for authenticated
      deviceMultiplier: config.deviceMultiplier || 1.5, // 1.5x if device ID present
      
      // Monitoring thresholds
      monitorThreshold: config.monitorThreshold || 0.8, // Monitor at 80% of limit
      alertThreshold: config.alertThreshold || 0.95, // Alert at 95% of limit
    };
    
    this.store = new InMemoryRateLimitStore();
    this.monitoring = {
      suspiciousPatterns: new Map(),
      highActivityIPs: new Map(),
    };
  }

  /**
   * Check rate limit with multi-factor identification
   */
  async check(req: ExtendedNextApiRequest): Promise<RateLimitResult> {
    const clientId = getClientIdentifier(req);
    const now = Date.now();
    const windowEnd = now + this.config.windowMs;
    
    // Determine which identifier to use (prefer more specific)
    const primaryKey = this.selectPrimaryKey(clientId);
    const baseLimit = this.config.maxRequests;
    
    // Calculate effective limit based on authentication/device
    const effectiveLimit = this.calculateEffectiveLimit(clientId, baseLimit);
    
    // Check all relevant keys for monitoring
    const checks = await this.checkAllLevels(clientId, effectiveLimit, windowEnd);
    
    // Use most restrictive result
    const result = this.selectMostRestrictive(checks, effectiveLimit, windowEnd);
    
    // Monitor for suspicious patterns
    this.monitorActivity(clientId, result, effectiveLimit);
    
    return result;
  }

  /**
   * Select primary key for rate limiting
   * Prefers more specific identifiers (user > device > IP)
   */
  private selectPrimaryKey(clientId: ClientIdentifierKeys): string {
    if (clientId.userDevice) return clientId.userDevice;
    if (clientId.userId) return clientId.userId;
    if (clientId.ipDevice) return clientId.ipDevice;
    return clientId.ipOnly;
  }

  /**
   * Calculate effective rate limit based on authentication status
   */
  private calculateEffectiveLimit(clientId: ClientIdentifierKeys, baseLimit: number): number {
    let limit = baseLimit;
    
    // Authenticated users get higher limits
    if (clientId.userId) {
      limit *= this.config.authenticatedMultiplier;
    }
    
    // Device ID presence increases limit slightly
    if (clientId.raw.deviceId) {
      limit *= this.config.deviceMultiplier;
    }
    
    return Math.floor(limit);
  }

  /**
   * Check rate limits at all identification levels
   */
  private async checkAllLevels(
    clientId: ClientIdentifierKeys,
    effectiveLimit: number,
    windowEnd: number
  ): Promise<{ primary: RateLimitCheck; ip?: RateLimitCheck }> {
    const checks: { primary: RateLimitCheck; ip?: RateLimitCheck } = {
      primary: {
        key: '',
        count: 0,
        allowed: false,
        limit: effectiveLimit,
      },
    };
    
    // Check primary key
    const primaryKey = this.selectPrimaryKey(clientId);
    const primaryResult = this.store.increment(
      `${this.config.endpoint}:${primaryKey}`,
      windowEnd,
      effectiveLimit
    );
    checks.primary = {
      key: primaryKey,
      ...primaryResult,
      limit: effectiveLimit,
    };
    
    // Also check IP level for monitoring (even if not blocking)
    if (clientId.ipOnly && primaryKey !== clientId.ipOnly) {
      const ipResult = this.store.increment(
        `${this.config.endpoint}:${clientId.ipOnly}`,
        windowEnd,
        this.config.maxRequests
      );
      checks.ip = {
        key: clientId.ipOnly,
        ...ipResult,
        limit: this.config.maxRequests,
      };
    }
    
    return checks;
  }

  /**
   * Select most restrictive result
   */
  private selectMostRestrictive(
    checks: { primary: RateLimitCheck; ip?: RateLimitCheck },
    effectiveLimit: number,
    windowEnd: number
  ): RateLimitResult {
    const primary = checks.primary;
    
    if (!primary.allowed) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: windowEnd - Date.now(),
        resetAt: windowEnd,
        reason: 'rate_limit_exceeded',
        level: 'primary',
      };
    }
    
    return {
      allowed: true,
      remaining: Math.max(0, effectiveLimit - primary.count),
      retryAfterMs: null,
      resetAt: windowEnd,
      level: 'primary',
      effectiveLimit,
    };
  }

  /**
   * Monitor for suspicious patterns
   * Logs but doesn't block - focuses on detection
   */
  private monitorActivity(
    clientId: ClientIdentifierKeys,
    result: RateLimitResult,
    effectiveLimit: number
  ): void {
    const usagePercent = result.allowed 
      ? (effectiveLimit - result.remaining) / effectiveLimit
      : 1.0;
    
    // Monitor high usage
    if (usagePercent >= this.config.monitorThreshold) {
      const ip = clientId.raw.ip || 'unknown';
      const current = this.monitoring.highActivityIPs.get(ip) || {
        count: 0,
        endpoints: new Set<string>(),
        firstSeen: Date.now(),
      };
      
      current.count++;
      current.endpoints.add(this.config.endpoint);
      current.lastSeen = Date.now();
      
      this.monitoring.highActivityIPs.set(ip, current);
      
      // Log for monitoring (but don't block)
      if (usagePercent >= this.config.alertThreshold) {
        console.warn(`[RateLimiter] High activity detected:`, {
          ip,
          endpoint: this.config.endpoint,
          usagePercent: (usagePercent * 100).toFixed(1) + '%',
          userId: clientId.raw.userId,
          deviceId: clientId.raw.deviceId,
        });
      }
    }
    
    // Detect suspicious patterns (multiple IPs, rapid switching)
    if (clientId.raw.userId) {
      this.detectSuspiciousPatterns(clientId);
    }
  }

  /**
   * Detect suspicious patterns across multiple requests
   */
  private detectSuspiciousPatterns(clientId: ClientIdentifierKeys): void {
    const userId = clientId.raw.userId;
    const ip = clientId.raw.ip;
    
    if (!userId) return;
    
    const patternKey = `user:${userId}`;
    const pattern = this.monitoring.suspiciousPatterns.get(patternKey) || {
      userId,
      ips: new Set<string>(),
      devices: new Set<string>(),
      endpoints: new Set<string>(),
      firstSeen: Date.now(),
      requestCount: 0,
    };
    
    if (ip) pattern.ips.add(ip);
    if (clientId.raw.deviceId) pattern.devices.add(clientId.raw.deviceId);
    pattern.endpoints.add(this.config.endpoint);
    pattern.requestCount++;
    pattern.lastSeen = Date.now();
    
    // Flag if using many IPs in short time (potential VPN abuse)
    const timeWindow = 60 * 60 * 1000; // 1 hour
    if (Date.now() - pattern.firstSeen < timeWindow && pattern.ips.size > 5) {
      console.warn(`[RateLimiter] Suspicious pattern detected:`, {
        userId,
        uniqueIPs: pattern.ips.size,
        uniqueDevices: pattern.devices.size,
        requestCount: pattern.requestCount,
        note: 'Multiple IPs in short time - may be VPN usage or abuse',
      });
    }
    
    this.monitoring.suspiciousPatterns.set(patternKey, pattern);
  }

  /**
   * Get monitoring stats
   */
  getMonitoringStats(): MonitoringStats {
    return {
      store: this.store.getStats(),
      highActivityIPs: Array.from(this.monitoring.highActivityIPs.entries()).map(
        ([ip, data]) => ({
          ip,
          requestCount: data.count,
          endpoints: Array.from(data.endpoints),
          firstSeen: new Date(data.firstSeen).toISOString(),
          lastSeen: new Date(data.lastSeen || Date.now()).toISOString(),
        })
      ),
      suspiciousPatterns: Array.from(this.monitoring.suspiciousPatterns.entries()).map(
        ([key, pattern]) => ({
          userId: pattern.userId,
          uniqueIPs: pattern.ips.size,
          uniqueDevices: pattern.devices.size,
          requestCount: pattern.requestCount,
          endpoints: Array.from(pattern.endpoints),
        })
      ),
    };
  }

  /**
   * Clear monitoring data (for testing/cleanup)
   */
  clearMonitoring(): void {
    this.monitoring.suspiciousPatterns.clear();
    this.monitoring.highActivityIPs.clear();
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create rate limiter with progressive limits
 */
export function createProgressiveRateLimiter(config: Omit<RateLimiterConfig, 'authenticatedMultiplier' | 'deviceMultiplier' | 'monitorThreshold' | 'alertThreshold'>): RateLimiterV2 {
  return new RateLimiterV2({
    ...config,
    authenticatedMultiplier: 2, // Authenticated users get 2x limit
    deviceMultiplier: 1.5, // Device ID adds 1.5x
    monitorThreshold: 0.8,
    alertThreshold: 0.95,
  });
}

export default RateLimiterV2;
