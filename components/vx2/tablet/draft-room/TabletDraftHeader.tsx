/**
 * TabletDraftHeader - Draft Room Header for Tablet
 * 
 * Unified header combining iPad status bar and draft controls.
 * Includes time, wifi, battery indicators plus draft status, timer, and leave button.
 * Optimized for horizontal tablet layout.
 */

import React, { useState, useEffect, type ReactElement } from 'react';
import { TEXT_COLORS, STATE_COLORS, BRAND_COLORS } from '../../core/constants/colors';
import { TABLET_HEADER, TABLET_SAFE_AREA, TABLET_Z_INDEX, TABLET_FRAME } from '../../core/constants/tablet';
import { TILED_BG_STYLE } from '../../draft-room/constants';

// ============================================================================
// STATUS BAR ICONS
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
      <rect x="0" y="0" width="22" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x="23" y="3" width="2" height="6" rx="1" fill="currentColor" opacity="0.5" />
      <rect x="2" y="2" width={fillWidth} height="8" rx="1" fill="currentColor" />
    </svg>
  );
}

// ============================================================================
// TYPES
// ============================================================================

export interface TabletDraftHeaderProps {
  /** Timer seconds remaining */
  timerSeconds: number;
  /** Current round number */
  round: number;
  /** Current pick number */
  pick: number;
  /** Whether it's the user's turn */
  isMyTurn: boolean;
  /** Current picker's name */
  currentPicker?: string;
  /** Leave draft handler */
  onLeave?: () => void;
  /** Info button handler */
  onInfo?: () => void;
}

// ============================================================================
// TIMER DISPLAY
// ============================================================================

interface TimerDisplayProps {
  seconds: number;
  isMyTurn: boolean;
}

function TimerDisplay({ seconds, isMyTurn }: TimerDisplayProps): ReactElement {
  const isWarning = seconds <= 10;
  const isCritical = seconds <= 5;
  
  const timerColor = isCritical 
    ? STATE_COLORS.error 
    : isWarning 
      ? STATE_COLORS.warning 
      : TEXT_COLORS.primary;
  
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = minutes > 0 
    ? `${minutes}:${secs.toString().padStart(2, '0')}`
    : secs.toString();
  
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {isMyTurn && (
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: STATE_COLORS.error,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Your Pick
        </span>
      )}
      <span
        style={{
          fontSize: TABLET_HEADER.timerFontSize,
          fontWeight: 700,
          color: timerColor,
          fontVariantNumeric: 'tabular-nums',
          minWidth: 60,
          textAlign: 'center',
        }}
      >
        {display}
      </span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TabletDraftHeader({
  timerSeconds,
  round,
  pick,
  isMyTurn,
  currentPicker,
  onLeave,
  onInfo,
}: TabletDraftHeaderProps): ReactElement {
  // Time state for status bar
  const [time, setTime] = useState('');
  
  useEffect(() => {
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
  }, []);
  
  const statusBarHeight = TABLET_FRAME.statusBarHeight;
  const totalHeight = TABLET_HEADER.height + statusBarHeight;
  
  return (
    <header
      style={{
        height: totalHeight,
        ...TILED_BG_STYLE,
        backgroundSize: '50px 50px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: TABLET_Z_INDEX.header,
        flexShrink: 0,
      }}
    >
      {/* iPad Status Bar Row */}
      <div
        style={{
          height: statusBarHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 24,
          paddingRight: 24,
          color: TEXT_COLORS.primary,
          fontSize: 13,
          fontWeight: 500,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        }}
      >
        {/* Left - Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ letterSpacing: '0.02em' }}>{time}</span>
        </div>
        
        {/* Center - Empty */}
        <div />
        
        {/* Right - Status Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <WifiIcon />
          <BatteryIcon level={85} />
        </div>
      </div>
      
      {/* Navbar Row */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: `max(${TABLET_HEADER.paddingX}px, ${TABLET_SAFE_AREA.left})`,
          paddingRight: `max(${TABLET_HEADER.paddingX}px, ${TABLET_SAFE_AREA.right})`,
        }}
      >
        {/* Left - Logo + Leave */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={onLeave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: TEXT_COLORS.primary,
              padding: 8,
              borderRadius: 8,
            }}
            aria-label="Leave draft"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Leave</span>
          </button>
          
          <img
            src="/logo.png"
            alt="TopDog"
            style={{
              height: 28,
              width: 'auto',
            }}
          />
        </div>
        
        {/* Center - Round/Pick Info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: TEXT_COLORS.secondary,
              fontSize: 14,
            }}
          >
            <span>Round {round}</span>
            <span style={{ opacity: 0.5 }}>|</span>
            <span>Pick {pick}</span>
            {currentPicker && !isMyTurn && (
              <>
                <span style={{ opacity: 0.5 }}>|</span>
                <span style={{ color: TEXT_COLORS.primary }}>{currentPicker}</span>
              </>
            )}
          </div>
          
          {/* Timer */}
          <TimerDisplay seconds={timerSeconds} isMyTurn={isMyTurn} />
        </div>
        
        {/* Right - Info Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onInfo}
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              color: TEXT_COLORS.primary,
            }}
            aria-label="Draft info"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="8" r="1" />
              <rect x="11" y="11" width="2" height="6" rx="1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

