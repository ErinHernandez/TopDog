/**
 * Draft Session Storage Utility
 *
 * Centralized management of draft-related session state.
 * Handles authorization, draft options, and return navigation.
 *
 * @example
 * ```ts
 * // Join a draft
 * draftSession.join('room-123', { entries: 3, speed: 'fast' });
 *
 * // Check authorization
 * if (draftSession.isAuthorizedForRoom('room-123')) { ... }
 *
 * // Leave draft and set return destination
 * draftSession.leave('live-drafts');
 *
 * // Read return destination (in app shell)
 * const dest = draftSession.getReturnDestination();
 * if (dest) {
 *   setActiveTab(dest.tab);
 *   draftSession.clearReturnDestination();
 * }
 * ```
 */

import { createScopedLogger } from './clientLogger';

const logger = createScopedLogger('[DraftSession]');

// ============================================================================
// Types
// ============================================================================

export type DraftSpeed = 'fast' | 'slow';
export type ReturnTab = 'live-drafts' | 'lobby' | 'my-teams';

export interface DraftOptions {
  entries: number;
  speed: DraftSpeed;
}

export interface ActiveDraft {
  roomId: string;
  joinedAt: number;
  entries: number;
  speed: DraftSpeed;
}

export interface ReturnDestination {
  tab: ReturnTab;
  roomId?: string;
  timestamp: number;
}

interface DraftSessionData {
  activeDraft: ActiveDraft | null;
  returnDestination: ReturnDestination | null;
  version: number; // For future migrations
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'topdog_draft_session';
const CURRENT_VERSION = 1;

// Session expiry (4 hours) - prevents stale sessions
const SESSION_EXPIRY_MS = 4 * 60 * 60 * 1000;

// ============================================================================
// Private Helpers
// ============================================================================

function isSessionExpired(joinedAt: number): boolean {
  return Date.now() - joinedAt > SESSION_EXPIRY_MS;
}

function createEmptySession(): DraftSessionData {
  return {
    activeDraft: null,
    returnDestination: null,
    version: CURRENT_VERSION,
  };
}

function getData(): DraftSessionData | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw) as DraftSessionData;

    // Version check for future migrations
    if (data.version !== CURRENT_VERSION) {
      logger.debug('Session version mismatch, clearing');
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // Check if active draft is expired
    if (data.activeDraft && isSessionExpired(data.activeDraft.joinedAt)) {
      logger.debug('Active draft expired, clearing');
      data.activeDraft = null;
      setData(data);
    }

    return data;
  } catch (e) {
    logger.warn('Failed to parse session data', e);
    return null;
  }
}

function setData(data: DraftSessionData): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    logger.error('Failed to save session data', e);
  }
}

// ============================================================================
// Public API
// ============================================================================

export const draftSession = {
  /**
   * Record that user has joined a draft room.
   * Call this when user confirms joining from the lobby.
   */
  join(roomId: string, options: DraftOptions): void {
    logger.debug('Joining draft', { roomId, options });

    const data = getData() ?? createEmptySession();
    data.activeDraft = {
      roomId,
      joinedAt: Date.now(),
      entries: options.entries,
      speed: options.speed,
    };
    // Clear any stale return destination
    data.returnDestination = null;
    setData(data);
  },

  /**
   * Get the currently active draft session, if any.
   */
  getActiveDraft(): ActiveDraft | null {
    const data = getData();
    return data?.activeDraft ?? null;
  },

  /**
   * Check if user is authorized to access a specific draft room.
   * Returns true if:
   * - User has an active session for this exact roomId, OR
   * - roomId is provided via deep link (validated separately)
   */
  isAuthorizedForRoom(roomId: string): boolean {
    const active = this.getActiveDraft();
    const isAuthorized = active?.roomId === roomId;
    logger.debug('Authorization check', { roomId, isAuthorized, activeRoomId: active?.roomId });
    return isAuthorized;
  },

  /**
   * Check if user has any active draft session.
   */
  hasActiveDraft(): boolean {
    return this.getActiveDraft() !== null;
  },

  /**
   * Get draft options for the active session.
   * Useful for passing to DraftRoomVX2.
   */
  getDraftOptions(): DraftOptions | null {
    const active = this.getActiveDraft();
    if (!active) return null;
    return {
      entries: active.entries,
      speed: active.speed,
    };
  },

  /**
   * Record that user is leaving the draft.
   * Sets return destination for the app shell to read.
   *
   * @param returnTab - Which tab to navigate to after leaving
   * @param roomId - Optional roomId for context (e.g., to highlight in live-drafts)
   */
  leave(returnTab: ReturnTab = 'live-drafts', roomId?: string): void {
    logger.debug('Leaving draft', { returnTab, roomId });

    const data = getData() ?? createEmptySession();
    data.activeDraft = null;
    data.returnDestination = {
      tab: returnTab,
      roomId,
      timestamp: Date.now(),
    };
    setData(data);
  },

  /**
   * Mark draft as complete without setting return destination.
   * Use when draft finishes naturally.
   */
  complete(): void {
    logger.debug('Draft completed');

    const data = getData() ?? createEmptySession();
    data.activeDraft = null;
    setData(data);
  },

  /**
   * Get the return destination set when user left a draft.
   * App shell should check this on mount and navigate accordingly.
   */
  getReturnDestination(): ReturnDestination | null {
    const data = getData();
    const dest = data?.returnDestination ?? null;

    // Expire return destination after 5 minutes
    if (dest && Date.now() - dest.timestamp > 5 * 60 * 1000) {
      logger.debug('Return destination expired');
      this.clearReturnDestination();
      return null;
    }

    return dest;
  },

  /**
   * Clear the return destination after navigating.
   * Call this after the app shell has processed the return.
   */
  clearReturnDestination(): void {
    const data = getData();
    if (data && data.returnDestination) {
      data.returnDestination = null;
      setData(data);
      logger.debug('Return destination cleared');
    }
  },

  /**
   * Clear all draft session data.
   * Call on logout or when resetting state.
   */
  clear(): void {
    logger.debug('Clearing all draft session data');
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(STORAGE_KEY);
  },

  /**
   * Clear all topdog_* prefixed session storage items.
   * Use for full cleanup on logout.
   */
  clearAll(): void {
    logger.debug('Clearing all topdog session data');
    if (typeof window === 'undefined') return;

    // Clear main session
    sessionStorage.removeItem(STORAGE_KEY);

    // Clear legacy flags
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('topdog_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));

    logger.debug('Cleared legacy flags', { count: keysToRemove.length });
  },

  /**
   * Debug helper - get raw session data.
   * Only use for debugging/dev tools.
   */
  _debug(): DraftSessionData | null {
    return getData();
  },
};

export default draftSession;
