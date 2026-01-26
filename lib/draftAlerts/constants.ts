/**
 * Draft Alert System - Constants
 */

import { DraftAlertPreferences, DraftAlertType } from './types';

/** Draft alerts default to OFF. Only prompt when user leaves their first draft room. */
export const DEFAULT_ALERT_PREFERENCES: DraftAlertPreferences = {
  roomFilled: false,
  draftStarting: false,
  twoPicksAway: false,
  onTheClock: false,
  tenSecondsRemaining: false,
};

export const ALERT_MESSAGES: Record<string, string> = {
  room_filled: 'Draft room is full! Draft will start soon.',
  draft_starting: 'Draft starting in {countdown} seconds!',
  two_picks_away: "You're 2 picks away! Get ready.",
  on_the_clock: "You're on the clock! Make your pick.",
  ten_seconds_remaining: '10 seconds remaining!',
};

export const ALERT_DURATION_MS = 5000; // 5 seconds for Dynamic Island alerts
export const ALERT_STORAGE_KEY_PREFIX = 'topdog_alert_fired_';
export const ALERT_STORAGE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Re-export ALERT_TO_PREFERENCE from types
export { ALERT_TO_PREFERENCE } from './types';
