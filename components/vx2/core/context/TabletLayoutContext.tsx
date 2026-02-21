/**
 * TabletLayoutContext - Panel Layout State Management
 *
 * Manages the three-panel layout state for tablet draft room.
 * Handles panel widths, visibility, and responsive adjustments.
 * Persists user preferences to localStorage.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
  type ReactElement,
} from 'react';

import { TABLET_PANELS, TABLET_FRAME } from '../constants/tablet';
import type {
  TabletLayoutContextValue,
  PanelId,
  PanelDimensions,
  PanelVisibility,
  StoredLayoutPreferences,
} from '../types/tablet';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Storage key for persisting layout preferences */
const LAYOUT_STORAGE_KEY = 'topdog_tablet_layout';

/** Default panel visibility */
const DEFAULT_VISIBILITY: PanelVisibility = {
  left: true,
  center: true,
  right: true,
};

// ============================================================================
// CONTEXT
// ============================================================================

const TabletLayoutContext = createContext<TabletLayoutContextValue | null>(null);

/**
 * Hook to access tablet layout context
 * @throws Error if used outside TabletLayoutProvider
 */
export function useTabletLayoutContext(): TabletLayoutContextValue {
  const context = useContext(TabletLayoutContext);
  if (!context) {
    throw new Error('useTabletLayoutContext must be used within TabletLayoutProvider');
  }
  return context;
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export interface TabletLayoutProviderProps {
  /** Child components */
  children: ReactNode;
  /** Initial left panel width override */
  initialLeftWidth?: number;
  /** Initial right panel width override */
  initialRightWidth?: number;
  /** Initial visibility override */
  initialVisibility?: Partial<PanelVisibility>;
  /** Disable persistence to localStorage */
  disablePersistence?: boolean;
}

/**
 * TabletLayoutProvider - Provides panel layout state to children
 *
 * @example
 * ```tsx
 * <TabletLayoutProvider>
 *   <TabletDraftRoomVX2 roomId="123" />
 * </TabletLayoutProvider>
 * ```
 */
export function TabletLayoutProvider({
  children,
  initialLeftWidth,
  initialRightWidth,
  initialVisibility,
  disablePersistence = false,
}: TabletLayoutProviderProps): ReactElement {
  // Panel visibility state
  const [visibility, setVisibility] = useState<PanelVisibility>({
    ...DEFAULT_VISIBILITY,
    ...initialVisibility,
  });

  // Panel dimensions (left and right are controlled, center is calculated)
  const [leftWidth, setLeftWidthState] = useState(
    initialLeftWidth ?? TABLET_PANELS.left.defaultWidth,
  );
  const [rightWidth, setRightWidthState] = useState(
    initialRightWidth ?? TABLET_PANELS.right.defaultWidth,
  );

  // Viewport dimensions - always start with defaults to prevent hydration mismatch
  const [viewportWidth, setViewportWidth] = useState<number>(TABLET_FRAME.width);
  const [viewportHeight, setViewportHeight] = useState<number>(TABLET_FRAME.height);

  // Update viewport dimensions on mount and resize (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set initial values on mount
    setViewportWidth(window.innerWidth);
    setViewportHeight(window.innerHeight);

    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load persisted layout on mount
  useEffect(() => {
    if (disablePersistence || typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (saved) {
        const parsed: StoredLayoutPreferences = JSON.parse(saved);

        // Only apply if data is recent (within 30 days)
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - parsed.timestamp < thirtyDaysMs) {
          if (parsed.leftWidth) setLeftWidthState(parsed.leftWidth);
          if (parsed.rightWidth) setRightWidthState(parsed.rightWidth);
          if (parsed.visibility) setVisibility(parsed.visibility);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [disablePersistence]);

  // Persist layout changes
  const persistLayout = useCallback(
    (left: number, right: number, vis: PanelVisibility) => {
      if (disablePersistence || typeof window === 'undefined') return;

      try {
        const data: StoredLayoutPreferences = {
          leftWidth: left,
          rightWidth: right,
          visibility: vis,
          timestamp: Date.now(),
        };
        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(data));
      } catch {
        // Ignore storage errors
      }
    },
    [disablePersistence],
  );

  // Constrained width setters
  const setLeftWidth = useCallback(
    (width: number) => {
      const constrained = Math.max(
        TABLET_PANELS.left.minWidth,
        Math.min(TABLET_PANELS.left.maxWidth, width),
      );
      setLeftWidthState(constrained);
      persistLayout(constrained, rightWidth, visibility);
    },
    [rightWidth, visibility, persistLayout],
  );

  const setRightWidth = useCallback(
    (width: number) => {
      const constrained = Math.max(
        TABLET_PANELS.right.minWidth,
        Math.min(TABLET_PANELS.right.maxWidth, width),
      );
      setRightWidthState(constrained);
      persistLayout(leftWidth, constrained, visibility);
    },
    [leftWidth, visibility, persistLayout],
  );

  // Panel visibility controls
  const togglePanel = useCallback(
    (panel: PanelId) => {
      // Center panel cannot be toggled
      if (panel === 'center') return;

      setVisibility(prev => {
        const next = { ...prev, [panel]: !prev[panel] };
        persistLayout(leftWidth, rightWidth, next);
        return next;
      });
    },
    [leftWidth, rightWidth, persistLayout],
  );

  const collapsePanel = useCallback(
    (panel: PanelId) => {
      if (panel === 'center') return;

      setVisibility(prev => {
        const next = { ...prev, [panel]: false };
        persistLayout(leftWidth, rightWidth, next);
        return next;
      });
    },
    [leftWidth, rightWidth, persistLayout],
  );

  const expandPanel = useCallback(
    (panel: PanelId) => {
      setVisibility(prev => {
        const next = { ...prev, [panel]: true };
        persistLayout(leftWidth, rightWidth, next);
        return next;
      });
    },
    [leftWidth, rightWidth, persistLayout],
  );

  // Reset to defaults
  const resetLayout = useCallback(() => {
    setLeftWidthState(TABLET_PANELS.left.defaultWidth);
    setRightWidthState(TABLET_PANELS.right.defaultWidth);
    setVisibility(DEFAULT_VISIBILITY);

    if (!disablePersistence && typeof window !== 'undefined') {
      localStorage.removeItem(LAYOUT_STORAGE_KEY);
    }
  }, [disablePersistence]);

  // Calculate panel dimensions
  const dimensions = useMemo<PanelDimensions>(() => {
    const dividers = TABLET_PANELS.dividerWidth * 2;
    const visibleLeft = visibility.left ? leftWidth : 0;
    const visibleRight = visibility.right ? rightWidth : 0;
    const centerWidth = viewportWidth - visibleLeft - visibleRight - dividers;

    return {
      left: visibleLeft,
      center: Math.max(TABLET_PANELS.center.minWidth, centerWidth),
      right: visibleRight,
    };
  }, [leftWidth, rightWidth, visibility, viewportWidth]);

  // Check if at default layout
  const isDefaultLayout = useMemo(() => {
    return (
      leftWidth === TABLET_PANELS.left.defaultWidth &&
      rightWidth === TABLET_PANELS.right.defaultWidth &&
      visibility.left === DEFAULT_VISIBILITY.left &&
      visibility.center === DEFAULT_VISIBILITY.center &&
      visibility.right === DEFAULT_VISIBILITY.right
    );
  }, [leftWidth, rightWidth, visibility]);

  // Memoize context value
  const value = useMemo<TabletLayoutContextValue>(
    () => ({
      dimensions,
      visibility,
      setLeftWidth,
      setRightWidth,
      togglePanel,
      collapsePanel,
      expandPanel,
      resetLayout,
      isDefaultLayout,
      viewportWidth,
      viewportHeight,
    }),
    [
      dimensions,
      visibility,
      setLeftWidth,
      setRightWidth,
      togglePanel,
      collapsePanel,
      expandPanel,
      resetLayout,
      isDefaultLayout,
      viewportWidth,
      viewportHeight,
    ],
  );

  return <TabletLayoutContext.Provider value={value}>{children}</TabletLayoutContext.Provider>;
}

export default TabletLayoutContext;
