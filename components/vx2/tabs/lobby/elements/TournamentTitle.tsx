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

export function TournamentTitle({
  title,
  fontSize = CARD_SPACING_V3.titleFontSize,
}: TournamentTitleProps): React.ReactElement {
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
        // Prevent text from overflowing
        wordBreak: 'break-word',
        hyphens: 'auto',
      }}
    >
      {title}
    </h2>
  );
}

export default TournamentTitle;
