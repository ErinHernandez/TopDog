/**
 * TournamentProgressBar
 * 
 * Renders entry progress bar. Only renders if maxEntries > 0.
 * 
 * @module TournamentProgressBar
 */

import React from 'react';
import { cn } from '@/lib/styles';
import { CARD_SPACING_V3 } from '../constants/cardSpacingV3';
import styles from './TournamentProgressBar.module.css';

export interface TournamentProgressBarProps {
  /** Current number of entries */
  currentEntries: number;
  /** Maximum number of entries (0 = unlimited, won't render) */
  maxEntries: number;
  /** Optional fill color/gradient */
  fillStyle?: string;
}

export function TournamentProgressBar({
  currentEntries,
  maxEntries,
  fillStyle,
}: TournamentProgressBarProps): React.ReactElement | null {
  // Don't render if no max entries (unlimited tournament)
  if (!maxEntries || maxEntries <= 0) {
    return null;
  }

  const percentage = Math.min(Math.round((currentEntries / maxEntries) * 100), 100);
  const hasFillStyle = fillStyle && fillStyle.trim().length > 0;

  return (
    <div
      className={cn(styles.container)}
      style={{
        '--height': `${CARD_SPACING_V3.progressHeight}px`,
        '--background-color': CARD_SPACING_V3.progressBackgroundColor,
        '--border-radius': `${CARD_SPACING_V3.progressBorderRadius}px`,
      } as React.CSSProperties}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${currentEntries} of ${maxEntries} entries`}
    >
      <div
        className={cn(styles.fill)}
        style={{
          '--percentage': `${percentage}%`,
          '--background-image': hasFillStyle ? fillStyle : 'url(/wr_blue.png)',
          '--background-color': hasFillStyle ? 'transparent' : '#1e40af',
          '--background-size': '200px',
          '--background-repeat': 'repeat',
          '--border-radius': `${CARD_SPACING_V3.progressBorderRadius}px`,
        } as React.CSSProperties}
      />
    </div>
  );
}

export default TournamentProgressBar;
