# VX2 Tablet (iPad Horizontal) Implementation Plan

**Author:** TopDog Engineering  
**Created:** December 23, 2024  
**Status:** Planning Phase  
**Target Platform:** iPad (Horizontal/Landscape Only)

---

## Executive Summary

This document outlines the comprehensive plan to build `vx2tablet`, an enterprise-grade iPad experience for the TopDog platform. The implementation will leverage the existing VX2 architecture while introducing tablet-specific optimizations for horizontal (landscape) orientation. The design philosophy prioritizes **information density**, **multi-column layouts**, and **draft room efficiency** to serve the "whale" user segment who conduct heavy drafting sessions.

---

## Table of Contents

1. [Project Scope](#1-project-scope)
2. [iPad Device Specifications](#2-ipad-device-specifications)
3. [Architecture Overview](#3-architecture-overview)
4. [Directory Structure](#4-directory-structure)
5. [Core Infrastructure](#5-core-infrastructure)
6. [Horizontal-Only Enforcement](#6-horizontal-only-enforcement)
7. [Component Design](#7-component-design)
8. [Draft Room Tablet Layout](#8-draft-room-tablet-layout)
9. [App Shell & Navigation](#9-app-shell--navigation)
10. [Responsive Breakpoint Strategy](#10-responsive-breakpoint-strategy)
11. [Safe Area & Notch Handling](#11-safe-area--notch-handling)
12. [Testing Infrastructure](#12-testing-infrastructure)
13. [Performance Considerations](#13-performance-considerations)
14. [Accessibility Requirements](#14-accessibility-requirements)
15. [Implementation Phases](#15-implementation-phases)
16. [Risk Assessment](#16-risk-assessment)
17. [Success Metrics](#17-success-metrics)
18. [Appendices](#appendices)

---

## 1. Project Scope

### 1.1 In Scope

| Feature | Description |
|---------|-------------|
| **Tablet Shell** | New `TabletShellVX2` component optimized for iPad landscape |
| **Draft Room Tablet** | Multi-panel draft room with simultaneous view of players, queue, and roster |
| **Orientation Lock** | Horizontal-only enforcement with portrait blocker |
| **Tablet Constants** | iPad-specific sizing, spacing, and typography |
| **Tablet Frame** | Desktop preview frame for iPad landscape dimensions |
| **Device Detection** | Hook to detect iPad specifically vs. other tablets |
| **Tablet Hooks** | Viewport-aware hooks with landscape layout logic |
| **Tab/Lobby Experience** | Tablet-optimized lobby with tournament grid layout |

### 1.2 Out of Scope (Future Phases)

- Android tablet support
- iPad Split View / Slide Over multitasking
- iPad keyboard shortcuts (Phase 2 enhancement)
- iPad Pencil input support
- Desktop/laptop support (separate initiative)

### 1.3 User Segment Focus

Per memory [[memory:6268949]], TopDog focuses on "whale" users who are heavy drafters. The tablet experience should:

- Maximize data granularity with minimal analysis
- Provide efficient draft room interactions for rapid picking
- Show more information simultaneously than phone view
- Reduce tab switching during drafts

---

## 2. iPad Device Specifications

### 2.1 iPad Models & Landscape Dimensions

| Model | Screen Size | Landscape Resolution | Pixel Ratio | Safe Areas |
|-------|-------------|---------------------|-------------|------------|
| **iPad Pro 12.9"** | 12.9" | 1366 x 1024 | 2x | Yes (rounded corners) |
| **iPad Pro 11"** | 11" | 1194 x 834 | 2x | Yes (rounded corners) |
| **iPad Air** | 10.9" | 1180 x 820 | 2x | Yes (rounded corners) |
| **iPad 10th Gen** | 10.9" | 1180 x 820 | 2x | Yes (rounded corners) |
| **iPad 9th Gen** | 10.2" | 1080 x 810 | 2x | No (square corners) |
| **iPad Mini 6** | 8.3" | 1133 x 744 | 2x | Yes (rounded corners) |

### 2.2 Target Breakpoints

```typescript
export const TABLET_BREAKPOINTS = {
  /** iPad Mini landscape minimum */
  TABLET_MIN: 744,
  /** Standard iPad landscape */
  TABLET_STANDARD: 810,
  /** iPad Air / iPad Pro 11" landscape */
  TABLET_LARGE: 834,
  /** iPad Pro 12.9" landscape */
  TABLET_XL: 1024,
  /** Maximum supported landscape width */
  TABLET_MAX: 1366,
} as const;
```

### 2.3 Safe Area Insets (Landscape)

| Edge | Older iPads | Newer iPads (rounded) |
|------|-------------|----------------------|
| Top | 0px | 0px |
| Bottom | 0px | 0px |
| Left | 0px | 20-44px (notch/sensor housing) |
| Right | 0px | 20-44px (notch/sensor housing) |

---

## 3. Architecture Overview

### 3.1 Design Principles

1. **VX2-Native**: Build entirely within the VX2 framework (no VX code reuse)
2. **Horizontal-First**: Every component designed for landscape orientation
3. **Multi-Panel Layout**: Take advantage of horizontal real estate
4. **Constants-Driven**: All dimensions from centralized constants
5. **Type-Safe**: 100% TypeScript with strict typing
6. **Accessibility-First**: ARIA labels, keyboard navigation, pointer support

### 3.2 Component Hierarchy

```
TabletShellVX2 (Landscape Container)
├── TabletStatusBarVX2 (Top bar with clock, battery, wifi)
├── TabletHeaderVX2 (Logo, navigation, user info)
├── TabletContentVX2 (Main content area)
│   ├── TabletLobbyVX2 (Grid-based tournament view)
│   ├── TabletLiveDraftsVX2 (Multi-column draft list)
│   ├── TabletDraftRoomVX2 (Three-panel draft experience)
│   │   ├── LeftPanel (Available Players)
│   │   ├── CenterPanel (Picks Bar + Draft Board)
│   │   └── RightPanel (Queue + Roster)
│   └── TabletProfileVX2 (Settings and account)
└── TabletNavigationVX2 (Left sidebar or bottom bar)
```

### 3.3 Data Flow

```
                    ┌─────────────────────┐
                    │  Existing VX2 Hooks  │
                    │  (useDraftRoom, etc) │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ TabletLayoutContext  │
                    │ (panel widths, state)│
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
   ┌────▼────┐           ┌─────▼────┐           ┌────▼────┐
   │LeftPanel│           │CenterPanel│          │RightPanel│
   │(Players)│           │(Board)    │          │(Queue)   │
   └─────────┘           └──────────┘           └─────────┘
```

---

## 4. Directory Structure

### 4.1 Proposed VX2 Tablet Directory

```
components/vx2/
├── core/
│   ├── constants/
│   │   ├── colors.ts          # (existing)
│   │   ├── sizes.ts           # (existing)
│   │   ├── tabs.ts            # (existing)
│   │   └── tablet.ts          # NEW: Tablet-specific constants
│   ├── context/
│   │   ├── TabNavigationContext.tsx  # (existing)
│   │   └── TabletLayoutContext.tsx   # NEW: Tablet panel layout state
│   └── types/
│       ├── app.ts             # (existing - has DeviceType, Orientation)
│       ├── index.ts           # (existing)
│       └── tablet.ts          # NEW: Tablet-specific types
│
├── tablet/                    # NEW: Tablet-specific components
│   ├── shell/
│   │   ├── TabletShellVX2.tsx        # Main tablet orchestrator
│   │   ├── TabletHeaderVX2.tsx       # Top header bar
│   │   ├── TabletStatusBar.tsx       # iPadOS status bar
│   │   ├── TabletNavigationVX2.tsx   # Sidebar or bottom navigation
│   │   ├── TabletFrame.tsx           # Desktop preview frame
│   │   └── index.ts
│   │
│   ├── orientation/
│   │   ├── OrientationGuard.tsx      # Blocks portrait mode
│   │   ├── PortraitBlocker.tsx       # "Please rotate" screen
│   │   └── index.ts
│   │
│   ├── panels/
│   │   ├── PanelContainer.tsx        # Resizable panel wrapper
│   │   ├── PanelDivider.tsx          # Draggable divider (optional)
│   │   └── index.ts
│   │
│   ├── draft-room/
│   │   ├── TabletDraftRoomVX2.tsx    # Main tablet draft room
│   │   ├── LeftPanel/
│   │   │   ├── PlayerListPanel.tsx   # Full player list
│   │   │   └── SearchFiltersPanel.tsx
│   │   ├── CenterPanel/
│   │   │   ├── PicksBarPanel.tsx     # Horizontal picks
│   │   │   ├── DraftBoardPanel.tsx   # Board view
│   │   │   └── TimerDisplay.tsx      # Large timer
│   │   ├── RightPanel/
│   │   │   ├── QueuePanel.tsx        # User's queue
│   │   │   └── RosterPanel.tsx       # User's roster
│   │   ├── shared/
│   │   │   └── TabletPlayerCard.tsx  # Wider card for tablet
│   │   └── index.ts
│   │
│   ├── tabs/
│   │   ├── TabletLobbyVX2.tsx        # Grid tournament view
│   │   ├── TabletLiveDraftsVX2.tsx   # Multi-column drafts
│   │   ├── TabletMyTeamsVX2.tsx      # Grid team view
│   │   ├── TabletExposureVX2.tsx     # Enhanced exposure view
│   │   ├── TabletProfileVX2.tsx      # Settings panel
│   │   └── index.ts
│   │
│   └── index.ts               # Barrel exports
│
├── hooks/
│   ├── ui/
│   │   ├── useLongPress.ts           # (existing)
│   │   ├── useDebounce.ts            # (existing)
│   │   ├── useTabletOrientation.ts   # NEW: Orientation detection
│   │   ├── useTabletLayout.ts        # NEW: Panel sizing logic
│   │   └── useIsTablet.ts            # NEW: iPad detection
│   └── index.ts
│
└── index.ts                   # Updated barrel exports
```

### 4.2 Testing Infrastructure

```
pages/testing-grounds/
├── vx2-draft-room.js          # (existing - phone)
├── vx2-tablet-draft-room.js   # NEW: Tablet draft room test
├── vx2-tablet-app-demo.js     # NEW: Full tablet app test
├── tablet-orientation-test.js # NEW: Orientation lock testing
└── tablet-panel-sandbox.js    # NEW: Panel component testing
```

---

## 5. Core Infrastructure

### 5.1 Tablet Constants (`core/constants/tablet.ts`)

```typescript
/**
 * VX2 Tablet Constants
 * 
 * iPad-specific sizing system for horizontal/landscape orientation.
 * All measurements optimized for landscape iPad displays.
 */

// ============================================================================
// TABLET FRAME (For Desktop Preview)
// ============================================================================

export const TABLET_FRAME = {
  /** iPad Pro 11" landscape dimensions */
  width: 1194,
  height: 834,
  /** Alternative: iPad Pro 12.9" */
  widthXL: 1366,
  heightXL: 1024,
  /** Border radius for modern iPads */
  borderRadius: 20,
  /** Frame bezel padding */
  framePadding: 4,
  /** Bezel color */
  bezelColor: '#1C1C1E',
  /** Status bar height (iPadOS) */
  statusBarHeight: 24,
} as const;

// ============================================================================
// TABLET BREAKPOINTS
// ============================================================================

export const TABLET_BREAKPOINTS = {
  /** iPad Mini landscape minimum */
  MINI: 744,
  /** Standard iPad landscape */
  STANDARD: 810,
  /** iPad Air / iPad Pro 11" landscape */
  LARGE: 834,
  /** iPad Pro 12.9" landscape */
  XL: 1024,
} as const;

// ============================================================================
// TABLET LAYOUT - Three Panel System
// ============================================================================

export const TABLET_PANELS = {
  /** Left panel (Available Players) */
  left: {
    minWidth: 320,
    defaultWidth: 380,
    maxWidth: 450,
  },
  /** Center panel (Picks Bar + Board) */
  center: {
    minWidth: 400,
    // Flex: takes remaining space
  },
  /** Right panel (Queue + Roster) */
  right: {
    minWidth: 280,
    defaultWidth: 320,
    maxWidth: 400,
  },
  /** Panel divider width */
  dividerWidth: 1,
  /** Panel divider hit area (for drag) */
  dividerHitArea: 8,
} as const;

// ============================================================================
// TABLET HEADER
// ============================================================================

export const TABLET_HEADER = {
  /** Header height */
  height: 56,
  /** Logo height */
  logoHeight: 36,
  /** Logo max width */
  logoMaxWidth: 150,
  /** Button size */
  buttonSize: 44,
  /** Icon size */
  iconSize: 24,
  /** Horizontal padding */
  paddingX: 24,
} as const;

// ============================================================================
// TABLET NAVIGATION
// ============================================================================

export const TABLET_NAV = {
  /** Sidebar width (if using left sidebar) */
  sidebarWidth: 72,
  /** Expanded sidebar width */
  sidebarExpandedWidth: 240,
  /** Bottom bar height (if using bottom nav) */
  bottomBarHeight: 64,
  /** Tab icon size */
  tabIconSize: 28,
  /** Tab label font size */
  tabLabelSize: 11,
} as const;

// ============================================================================
// TABLET DRAFT ROOM
// ============================================================================

export const TABLET_DRAFT = {
  /** Picks bar height */
  picksBarHeight: 180,
  /** Pick card dimensions */
  pickCard: {
    width: 120,
    height: 160,
    gap: 12,
  },
  /** Player row height in list */
  playerRowHeight: 52,
  /** Player card expanded height */
  playerCardExpandedHeight: 280,
  /** Queue item height */
  queueItemHeight: 48,
  /** Roster cell height */
  rosterCellHeight: 44,
  /** Timer display size */
  timerSize: 64,
} as const;

// ============================================================================
// TABLET TYPOGRAPHY
// ============================================================================

export const TABLET_TYPOGRAPHY = {
  /** Scale factor vs mobile */
  scaleFactor: 1.1,
  
  fontSize: {
    xs: 12,    // vs 11 on mobile
    sm: 14,    // vs 13 on mobile
    base: 16,  // vs 14 on mobile
    lg: 18,    // vs 16 on mobile
    xl: 20,    // vs 18 on mobile
    '2xl': 26, // vs 24 on mobile
    '3xl': 34, // vs 30 on mobile
  },
} as const;

// ============================================================================
// TABLET SPACING
// ============================================================================

export const TABLET_SPACING = {
  /** Extra small: 6px */
  xs: 6,
  /** Small: 12px */
  sm: 12,
  /** Medium: 16px */
  md: 16,
  /** Large: 24px */
  lg: 24,
  /** Extra large: 32px */
  xl: 32,
  /** 2XL: 48px */
  '2xl': 48,
} as const;

// ============================================================================
// TABLET TOUCH TARGETS
// ============================================================================

export const TABLET_TOUCH = {
  /** Minimum touch target (slightly smaller than phone due to precision) */
  min: 40,
  /** Comfortable touch target */
  comfort: 44,
  /** Large action buttons */
  large: 52,
} as const;

// ============================================================================
// TABLET SAFE AREAS (Landscape)
// ============================================================================

export const TABLET_SAFE_AREA = {
  /** Left safe area (for newer iPads with sensors) */
  left: 'env(safe-area-inset-left, 0px)',
  /** Right safe area (for newer iPads with sensors) */
  right: 'env(safe-area-inset-right, 0px)',
  /** Top (usually 0 in landscape) */
  top: 'env(safe-area-inset-top, 0px)',
  /** Bottom (usually 0 in landscape) */
  bottom: 'env(safe-area-inset-bottom, 0px)',
} as const;
```

### 5.2 Tablet Types (`core/types/tablet.ts`)

```typescript
/**
 * VX2 Tablet Types
 * 
 * TypeScript definitions for tablet-specific functionality.
 */

// ============================================================================
// ORIENTATION
// ============================================================================

/**
 * iPad orientation state
 */
export type TabletOrientation = 'landscape' | 'portrait' | 'unknown';

/**
 * Orientation change event data
 */
export interface OrientationChangeEvent {
  orientation: TabletOrientation;
  angle: number;
  isLocked: boolean;
}

// ============================================================================
// PANEL LAYOUT
// ============================================================================

/**
 * Panel identifiers for three-panel layout
 */
export type PanelId = 'left' | 'center' | 'right';

/**
 * Panel visibility state
 */
export interface PanelVisibility {
  left: boolean;
  center: boolean;
  right: boolean;
}

/**
 * Panel dimensions
 */
export interface PanelDimensions {
  left: number;
  center: number; // Calculated from remaining space
  right: number;
}

/**
 * Panel layout context value
 */
export interface TabletLayoutContextValue {
  /** Current panel widths */
  dimensions: PanelDimensions;
  /** Panel visibility */
  visibility: PanelVisibility;
  /** Update left panel width */
  setLeftWidth: (width: number) => void;
  /** Update right panel width */
  setRightWidth: (width: number) => void;
  /** Toggle panel visibility */
  togglePanel: (panel: PanelId) => void;
  /** Collapse panel */
  collapsePanel: (panel: PanelId) => void;
  /** Expand panel */
  expandPanel: (panel: PanelId) => void;
  /** Reset to default layout */
  resetLayout: () => void;
  /** Whether layout is at default */
  isDefaultLayout: boolean;
  /** Viewport width */
  viewportWidth: number;
}

// ============================================================================
// TABLET DRAFT ROOM
// ============================================================================

/**
 * Active panel in draft room (for mobile-like single panel view on Mini)
 */
export type DraftActivePanel = 'players' | 'board' | 'queue' | 'roster' | 'info';

/**
 * Draft room layout mode
 */
export type DraftLayoutMode = 'three-panel' | 'two-panel' | 'single-panel';

/**
 * Draft room tablet props
 */
export interface TabletDraftRoomProps {
  /** Draft room ID */
  roomId: string;
  /** User ID */
  userId?: string;
  /** Callback when leaving draft */
  onLeave?: () => void;
  /** Layout mode override (auto-detected if not provided) */
  layoutMode?: DraftLayoutMode;
  /** Enable dev tools */
  showDevTools?: boolean;
}

// ============================================================================
// TABLET DEVICE
// ============================================================================

/**
 * iPad model detection
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
 * Tablet device info
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
  /** Whether device has notch/sensor housing */
  hasNotch: boolean;
  /** Whether device supports pointer (trackpad/mouse) */
  hasPointer: boolean;
}

// ============================================================================
// TABLET NAVIGATION
// ============================================================================

/**
 * Tablet navigation style
 */
export type TabletNavStyle = 'sidebar' | 'bottom' | 'hidden';

/**
 * Tablet navigation state
 */
export interface TabletNavState {
  /** Current nav style */
  style: TabletNavStyle;
  /** Whether sidebar is expanded */
  isExpanded: boolean;
  /** Active tab */
  activeTab: string;
}
```

### 5.3 Tablet Layout Context (`core/context/TabletLayoutContext.tsx`)

```typescript
/**
 * TabletLayoutContext - Panel Layout State Management
 * 
 * Manages the three-panel layout state for tablet draft room.
 * Handles panel widths, visibility, and responsive adjustments.
 */

import React, { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  useMemo,
  useEffect 
} from 'react';
import type { 
  TabletLayoutContextValue, 
  PanelId, 
  PanelDimensions, 
  PanelVisibility 
} from '../types/tablet';
import { TABLET_PANELS } from '../constants/tablet';

// Storage key for persisting layout preferences
const LAYOUT_STORAGE_KEY = 'topdog_tablet_layout';

const TabletLayoutContext = createContext<TabletLayoutContextValue | null>(null);

export function useTabletLayout(): TabletLayoutContextValue {
  const context = useContext(TabletLayoutContext);
  if (!context) {
    throw new Error('useTabletLayout must be used within TabletLayoutProvider');
  }
  return context;
}

interface TabletLayoutProviderProps {
  children: React.ReactNode;
}

export function TabletLayoutProvider({ 
  children 
}: TabletLayoutProviderProps): React.ReactElement {
  // Panel visibility state
  const [visibility, setVisibility] = useState<PanelVisibility>({
    left: true,
    center: true,
    right: true,
  });
  
  // Panel dimensions (left and right are controlled, center is calculated)
  const [leftWidth, setLeftWidthState] = useState(TABLET_PANELS.left.defaultWidth);
  const [rightWidth, setRightWidthState] = useState(TABLET_PANELS.right.defaultWidth);
  
  // Viewport width for responsive calculations
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : TABLET_FRAME.width
  );
  
  // Listen for resize
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Load persisted layout
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (saved) {
        const { left, right, visibility: vis } = JSON.parse(saved);
        if (left) setLeftWidthState(left);
        if (right) setRightWidthState(right);
        if (vis) setVisibility(vis);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);
  
  // Persist layout changes
  const persistLayout = useCallback((left: number, right: number, vis: PanelVisibility) => {
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify({ left, right, visibility: vis }));
    } catch {
      // Ignore storage errors
    }
  }, []);
  
  // Constrained setters
  const setLeftWidth = useCallback((width: number) => {
    const constrained = Math.max(
      TABLET_PANELS.left.minWidth,
      Math.min(TABLET_PANELS.left.maxWidth, width)
    );
    setLeftWidthState(constrained);
    persistLayout(constrained, rightWidth, visibility);
  }, [rightWidth, visibility, persistLayout]);
  
  const setRightWidth = useCallback((width: number) => {
    const constrained = Math.max(
      TABLET_PANELS.right.minWidth,
      Math.min(TABLET_PANELS.right.maxWidth, width)
    );
    setRightWidthState(constrained);
    persistLayout(leftWidth, constrained, visibility);
  }, [leftWidth, visibility, persistLayout]);
  
  // Panel visibility controls
  const togglePanel = useCallback((panel: PanelId) => {
    setVisibility(prev => {
      const next = { ...prev, [panel]: !prev[panel] };
      persistLayout(leftWidth, rightWidth, next);
      return next;
    });
  }, [leftWidth, rightWidth, persistLayout]);
  
  const collapsePanel = useCallback((panel: PanelId) => {
    setVisibility(prev => {
      const next = { ...prev, [panel]: false };
      persistLayout(leftWidth, rightWidth, next);
      return next;
    });
  }, [leftWidth, rightWidth, persistLayout]);
  
  const expandPanel = useCallback((panel: PanelId) => {
    setVisibility(prev => {
      const next = { ...prev, [panel]: true };
      persistLayout(leftWidth, rightWidth, next);
      return next;
    });
  }, [leftWidth, rightWidth, persistLayout]);
  
  // Reset to defaults
  const resetLayout = useCallback(() => {
    setLeftWidthState(TABLET_PANELS.left.defaultWidth);
    setRightWidthState(TABLET_PANELS.right.defaultWidth);
    setVisibility({ left: true, center: true, right: true });
    localStorage.removeItem(LAYOUT_STORAGE_KEY);
  }, []);
  
  // Calculate dimensions
  const dimensions = useMemo<PanelDimensions>(() => {
    const dividers = TABLET_PANELS.dividerWidth * 2;
    const visibleLeft = visibility.left ? leftWidth : 0;
    const visibleRight = visibility.right ? rightWidth : 0;
    const center = viewportWidth - visibleLeft - visibleRight - dividers;
    
    return {
      left: visibleLeft,
      center: Math.max(TABLET_PANELS.center.minWidth, center),
      right: visibleRight,
    };
  }, [leftWidth, rightWidth, visibility, viewportWidth]);
  
  // Check if at default
  const isDefaultLayout = useMemo(() => {
    return (
      leftWidth === TABLET_PANELS.left.defaultWidth &&
      rightWidth === TABLET_PANELS.right.defaultWidth &&
      visibility.left && visibility.center && visibility.right
    );
  }, [leftWidth, rightWidth, visibility]);
  
  const value = useMemo<TabletLayoutContextValue>(() => ({
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
  }), [
    dimensions, visibility, setLeftWidth, setRightWidth,
    togglePanel, collapsePanel, expandPanel, resetLayout,
    isDefaultLayout, viewportWidth,
  ]);
  
  return (
    <TabletLayoutContext.Provider value={value}>
      {children}
    </TabletLayoutContext.Provider>
  );
}

export default TabletLayoutContext;
```

---

## 6. Horizontal-Only Enforcement

### 6.1 Strategy Overview

The horizontal-only experience requires:

1. **Detection**: Real-time orientation detection
2. **Blocking**: Portrait mode blocker overlay
3. **CSS Lock**: Media queries for orientation-specific styles
4. **PWA Lock**: Manifest orientation preference

### 6.2 `useTabletOrientation` Hook

```typescript
/**
 * useTabletOrientation - Orientation Detection & Lock
 * 
 * Detects current iPad orientation and provides lock status.
 * Returns orientation state and whether portrait should be blocked.
 */

import { useState, useEffect, useCallback } from 'react';
import type { TabletOrientation, OrientationChangeEvent } from '../types/tablet';

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

export function useTabletOrientation(): UseTabletOrientationResult {
  const [orientation, setOrientation] = useState<TabletOrientation>('unknown');
  const [angle, setAngle] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  
  const detectOrientation = useCallback(() => {
    if (typeof window === 'undefined') {
      return { orientation: 'unknown' as const, angle: 0 };
    }
    
    // Method 1: Screen Orientation API
    if (screen.orientation) {
      const type = screen.orientation.type;
      const orientationAngle = screen.orientation.angle;
      
      if (type.includes('landscape')) {
        return { orientation: 'landscape' as const, angle: orientationAngle };
      } else if (type.includes('portrait')) {
        return { orientation: 'portrait' as const, angle: orientationAngle };
      }
    }
    
    // Method 2: Window dimensions
    const isLandscape = window.innerWidth > window.innerHeight;
    return { 
      orientation: isLandscape ? 'landscape' as const : 'portrait' as const,
      angle: isLandscape ? 90 : 0,
    };
  }, []);
  
  const refresh = useCallback(() => {
    const result = detectOrientation();
    setOrientation(result.orientation);
    setAngle(result.angle);
  }, [detectOrientation]);
  
  useEffect(() => {
    // Initial detection
    refresh();
    setIsSupported('orientation' in screen);
    
    // Listen for orientation changes
    const handleChange = () => refresh();
    
    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleChange);
    }
    window.addEventListener('resize', handleChange);
    window.addEventListener('orientationchange', handleChange);
    
    return () => {
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', handleChange);
      }
      window.removeEventListener('resize', handleChange);
      window.removeEventListener('orientationchange', handleChange);
    };
  }, [refresh]);
  
  return {
    orientation,
    isLandscape: orientation === 'landscape',
    isPortrait: orientation === 'portrait',
    angle,
    isSupported,
    refresh,
  };
}

export default useTabletOrientation;
```

### 6.3 `OrientationGuard` Component

```typescript
/**
 * OrientationGuard - Horizontal-Only Enforcer
 * 
 * Wraps tablet content and shows portrait blocker when device
 * is rotated to portrait orientation.
 */

import React from 'react';
import { useTabletOrientation } from '../../hooks/ui/useTabletOrientation';
import PortraitBlocker from './PortraitBlocker';

export interface OrientationGuardProps {
  /** Content to show in landscape */
  children: React.ReactNode;
  /** Whether to enforce horizontal only (default: true) */
  enforceHorizontal?: boolean;
  /** Custom portrait blocker component */
  portraitBlocker?: React.ReactNode;
}

export default function OrientationGuard({
  children,
  enforceHorizontal = true,
  portraitBlocker,
}: OrientationGuardProps): React.ReactElement {
  const { isPortrait } = useTabletOrientation();
  
  if (enforceHorizontal && isPortrait) {
    return portraitBlocker ? <>{portraitBlocker}</> : <PortraitBlocker />;
  }
  
  return <>{children}</>;
}
```

### 6.4 `PortraitBlocker` Component

```typescript
/**
 * PortraitBlocker - "Please Rotate" Screen
 * 
 * Displayed when iPad is held in portrait orientation.
 * Clean, branded design matching TopDog aesthetics.
 */

import React from 'react';
import { BG_COLORS, TEXT_COLORS, BRAND_COLORS } from '../../core/constants/colors';

export default function PortraitBlocker(): React.ReactElement {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: BG_COLORS.primary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        textAlign: 'center',
        zIndex: 99999,
      }}
    >
      {/* TopDog Logo */}
      <img
        src="/logo.png"
        alt="TopDog"
        style={{
          height: 48,
          marginBottom: 48,
          opacity: 0.8,
        }}
      />
      
      {/* Rotation Icon */}
      <div
        style={{
          width: 120,
          height: 120,
          marginBottom: 32,
          position: 'relative',
        }}
      >
        {/* Device outline */}
        <svg
          viewBox="0 0 100 100"
          fill="none"
          stroke={TEXT_COLORS.secondary}
          strokeWidth="2"
          style={{
            width: '100%',
            height: '100%',
            animation: 'rotate-hint 2s ease-in-out infinite',
          }}
        >
          {/* Portrait device */}
          <rect x="30" y="15" width="40" height="70" rx="6" />
          {/* Home indicator */}
          <line x1="42" y1="78" x2="58" y2="78" strokeLinecap="round" />
          {/* Rotation arrow */}
          <path
            d="M75 50 C75 30 60 20 45 25"
            strokeWidth="2"
            fill="none"
            stroke={BRAND_COLORS.primary}
          />
          <path
            d="M50 20 L45 25 L50 30"
            strokeWidth="2"
            fill="none"
            stroke={BRAND_COLORS.primary}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      
      {/* Message */}
      <h1
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: TEXT_COLORS.primary,
          marginBottom: 12,
        }}
      >
        Rotate Your iPad
      </h1>
      
      <p
        style={{
          fontSize: 16,
          color: TEXT_COLORS.secondary,
          maxWidth: 280,
          lineHeight: 1.5,
        }}
      >
        This experience is designed for landscape orientation.
        Please rotate your device to continue.
      </p>
      
      <style>{`
        @keyframes rotate-hint {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(15deg); }
        }
      `}</style>
    </div>
  );
}
```

### 6.5 PWA Manifest Configuration

Update `public/manifest.json`:

```json
{
  "name": "TopDog Fantasy Sports",
  "short_name": "TopDog",
  "description": "Best Ball Draft Experience",
  "start_url": "/",
  "display": "standalone",
  "orientation": "landscape",
  "background_color": "#101927",
  "theme_color": "#1DA1F2",
  "icons": [...]
}
```

### 6.6 CSS Orientation Queries

Add to `globals.css`:

```css
/* ============================================================================
   TABLET HORIZONTAL-ONLY STYLES
   ============================================================================ */

/* Force landscape styling on iPads */
@media only screen 
  and (min-device-width: 768px) 
  and (max-device-width: 1366px) 
  and (orientation: portrait) {
  
  .tablet-landscape-only {
    display: none !important;
  }
  
  .tablet-portrait-blocker {
    display: flex !important;
  }
}

@media only screen 
  and (min-device-width: 768px) 
  and (max-device-width: 1366px) 
  and (orientation: landscape) {
  
  .tablet-landscape-only {
    display: block !important;
  }
  
  .tablet-portrait-blocker {
    display: none !important;
  }
}

/* Hide scrollbars on tablet per user preference [[memory:9102895]] */
@media only screen and (min-device-width: 768px) and (max-device-width: 1366px) {
  * {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }
  
  *::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }
}
```

---

## 7. Component Design

### 7.1 Design Philosophy

The tablet components follow these principles:

1. **Multi-Column First**: Design for simultaneous information display
2. **Reduced Navigation**: Fewer taps required than phone experience
3. **Data Density**: More information per screen vs. mobile
4. **Pointer Friendly**: Support for trackpad/mouse in addition to touch
5. **Consistent with VX2**: Same constants, types, and patterns

### 7.2 TabletShellVX2 (Main Container)

```typescript
/**
 * TabletShellVX2 - Main Tablet App Shell
 * 
 * Root component for the VX2 tablet experience.
 * Orchestrates orientation guard, navigation, and content.
 */

export interface TabletShellVX2Props {
  /** Initial tab */
  initialTab?: string;
  /** Whether to show in tablet frame (desktop preview) */
  showFrame?: boolean;
  /** Navigation style */
  navStyle?: TabletNavStyle;
}

export default function TabletShellVX2({
  initialTab = 'lobby',
  showFrame = false,
  navStyle = 'sidebar',
}: TabletShellVX2Props): React.ReactElement {
  return (
    <TabletLayoutProvider>
      <TabletNavigationProvider initialTab={initialTab}>
        <OrientationGuard enforceHorizontal>
          {showFrame ? (
            <TabletFrame>
              <TabletShellContent navStyle={navStyle} />
            </TabletFrame>
          ) : (
            <TabletShellContent navStyle={navStyle} />
          )}
        </OrientationGuard>
      </TabletNavigationProvider>
    </TabletLayoutProvider>
  );
}
```

### 7.3 Component Size Comparison (Phone vs Tablet)

| Element | Phone (VX2) | Tablet (VX2 Tablet) |
|---------|-------------|---------------------|
| Header height | 26px | 56px |
| Footer height | 70px | 64px (or sidebar 72px) |
| Player row height | 40px | 52px |
| Pick card | 140 x 172px | 120 x 160px |
| Filter button | 44px | 40px |
| Touch target min | 44px | 40px |
| Font size (base) | 14px | 16px |
| Icon size (nav) | 24px | 28px |
| Padding (content) | 16px | 24px |

---

## 8. Draft Room Tablet Layout

### 8.1 Three-Panel Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  TopDog Logo    ┃    Round 1 • Pick 3    ┃    ⏱ 0:25    ┃    ⓧ     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐ ┌───────────────────────────────┐ ┌───────────────┐│
│  │             │ │                               │ │               ││
│  │   LEFT      │ │         CENTER                │ │    RIGHT      ││
│  │   PANEL     │ │         PANEL                 │ │    PANEL      ││
│  │             │ │                               │ │               ││
│  │  Available  │ │     Horizontal Picks Bar      │ │    Queue      ││
│  │  Players    │ │     ──────────────────        │ │    ────       ││
│  │             │ │                               │ │               ││
│  │  ┌────────┐ │ │  ┌──────────────────────────┐ │ │  ┌─────────┐  ││
│  │  │ Search │ │ │  │                          │ │ │  │ Player  │  ││
│  │  └────────┘ │ │  │      Draft Board         │ │ │  │ Player  │  ││
│  │             │ │  │      (Grid View)         │ │ │  │ Player  │  ││
│  │  [QB][RB]   │ │  │                          │ │ │  └─────────┘  ││
│  │  [WR][TE]   │ │  │                          │ │ │               ││
│  │             │ │  │                          │ │ │    Roster     ││
│  │  ┌────────┐ │ │  │                          │ │ │    ──────     ││
│  │  │Player 1│ │ │  │                          │ │ │               ││
│  │  │Player 2│ │ │  │                          │ │ │  QB: Empty    ││
│  │  │Player 3│ │ │  └──────────────────────────┘ │ │  RB: Player   ││
│  │  │Player 4│ │ │                               │ │  RB: Empty    ││
│  │  │Player 5│ │ │                               │ │  WR: Player   ││
│  │  └────────┘ │ │                               │ │  ...          ││
│  │             │ │                               │ │               ││
│  └─────────────┘ └───────────────────────────────┘ └───────────────┘│
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 8.2 Panel Specifications

| Panel | Default Width | Min Width | Max Width | Contents |
|-------|--------------|-----------|-----------|----------|
| **Left** | 380px | 320px | 450px | Player search, filters, player list, expanded card |
| **Center** | Flex | 400px | - | Picks bar, draft board, timer (large) |
| **Right** | 320px | 280px | 400px | Queue (top), Roster (bottom), split view |

### 8.3 Layout Modes by Screen Width

| Screen Width | Layout Mode | Description |
|--------------|-------------|-------------|
| ≥ 1024px (iPad Pro 12.9") | Three-Panel | All panels visible |
| 834-1023px (iPad Pro 11", Air) | Three-Panel | Narrower panels |
| 768-833px (iPad Mini, older iPads) | Two-Panel | Left + Center, Right collapsed |
| < 768px | Single-Panel | Tab-based like phone (fallback) |

### 8.4 `TabletDraftRoomVX2` Component

```typescript
/**
 * TabletDraftRoomVX2 - Three-Panel Draft Room
 * 
 * The crown jewel of the tablet experience.
 * Displays players, board, queue, and roster simultaneously.
 */

export interface TabletDraftRoomVX2Props {
  roomId: string;
  userId?: string;
  onLeave?: () => void;
  showDevTools?: boolean;
}

export default function TabletDraftRoomVX2({
  roomId,
  userId,
  onLeave,
  showDevTools = false,
}: TabletDraftRoomVX2Props): React.ReactElement {
  // Use existing VX2 draft room hook
  const draftRoom = useDraftRoom({ roomId, userId });
  
  // Use tablet layout context for panel dimensions
  const { dimensions, visibility, togglePanel } = useTabletLayout();
  
  // Determine layout mode based on viewport
  const layoutMode = useLayoutMode();
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      backgroundColor: BG_COLORS.primary,
    }}>
      {/* Tablet Draft Header */}
      <TabletDraftHeader
        timer={draftRoom.timer}
        round={draftRoom.currentRound}
        pick={draftRoom.currentPickNumber}
        isMyTurn={draftRoom.isMyTurn}
        onLeave={onLeave}
      />
      
      {/* Three Panel Layout */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        overflow: 'hidden',
      }}>
        {/* Left Panel - Available Players */}
        {visibility.left && (
          <LeftPanel
            width={dimensions.left}
            players={draftRoom.availablePlayers}
            onDraft={draftRoom.draftPlayer}
            onToggleQueue={draftRoom.queue.toggleQueue}
            isMyTurn={draftRoom.isMyTurn}
          />
        )}
        
        {/* Panel Divider */}
        {visibility.left && <PanelDivider panelId="left" />}
        
        {/* Center Panel - Picks Bar + Board */}
        <CenterPanel
          width={dimensions.center}
          picks={draftRoom.picks}
          participants={draftRoom.participants}
          currentPick={draftRoom.currentPickNumber}
          userIndex={draftRoom.userParticipantIndex}
        />
        
        {/* Panel Divider */}
        {visibility.right && <PanelDivider panelId="right" />}
        
        {/* Right Panel - Queue + Roster */}
        {visibility.right && (
          <RightPanel
            width={dimensions.right}
            queue={draftRoom.queue}
            roster={draftRoom.picks.userRoster}
          />
        )}
      </div>
    </div>
  );
}
```

---

## 9. App Shell & Navigation

### 9.1 Navigation Options

Two navigation patterns are suitable for tablet:

#### Option A: Left Sidebar (Recommended)

```
┌──────────────────────────────────────────────────┐
│ [🏠]                                              │
│ [📋]     Content Area                             │
│ [👤]                                              │
│ [📊]                                              │
│ [⚙️]                                              │
│                                                  │
│                                                  │
│                                                  │
│                                                  │
└──────────────────────────────────────────────────┘
```

- Icons-only collapsed state (72px)
- Expands on hover/tap to show labels (240px)
- Persists across all screens
- Badge support for notifications

#### Option B: Bottom Navigation

```
┌──────────────────────────────────────────────────┐
│                                                  │
│     Content Area (larger due to no sidebar)      │
│                                                  │
│                                                  │
│                                                  │
├──────────────────────────────────────────────────┤
│  [Lobby]  [Drafts]  [Teams]  [Exposure] [Profile]│
└──────────────────────────────────────────────────┘
```

- Similar to phone but wider hit areas
- Labels always visible
- More familiar to mobile users

### 9.2 Recommendation: Sidebar for Draft Room, Bottom for Lobby

| Context | Navigation | Reasoning |
|---------|------------|-----------|
| **Draft Room** | No nav (hidden) | Maximum space for three panels |
| **Lobby/Tabs** | Bottom navigation | Familiar, consistent with phone |
| **Settings/Profile** | Bottom navigation | Standard app navigation |

---

## 10. Responsive Breakpoint Strategy

### 10.1 iPad Model Detection

```typescript
export function useIPadModel(): iPadModel {
  const [model, setModel] = useState<iPadModel>('ipad-unknown');
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const width = window.screen.width;
    const height = window.screen.height;
    const maxDim = Math.max(width, height);
    const minDim = Math.min(width, height);
    const ratio = window.devicePixelRatio;
    
    // Detection based on screen dimensions
    if (maxDim === 1366 && minDim === 1024) {
      setModel('ipad-pro-12.9');
    } else if (maxDim === 1194 && minDim === 834) {
      setModel('ipad-pro-11');
    } else if (maxDim === 1180 && minDim === 820) {
      setModel('ipad-air');
    } else if (maxDim === 1133 && minDim === 744) {
      setModel('ipad-mini');
    } else if (maxDim === 1080 && minDim === 810) {
      setModel('ipad-9th');
    } else if (minDim >= 744 && minDim <= 1024) {
      setModel('ipad-unknown');
    } else {
      setModel('not-ipad');
    }
  }, []);
  
  return model;
}
```

### 10.2 Breakpoint CSS Custom Properties

```css
:root {
  /* Tablet breakpoint flags */
  --is-tablet-mini: 0;
  --is-tablet-standard: 0;
  --is-tablet-large: 0;
  --is-tablet-xl: 0;
}

/* iPad Mini (744px landscape) */
@media (min-width: 744px) and (max-width: 809px) and (orientation: landscape) {
  :root { --is-tablet-mini: 1; }
}

/* Standard iPad (810-833px landscape) */
@media (min-width: 810px) and (max-width: 833px) and (orientation: landscape) {
  :root { --is-tablet-standard: 1; }
}

/* iPad Air / Pro 11" (834-1023px landscape) */
@media (min-width: 834px) and (max-width: 1023px) and (orientation: landscape) {
  :root { --is-tablet-large: 1; }
}

/* iPad Pro 12.9" (1024px+ landscape) */
@media (min-width: 1024px) and (orientation: landscape) {
  :root { --is-tablet-xl: 1; }
}
```

---

## 11. Safe Area & Notch Handling

### 11.1 Safe Area CSS

```css
/* Tablet safe areas for landscape mode */
.tablet-safe-container {
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* Left panel with safe area */
.tablet-left-panel {
  padding-left: max(24px, env(safe-area-inset-left, 0px));
}

/* Right panel with safe area */
.tablet-right-panel {
  padding-right: max(24px, env(safe-area-inset-right, 0px));
}
```

### 11.2 Safe Area Hook

```typescript
export function useTabletSafeAreas() {
  const [safeAreas, setSafeAreas] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });
  
  useEffect(() => {
    const computeAreas = () => {
      const style = getComputedStyle(document.documentElement);
      setSafeAreas({
        top: parseInt(style.getPropertyValue('--sat') || '0'),
        right: parseInt(style.getPropertyValue('--sar') || '0'),
        bottom: parseInt(style.getPropertyValue('--sab') || '0'),
        left: parseInt(style.getPropertyValue('--sal') || '0'),
      });
    };
    
    // Add CSS custom properties for safe areas
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --sat: env(safe-area-inset-top);
        --sar: env(safe-area-inset-right);
        --sab: env(safe-area-inset-bottom);
        --sal: env(safe-area-inset-left);
      }
    `;
    document.head.appendChild(style);
    
    computeAreas();
    window.addEventListener('resize', computeAreas);
    
    return () => {
      document.head.removeChild(style);
      window.removeEventListener('resize', computeAreas);
    };
  }, []);
  
  return safeAreas;
}
```

---

## 12. Testing Infrastructure

### 12.1 Test Pages

| Page | Path | Purpose |
|------|------|---------|
| **Tablet Draft Room** | `/testing-grounds/vx2-tablet-draft-room` | Full draft room with dev controls |
| **Tablet App Demo** | `/testing-grounds/vx2-tablet-app-demo` | Full app with tab navigation |
| **Orientation Test** | `/testing-grounds/tablet-orientation-test` | Orientation lock testing |
| **Panel Sandbox** | `/testing-grounds/tablet-panel-sandbox` | Panel resizing and layout |
| **Component Gallery** | `/testing-grounds/tablet-component-gallery` | All tablet components |

### 12.2 Tablet Frame for Desktop Preview

```typescript
/**
 * TabletFrame - iPad Preview Frame for Desktop
 * 
 * Shows iPad Pro 11" landscape dimensions with bezel.
 */

export default function TabletFrame({
  children,
  model = 'ipad-pro-11',
}: TabletFrameProps): React.ReactElement {
  const dimensions = getTabletDimensions(model);
  
  return (
    <div className="bg-gray-900 min-h-screen flex items-center justify-center p-8">
      {/* iPad bezel */}
      <div
        style={{
          width: dimensions.width + 8,
          height: dimensions.height + 8,
          backgroundColor: '#1C1C1E',
          borderRadius: TABLET_FRAME.borderRadius + 4,
          padding: 4,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Screen */}
        <div
          style={{
            width: dimensions.width,
            height: dimensions.height,
            borderRadius: TABLET_FRAME.borderRadius,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* iPadOS Status Bar */}
          <TabletStatusBar />
          
          {/* Content */}
          <div style={{ 
            position: 'absolute',
            top: TABLET_FRAME.statusBarHeight,
            left: 0,
            right: 0,
            bottom: 0,
          }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 12.3 Dev Tools Panel

```typescript
interface TabletDevToolsProps {
  devTools: {
    startDraft: () => void;
    togglePause: () => void;
    forcePick: () => void;
    isPaused: boolean;
    status: string;
  };
  layout: TabletLayoutContextValue;
  onRestart: () => void;
}

function TabletDevTools({ devTools, layout, onRestart }: TabletDevToolsProps) {
  return (
    <div className="w-72 flex-shrink-0 p-4 bg-gray-800 rounded-lg">
      <h2 className="text-white text-lg font-bold mb-4">Tablet Dev Tools</h2>
      
      {/* Draft Controls */}
      <div className="space-y-3 mb-6">
        <button onClick={devTools.startDraft}>Start Draft</button>
        <button onClick={devTools.togglePause}>
          {devTools.isPaused ? 'Resume' : 'Pause'}
        </button>
        <button onClick={devTools.forcePick}>Force Pick</button>
        <button onClick={onRestart}>Restart</button>
      </div>
      
      {/* Layout Controls */}
      <div className="space-y-3">
        <h3 className="text-white text-sm font-medium">Panel Layout</h3>
        <button onClick={() => layout.togglePanel('left')}>
          Toggle Left Panel
        </button>
        <button onClick={() => layout.togglePanel('right')}>
          Toggle Right Panel
        </button>
        <button onClick={layout.resetLayout}>
          Reset Layout
        </button>
        
        {/* Panel Width Sliders */}
        <div>
          <label className="text-gray-400 text-xs">Left: {layout.dimensions.left}px</label>
          <input
            type="range"
            min={TABLET_PANELS.left.minWidth}
            max={TABLET_PANELS.left.maxWidth}
            value={layout.dimensions.left}
            onChange={(e) => layout.setLeftWidth(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-gray-400 text-xs">Right: {layout.dimensions.right}px</label>
          <input
            type="range"
            min={TABLET_PANELS.right.minWidth}
            max={TABLET_PANELS.right.maxWidth}
            value={layout.dimensions.right}
            onChange={(e) => layout.setRightWidth(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## 13. Performance Considerations

### 13.1 Rendering Optimizations

| Technique | Implementation |
|-----------|----------------|
| **Virtualized Lists** | Use `react-window` for player lists (400+ players) |
| **Memoization** | `React.memo` on panel components |
| **Debounced Resize** | Panel resize operations debounced to 60fps |
| **Lazy Loading** | Defer non-critical panel content |

### 13.2 Bundle Size

| Concern | Mitigation |
|---------|------------|
| **Tablet-only code** | Dynamic imports for tablet components |
| **Shared with mobile** | Reuse VX2 hooks (useDraftRoom, etc.) |
| **Device detection** | Lightweight hook, no external deps |

### 13.3 Memory Management

```typescript
// Panel scroll position preservation (like mobile VX2)
const scrollPositions = useRef<Record<PanelId, number>>({
  left: 0,
  center: 0,
  right: 0,
});

// Clean up on unmount
useEffect(() => {
  return () => {
    scrollPositions.current = { left: 0, center: 0, right: 0 };
  };
}, []);
```

---

## 14. Accessibility Requirements

### 14.1 WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-------------|----------------|
| **Keyboard Navigation** | Full keyboard support, focus trapping in panels |
| **ARIA Labels** | All interactive elements labeled |
| **Color Contrast** | 4.5:1 minimum for text |
| **Touch Targets** | 40px minimum (tablet allowance) |
| **Focus Indicators** | Visible focus rings on all elements |

### 14.2 Pointer Support

iPads support trackpad and mouse:

```typescript
// Detect pointer capability
const hasPointer = window.matchMedia('(pointer: fine)').matches;

// Adjust hover states
const hoverStyles = hasPointer ? {
  ':hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
} : {};
```

### 14.3 Reduced Motion

```typescript
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

const animationDuration = prefersReducedMotion ? 0 : 200;
```

---

## 15. Implementation Phases

### Phase 1: Core Infrastructure (1-2 days)
- [ ] Create `core/constants/tablet.ts`
- [ ] Create `core/types/tablet.ts`
- [ ] Create `core/context/TabletLayoutContext.tsx`
- [ ] Create `useTabletOrientation` hook
- [ ] Create `useIsTablet` hook
- [ ] Create `OrientationGuard` component
- [ ] Create `PortraitBlocker` component

### Phase 2: Shell & Navigation (1 day)
- [ ] Create `TabletShellVX2` component
- [ ] Create `TabletFrame` for desktop preview
- [ ] Create `TabletStatusBar` component
- [ ] Create `TabletNavigationVX2` component
- [ ] Add CSS orientation and safe area styles

### Phase 3: Panel System (1-2 days)
- [ ] Create `PanelContainer` component
- [ ] Create `PanelDivider` component
- [ ] Implement panel resize logic
- [ ] Add panel collapse/expand animations
- [ ] Persist panel layout to localStorage

### Phase 4: Draft Room Tablet (2-3 days)
- [ ] Create `TabletDraftRoomVX2` main component
- [ ] Create `LeftPanel` (player list adaptation)
- [ ] Create `CenterPanel` (picks bar + board)
- [ ] Create `RightPanel` (queue + roster split)
- [ ] Create `TabletPlayerCard` (wider format)
- [ ] Wire up `useDraftRoom` hook
- [ ] Add tablet-specific expanded card

### Phase 5: Lobby & Tabs (2 days)
- [ ] Create `TabletLobbyVX2` (grid layout)
- [ ] Create `TabletLiveDraftsVX2`
- [ ] Create `TabletMyTeamsVX2`
- [ ] Create `TabletExposureVX2`
- [ ] Create `TabletProfileVX2`

### Phase 6: Testing & Polish (1-2 days)
- [ ] Create `/testing-grounds/vx2-tablet-draft-room`
- [ ] Create `/testing-grounds/vx2-tablet-app-demo`
- [ ] Add dev tools panel
- [ ] Test on all iPad models (simulator)
- [ ] Test on physical iPad device
- [ ] Fix orientation edge cases
- [ ] Performance optimization pass

### Total Estimated Time: 8-12 days

---

## 16. Risk Assessment

### 16.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Orientation detection fails** | Low | High | Multiple detection methods, CSS fallback |
| **Panel resize performance** | Medium | Medium | Debounce, CSS transforms |
| **iPad model detection wrong** | Medium | Low | Graceful degradation to "unknown iPad" |
| **Safe area calculation issues** | Low | Medium | Extensive device testing |
| **Memory issues with large drafts** | Medium | High | Virtualized lists, memoization |

### 16.2 User Experience Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Portrait mode frustration** | Medium | Low | Clear, friendly rotation prompt |
| **Accidental panel collapse** | Low | Low | Confirmation or easy restore |
| **Touch vs pointer confusion** | Low | Low | Consistent interaction patterns |

---

## 17. Success Metrics

### 17.1 Technical Metrics

| Metric | Target |
|--------|--------|
| **First Contentful Paint** | < 1.5s |
| **Time to Interactive** | < 3s |
| **Panel Resize FPS** | 60fps |
| **Bundle Size Increase** | < 50KB (tablet-specific) |
| **TypeScript Coverage** | 100% |

### 17.2 User Experience Metrics

| Metric | Target |
|--------|--------|
| **Draft Completion Rate** | ≥ Mobile VX2 |
| **Picks Per Minute** | > Mobile VX2 (due to multi-panel) |
| **Orientation Block Rate** | < 5% of sessions |
| **Panel Customization Usage** | Track for future optimization |

---

## Appendices

### Appendix A: File Checklist

```
NEW FILES TO CREATE:
□ components/vx2/core/constants/tablet.ts
□ components/vx2/core/types/tablet.ts
□ components/vx2/core/context/TabletLayoutContext.tsx
□ components/vx2/hooks/ui/useTabletOrientation.ts
□ components/vx2/hooks/ui/useIsTablet.ts
□ components/vx2/hooks/ui/useTabletLayout.ts
□ components/vx2/tablet/shell/TabletShellVX2.tsx
□ components/vx2/tablet/shell/TabletHeaderVX2.tsx
□ components/vx2/tablet/shell/TabletStatusBar.tsx
□ components/vx2/tablet/shell/TabletFrame.tsx
□ components/vx2/tablet/shell/TabletNavigationVX2.tsx
□ components/vx2/tablet/orientation/OrientationGuard.tsx
□ components/vx2/tablet/orientation/PortraitBlocker.tsx
□ components/vx2/tablet/panels/PanelContainer.tsx
□ components/vx2/tablet/panels/PanelDivider.tsx
□ components/vx2/tablet/draft-room/TabletDraftRoomVX2.tsx
□ components/vx2/tablet/draft-room/LeftPanel/*.tsx
□ components/vx2/tablet/draft-room/CenterPanel/*.tsx
□ components/vx2/tablet/draft-room/RightPanel/*.tsx
□ components/vx2/tablet/tabs/TabletLobbyVX2.tsx
□ components/vx2/tablet/tabs/TabletLiveDraftsVX2.tsx
□ components/vx2/tablet/tabs/TabletMyTeamsVX2.tsx
□ components/vx2/tablet/tabs/TabletExposureVX2.tsx
□ components/vx2/tablet/tabs/TabletProfileVX2.tsx
□ pages/testing-grounds/vx2-tablet-draft-room.js
□ pages/testing-grounds/vx2-tablet-app-demo.js

FILES TO MODIFY:
□ components/vx2/core/constants/index.ts (add tablet exports)
□ components/vx2/core/types/index.ts (add tablet exports)
□ components/vx2/hooks/ui/index.ts (add tablet hooks)
□ components/vx2/index.ts (add tablet barrel exports)
□ styles/globals.css (add tablet orientation/safe area styles)
□ public/manifest.json (add orientation preference)
```

### Appendix B: Reference Resources

- [Apple Human Interface Guidelines - iPad](https://developer.apple.com/design/human-interface-guidelines/ipad)
- [iPad Screen Specifications](https://www.screensizes.app/?compare=ipad)
- [Safe Area Insets Guide](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
- [Screen Orientation API](https://developer.mozilla.org/en-US/docs/Web/API/Screen/orientation)
- [VX2 Migration Status](../VX2_MIGRATION_STATUS.md)

### Appendix C: User Preferences Applied

Per the memory system:

- [[memory:8869171]] - No emojis in UI
- [[memory:9102895]] - No visible scrollbars (except modals)
- [[memory:4753963]] - Position colors: QB=#F472B6, RB=#0fba80, WR=#FBBF25, TE=#7C3AED
- [[memory:6268949]] - "Whale" user focus, data granularity over analysis
- [[memory:5050077]] - Dev tools in visible place
- [[memory:7586685]] - Locked gradient/color formatting for roster cells

---

**Document Status:** Ready for Review  
**Next Steps:** Approval and Phase 1 Implementation  
**Questions/Concerns:** Contact TopDog Engineering

