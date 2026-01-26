/**
 * VX2 Draft Logic - Local Storage Adapter
 *
 * LocalStorage adapter for offline support.
 * Persists draft state to browser localStorage for offline play and recovery.
 *
 * Features:
 * - Persists draft room state across browser sessions
 * - Offline-capable draft functionality
 * - Automatic state recovery on reconnection
 * - Sync status tracking for when connectivity returns
 */

import type {
  DraftAdapter,
  DraftRoom,
  DraftPick,
  DraftPlayer,
  DraftStatus,
  AutodraftConfig,
  Participant,
  Unsubscribe,
} from '../types';
import { DRAFT_CONFIG, DEFAULT_POSITION_LIMITS } from '../constants';
import { createScopedLogger } from '../../../../lib/clientLogger';

const logger = createScopedLogger('[LocalAdapter]');

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  ROOMS: 'vx2_draft_rooms',
  PICKS: 'vx2_draft_picks',
  CONFIGS: 'vx2_autodraft_configs',
  PLAYERS: 'vx2_draft_players',
  SYNC_QUEUE: 'vx2_sync_queue',
} as const;

// ============================================================================
// DEFAULT DATA
// ============================================================================

const DEFAULT_PARTICIPANTS: Participant[] = [
  { id: 'local-0', name: 'You', draftPosition: 0, isCurrentUser: true },
  { id: 'local-1', name: 'CPU Team 1', draftPosition: 1, isCurrentUser: false },
  { id: 'local-2', name: 'CPU Team 2', draftPosition: 2, isCurrentUser: false },
  { id: 'local-3', name: 'CPU Team 3', draftPosition: 3, isCurrentUser: false },
  { id: 'local-4', name: 'CPU Team 4', draftPosition: 4, isCurrentUser: false },
  { id: 'local-5', name: 'CPU Team 5', draftPosition: 5, isCurrentUser: false },
  { id: 'local-6', name: 'CPU Team 6', draftPosition: 6, isCurrentUser: false },
  { id: 'local-7', name: 'CPU Team 7', draftPosition: 7, isCurrentUser: false },
  { id: 'local-8', name: 'CPU Team 8', draftPosition: 8, isCurrentUser: false },
  { id: 'local-9', name: 'CPU Team 9', draftPosition: 9, isCurrentUser: false },
  { id: 'local-10', name: 'CPU Team 10', draftPosition: 10, isCurrentUser: false },
  { id: 'local-11', name: 'CPU Team 11', draftPosition: 11, isCurrentUser: false },
];

const DEFAULT_PLAYERS: DraftPlayer[] = [
  // Top WRs
  { id: 'chase', name: "Ja'Marr Chase", position: 'WR', team: 'CIN', adp: 1.1, projectedPoints: 310, byeWeek: 12 },
  { id: 'jefferson', name: 'Justin Jefferson', position: 'WR', team: 'MIN', adp: 3.1, projectedPoints: 295, byeWeek: 6 },
  { id: 'stbrown', name: 'Amon-Ra St. Brown', position: 'WR', team: 'DET', adp: 4.1, projectedPoints: 285, byeWeek: 5 },
  { id: 'nacua', name: 'Puka Nacua', position: 'WR', team: 'LAR', adp: 4.3, projectedPoints: 280, byeWeek: 6 },
  { id: 'lamb', name: 'CeeDee Lamb', position: 'WR', team: 'DAL', adp: 5.1, projectedPoints: 275, byeWeek: 7 },
  { id: 'hill', name: 'Tyreek Hill', position: 'WR', team: 'MIA', adp: 6.1, projectedPoints: 270, byeWeek: 6 },
  { id: 'brown', name: 'A.J. Brown', position: 'WR', team: 'PHI', adp: 7.1, projectedPoints: 265, byeWeek: 5 },
  { id: 'wilson', name: 'Garrett Wilson', position: 'WR', team: 'NYJ', adp: 8.1, projectedPoints: 260, byeWeek: 12 },
  { id: 'olave', name: 'Chris Olave', position: 'WR', team: 'NO', adp: 9.1, projectedPoints: 255, byeWeek: 12 },
  { id: 'waddle', name: 'Jaylen Waddle', position: 'WR', team: 'MIA', adp: 10.1, projectedPoints: 250, byeWeek: 6 },

  // Top RBs
  { id: 'henry', name: 'Derrick Henry', position: 'RB', team: 'BAL', adp: 2.1, projectedPoints: 290, byeWeek: 14 },
  { id: 'barkley', name: 'Saquon Barkley', position: 'RB', team: 'PHI', adp: 2.5, projectedPoints: 285, byeWeek: 5 },
  { id: 'hall', name: 'Breece Hall', position: 'RB', team: 'NYJ', adp: 3.5, projectedPoints: 275, byeWeek: 12 },
  { id: 'taylor', name: 'Jonathan Taylor', position: 'RB', team: 'IND', adp: 4.5, projectedPoints: 270, byeWeek: 14 },
  { id: 'chubb', name: 'Nick Chubb', position: 'RB', team: 'CLE', adp: 5.5, projectedPoints: 265, byeWeek: 10 },
  { id: 'gibbs', name: "Jahmyr Gibbs", position: 'RB', team: 'DET', adp: 6.5, projectedPoints: 260, byeWeek: 5 },
  { id: 'jacobs', name: 'Josh Jacobs', position: 'RB', team: 'GB', adp: 7.5, projectedPoints: 255, byeWeek: 10 },
  { id: 'achane', name: "De'Von Achane", position: 'RB', team: 'MIA', adp: 8.5, projectedPoints: 250, byeWeek: 6 },
  { id: 'cook', name: 'James Cook', position: 'RB', team: 'BUF', adp: 9.5, projectedPoints: 245, byeWeek: 12 },
  { id: 'williams', name: 'Kyren Williams', position: 'RB', team: 'LAR', adp: 10.5, projectedPoints: 240, byeWeek: 6 },
  { id: 'robinson', name: 'Bijan Robinson', position: 'RB', team: 'ATL', adp: 1.5, projectedPoints: 295, byeWeek: 12 },

  // Top QBs
  { id: 'mahomes', name: 'Patrick Mahomes', position: 'QB', team: 'KC', adp: 3.8, projectedPoints: 380, byeWeek: 6 },
  { id: 'allen', name: 'Josh Allen', position: 'QB', team: 'BUF', adp: 4.8, projectedPoints: 375, byeWeek: 12 },
  { id: 'hurts', name: 'Jalen Hurts', position: 'QB', team: 'PHI', adp: 5.8, projectedPoints: 370, byeWeek: 5 },
  { id: 'jackson', name: 'Lamar Jackson', position: 'QB', team: 'BAL', adp: 6.8, projectedPoints: 365, byeWeek: 14 },
  { id: 'stroud', name: 'C.J. Stroud', position: 'QB', team: 'HOU', adp: 7.8, projectedPoints: 360, byeWeek: 14 },
  { id: 'love', name: 'Jordan Love', position: 'QB', team: 'GB', adp: 8.8, projectedPoints: 350, byeWeek: 10 },

  // Top TEs
  { id: 'kelce', name: 'Travis Kelce', position: 'TE', team: 'KC', adp: 2.8, projectedPoints: 260, byeWeek: 6 },
  { id: 'laporta', name: 'Sam LaPorta', position: 'TE', team: 'DET', adp: 5.2, projectedPoints: 230, byeWeek: 5 },
  { id: 'andrews', name: 'Mark Andrews', position: 'TE', team: 'BAL', adp: 7.2, projectedPoints: 220, byeWeek: 14 },
  { id: 'kittle', name: 'George Kittle', position: 'TE', team: 'SF', adp: 8.2, projectedPoints: 210, byeWeek: 9 },
  { id: 'mcbride', name: 'Trey McBride', position: 'TE', team: 'ARI', adp: 9.2, projectedPoints: 200, byeWeek: 11 },
  { id: 'goedert', name: 'Dallas Goedert', position: 'TE', team: 'PHI', adp: 10.2, projectedPoints: 190, byeWeek: 5 },
];

// ============================================================================
// STORAGE HELPERS
// ============================================================================

function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    return JSON.parse(stored) as T;
  } catch (error) {
    logger.warn(`Failed to parse localStorage key ${key}, clearing corrupted data`);
    // Clear corrupted data from localStorage to prevent future errors
    try {
      localStorage.removeItem(key);
    } catch (clearError) {
      // Ignore errors when clearing (e.g., in private browsing mode)
      logger.warn(`Could not clear corrupted ${key} from localStorage`);
    }
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    logger.error('Failed to save to localStorage', error instanceof Error ? error : new Error(String(error)));
  }
}

// ============================================================================
// LOCAL ADAPTER IMPLEMENTATION
// ============================================================================

export class LocalAdapter implements DraftAdapter {
  private roomSubscribers: Map<string, Set<(room: DraftRoom) => void>> = new Map();
  private picksSubscribers: Map<string, Set<(picks: DraftPick[]) => void>> = new Map();

  constructor() {
    logger.info('LocalAdapter initialized - offline mode enabled');
  }

  // Storage getters with type safety
  private getRooms(): Map<string, DraftRoom> {
    const stored = getFromStorage<Record<string, DraftRoom>>(STORAGE_KEYS.ROOMS, {});
    return new Map(Object.entries(stored));
  }

  private saveRooms(rooms: Map<string, DraftRoom>): void {
    saveToStorage(STORAGE_KEYS.ROOMS, Object.fromEntries(rooms));
  }

  private getStoredPicks(): Map<string, DraftPick[]> {
    const stored = getFromStorage<Record<string, DraftPick[]>>(STORAGE_KEYS.PICKS, {});
    return new Map(Object.entries(stored));
  }

  private savePicks(picks: Map<string, DraftPick[]>): void {
    saveToStorage(STORAGE_KEYS.PICKS, Object.fromEntries(picks));
  }

  private getConfigs(): Map<string, AutodraftConfig> {
    const stored = getFromStorage<Record<string, AutodraftConfig>>(STORAGE_KEYS.CONFIGS, {});
    return new Map(Object.entries(stored));
  }

  private saveConfigs(configs: Map<string, AutodraftConfig>): void {
    saveToStorage(STORAGE_KEYS.CONFIGS, Object.fromEntries(configs));
  }

  // Initialize a room if it doesn't exist
  private initializeRoom(roomId: string): DraftRoom {
    const rooms = this.getRooms();

    if (rooms.has(roomId)) {
      return rooms.get(roomId)!;
    }

    const room: DraftRoom = {
      id: roomId,
      name: 'Offline Draft Room',
      status: 'waiting',
      currentPickNumber: 1,
      settings: {
        teamCount: DRAFT_CONFIG.teamCount,
        rosterSize: DRAFT_CONFIG.rosterSize,
        pickTimeSeconds: DRAFT_CONFIG.pickTimeSeconds,
        gracePeriodSeconds: DRAFT_CONFIG.gracePeriodSeconds,
      },
      participants: [...DEFAULT_PARTICIPANTS],
    };

    rooms.set(roomId, room);
    this.saveRooms(rooms);

    // Initialize empty picks for this room
    const picks = this.getStoredPicks();
    if (!picks.has(roomId)) {
      picks.set(roomId, []);
      this.savePicks(picks);
    }

    logger.info(`Initialized offline room: ${roomId}`);
    return room;
  }

  // Room operations
  async getRoom(roomId: string): Promise<DraftRoom | null> {
    const rooms = this.getRooms();

    if (!rooms.has(roomId)) {
      return this.initializeRoom(roomId);
    }

    return rooms.get(roomId) ?? null;
  }

  subscribeToRoom(
    roomId: string,
    callback: (room: DraftRoom) => void
  ): Unsubscribe {
    if (!this.roomSubscribers.has(roomId)) {
      this.roomSubscribers.set(roomId, new Set());
    }

    this.roomSubscribers.get(roomId)!.add(callback);

    // Immediately call with current data
    const rooms = this.getRooms();
    let room = rooms.get(roomId);

    if (!room) {
      room = this.initializeRoom(roomId);
    }

    callback(room);

    return () => {
      this.roomSubscribers.get(roomId)?.delete(callback);
    };
  }

  async updateRoomStatus(roomId: string, status: DraftStatus): Promise<void> {
    const rooms = this.getRooms();
    const room = rooms.get(roomId) ?? this.initializeRoom(roomId);

    room.status = status;
    if (status === 'active' && !room.startedAt) {
      room.startedAt = Date.now();
    }
    if (status === 'complete') {
      room.completedAt = Date.now();
    }

    rooms.set(roomId, room);
    this.saveRooms(rooms);
    this.notifyRoomSubscribers(roomId);

    logger.debug(`Room ${roomId} status updated to ${status}`);
  }

  // Pick operations
  async getPicks(roomId: string): Promise<DraftPick[]> {
    const picks = this.getStoredPicks();
    return picks.get(roomId) ?? [];
  }

  subscribeToPicks(
    roomId: string,
    callback: (picks: DraftPick[]) => void
  ): Unsubscribe {
    if (!this.picksSubscribers.has(roomId)) {
      this.picksSubscribers.set(roomId, new Set());
    }

    this.picksSubscribers.get(roomId)!.add(callback);

    // Immediately call with current data
    const picks = this.getStoredPicks();
    callback(picks.get(roomId) ?? []);

    return () => {
      this.picksSubscribers.get(roomId)?.delete(callback);
    };
  }

  async addPick(roomId: string, pick: Omit<DraftPick, 'id'>): Promise<DraftPick> {
    const fullPick: DraftPick = {
      ...pick,
      id: `local-pick-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const picks = this.getStoredPicks();
    if (!picks.has(roomId)) {
      picks.set(roomId, []);
    }

    picks.get(roomId)!.push(fullPick);
    this.savePicks(picks);
    this.notifyPicksSubscribers(roomId);

    // Update room current pick
    const rooms = this.getRooms();
    const room = rooms.get(roomId);
    if (room) {
      room.currentPickNumber = picks.get(roomId)!.length + 1;
      rooms.set(roomId, room);
      this.saveRooms(rooms);
      this.notifyRoomSubscribers(roomId);
    }

    logger.debug(`Pick added to room ${roomId}`, { playerId: pick.player.id });
    return fullPick;
  }

  // Player operations
  async getAvailablePlayers(roomId: string): Promise<DraftPlayer[]> {
    // Get drafted player IDs
    const picks = this.getStoredPicks();
    const roomPicks = picks.get(roomId) ?? [];
    const draftedIds = new Set(roomPicks.map(p => p.player.id));

    // Filter out drafted players
    return DEFAULT_PLAYERS.filter(p => !draftedIds.has(p.id));
  }

  // Autodraft config
  async getAutodraftConfig(userId: string): Promise<AutodraftConfig | null> {
    const configs = this.getConfigs();
    return configs.get(userId) ?? null;
  }

  async saveAutodraftConfig(
    userId: string,
    config: Partial<AutodraftConfig>
  ): Promise<void> {
    const configs = this.getConfigs();

    const existing = configs.get(userId) ?? {
      isEnabled: true,
      positionLimits: { ...DEFAULT_POSITION_LIMITS },
      customRankings: [],
    };

    configs.set(userId, { ...existing, ...config });
    this.saveConfigs(configs);

    logger.debug(`Autodraft config saved for user ${userId}`);
  }

  // Notification helpers
  private notifyRoomSubscribers(roomId: string): void {
    const rooms = this.getRooms();
    const room = rooms.get(roomId);
    if (!room) return;

    this.roomSubscribers.get(roomId)?.forEach(callback => {
      callback(room);
    });
  }

  private notifyPicksSubscribers(roomId: string): void {
    const picks = this.getStoredPicks();
    const roomPicks = picks.get(roomId) ?? [];

    this.picksSubscribers.get(roomId)?.forEach(callback => {
      callback([...roomPicks]);
    });
  }

  // Utility methods

  /**
   * Clear all local storage data for a room
   */
  clearRoom(roomId: string): void {
    const rooms = this.getRooms();
    const picks = this.getStoredPicks();

    rooms.delete(roomId);
    picks.delete(roomId);

    this.saveRooms(rooms);
    this.savePicks(picks);

    // Re-initialize the room
    this.initializeRoom(roomId);
    this.notifyRoomSubscribers(roomId);
    this.notifyPicksSubscribers(roomId);

    logger.info(`Room ${roomId} cleared and reset`);
  }

  /**
   * Check if there's stored data for a room
   */
  hasStoredData(roomId: string): boolean {
    const rooms = this.getRooms();
    const picks = this.getStoredPicks();

    return rooms.has(roomId) || (picks.get(roomId)?.length ?? 0) > 0;
  }

  /**
   * Export room data for sync when back online
   */
  exportForSync(roomId: string): { room: DraftRoom | null; picks: DraftPick[] } {
    const rooms = this.getRooms();
    const picks = this.getStoredPicks();

    return {
      room: rooms.get(roomId) ?? null,
      picks: picks.get(roomId) ?? [],
    };
  }
}

/**
 * Create a local storage adapter instance
 */
export function createLocalAdapter(): DraftAdapter {
  return new LocalAdapter();
}

export default LocalAdapter;
