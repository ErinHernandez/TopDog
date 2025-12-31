/**
 * PanelContainer - Resizable Panel Wrapper
 * 
 * Container for individual panels in the three-panel layout.
 * Supports fixed width, minimum width, and flex sizing.
 */

import React, { type ReactElement, type ReactNode, type CSSProperties } from 'react';
import { BG_COLORS, BORDER_COLORS } from '../../core/constants/colors';
import { TABLET_PANELS, TABLET_ANIMATIONS, TABLET_SPACING } from '../../core/constants/tablet';
import type { PanelContainerProps, PanelId } from '../../core/types/tablet';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get default width for a panel
 */
function getDefaultWidth(panelId: PanelId): number {
  switch (panelId) {
    case 'left':
      return TABLET_PANELS.left.defaultWidth;
    case 'right':
      return TABLET_PANELS.right.defaultWidth;
    case 'center':
      return 0; // Center panel flexes
    default:
      return 0;
  }
}

// ============================================================================
// PANEL HEADER COMPONENT
// ============================================================================

interface PanelHeaderProps {
  children: ReactNode;
  onCollapse?: () => void;
  collapsible?: boolean;
}

function PanelHeader({ 
  children, 
  onCollapse, 
  collapsible = false 
}: PanelHeaderProps): ReactElement {
  return (
    <div
      style={{
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: TABLET_SPACING.md,
        paddingRight: TABLET_SPACING.sm,
        borderBottom: `1px solid ${BORDER_COLORS.default}`,
        flexShrink: 0,
      }}
    >
      <div style={{ flex: 1 }}>{children}</div>
      
      {collapsible && onCollapse && (
        <button
          onClick={onCollapse}
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            borderRadius: 6,
            color: '#9CA3AF',
          }}
          aria-label="Collapse panel"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * PanelContainer - Wrapper for draft room panels
 * 
 * Provides consistent styling and optional header for panels.
 */
export default function PanelContainer({
  panelId,
  children,
  width,
  className = '',
  collapsible = false,
  header,
}: PanelContainerProps): ReactElement {
  const isCenter = panelId === 'center';
  const panelWidth = width ?? getDefaultWidth(panelId);
  
  // Center panel uses flex, others use fixed width
  const widthStyle: CSSProperties = isCenter
    ? { flex: 1, minWidth: TABLET_PANELS.center.minWidth }
    : { width: panelWidth, flexShrink: 0 };
  
  return (
    <div
      className={className}
      style={{
        ...widthStyle,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: BG_COLORS.primary,
        overflow: 'hidden',
        transition: `width ${TABLET_ANIMATIONS.panelTransition}ms ease-out`,
      }}
      data-panel-id={panelId}
    >
      {/* Optional Header */}
      {header && (
        <PanelHeader collapsible={collapsible}>
          {header}
        </PanelHeader>
      )}
      
      {/* Panel Content */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Also export header for custom use
export { PanelHeader };

