/**
 * Slow Drafts Type Definitions
 *
 * Enhanced data models for the slow draft experience.
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type Position = 'QB' | 'RB' | 'WR' | 'TE';

export interface DraftPlayer {
  id: string;
  name: string;
  position: Position;
  team: string;
  adp: number;
  projectedPoints?: number;
  byeWeek?: number;
}

export interface MyPick {
  slotIndex: number;        // 0-17 (roster slot)
  player: DraftPlayer;
  pickNumber: number;       // Overall pick (1-216)
  round: number;
  pickInRound: number;
}

export interface RecentPick {
  pickNumber: number;
  round: number;
  pickInRound: number;
  player: DraftPlayer;
  drafter: {
    id: string;
    name: string;
    isCurrentUser: boolean;
  };
  timestamp: number;
  adpDelta?: number;        // Positive = reach
}

// ============================================================================
// NOTABLE EVENTS
// ============================================================================

export type NotableEventType =
  | 'reach'           // Player taken early
  | 'steal'           // Player fell late
  | 'position_run'    // 3+ same position in a row
  | 'queue_alert'     // Your queued player was taken
  | 'competitor_alert'; // Key pickup by leader

export type EventSeverity = 'info' | 'warning' | 'alert';

export interface NotableEvent {
  id: string;
  type: NotableEventType;
  pickNumber: number;
  round: number;
  description: string;
  severity: EventSeverity;
  player?: DraftPlayer;
  drafter?: {
    id: string;
    name: string;
  };
  adpDelta?: number;
  timestamp: number;
}

// ============================================================================
// POSITION TRACKING
// ============================================================================

export interface PositionCounts {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
}

export interface PositionNeed {
  position: Position;
  current: number;
  minimum: number;
  recommended: number;
  urgency: 'critical' | 'warning' | 'good' | 'neutral';
  needed: number;           // How many more needed to hit minimum
}

// ============================================================================
// DRAFT HEALTH
// ============================================================================

export interface DraftHealthFactors {
  rosterBalance: number;    // 0-25
  valueCapture: number;     // 0-25
  projectedPoints: number;  // 0-25
  positionNeeds: number;    // 0-25
}

export type HealthTrend = 'improving' | 'stable' | 'declining';

export interface DraftHealth {
  score: number;            // 0-100
  factors: DraftHealthFactors;
  trend: HealthTrend;
}

// ============================================================================
// TOP AVAILABLE
// ============================================================================

export interface TopAvailable {
  QB: DraftPlayer[];
  RB: DraftPlayer[];
  WR: DraftPlayer[];
  TE: DraftPlayer[];
}

// ============================================================================
// QUEUE ALERTS
// ============================================================================

export interface QueueAlert {
  player: DraftPlayer;
  takenBy: {
    id: string;
    name: string;
  };
  pickNumber: number;
  timestamp: number;
}

// ============================================================================
// ENHANCED SLOW DRAFT
// ============================================================================

export type SlowDraftStatus =
  | 'your-turn'
  | 'waiting'
  | 'paused'
  | 'complete';

export interface SlowDraft {
  // Core identifiers
  id: string;
  tournamentId: string;
  tournamentName: string;

  // User's team info
  teamId: string;
  teamName: string;

  // Draft progress
  status: SlowDraftStatus;
  pickNumber: number;         // Current overall pick (1-216)
  totalPicks: number;         // Usually 216
  currentRound: number;
  totalRounds: number;

  // User's position in draft
  draftPosition: number;      // 1-12 (snake draft position)
  teamCount: number;          // Usually 12

  // Timing
  timeLeftSeconds?: number;   // Time until auto-pick
  startedAt?: number;
  lastActivityAt?: number;
  estimatedCompletionAt?: number;

  // Picks away calculation
  picksAway: number;

  // Enhanced data for slow drafts
  myPicks: MyPick[];
  positionCounts: PositionCounts;
  positionNeeds: PositionNeed[];

  // Activity
  recentPicks: RecentPick[];
  notableEvents: NotableEvent[];

  // Optional enhanced features
  draftHealth?: DraftHealth;
  topAvailable?: TopAvailable;
  queueAlerts?: QueueAlert[];

  // User preferences
  muted?: boolean;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface SlowDraftsTabProps {
  onEnterDraft?: (draft: SlowDraft) => void;
  onJoinDraft?: () => void;
  onQuickPick?: (draftId: string, playerId: string) => Promise<void>;
}

export interface SlowDraftCardProps {
  draft: SlowDraft;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEnterDraft: () => void;
  onQuickPick?: (playerId: string) => void;
}

export interface MyRosterStripProps {
  picks: MyPick[];
  rosterSize: number;
  compact?: boolean;          // Collapsed vs expanded mode
  onSlotTap?: (slotIndex: number) => void;
}

export interface PositionNeedsIndicatorProps {
  needs: PositionNeed[];
  compact?: boolean;
}

export interface NotablePicksProps {
  events: NotableEvent[];
  maxVisible?: number;
  onEventTap?: (event: NotableEvent) => void;
}

export interface RecentActivityProps {
  picks: RecentPick[];
  maxVisible?: number;
}

export interface FilterSortBarProps {
  sortBy: import('./constants').SortOption;
  filterBy: import('./constants').FilterOption;
  onSortChange: (sort: import('./constants').SortOption) => void;
  onFilterChange: (filter: import('./constants').FilterOption) => void;
  counts: {
    total: number;
    myTurn: number;
    needsAttention: number;
  };
}
