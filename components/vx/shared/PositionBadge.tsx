/**
 * PositionBadge - VX Version (TypeScript)
 * 
 * Migrated from: components/draft/v3/mobile/apple/components/PositionBadge.js
 * 
 * Position indicator badge with LOCKED colors per memory #4753963:
 * - QB: #F472B6 (pink)
 * - RB: #0fba80 (green)
 * - WR: #FBBF25 (yellow/gold)
 * - TE: #7C3AED (purple)
 * 
 * Uses table-cell display for perfect text centering.
 */

import React from 'react';
import { POSITION_COLORS } from '../constants/colors';
import type { RosterPosition } from '../constants/positions';

// ============================================================================
// TYPES
// ============================================================================

export interface PositionBadgeProps {
  /** Position to display (QB, RB, WR, TE, FLEX, BN) */
  position: RosterPosition | string;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** CSS top position (for absolute positioning) */
  top?: string;
  /** CSS left position (for absolute positioning) */
  left?: string;
  /** Badge width */
  width?: string;
  /** Badge height */
  height?: string;
  /** Size variant (overrides width/height) */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// ============================================================================
// SIZE PRESETS
// ============================================================================

const SIZE_PRESETS = {
  sm: { width: '24px', height: '15px', fontSize: '11px' },
  md: { width: '30px', height: '19px', fontSize: '13px' },
  lg: { width: '44px', height: '28px', fontSize: '15px' },
  xl: { width: '56px', height: '36px', fontSize: '18px' },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get position background color
 * Colors are LOCKED - do not modify without explicit approval
 */
function getPositionColor(position: string): string {
  const colors: Record<string, string> = {
    'QB': POSITION_COLORS.QB,
    'RB': POSITION_COLORS.RB,
    'WR': POSITION_COLORS.WR,
    'TE': POSITION_COLORS.TE,
    'FLEX': '#9CA3AF', // Gray (visual uses gradient)
    'BN': POSITION_COLORS.BN,
  };
  return colors[position] || POSITION_COLORS.BN;
}

/**
 * Calculate font size based on badge dimensions
 */
function calculateFontSize(width: string, height: string): string {
  const widthNum = parseInt(width);
  const heightNum = parseInt(height);
  
  if (widthNum >= 48 && heightNum >= 30) return '15px';
  if (widthNum >= 30 && heightNum >= 19) return '15px';
  return '11px';
}

// ============================================================================
// FLEX BADGE COMPONENT (Special three-layer gradient)
// ============================================================================

interface FlexBadgeProps {
  width: string;
  height: string;
  fontSize: string;
  top: string;
  left: string;
  style?: React.CSSProperties;
}

function FlexBadge({ width, height, fontSize, top, left, style }: FlexBadgeProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        width,
        height,
        borderRadius: '2px',
        overflow: 'hidden',
        display: 'table-cell',
        verticalAlign: 'middle',
        textAlign: 'center',
        color: 'black',
        fontSize,
        fontWeight: 700,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        lineHeight: height,
        margin: 0,
        padding: 0,
        border: 'none',
        ...style,
      }}
    >
      {/* Three-layer gradient background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ flex: 1, backgroundColor: POSITION_COLORS.RB }} /> {/* Green */}
        <div style={{ flex: 1, backgroundColor: POSITION_COLORS.WR }} /> {/* Yellow */}
        <div style={{ flex: 1, backgroundColor: POSITION_COLORS.TE }} /> {/* Purple */}
      </div>
      
      {/* Text overlay */}
      <span style={{ position: 'relative', zIndex: 1 }}>FLEX</span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PositionBadge({
  position,
  style = {},
  top = '0px',
  left = '0px',
  width: propWidth,
  height: propHeight,
  size,
}: PositionBadgeProps): React.ReactElement {
  // Determine dimensions
  const preset = size ? SIZE_PRESETS[size] : null;
  const width = preset?.width || propWidth || '24px';
  const height = preset?.height || propHeight || '15px';
  const fontSize = preset?.fontSize || calculateFontSize(width, height);

  // Special handling for FLEX position
  if (position === 'FLEX') {
    return (
      <FlexBadge
        width={width}
        height={height}
        fontSize={fontSize}
        top={top}
        left={left}
        style={style}
      />
    );
  }

  // Regular position badges
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        width,
        height,
        backgroundColor: getPositionColor(position),
        borderRadius: '2px',
        display: 'table-cell',
        verticalAlign: 'middle',
        textAlign: 'center',
        color: 'black',
        fontSize,
        fontWeight: 700,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        lineHeight: height,
        // Position-specific text adjustments
        textIndent: position === 'RB' ? '0.25px' : '0',
        margin: 0,
        padding: 0,
        border: 'none',
        ...style,
      }}
    >
      {position}
    </div>
  );
}

// ============================================================================
// INLINE VARIANT (no absolute positioning)
// ============================================================================

export interface PositionBadgeInlineProps {
  position: RosterPosition | string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  style?: React.CSSProperties;
}

export function PositionBadgeInline({
  position,
  size = 'sm',
  className = '',
  style = {},
}: PositionBadgeInlineProps): React.ReactElement {
  const preset = SIZE_PRESETS[size];

  // FLEX special handling
  if (position === 'FLEX') {
    return (
      <div
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: preset.width,
          height: preset.height,
          borderRadius: '2px',
          overflow: 'hidden',
          position: 'relative',
          ...style,
        }}
      >
        {/* Three-layer gradient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1, backgroundColor: POSITION_COLORS.RB }} />
          <div style={{ flex: 1, backgroundColor: POSITION_COLORS.WR }} />
          <div style={{ flex: 1, backgroundColor: POSITION_COLORS.TE }} />
        </div>
        <span
          style={{
            position: 'relative',
            zIndex: 1,
            color: 'black',
            fontSize: preset.fontSize,
            fontWeight: 700,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          FLEX
        </span>
      </div>
    );
  }

  // Regular badges
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: preset.width,
        height: preset.height,
        backgroundColor: getPositionColor(position),
        borderRadius: '2px',
        color: 'black',
        fontSize: preset.fontSize,
        fontWeight: 700,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textIndent: position === 'RB' ? '0.25px' : '0',
        ...style,
      }}
    >
      {position}
    </div>
  );
}

