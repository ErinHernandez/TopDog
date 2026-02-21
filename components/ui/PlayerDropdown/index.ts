/**
 * PlayerDropdown - Export Barrel
 *
 * Centralized exports for the PlayerDropdown system
 */

export { default as PlayerDropdown } from './PlayerDropdown';
export { default as PlayerDropdownRow } from './PlayerDropdownRow';
export { default as PlayerDropdownContent } from './PlayerDropdownContent';

export {
  DROPDOWN_STYLES,
  DROPDOWN_ANIMATIONS,
  DROPDOWN_DIMENSIONS,
  POSITION_STYLES,
  MOBILE_ADJUSTMENTS,
  CONTEXT_OVERRIDES,
} from './PlayerDropdownStyles';

export type { DropdownContext, PlayerDropdownProps } from './PlayerDropdown';
export type { PlayerDropdownRowProps } from './PlayerDropdownRow';
export type { PlayerDropdownContentProps } from './PlayerDropdownContent';

// Re-export hooks for convenience (if they exist)
// export {
//   usePlayerDropdown,
//   useDraftRoomDropdown,
//   useRankingsDropdown,
//   useTeamManagementDropdown
// } from '../../../hooks/usePlayerDropdown';

// Re-export data service
export { playerDataService } from '../../../lib/playerData/PlayerDataService';
