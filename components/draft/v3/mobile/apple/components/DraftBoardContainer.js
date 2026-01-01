/**
 * Draft Board Container - Comprehensive Height Management
 * 
 * Handles pixel-perfect height calculations for all usage contexts:
 * - Inside DraftRoomApple (with navbar, footer, picks bar)
 * - Standalone usage
 * - Different tab contexts
 * - Various device safe areas
 */

import React, { useState, useRef, useEffect } from 'react';
import { MOBILE_SIZES, PLATFORM_SPECIFIC } from '../../shared/constants/mobileSizes';
import DraftBoardApple from './DraftBoardApple';

export default function DraftBoardContainer({ 
  picks = [], 
  participants = [], 
  currentPickNumber = 1,
  isDraftActive = false,
  timer = 120,
  activeTab = 'Board',
  // Context detection props
  hasNavbar = true,
  hasFooter = true,
  hasPicksBar = false,
  isStandalone = false,
  customHeightOffset = 0
}) {

  // Precise measurements based on actual component analysis
  const MEASUREMENTS = {
    // Navbar: approximated at 64px
    NAVBAR_HEIGHT: 64,
    NAVBAR_PADDING_TOP: 'env(safe-area-inset-top)',
    
    // Footer: approx 60px including safe area and padding
    FOOTER_BASE_HEIGHT: 60,
    FOOTER_PADDING_TOP: 0,
    FOOTER_PADDING_BOTTOM: 0,
    FOOTER_SAFE_AREA: 'env(safe-area-inset-bottom)',
    FOOTER_BOTTOM_OFFSET: 0,
    
    // Picks Bar metrics (when visible in other tabs)
    PICKS_BAR_HEIGHT: 135,
    PICKS_BAR_MARGIN: 8,
    
    // Misc
    BORDER_WIDTHS: 1,
    CONTENT_PADDING: 0,
    IOS_NOTCH_COMPENSATION: 0,
    // Slight negative buffer to eliminate trailing whitespace at bottom
    SCROLL_BUFFER: -8
  };

  /**
   * Calculate precise available height based on context
   */
  const calculateAvailableHeight = () => {
    const navbarOffset = hasNavbar ? MEASUREMENTS.NAVBAR_HEIGHT : 0;
    const footerOffset = hasFooter ? MEASUREMENTS.FOOTER_BASE_HEIGHT : 0;
    const picksBarOffset = (hasPicksBar && activeTab !== 'Board') ? (MEASUREMENTS.PICKS_BAR_HEIGHT + MEASUREMENTS.PICKS_BAR_MARGIN) : 0;
    const totalOffset = navbarOffset + footerOffset + picksBarOffset + MEASUREMENTS.BORDER_WIDTHS + MEASUREMENTS.CONTENT_PADDING + customHeightOffset + MEASUREMENTS.SCROLL_BUFFER;
    // Use parent container height (phone frame) rather than viewport to avoid clipping
    return `calc(100% - ${totalOffset}px)`;
  };

  /**
   * Get container styles based on usage context
   */
  const getContainerStyles = () => {
    if (isStandalone) {
      // Standalone usage - fill available space
      return {
        height: '100%',
        width: '100%',
        position: 'relative'
      };
    }
    
    // Integrated usage - calculate precise height
    return {
      height: calculateAvailableHeight(),
      width: '100%',
      position: 'relative',
      backgroundColor: 'transparent'
    };
  };

  /**
   * Debug information (development only)
   */
  const getDebugInfo = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return {
      context: {
        hasNavbar,
        hasFooter,
        hasPicksBar: hasPicksBar && activeTab !== 'Board',
        isStandalone,
        activeTab
      },
      calculations: {
        totalOffset: hasNavbar ? MEASUREMENTS.NAVBAR_HEIGHT : 0 +
                    hasFooter ? (MEASUREMENTS.FOOTER_BASE_HEIGHT + MEASUREMENTS.FOOTER_PADDING_TOP + MEASUREMENTS.FOOTER_PADDING_BOTTOM + MEASUREMENTS.BORDER_WIDTHS) : 0 +
                    (hasPicksBar && activeTab !== 'Board') ? (MEASUREMENTS.PICKS_BAR_HEIGHT + MEASUREMENTS.PICKS_BAR_MARGIN) : 0 +
                    customHeightOffset + MEASUREMENTS.SCROLL_BUFFER,
        calculatedHeight: calculateAvailableHeight()
      }
    };
  };

  // Log debug info in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('DraftBoardContainer Debug:', getDebugInfo());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- getDebugInfo is stable
  }, [hasNavbar, hasFooter, hasPicksBar, activeTab, customHeightOffset]);

  return (
    <div 
      className="draft-board-container"
      style={getContainerStyles()}
    >
      <DraftBoardApple
        picks={picks}
        participants={participants}
        currentPickNumber={currentPickNumber}
        isDraftActive={isDraftActive}
        timer={timer}
        activeTab={activeTab}
      />
    </div>
  );
}

/**
 * Preset configurations for common usage scenarios
 */
export const DraftBoardPresets = {
  // Full draft room context (default)
  DRAFT_ROOM: {
    hasNavbar: true,
    hasFooter: true,
    hasPicksBar: true,
    isStandalone: false
  },
  
  // Modal or popup usage
  MODAL: {
    hasNavbar: false,
    hasFooter: false,
    hasPicksBar: false,
    isStandalone: true
  },
  
  // Embedded in other components
  EMBEDDED: {
    hasNavbar: false,
    hasFooter: false,
    hasPicksBar: false,
    isStandalone: false,
    customHeightOffset: 20 // Account for parent padding
  },
  
  // Mobile page without picks bar
  MOBILE_SIMPLE: {
    hasNavbar: true,
    hasFooter: true,
    hasPicksBar: false,
    isStandalone: false
  }
};

/**
 * Helper component with preset configurations
 */
export function DraftBoardWithPreset({ preset = 'DRAFT_ROOM', ...props }) {
  const presetConfig = DraftBoardPresets[preset] || DraftBoardPresets.DRAFT_ROOM;
  
  return (
    <DraftBoardContainer
      {...presetConfig}
      {...props}
    />
  );
}
