/**
 * TournamentBackground
 * 
 * Renders the card background with blur-up loading effect.
 * Uses absolute positioning to fill the parent container.
 * 
 * @module TournamentBackground
 */

import React from 'react';
import { CARD_SPACING_V3 } from '../constants/cardSpacingV3';

export interface TournamentBackgroundProps {
  /** Full resolution image URL or CSS gradient */
  image: string;
  /** Base64 blur placeholder (optional) */
  placeholder?: string;
  /** Whether the full image has loaded */
  isLoaded: boolean;
  /** Border radius to match card container */
  borderRadius?: number;
}

export function TournamentBackground({
  image,
  placeholder,
  isLoaded,
  borderRadius = CARD_SPACING_V3.borderRadius,
}: TournamentBackgroundProps): React.ReactElement {
  const transitionStyle = `opacity ${CARD_SPACING_V3.imageFadeDuration} ${CARD_SPACING_V3.imageFadeEasing}`;

  return (
    <div
      className="tournament-background"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        borderRadius: `${borderRadius}px`,
        overflow: 'hidden',
      }}
    >
      {/* Blur Placeholder Layer */}
      {placeholder && (
        <div
          className="tournament-background__placeholder"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${placeholder})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: isLoaded ? 0 : 1,
            transition: transitionStyle,
          }}
          aria-hidden="true"
        />
      )}

      {/* Full Resolution Image Layer */}
      <div
        className="tournament-background__image"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: image.startsWith('url(') ? image : `url(${image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: isLoaded ? 1 : 0,
          transition: transitionStyle,
        }}
      />

      {/* Gradient Overlay for Text Readability */}
      <div
        className="tournament-background__overlay"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.4) 100%)',
        }}
        aria-hidden="true"
      />
    </div>
  );
}

export default TournamentBackground;
