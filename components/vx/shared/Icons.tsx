/**
 * VX Icon Library
 * 
 * Standardized SVG icons for the VX component library.
 * All icons are 24x24 by default and use currentColor.
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface IconProps {
  /** Icon size in pixels */
  size?: number | string;
  /** Icon color (uses currentColor by default) */
  color?: string;
  /** Custom className */
  className?: string;
  /** Stroke width for outline icons */
  strokeWidth?: number;
}

// ============================================================================
// BASE ICON WRAPPER
// ============================================================================

function createIcon(
  path: React.ReactNode,
  displayName: string,
  defaultStrokeWidth = 2
): React.FC<IconProps> {
  const Icon: React.FC<IconProps> = ({
    size = 24,
    color = 'currentColor',
    className = '',
    strokeWidth = defaultStrokeWidth,
  }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {path}
    </svg>
  );
  Icon.displayName = displayName;
  return Icon;
}

function createFilledIcon(
  path: React.ReactNode,
  displayName: string
): React.FC<IconProps> {
  const Icon: React.FC<IconProps> = ({
    size = 24,
    color = 'currentColor',
    className = '',
  }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={className}
    >
      {path}
    </svg>
  );
  Icon.displayName = displayName;
  return Icon;
}

// ============================================================================
// NAVIGATION ICONS
// ============================================================================

export const ChevronLeft = createIcon(
  <path d="M15 18l-6-6 6-6" />,
  'ChevronLeft'
);

export const ChevronRight = createIcon(
  <path d="M9 18l6-6-6-6" />,
  'ChevronRight'
);

export const ChevronUp = createIcon(
  <path d="M18 15l-6-6-6 6" />,
  'ChevronUp'
);

export const ChevronDown = createIcon(
  <path d="M6 9l6 6 6-6" />,
  'ChevronDown'
);

export const ArrowLeft = createIcon(
  <><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></>,
  'ArrowLeft'
);

export const ArrowRight = createIcon(
  <><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></>,
  'ArrowRight'
);

export const ArrowUp = createIcon(
  <><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></>,
  'ArrowUp'
);

export const ArrowDown = createIcon(
  <><path d="M12 5v14" /><path d="M19 12l-7 7-7-7" /></>,
  'ArrowDown'
);

// ============================================================================
// ACTION ICONS
// ============================================================================

export const Plus = createIcon(
  <path d="M12 5v14M5 12h14" />,
  'Plus'
);

export const Minus = createIcon(
  <path d="M5 12h14" />,
  'Minus'
);

export const X = createIcon(
  <path d="M18 6L6 18M6 6l12 12" />,
  'X'
);

export const Check = createIcon(
  <path d="M20 6L9 17l-5-5" />,
  'Check'
);

export const Edit = createIcon(
  <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
  'Edit'
);

export const Trash = createIcon(
  <><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  'Trash'
);

export const Copy = createIcon(
  <><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
  'Copy'
);

export const Share = createIcon(
  <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" /></>,
  'Share'
);

export const Download = createIcon(
  <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></>,
  'Download'
);

export const Upload = createIcon(
  <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></>,
  'Upload'
);

// ============================================================================
// UI ICONS
// ============================================================================

export const Search = createIcon(
  <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>,
  'Search'
);

export const Filter = createIcon(
  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />,
  'Filter'
);

export const Sort = createIcon(
  <><path d="M11 5h10" /><path d="M11 9h7" /><path d="M11 13h4" /><path d="M3 17l3 3 3-3" /><path d="M6 18V4" /></>,
  'Sort'
);

export const Menu = createIcon(
  <><path d="M3 12h18" /><path d="M3 6h18" /><path d="M3 18h18" /></>,
  'Menu'
);

export const MoreHorizontal = createIcon(
  <><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></>,
  'MoreHorizontal'
);

export const MoreVertical = createIcon(
  <><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></>,
  'MoreVertical'
);

export const Settings = createIcon(
  <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
  'Settings'
);

export const Refresh = createIcon(
  <><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></>,
  'Refresh'
);

// ============================================================================
// STATUS ICONS
// ============================================================================

export const Info = createIcon(
  <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>,
  'Info'
);

export const AlertCircle = createIcon(
  <><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></>,
  'AlertCircle'
);

export const AlertTriangle = createIcon(
  <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
  'AlertTriangle'
);

export const CheckCircle = createIcon(
  <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></>,
  'CheckCircle'
);

export const XCircle = createIcon(
  <><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6" /><path d="M9 9l6 6" /></>,
  'XCircle'
);

// ============================================================================
// USER ICONS
// ============================================================================

export const User = createIcon(
  <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  'User'
);

export const Users = createIcon(
  <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  'Users'
);

// ============================================================================
// MEDIA ICONS
// ============================================================================

export const Play = createFilledIcon(
  <path d="M8 5v14l11-7z" />,
  'Play'
);

export const Pause = createFilledIcon(
  <><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></>,
  'Pause'
);

// ============================================================================
// DRAFT-SPECIFIC ICONS
// ============================================================================

export const Clock = createIcon(
  <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  'Clock'
);

export const Trophy = createIcon(
  <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></>,
  'Trophy'
);

export const Target = createIcon(
  <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  'Target'
);

export const TrendingUp = createIcon(
  <><path d="M23 6l-9.5 9.5-5-5L1 18" /><path d="M17 6h6v6" /></>,
  'TrendingUp'
);

export const TrendingDown = createIcon(
  <><path d="M23 18l-9.5-9.5-5 5L1 6" /><path d="M17 18h6v-6" /></>,
  'TrendingDown'
);

export const BarChart = createIcon(
  <><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></>,
  'BarChart'
);

export const Grid = createFilledIcon(
  <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>,
  'Grid'
);

export const List = createIcon(
  <><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></>,
  'List'
);

export const Star = createIcon(
  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  'Star'
);

export const StarFilled = createFilledIcon(
  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  'StarFilled'
);

export const Heart = createIcon(
  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
  'Heart'
);

export const Eye = createIcon(
  <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
  'Eye'
);

export const EyeOff = createIcon(
  <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><path d="M1 1l22 22" /></>,
  'EyeOff'
);

// ============================================================================
// EXPORTS
// ============================================================================

export const Icons = {
  // Navigation
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  // Actions
  Plus,
  Minus,
  X,
  Check,
  Edit,
  Trash,
  Copy,
  Share,
  Download,
  Upload,
  // UI
  Search,
  Filter,
  Sort,
  Menu,
  MoreHorizontal,
  MoreVertical,
  Settings,
  Refresh,
  // Status
  Info,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  // User
  User,
  Users,
  // Media
  Play,
  Pause,
  // Draft
  Clock,
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart,
  Grid,
  List,
  Star,
  StarFilled,
  Heart,
  Eye,
  EyeOff,
};

export default Icons;

