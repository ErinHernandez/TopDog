/**
 * VX2 Core Types
 * 
 * Barrel exports for all type definitions.
 */

// Navigation types
export type {
  TabId,
  TabDisplayName,
  TabIconProps,
  TabIconConfig,
  BadgeSource,
  TabBadgeConfig,
  TabConfig,
  TabHistoryEntry,
  ScrollPosition,
  TabPersistedState,
  TabNavigationState,
  TabNavigationAction,
  TabNavigationContextValue,
  DeepLinkRoute,
  ParsedDeepLink,
  TabAnalyticsEvent,
} from './navigation';

export { TAB_DISPLAY_NAMES } from './navigation';

// App types
export type {
  AuthStatus,
  User,
  AppState,
  AppAction,
  ModalId,
  ModalState,
  ModalAction,
  ToastType,
  Toast,
  ThemeMode,
  ThemeConfig,
  DeviceType,
  Orientation,
  ViewportInfo,
} from './app';

// Tablet types
export type {
  TabletOrientation,
  OrientationChangeEvent,
  PanelId,
  PanelVisibility,
  PanelDimensions,
  TabletLayoutContextValue,
  DraftActivePanel,
  DraftLayoutMode,
  TabletDraftRoomProps,
  PanelContainerProps,
  PanelDividerProps,
  iPadModel,
  TabletDeviceInfo,
  TabletNavStyle,
  TabletNavState,
  TabletNavContextValue,
  TabletShellProps,
  TabletFrameProps,
  PortraitBlockerProps,
  OrientationGuardProps,
  UseTabletOrientationResult,
  UseIsTabletResult,
  UseTabletLayoutResult,
  PanelResizeEvent,
  StoredLayoutPreferences,
} from './tablet';

