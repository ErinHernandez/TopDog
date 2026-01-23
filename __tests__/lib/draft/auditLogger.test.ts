/**
 * Draft Audit Logger Tests
 *
 * Tests for comprehensive audit logging of draft actions.
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  DraftAuditLogger,
  createAuditLogger,
  type AuditEvent,
  type DraftActionType,
} from '../../../lib/draft/auditLogger';

// Mock structured logger
jest.mock('../../../lib/structuredLogger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('DraftAuditLogger', () => {
  let auditLogger: DraftAuditLogger;
  let mockPersistenceAdapter: {
    addDocument: jest.Mock<(collection: string, data: unknown) => Promise<string>>;
    queryDocuments: jest.Mock<(collection: string, constraints: unknown[], options?: unknown) => Promise<unknown[]>>;
  };

  beforeEach(() => {
    mockPersistenceAdapter = {
      addDocument: jest.fn<(collection: string, data: unknown) => Promise<string>>().mockResolvedValue('doc_123'),
      queryDocuments: jest.fn<(collection: string, constraints: unknown[], options?: unknown) => Promise<unknown[]>>().mockResolvedValue([]),
    };

    auditLogger = createAuditLogger({
      persistenceAdapter: mockPersistenceAdapter,
      batchSize: 10,
      flushIntervalMs: 60000, // Long interval to control flushing manually
      enableHashChain: true,
    });
  });

  afterEach(async () => {
    await auditLogger.shutdown();
  });

  // ===========================================================================
  // BASIC LOGGING
  // ===========================================================================

  describe('Basic Logging', () => {
    it('should log a basic action and return event ID', async () => {
      const eventId = await auditLogger.log(
        'pick_made',
        'room_123',
        'user_456',
        { pickNumber: 1, playerName: 'Patrick Mahomes' }
      );

      expect(eventId).toBeDefined();
      expect(eventId).toContain('audit_');
      expect(eventId).toContain('pick_made');
    });

    it('should include all required fields in logged event', async () => {
      await auditLogger.log(
        'room_created',
        'room_abc',
        'user_creator',
        { maxParticipants: 12 },
        {
          userName: 'John Doe',
          sessionId: 'session_123',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }
      );

      await auditLogger.flush();

      expect(mockPersistenceAdapter.addDocument).toHaveBeenCalled();
      const callArgs = mockPersistenceAdapter.addDocument.mock.calls[0];
      expect(callArgs).toBeDefined();
      expect(callArgs.length).toBeGreaterThan(1);
      const savedEvent = callArgs[1] as AuditEvent;

      expect(savedEvent.action).toBe('room_created');
      expect(savedEvent.roomId).toBe('room_abc');
      expect(savedEvent.userId).toBe('user_creator');
      expect(savedEvent.userName).toBe('John Doe');
      expect(savedEvent.sessionId).toBe('session_123');
      expect(savedEvent.ipAddress).toBe('192.168.1.1');
      expect(savedEvent.userAgent).toBe('Mozilla/5.0');
      expect(savedEvent.details).toEqual({ maxParticipants: 12 });
      expect(savedEvent.timestamp).toBeDefined();
      expect(savedEvent.timestampMs).toBeDefined();
    });

    it('should auto-assign severity based on action type', async () => {
      // Info action
      await auditLogger.log('pick_made', 'room_1', 'user_1', {});
      // Warning action
      await auditLogger.log('participant_kicked', 'room_1', 'user_1', {});
      // Critical action
      await auditLogger.log('admin_override', 'room_1', 'user_1', {});

      await auditLogger.flush();

      const calls = mockPersistenceAdapter.addDocument.mock.calls;
      expect((calls[0][1] as AuditEvent).severity).toBe('info');
      expect((calls[1][1] as AuditEvent).severity).toBe('warning');
      expect((calls[2][1] as AuditEvent).severity).toBe('critical');
    });
  });

  // ===========================================================================
  // SPECIALIZED LOGGING METHODS
  // ===========================================================================

  describe('Specialized Logging Methods', () => {
    it('should log room events correctly', async () => {
      await auditLogger.logRoomEvent('room_started', 'room_draft', 'user_host', {
        participantCount: 12,
        totalRounds: 18,
      });

      await auditLogger.flush();

      const savedEvent = mockPersistenceAdapter.addDocument.mock.calls[0][1] as AuditEvent;
      expect(savedEvent.action).toBe('room_started');
      expect(savedEvent.details.participantCount).toBe(12);
      expect(savedEvent.details.totalRounds).toBe(18);
    });

    it('should log participant events with target user', async () => {
      await auditLogger.logParticipantEvent(
        'participant_kicked',
        'room_strict',
        'admin_user',
        'kicked_user',
        { reason: 'AFK' }
      );

      await auditLogger.flush();

      const savedEvent = mockPersistenceAdapter.addDocument.mock.calls[0][1] as AuditEvent;
      expect(savedEvent.action).toBe('participant_kicked');
      expect(savedEvent.relatedIds?.targetUserId).toBe('kicked_user');
      expect(savedEvent.details.reason).toBe('AFK');
    });

    it('should log pick events with full details', async () => {
      await auditLogger.logPickEvent('pick_made', 'room_active', 'drafter_1', {
        pickNumber: 5,
        pickId: 'pick_xyz',
        playerId: 'player_mahomes',
        playerName: 'Patrick Mahomes',
        round: 1,
        position: 'QB',
      });

      await auditLogger.flush();

      const savedEvent = mockPersistenceAdapter.addDocument.mock.calls[0][1] as AuditEvent;
      expect(savedEvent.action).toBe('pick_made');
      expect(savedEvent.details.pickNumber).toBe(5);
      expect(savedEvent.details.playerName).toBe('Patrick Mahomes');
      expect(savedEvent.details.position).toBe('QB');
      expect(savedEvent.relatedIds?.pickId).toBe('pick_xyz');
      expect(savedEvent.relatedIds?.playerId).toBe('player_mahomes');
    });

    it('should log queue events', async () => {
      await auditLogger.logQueueEvent('queue_player_added', 'room_queue', 'user_123', {
        playerId: 'player_456',
        playerName: 'Josh Allen',
        position: 1,
        queueLength: 5,
      });

      await auditLogger.flush();

      const savedEvent = mockPersistenceAdapter.addDocument.mock.calls[0][1] as AuditEvent;
      expect(savedEvent.action).toBe('queue_player_added');
      expect(savedEvent.details.playerName).toBe('Josh Allen');
      expect(savedEvent.relatedIds?.playerId).toBe('player_456');
    });

    it('should log timer events', async () => {
      await auditLogger.logTimerEvent('timer_extended', 'room_slow', 'host_user', {
        previousDuration: 30,
        newDuration: 60,
        pickNumber: 15,
      });

      await auditLogger.flush();

      const savedEvent = mockPersistenceAdapter.addDocument.mock.calls[0][1] as AuditEvent;
      expect(savedEvent.action).toBe('timer_extended');
      expect(savedEvent.details.previousDuration).toBe(30);
      expect(savedEvent.details.newDuration).toBe(60);
    });

    it('should log settings changes with before/after state', async () => {
      await auditLogger.logSettingsChange(
        'room_settings',
        'host_123',
        { timerSeconds: 30, totalRounds: 18 },
        { timerSeconds: 45, totalRounds: 18 }
      );

      await auditLogger.flush();

      const savedEvent = mockPersistenceAdapter.addDocument.mock.calls[0][1] as AuditEvent;
      expect(savedEvent.action).toBe('settings_updated');
      expect(savedEvent.previousState).toEqual({ timerSeconds: 30, totalRounds: 18 });
      expect(savedEvent.newState).toEqual({ timerSeconds: 45, totalRounds: 18 });
      expect(savedEvent.details.changedFields).toContain('timerSeconds');
    });

    it('should log admin actions with elevated severity', async () => {
      await auditLogger.logAdminAction(
        'admin_force_pick',
        'room_admin',
        'admin_user',
        'afk_user',
        { pickNumber: 10, forcedPlayer: 'BPA' },
        'User was AFK for 5 minutes'
      );

      await auditLogger.flush();

      const savedEvent = mockPersistenceAdapter.addDocument.mock.calls[0][1] as AuditEvent;
      expect(savedEvent.action).toBe('admin_force_pick');
      expect(savedEvent.severity).toBe('warning');
      expect(savedEvent.relatedIds?.targetUserId).toBe('afk_user');
      expect(savedEvent.details.reason).toBe('User was AFK for 5 minutes');
    });
  });

  // ===========================================================================
  // BATCHING AND FLUSHING
  // ===========================================================================

  describe('Batching and Flushing', () => {
    it('should buffer events until batch size reached', async () => {
      // Log 5 events (less than batch size of 10)
      for (let i = 0; i < 5; i++) {
        await auditLogger.log('pick_made', 'room_1', 'user_1', { pick: i });
      }

      // Should not have flushed yet
      expect(mockPersistenceAdapter.addDocument).not.toHaveBeenCalled();

      // Manual flush
      await auditLogger.flush();

      // Now should have all 5
      expect(mockPersistenceAdapter.addDocument).toHaveBeenCalledTimes(5);
    });

    it('should auto-flush when batch size reached', async () => {
      // Log 10 events (equals batch size)
      for (let i = 0; i < 10; i++) {
        await auditLogger.log('pick_made', 'room_1', 'user_1', { pick: i });
      }

      // Should have auto-flushed
      expect(mockPersistenceAdapter.addDocument).toHaveBeenCalledTimes(10);
    });

    it('should handle flush errors gracefully', async () => {
      mockPersistenceAdapter.addDocument.mockRejectedValueOnce(new Error('DB error'));

      await auditLogger.log('pick_made', 'room_1', 'user_1', {});

      // Should throw but events should be re-buffered
      await expect(auditLogger.flush()).rejects.toThrow();

      // Reset mock to succeed
      mockPersistenceAdapter.addDocument.mockResolvedValue('doc_123');

      // Retry flush should work
      await auditLogger.flush();
      expect(mockPersistenceAdapter.addDocument).toHaveBeenCalledTimes(2);
    });
  });

  // ===========================================================================
  // HASH CHAIN (TAMPER EVIDENCE)
  // ===========================================================================

  describe('Hash Chain', () => {
    it('should generate hash for each event', async () => {
      await auditLogger.log('room_created', 'room_1', 'user_1', {});
      await auditLogger.flush();

      const savedEvent = mockPersistenceAdapter.addDocument.mock.calls[0][1] as AuditEvent;
      expect(savedEvent.hash).toBeDefined();
      expect(savedEvent.hash?.length).toBe(8);
    });

    it('should chain events with previousHash', async () => {
      await auditLogger.log('room_created', 'room_1', 'user_1', {});
      await auditLogger.log('room_started', 'room_1', 'user_1', {});
      await auditLogger.log('pick_made', 'room_1', 'user_1', {});
      await auditLogger.flush();

      const events = mockPersistenceAdapter.addDocument.mock.calls.map(
        (call: unknown[]) => call[1] as AuditEvent
      );

      // First event has no previous hash
      expect(events[0].previousHash).toBeUndefined();

      // Second event references first
      expect(events[1].previousHash).toBe(events[0].hash);

      // Third event references second
      expect(events[2].previousHash).toBe(events[1].hash);
    });

    it('should verify valid hash chain', async () => {
      // Create a sequence of events
      await auditLogger.log('room_created', 'room_verify', 'user_1', {});
      await auditLogger.log('room_started', 'room_verify', 'user_1', {});
      await auditLogger.log('pick_made', 'room_verify', 'user_1', {});
      await auditLogger.flush();

      // Get the saved events
      const savedEvents = mockPersistenceAdapter.addDocument.mock.calls.map(
        (call: unknown[]) => call[1] as AuditEvent
      );

      // Mock query to return these events
      mockPersistenceAdapter.queryDocuments.mockResolvedValue(savedEvents);

      const result = await auditLogger.verifyHashChain('room_verify');

      expect(result.valid).toBe(true);
      expect(result.totalEvents).toBe(3);
    });
  });

  // ===========================================================================
  // QUERYING
  // ===========================================================================

  describe('Querying', () => {
    beforeEach(async () => {
      // Pre-populate some events
      await auditLogger.log('room_created', 'room_1', 'user_1', {});
      await auditLogger.log('pick_made', 'room_1', 'user_2', {});
      await auditLogger.log('pick_made', 'room_2', 'user_1', {});
      await auditLogger.log('participant_kicked', 'room_1', 'user_1', {});
    });

    it('should query events by room ID', async () => {
      const events = await auditLogger.query({ roomId: 'room_1' });

      // Should match buffered events for room_1
      expect(events.length).toBe(3);
      expect(events.every((e) => e.roomId === 'room_1')).toBe(true);
    });

    it('should query events by user ID', async () => {
      const events = await auditLogger.query({ userId: 'user_1' });

      expect(events.length).toBe(3);
      expect(events.every((e) => e.userId === 'user_1')).toBe(true);
    });

    it('should query events by action types', async () => {
      const events = await auditLogger.query({ actions: ['pick_made'] });

      expect(events.length).toBe(2);
      expect(events.every((e) => e.action === 'pick_made')).toBe(true);
    });

    it('should query events by severity', async () => {
      const events = await auditLogger.query({ severities: ['warning'] });

      expect(events.length).toBe(1);
      expect(events[0].action).toBe('participant_kicked');
    });

    it('should get room audit trail in chronological order', async () => {
      const trail = await auditLogger.getRoomAuditTrail('room_1');

      expect(trail.length).toBe(3);
      // Should be sorted ascending by timestamp
      for (let i = 1; i < trail.length; i++) {
        expect(trail[i].timestampMs).toBeGreaterThanOrEqual(trail[i - 1].timestampMs);
      }
    });

    it('should get pick history for a room', async () => {
      const picks = await auditLogger.getPickHistory('room_1');

      expect(picks.length).toBe(1);
      expect(picks[0].action).toBe('pick_made');
    });
  });

  // ===========================================================================
  // EXPORT
  // ===========================================================================

  describe('Export', () => {
    beforeEach(async () => {
      await auditLogger.log('room_created', 'room_export', 'user_1', { test: true });
      await auditLogger.log('pick_made', 'room_export', 'user_2', { pickNumber: 1 });
    });

    it('should export to JSON', async () => {
      const json = await auditLogger.exportToJSON({ roomId: 'room_export' });
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
      expect(parsed[0].roomId).toBe('room_export');
    });

    it('should export to CSV', async () => {
      const csv = await auditLogger.exportToCSV({ roomId: 'room_export' });
      const lines = csv.split('\n');

      // Header + 2 data rows
      expect(lines.length).toBe(3);
      expect(lines[0]).toContain('id,timestamp,action');
    });

    it('should handle empty export', async () => {
      const csv = await auditLogger.exportToCSV({ roomId: 'nonexistent' });
      expect(csv).toBe('No events found');
    });
  });

  // ===========================================================================
  // CUSTOM ENRICHMENT
  // ===========================================================================

  describe('Custom Enrichment', () => {
    it('should apply custom event enricher', async () => {
      const enrichedLogger = createAuditLogger({
        enrichEvent: (event) => ({
          ...event,
          details: {
            ...event.details,
            enrichedField: 'custom_value',
            serverVersion: '1.2.3',
          },
        }),
      });

      await enrichedLogger.log('pick_made', 'room_1', 'user_1', { original: true });
      const events = await enrichedLogger.query({ roomId: 'room_1' });

      expect(events[0].details.enrichedField).toBe('custom_value');
      expect(events[0].details.serverVersion).toBe('1.2.3');
      expect(events[0].details.original).toBe(true);

      await enrichedLogger.shutdown();
    });
  });

  // ===========================================================================
  // ALL ACTION TYPES
  // ===========================================================================

  describe('All Action Types', () => {
    const actionTypes: DraftActionType[] = [
      'room_created',
      'room_opened',
      'room_started',
      'room_paused',
      'room_resumed',
      'room_completed',
      'room_cancelled',
      'room_reset',
      'participant_joined',
      'participant_left',
      'participant_kicked',
      'participant_ready',
      'participant_unready',
      'draft_order_set',
      'draft_order_randomized',
      'draft_order_manual',
      'pick_made',
      'pick_auto',
      'pick_skipped',
      'pick_traded',
      'pick_undone',
      'queue_updated',
      'queue_player_added',
      'queue_player_removed',
      'queue_reordered',
      'timer_started',
      'timer_paused',
      'timer_expired',
      'timer_extended',
      'settings_updated',
      'timer_duration_changed',
      'rounds_changed',
      'admin_override',
      'admin_force_pick',
      'admin_edit_pick',
    ];

    it.each(actionTypes)('should successfully log action type: %s', async (actionType: DraftActionType) => {
      const eventId = await auditLogger.log(actionType, 'room_test', 'user_test', {});

      expect(eventId).toBeDefined();
      expect(eventId).toContain(actionType);
    });
  });
});
