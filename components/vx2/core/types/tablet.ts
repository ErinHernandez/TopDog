/**
 * VX2 Tablet Types
 * 
 * TypeScript definitions for tablet-specific functionality.
 * iPad horizontal/landscape orientation only.
 */

// ============================================================================
// ORIENTATION TYPES
// ============================================================================

/**
 * iPad orientation state
 */
export type TabletOrientation = 'landscape' | 'portrait' | 'unknown';

/**
 * Orientation change event data
 */
export interface OrientationChangeEvent {
  /** Current orientation */
  orientation: TabletOrientation;
  /** Screen angle (0, 90, 180, 270) */
  angle: number;
  /** Whether orientation is locked by OS */
  isLocked: boolean;
}

// ============================================================================
// PANEL LAYOUT TYPES
// ============================================================================

/**
 * Panel identifiers for three-panel layout
 */
export type PanelId = 'left' | 'center' | 'right';

/**
 * Panel visibility state
 */
export interface PanelVisibility {
  /** Left panel (Available Players) visible */
  left: boolean;
  /** Center panel (Board) always visible */
  center: boolean;
  /** Right panel (Queue/Roster) visible */
  right: boolean;
}

/**
 * Panel width dimensions
 */
export interface PanelDimensions {
  /** Left panel width in pixels */
  left: number;
  /** Center panel width (calculated from remaining space) */
  center: number;
  /** Right panel width in pixels */
  right: number;
}

/**
 * Panel layout context value
 */
export interface TabletLayoutContextValue {
  /** Current panel widths */
  dimensions: PanelDimensions;
  /** Panel visibility state */
  visibility: PanelVisibility;
  /** Update left panel width */
  setLeftWidth: (width: number) => void;
  /** Update right panel width */
  setRightWidth: (width: number) => void;
  /** Toggle panel visibility */
  togglePanel: (panel: PanelId) => void;
  /** Collapse a specific panel */
  collapsePanel: (panel: PanelId) => void;
  /** Expand a specific panel */
  expandPanel: (panel: PanelId) => void;
  /** Reset to default layout */
  resetLayout: () => void;
  /** Whether layout matches default */
  isDefaultLayout: boolean;
  /** Current viewport width */
  viewportWidth: number;
  /** Current viewport height */
  viewportHeight: number;
}

// ============================================================================
// TABLET DRAFT ROOM TYPES
// ============================================================================

/**
 * Active view in single-panel mode (iPad Mini fallback)
 */
export type DraftActivePanel = 'players' | 'board' | 'queue' | 'roster' | 'info';

/**
 * Draft room layout mode based on screen width
 */
export type DraftLayoutMode = 
  | 'three-panel'  // Full iPad Pro experience
  | 'two-panel'    // iPad Air/standard
  | 'single-panel'; // iPad Mini fallback

/**
 * Draft room tablet component props
 */
export interface TabletDraftRoomProps {
  /** Draft room ID */
  roomId: string;
  /** User ID (optional) */
  userId?: string;
  /** Callback when leaving draft */
  onLeave?: () => void;
  /** Layout mode override (auto-detected if not provided) */
  layoutMode?: DraftLayoutMode;
  /** Enable dev tools overlay */
  showDevTools?: boolean;
  /** Enable fast timer mode */
  fastMode?: boolean;
}

/**
 * Panel container props
 */
export interface PanelContainerProps {
  /** Panel identifier */
  panelId: PanelId;
  /** Panel content */
  children: React.ReactNode;
  /** Custom width override */
  width?: number;
  /** Custom className */
  className?: string;
  /** Whether panel can be collapsed */
  collapsible?: boolean;
  /** Panel header content */
  header?: React.ReactNode;
}

/**
 * Panel divider props
 */
export interface PanelDividerProps {
  /** Which panel this divider is between (left = between left/center) */
  position: 'left' | 'right';
  /** Whether divider is draggable for resize */
  draggable?: boolean;
  /** Callback when drag starts */
  onDragStart?: () => void;
  /** Callback during drag */
  onDrag?: (delta: number) => void;
  /** Callback when drag ends */
  onDragEnd?: () => void;
}

// ============================================================================
// TABLET DEVICE TYPES
// ============================================================================

/**
 * Detected iPad model
 */
export type iPadModel = 
  | 'ipad-pro-12.9'
  | 'ipad-pro-11'
  | 'ipad-air'
  | 'ipad-10th'
  | 'ipad-9th'
  | 'ipad-mini'
  | 'ipad-unknown'
  | 'not-ipad';

/**
 * Tablet device information
 */
export interface TabletDeviceInfo {
  /** Whether device is an iPad */
  isIPad: boolean;
  /** Detected iPad model */
  model: iPadModel;
  /** Screen dimensions */
  screen: {
    width: number;
    height: number;
    pixelRatio: number;
  };
  /** Current orientation */
  orientation: TabletOrientation;
  /** Whether device has notch/sensor housing (affects safe areas) */
  hasNotch: boolean;
  /** Whether device supports pointer (trackpad/mouse) */
  hasPointer: boolean;
  /** Whether device supports hover */
  hasHover: boolean;
}

// ============================================================================
// TABLET NAVIGATION TYPES
// ============================================================================

/**
 * Tablet navigation display style
 */
export type TabletNavStyle = 
  | 'sidebar'       // Left sidebar (collapsed/expanded)
  | 'bottom'        // Bottom tab bar (like phone)
  | 'hidden';       // No navigation (draft room)

/**
 * Tablet navigation state
 */
export interface TabletNavState {
  /** Current navigation style */
  style: TabletNavStyle;
  /** Whether sidebar is expanded (if using sidebar) */
  isExpanded: boolean;
  /** Currently active tab */
  activeTab: string;
  /** Tab badge counts */
  badges: Record<string, number>;
}

/**
 * Tablet navigation context value
 */
export interface TabletNavContextValue extends TabletNavState {
  /** Navigate to a tab */
  navigateToTab: (tabId: string) => void;
  /** Set navigation style */
  setNavStyle: (style: TabletNavStyle) => void;
  /** Toggle sidebar expansion */
  toggleSidebar: () => void;
  /** Update badge count for a tab */
  setBadge: (tabId: string, count: number) => void;
}

// ============================================================================
// TABLET SHELL TYPES
// ============================================================================

/**
 * Tablet shell component props
 */
export interface TabletShellProps {
  /** Initial tab to show */
  initialTab?: string;
  /** Whether to show in tablet frame (desktop preview) */
  showFrame?: boolean;
  /** Navigation style */
  navStyle?: TabletNavStyle;
  /** Frame size (iPad model) */
  frameModel?: iPadModel;
  /** Tab change callback */
  onTabChange?: (fromTab: string | null, toTab: string) => void;
}

/**
 * Tablet frame component props
 */
export interface TabletFrameProps {
  /** Content to render inside the frame */
  children: React.ReactNode;
  /** iPad model to simulate */
  model?: iPadModel;
  /** Override width */
  width?: number;
  /** Override height */
  height?: number;
  /** Additional className for outer container */
  className?: string;
  /** Show iPadOS status bar */
  showStatusBar?: boolean;
}

/**
 * Portrait blocker component props
 */
export interface PortraitBlockerProps {
  /** Custom message override */
  message?: string;
  /** Custom submessage override */
  submessage?: string;
  /** Whether to show logo */
  showLogo?: boolean;
}

/**
 * Orientation guard component props
 */
export interface OrientationGuardProps {
  /** Content to show in landscape */
  children: React.ReactNode;
  /** Whether to enforce horizontal only (default: true) */
  enforceHorizontal?: boolean;
  /** Custom portrait blocker component */
  customBlocker?: React.ReactNode;
}

// ============================================================================
// TABLET HOOK RETURN TYPES
// ============================================================================

/**
 * useTabletOrientation hook return type
 */
export interface UseTabletOrientationResult {
  /** Current orientation */
  orientation: TabletOrientation;
  /** Whether currently in landscape */
  isLandscape: boolean;
  /** Whether currently in portrait (should show blocker) */
  isPortrait: boolean;
  /** Screen angle (0, 90, 180, 270) */
  angle: number;
  /** Whether orientation API is available */
  isSupported: boolean;
  /** Force re-check orientation */
  refresh: () => void;
}

/**
 * useIsTablet hook return type
 */
export interface UseIsTabletResult {
  /** Whether device is a tablet */
  isTablet: boolean;
  /** Whether device is specifically an iPad */
  isIPad: boolean;
  /** Detected iPad model */
  model: iPadModel;
  /** Whether detection is complete */
  isLoaded: boolean;
  /** Full device info */
  deviceInfo: TabletDeviceInfo | null;
}

/**
 * useTabletLayout hook return type
 */
export interface UseTabletLayoutResult {
  /** Recommended layout mode */
  layoutMode: DraftLayoutMode;
  /** Panel dimensions */
  dimensions: PanelDimensions;
  /** Panel visibility */
  visibility: PanelVisibility;
  /** Viewport dimensions */
  viewport: {
    width: number;
    height: number;
  };
  /** Whether on a small tablet (iPad Mini) */
  isSmallTablet: boolean;
  /** Whether on a large tablet (iPad Pro 12.9") */
  isLargeTablet: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Panel resize event
 */
export interface PanelResizeEvent {
  panelId: PanelId;
  previousWidth: number;
  newWidth: number;
  viewportWidth: number;
}

/**
 * Stored layout preferences
 */
export interface StoredLayoutPreferences {
  leftWidth: number;
  rightWidth: number;
  visibility: PanelVisibility;
  timestamp: number;
}

