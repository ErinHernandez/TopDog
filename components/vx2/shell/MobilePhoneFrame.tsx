/**
 * MobilePhoneFrame - Phone Frame for Desktop Preview
 * 
 * Provides an iPhone-style frame for previewing mobile UI on desktop.
 * Used by AppShellVX2 when showPhoneFrame is true.
 */

import React, { useState, useEffect } from 'react';
import { PHONE_FRAME } from '../core/constants';
import iPhoneStatusBar from './iPhoneStatusBar';

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
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    // Only show status bar on desktop browsers, not on actual mobile devices
    const checkMobile = () => {
      if (typeof window === 'undefined') return;
      
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
      const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
      const isAndroid = /android/i.test(userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone === true;
      
      setIsMobileDevice(isIOS || isIPadOS || isAndroid || isStandalone);
    };

    checkMobile();
  }, []);

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
          {/* Native iPhone Status Bar - only show on desktop browsers */}
          {!isMobileDevice && <iPhoneStatusBar />}
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

