/**
 * Tablet Draft Room Components
 * 
 * Three-panel draft room optimized for iPad landscape.
 */

export { default as TabletDraftRoomVX2 } from './TabletDraftRoomVX2';
export { default as TabletDraftHeader } from './TabletDraftHeader';

// Panel components
export { PlayerListPanel } from './LeftPanel';
export { PicksBarPanel } from './CenterPanel';
export { QueueRosterPanel } from './RightPanel';

// Re-export types
export type { TabletDraftRoomProps } from '../../core/types/tablet';

