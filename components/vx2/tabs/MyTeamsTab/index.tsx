/**
 * MyTeamsTab - VX2 My Teams Tab
 * 
 * Placeholder for migration from VX.
 */

import React from 'react';

import { cn } from '@/lib/styles';

import styles from './index.module.css';

const MOCK_TEAMS = [
  { id: '1', name: 'Team Alpha', tournament: 'Best Ball Mania V', rank: 12, players: 18 },
  { id: '2', name: 'Team Bravo', tournament: 'Best Ball Mania V', rank: 45, players: 18 },
  { id: '3', name: 'Team Charlie', tournament: 'Underdog Championship', rank: 8, players: 18 },
];

export default function MyTeamsTab(): React.ReactElement {
  return (
    <div className={cn("flex-1 flex flex-col", styles.container)}>
      {/* Header */}
      <div className={`px-4 py-3 ${styles.header}`}>
        <h1 className={styles.title}>Teams</h1>
      </div>

      {/* Search */}
      <div className="p-4">
        <input
          type="text"
          placeholder="Search teams..."
          className={styles.searchInput}
        />
      </div>

      {/* Teams List */}
      <div className="flex-1 overflow-y-auto px-4">
        {MOCK_TEAMS.map((team) => (
          <div key={team.id} className={styles.teamCard}>
            <div>
              <h3 className={styles.teamName}>{team.name}</h3>
              <p className={styles.tournament}>{team.tournament}</p>
            </div>
            <div className="text-right">
              <div className={styles.rank}>#{team.rank}</div>
              <div className={styles.playerCount}>{team.players} players</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

