/**
 * VX2 Session Manager
 * 
 * Client-side session management for auth:
 * - Session timeout detection
 * - Activity tracking
 * - Multi-tab synchronization
 * - Remember me functionality
 */

// ============================================================================
// TYPES
// ============================================================================

interface SessionConfig {
  /** Session timeout in milliseconds */
  timeoutMs: number;
  /** Warning before timeout (ms) */
  warningMs: number;
  /** Activity events to track */
  activityEvents: string[];
  /** Storage key prefix */
  keyPrefix: string;
}

interface SessionState {
  isActive: boolean;
  lastActivity: number;
  expiresAt: number;
  tabId: string;
}

type SessionEventType = 
  | 'activity'
  | 'warning'
  | 'timeout'
  | 'extended'
  | 'tab_conflict';

interface SessionEvent {
  type: SessionEventType;
  timestamp: number;
  data?: unknown;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: SessionConfig = {
  timeoutMs: 30 * 60 * 1000, // 30 minutes
  warningMs: 5 * 60 * 1000, // 5 minute warning
  activityEvents: ['mousedown', 'keydown', 'scroll', 'touchstart'],
  keyPrefix: 'topdog_session_',
};

// ============================================================================
// SESSION MANAGER CLASS
// ============================================================================

export class SessionManager {
  private config: SessionConfig;
  private tabId: string;
  private isInitialized: boolean = false;
  private activityHandler: (() => void) | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private listeners: Map<SessionEventType, Set<(event: SessionEvent) => void>> = new Map();
  
  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.tabId = this.generateTabId();
  }
  
  /**
   * Generate unique tab ID
   */
  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get storage key
   */
  private getKey(suffix: string): string {
    return `${this.config.keyPrefix}${suffix}`;
  }
  
  /**
   * Get session state from storage
   */
  private getState(): SessionState | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.getKey('state'));
      if (!stored) return null;
      return JSON.parse(stored) as SessionState;
    } catch {
      return null;
    }
  }
  
  /**
   * Save session state to storage
   */
  private setState(state: SessionState): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.getKey('state'), JSON.stringify(state));
    } catch {
      // Storage unavailable
    }
  }
  
  /**
   * Clear session state
   */
  private clearState(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(this.getKey('state'));
    } catch {
      // Ignore errors
    }
  }
  
  /**
   * Emit event to listeners
   */
  private emit(type: SessionEventType, data?: unknown): void {
    const event: SessionEvent = {
      type,
      timestamp: Date.now(),
      data,
    };
    
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.forEach(listener => listener(event));
    }
  }
  
  /**
   * Handle user activity
   */
  private handleActivity = (): void => {
    const now = Date.now();
    const state = this.getState();
    
    if (!state?.isActive) return;
    
    // Update last activity
    this.setState({
      ...state,
      lastActivity: now,
      expiresAt: now + this.config.timeoutMs,
    });
    
    this.emit('activity');
  };
  
  /**
   * Check session status
   */
  private checkSession = (): void => {
    const now = Date.now();
    const state = this.getState();
    
    if (!state?.isActive) return;
    
    // Check if another tab took over
    if (state.tabId !== this.tabId) {
      this.emit('tab_conflict', { activeTabId: state.tabId });
      return;
    }
    
    // Check for timeout
    if (now >= state.expiresAt) {
      this.emit('timeout');
      this.end();
      return;
    }
    
    // Check for warning
    const timeRemaining = state.expiresAt - now;
    if (timeRemaining <= this.config.warningMs) {
      this.emit('warning', { timeRemaining });
    }
  };
  
  /**
   * Handle storage events (for multi-tab sync)
   */
  private handleStorageChange = (event: StorageEvent): void => {
    if (event.key !== this.getKey('state')) return;
    
    if (!event.newValue) {
      // Session ended in another tab
      this.emit('timeout');
      this.cleanup();
      return;
    }
    
    try {
      const newState = JSON.parse(event.newValue) as SessionState;
      
      // Another tab extended the session
      if (newState.tabId !== this.tabId && newState.isActive) {
        this.emit('extended', { byTabId: newState.tabId });
      }
    } catch {
      // Ignore parse errors
    }
  };
  
  /**
   * Clean up event listeners
   */
  private cleanup(): void {
    if (this.activityHandler) {
      this.config.activityEvents.forEach(event => {
        window.removeEventListener(event, this.activityHandler!);
      });
      this.activityHandler = null;
    }
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    window.removeEventListener('storage', this.handleStorageChange);
    this.isInitialized = false;
  }
  
  /**
   * Initialize session management
   */
  start(): void {
    if (typeof window === 'undefined' || this.isInitialized) return;
    
    const now = Date.now();
    
    // Set initial state
    this.setState({
      isActive: true,
      lastActivity: now,
      expiresAt: now + this.config.timeoutMs,
      tabId: this.tabId,
    });
    
    // Add activity listeners
    this.activityHandler = this.handleActivity;
    this.config.activityEvents.forEach(event => {
      window.addEventListener(event, this.activityHandler!, { passive: true });
    });
    
    // Add storage listener for multi-tab sync
    window.addEventListener('storage', this.handleStorageChange);
    
    // Start check interval
    this.checkInterval = setInterval(this.checkSession, 10000); // Check every 10 seconds
    
    this.isInitialized = true;
  }
  
  /**
   * End session
   */
  end(): void {
    this.clearState();
    this.cleanup();
    this.emit('timeout');
  }
  
  /**
   * Extend session
   */
  extend(): void {
    const state = this.getState();
    if (!state?.isActive) return;
    
    const now = Date.now();
    this.setState({
      ...state,
      lastActivity: now,
      expiresAt: now + this.config.timeoutMs,
      tabId: this.tabId, // Take over as active tab
    });
    
    this.emit('extended');
  }
  
  /**
   * Get time remaining until timeout
   */
  getTimeRemaining(): number {
    const state = this.getState();
    if (!state?.isActive) return 0;
    
    return Math.max(0, state.expiresAt - Date.now());
  }
  
  /**
   * Check if session is active
   */
  isActive(): boolean {
    const state = this.getState();
    if (!state?.isActive) return false;
    
    return Date.now() < state.expiresAt;
  }
  
  /**
   * Add event listener
   */
  on(type: SessionEventType, listener: (event: SessionEvent) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    
    this.listeners.get(type)!.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(type)?.delete(listener);
    };
  }
  
  /**
   * Remove event listener
   */
  off(type: SessionEventType, listener: (event: SessionEvent) => void): void {
    this.listeners.get(type)?.delete(listener);
  }
}

// ============================================================================
// REMEMBER ME
// ============================================================================

const REMEMBER_ME_KEY = 'topdog_remember_me';
const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export function setRememberMe(email: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify({
      email,
      expiresAt: Date.now() + REMEMBER_ME_DURATION,
    }));
  } catch {
    // Storage unavailable
  }
}

export function getRememberMe(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(REMEMBER_ME_KEY);
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    if (Date.now() > data.expiresAt) {
      clearRememberMe();
      return null;
    }
    
    return data.email;
  } catch {
    return null;
  }
}

export function clearRememberMe(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(REMEMBER_ME_KEY);
  } catch {
    // Ignore errors
  }
}

// ============================================================================
// HOOK
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSessionReturn {
  isActive: boolean;
  timeRemaining: number;
  showWarning: boolean;
  extend: () => void;
  end: () => void;
}

export function useSession(config: Partial<SessionConfig> = {}): UseSessionReturn {
  const managerRef = useRef<SessionManager | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  
  useEffect(() => {
    const manager = new SessionManager(config);
    managerRef.current = manager;
    
    // Start session
    manager.start();
    setIsActive(true);
    setTimeRemaining(manager.getTimeRemaining());
    
    // Listen for events
    const unsubWarning = manager.on('warning', (event) => {
      setShowWarning(true);
      setTimeRemaining((event.data as { timeRemaining: number }).timeRemaining);
    });
    
    const unsubTimeout = manager.on('timeout', () => {
      setIsActive(false);
      setShowWarning(false);
      setTimeRemaining(0);
    });
    
    const unsubExtended = manager.on('extended', () => {
      setShowWarning(false);
      setTimeRemaining(manager.getTimeRemaining());
    });
    
    // Update time remaining periodically
    const interval = setInterval(() => {
      setTimeRemaining(manager.getTimeRemaining());
    }, 1000);
    
    return () => {
      unsubWarning();
      unsubTimeout();
      unsubExtended();
      clearInterval(interval);
      manager.end();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  const extend = useCallback(() => {
    managerRef.current?.extend();
    setShowWarning(false);
  }, []);
  
  const end = useCallback(() => {
    managerRef.current?.end();
  }, []);
  
  return {
    isActive,
    timeRemaining,
    showWarning,
    extend,
    end,
  };
}

export default SessionManager;

