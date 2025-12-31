/**
 * TabletFrame - iPad Preview Frame for Desktop
 * 
 * Shows iPad landscape dimensions with bezel for desktop preview.
 * Similar to MobilePhoneFrame but for tablet dimensions.
 */

import React, { type ReactElement, type ReactNode } from 'react';
import { TABLET_FRAME, TABLET_BREAKPOINTS } from '../../core/constants/tablet';
import TabletStatusBar from './TabletStatusBar';
import type { TabletFrameProps, iPadModel } from '../../core/types/tablet';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get dimensions for a specific iPad model
 */
function getTabletDimensions(model: iPadModel): { width: number; height: number } {
  switch (model) {
    case 'ipad-pro-12.9':
      return { width: TABLET_FRAME.widthXL, height: TABLET_FRAME.heightXL };
    case 'ipad-pro-11':
      return { width: TABLET_FRAME.width, height: TABLET_FRAME.height };
    case 'ipad-air':
      return { width: 1180, height: 820 };
    case 'ipad-mini':
      return { width: TABLET_FRAME.widthMini, height: TABLET_FRAME.heightMini };
    case 'ipad-9th':
    case 'ipad-10th':
      return { width: 1080, height: 810 };
    default:
      return { width: TABLET_FRAME.width, height: TABLET_FRAME.height };
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * TabletFrame - Preview container for desktop testing
 * 
 * Renders an iPad-shaped frame with status bar and content area.
 * Used in testing-grounds pages for development.
 */
export default function TabletFrame({
  children,
  model = 'ipad-pro-11',
  width,
  height,
  className = '',
  showStatusBar = true,
}: TabletFrameProps): ReactElement {
  const dimensions = width && height 
    ? { width, height }
    : getTabletDimensions(model);
  
  return (
    <div 
      className={`bg-gray-900 min-h-screen flex items-center justify-center p-8 ${className}`}
    >
      {/* iPad bezel */}
      <div
        style={{
          width: dimensions.width + (TABLET_FRAME.framePadding * 2),
          height: dimensions.height + (TABLET_FRAME.framePadding * 2),
          backgroundColor: TABLET_FRAME.bezelColor,
          borderRadius: TABLET_FRAME.borderRadius + 4,
          padding: TABLET_FRAME.framePadding,
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
            backgroundColor: '#000000',
          }}
        >
          {/* iPadOS Status Bar */}
          {showStatusBar && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
              }}
            >
              <TabletStatusBar variant="dark" />
            </div>
          )}
          
          {/* Content */}
          <div 
            style={{ 
              position: 'absolute',
              top: showStatusBar ? TABLET_FRAME.statusBarHeight : 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflow: 'hidden',
            }}
          >
            {children}
          </div>
        </div>
      </div>
      
      {/* Model Label */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#6B7280',
          fontSize: 12,
          fontFamily: 'monospace',
        }}
      >
        {model} ({dimensions.width} x {dimensions.height})
      </div>
    </div>
  );
}

