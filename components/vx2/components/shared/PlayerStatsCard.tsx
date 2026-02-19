/**
 * PlayerStatsCard - Reusable player statistics card component
 * 
 * Displays player stats with team gradient background, badges, and position-specific stats tables.
 * Can be used in draft room, my teams, or other contexts.
 * 
 * Features:
 * - Team gradient background with primary color border
 * - Team logo + Bye/ADP/Proj badges + optional Draft button
 * - Position-specific stats tables (QB, RB, WR/TE)
 * - Historical stats from 2021-2024 seasons
 * 
 * A-Grade Standards:
 * - TypeScript: Full type coverage
 * - Constants: VX2 color/size system
 * - Accessibility: ARIA labels
 */

import Image from 'next/image';
import React, { useEffect, useState } from 'react';

import { createTeamGradient } from '@/lib/gradientUtils';
import * as historicalService from '@/lib/historicalStats/service';
import type { SeasonStats } from '@/lib/historicalStats/types';
import { BYE_WEEKS } from '@/lib/nflConstants';

import { createScopedLogger } from '../../../../lib/clientLogger';
import { PLAYER_STATS_THEME } from '../../core/constants/colors';
import { generatePlayerId } from '../../draft-room/utils';

import type { Position } from './display/types';
import styles from './PlayerStatsCard.module.css';

const logger = createScopedLogger('[PlayerStatsCard]');

// ============================================================================
// TYPES
// ============================================================================

// Use shared Position type
type FantasyPosition = Position;

export interface PlayerStatsCardProps {
  /** Player data to display */
  player: {
    id?: string;
    name: string;
    team: string;
    position: FantasyPosition | string;
    adp?: number | string | null;
    projectedPoints?: number | string | null;
    bye?: number;
  };
  /** Whether to show draft button */
  showDraftButton?: boolean;
  /** Whether it's the user's turn to draft (affects button styling) */
  isMyTurn?: boolean;
  /** Callback when draft button clicked */
  onDraft?: (player: PlayerStatsCardProps['player']) => void;
  /** Callback when card is closed/clicked */
  onClose?: () => void;
  /** Pre-fetched historical stats (optional, will fetch if not provided) */
  historicalStats?: Map<number, SeasonStats | null>;
  /** Whether to fetch stats internally */
  fetchStats?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Teams with light backgrounds requiring dark text
const LIGHT_BG_TEAMS = ['DET', 'LAC', 'KC', 'MIA', 'PHI', 'LAR'];

const PX = {
  // Header
  headerPaddingTop: 6,
  headerPaddingBottom: 4,
  headerPaddingX: 12,
  logoSize: 55,
  
  // Badges
  badgeLabelSize: 12,
  badgeValueSize: 14,
  badgeMinWidths: { bye: 35, adp: 45, proj: 40 },
  badgeGap: 16,
  
  // Draft button
  draftButtonPaddingX: 17,
  draftButtonPaddingY: 8,
  draftButtonFontSize: 12,
  
  // Stats table
  headerHeight: 24,
  rowHeight: 20,
  yearColumnWidth: 35,
  yearLabelLeft: 10,
} as const;

const COLORS = PLAYER_STATS_THEME;

// ============================================================================
// STATS COLUMN CONFIGURATIONS
// ============================================================================

const WRTE_COLUMNS = [
  { label: 'YEAR', left: 6, width: 35 },
  { label: 'REC', left: 57, width: 30 },
  { label: 'TGTS', left: 99, width: 35 },
  { label: 'YDS', left: 146, width: 35 },
  { label: 'AVG', left: 193, width: 30 },
  { label: 'TD', left: 235, width: 25 },
  { label: 'CAR', left: 277, width: 30 },
  { label: 'YDS', left: 319, width: 35 },
  { label: 'AVG', left: 366, width: 30 },
  { label: 'TD', left: 408, width: 25 },
  { label: 'FUM', left: 445, width: 30 },
] as const;

const RB_COLUMNS = [
  { label: 'YEAR', left: 6, width: 35 },
  { label: 'CAR', left: 57, width: 30 },
  { label: 'YDS', left: 99, width: 35 },
  { label: 'AVG', left: 146, width: 30 },
  { label: 'TD', left: 188, width: 25 },
  { label: 'FUM', left: 225, width: 30 },
  { label: 'REC', left: 267, width: 30 },
  { label: 'TGTS', left: 309, width: 35 },
  { label: 'YDS', left: 356, width: 35 },
  { label: 'AVG', left: 403, width: 30 },
  { label: 'TD', left: 445, width: 25 },
] as const;

const QB_COLUMNS = [
  { label: 'YEAR', left: 6, width: 40 },
  { label: 'CMP', left: 62, width: 35 },
  { label: 'ATT', left: 109, width: 35 },
  { label: 'YDS', left: 156, width: 40 },
  { label: 'CMP%', left: 208, width: 40 },
  { label: 'AVG', left: 260, width: 35 },
  { label: 'TD', left: 307, width: 30 },
  { label: 'INT', left: 349, width: 30 },
  { label: 'SACK', left: 391, width: 40 },
  { label: 'CAR', left: 443, width: 30 },
  { label: 'YDS', left: 485, width: 35 },
  { label: 'AVG', left: 532, width: 30 },
  { label: 'TD', left: 574, width: 25 },
  { label: 'FUM', left: 611, width: 30 },
] as const;

// Historical seasons to display (most recent first, excludes current incomplete season)
const HISTORICAL_SEASONS = [2024, 2023, 2022, 2021] as const;

// ============================================================================
// STATS FORMATTING HELPERS
// ============================================================================

/**
 * Format a stat value - show "0" if player played but stat is missing, "-" only if no season data
 */
function formatStat(value: number | undefined | null, decimals?: number): string {
  if (value === undefined || value === null) return '0';
  if (decimals !== undefined) return value.toFixed(decimals);
  return value.toString();
}

/**
 * Format WR/TE stats for display
 * Columns: REC, TGTS, YDS, AVG, TD, CAR, YDS, AVG, TD, FUM
 */
function formatWRTEStats(stats: SeasonStats | null): string[] {
  if (!stats) return ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-'];
  
  const rec = stats.receiving;
  const rush = stats.rushing;
  
  return [
    formatStat(rec?.receptions),
    formatStat(rec?.targets),
    formatStat(rec?.yards),
    rec?.yardsPerReception ? formatStat(rec.yardsPerReception, 1) : '0.0',
    formatStat(rec?.touchdowns),
    formatStat(rush?.attempts),
    formatStat(rush?.yards),
    rush?.yardsPerAttempt ? formatStat(rush.yardsPerAttempt, 1) : '0.0',
    formatStat(rush?.touchdowns),
    formatStat(rush?.fumbles),
  ];
}

/**
 * Format RB stats for display
 * Columns: CAR, YDS, AVG, TD, FUM, REC, TGTS, YDS, AVG, TD
 */
function formatRBStats(stats: SeasonStats | null): string[] {
  if (!stats) return ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-'];
  
  const rush = stats.rushing;
  const rec = stats.receiving;
  
  return [
    formatStat(rush?.attempts),
    formatStat(rush?.yards),
    rush?.yardsPerAttempt ? formatStat(rush.yardsPerAttempt, 1) : '0.0',
    formatStat(rush?.touchdowns),
    formatStat(rush?.fumbles),
    formatStat(rec?.receptions),
    formatStat(rec?.targets),
    formatStat(rec?.yards),
    rec?.yardsPerReception ? formatStat(rec.yardsPerReception, 1) : '0.0',
    formatStat(rec?.touchdowns),
  ];
}

/**
 * Format QB stats for display
 * Columns: CMP, ATT, YDS, CMP%, AVG, TD, INT, SACK, CAR, YDS, AVG, TD, FUM
 */
function formatQBStats(stats: SeasonStats | null): string[] {
  if (!stats) return ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'];
  
  const pass = stats.passing;
  const rush = stats.rushing;
  
  return [
    formatStat(pass?.completions),
    formatStat(pass?.attempts),
    formatStat(pass?.yards),
    pass?.completionPct ? formatStat(pass.completionPct, 1) : '0.0',
    pass?.yardsPerAttempt ? formatStat(pass.yardsPerAttempt, 1) : '0.0',
    formatStat(pass?.touchdowns),
    formatStat(pass?.interceptions),
    formatStat(pass?.sacks),
    formatStat(rush?.attempts),
    formatStat(rush?.yards),
    rush?.yardsPerAttempt ? formatStat(rush.yardsPerAttempt, 1) : '0.0',
    formatStat(rush?.touchdowns),
    formatStat(rush?.fumbles),
  ];
}

/**
 * Format stats based on position
 */
function formatStatsForPosition(position: string, stats: SeasonStats | null): string[] {
  if (position === 'QB') return formatQBStats(stats);
  if (position === 'RB') return formatRBStats(stats);
  return formatWRTEStats(stats);
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface BadgeProps {
  label: string;
  value: string | number;
  minWidth: number;
  labelColor: string;
}

function Badge({ label, value, minWidth, labelColor }: BadgeProps): React.ReactElement {
  return (
    <div className={styles.badge} style={{ '--badge-min-width': `${minWidth}px`, '--label-color': labelColor } as React.CSSProperties}>
      <div className={styles.badgeLabel}>{label}</div>
      <div className={styles.badgeValue}>{value}</div>
    </div>
  );
}

interface StatsHeaderProps {
  columns: readonly { label: string; left: number; width: number }[];
  labelColor: string;
  lineColor: string;
}

function StatsHeader({ columns, labelColor, lineColor }: StatsHeaderProps): React.ReactElement {
  return (
    <div
      className={styles.statsHeader}
      style={{
        '--header-label-color': labelColor,
        '--line-color': lineColor,
      } as React.CSSProperties}
    >
      {/* Bottom border line */}
      <div className={styles.statsHeaderLine} />

      {/* Column headers */}
      {columns.map((col, i) => (
        <div
          key={col.label + i}
          className={styles.statsHeaderColumn}
          style={{
            '--column-left': `${col.left}px`,
            '--column-width': `${col.width}px`,
            '--column-text-align': i === 0 ? 'left' : 'center',
            '--column-justify': i === 0 ? 'flex-start' : 'center',
          } as React.CSSProperties}
        >
          {col.label}
        </div>
      ))}
    </div>
  );
}

interface StatsRowProps {
  label: string;
  values: string[];
  columns: readonly { label: string; left: number; width: number }[];
}

function StatsRow({ label, values, columns }: StatsRowProps): React.ReactElement {
  // Skip the YEAR column (index 0) for positioning values
  const dataColumns = columns.slice(1);

  return (
    <div
      className={styles.statsRow}
      style={{
        '--row-height': `${PX.rowHeight}px`,
      } as React.CSSProperties}
    >
      {/* Year label */}
      <div
        className={styles.statsRowLabel}
        style={{
          '--year-label-left': `${PX.yearLabelLeft}px`,
          '--year-column-width': `${PX.yearColumnWidth}px`,
        } as React.CSSProperties}
      >
        {label}
      </div>

      {/* Data values */}
      {values.map((val, i) => (
        <div
          key={i}
          className={styles.statsRowValue}
          style={{
            '--value-left': `${dataColumns[i]?.left ?? 0}px`,
            '--value-width': `${dataColumns[i]?.width ?? 30}px`,
          } as React.CSSProperties}
          data-index={i}
        >
          {val}
        </div>
      ))}
    </div>
  );
}

interface PositionStatsTableProps {
  position: FantasyPosition | string;
  team: string;
  historicalStats: Map<number, SeasonStats | null>;
  projectedStats?: string[] | null;
}

function PositionStatsTable({ position, team, historicalStats, projectedStats }: PositionStatsTableProps): React.ReactElement {
  const isLightBg = LIGHT_BG_TEAMS.includes(team);
  const labelColor = isLightBg ? COLORS.headerLabelDark : COLORS.headerLabel;
  const lineColor = isLightBg ? COLORS.lineColorDark : COLORS.lineColor;
  
  // Select columns based on position
  let columns: readonly { label: string; left: number; width: number }[];
  let minWidth: number;
  let emptyDataLength: number;
  
  if (position === 'QB') {
    columns = QB_COLUMNS;
    minWidth = 650;
    emptyDataLength = 13;
  } else if (position === 'RB') {
    columns = RB_COLUMNS;
    minWidth = 480;
    emptyDataLength = 10;
  } else {
    columns = WRTE_COLUMNS;
    minWidth = 480;
    emptyDataLength = 10;
  }
  
  const emptyData = Array(emptyDataLength).fill('-');
  
  // Format historical data for each season
  const seasonRows = HISTORICAL_SEASONS.map(season => {
    const stats = historicalStats.get(season);
    return {
      label: season.toString(),
      values: stats ? formatStatsForPosition(position, stats) : emptyData,
    };
  });
  
  return (
    <div
      className={styles.statsTable}
      style={{
        '--stats-table-min-width': `${minWidth}px`,
      } as React.CSSProperties}
    >
      <StatsHeader columns={columns} labelColor={labelColor} lineColor={lineColor} />

      <div className={styles.statsRowPadding}>
        {/* Projected stats row - placeholder until projection system integrated */}
        <StatsRow label="Proj." values={projectedStats ?? emptyData} columns={columns} />

        {/* Historical stats rows */}
        {seasonRows.map(row => (
          <StatsRow key={row.label} label={row.label} values={row.values} columns={columns} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PlayerStatsCard({
  player,
  showDraftButton = false,
  isMyTurn = false,
  onDraft,
  onClose,
  historicalStats: providedStats,
  fetchStats = true,
}: PlayerStatsCardProps): React.ReactElement {
  // State for historical stats
  const [historicalStats, setHistoricalStats] = useState<Map<number, SeasonStats | null>>(
    providedStats || new Map()
  );
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Fetch historical stats when player changes (if fetchStats is true and stats not provided)
  useEffect(() => {
    if (!fetchStats || providedStats || !player?.name) {
      if (providedStats) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional setState in effect
        setHistoricalStats(providedStats);
      }
      return;
    }
    
    const playerId = generatePlayerId(player.name);
    setLoadingStats(true);
    
    // Fetch all historical seasons for this player
    historicalService.getPlayerAllSeasons(playerId)
      .then(seasons => {
        const statsMap = new Map<number, SeasonStats | null>();
        // Initialize all historical seasons as null
        HISTORICAL_SEASONS.forEach(year => statsMap.set(year, null));
        // Populate with actual data
        seasons.forEach(stat => {
          if (HISTORICAL_SEASONS.includes(stat.season as typeof HISTORICAL_SEASONS[number])) {
            statsMap.set(stat.season, stat);
          }
        });
        setHistoricalStats(statsMap);
      })
      .catch(err => {
        logger.warn('Failed to load historical stats', { error: String(err) });
        setHistoricalStats(new Map());
      })
      .finally(() => setLoadingStats(false));
  }, [player?.name, fetchStats, providedStats]);
  
  if (!player) return <></>;
  
  const { name, team, position, adp, projectedPoints, bye } = player;
  const byeWeek = bye ?? ((BYE_WEEKS as Record<string, number>)[team] ?? 'N/A');
  const teamGradient = createTeamGradient(team);
  const isLightBg = LIGHT_BG_TEAMS.includes(team);
  const labelColor = isLightBg ? COLORS.headerLabelDark : COLORS.headerLabel;
  
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
  
  return (
    <div
      onClick={handleCardClick}
      className={styles.cardWrapper}
      style={{
        '--team-gradient': teamGradient.firstGradient,
      } as React.CSSProperties}
    >
      {/* Header: Logo + Badges + Draft Button */}
      <div className={styles.header}
        style={{
          '--header-padding-top': `${PX.headerPaddingTop}px`,
          '--header-padding-bottom': `${PX.headerPaddingBottom}px`,
          '--header-padding-x': `${PX.headerPaddingX}px`,
        } as React.CSSProperties}
      >
        {/* Team Logo */}
        <Image
          src={`/logos/nfl/${team?.toLowerCase()}.png`}
          alt={`${team} logo`}
          className={styles.teamLogo}
          width={55}
          height={55}
          unoptimized
          style={{
            '--logo-size': `${PX.logoSize}px`,
          } as React.CSSProperties}
          onError={handleImageError}
        />

        {/* Badges */}
        <div className={styles.badgesContainer}
          style={{
            '--badge-gap': `${PX.badgeGap}px`,
          } as React.CSSProperties}
        >
          <Badge label="Bye" value={byeWeek} minWidth={PX.badgeMinWidths.bye} labelColor={labelColor} />
          <Badge
            label="ADP"
            value={adp ? parseFloat(String(adp)).toFixed(1) : 'N/A'}
            minWidth={PX.badgeMinWidths.adp}
            labelColor={labelColor}
          />
          <Badge
            label="Proj"
            value={projectedPoints ? parseFloat(String(projectedPoints)).toFixed(1) : 'N/A'}
            minWidth={PX.badgeMinWidths.proj}
            labelColor={labelColor}
          />
        </div>

        {/* Draft Button (optional) */}
        {showDraftButton && (
          <button
            onClick={handleDraft}
            aria-label={`Draft ${name}`}
            className={styles.draftButton}
            style={{
              '--draft-button-padding-y': `${PX.draftButtonPaddingY}px`,
              '--draft-button-padding-x': `${PX.draftButtonPaddingX}px`,
              '--draft-button-font-size': `${PX.draftButtonFontSize}px`,
              '--draft-button-bg': isMyTurn
                ? 'url(/wr_blue.png)'
                : COLORS.draftButtonInactive,
              '--draft-button-bg-size': isMyTurn ? 'cover' : 'auto',
              '--draft-button-opacity': isMyTurn ? '1' : '0.7',
            } as React.CSSProperties}
          >
            DRAFT
          </button>
        )}
      </div>

      {/* Stats Table - scrollable area (click doesn't close card) */}
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className={`${styles.statsContainer} hide-scrollbar`}
      >
        <PositionStatsTable
          position={position as FantasyPosition}
          team={team}
          historicalStats={historicalStats}
        />
      </div>
    </div>
  );
}

