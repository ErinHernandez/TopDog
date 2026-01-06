/**
 * VX2 Rate Limiter
 * 
 * Client-side rate limiting for auth operations.
 * Works with localStorage to persist across page refreshes.
 * 
 * NOTE: This is a client-side implementation for UX purposes.
 * Server-side rate limiting should also be implemented.
 */

// ============================================================================
// TYPES
// ============================================================================

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

interface RateLimitConfig {
  /** Maximum attempts allowed in the window */
  maxAttempts: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Lockout duration in milliseconds after max attempts */
  lockoutMs: number;
  /** Key prefix for storage */
  keyPrefix?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number | null;
  isLocked: boolean;
}

// ============================================================================
// DEFAULT CONFIGS
// ============================================================================

export const RATE_LIMIT_CONFIGS = {
  /** Login attempts */
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    lockoutMs: 15 * 60 * 1000, // 15 minute lockout
    keyPrefix: 'rl_login_',
  },
  /** Sign up attempts */
  signup: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutMs: 60 * 60 * 1000, // 1 hour lockout
    keyPrefix: 'rl_signup_',
  },
  /** Password reset requests */
  passwordReset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutMs: 60 * 60 * 1000, // 1 hour lockout
    keyPrefix: 'rl_pwreset_',
  },
  /** Phone verification attempts */
  phoneVerify: {
    maxAttempts: 5,
    windowMs: 10 * 60 * 1000, // 10 minutes
    lockoutMs: 30 * 60 * 1000, // 30 minute lockout
    keyPrefix: 'rl_phone_',
  },
  /** Username availability checks */
  usernameCheck: {
    maxAttempts: 30,
    windowMs: 60 * 1000, // 1 minute
    lockoutMs: 60 * 1000, // 1 minute lockout
    keyPrefix: 'rl_username_',
  },
  /** API calls (general) */
  api: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minute
    lockoutMs: 60 * 1000, // 1 minute lockout
    keyPrefix: 'rl_api_',
  },
} as const;

// ============================================================================
// RATE LIMITER CLASS
// ============================================================================

export class RateLimiter {
  private config: RateLimitConfig;
  private storageKey: string;
  
  constructor(config: RateLimitConfig, identifier: string = 'default') {
    this.config = config;
    this.storageKey = `${config.keyPrefix || 'rl_'}${identifier}`;
  }
  
  /**
   * Get current rate limit entry from storage
   */
  private getEntry(): RateLimitEntry | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;
      return JSON.parse(stored) as RateLimitEntry;
    } catch {
      return null;
    }
  }
  
  /**
   * Save rate limit entry to storage
   */
  private setEntry(entry: RateLimitEntry): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(entry));
    } catch {
      // Storage full or unavailable
    }
  }
  
  /**
   * Clear rate limit entry
   */
  private clearEntry(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // Ignore errors
    }
  }
  
  /**
   * Check if an action is allowed and record the attempt
   */
  check(): RateLimitResult {
    const now = Date.now();
    const entry = this.getEntry();
    
    // No previous entry - first attempt
    if (!entry) {
      this.setEntry({
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        lockedUntil: null,
      });
      
      return {
        allowed: true,
        remaining: this.config.maxAttempts - 1,
        retryAfterMs: null,
        isLocked: false,
      };
    }
    
    // Check if currently locked out
    if (entry.lockedUntil && entry.lockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: entry.lockedUntil - now,
        isLocked: true,
      };
    }
    
    // Check if window has expired - reset counter
    if (now - entry.firstAttempt > this.config.windowMs) {
      this.setEntry({
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        lockedUntil: null,
      });
      
      return {
        allowed: true,
        remaining: this.config.maxAttempts - 1,
        retryAfterMs: null,
        isLocked: false,
      };
    }
    
    // Check if we've hit the limit
    if (entry.count >= this.config.maxAttempts) {
      // Apply lockout
      const lockedUntil = now + this.config.lockoutMs;
      this.setEntry({
        ...entry,
        lockedUntil,
        lastAttempt: now,
      });
      
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: this.config.lockoutMs,
        isLocked: true,
      };
    }
    
    // Increment counter
    const newCount = entry.count + 1;
    this.setEntry({
      ...entry,
      count: newCount,
      lastAttempt: now,
    });
    
    return {
      allowed: true,
      remaining: this.config.maxAttempts - newCount,
      retryAfterMs: null,
      isLocked: false,
    };
  }
  
  /**
   * Get current status without incrementing
   */
  status(): RateLimitResult {
    const now = Date.now();
    const entry = this.getEntry();
    
    if (!entry) {
      return {
        allowed: true,
        remaining: this.config.maxAttempts,
        retryAfterMs: null,
        isLocked: false,
      };
    }
    
    // Check lockout
    if (entry.lockedUntil && entry.lockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: entry.lockedUntil - now,
        isLocked: true,
      };
    }
    
    // Check window expiry
    if (now - entry.firstAttempt > this.config.windowMs) {
      return {
        allowed: true,
        remaining: this.config.maxAttempts,
        retryAfterMs: null,
        isLocked: false,
      };
    }
    
    const remaining = Math.max(0, this.config.maxAttempts - entry.count);
    
    return {
      allowed: remaining > 0,
      remaining,
      retryAfterMs: remaining > 0 ? null : this.config.lockoutMs,
      isLocked: remaining === 0,
    };
  }
  
  /**
   * Reset the rate limit (e.g., after successful auth)
   */
  reset(): void {
    this.clearEntry();
  }
  
  /**
   * Record a successful attempt (resets lockout)
   */
  success(): void {
    this.reset();
  }
  
  /**
   * Get time until window resets
   */
  getResetTime(): number {
    const entry = this.getEntry();
    if (!entry) return 0;
    
    const now = Date.now();
    const resetAt = entry.firstAttempt + this.config.windowMs;
    return Math.max(0, resetAt - now);
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create a rate limiter for login attempts
 */
export function createLoginLimiter(identifier: string = 'default'): RateLimiter {
  return new RateLimiter(RATE_LIMIT_CONFIGS.login, identifier);
}

/**
 * Create a rate limiter for signup attempts
 */
export function createSignupLimiter(identifier: string = 'default'): RateLimiter {
  return new RateLimiter(RATE_LIMIT_CONFIGS.signup, identifier);
}

/**
 * Create a rate limiter for password reset
 */
export function createPasswordResetLimiter(identifier: string = 'default'): RateLimiter {
  return new RateLimiter(RATE_LIMIT_CONFIGS.passwordReset, identifier);
}

/**
 * Create a rate limiter for phone verification
 */
export function createPhoneVerifyLimiter(identifier: string = 'default'): RateLimiter {
  return new RateLimiter(RATE_LIMIT_CONFIGS.phoneVerify, identifier);
}

/**
 * Format retry time for display
 */
export function formatRetryTime(ms: number): string {
  if (ms <= 0) return '';
  
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  
  const hours = Math.ceil(minutes / 60);
  return `${hours}h`;
}

// ============================================================================
// HOOK
// ============================================================================

import { useState, useCallback, useEffect } from 'react';

interface UseRateLimitReturn {
  check: () => RateLimitResult;
  status: RateLimitResult;
  reset: () => void;
  formatRetryTime: (ms: number) => string;
}

export function useRateLimit(
  config: RateLimitConfig | keyof typeof RATE_LIMIT_CONFIGS,
  identifier: string = 'default'
): UseRateLimitReturn {
  const resolvedConfig = typeof config === 'string' 
    ? RATE_LIMIT_CONFIGS[config] 
    : config;
  
  const [limiter] = useState(() => new RateLimiter(resolvedConfig, identifier));
  const [status, setStatus] = useState<RateLimitResult>(() => limiter.status());
  
  const check = useCallback(() => {
    const result = limiter.check();
    setStatus(result);
    return result;
  }, [limiter]);
  
  const reset = useCallback(() => {
    limiter.reset();
    setStatus(limiter.status());
  }, [limiter]);
  
  // Refresh status periodically if locked
  useEffect(() => {
    if (!status.isLocked || !status.retryAfterMs) return;
    
    const interval = setInterval(() => {
      setStatus(limiter.status());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [status.isLocked, status.retryAfterMs, limiter]);
  
  return {
    check,
    status,
    reset,
    formatRetryTime,
  };
}

export default RateLimiter;

