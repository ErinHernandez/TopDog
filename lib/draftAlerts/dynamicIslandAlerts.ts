/**
 * Draft Alert System - Dynamic Island Implementation
 * 
 * Shows alerts in Dynamic Island for iOS 16.1+ devices
 */

import { DraftAlertState } from './types';
import { isNativeBridgeAvailable } from '../dynamicIsland';

/**
 * Show alert in Dynamic Island
 */
export async function showDynamicIslandAlert(
  alertState: DraftAlertState
): Promise<boolean> {
  if (!isNativeBridgeAvailable()) {
    return false;
  }

  try {
    // Send to native app via bridge
    // @ts-ignore - webkit is injected by native app
    window.webkit.messageHandlers.draftAlert?.postMessage({
      action: 'showAlert',
      alert: {
        type: alertState.type,
        message: alertState.message,
        roomId: alertState.roomId,
        data: alertState.data,
        timestamp: alertState.timestamp,
      },
    });

    return true;
  } catch (error) {
    console.warn('[DraftAlerts] Failed to show Dynamic Island alert:', error);
    return false;
  }
}
