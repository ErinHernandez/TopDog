/**
 * VX2 Draft Room
 * 
 * Enterprise-grade mobile draft room for the TopDog platform.
 * 100% fresh implementation using VX2 architecture patterns.
 * 
 * @example
 * ```tsx
 * import { DraftRoomVX2 } from '@/components/vx2/draft-room';
 * 
 * <DraftRoomVX2 roomId="abc123" />
 * ```
 */

// Types
export type {
  // Player types
  Position,
  RosterPosition,
  DraftPlayer,
  QueuedPlayer,
  
  // Participant types
  Participant,
  
  // Pick types
  DraftPick,
  
  // Room types
  DraftStatus,
  DraftSettings,
  DraftRoom,
  
  // UI types
  DraftTab,
  PlayerSortOption,
  PositionCounts,
  TimerState,
  TimerUrgency,
  AsyncDataResult,
} from './types';

// Constants
export {
  DRAFT_DEFAULTS,
  TOTAL_PICKS,
  DRAFT_LAYOUT,
  TIMER_CONFIG,
  POSITION_LIMITS,
  POSITION_COLORS,
  DRAFT_TABS,
  SORT_OPTIONS,
  DRAFT_ANIMATIONS,
  DEV_FLAGS,
} from './constants';

// Utils
export {
  // Snake draft
  getParticipantForPick,
  getRoundForPick,
  getPickInRound,
  getPickNumbersForParticipant,
  isPickForParticipant,
  
  // Formatters
  formatADP,
  formatTimer,
  formatPickNumber,
  formatProjection,
  truncateName,
  
  // Timer
  getTimerUrgency,
  getTimerColor,
  
  // Position
  createEmptyPositionCounts,
  calculatePositionCounts,
  getTotalCount,
  
  // Player ID
  generatePlayerId,
  normalizeName,
  playerMatchesSearch,
} from './utils';

// Hooks
export { 
  useDraftTimer,
  useDraftQueue,
  useAvailablePlayers,
  useDraftPicks,
  useDraftRoom,
} from './hooks';

export type {
  UseDraftTimerOptions,
  UseDraftTimerResult,
  UseDraftQueueOptions,
  UseDraftQueueResult,
  UseAvailablePlayersOptions,
  UseAvailablePlayersResult,
  UseDraftPicksOptions,
  UseDraftPicksResult,
  UseDraftRoomOptions,
  UseDraftRoomResult,
} from './hooks';

// Components
export { 
  DraftRoomVX2,
  DraftNavbar,
  GRACE_PERIOD_MS,
  DraftInfoModal,
  DraftTutorialModal,
  PicksBar,
  PlayerList,
  QueueView,
  RosterView,
  DraftBoard,
  DraftInfo,
  DraftFooter,
} from './components';

export type {
  DraftRoomVX2Props,
  DraftNavbarProps,
  DraftInfoModalProps,
  DraftTutorialModalProps,
  PicksBarProps,
  PlayerListProps,
  QueueViewProps,
  RosterViewProps,
  DraftBoardProps,
  DraftInfoProps,
  DraftFooterProps,
} from './components';
