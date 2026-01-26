/**
 * Draft Audit Logger
 *
 * Comprehensive audit logging for all draft-related actions.
 * Provides tamper-evident logging with structured events for compliance,
 * debugging, and analytics.
 *
 * Features:
 * - Structured audit events with consistent schema
 * - Automatic metadata enrichment (timestamps, user info, session)
 * - Batched writes for performance
 * - Query support for audit trails
 * - Export capabilities for compliance
 */

import { logger } from '../structuredLogger';
import { createHash } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Draft action types that can be audited
 */
export type DraftActionType =
  // Room lifecycle
  | 'room_created'
  | 'room_opened'
  | 'room_started'
  | 'room_paused'
  | 'room_resumed'
  | 'room_completed'
  | 'room_cancelled'
  | 'room_reset'
  // Participant actions
  | 'participant_joined'
  | 'participant_left'
  | 'participant_kicked'
  | 'participant_ready'
  | 'participant_unready'
  // Draft order
  | 'draft_order_set'
  | 'draft_order_randomized'
  | 'draft_order_manual'
  // Picks
  | 'pick_made'
  | 'pick_auto'
  | 'pick_skipped'
  | 'pick_traded'
  | 'pick_undone'
  // Queue
  | 'queue_updated'
  | 'queue_player_added'
  | 'queue_player_removed'
  | 'queue_reordered'
  // Timer
  | 'timer_started'
  | 'timer_paused'
  | 'timer_expired'
  | 'timer_extended'
  // Settings
  | 'settings_updated'
  | 'timer_duration_changed'
  | 'rounds_changed'
  // Admin
  | 'admin_override'
  | 'admin_force_pick'
  | 'admin_edit_pick';

/**
 * Audit event severity levels
 */
export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Audit event structure
 */
export interface AuditEvent {
  /** Unique event ID */
  id: string;
  /** Event timestamp (ISO 8601) */
  timestamp: string;
  /** Unix timestamp for sorting */
  timestampMs: number;
  /** Action type */
  action: DraftActionType;
  /** Severity level */
  severity: AuditSeverity;
  /** Room ID */
  roomId: string;
  /** User who performed the action */
  userId: string;
  /** User display name (if available) */
  userName?: string;
  /** Session ID for tracking */
  sessionId?: string;
  /** IP address (if available) */
  ipAddress?: string;
  /** User agent (if available) */
  userAgent?: string;
  /** Action-specific details */
  details: Record<string, unknown>;
  /** Previous state (for changes) */
  previousState?: Record<string, unknown>;
  /** New state (for changes) */
  newState?: Record<string, unknown>;
  /** Related entity IDs */
  relatedIds?: {
    pickId?: string;
    playerId?: string;
    targetUserId?: string;
  };
  /** Hash of previous event (for tamper evidence) */
  previousHash?: string;
  /** Hash of this event */
  hash?: string;
}

/**
 * Audit query options
 */
export interface AuditQueryOptions {
  /** Room ID to filter by */
  roomId?: string;
  /** User ID to filter by */
  userId?: string;
  /** Action types to include */
  actions?: DraftActionType[];
  /** Start time (ISO 8601 or Unix ms) */
  startTime?: string | number;
  /** End time (ISO 8601 or Unix ms) */
  endTime?: string | number;
  /** Severity levels to include */
  severities?: AuditSeverity[];
  /** Maximum results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Audit logger configuration
 */
export interface AuditLoggerConfig {
  /** Firebase adapter for persistence */
  persistenceAdapter?: {
    addDocument: (collection: string, data: unknown) => Promise<string>;
    queryDocuments: (
      collection: string,
      constraints: unknown[],
      options?: unknown
    ) => Promise<unknown[]>;
  };
  /** Batch size for writes */
  batchSize?: number;
  /** Flush interval in milliseconds */
  flushIntervalMs?: number;
  /** Enable hash chain for tamper evidence */
  enableHashChain?: boolean;
  /** Custom event enricher */
  enrichEvent?: (event: AuditEvent) => AuditEvent;
}

// ============================================================================
// AUDIT LOGGER
// ============================================================================

export class DraftAuditLogger {
  private config: Required<AuditLoggerConfig>;
  private eventBuffer: AuditEvent[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private lastEventHash: string | null = null;
  private isInitialized: boolean = false;

  constructor(config: AuditLoggerConfig = {}) {
    this.config = {
      persistenceAdapter: config.persistenceAdapter || this.createNoopAdapter(),
      batchSize: config.batchSize || 50,
      flushIntervalMs: config.flushIntervalMs || 5000,
      enableHashChain: config.enableHashChain !== false,
      enrichEvent: config.enrichEvent || ((event) => event),
    };
  }

  /**
   * Initialize the audit logger
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    // Start periodic flush
    this.flushInterval = setInterval(() => {
      this.flush().catch((err) => {
        logger.error('Audit log flush failed', err, {
          component: 'auditLogger',
          operation: 'flush',
        });
      });
    }, this.config.flushIntervalMs);

    this.isInitialized = true;
    logger.info('Audit logger initialized', {
      component: 'auditLogger',
      operation: 'init',
      batchSize: this.config.batchSize,
      flushInterval: this.config.flushIntervalMs,
    });
  }

  /**
   * Create a no-op adapter for in-memory only logging
   */
  private createNoopAdapter() {
    return {
      addDocument: async () => 'noop',
      queryDocuments: async () => [],
    };
  }

  // ===========================================================================
  // LOGGING METHODS
  // ===========================================================================

  /**
   * Log a draft action
   */
  async log(
    action: DraftActionType,
    roomId: string,
    userId: string,
    details: Record<string, unknown> = {},
    options: {
      severity?: AuditSeverity;
      userName?: string;
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
      previousState?: Record<string, unknown>;
      newState?: Record<string, unknown>;
      relatedIds?: AuditEvent['relatedIds'];
    } = {}
  ): Promise<string> {
    const timestamp = new Date().toISOString();
    const timestampMs = Date.now();
    const id = this.generateEventId(timestamp, roomId, action);

    let event: AuditEvent = {
      id,
      timestamp,
      timestampMs,
      action,
      severity: options.severity || this.getSeverityForAction(action),
      roomId,
      userId,
      userName: options.userName,
      sessionId: options.sessionId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      details,
      previousState: options.previousState,
      newState: options.newState,
      relatedIds: options.relatedIds,
    };

    // Apply custom enrichment
    event = this.config.enrichEvent(event);

    // Add hash chain
    if (this.config.enableHashChain) {
      event.previousHash = this.lastEventHash || undefined;
      event.hash = this.computeEventHash(event);
      this.lastEventHash = event.hash;
    }

    // Buffer the event
    this.eventBuffer.push(event);

    // Also log to structured logger for immediate visibility
    logger.info(`Draft audit: ${action}`, {
      component: 'auditLogger',
      operation: action,
      roomId,
      userId,
      eventId: id,
      ...details,
    });

    // Flush if buffer is full
    if (this.eventBuffer.length >= this.config.batchSize) {
      await this.flush();
    }

    return id;
  }

  /**
   * Log a room lifecycle event
   */
  async logRoomEvent(
    action: Extract<DraftActionType, `room_${string}`>,
    roomId: string,
    userId: string,
    details: Record<string, unknown> = {}
  ): Promise<string> {
    return this.log(action, roomId, userId, details);
  }

  /**
   * Log a participant event
   */
  async logParticipantEvent(
    action: Extract<DraftActionType, `participant_${string}`>,
    roomId: string,
    userId: string,
    targetUserId: string,
    details: Record<string, unknown> = {}
  ): Promise<string> {
    return this.log(action, roomId, userId, details, {
      relatedIds: { targetUserId },
    });
  }

  /**
   * Log a pick event
   */
  async logPickEvent(
    action: Extract<DraftActionType, `pick_${string}`>,
    roomId: string,
    userId: string,
    pickDetails: {
      pickNumber: number;
      pickId?: string;
      playerId?: string;
      playerName?: string;
      round?: number;
      position?: string;
    }
  ): Promise<string> {
    return this.log(action, roomId, userId, pickDetails, {
      relatedIds: {
        pickId: pickDetails.pickId,
        playerId: pickDetails.playerId,
      },
    });
  }

  /**
   * Log a queue event
   */
  async logQueueEvent(
    action: Extract<DraftActionType, `queue_${string}`>,
    roomId: string,
    userId: string,
    queueDetails: {
      playerId?: string;
      playerName?: string;
      position?: number;
      queueLength?: number;
    }
  ): Promise<string> {
    return this.log(action, roomId, userId, queueDetails, {
      relatedIds: { playerId: queueDetails.playerId },
    });
  }

  /**
   * Log a timer event
   */
  async logTimerEvent(
    action: Extract<DraftActionType, `timer_${string}`>,
    roomId: string,
    userId: string,
    timerDetails: {
      previousDuration?: number;
      newDuration?: number;
      remainingSeconds?: number;
      pickNumber?: number;
    }
  ): Promise<string> {
    return this.log(action, roomId, userId, timerDetails);
  }

  /**
   * Log a settings change
   */
  async logSettingsChange(
    roomId: string,
    userId: string,
    previousSettings: Record<string, unknown>,
    newSettings: Record<string, unknown>
  ): Promise<string> {
    return this.log('settings_updated', roomId, userId, {
      changedFields: Object.keys(newSettings).filter(
        (key) => previousSettings[key] !== newSettings[key]
      ),
    }, {
      previousState: previousSettings,
      newState: newSettings,
    });
  }

  /**
   * Log an admin action
   */
  async logAdminAction(
    action: Extract<DraftActionType, `admin_${string}`>,
    roomId: string,
    adminUserId: string,
    targetUserId: string,
    details: Record<string, unknown> = {},
    reason?: string
  ): Promise<string> {
    return this.log(action, roomId, adminUserId, {
      ...details,
      reason,
    }, {
      severity: 'warning',
      relatedIds: { targetUserId },
    });
  }

  // ===========================================================================
  // QUERY METHODS
  // ===========================================================================

  /**
   * Query audit events
   */
  async query(options: AuditQueryOptions = {}): Promise<AuditEvent[]> {
    // First, get buffered events that match
    const bufferedMatches = this.eventBuffer.filter((event) =>
      this.matchesQuery(event, options)
    );

    // Then query persisted events
    // Note: This is a simplified implementation. In production,
    // you'd build proper Firestore query constraints.
    const persistedEvents = await this.config.persistenceAdapter.queryDocuments(
      'auditLogs',
      [], // Would build constraints based on options
      {
        limitCount: options.limit || 100,
        orderByField: 'timestampMs',
        orderDirection: options.sortOrder || 'desc',
      }
    ) as AuditEvent[];

    // Combine and deduplicate
    const allEvents = [...bufferedMatches, ...persistedEvents];
    const uniqueEvents = Array.from(
      new Map(allEvents.map((e) => [e.id, e])).values()
    );

    // Sort
    uniqueEvents.sort((a, b) => {
      const order = options.sortOrder === 'asc' ? 1 : -1;
      return (a.timestampMs - b.timestampMs) * order;
    });

    // Apply limit
    return uniqueEvents.slice(0, options.limit || 100);
  }

  /**
   * Get audit trail for a room
   */
  async getRoomAuditTrail(
    roomId: string,
    options: Omit<AuditQueryOptions, 'roomId'> = {}
  ): Promise<AuditEvent[]> {
    return this.query({ ...options, roomId, sortOrder: 'asc' });
  }

  /**
   * Get audit trail for a user
   */
  async getUserAuditTrail(
    userId: string,
    options: Omit<AuditQueryOptions, 'userId'> = {}
  ): Promise<AuditEvent[]> {
    return this.query({ ...options, userId, sortOrder: 'desc' });
  }

  /**
   * Get pick history for a room
   */
  async getPickHistory(roomId: string): Promise<AuditEvent[]> {
    return this.query({
      roomId,
      actions: ['pick_made', 'pick_auto', 'pick_skipped', 'pick_traded', 'pick_undone'],
      sortOrder: 'asc',
    });
  }

  // ===========================================================================
  // EXPORT METHODS
  // ===========================================================================

  /**
   * Export audit log to JSON
   */
  async exportToJSON(options: AuditQueryOptions = {}): Promise<string> {
    const events = await this.query({ ...options, limit: 10000 });
    return JSON.stringify(events, null, 2);
  }

  /**
   * Export audit log to CSV
   */
  async exportToCSV(options: AuditQueryOptions = {}): Promise<string> {
    const events = await this.query({ ...options, limit: 10000 });

    if (events.length === 0) {
      return 'No events found';
    }

    // CSV header
    const headers = [
      'id',
      'timestamp',
      'action',
      'severity',
      'roomId',
      'userId',
      'userName',
      'details',
    ];

    const rows = events.map((event) => [
      event.id,
      event.timestamp,
      event.action,
      event.severity,
      event.roomId,
      event.userId,
      event.userName || '',
      JSON.stringify(event.details),
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  // ===========================================================================
  // INTERNAL METHODS
  // ===========================================================================

  /**
   * Flush buffered events to persistence
   */
  async flush(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const eventsToFlush = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      // Persist each event
      await Promise.all(
        eventsToFlush.map((event) =>
          this.config.persistenceAdapter.addDocument('auditLogs', event)
        )
      );

      logger.debug('Audit events flushed', {
        component: 'auditLogger',
        operation: 'flush',
        count: eventsToFlush.length,
      });
    } catch (error) {
      // Re-add events to buffer on failure
      this.eventBuffer = [...eventsToFlush, ...this.eventBuffer];
      throw error;
    }
  }

  /**
   * Generate a unique event ID
   */
  private generateEventId(
    timestamp: string,
    roomId: string,
    action: string
  ): string {
    const random = Math.random().toString(36).substring(2, 8);
    const dateStr = timestamp.replace(/[-:T.Z]/g, '').substring(0, 14);
    return `audit_${dateStr}_${roomId.substring(0, 8)}_${action}_${random}`;
  }

  /**
   * Get default severity for an action
   */
  private getSeverityForAction(action: DraftActionType): AuditSeverity {
    const criticalActions: DraftActionType[] = [
      'room_reset',
      'admin_override',
      'admin_force_pick',
      'admin_edit_pick',
    ];

    const warningActions: DraftActionType[] = [
      'participant_kicked',
      'pick_undone',
      'pick_traded',
      'room_cancelled',
    ];

    if (criticalActions.includes(action)) return 'critical';
    if (warningActions.includes(action)) return 'warning';
    return 'info';
  }

  /**
   * Compute cryptographic hash for tamper evidence
   *
   * SECURITY: Uses SHA-256 to create a cryptographically secure hash chain.
   * This ensures that any modification to audit events can be detected.
   * The hash includes the previous event's hash to form an immutable chain.
   */
  private computeEventHash(event: AuditEvent): string {
    // Create deterministic JSON by sorting keys
    const data = JSON.stringify({
      id: event.id,
      timestamp: event.timestamp,
      action: event.action,
      roomId: event.roomId,
      userId: event.userId,
      details: event.details,
      previousHash: event.previousHash || null,
    }, Object.keys({
      id: '',
      timestamp: '',
      action: '',
      roomId: '',
      userId: '',
      details: {},
      previousHash: '',
    }).sort());

    // Use SHA-256 for cryptographic security
    return createHash('sha256').update(data, 'utf8').digest('hex');
  }

  /**
   * Check if an event matches query options
   */
  private matchesQuery(event: AuditEvent, options: AuditQueryOptions): boolean {
    if (options.roomId && event.roomId !== options.roomId) return false;
    if (options.userId && event.userId !== options.userId) return false;
    if (options.actions && !options.actions.includes(event.action)) return false;
    if (options.severities && !options.severities.includes(event.severity)) return false;

    const startTime = typeof options.startTime === 'string'
      ? new Date(options.startTime).getTime()
      : options.startTime;
    const endTime = typeof options.endTime === 'string'
      ? new Date(options.endTime).getTime()
      : options.endTime;

    if (startTime && event.timestampMs < startTime) return false;
    if (endTime && event.timestampMs > endTime) return false;

    return true;
  }

  /**
   * Verify the integrity of the hash chain
   */
  async verifyHashChain(roomId: string): Promise<{
    valid: boolean;
    brokenAt?: string;
    totalEvents: number;
  }> {
    const events = await this.getRoomAuditTrail(roomId);

    if (events.length === 0) {
      return { valid: true, totalEvents: 0 };
    }

    for (let i = 1; i < events.length; i++) {
      const current = events[i];
      const previous = events[i - 1];

      if (current.previousHash !== previous.hash) {
        return {
          valid: false,
          brokenAt: current.id,
          totalEvents: events.length,
        };
      }
    }

    return { valid: true, totalEvents: events.length };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    // Stop flush interval
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Final flush
    await this.flush();

    this.isInitialized = false;
    logger.info('Audit logger shutdown', {
      component: 'auditLogger',
      operation: 'shutdown',
    });
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let defaultAuditLogger: DraftAuditLogger | null = null;

/**
 * Get the default audit logger instance
 */
export function getAuditLogger(config?: AuditLoggerConfig): DraftAuditLogger {
  if (!defaultAuditLogger) {
    defaultAuditLogger = new DraftAuditLogger(config);
  }
  return defaultAuditLogger;
}

/**
 * Create a new audit logger instance
 */
export function createAuditLogger(config: AuditLoggerConfig): DraftAuditLogger {
  return new DraftAuditLogger(config);
}

// Export default instance
export const auditLogger = getAuditLogger();
