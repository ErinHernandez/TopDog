/**
 * TabletStatusBar - iPadOS Status Bar
 * 
 * Simulates the iPadOS status bar for desktop preview.
 * Shows time, battery, wifi indicators in landscape mode.
 */

import React, { useState, useEffect, type ReactElement } from 'react';
import { TEXT_COLORS } from '../../core/constants/colors';
import { TABLET_FRAME } from '../../core/constants/tablet';
import { TILED_BG_STYLE } from '../../draft-room/constants';

// ============================================================================
// TYPES
// ============================================================================

export interface TabletStatusBarProps {
  /** Background style */
  variant?: 'light' | 'dark' | 'transparent';
  /** Whether to show cellular signal */
  showCellular?: boolean;
  /** Custom time override (for screenshots) */
  customTime?: string;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function WifiIcon(): ReactElement {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
      <path d="M8 9.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
      <path d="M8 6.5c-1.657 0-3.156.672-4.243 1.757a.75.75 0 1 0 1.06 1.061A4.5 4.5 0 0 1 8 8a4.5 4.5 0 0 1 3.182 1.318.75.75 0 1 0 1.061-1.06A6 6 0 0 0 8 6.5z" />
      <path d="M8 3c-2.485 0-4.735 1.007-6.364 2.636a.75.75 0 0 0 1.06 1.06A7.5 7.5 0 0 1 8 4.5a7.5 7.5 0 0 1 5.303 2.197.75.75 0 1 0 1.061-1.06A9 9 0 0 0 8 3z" />
    </svg>
  );
}

function BatteryIcon({ level = 85 }: { level?: number }): ReactElement {
  const fillWidth = Math.max(0, Math.min(100, level)) * 0.18;
  
  return (
    <svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor">
      {/* Battery body */}
      <rect x="0" y="0" width="22" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1" />
      {/* Battery tip */}
      <rect x="23" y="3" width="2" height="6" rx="1" fill="currentColor" opacity="0.5" />
      {/* Battery level */}
      <rect x="2" y="2" width={fillWidth} height="8" rx="1" fill="currentColor" />
    </svg>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TabletStatusBar({
  variant = 'dark',
  showCellular = false,
  customTime,
}: TabletStatusBarProps): ReactElement {
  const [time, setTime] = useState(customTime || '');
  
  // Update time every minute
  useEffect(() => {
    if (customTime) {
      setTime(customTime);
      return;
    }
    
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      setTime(`${displayHours}:${minutes} ${ampm}`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    
    return () => clearInterval(interval);
  }, [customTime]);
  
  const textColor = variant === 'light' ? '#000000' : TEXT_COLORS.primary;
  
  // Background style based on variant
  const getBackgroundStyle = (): React.CSSProperties => {
    if (variant === 'transparent') {
      return { backgroundColor: 'transparent' };
    }
    if (variant === 'light') {
      return { backgroundColor: 'rgba(255,255,255,0.1)' };
    }
    // Dark variant uses tiled background to match navbar
    return {
      ...TILED_BG_STYLE,
      backgroundSize: '50px 50px',
    };
  };
  
  return (
    <div
      style={{
        height: TABLET_FRAME.statusBarHeight,
        ...getBackgroundStyle(),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 24,
        paddingRight: 24,
        color: textColor,
        fontSize: 13,
        fontWeight: 500,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
      }}
    >
      {/* Left - Time (in landscape, time is on left for iPadOS) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ letterSpacing: '0.02em' }}>{time}</span>
      </div>
      
      {/* Center - Empty on iPad landscape */}
      <div />
      
      {/* Right - Status Icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {showCellular && (
          <span style={{ fontSize: 12 }}>5G</span>
        )}
        <WifiIcon />
        <BatteryIcon level={85} />
      </div>
    </div>
  );
}

