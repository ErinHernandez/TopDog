/**
 * ExposureTab - VX2 Exposure Tab
 * 
 * Placeholder for migration from VX.
 */

import React from 'react';
import { BG_COLORS, TEXT_COLORS, POSITION_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../core/constants/sizes';

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
          Player Exposure
        </h1>
      </div>

      {/* Stats Summary */}
      <div className="flex gap-3 p-4">
        {[
          { label: 'Teams', value: '14' },
          { label: 'Players', value: '252' },
          { label: 'Avg Exp', value: '48%' },
        ].map((stat) => (
          <div 
            key={stat.label}
            className="flex-1 p-3 text-center"
            style={{
              backgroundColor: BG_COLORS.secondary,
              borderRadius: `${RADIUS.md}px`,
            }}
          >
            <div 
              className="font-bold text-lg"
              style={{ color: TEXT_COLORS.primary }}
            >
              {stat.value}
            </div>
            <div style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.xs}px` }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Player List */}
      <div className="flex-1 overflow-y-auto px-4">
        {MOCK_EXPOSURE.map((player, index) => (
          <div
            key={player.name}
            className="mb-2 p-3 flex items-center gap-3"
            style={{
              backgroundColor: BG_COLORS.secondary,
              borderRadius: `${RADIUS.md}px`,
            }}
          >
            {/* Position Badge */}
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs"
              style={{
                backgroundColor: POSITION_COLORS[player.position as keyof typeof POSITION_COLORS] || '#6B7280',
                color: '#000',
              }}
            >
              {player.position}
            </div>
            
            {/* Player Info */}
            <div className="flex-1">
              <div 
                className="font-medium"
                style={{ color: TEXT_COLORS.primary }}
              >
                {player.name}
              </div>
              <div style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.xs}px` }}>
                {player.team} - {player.teams} teams
              </div>
            </div>
            
            {/* Exposure */}
            <div 
              className="font-bold"
              style={{ color: TEXT_COLORS.primary }}
            >
              {player.exposure}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

