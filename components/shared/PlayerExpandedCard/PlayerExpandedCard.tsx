/**
 * PlayerExpandedCard - Expanded player stats dropdown
 *
 * Master component for the expanded player card with:
 * - Team logo
 * - Bye/ADP/Proj badges
 * - DRAFT button
 * - Year-by-year stats table (position-specific layouts)
 *
 * Refactored to use CSS Modules and shared StatsTable component.
 */

import Image from 'next/image';
import React from 'react';

import { StatsTable, type PlayerStats } from '@/components/shared/StatsTable';
import { createTeamGradient } from '@/lib/gradientUtils';
import { BYE_WEEKS } from '@/lib/nflConstants';
import type { FantasyPosition } from '@/types/player';

import styles from './PlayerExpandedCard.module.css';


// ============================================================================
// TYPES
// ============================================================================

/** Player data for the expanded card */
interface PlayerData {
  name: string;
  team: string;
  position: FantasyPosition | string;
  adp?: number | string | null;
  projectedPoints?: number | string | null;
  proj?: string | null;
  stats?: Record<string, PlayerStats>;
}

/** Props for PlayerExpandedCard component */
interface PlayerExpandedCardProps {
  /** Player data to display */
  player: PlayerData | null;
  /** Callback when draft button is clicked */
  onDraft?: (player: PlayerData) => void;
  /** Callback when card is closed */
  onClose?: () => void;
  /** Whether it's the user's turn to draft */
  isMyTurn?: boolean;
  /** Whether to show the draft button */
  showDraftButton?: boolean;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

// Teams with light backgrounds that need dark header text
const LIGHT_BG_TEAMS = ['DET'];

// ============================================================================
// MOCK STATS (for demo purposes)
// ============================================================================

function getMockStats(position: string, availableYears: number): Record<string, PlayerStats> {
  const mockQBStats: PlayerStats = {
    completions: '280',
    attempts: '420',
    passingYards: '3850',
    completionPct: '66.7',
    passingAvg: '9.2',
    passingTDs: '28',
    interceptions: '12',
    passingLng: '65',
    sacks: '32',
    rushingAttempts: '85',
    rushingYards: '450',
    rushingAvg: '5.3',
    rushingTDs: '6',
    rushingLng: '28',
    fumbles: '3',
  };

  const mockRBStats: PlayerStats = {
    rushingAttempts: '180',
    rushingYards: '850',
    rushingAvg: '4.7',
    rushingTDs: '8',
    rushingLng: '45',
    fumbles: '2',
    receptions: '45',
    targets: '65',
    receivingYards: '420',
    receivingAvg: '9.3',
    receivingTDs: '3',
    receivingLng: '28',
    firstDowns: '22',
  };

  const mockWRStats: PlayerStats = {
    receptions: '85',
    targets: '125',
    receivingYards: '1200',
    receivingAvg: '14.1',
    receivingTDs: '8',
    receivingLng: '45',
    firstDowns: '48',
    rushingAttempts: '5',
    rushingYards: '25',
    rushingAvg: '5.0',
    rushingTDs: '0',
    rushingLng: '15',
    fumbles: '0',
  };

  const emptyStats: PlayerStats = {
    completions: '-',
    attempts: '-',
    passingYards: '-',
    completionPct: '-',
    passingAvg: '-',
    passingTDs: '-',
    interceptions: '-',
    passingLng: '-',
    sacks: '-',
    rushingAttempts: '-',
    rushingYards: '-',
    rushingAvg: '-',
    rushingTDs: '-',
    rushingLng: '-',
    fumbles: '-',
    receptions: '-',
    targets: '-',
    receivingYards: '-',
    receivingAvg: '-',
    receivingTDs: '-',
    receivingLng: '-',
    firstDowns: '-',
  };

  const pos = position.toUpperCase();
  const baseMock = pos === 'QB' ? mockQBStats : pos === 'RB' ? mockRBStats : mockWRStats;

  const stats: Record<string, PlayerStats> = {
    projection: baseMock,
    '2025': baseMock,
  };

  if (availableYears > 1) stats['2024'] = emptyStats;
  if (availableYears > 2) stats['2023'] = emptyStats;
  if (availableYears > 3) stats['2022'] = emptyStats;

  return stats;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PlayerExpandedCard({
  player,
  onDraft,
  onClose,
  isMyTurn = false,
  showDraftButton = true,
  style = {},
}: PlayerExpandedCardProps): React.ReactElement | null {
  if (!player) return null;

  const { name, team, position, adp, projectedPoints, stats } = player;
  const byeWeek = (BYE_WEEKS as Record<string, number>)[team] || 'N/A';
  const teamGradient = createTeamGradient(team);
  const isLightBgTeam = LIGHT_BG_TEAMS.includes(team);

  const handleDraft = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    onDraft?.(player);
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    onClose?.();
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    e.currentTarget.style.display = 'none';
  };

  // Calculate available years based on player data
  const getAvailableYears = (): number => {
    if (stats) return Object.keys(stats).length;
    // Mock calculation for demo
    let availableYears = 3;
    if (name?.includes('rookie') || name?.includes('2024')) {
      availableYears = 1;
    } else if (name?.length % 3 === 0) {
      availableYears = 2;
    } else if (name?.length % 4 === 0) {
      availableYears = 4;
    }
    return availableYears;
  };

  const availableYears = getAvailableYears();
  const displayStats = stats || getMockStats(position, availableYears);
  const isStandardPosition = ['QB', 'RB', 'WR', 'TE'].includes(position.toUpperCase());

  return (
    <div
      className={styles.card}
      data-light-bg={isLightBgTeam ? 'true' : undefined}
      style={{
        '--card-gradient': teamGradient.firstGradient,
        '--card-border-color': teamGradient.primaryColor,
        ...style,
      } as React.CSSProperties}
      onClick={handleCardClick}
    >
      {/* Header: Logo + Badges + Draft Button */}
      <div className={styles.header}>
        {/* Team Logo */}
        <Image
          className={styles.teamLogo}
          src={`/logos/nfl/${team?.toLowerCase()}.png`}
          alt={`${team} logo`}
          width={40}
          height={40}
          unoptimized
        />

        {/* Bye / ADP / Proj Badges */}
        <div className={styles.badgesContainer}>
          <div className={styles.badgesRow}>
            <div className={styles.badge} data-type="bye">
              <div className={styles.badgeLabel}>Bye</div>
              <div className={styles.badgeValue}>{byeWeek}</div>
            </div>
            <div className={styles.badge} data-type="adp">
              <div className={styles.badgeLabel}>ADP</div>
              <div className={styles.badgeValue}>
                {parseFloat(String(adp || 0)).toFixed(1)}
              </div>
            </div>
            <div className={styles.badge} data-type="proj">
              <div className={styles.badgeLabel}>Proj</div>
              <div className={styles.badgeValue}>
                {parseFloat(String(projectedPoints || 0)).toFixed(1) || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Draft Button */}
        {showDraftButton && (
          <button
            className={styles.draftButton}
            data-active={isMyTurn ? 'true' : undefined}
            onClick={handleDraft}
          >
            DRAFT
          </button>
        )}
      </div>

      {/* Stats Table */}
      <div className={styles.statsSection}>
        {isStandardPosition ? (
          <StatsTable
            position={position}
            stats={displayStats}
            team={team}
          />
        ) : (
          <DefaultStatsTable />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// DEFAULT STATS TABLE (for non-standard positions)
// ============================================================================

function DefaultStatsTable(): React.ReactElement {
  return (
    <div className={styles.defaultStats}>
      <div className={styles.defaultStatsHeader}>
        <div>DATE</div>
        <div>REC</div>
        <div>YDS</div>
        <div>TD</div>
        <div>ATT</div>
        <div>TOT</div>
      </div>
      <div className={styles.defaultStatsRow}>
        <div>2025</div>
        <div>-</div>
        <div>-</div>
        <div>-</div>
        <div>-</div>
        <div>-</div>
      </div>
    </div>
  );
}
