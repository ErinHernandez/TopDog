/**
 * ExposureTab - VX2 Exposure Tab
 * 
 * Placeholder for migration from VX.
 */

import React from 'react';

import { cn } from '@/lib/styles';

import styles from './ExposureTab.module.css';

const MOCK_EXPOSURE = [
  { name: 'Ja\'Marr Chase', team: 'CIN', position: 'WR', exposure: 85, teams: 12 },
  { name: 'Bijan Robinson', team: 'ATL', position: 'RB', exposure: 72, teams: 10 },
  { name: 'CeeDee Lamb', team: 'DAL', position: 'WR', exposure: 65, teams: 9 },
  { name: 'Travis Kelce', team: 'KC', position: 'TE', exposure: 58, teams: 8 },
  { name: 'Josh Allen', team: 'BUF', position: 'QB', exposure: 45, teams: 6 },
];

export default function ExposureTab(): React.ReactElement {
  return (
    <div
      className="flex-1 flex flex-col"
    >
      {/* Header */}
      <div
        className={cn("px-4 py-3", styles.header)}
      >
        <h1
          className={`${styles.title} font-bold`}
        >
          Player Exposure
        </h1>
      </div>

      {/* Stats Summary */}
      <div className={styles.statsContainer}>
        {[
          { label: 'Teams', value: '14' },
          { label: 'Players', value: '252' },
          { label: 'Avg Exp', value: '48%' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={styles.statCard}
          >
            <div
              className="font-bold text-lg"
            >
              {stat.value}
            </div>
            <div className={styles.statLabel}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Player List */}
      <div className={styles.playerList}>
        {MOCK_EXPOSURE.map((player, index) => (
          <div
            key={player.name}
            className={styles.playerRow}
          >
            {/* Position Badge */}
            <div
              className={styles.positionBadge}
              data-position={player.position.toLowerCase()}
            >
              {player.position}
            </div>

            {/* Player Info */}
            <div className="flex-1">
              <div
                className="font-medium"
              >
                {player.name}
              </div>
              <div className={styles.playerSubtext}>
                {player.team} - {player.teams} teams
              </div>
            </div>

            {/* Exposure */}
            <div
              className="font-bold"
            >
              {player.exposure}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

