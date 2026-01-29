/**
 * TournamentTitle
 * 
 * Renders the tournament title with correct typography.
 * Handles multi-line titles with proper line height.
 * 
 * @module TournamentTitle
 */

import React from 'react';
import { cn } from '@/lib/styles';
import { CARD_SPACING_V3 } from '../constants/cardSpacingV3';
import styles from './TournamentTitle.module.css';

export interface TournamentTitleProps {
  /** Tournament title text */
  title: string;
  /** Optional font size override */
  fontSize?: number;
}

/**
 * Splits title so the last word stays on its own line, avoiding mid-word wraps
 * (e.g. "THE TOPDOG INTERNATIONAL" → "THE TOPDOG" / "INTERNATIONAL").
 */
function titleLines(title: string): { line1: string; line2: string | null } {
  const lastSpace = title.lastIndexOf(' ');
  if (lastSpace > 0) {
    return { line1: title.slice(0, lastSpace), line2: title.slice(lastSpace + 1) };
  }
  return { line1: title, line2: null };
}

export function TournamentTitle({
  title,
  fontSize = CARD_SPACING_V3.titleFontSize,
}: TournamentTitleProps): React.ReactElement {
  const { line1, line2 } = titleLines(title);
  return (
    <h2
      className={cn(styles.title)}
      style={{
        '--font-family': CARD_SPACING_V3.titleFontFamily,
        '--font-size': `${fontSize}px`,
        '--line-height': CARD_SPACING_V3.titleLineHeight,
        '--margin-top': `${CARD_SPACING_V3.titleMarginTop}px`,
      } as React.CSSProperties}
    >
      {line2 ? (
        <>
          {line1}
          <br />
          {line2}
        </>
      ) : (
        line1
      )}
    </h2>
  );
}

export default TournamentTitle;
