/**
 * TournamentProgressBar
 * 
 * Renders entry progress bar. Only renders if maxEntries > 0.
 * 
 * @module TournamentProgressBar
 */

import React from 'react';
import { CARD_SPACING_V3 } from '../constants/cardSpacingV3';

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
  fillStyle = 'linear-gradient(90deg, #3B82F6 0%, #1D4ED8 100%)',
}: TournamentProgressBarProps): React.ReactElement | null {
  // Don't render if no max entries (unlimited tournament)
  if (!maxEntries || maxEntries <= 0) {
    return null;
  }

  const percentage = Math.min(Math.round((currentEntries / maxEntries) * 100), 100);

  return (
    <div
      className="tournament-progress-bar"
      style={{
        height: `${CARD_SPACING_V3.progressHeight}px`,
        width: '100%',
        backgroundColor: CARD_SPACING_V3.progressBackgroundColor,
        borderRadius: `${CARD_SPACING_V3.progressBorderRadius}px`,
        overflow: 'hidden',
      }}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${currentEntries} of ${maxEntries} entries`}
    >
      <div
        className="tournament-progress-bar__fill"
        style={{
          height: '100%',
          width: `${percentage}%`,
          background: fillStyle,
          borderRadius: `${CARD_SPACING_V3.progressBorderRadius}px`,
          transition: 'width 0.3s ease-out',
        }}
      />
    </div>
  );
}

export default TournamentProgressBar;
