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

export const HEADER_HEIGHT = 54; // Combined status bar + timer area

// ============================================================================
// TYPES
// ============================================================================

export interface DraftStatusBarProps {
  /** Timer seconds remaining */
  timerSeconds: number;
  /** Whether it's the current user's turn */
  isUserTurn: boolean;
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
    if (!isUserTurn) {
      return { backgroundColor: '#1F2937' }; // Dark - not your turn
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

  return (
    <div
      key={shakeKey}
      style={{
        position: 'relative',
        height: `${HEADER_HEIGHT}px`,
        ...backgroundStyle,
        paddingTop: 'env(safe-area-inset-top, 0px)',
        zIndex: 60,
        flexShrink: 0,
        transition: 'background-color 0.15s ease',
        animation: shouldShake ? 'header-shake 0.6s ease-in-out' : 'none',
        transformOrigin: 'center center',
      }}
      role="banner"
      aria-label="Draft header"
    >
      {/* Centered Timer - large and prominent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none', // Allow clicks through to other elements
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: '32px',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: '#FFFFFF',
            pointerEvents: 'none',
          }}
          aria-label={`${timerSeconds} seconds remaining`}
          aria-live="polite"
        >
          {timerSeconds}
        </div>
      </div>
      
      {/* Exit Button - positioned in lower-left area */}
      {onLeave && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            logger.debug('Exit button clicked');
            if (onLeave) {
              onLeave();
            }
          }}
          aria-label="Leave draft"
          style={{
            position: 'absolute',
            left: 16,
            bottom: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 26,
            borderRadius: 13,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            zIndex: 100,
            pointerEvents: 'auto',
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
        >
          <svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            style={{ pointerEvents: 'none' }}
          >
            <path
              d="M15 19L8 12L15 5"
              stroke="#FFFFFF"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

