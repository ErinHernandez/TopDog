/**
 * TournamentJoinButton
 * 
 * Primary action button for joining tournaments.
 * 
 * @module TournamentJoinButton
 */

import React from 'react';
import { cn } from '@/lib/styles';
import styles from './TournamentJoinButton.module.css';

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
 * Default tiled background properties
 */
const DEFAULT_BACKGROUND_IMAGE = 'url(/wr_blue.png)';
const DEFAULT_BACKGROUND_COLOR = '#1e40af';

export function TournamentJoinButton({
  onClick,
  label = 'Join Tournament',
  disabled = false,
  backgroundStyle,
}: TournamentJoinButtonProps): React.ReactElement {
  const backgroundImage = backgroundStyle?.backgroundImage
    ? String(backgroundStyle.backgroundImage)
    : DEFAULT_BACKGROUND_IMAGE;
  const backgroundColor = backgroundStyle?.backgroundColor
    ? String(backgroundStyle.backgroundColor)
    : DEFAULT_BACKGROUND_COLOR;

  return (
    <button
      className={cn(styles.button)}
      onClick={onClick}
      disabled={disabled}
      data-background-image={backgroundImage}
      data-background-color={backgroundColor}
    >
      {label}
    </button>
  );
}

export default TournamentJoinButton;
