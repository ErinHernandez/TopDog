/**
 * TournamentBackground
 * 
 * Renders the card background with blur-up loading effect.
 * Uses absolute positioning to fill the parent container.
 * 
 * @module TournamentBackground
 */

import React from 'react';

import { cn } from '@/lib/styles';

import styles from './TournamentBackground.module.css';

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
  borderRadius = 8,
}: TournamentBackgroundProps): React.ReactElement {
  const backgroundImage = image.startsWith('url(') ? image : `url(${image})`;

  return (
    <div
      className={cn(styles.container)}
      data-border-radius={borderRadius}
    >
      {/* Blur Placeholder Layer */}
      {placeholder && (
        <div
          className={cn(styles.placeholder)}
          data-is-loaded={isLoaded ? '0' : '1'}
          style={{
            '--placeholder-image': `url(${placeholder})`,
          } as React.CSSProperties}
          aria-hidden="true"
        />
      )}

      {/* Full Resolution Image Layer */}
      <div
        className={cn(styles.image)}
        data-is-loaded={isLoaded ? '1' : '0'}
        style={{
          '--image': backgroundImage,
        } as React.CSSProperties}
      />

      {/* Gradient Overlay for Text Readability */}
      <div
        className={cn(styles.overlay)}
        aria-hidden="true"
      />
    </div>
  );
}

export default TournamentBackground;
