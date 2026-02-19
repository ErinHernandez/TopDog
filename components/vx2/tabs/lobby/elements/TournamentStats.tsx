/**
 * TournamentStats
 * 
 * Renders the 3-column stats grid (Entry, Entries, Prize).
 * 
 * @module TournamentStats
 */

import React from 'react';

import { cn } from '@/lib/styles';

import styles from './TournamentStats.module.css';

export interface TournamentStatsProps {
  /** Entry fee (e.g., "$25", "Free") */
  entryFee: string;
  /** Number of entries (e.g., "1,234" or 1234) */
  entries: string | number;
  /** First place prize (e.g., "$10,000") */
  prize: string;
}

interface StatItemProps {
  label: string;
  value: string | number;
}

function StatItem({ label, value }: StatItemProps): React.ReactElement {
  return (
    <div
      className={cn(styles.statItem)}
    >
      <span className={cn(styles.statValue)}>
        {value}
      </span>

      <span className={cn(styles.statLabel)}>
        {label}
      </span>
    </div>
  );
}

export function TournamentStats({
  entryFee,
  entries,
  prize,
}: TournamentStatsProps): React.ReactElement {
  return (
    <div
      className={cn(styles.container)}
    >
      <StatItem label="Entry" value={entryFee} />
      <StatItem label="Entries" value={entries} />
      <StatItem label="1st Place" value={prize} />
    </div>
  );
}

export default TournamentStats;
