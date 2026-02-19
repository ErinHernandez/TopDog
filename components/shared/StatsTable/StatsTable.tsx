/**
 * StatsTable - Reusable stats table component
 *
 * Uses CSS Grid instead of absolute positioning for better maintainability.
 * Supports QB, RB, and WR/TE layouts.
 *
 * @example
 * ```tsx
 * <StatsTable
 *   position="QB"
 *   stats={playerStats}
 *   team="KC"
 * />
 * ```
 */

import React from 'react';

import styles from '@/styles/components/stats-table.module.css';

// ============================================================================
// TYPES
// ============================================================================

export interface PlayerStats {
  completions?: number | string;
  attempts?: number | string;
  passingYards?: number | string;
  completionPct?: number | string;
  passingAvg?: number | string;
  passingTDs?: number | string;
  interceptions?: number | string;
  passingLng?: number | string;
  sacks?: number | string;
  rushingAttempts?: number | string;
  rushingYards?: number | string;
  rushingAvg?: number | string;
  rushingTDs?: number | string;
  rushingLng?: number | string;
  fumbles?: number | string;
  receptions?: number | string;
  targets?: number | string;
  receivingYards?: number | string;
  receivingAvg?: number | string;
  receivingTDs?: number | string;
  receivingLng?: number | string;
  firstDowns?: number | string;
  [key: string]: unknown;
}

export interface StatsTableProps {
  /** Player position for layout selection */
  position: 'QB' | 'RB' | 'WR' | 'TE' | string;
  /** Stats data keyed by year (e.g., { '2024': {...}, 'projection': {...} }) */
  stats?: Record<string, PlayerStats>;
  /** Team abbreviation for styling (light bg teams get dark text) */
  team?: string;
  /** Additional className */
  className?: string;
}

// Teams with light backgrounds that need dark header text
const LIGHT_BG_TEAMS = ['DET'];

// ============================================================================
// COLUMN CONFIGURATIONS
// ============================================================================

const QB_COLUMNS = [
  'YEAR', 'CMP', 'ATT', 'YDS', 'CMP%', 'AVG', 'TD', 'INT', 'LNG', 'SACK',
  'CAR', 'YDS', 'AVG', 'TD', 'LNG', 'FUM'
];

const QB_STAT_KEYS: (keyof PlayerStats | 'year')[] = [
  'year', 'completions', 'attempts', 'passingYards', 'completionPct', 'passingAvg',
  'passingTDs', 'interceptions', 'passingLng', 'sacks',
  'rushingAttempts', 'rushingYards', 'rushingAvg', 'rushingTDs', 'rushingLng', 'fumbles'
];

const RB_COLUMNS = [
  'YEAR', 'CAR', 'YDS', 'AVG', 'TD', 'LNG', 'FUM',
  'REC', 'TGTS', 'YDS', 'AVG', 'TD', 'LNG', 'FD'
];

const RB_STAT_KEYS: (keyof PlayerStats | 'year')[] = [
  'year', 'rushingAttempts', 'rushingYards', 'rushingAvg', 'rushingTDs', 'rushingLng', 'fumbles',
  'receptions', 'targets', 'receivingYards', 'receivingAvg', 'receivingTDs', 'receivingLng', 'firstDowns'
];

const WRTE_COLUMNS = [
  'YEAR', 'REC', 'TGTS', 'YDS', 'AVG', 'TD', 'LNG', 'FD',
  'CAR', 'YDS', 'AVG', 'TD', 'LNG', 'FUM'
];

const WRTE_STAT_KEYS: (keyof PlayerStats | 'year')[] = [
  'year', 'receptions', 'targets', 'receivingYards', 'receivingAvg', 'receivingTDs', 'receivingLng', 'firstDowns',
  'rushingAttempts', 'rushingYards', 'rushingAvg', 'rushingTDs', 'rushingLng', 'fumbles'
];

// ============================================================================
// HELPERS
// ============================================================================

function getColumnsForPosition(position: string): string[] {
  const pos = position.toUpperCase();
  if (pos === 'QB') return QB_COLUMNS;
  if (pos === 'RB') return RB_COLUMNS;
  if (pos === 'WR' || pos === 'TE') return WRTE_COLUMNS;
  return WRTE_COLUMNS; // Default to WR/TE
}

function getStatKeysForPosition(position: string): (keyof PlayerStats | 'year')[] {
  const pos = position.toUpperCase();
  if (pos === 'QB') return QB_STAT_KEYS;
  if (pos === 'RB') return RB_STAT_KEYS;
  if (pos === 'WR' || pos === 'TE') return WRTE_STAT_KEYS;
  return WRTE_STAT_KEYS; // Default to WR/TE
}

function getPositionClass(position: string): string {
  const pos = position.toUpperCase();
  if (pos === 'QB') return 'qb';
  if (pos === 'RB') return 'rb';
  if (pos === 'WR') return 'wr';
  if (pos === 'TE') return 'te';
  return 'default';
}

function sortStatsEntries(stats?: Record<string, PlayerStats>): Array<[string, PlayerStats]> {
  if (!stats) return [];

  const entries = Object.entries(stats);

  return entries.sort(([yearA], [yearB]) => {
    // Projection always comes first
    if (yearA === 'projection') return -1;
    if (yearB === 'projection') return 1;

    // Then sort years in descending order
    const numA = parseInt(yearA, 10);
    const numB = parseInt(yearB, 10);

    if (!isNaN(numA) && !isNaN(numB)) {
      return numB - numA;
    }

    return yearA.localeCompare(yearB);
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StatsTable({
  position,
  stats,
  team = '',
  className = '',
}: StatsTableProps): React.ReactElement {
  const columns = getColumnsForPosition(position);
  const statKeys = getStatKeysForPosition(position);
  const positionClass = getPositionClass(position);
  const isLightBgTeam = LIGHT_BG_TEAMS.includes(team.toUpperCase());
  const sortedStats = sortStatsEntries(stats);

  return (
    <div
      className={`${styles.statsTable} ${className}`}
      data-position={positionClass}
      data-light-bg={isLightBgTeam ? 'true' : undefined}
    >
      <div className={styles.statsTableInner}>
        {/* Header Row */}
        <div className={styles.statsHeader}>
          {columns.map((col, i) => (
            <div
              key={col + i}
              className={i === 0 ? styles.cellLeft : styles.cell}
            >
              {col}
            </div>
          ))}
        </div>

        {/* Data Rows */}
        <div className={styles.statsRowsWrapper}>
          {sortedStats.map(([year, rowStats], rowIndex) => (
            <div key={`${year}-${rowIndex}`} className={styles.statsRow}>
              {statKeys.map((key, colIndex) => {
                const value = key === 'year' ? year : (rowStats[key] ?? '-');
                return (
                  <div
                    key={`${year}-${key}-${colIndex}`}
                    className={colIndex === 0 ? styles.cellLeft : styles.cell}
                  >
                    {String(value)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StatsTable;
