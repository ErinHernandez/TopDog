/**
 * TournamentJoinButton
 * 
 * Primary action button for joining tournaments.
 * 
 * @module TournamentJoinButton
 */

import React from 'react';
import { CARD_SPACING_V3 } from '../constants/cardSpacingV3';

export interface TournamentJoinButtonProps {
  /** Click handler */
  onClick: () => void;
  /** Button label */
  label?: string;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Optional background style override */
  backgroundStyle?: React.CSSProperties;
}

/**
 * Default tiled background style
 * Matches the existing TILED_BG_STYLE pattern
 */
const DEFAULT_BUTTON_STYLE: React.CSSProperties = {
  backgroundImage: 'url(/wr_blue.png)',
  backgroundSize: '200px',
  backgroundRepeat: 'repeat',
  backgroundColor: '#1E40AF', // Fallback color
};

export function TournamentJoinButton({
  onClick,
  label = 'Join Tournament',
  disabled = false,
  backgroundStyle = DEFAULT_BUTTON_STYLE,
}: TournamentJoinButtonProps): React.ReactElement {
  return (
    <button
      className="tournament-join-button"
      onClick={onClick}
      disabled={disabled}
      style={{
        // Background
        ...backgroundStyle,
        
        // Sizing
        height: `${CARD_SPACING_V3.buttonHeight}px`,
        width: '100%',
        
        // Typography
        fontSize: `${CARD_SPACING_V3.buttonFontSize}px`,
        fontWeight: CARD_SPACING_V3.buttonFontWeight,
        color: '#FFFFFF',
        textAlign: 'center',
        
        // Shape
        borderRadius: `${CARD_SPACING_V3.buttonBorderRadius}px`,
        border: 'none',
        
        // Interaction
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        
        // Animation
        transition: 'opacity 0.2s ease, transform 0.1s ease',
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)';
        }
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
      }}
    >
      {label}
    </button>
  );
}

export default TournamentJoinButton;
