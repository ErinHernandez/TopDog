/**
 * Draft Alert System - Type Definitions
 */

export enum DraftAlertType {
  ROOM_FILLED = 'room_filled',
  DRAFT_STARTING = 'draft_starting',
  TWO_PICKS_AWAY = 'two_picks_away',
  ON_THE_CLOCK = 'on_the_clock',
  TEN_SECONDS_REMAINING = 'ten_seconds_remaining',
}

export interface DraftAlertPreferences {
  roomFilled: boolean;
  draftStarting: boolean;
  twoPicksAway: boolean;
  onTheClock: boolean;
  tenSecondsRemaining: boolean;
}

export interface DraftAlertState {
  type: DraftAlertType;
  roomId: string;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

// CORRECTED: Added currentRound and currentPick for turn-based deduplication
export interface AlertTriggerContext {
  roomId: string;
  participants: Array<{ id: string; name: string }>;
  maxParticipants: number;
  roomStatus: 'waiting' | 'active' | 'paused' | 'completed';
  preDraftCountdown: number;
  picksUntilMyTurn: number;
  isMyTurn: boolean;
  timer: number;
  currentRound: number;  // ADDED for turn-based deduplication
  currentPick: number;   // ADDED for turn-based deduplication
}

export interface AlertManagerConfig {
  enabled: boolean;
  preferences: DraftAlertPreferences;
  isDynamicIslandSupported: boolean;
  isWebNotificationSupported: boolean;
}

// IMPROVEMENT: Better TypeScript for Alert Type → Preference Mapping
type AlertPreferenceKey = {
  [K in DraftAlertType]: keyof DraftAlertPreferences;
};

export const ALERT_TO_PREFERENCE: AlertPreferenceKey = {
  [DraftAlertType.ROOM_FILLED]: 'roomFilled',
  [DraftAlertType.DRAFT_STARTING]: 'draftStarting',
  [DraftAlertType.TWO_PICKS_AWAY]: 'twoPicksAway',
  [DraftAlertType.ON_THE_CLOCK]: 'onTheClock',
  [DraftAlertType.TEN_SECONDS_REMAINING]: 'tenSecondsRemaining',
} as const;
