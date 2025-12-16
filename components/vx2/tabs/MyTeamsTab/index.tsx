/**
 * MyTeamsTab - VX2 My Teams Tab
 * 
 * Placeholder for migration from VX.
 */

import React from 'react';
import { BG_COLORS, TEXT_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../core/constants/sizes';

const MOCK_TEAMS = [
  { id: '1', name: 'Team Alpha', tournament: 'Best Ball Mania V', rank: 12, players: 18 },
  { id: '2', name: 'Team Bravo', tournament: 'Best Ball Mania V', rank: 45, players: 18 },
  { id: '3', name: 'Team Charlie', tournament: 'Underdog Championship', rank: 8, players: 18 },
];

export default function MyTeamsTab(): React.ReactElement {
  return (
    <div 
      className="flex-1 flex flex-col"
      style={{ backgroundColor: BG_COLORS.primary }}
    >
      {/* Header */}
      <div 
        className="px-4 py-3"
        style={{ borderBottom: `1px solid rgba(255,255,255,0.1)` }}
      >
        <h1 
          className="font-bold"
          style={{ 
            color: TEXT_COLORS.primary,
            fontSize: `${TYPOGRAPHY.fontSize.xl}px`,
          }}
        >
          Teams
        </h1>
      </div>

      {/* Search */}
      <div className="p-4">
        <input
          type="text"
          placeholder="Search teams..."
          className="w-full px-4 py-3 rounded-lg"
          style={{
            backgroundColor: BG_COLORS.secondary,
            color: TEXT_COLORS.primary,
            border: 'none',
            outline: 'none',
          }}
        />
      </div>

      {/* Teams List */}
      <div className="flex-1 overflow-y-auto px-4">
        {MOCK_TEAMS.map((team) => (
          <div
            key={team.id}
            className="mb-3 p-4 flex items-center justify-between"
            style={{
              backgroundColor: BG_COLORS.secondary,
              borderRadius: `${RADIUS.lg}px`,
            }}
          >
            <div>
              <h3 
                className="font-semibold"
                style={{ color: TEXT_COLORS.primary }}
              >
                {team.name}
              </h3>
              <p style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
                {team.tournament}
              </p>
            </div>
            <div className="text-right">
              <div 
                className="font-bold"
                style={{ color: TEXT_COLORS.primary }}
              >
                #{team.rank}
              </div>
              <div style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.xs}px` }}>
                {team.players} players
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

