/**
 * PlayerDropdownContent - Expanded Dropdown Content
 *
 * This component ONLY handles the expanded dropdown area (purple/gold gradient).
 * It's positioned absolutely below the existing player row without modifying it.
 *
 * Refactored to use CSS Modules and shared StatsTable component.
 *
 * @example
 * ```tsx
 * <PlayerDropdownContent
 *   player={player}
 *   context="DRAFT_ROOM"
 *   showStats={true}
 *   onDraft={handleDraft}
 * />
 * ```
 */

import Image from 'next/image';
import React from 'react';

import { StatsTable, type PlayerStats } from '@/components/shared/StatsTable';
import { createScopedLogger } from '@/lib/clientLogger';
import type { PlayerFull } from '@/types/player';

import { createTeamGradient } from '../../../lib/gradientUtils';

import styles from './PlayerDropdownContent.module.css';
import { DROPDOWN_DIMENSIONS } from './PlayerDropdownStyles';

const logger = createScopedLogger('[PlayerDropdownContent]');

// ============================================================================
// TYPES
// ============================================================================

export type DropdownContext = 'DRAFT_ROOM' | 'TEAM_MANAGEMENT' | 'RANKINGS' | 'MOBILE_DRAFT';

export interface ContextConfig {
  showDraftButton?: boolean;
  showQueueButton?: boolean;
  showFullStats?: boolean;
  enableHover?: boolean;
  showRankingControls?: boolean;
  fontSize?: string;
  touchOptimized?: boolean;
}

export interface PlayerDropdownContentProps {
  /** Player object with stats */
  player: PlayerFull | (PlayerFull & { stats?: Record<string, PlayerStats> });
  /** Context for dropdown behavior (default: "DRAFT_ROOM") */
  context?: DropdownContext;
  /** Context-specific configuration */
  contextConfig?: ContextConfig;
  /** Whether to show stats table (default: true) */
  showStats?: boolean;
  /** Whether it's the user's turn (default: false) */
  isMyTurn?: boolean;
  /** Draft button click handler */
  onDraft?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Queue button click handler */
  onQueue?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Custom styles */
  customStyles?: React.CSSProperties;
  /** Additional CSS classes */
  className?: string;
}

interface ByeWeeks {
  [key: string]: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

const PlayerDropdownContent: React.FC<PlayerDropdownContentProps> = ({
  player,
  context = 'DRAFT_ROOM',
  contextConfig = {},
  showStats = true,
  isMyTurn = false,
  onDraft,
  onQueue,
  customStyles = {},
  className = '',
}): React.ReactElement => {
  const handleDraft = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    onDraft?.(e);
  };

  const handleQueue = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    onQueue?.(e);
  };

  // Calculate dynamic height based on available stats
  const calculateHeight = (): number => {
    const baseHeight = DROPDOWN_DIMENSIONS.EXPANDED_BASE_HEIGHT;
    const headerHeight = DROPDOWN_DIMENSIONS.STATS_HEADER_HEIGHT;
    const rowHeight = DROPDOWN_DIMENSIONS.STATS_ROW_HEIGHT;
    const bottomPadding = 16;

    let availableYears = 1;

    if (player.stats) {
      availableYears = Object.keys(player.stats).length;
    }

    const totalRows = availableYears;
    return baseHeight + headerHeight + (totalRows * rowHeight) + bottomPadding;
  };

  // Get bye week for player's team
  const getByeWeek = (team: string): number | string => {
    const byeWeeks: ByeWeeks = {
      'ARI': 11, 'ATL': 12, 'BAL': 14, 'BUF': 12, 'CAR': 11, 'CHI': 7,
      'CIN': 12, 'CLE': 10, 'DAL': 7, 'DEN': 14, 'DET': 5, 'GB': 10,
      'HOU': 14, 'IND': 14, 'JAX': 12, 'KC': 6, 'LV': 10, 'LAC': 5,
      'LAR': 6, 'MIA': 6, 'MIN': 6, 'NE': 14, 'NO': 12, 'NYG': 11,
      'NYJ': 12, 'PHI': 5, 'PIT': 9, 'SF': 9, 'SEA': 10, 'TB': 11,
      'TEN': 5, 'WAS': 14,
    };
    return byeWeeks[team] || 'N/A';
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>): void => {
    logger.debug(`Failed to load logo for team: ${player.team}`);
    const target = e.currentTarget;
    target.style.display = 'none';
  };

  const teamGradient = createTeamGradient(player.team);
  const playerStats = player.stats as Record<string, PlayerStats> | undefined;

  return (
    <div
      className={`${styles.dropdownContent} ${className}`}
      style={{
        '--dropdown-gradient': teamGradient.firstGradient,
        '--dropdown-border-color': teamGradient.primaryColor,
        '--dropdown-height': `${calculateHeight()}px`,
        ...customStyles,
      } as React.CSSProperties}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header: Logo + Badges + Buttons */}
      <div className={styles.header}>
        {/* NFL Team Logo */}
        <Image
          className={styles.teamLogo}
          src={`/logos/nfl/${player.team?.toLowerCase()}.png`}
          alt={`${player.team} logo`}
          width={40}
          height={40}
          unoptimized
        />

        {/* Player Info Badges */}
        <div className={styles.badgesContainer}>
          <div className={styles.badgesRow}>
            <div className={styles.badge} data-type="bye">
              <div className={styles.badgeLabel}>Bye</div>
              <div className={styles.badgeValue}>
                {getByeWeek(player.team)}
              </div>
            </div>
            <div className={styles.badge} data-type="adp">
              <div className={styles.badgeLabel}>ADP</div>
              <div className={styles.badgeValue}>
                {parseFloat(String(player.adp || 0)).toFixed(1)}
              </div>
            </div>
            <div className={styles.badge} data-type="proj">
              <div className={styles.badgeLabel}>Proj</div>
              <div className={styles.badgeValue}>
                {parseFloat(String((player as { projectedPoints?: number }).projectedPoints || 0)).toFixed(1) || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionsContainer}>
          {contextConfig.showDraftButton && (
            <button
              className={styles.draftButton}
              data-active={isMyTurn ? 'true' : undefined}
              onClick={handleDraft}
              aria-label="Draft player"
            >
              DRAFT
            </button>
          )}

          {contextConfig.showQueueButton && (
            <button
              className={styles.queueButton}
              onClick={handleQueue}
              aria-label="Queue player"
            >
              QUEUE
            </button>
          )}
        </div>
      </div>

      {/* Stats Table */}
      {showStats && (
        <div className={styles.statsSection}>
          <StatsTable
            position={player.position}
            stats={playerStats}
            team={player.team}
          />
        </div>
      )}
    </div>
  );
};

export default PlayerDropdownContent;
