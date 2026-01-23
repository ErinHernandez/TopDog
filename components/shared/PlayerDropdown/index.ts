/**
 * PlayerDropdown - Export Barrel
 * 
 * Centralized exports for the PlayerDropdown system
 */

export { default as PlayerDropdown } from './PlayerDropdown';
export type { PlayerDropdownProps, RenderPlayerCell, RenderPlayerCellContext } from './PlayerDropdown';
export { default as PlayerDropdownRow } from './PlayerDropdownRow';
export { default as PlayerDropdownContent } from './PlayerDropdownContent';

export { 
  DROPDOWN_STYLES, 
  DROPDOWN_ANIMATIONS, 
  DROPDOWN_DIMENSIONS,
  POSITION_STYLES,
  MOBILE_ADJUSTMENTS,
  CONTEXT_OVERRIDES 
} from './PlayerDropdownStyles';

// Re-export hooks for convenience
export { 
  usePlayerDropdown,
  useDraftRoomDropdown,
  useRankingsDropdown,
  useTeamManagementDropdown 
} from '../../../hooks/usePlayerDropdown';

// Re-export data service
export { playerDataService } from '../../../lib/playerData/PlayerDataService';
