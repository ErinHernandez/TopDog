/**
 * Alert Manager Unit Tests
 */

import { alertManager } from '@/lib/draftAlerts/alertManager';
import { DraftAlertType } from '@/lib/draftAlerts/types';
import { DEFAULT_ALERT_PREFERENCES } from '@/lib/draftAlerts/constants';

// Mock dependencies
jest.mock('@/lib/draftAlerts/dynamicIslandAlerts', () => ({
  showDynamicIslandAlert: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/draftAlerts/webNotifications', () => ({
  showWebNotification: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/draftAlerts/audioAlerts', () => ({
  playAlertSound: jest.fn().mockResolvedValue(undefined),
  triggerHaptic: jest.fn(),
}));

describe('AlertManager', () => {
  beforeEach(() => {
    localStorage.clear();
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/draft/topdog/test-room',
      },
      writable: true,
    });
    
    // Mock document.visibilityState
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
    });
    
    alertManager.initialize({
      enabled: true,
      preferences: DEFAULT_ALERT_PREFERENCES,
      isDynamicIslandSupported: false,
      isWebNotificationSupported: true,
    });
  });

  describe('Room Filled Alert', () => {
    it('should trigger alert when conditions are met', async () => {
      const context = {
        roomId: 'test-room',
        participants: Array(12).fill({ id: '1', name: 'User' }),
        maxParticipants: 12,
        roomStatus: 'waiting' as const,
        preDraftCountdown: 0,
        picksUntilMyTurn: 0,
        isMyTurn: false,
        timer: 0,
        currentRound: 1,
        currentPick: 1,
      };

      // Mock notification permission
      Object.defineProperty(window, 'Notification', {
        value: {
          permission: 'granted',
          requestPermission: jest.fn().mockResolvedValue('granted'),
        },
        writable: true,
      });

      const result = await alertManager.triggerAlert(
        DraftAlertType.ROOM_FILLED,
        context
      );

      expect(result).toBe(true);
    });

    it('should not trigger duplicate alerts', async () => {
      const context = {
        roomId: 'test-room',
        participants: Array(12).fill({ id: '1', name: 'User' }),
        maxParticipants: 12,
        roomStatus: 'waiting' as const,
        preDraftCountdown: 0,
        picksUntilMyTurn: 0,
        isMyTurn: false,
        timer: 0,
        currentRound: 1,
        currentPick: 1,
      };
      
      // First trigger
      await alertManager.triggerAlert(DraftAlertType.ROOM_FILLED, context);
      
      // Second trigger should be blocked
      const result = await alertManager.triggerAlert(DraftAlertType.ROOM_FILLED, context);
      
      expect(result).toBe(false);
    });

    it('should respect disabled preferences', async () => {
      alertManager.initialize({
        enabled: true,
        preferences: {
          ...DEFAULT_ALERT_PREFERENCES,
          roomFilled: false,
        },
        isDynamicIslandSupported: false,
        isWebNotificationSupported: true,
      });

      const context = {
        roomId: 'test-room',
        participants: Array(12).fill({ id: '1', name: 'User' }),
        maxParticipants: 12,
        roomStatus: 'waiting' as const,
        preDraftCountdown: 0,
        picksUntilMyTurn: 0,
        isMyTurn: false,
        timer: 0,
        currentRound: 1,
        currentPick: 1,
      };

      const result = await alertManager.triggerAlert(
        DraftAlertType.ROOM_FILLED,
        context
      );

      expect(result).toBe(false);
    });
  });

  describe('Turn-Based Deduplication', () => {
    it('should allow alerts to fire multiple times in different rounds', async () => {
      const baseContext = {
        roomId: 'test-room',
        participants: [],
        maxParticipants: 12,
        roomStatus: 'active' as const,
        preDraftCountdown: 0,
        picksUntilMyTurn: 2,
        isMyTurn: false,
        timer: 0,
        currentRound: 1,
        currentPick: 1,
      };

      // First round
      await alertManager.triggerAlert(
        DraftAlertType.TWO_PICKS_AWAY,
        baseContext
      );

      // Second round (different round number)
      const result = await alertManager.triggerAlert(
        DraftAlertType.TWO_PICKS_AWAY,
        { ...baseContext, currentRound: 2, currentPick: 13 }
      );

      // Should fire again in different round
      expect(result).toBe(true);
    });
  });

  describe('Tab Visibility Check', () => {
    it('should skip notification but play sound when user is viewing draft', async () => {
      // Set visibility to visible and pathname to include roomId
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      });
      
      const context = {
        roomId: 'test-room',
        participants: [],
        maxParticipants: 12,
        roomStatus: 'active' as const,
        preDraftCountdown: 0,
        picksUntilMyTurn: 0,
        isMyTurn: true,
        timer: 5,
        currentRound: 1,
        currentPick: 1,
      };

      const { playAlertSound, triggerHaptic } = require('@/lib/draftAlerts/audioAlerts');

      const result = await alertManager.triggerAlert(
        DraftAlertType.ON_THE_CLOCK,
        context
      );

      // Should return false (no notification)
      expect(result).toBe(false);
      // But should play sound
      expect(playAlertSound).toHaveBeenCalledWith(DraftAlertType.ON_THE_CLOCK);
      expect(triggerHaptic).toHaveBeenCalledWith(DraftAlertType.ON_THE_CLOCK);
    });
  });
});
