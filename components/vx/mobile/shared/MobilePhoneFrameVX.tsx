/**
 * MobilePhoneFrameVX - iPhone-style phone frame wrapper (TypeScript)
 * 
 * Migrated from: components/mobile/shared/MobilePhoneFrame.js
 * 
 * Provides consistent mobile phone preview styling across all mobile pages.
 * Use this to wrap mobile page content for desktop preview.
 */

import React, { useState, useEffect } from 'react';
import iPhoneStatusBar from '../../vx2/shell/iPhoneStatusBar';

// ============================================================================
// TYPES
// ============================================================================

export interface MobilePhoneFrameVXProps {
  children: React.ReactNode;
  width?: string;
  height?: string;
  className?: string;
}

export interface MobilePhoneContentVXProps {
  children: React.ReactNode;
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MobilePhoneFrameVX({ 
  children, 
  width = '375px', 
  height = '812px',
  className = ''
}: MobilePhoneFrameVXProps): React.ReactElement {
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
    <div className={`bg-gray-100 min-h-screen flex items-center justify-center p-4 ${className}`}>
      <div 
        className="bg-black rounded-3xl p-1"
        style={{ 
          width,
          height,
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}
      >
        <div 
          className="bg-black rounded-3xl overflow-hidden relative"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Native iPhone Status Bar - only show on desktop browsers */}
          {!isMobileDevice && <iPhoneStatusBar />}
          {children}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * MobilePhoneContentVX - Inner content wrapper with standard TopDog styling
 * 
 * Use inside MobilePhoneFrameVX for consistent app background and layout.
 */
export function MobilePhoneContentVX({ 
  children, 
  className = '' 
}: MobilePhoneContentVXProps): React.ReactElement {
  return (
    <div className={`h-full bg-[#101927] text-white flex flex-col relative ${className}`}>
      {children}
    </div>
  );
}

