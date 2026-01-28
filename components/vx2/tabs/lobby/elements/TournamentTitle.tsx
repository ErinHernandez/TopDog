/**
 * TournamentTitle
 * 
 * Renders the tournament title with correct typography.
 * Handles multi-line titles with proper line height.
 * 
 * @module TournamentTitle
 */

import React from 'react';
import { CARD_SPACING_V3 } from '../constants/cardSpacingV3';

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
      className="tournament-title"
      style={{
        fontFamily: CARD_SPACING_V3.titleFontFamily,
        fontSize: `${fontSize}px`,
        lineHeight: CARD_SPACING_V3.titleLineHeight,
        textTransform: 'uppercase',
        color: '#FFFFFF',
        textAlign: 'center',
        margin: 0,
        marginTop: `${CARD_SPACING_V3.titleMarginTop}px`,
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        letterSpacing: '2px',
        // Keep words whole; we control break at last space above
        wordBreak: 'normal',
        overflowWrap: 'normal',
      }}
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
