/**
 * VX2 Draft Logic - Mock Adapter
 * 
 * Mock data adapter for demo and testing.
 * All new implementation - no code reuse.
 */

import { DRAFT_CONFIG, DEFAULT_POSITION_LIMITS } from '../constants';
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

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_PARTICIPANTS: Participant[] = [
  { id: 'p-0', name: 'NEWUSERNAME', draftPosition: 0, isCurrentUser: true },
  { id: 'p-1', name: 'DragonSlayer', draftPosition: 1, isCurrentUser: false },
  { id: 'p-2', name: 'FFChampion', draftPosition: 2, isCurrentUser: false },
  { id: 'p-3', name: 'GridironGuru', draftPosition: 3, isCurrentUser: false },
  { id: 'p-4', name: 'PickMaster', draftPosition: 4, isCurrentUser: false },
  { id: 'p-5', name: 'TouchdownKing', draftPosition: 5, isCurrentUser: false },
  { id: 'p-6', name: 'BestBaller', draftPosition: 6, isCurrentUser: false },
  { id: 'p-7', name: 'DynastyDan', draftPosition: 7, isCurrentUser: false },
  { id: 'p-8', name: 'WaiverWire', draftPosition: 8, isCurrentUser: false },
  { id: 'p-9', name: 'TradeGod', draftPosition: 9, isCurrentUser: false },
  { id: 'p-10', name: 'RookieHunter', draftPosition: 10, isCurrentUser: false },
  { id: 'p-11', name: 'SleepKing', draftPosition: 11, isCurrentUser: false },
];

const MOCK_PLAYERS: DraftPlayer[] = [
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
  
  // More WRs
  { id: 'addison', name: 'Jordan Addison', position: 'WR', team: 'MIN', adp: 11.1, projectedPoints: 245, byeWeek: 6 },
  { id: 'diggs', name: 'Stefon Diggs', position: 'WR', team: 'HOU', adp: 12.1, projectedPoints: 240, byeWeek: 14 },
  { id: 'flowers', name: 'Zay Flowers', position: 'WR', team: 'BAL', adp: 13.1, projectedPoints: 235, byeWeek: 14 },
  { id: 'collins', name: 'Nico Collins', position: 'WR', team: 'HOU', adp: 14.1, projectedPoints: 230, byeWeek: 14 },
  
  // More RBs
  { id: 'pollard', name: 'Tony Pollard', position: 'RB', team: 'TEN', adp: 11.5, projectedPoints: 235, byeWeek: 5 },
  { id: 'white', name: 'Rachaad White', position: 'RB', team: 'TB', adp: 12.5, projectedPoints: 230, byeWeek: 11 },
  { id: 'stevenson', name: 'Rhamondre Stevenson', position: 'RB', team: 'NE', adp: 13.5, projectedPoints: 225, byeWeek: 14 },
  { id: 'robinson', name: 'Bijan Robinson', position: 'RB', team: 'ATL', adp: 1.5, projectedPoints: 295, byeWeek: 12 },
];

// ============================================================================
// MOCK ADAPTER IMPLEMENTATION
// ============================================================================

export class MockAdapter implements DraftAdapter {
  private rooms: Map<string, DraftRoom> = new Map();
  private picks: Map<string, DraftPick[]> = new Map();
  private configs: Map<string, AutodraftConfig> = new Map();
  private roomSubscribers: Map<string, Set<(room: DraftRoom) => void>> = new Map();
  private picksSubscribers: Map<string, Set<(picks: DraftPick[]) => void>> = new Map();
  
  constructor() {
    // Initialize with default room
    this.initializeDefaultRoom('demo-room');
  }
  
  private initializeDefaultRoom(roomId: string): void {
    const room: DraftRoom = {
      id: roomId,
      name: 'Demo Draft Room',
      status: 'waiting',
      currentPickNumber: 1,
      settings: {
        teamCount: DRAFT_CONFIG.teamCount,
        rosterSize: DRAFT_CONFIG.rosterSize,
        pickTimeSeconds: DRAFT_CONFIG.pickTimeSeconds,
        gracePeriodSeconds: DRAFT_CONFIG.gracePeriodSeconds,
      },
      participants: [...MOCK_PARTICIPANTS],
    };
    
    this.rooms.set(roomId, room);
    this.picks.set(roomId, []);
  }
  
  // Room operations
  async getRoom(roomId: string): Promise<DraftRoom | null> {
    // Simulate network delay
    await this.delay(100);
    
    if (!this.rooms.has(roomId)) {
      this.initializeDefaultRoom(roomId);
    }
    
    return this.rooms.get(roomId) ?? null;
  }
  
  subscribeToRoom(
    roomId: string, 
    callback: (room: DraftRoom) => void
  ): Unsubscribe {
    if (!this.roomSubscribers.has(roomId)) {
      this.roomSubscribers.set(roomId, new Set());
    }

    const subscribers = this.roomSubscribers.get(roomId);
    if (subscribers) {
      subscribers.add(callback);
    }
    
    // Immediately call with current data
    const room = this.rooms.get(roomId);
    if (room) {
      callback(room);
    }
    
    return () => {
      this.roomSubscribers.get(roomId)?.delete(callback);
    };
  }
  
  async updateRoomStatus(roomId: string, status: DraftStatus): Promise<void> {
    await this.delay(50);
    
    const room = this.rooms.get(roomId);
    if (room) {
      room.status = status;
      if (status === 'active' && !room.startedAt) {
        room.startedAt = Date.now();
      }
      if (status === 'complete') {
        room.completedAt = Date.now();
      }
      
      this.notifyRoomSubscribers(roomId);
    }
  }
  
  // Pick operations
  async getPicks(roomId: string): Promise<DraftPick[]> {
    await this.delay(100);
    return this.picks.get(roomId) ?? [];
  }
  
  subscribeToPicks(
    roomId: string, 
    callback: (picks: DraftPick[]) => void
  ): Unsubscribe {
    if (!this.picksSubscribers.has(roomId)) {
      this.picksSubscribers.set(roomId, new Set());
    }

    const subscribers = this.picksSubscribers.get(roomId);
    if (subscribers) {
      subscribers.add(callback);
    }
    
    // Immediately call with current data
    const picks = this.picks.get(roomId) ?? [];
    callback(picks);
    
    return () => {
      this.picksSubscribers.get(roomId)?.delete(callback);
    };
  }
  
  async addPick(roomId: string, pick: Omit<DraftPick, 'id'>): Promise<DraftPick> {
    await this.delay(50);
    
    const fullPick: DraftPick = {
      ...pick,
      id: `pick-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    if (!this.picks.has(roomId)) {
      this.picks.set(roomId, []);
    }

    const picks = this.picks.get(roomId);
    if (picks) {
      picks.push(fullPick);
    }
    this.notifyPicksSubscribers(roomId);

    // Update room current pick
    const room = this.rooms.get(roomId);
    if (room) {
      const roomPicks = this.picks.get(roomId);
      if (roomPicks) {
        room.currentPickNumber = roomPicks.length + 1;
      }
      this.notifyRoomSubscribers(roomId);
    }
    
    return fullPick;
  }
  
  // Player operations
  async getAvailablePlayers(roomId: string): Promise<DraftPlayer[]> {
    await this.delay(100);
    return [...MOCK_PLAYERS];
  }
  
  // Autodraft config
  async getAutodraftConfig(userId: string): Promise<AutodraftConfig | null> {
    await this.delay(50);
    return this.configs.get(userId) ?? null;
  }
  
  async saveAutodraftConfig(
    userId: string, 
    config: Partial<AutodraftConfig>
  ): Promise<void> {
    await this.delay(50);
    
    const existing = this.configs.get(userId) ?? {
      isEnabled: true,
      positionLimits: { ...DEFAULT_POSITION_LIMITS },
      customRankings: [],
    };
    
    this.configs.set(userId, { ...existing, ...config });
  }
  
  // Helpers
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private notifyRoomSubscribers(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    this.roomSubscribers.get(roomId)?.forEach(callback => {
      callback(room);
    });
  }
  
  private notifyPicksSubscribers(roomId: string): void {
    const picks = this.picks.get(roomId) ?? [];
    
    this.picksSubscribers.get(roomId)?.forEach(callback => {
      callback([...picks]);
    });
  }
  
  // Test helpers
  reset(roomId: string): void {
    this.picks.set(roomId, []);
    this.initializeDefaultRoom(roomId);
    this.notifyRoomSubscribers(roomId);
    this.notifyPicksSubscribers(roomId);
  }
  
  setStatus(roomId: string, status: DraftStatus): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.status = status;
      this.notifyRoomSubscribers(roomId);
    }
  }
}

/**
 * Create a mock adapter instance
 */
export function createMockAdapter(): DraftAdapter {
  return new MockAdapter();
}

export default MockAdapter;



