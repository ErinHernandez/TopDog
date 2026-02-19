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

import { cn } from '@/lib/styles';

import { createScopedLogger } from '../../../../lib/clientLogger';
import { BG_COLORS, PICKS_BAR_THEME } from '../../core/constants/colors';
import { DRAFT_TIMER } from '../../core/constants/timing';

import styles from './DraftStatusBar.module.css';

const logger = createScopedLogger('[DraftStatusBar]');

// ============================================================================
// CONSTANTS
// ============================================================================

export const HEADER_HEIGHT = 64; // Combined status bar + Dynamic Island + timer area

// CSS custom properties (--var-name) are not in React.CSSProperties; extend for inline styles
type CSSPropertiesWithVars = React.CSSProperties & Record<`--${string}`, string>;

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
  draftStatus?: 'loading' | 'waiting' | 'active' | 'paused' | 'complete';
  /** Callback when grace period ends (after shake animation) */
  onGracePeriodEnd?: () => void;
  /** Callback when exit button is pressed */
  onLeave?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const DraftStatusBar = React.memo(function DraftStatusBar({
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
  // eslint-disable-next-line react-hooks/refs -- ref mutation is intentional for callback storage
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

  // Background styles as CSS custom properties
  const getContainerStyles = (): CSSPropertiesWithVars => {
    const baseStyles: CSSPropertiesWithVars = {
      '--header-height': `${HEADER_HEIGHT}px`,
    };

    // Pre-draft countdown - use same color as PicksBar (only when countdown is active)
    if (draftStatus === 'waiting' && preDraftCountdown != null && preDraftCountdown > 0) {
      return { ...baseStyles, '--bg-color': BG_COLORS.primary };
    }
    if (!isUserTurn) {
      return { ...baseStyles, '--bg-color': BG_COLORS.primary };
    }
    if (timerSeconds <= 9) {
      return { ...baseStyles, '--bg-color': PICKS_BAR_THEME.onTheClockUrgent };
    }
    // User's turn with timer > 9: use bg-tiled class (no inline styles needed)
    return baseStyles;
  };

  const containerStyles = getContainerStyles();

  // Determine if we should show tiled background (user's turn, timer > 9, not pre-draft)
  const showTiledBg = isUserTurn &&
    timerSeconds > 9 &&
    !(draftStatus === 'waiting' && preDraftCountdown != null && preDraftCountdown > 0);

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
      className={cn(
        styles.container,
        onLeave && styles.clickable,
        !onLeave && styles.notClickable,
        shouldShake && styles.shaking,
        showTiledBg && 'bg-tiled',
      )}
      style={containerStyles}
      role="banner"
      aria-label={onLeave ? "Draft header - tap anywhere to leave draft" : "Draft header"}
    >
      {/* Centered Timer - large and prominent (hidden when shown in pick card) */}
      {/* Positioned below Dynamic Island */}
      {!hideTimer && (
        <div className={styles.timerContainer}>
          <div
            className={styles.timerValue}
            aria-label={
              draftStatus === 'waiting' && preDraftCountdown != null && preDraftCountdown > 0
                ? `Draft starts in ${preDraftCountdown} seconds`
                : `${timerSeconds} seconds remaining`
            }
            aria-live="polite"
          >
            {draftStatus === 'waiting' && preDraftCountdown != null && preDraftCountdown > 0
              ? preDraftCountdown
              : timerSeconds}
          </div>
        </div>
      )}
    </div>
  );
});

export default DraftStatusBar;

