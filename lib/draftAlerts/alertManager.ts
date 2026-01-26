/**
 * Draft Alert System - Core Alert Manager
 * 
 * Handles alert triggering, deduplication, and delivery method selection
 */

import { DraftAlertType, DraftAlertState, AlertTriggerContext, AlertManagerConfig } from './types';
import { ALERT_MESSAGES, ALERT_STORAGE_KEY_PREFIX, ALERT_STORAGE_EXPIRY_MS, ALERT_TO_PREFERENCE } from './constants';
import { showDynamicIslandAlert } from './dynamicIslandAlerts';
import { showWebNotification } from './webNotifications';
import { playAlertSound, triggerHaptic } from './audioAlerts';

class AlertManager {
  private config: AlertManagerConfig | null = null;

  /**
   * Initialize alert manager with configuration
   */
  initialize(config: AlertManagerConfig): void {
    this.config = config;
  }

  /**
   * Get deduplication key with turn-based context
   * CORRECTED: Added round context for turn-based alerts
   */
  private getDeduplicationKey(
    roomId: string,
    alertType: DraftAlertType,
    context?: { round?: number; pick?: number }
  ): string {
    const baseKey = `${ALERT_STORAGE_KEY_PREFIX}${roomId}_${alertType}`;
    
    // For turn-based alerts, include round context
    if (alertType === DraftAlertType.TWO_PICKS_AWAY ||
        alertType === DraftAlertType.ON_THE_CLOCK ||
        alertType === DraftAlertType.TEN_SECONDS_REMAINING) {
      return `${baseKey}_r${context?.round ?? 0}`;
    }
    
    return baseKey;
  }

  /**
   * Check if an alert has already been fired
   */
  private hasAlertFired(
    roomId: string,
    alertType: DraftAlertType,
    context?: { round?: number; pick?: number }
  ): boolean {
    if (typeof window === 'undefined' || !('localStorage' in window)) {
      return false;
    }

    const key = this.getDeduplicationKey(roomId, alertType, context);
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return false;
    }

    try {
      const { timestamp } = JSON.parse(stored);
      const now = Date.now();

      // Check if expired (older than 24 hours)
      if (now - timestamp > ALERT_STORAGE_EXPIRY_MS) {
        localStorage.removeItem(key);
        return false;
      }

      return true;
    } catch {
      // Invalid storage, clear corrupted data and treat as not fired
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore errors when clearing
      }
      return false;
    }
  }

  /**
   * Mark an alert as fired
   */
  private markAlertFired(
    roomId: string,
    alertType: DraftAlertType,
    context?: { round?: number; pick?: number }
  ): void {
    if (typeof window === 'undefined' || !('localStorage' in window)) {
      return;
    }

    const key = this.getDeduplicationKey(roomId, alertType, context);
    const value = JSON.stringify({
      timestamp: Date.now(),
    });
    
    localStorage.setItem(key, value);
  }

  /**
   * Get alert message with variable substitution
   */
  private getAlertMessage(alertType: DraftAlertType, context: AlertTriggerContext): string {
    const template = ALERT_MESSAGES[alertType] || 'Alert';
    
    // Replace variables in template
    return template
      .replace('{countdown}', String(context.preDraftCountdown))
      .replace('{timer}', String(context.timer));
  }

  /**
   * Check if alert should fire based on preferences
   */
  private shouldFireAlert(alertType: DraftAlertType): boolean {
    if (!this.config) {
      return false;
    }

    // CORRECTED: Always enabled - delivery method varies by device
    // The config.enabled check is removed - alerts work for all users

    const preferenceKey = ALERT_TO_PREFERENCE[alertType];
    return this.config.preferences[preferenceKey] ?? true;
  }

  /**
   * Trigger an alert
   * CORRECTED: Added tab visibility check and audio/haptic support
   */
  async triggerAlert(
    alertType: DraftAlertType,
    context: AlertTriggerContext
  ): Promise<boolean> {
    // CORRECTED: Skip alerts if user is actively viewing the draft room
    if (typeof document !== 'undefined' &&
        document.visibilityState === 'visible' &&
        window.location.pathname.includes(context.roomId)) {
      // User is looking at the draft - no notification needed
      // But still play sound for urgent alerts
      if (alertType === DraftAlertType.ON_THE_CLOCK ||
          alertType === DraftAlertType.TEN_SECONDS_REMAINING) {
        await playAlertSound(alertType);
        triggerHaptic(alertType);
      }
      return false;
    }

    // Check if alert should fire
    if (!this.shouldFireAlert(alertType)) {
      return false;
    }

    // Check if already fired (with round context for turn-based alerts)
    const roundContext = {
      round: context.currentRound,
      pick: context.currentPick,
    };
    
    if (this.hasAlertFired(context.roomId, alertType, roundContext)) {
      return false;
    }

    // Create alert state
    const alertState: DraftAlertState = {
      type: alertType,
      roomId: context.roomId,
      message: this.getAlertMessage(alertType, context),
      timestamp: Date.now(),
      data: {
        roomId: context.roomId,
        roomStatus: context.roomStatus,
        isMyTurn: context.isMyTurn,
        timer: context.timer,
        picksUntilMyTurn: context.picksUntilMyTurn,
        currentRound: context.currentRound,
        currentPick: context.currentPick,
      },
    };

    // Show alert based on device support
    let success = false;
    
    if (this.config?.isDynamicIslandSupported) {
      success = await showDynamicIslandAlert(alertState);
    } else if (this.config?.isWebNotificationSupported) {
      success = await showWebNotification(alertState);
    }

    // Play sound and haptic for urgent alerts
    if (alertType === DraftAlertType.ON_THE_CLOCK ||
        alertType === DraftAlertType.TEN_SECONDS_REMAINING) {
      await playAlertSound(alertType);
      triggerHaptic(alertType);
    }

    // Mark as fired if successful
    if (success) {
      this.markAlertFired(context.roomId, alertType, roundContext);
    }

    return success;
  }

  /**
   * Clear fired alerts for a room (useful for testing or reset)
   */
  clearFiredAlerts(roomId: string): void {
    if (typeof window === 'undefined' || !('localStorage' in window)) {
      return;
    }

    Object.values(DraftAlertType).forEach((alertType) => {
      // Clear all rounds for this alert type
      for (let round = 0; round < 20; round++) {
        const key = this.getDeduplicationKey(roomId, alertType, { round });
        localStorage.removeItem(key);
      }
      // Also clear base key
      const baseKey = `${ALERT_STORAGE_KEY_PREFIX}${roomId}_${alertType}`;
      localStorage.removeItem(baseKey);
    });
  }
}

// Export singleton instance
export const alertManager = new AlertManager();
