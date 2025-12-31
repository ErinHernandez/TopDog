/**
 * VX2 Tablet Components
 * 
 * iPad-optimized components for horizontal/landscape orientation.
 */

// Shell components
export {
  TabletShellVX2,
  TabletFrame,
  TabletStatusBar,
  TabletHeaderVX2,
} from './shell';

// Orientation components
export {
  OrientationGuard,
  PortraitBlocker,
} from './orientation';

// Panel components
export {
  PanelContainer,
  PanelDivider,
  PanelHeader,
} from './panels';

// Draft room components
export {
  TabletDraftRoomVX2,
  TabletDraftHeader,
  PlayerListPanel,
  PicksBarPanel,
  QueueRosterPanel,
} from './draft-room';

// Re-export types
export type {
  // Shell types
  TabletShellProps,
  TabletFrameProps,
  PortraitBlockerProps,
  OrientationGuardProps,
  
  // Panel types
  PanelContainerProps,
  PanelDividerProps,
  PanelId,
  PanelDimensions,
  PanelVisibility,
  TabletLayoutContextValue,
  
  // Draft room types
  TabletDraftRoomProps,
  DraftLayoutMode,
  DraftActivePanel,
  
  // Device types
  TabletOrientation,
  iPadModel,
  TabletDeviceInfo,
  
  // Hook return types
  UseTabletOrientationResult,
  UseIsTabletResult,
  UseTabletLayoutResult,
} from '../core/types/tablet';

