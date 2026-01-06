/**
 * Dynamic Island / Live Activity Integration for Draft Timer
 * 
 * This module provides integration with iOS Dynamic Island and Live Activities
 * to show draft timer when the user navigates away from the app.
 * 
 * Requirements:
 * - iOS 16.1+ with iPhone 14 Pro or later (for Dynamic Island)
 * - iOS 16.1+ for Live Activities on other devices
 * - User must grant notification permissions
 * - App must be installed as PWA or accessed through native wrapper
 * 
 * Note: Full Dynamic Island support requires a native iOS app wrapper.
 * This implementation provides the web-side infrastructure and can communicate
 * with a native app via postMessage or a native bridge.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface DraftTimerActivityState {
  /** Unique ID for this draft activity */
  activityId: string;
  /** Room ID for the draft */
  roomId: string;
  /** Seconds remaining on the timer */
  secondsRemaining: number;
  /** Total seconds for the pick */
  totalSeconds: number;
  /** Whether it's the user's turn to pick */
  isMyTurn: boolean;
  /** Current pick number */
  currentPickNumber: number;
  /** Total picks in draft */
  totalPicks: number;
  /** Current drafter's name */
  currentDrafter: string;
  /** Draft status */
  status: 'pre_draft' | 'active' | 'paused' | 'completed' | 'expired';
  /** Optional: Player being drafted (for other users' picks) */
  lastPickedPlayer?: string;
  /** Optional: Scheduled draft start time (ISO string) for pre-draft countdown */
  draftStartTime?: string;
}

export interface DynamicIslandConfig {
  /** Whether Dynamic Island is enabled */
  enabled: boolean;
  /** Whether the device supports Dynamic Island */
  isSupported: boolean;
  /** Whether we have permission to show live activities */
  hasPermission: boolean;
}

type NativeBridgeCallback = (data: DraftTimerActivityState) => void;

// ============================================================================
// DEVICE DETECTION
// ============================================================================

/**
 * Check if the device supports Dynamic Island (iPhone 14 Pro+)
 */
export function isDynamicIslandSupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(userAgent);
  
  if (!isIOS) return false;
  
  // Check for iOS 16.1+ (Live Activities minimum)
  const match = userAgent.match(/OS (\d+)_(\d+)/);
  if (match) {
    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);
    if (major > 16 || (major === 16 && minor >= 1)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if Live Activities are supported (iOS 16.1+, any device)
 */
export function isLiveActivitySupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(userAgent);
  
  if (!isIOS) return false;
  
  const match = userAgent.match(/OS (\d+)_(\d+)/);
  if (match) {
    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);
    return major > 16 || (major === 16 && minor >= 1);
  }
  
  return false;
}

// ============================================================================
// NATIVE BRIDGE
// ============================================================================

// Global callback registry for native bridge
const nativeCallbacks: Set<NativeBridgeCallback> = new Set();

/**
 * Check if native app wrapper is available
 */
export function isNativeBridgeAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for webkit message handlers (iOS WKWebView)
  // @ts-ignore - webkit is injected by native app
  return !!(window.webkit?.messageHandlers?.dynamicIsland);
}

/**
 * Send message to native app
 */
function sendToNative(action: string, payload: Record<string, unknown>): void {
  if (!isNativeBridgeAvailable()) return;
  
  try {
    // @ts-ignore - webkit is injected by native app
    window.webkit.messageHandlers.dynamicIsland.postMessage({
      action,
      payload,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.warn('[DynamicIsland] Failed to send to native:', error);
  }
}

/**
 * Register callback for native bridge responses
 */
export function onNativeBridgeMessage(callback: NativeBridgeCallback): () => void {
  nativeCallbacks.add(callback);
  return () => nativeCallbacks.delete(callback);
}

// Set up global handler for native responses
if (typeof window !== 'undefined') {
  // @ts-ignore - Custom event from native app
  window.handleDynamicIslandResponse = (data: DraftTimerActivityState) => {
    nativeCallbacks.forEach(cb => cb(data));
  };
}

// ============================================================================
// LIVE ACTIVITY MANAGEMENT
// ============================================================================

let currentActivityId: string | null = null;

/**
 * Start a new draft timer Live Activity
 */
export async function startDraftTimerActivity(
  state: Omit<DraftTimerActivityState, 'activityId'>
): Promise<string | null> {
  if (!isLiveActivitySupported()) {
    console.log('[DynamicIsland] Live Activities not supported on this device');
    return null;
  }
  
  const activityId = `draft-${state.roomId}-${Date.now()}`;
  const activityState: DraftTimerActivityState = {
    ...state,
    activityId,
  };
  
  if (isNativeBridgeAvailable()) {
    // Send to native app to create Live Activity
    sendToNative('startActivity', activityState);
    currentActivityId = activityId;
    return activityId;
  }
  
  // Fallback: Use Web Push API with "ongoing" notification
  // This won't show in Dynamic Island but provides similar functionality
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const registration = await navigator.serviceWorker?.ready;
      if (registration) {
        // Format notification body based on status
        let notificationBody: string;
        if (state.status === 'pre_draft') {
          const minutes = Math.floor(state.secondsRemaining / 60);
          const seconds = state.secondsRemaining % 60;
          notificationBody = `Draft starts in ${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else if (state.isMyTurn) {
          notificationBody = `Your pick! ${state.secondsRemaining}s remaining`;
        } else {
          notificationBody = `${state.currentDrafter} is picking...`;
        }
        
        await registration.showNotification('Draft Timer', {
          body: notificationBody,
          tag: `draft-timer-${state.roomId}`,
          requireInteraction: true,
          silent: true,
          data: activityState,
        });
        currentActivityId = activityId;
        return activityId;
      }
    } catch (error) {
      console.warn('[DynamicIsland] Failed to create notification:', error);
    }
  }
  
  // Store state for PWA background sync
  if ('localStorage' in window) {
    localStorage.setItem('topdog_draft_activity', JSON.stringify(activityState));
  }
  
  currentActivityId = activityId;
  return activityId;
}

/**
 * Update an existing Live Activity
 */
export async function updateDraftTimerActivity(
  state: Partial<DraftTimerActivityState> & { activityId: string }
): Promise<boolean> {
  if (!state.activityId || state.activityId !== currentActivityId) {
    return false;
  }
  
  if (isNativeBridgeAvailable()) {
    sendToNative('updateActivity', state);
    return true;
  }
  
  // Update web notification
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const registration = await navigator.serviceWorker?.ready;
      if (registration) {
        // Get stored state and merge
        const storedRaw = localStorage.getItem('topdog_draft_activity');
        const stored = storedRaw ? JSON.parse(storedRaw) : {};
        const merged = { ...stored, ...state };
        
        // Format notification body based on status
        let notificationBody: string;
        if (merged.status === 'pre_draft') {
          const minutes = Math.floor(merged.secondsRemaining / 60);
          const seconds = merged.secondsRemaining % 60;
          notificationBody = `Draft starts in ${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else if (merged.isMyTurn) {
          notificationBody = `Your pick! ${merged.secondsRemaining}s remaining`;
        } else {
          notificationBody = `${merged.currentDrafter} is picking...`;
        }
        
        await registration.showNotification('Draft Timer', {
          body: notificationBody,
          tag: `draft-timer-${merged.roomId}`,
          requireInteraction: true,
          silent: true,
          renotify: false,
          data: merged,
        });
        
        localStorage.setItem('topdog_draft_activity', JSON.stringify(merged));
        return true;
      }
    } catch (error) {
      console.warn('[DynamicIsland] Failed to update notification:', error);
    }
  }
  
  return false;
}

/**
 * End the current Live Activity
 */
export async function endDraftTimerActivity(
  activityId?: string,
  reason: 'completed' | 'cancelled' | 'left' = 'completed'
): Promise<void> {
  const targetId = activityId || currentActivityId;
  if (!targetId) return;
  
  if (isNativeBridgeAvailable()) {
    sendToNative('endActivity', { activityId: targetId, reason });
  }
  
  // Clear web notification
  if ('Notification' in window) {
    try {
      const registration = await navigator.serviceWorker?.ready;
      if (registration) {
        const notifications = await registration.getNotifications({ 
          tag: `draft-timer-${targetId.split('-')[1]}` 
        });
        notifications.forEach(n => n.close());
      }
    } catch (error) {
      // Ignore errors when clearing
    }
  }
  
  // Clear stored state
  localStorage.removeItem('topdog_draft_activity');
  currentActivityId = null;
}

// ============================================================================
// PERMISSION MANAGEMENT
// ============================================================================

/**
 * Request permission for Live Activities / notifications
 */
export async function requestLiveActivityPermission(): Promise<boolean> {
  if (isNativeBridgeAvailable()) {
    // Request through native app
    return new Promise((resolve) => {
      const unsubscribe = onNativeBridgeMessage((data) => {
        // @ts-ignore - permission response
        if (data.permissionGranted !== undefined) {
          unsubscribe();
          // @ts-ignore
          resolve(data.permissionGranted);
        }
      });
      sendToNative('requestPermission', {});
      
      // Timeout after 30 seconds
      setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, 30000);
    });
  }
  
  // Fallback to web notifications
  if ('Notification' in window) {
    const result = await Notification.requestPermission();
    return result === 'granted';
  }
  
  return false;
}

/**
 * Check current permission status
 */
export function getLiveActivityPermissionStatus(): 'granted' | 'denied' | 'default' | 'unavailable' {
  if (isNativeBridgeAvailable()) {
    // Would need to query native app - return default for now
    return 'default';
  }
  
  if ('Notification' in window) {
    return Notification.permission;
  }
  
  return 'unavailable';
}

// ============================================================================
// CONFIG HELPER
// ============================================================================

/**
 * Get the current Dynamic Island configuration
 */
export function getDynamicIslandConfig(): DynamicIslandConfig {
  const enabled = typeof localStorage !== 'undefined' 
    ? localStorage.getItem('topdog_dynamic_island_enabled') === 'true'
    : false;
    
  return {
    enabled,
    isSupported: isDynamicIslandSupported() || isLiveActivitySupported(),
    hasPermission: getLiveActivityPermissionStatus() === 'granted',
  };
}

/**
 * Enable or disable Dynamic Island integration
 */
export function setDynamicIslandEnabled(enabled: boolean): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('topdog_dynamic_island_enabled', String(enabled));
  }
  
  if (!enabled && currentActivityId) {
    endDraftTimerActivity(currentActivityId, 'cancelled');
  }
}

