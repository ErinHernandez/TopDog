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

import { cn } from '@/lib/styles';

import { createScopedLogger } from '../../../../lib/clientLogger';
import { TEXT_COLORS } from '../../core/constants/colors';
import { DRAFT_TIMER } from '../../core/constants/timing';

import styles from './DraftNavbar.module.css';

const logger = createScopedLogger('[DraftNavbar]');

// ============================================================================
// PIXEL-PERFECT CONSTANTS
// ============================================================================

const NAVBAR_PX = {
  // Container
  height: 26, // Compact for unified header
  paddingX: 16,
  
  // Timer
  timerFontSize: 32, // Larger for centered display
  timerFontWeight: 700,
  
  // Buttons
  buttonSize: 26,
  iconSize: 18,
  iconStrokeWidth: 2,
} as const;

// Grace period re-exported from centralized timing constants
export { DRAFT_TIMER } from '../../core/constants/timing';
/** @deprecated Use DRAFT_TIMER.GRACE_PERIOD_MS from timing constants */
export const GRACE_PERIOD_MS = 600;

const NAVBAR_COLORS = {
  text: TEXT_COLORS.primary,
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
  /** Hide the timer (when it's rendered externally centered across both bars) */
  hideTimer?: boolean;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// Back button - white chevron (OLD - keeping for reference but not using)
function BackButton({ onClick }: { onClick: () => void }): React.ReactElement {
  return (
    <button
      onClick={onClick}
      aria-label="Leave draft"
      className={styles.button}
    >
      <svg
        className={styles.buttonSvg}
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

// Exit Draft Room Button - Opens confirmation modal
function ExitDraftButton({ onLeaveCallback }: { onLeaveCallback?: () => void }): React.ReactElement {
  const handleExitClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent any default behavior
    event.preventDefault();
    event.stopPropagation();

    logger.debug('Exit button clicked', { hasCallback: !!onLeaveCallback });

    // Call the callback to open confirmation modal (if provided)
    if (onLeaveCallback) {
      try {
        onLeaveCallback();
      } catch (error) {
        logger.error('Error in exit callback', error as Error);
      }
    } else {
      logger.warn('No onLeave callback provided');
    }
  }, [onLeaveCallback]);

  return (
    <button
      type="button"
      onClick={handleExitClick}
      aria-label="Leave draft room"
      className={cn(styles.button, styles.exitButton)}
    >
      <svg
        className={styles.buttonSvg}
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
      className={styles.button}
    >
      <svg
        className={styles.buttonSvg}
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
      className={cn(styles.timerDisplay, shouldPulse && styles.pulse)}
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
  hideTimer = false,
}: DraftNavbarProps): React.ReactElement {
  // Track pulse animation - triggers at 3, 2, 1, 0 for user's turn only
  const [pulseKey, setPulseKey] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const shouldPulse = isUserTurn && timerSeconds <= 3 && timerSeconds >= 0;
  const shouldShake = isUserTurn && timerSeconds === 0;
  
  // Use ref to track if grace period timeout has been scheduled
  const gracePeriodScheduledRef = useRef(false);
  const onGracePeriodEndRef = useRef(onGracePeriodEnd);
  // eslint-disable-next-line react-hooks/refs -- ref mutation is intentional for callback storage
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
      }, DRAFT_TIMER.GRACE_PERIOD_MS);
        return () => clearTimeout(timeout);
    }
    return undefined;
  }, [timerSeconds, isUserTurn]);

  // Background class based on turn and timer
  // - User's turn + timer <= 9s: Red urgent background
  // - User's turn + timer > 9s: Blue tiled background
  // - Not user's turn: Dark background
  const getBackgroundClass = () => {
    if (!isUserTurn) {
      return styles.bgDark;
    }
    if (timerSeconds <= 9) {
      return styles.bgRed;
    }
    return styles.bgTiled;
  };

  // Position class - when inside a container, use relative; otherwise absolute/fixed
  const getPositionClass = () => {
    if (useAbsolutePosition === true) {
      return styles.absolute;
    }
    if (useAbsolutePosition === false) {
      return styles.relative;
    }
    return styles.fixed;
  };

  return (
    <header
      key={shakeKey}
      className={cn(styles.header, getBackgroundClass(), getPositionClass())}
    >
      {/* Navbar content - fixed height below safe area */}
      <div
        className={cn(styles.navContent, shouldShake && styles.shake)}
      >
        {/* Left: Exit Button */}
        <ExitDraftButton onLeaveCallback={onLeave} />

        {/* Center: Countdown Timer (hidden when rendered externally) */}
        {!hideTimer && (
          <div className={styles.timerWrapper}>
            <TimerDisplay
              seconds={timerSeconds}
              isUserTurn={isUserTurn}
              pulseKey={pulseKey}
              shouldPulse={shouldPulse}
            />
          </div>
        )}

        {/* Center spacer when timer hidden */}
        {hideTimer && <div className={styles.spacerFlex} />}

        {/* Right: Spacer for layout balance */}
        <div className={styles.spacer} />
      </div>
    </header>
  );
}
