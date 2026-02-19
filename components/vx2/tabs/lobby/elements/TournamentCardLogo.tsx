/**
 * TournamentCardLogo
 *
 * Renders the tournament card logo (image) inside the card.
 * Not a background — functions as a logo only.
 *
 * @module TournamentCardLogo
 */

import Image from 'next/image';
import React from 'react';

import { cn } from '@/lib/styles';

import styles from './TournamentCardLogo.module.css';

export interface TournamentCardLogoProps {
  /** Logo image path (e.g. /tournament_card_background.png) */
  src: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Max height in pixels */
  maxHeight?: number;
  /** Optional className */
  className?: string;
}

const DEFAULT_ALT = 'Tournament logo';
const DEFAULT_MAX_HEIGHT = 72;

export function TournamentCardLogo({
  src,
  alt = DEFAULT_ALT,
  maxHeight = DEFAULT_MAX_HEIGHT,
  className = '',
}: TournamentCardLogoProps): React.ReactElement {
  return (
    <div
      className={cn(styles.container, className)}
      data-max-height={maxHeight}
    >
      <Image
        src={src}
        alt={alt}
        width={maxHeight}
        height={maxHeight}
        unoptimized
      />
    </div>
  );
}

export default TournamentCardLogo;
