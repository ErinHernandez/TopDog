/**
 * DraftStatusBar - Unified header with status bar + centered timer
 * 
 * Background logic:
 * - Not user's turn: Dark background (#1F2937)
 * - User's turn + timer <= 9s: Red urgent background (#DC2626)
 * - User's turn + timer > 9s: Blue tiled background
 * 
 * Includes alarm clock shake animation when timer hits 0.
 */

import React, { useState, useEffect, useRef } from 'react';
import { TILED_BG_STYLE } from '../constants';
import { DRAFT_TIMER } from '../../core/constants/timing';
import { createScopedLogger } from '../../../../lib/clientLogger';

const logger = createScopedLogger('[DraftStatusBar]');

// ============================================================================
// SHAKE ANIMATION KEYFRAMES
// ============================================================================

const SHAKE_KEYFRAMES = `
@keyframes header-shake {
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
  const styleId = 'header-shake-keyframes';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = SHAKE_KEYFRAMES;
    document.head.appendChild(style);
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const HEADER_HEIGHT = 64; // Combined status bar + Dynamic Island + timer area

// ============================================================================
// TYPES
// ============================================================================

export interface DraftStatusBarProps {
  /** Timer seconds remaining */
  timerSeconds: number;
  /** Hide the timer (when it's rendered in the pick card) */
  hideTimer?: boolean;
  /** Whether it's the current user's turn */
  isUserTurn: boolean;
  /** Pre-draft countdown (60 seconds before draft starts) */
  preDraftCountdown?: number | null;
  /** Draft status */
  draftStatus?: 'waiting' | 'active' | 'paused' | 'complete';
  /** Callback when grace period ends (after shake animation) */
  onGracePeriodEnd?: () => void;
  /** Callback when exit button is pressed */
  onLeave?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function DraftStatusBar({
  timerSeconds,
  isUserTurn,
  onGracePeriodEnd,
  onLeave,
  hideTimer = false,
  preDraftCountdown,
  draftStatus,
}: DraftStatusBarProps): React.ReactElement {
  // Shake animation state
  const [shakeKey, setShakeKey] = useState(0);
  const shakeScheduledRef = useRef(false);
  const onGracePeriodEndRef = useRef(onGracePeriodEnd);
  onGracePeriodEndRef.current = onGracePeriodEnd;
  const shouldShake = isUserTurn && timerSeconds === 0;
  
  // Alarm clock shake animation - trigger when timer hits 0
  useEffect(() => {
    // Reset shake flag when timer resets (new pick)
    if (timerSeconds > 0) {
      shakeScheduledRef.current = false;
    }
    
    // Trigger shake when timer hits 0 and it's user's turn (only once per pick)
    if (isUserTurn && timerSeconds === 0 && !shakeScheduledRef.current) {
      shakeScheduledRef.current = true;
      setShakeKey(prev => prev + 1);
      
      // Call onGracePeriodEnd after shake animation completes
      const timeout = setTimeout(() => {
        onGracePeriodEndRef.current?.();
      }, DRAFT_TIMER.GRACE_PERIOD_MS);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [timerSeconds, isUserTurn]);

  // Background logic
  const getBackgroundStyle = (): React.CSSProperties => {
    // Pre-draft countdown - use same color as PicksBar (only when countdown is active)
    if (draftStatus === 'waiting' && preDraftCountdown !== null && preDraftCountdown > 0) {
      return { backgroundColor: '#101927' }; // Match PicksBar background color
    }
    if (!isUserTurn) {
      return { backgroundColor: '#101927' }; // Match PicksBar background - not your turn
    }
    if (timerSeconds <= 9) {
      return { backgroundColor: '#DC2626' }; // Red-600 - urgent
    }
    return {
      backgroundImage: TILED_BG_STYLE.backgroundImage,
      backgroundRepeat: TILED_BG_STYLE.backgroundRepeat,
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      backgroundColor: TILED_BG_STYLE.backgroundColor,
    };
  };

  const backgroundStyle = getBackgroundStyle();

  // Handle click anywhere in safe area to leave draft
  const handleSafeAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // The button stops propagation, so if we reach here, the click wasn't on the button
    // The timer area has pointerEvents: 'none', so clicks pass through to this container
    // Clicks anywhere else in the safe area will also trigger this handler
    logger.debug('Safe area clicked - leaving draft');
    if (onLeave) {
      onLeave();
    }
  };

  return (
    <div
      key={shakeKey}
      onClick={onLeave ? handleSafeAreaClick : undefined}
      style={{
        position: 'relative',
        height: `${HEADER_HEIGHT}px`,
        ...backgroundStyle,
        paddingTop: '28px', // Space for Dynamic Island (8px top + 20px height)
        paddingBottom: '2px', // Padding below safe area
        zIndex: 60,
        flexShrink: 0,
        transition: 'background-color 0.15s ease',
        animation: shouldShake ? 'header-shake 0.6s ease-in-out' : 'none',
        transformOrigin: 'center center',
        cursor: onLeave ? 'pointer' : 'default',
        WebkitTapHighlightColor: 'transparent',
      }}
      role="banner"
      aria-label={onLeave ? "Draft header - tap anywhere to leave draft" : "Draft header"}
    >
      {/* Centered Timer - large and prominent (hidden when shown in pick card) */}
      {/* Positioned below Dynamic Island */}
      {!hideTimer && (
        <div
          style={{
            position: 'absolute',
            top: '28px', // Below Dynamic Island (8px top + 20px height)
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none', // Allow clicks through to parent container
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color: '#FFFFFF',
              pointerEvents: 'none',
            }}
            aria-label={
              draftStatus === 'waiting' && preDraftCountdown !== null && preDraftCountdown > 0
                ? `Draft starts in ${preDraftCountdown} seconds`
                : `${timerSeconds} seconds remaining`
            }
            aria-live="polite"
          >
            {draftStatus === 'waiting' && preDraftCountdown !== null && preDraftCountdown > 0
              ? preDraftCountdown
              : timerSeconds}
          </div>
        </div>
      )}
    </div>
  );
}

