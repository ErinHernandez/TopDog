/**
 * Draft Version Tracking Utility
 * 
 * Lightweight utility to track which draft room version users are accessing.
 * Used for Phase 4: Draft Version Consolidation.
 * 
 * This utility is designed to:
 * - Not block the user experience
 * - Fail silently if analytics is unavailable
 * - Work in both client and server contexts
 * - Generate session IDs for anonymous tracking
 */

import React from 'react';

/**
 * Track draft version access
 * 
 * @param version - Draft version being accessed ('v2' | 'v3' | 'vx' | 'vx2')
 * @param roomId - Draft room ID (optional)
 * @param userId - User ID (optional, from auth context)
 */
export async function trackDraftVersion(
  version: 'v2' | 'v3' | 'vx' | 'vx2',
  roomId?: string | null,
  userId?: string | null
): Promise<void> {
  // Only run in browser
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Get or create session ID
    let sessionId = sessionStorage.getItem('draft_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('draft_session_id', sessionId);
    }

    // Track the version access
    await fetch('/api/analytics/draft-version', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version,
        userId: userId || null,
        sessionId,
        roomId: roomId || null,
      }),
    });

    // Silent success - don't log to avoid console noise
  } catch (error) {
    // Silent failure - analytics shouldn't break the app
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('[DraftVersionTracking] Failed to track version:', error);
    }
  }
}

/**
 * React hook for tracking draft version
 * 
 * Usage:
 * ```tsx
 * useDraftVersionTracking('vx2', roomId, user?.uid);
 * ```
 */
export function useDraftVersionTracking(
  version: 'v2' | 'v3' | 'vx' | 'vx2',
  roomId?: string | null,
  userId?: string | null
): void {
  // Only run in browser
  if (typeof window === 'undefined') {
    return;
  }

  // Use useEffect to track on mount
  React.useEffect(() => {
    if (roomId) {
      trackDraftVersion(version, roomId, userId);
    }
  }, [version, roomId, userId]);
}
