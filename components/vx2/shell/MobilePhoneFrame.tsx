/**
 * MobilePhoneFrame - Phone Frame for Desktop Preview
 * 
 * Provides an iPhone-style frame for previewing mobile UI on desktop.
 * Used by AppShellVX2 when showPhoneFrame is true.
 */

import React from 'react';
import { PHONE_FRAME } from '../core/constants';

// ============================================================================
// TYPES
// ============================================================================

export interface MobilePhoneFrameProps {
  /** Content to render inside the phone */
  children: React.ReactNode;
  /** Override width */
  width?: number;
  /** Override height */
  height?: number;
  /** Additional className for outer container */
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MobilePhoneFrame({
  children,
  width = PHONE_FRAME.width,
  height = PHONE_FRAME.height,
  className = '',
}: MobilePhoneFrameProps): React.ReactElement {
  return (
    <div 
      className={`bg-gray-900 min-h-screen flex items-center justify-center p-4 ${className}`}
    >
      {/* Phone bezel */}
      <div 
        className="rounded-3xl p-1 relative"
        style={{ 
          width: `${width + (PHONE_FRAME.framePadding * 2)}px`,
          height: `${height + (PHONE_FRAME.framePadding * 2)}px`,
          backgroundColor: PHONE_FRAME.bezelColor,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Screen area */}
        <div 
          className="overflow-hidden relative"
          style={{ 
            width: `${width}px`,
            height: `${height}px`,
            borderRadius: `${PHONE_FRAME.borderRadius}px`,
          }}
        >
          {children}
        </div>
        
        {/* Notch (cosmetic) */}
        <div
          className="absolute top-1 left-1/2 transform -translate-x-1/2"
          style={{
            width: '120px',
            height: '28px',
            backgroundColor: PHONE_FRAME.bezelColor,
            borderBottomLeftRadius: '14px',
            borderBottomRightRadius: '14px',
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

