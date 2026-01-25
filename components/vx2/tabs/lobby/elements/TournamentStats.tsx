/**
 * TournamentStats
 * 
 * Renders the 3-column stats grid (Entry, Entries, Prize).
 * 
 * @module TournamentStats
 */

import React from 'react';
import { CARD_SPACING_V3 } from '../constants/cardSpacingV3';

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
      className="tournament-stat-item"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
      }}
    >
      {/* Value */}
      <span
        className="tournament-stat-item__value"
        style={{
          fontSize: `${CARD_SPACING_V3.statsValueFontSize}px`,
          fontWeight: 'bold',
          color: '#FFFFFF',
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      
      {/* Label */}
      <span
        className="tournament-stat-item__label"
        style={{
          fontSize: `${CARD_SPACING_V3.statsLabelFontSize}px`,
          color: 'rgba(255, 255, 255, 0.7)',
          lineHeight: 1,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
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
      className="tournament-stats"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: `${CARD_SPACING_V3.bottomStatsGap}px`,
        height: `${CARD_SPACING_V3.statsHeight}px`,
        alignContent: 'center',
      }}
    >
      <StatItem label="Entry" value={entryFee} />
      <StatItem label="Entries" value={entries} />
      <StatItem label="1st Place" value={prize} />
    </div>
  );
}

export default TournamentStats;
