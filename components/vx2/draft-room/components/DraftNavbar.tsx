/**
 * DraftNavbar - Top navigation bar for draft room
 * 
 * Features:
 * - Blue tiled background (wr_blue.png)
 * - White back arrow (left)
 * - Countdown timer (center)
 * - Pulse animation at 3s, 2s, 1s, 0s
 * 
 * A-Grade Requirements:
 * - TypeScript: Full type coverage
 * - Accessibility: ARIA labels, proper semantics
 */

import React, { useEffect, useState, useRef } from 'react';
import { TILED_BG_STYLE } from '../constants';

// ============================================================================
// PULSE ANIMATION STYLE
// ============================================================================

const PULSE_KEYFRAMES = `
@keyframes navbar-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.5); }
  100% { transform: scale(1); }
}

@keyframes navbar-shake {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  10% { transform: translateX(-4px) rotate(-2deg); }
  20% { transform: translateX(4px) rotate(2deg); }
  30% { transform: translateX(-4px) rotate(-2deg); }
  40% { transform: translateX(4px) rotate(2deg); }
  50% { transform: translateX(-4px) rotate(-2deg); }
  60% { transform: translateX(4px) rotate(2deg); }
  70% { transform: translateX(-4px) rotate(-2deg); }
  80% { transform: translateX(4px) rotate(2deg); }
  90% { transform: translateX(-2px) rotate(-1deg); }
}
`;

// Inject keyframes into document head (only once)
if (typeof document !== 'undefined') {
  const styleId = 'navbar-pulse-keyframes';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = PULSE_KEYFRAMES;
    document.head.appendChild(style);
  }
}

// ============================================================================
// PIXEL-PERFECT CONSTANTS
// ============================================================================

const NAVBAR_PX = {
  // Container
  height: 48,
  paddingX: 16,
  
  // Timer
  timerFontSize: 26,
  timerFontWeight: 700,
  
  // Buttons
  buttonSize: 40,
  iconSize: 24,
  iconStrokeWidth: 2.5,
} as const;

/** Grace period duration in ms - time after timer hits 0 when user can still pick */
export const GRACE_PERIOD_MS = 600;

const NAVBAR_COLORS = {
  text: '#FFFFFF',
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface DraftNavbarProps {
  /** Callback to leave draft */
  onLeave: () => void;
  /** Use absolute positioning (for phone frame container) */
  useAbsolutePosition?: boolean;
  /** Timer seconds remaining */
  timerSeconds?: number;
  /** Whether it's the current user's turn */
  isUserTurn?: boolean;
  /** 
   * Callback when grace period ends (after shake animation completes).
   * Use this to trigger auto-pick - user can still make picks while timer shows 0
   * until this callback fires (600ms grace period).
   */
  onGracePeriodEnd?: () => void;
  /** Callback when info button is pressed */
  onInfo?: () => void;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// Back button - white chevron
function BackButton({ onClick }: { onClick: () => void }): React.ReactElement {
  return (
    <button
      onClick={onClick}
      aria-label="Leave draft"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: NAVBAR_PX.buttonSize,
        height: NAVBAR_PX.buttonSize,
        borderRadius: NAVBAR_PX.buttonSize / 2,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        transition: 'background-color 0.2s',
      }}
      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <svg
        width={NAVBAR_PX.iconSize}
        height={NAVBAR_PX.iconSize}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M15 19L8 12L15 5"
          stroke={NAVBAR_COLORS.text}
          strokeWidth={NAVBAR_PX.iconStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

// Info button - circle with "i"
function InfoButton({ onClick }: { onClick?: () => void }): React.ReactElement {
  return (
    <button
      onClick={onClick}
      aria-label="Draft info"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: NAVBAR_PX.buttonSize,
        height: NAVBAR_PX.buttonSize,
        borderRadius: NAVBAR_PX.buttonSize / 2,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        transition: 'background-color 0.2s',
      }}
      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <svg
        width={NAVBAR_PX.iconSize}
        height={NAVBAR_PX.iconSize}
        viewBox="0 0 24 24"
        fill="none"
      >
        {/* Circle */}
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={NAVBAR_COLORS.text}
          strokeWidth={2}
          fill="none"
        />
        {/* Dot of the "i" */}
        <circle
          cx="12"
          cy="8"
          r="1.5"
          fill={NAVBAR_COLORS.text}
        />
        {/* Stem of the "i" */}
        <line
          x1="12"
          y1="11"
          x2="12"
          y2="16"
          stroke={NAVBAR_COLORS.text}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

// Countdown timer display - matches PicksBar timer style
function TimerDisplay({ 
  seconds, 
  isUserTurn,
  pulseKey,
  shouldPulse,
}: { 
  seconds: number; 
  isUserTurn: boolean;
  pulseKey: number;
  shouldPulse: boolean;
}): React.ReactElement {
  return (
    <div
      key={pulseKey}
      aria-label={`${seconds} seconds remaining${isUserTurn ? ', your turn' : ''}`}
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: NAVBAR_PX.height,
        fontWeight: NAVBAR_PX.timerFontWeight,
        fontSize: NAVBAR_PX.timerFontSize,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        color: '#FFFFFF',
        animation: shouldPulse ? 'navbar-pulse 0.4s ease-out' : 'none',
      }}
    >
      {seconds}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DraftNavbar({
  onLeave,
  useAbsolutePosition = false,
  timerSeconds = 30,
  isUserTurn = false,
  onGracePeriodEnd,
  onInfo,
}: DraftNavbarProps): React.ReactElement {
  // Track pulse animation - triggers at 3, 2, 1, 0 for user's turn only
  const [pulseKey, setPulseKey] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const shouldPulse = isUserTurn && timerSeconds <= 3 && timerSeconds >= 0;
  const shouldShake = isUserTurn && timerSeconds === 0;
  
  // Use ref to track if grace period timeout has been scheduled
  const gracePeriodScheduledRef = useRef(false);
  const onGracePeriodEndRef = useRef(onGracePeriodEnd);
  onGracePeriodEndRef.current = onGracePeriodEnd;
  
  // Reset grace period flag when timer resets (new pick)
  useEffect(() => {
    if (timerSeconds > 0) {
      gracePeriodScheduledRef.current = false;
    }
  }, [timerSeconds]);
  
  // Trigger new pulse animation when timer hits 3, 2, 1, 0 (user only)
  useEffect(() => {
    if (isUserTurn && [3, 2, 1, 0].includes(timerSeconds)) {
      setPulseKey(prev => prev + 1);
    }
    // Trigger shake when timer hits 0, and schedule grace period end (only once)
    if (isUserTurn && timerSeconds === 0 && !gracePeriodScheduledRef.current) {
      gracePeriodScheduledRef.current = true;
      setShakeKey(prev => prev + 1);
      
      // Call onGracePeriodEnd after shake animation completes
      const timeout = setTimeout(() => {
        onGracePeriodEndRef.current?.();
      }, GRACE_PERIOD_MS);
        return () => clearTimeout(timeout);
    }
    return undefined;
  }, [timerSeconds, isUserTurn]);

  // Background changes based on turn and timer
  // - User's turn + timer <= 9s: Red urgent background
  // - User's turn + timer > 9s: Blue tiled background
  // - Not user's turn: Dark background
  const getBackgroundStyle = () => {
    if (!isUserTurn) {
      return { backgroundColor: '#1F2937' }; // Match SearchBar background
    }
    if (timerSeconds <= 9) {
      return { backgroundColor: '#DC2626' }; // Red-600
    }
    return TILED_BG_STYLE;
  };

  const backgroundStyle = getBackgroundStyle();

  return (
    <header
      key={shakeKey}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: NAVBAR_PX.height,
        paddingLeft: NAVBAR_PX.paddingX,
        paddingRight: NAVBAR_PX.paddingX,
        ...backgroundStyle,
        position: useAbsolutePosition ? 'absolute' : 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        flexShrink: 0,
        animation: shouldShake ? 'navbar-shake 0.6s ease-in-out' : 'none',
      }}
    >
      {/* Left: Back button */}
      <div style={{ width: NAVBAR_PX.buttonSize }}>
        <BackButton onClick={onLeave} />
      </div>
      
      {/* Center: Countdown Timer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          height: '100%',
        }}
      >
        <TimerDisplay 
          seconds={timerSeconds} 
          isUserTurn={isUserTurn} 
          pulseKey={pulseKey}
          shouldPulse={shouldPulse}
        />
      </div>
      
      {/* Right: Spacer for layout balance */}
      <div style={{ width: NAVBAR_PX.buttonSize }} />
    </header>
  );
}
