/**
 * TeamDetailsView - Shows detailed roster for a selected team
 * 
 * Extracted from MyTeamsTab for maintainability.
 */

import React, { useState } from 'react';
import { PlayerDropdown } from '../../../shared/PlayerDropdown';
import PositionBadge from '../../../draft/v3/mobile/apple/components/PositionBadge';
import ShareButton from '../../ShareButton';
import { SHARE_TYPES, generateShareData } from '../../../../lib/shareConfig';
import { BYE_WEEKS } from '../../../../lib/nflConstants';
import { POSITIONS } from '../../../draft/v3/constants/positions';
import { getTotalPlayers } from './mockTeamData';

export default function TeamDetailsView({
  team,
  teams,
  setTeams,
  setDraftBoardTeam,
  setShowDraftBoard
}) {
  const [editingTeamName, setEditingTeamName] = useState(null);
  const [teamNameInput, setTeamNameInput] = useState('');

  // Generate detailed roster text for sharing
  const generateRosterShareText = (team) => {
    let rosterText = `Check out my "${team.name}" roster!\n\n`;
    
    POSITIONS.forEach(position => {
      if (team.players[position] && team.players[position].length > 0) {
        const players = team.players[position];
        rosterText += `${position}s: ${players.map(p => `${p.name} (${p.team})`).join(', ')}\n`;
      }
    });
    
    rosterText += `\nTotal: ${getTotalPlayers(team)} players in the TopDog International tournament.`;
    return rosterText;
  };

  // Team name editing
  const startEditingTeamName = (teamId) => {
    const foundTeam = teams.find(t => t.id === teamId);
    if (foundTeam) {
      setEditingTeamName(teamId);
      setTeamNameInput(foundTeam.name);
    }
  };

  const saveTeamName = () => {
    if (editingTeamName && teamNameInput.trim()) {
      setTeams(teams.map(t => 
        t.id === editingTeamName 
          ? { ...t, name: teamNameInput.trim() }
          : t
      ));
      setEditingTeamName(null);
      setTeamNameInput('');
    }
  };

  const cancelEditingTeamName = () => {
    setEditingTeamName(null);
    setTeamNameInput('');
  };

  return (
    <div className="h-full bg-[#101927] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-4 border-gray-700" style={{ zIndex: 10 }}>
        {editingTeamName === team.id ? (
          <div className="flex items-center space-x-3 flex-1 mr-4">
            <button
              onClick={() => startEditingTeamName(team.id)}
              className="text-gray-400 hover:text-white transition-colors"
              title="Edit team name"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <input
              type="text"
              value={teamNameInput}
              onChange={(e) => setTeamNameInput(e.target.value)}
              className="flex-1 bg-gray-800/70 text-white px-3 py-2 rounded text-lg font-semibold border border-gray-600/50 focus:border-blue-500 focus:outline-none"
              onKeyPress={(e) => {
                if (e.key === 'Enter') saveTeamName();
                if (e.key === 'Escape') cancelEditingTeamName();
              }}
              autoFocus
            />
            <button onClick={saveTeamName} className="text-green-400 hover:text-green-300 text-lg px-2">
              OK
            </button>
            <button onClick={cancelEditingTeamName} className="text-red-400 hover:text-red-300 text-lg px-2">
              X
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-3 flex-1 mr-4">
            <button
              onClick={() => startEditingTeamName(team.id)}
              className="text-gray-400 hover:text-white transition-colors"
              title="Edit team name"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-white">{team.name}</h2>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <ShareButton
            shareData={generateShareData(SHARE_TYPES.ROSTER, {
              teamName: team.name,
              teamId: team.id,
              playerCount: getTotalPlayers(team),
              tournament: 'TopDog International',
              rosterText: generateRosterShareText(team),
              url: `${typeof window !== 'undefined' ? window.location.origin : ''}/teams/${team.id}`
            })}
            size="md"
            variant="default"
          />
          
          <button 
            onClick={() => {
              setDraftBoardTeam(team);
              setShowDraftBoard(true);
            }}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800/50"
            title="View Full Draft Board"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 4h2a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1zM11 4h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V5a1 1 0 011-1zM18 4h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V5a1 1 0 011-1zM4 10h2a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2a1 1 0 011-1zM11 10h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 011-1zM18 10h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 011-1zM4 16h2a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2a1 1 0 011-1zM11 16h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 011-1zM18 16h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 011-1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Player Roster */}
      <div className="flex-1 min-h-0 relative">
        <div className="h-full overflow-y-auto overflow-x-hidden space-y-0 mobile-no-scrollbar">
          {Object.entries(team.players).map(([position, players], positionIndex) => {
            const playersWithDropdownData = players.map(player => ({
              ...player,
              position: position,
              projectedPoints: player.projectedPoints || 0,
              stats: {
                '2023': { passingYards: 4000, passingTDs: 25, rushingYards: 200, rushingTDs: 3, receptions: 80, receivingYards: 1200, receivingTDs: 8 },
                '2022': { passingYards: 3800, passingTDs: 22, rushingYards: 150, rushingTDs: 2, receptions: 75, receivingYards: 1100, receivingTDs: 6 },
                'projection': { passingYards: 4200, passingTDs: 28, rushingYards: 250, rushingTDs: 4, receptions: 85, receivingYards: 1300, receivingTDs: 10 }
              }
            }));

            const isLastPosition = positionIndex === Object.entries(team.players).length - 1;

            return (
              <div key={position} className="position-group">
                <PlayerDropdown
                  players={playersWithDropdownData}
                  context="TEAM_MANAGEMENT"
                  showActions={false}
                  showStats={true}
                  renderPlayerCell={(player, index, { isExpanded, isSelected }) => {
                    const isLastPlayer = index === players.length - 1;
                    
                    return (
                      <div 
                        className={`py-1 border-t border-gray-700 hover:bg-gray-800/50 transition-all duration-300 ${isLastPlayer ? 'border-b border-gray-700' : ''}`}
                        style={{ minHeight: '18px', paddingLeft: '16px', paddingRight: '16px', zIndex: 1 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1 min-w-0">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center overflow-hidden">
                                <h3 className="font-medium text-white truncate max-w-[200px] text-sm">{player.name}</h3>
                              </div>
                              
                              <div className="text-xs text-gray-400 mt-1 flex items-center">
                                <div style={{ position: 'relative', width: '25px', height: '16px', marginRight: '6px' }}>
                                  <PositionBadge position={player.position} width="25px" height="16px" />
                                </div>
                                <span>{player.team} ({BYE_WEEKS[player.team] || 'TBD'})</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center flex-shrink-0">
                            <div className="text-sm font-medium text-gray-400 text-left">
                              <div>Proj {player.projectedPoints || '0'} pts</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                  onPlayerSelect={(player) => console.log('Player selected:', player.name)}
                />
                
                {!isLastPosition && (
                  <div className="flex justify-center py-3">
                    <div className="border-t border-gray-600 w-3/4 opacity-50"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

