/**
 * TeamRoster
 * 
 * Component for displaying a team's roster grouped by position.
 * Shows players organized by QB, RB, WR, TE, and FLEX.
 * 
 * Part of Phase 3: Extract Components
 */

import React from 'react';
import { useDraftState } from '../context/DraftRoomContext';
import { PLAYER_POOL, groupPicksByPosition } from '@/lib/playerPool';
import { POSITION_COLORS } from '@/components/draft/v3/constants/positions';

export interface TeamRosterProps {
  teamName: string;
  onPlayerClick?: (playerName: string) => void;
}

/**
 * Team roster component
 */
export function TeamRoster({ teamName, onPlayerClick }: TeamRosterProps) {
  const state = useDraftState();
  const { picks } = state;

  // Get team picks
  const teamPicks = picks.filter((pick) => pick.user === teamName);

  // Get player names
  const playerNames = teamPicks.map((pick) => pick.player);

  // Group by position
  const rosterGrouped = groupPicksByPosition(playerNames, PLAYER_POOL);

  // Get player data for display
  const getPlayerData = (playerName: string) => {
    return PLAYER_POOL.find((p) => p.name === playerName);
  };

  const positions: Array<keyof typeof rosterGrouped> = ['QB', 'RB', 'WR', 'TE'];

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-xl font-bold text-white mb-4">{teamName}&apos;s Roster</h3>

      <div className="space-y-4">
        {positions.map((position) => {
          const players = rosterGrouped[position] || [];
          const positionColor = POSITION_COLORS[position]?.primary || '#2DE2C5';

          return (
            <div key={position}>
              <div
                className="text-sm font-bold mb-2 px-2 py-1 rounded"
                style={{ backgroundColor: positionColor, color: 'white' }}
              >
                {position} ({players.length})
              </div>
              <div className="space-y-1">
                {players.length > 0 ? (
                  players.map((playerName) => {
                    const playerData = getPlayerData(playerName);
                    return (
                      <div
                        key={playerName}
                        className="flex items-center justify-between p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 transition-colors"
                        onClick={() => onPlayerClick?.(playerName)}
                      >
                        <div className="flex-1">
                          <div className="text-white font-semibold">{playerName}</div>
                          {playerData && (
                            <div className="text-xs text-gray-400">
                              {playerData.team} • Bye {playerData.bye}
                            </div>
                          )}
                        </div>
                        {playerData && (
                          <div className="text-xs text-gray-400 ml-4">
                            ADP: {playerData.adp?.toFixed(1) || 'N/A'}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-gray-500 text-sm p-2">No {position} players</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-sm text-gray-400">
          Total Players: {teamPicks.length}
        </div>
      </div>
    </div>
  );
}
