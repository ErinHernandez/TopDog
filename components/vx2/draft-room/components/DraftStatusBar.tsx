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
const GRACE_PERIOD_MS = 600; // Duration to wait after shake animation before auto-pick

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
  // Get current time (format: 7:44)
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };
  
  const [displayTime, setDisplayTime] = useState(getCurrentTime());
  
  // Shake animation state
  const [shakeKey, setShakeKey] = useState(0);
  const shakeScheduledRef = useRef(false);
  const onGracePeriodEndRef = useRef(onGracePeriodEnd);
  onGracePeriodEndRef.current = onGracePeriodEnd;
  const shouldShake = isUserTurn && timerSeconds === 0;
  
  // Update time every minute
  useEffect(() => {
    setDisplayTime(getCurrentTime());
    const interval = setInterval(() => {
      setDisplayTime(getCurrentTime());
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  
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
      }, GRACE_PERIOD_MS);
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

  // Fixed values for dev preview
  const batteryLevel = 79;
  const signalLevel = 4;

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
      {/* Top row: Time (left) and Status icons (right) */}
      <div
        className="flex items-center justify-between text-white text-sm font-medium"
        style={{
          height: '28px',
          paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(16px, env(safe-area-inset-right, 0px))',
        }}
      >
        {/* Left side - Time */}
        <div
          style={{
            fontSize: '15px',
            fontWeight: 600,
            letterSpacing: '-0.5px',
            color: '#FFFFFF',
          }}
        >
          {displayTime}
        </div>

        {/* Right side - Signal, WiFi, Battery */}
        <div className="flex items-center gap-1" style={{ gap: '4px' }}>
          {/* Signal bars */}
          <div className="flex items-end" style={{ gap: '2px', height: '12px' }}>
            {[1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                style={{
                  width: '3px',
                  height: `${3 + (bar - 1) * 2}px`,
                  backgroundColor: bar <= signalLevel ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '0.5px',
                }}
                aria-hidden="true"
              />
            ))}
          </div>

          {/* WiFi icon */}
          <svg
            width="16"
            height="12"
            viewBox="0 0 16 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ marginLeft: '2px' }}
            aria-hidden="true"
          >
            <path
              d="M8 9C8.55228 9 9 9.44772 9 10C9 10.5523 8.55228 11 8 11C7.44772 11 7 10.5523 7 10C7 9.44772 7.44772 9 8 9Z"
              fill="#FFFFFF"
            />
            <path
              d="M8 0C5.23858 0 2.73509 1.14688 0.929688 3.04297L2.38086 4.49414C3.79053 3.08447 5.78491 2.25 8 2.25C10.2151 2.25 12.2095 3.08447 13.6191 4.49414L15.0703 3.04297C13.2649 1.14688 10.7614 0 8 0Z"
              fill="#FFFFFF"
            />
            <path
              d="M8 4.5C6.61929 4.5 5.39453 5.05469 4.56445 5.93164L6.01562 7.38281C6.52148 6.87793 7.2207 6.5 8 6.5C8.7793 6.5 9.47852 6.87793 9.98438 7.38281L11.4355 5.93164C10.6055 5.05469 9.38071 4.5 8 4.5Z"
              fill="#FFFFFF"
            />
          </svg>

          {/* Battery icon */}
          <div className="flex items-center" style={{ marginLeft: '4px', gap: '4px' }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '-0.3px',
                color: '#FFFFFF',
              }}
            >
              {batteryLevel}
            </div>
            <svg
              width="24"
              height="12"
              viewBox="0 0 24 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Battery outline */}
              <rect
                x="1"
                y="2"
                width="20"
                height="8"
                rx="1.5"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                fill="none"
              />
              {/* Battery terminal */}
              <rect
                x="22"
                y="4"
                width="1"
                height="4"
                rx="0.5"
                fill="#FFFFFF"
              />
              {/* Battery fill */}
              <rect
                x="2.5"
                y="3.5"
                width={`${(batteryLevel / 100) * 18}px`}
                height="7"
                rx="1"
                fill={batteryLevel > 20 ? '#FFFFFF' : '#FF3B30'}
              />
            </svg>
          </div>
        </div>
      </div>
      
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
            console.log('[DraftStatusBar] Exit button clicked');
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

