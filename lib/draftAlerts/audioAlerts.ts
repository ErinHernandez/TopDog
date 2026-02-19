/**
 * Draft Alert System - Audio and Haptic Feedback
 */

import { createScopedLogger } from '../clientLogger';

import { DraftAlertType } from './types';

const logger = createScopedLogger('[DraftAlerts]');

const ALERT_SOUNDS: Partial<Record<DraftAlertType, string>> = {
  [DraftAlertType.ON_THE_CLOCK]: '/sounds/your-turn.mp3',
  [DraftAlertType.TEN_SECONDS_REMAINING]: '/sounds/urgent-beep.mp3',
};

/**
 * Play alert sound
 */
export async function playAlertSound(alertType: DraftAlertType): Promise<void> {
  const soundUrl = ALERT_SOUNDS[alertType];
  if (!soundUrl) return;
  
  try {
    const audio = new Audio(soundUrl);
    audio.volume = 0.5;
    await audio.play();
  } catch (error) {
    // Audio playback failed (autoplay blocked, etc.)
    logger.warn('Audio playback failed');
  }
}

/**
 * Trigger haptic feedback for mobile devices
 */
export function triggerHaptic(alertType: DraftAlertType): void {
  if (!('vibrate' in navigator)) return;
  
  if (alertType === DraftAlertType.TEN_SECONDS_REMAINING) {
    navigator.vibrate([100, 50, 100]); // urgent pattern
  } else if (alertType === DraftAlertType.ON_THE_CLOCK) {
    navigator.vibrate(200); // single pulse
  }
}
