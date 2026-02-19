/**
 * TeamDetailsView - Shows detailed roster for a selected team
 *
 * Extracted from MyTeamsTab for maintainability.
 */

import React, { useState } from 'react';

import { createScopedLogger } from '../../../../lib/clientLogger';
import { BYE_WEEKS } from '../../../../lib/nflConstants';
import { SHARE_TYPES, generateShareData } from '../../../../lib/shareConfig';
import { POSITIONS } from '../../../draft/v3/constants/positions';
import PositionBadge from '../../../draft/v3/mobile/apple/components/PositionBadge';
import { PlayerDropdown } from '../../../ui';
import ShareButton from '../../ShareButton';

import { getTotalPlayers } from './mockTeamData';


const logger = createScopedLogger('[TeamDetails]');

export default function TeamDetailsView({
  team,
  teams,
  setTeams,
  setDraftBoardTeam,
  setShowDraftBoard
}) {
  const [editingTeamName, setEditingTeamName] = useState(null);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTeamMenu, setShowTeamMenu] = useState(false);

  // Generate detailed roster text for sharing
  const generateRosterShareText = (team) => {
    if (!team || !team.players) {
      return `Check out my "${team?.name || 'team'}" roster!`;
    }
    
    try {
      let rosterText = `Check out my "${team.name || 'team'}" roster!\n\n`;
      
      POSITIONS.forEach(position => {
        if (team.players[position] && Array.isArray(team.players[position]) && team.players[position].length > 0) {
          const players = team.players[position];
          rosterText += `${position}s: ${players.map(p => `${p?.name || 'Unknown'} (${p?.team || 'N/A'})`).join(', ')}\n`;
        }
      });
      
      rosterText += `\nTotal: ${getTotalPlayers(team)} players in the ${team.tournament || 'TopDog International'} tournament.`;
      return rosterText;
    } catch (error) {
      logger.error('Error generating roster share text', error, { teamId: team?.id });
      return `Check out my "${team.name || 'team'}" roster!`;
    }
  };

  // Team name editing
  const startEditingTeamName = (teamId) => {
    if (!teamId || !Array.isArray(teams)) return;
    const foundTeam = teams.find(t => t && t.id === teamId);
    if (foundTeam) {
      setEditingTeamName(teamId);
      setTeamNameInput(foundTeam.name || '');
    }
  };

  const saveTeamName = () => {
    if (editingTeamName && teamNameInput.trim() && Array.isArray(teams)) {
      try {
        setTeams(teams.map(t => 
          t && t.id === editingTeamName 
            ? { ...t, name: teamNameInput.trim() }
            : t
        ));
        setEditingTeamName(null);
        setTeamNameInput('');
      } catch (error) {
        logger.error('Error saving team name', error);
      }
    }
  };

  const cancelEditingTeamName = () => {
    setEditingTeamName(null);
    setTeamNameInput('');
  };

  // Handle team deletion
  const handleDeleteTeam = () => {
    setTeams(teams.filter(t => t.id !== team.id));
    // Navigate back to list (this would be handled by parent component in real implementation)
  };

  // Handle team duplication
  const handleDuplicateTeam = () => {
    const duplicatedTeam = {
      ...team,
      id: `${team.id}-copy-${Date.now()}`,
      name: `${team.name} (Copy)`,
      createdAt: Date.now()
    };
    setTeams([...teams, duplicatedTeam]);
    setShowTeamMenu(false);
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  saveTeamName();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelEditingTeamName();
                }
              }}
              autoFocus
              aria-label="Team name input"
              maxLength={100}
            />
            <button 
              onClick={saveTeamName} 
              className="text-green-400 hover:text-green-300 text-lg px-2 focus:outline-none focus:ring-2 focus:ring-green-400 rounded"
              aria-label="Save team name"
            >
              OK
            </button>
            <button 
              onClick={cancelEditingTeamName} 
              className="text-red-400 hover:text-red-300 text-lg px-2 focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
              aria-label="Cancel editing team name"
            >
              X
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-3 flex-1 mr-4">
            <button
              onClick={() => startEditingTeamName(team.id)}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-800/50"
              title="Edit team name"
              aria-label="Edit team name"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-white">{team.name}</h2>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          {/* Team Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowTeamMenu(!showTeamMenu)}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800/50"
              title="Team options"
              aria-label="Team options menu"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            {showTeamMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowTeamMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 overflow-hidden min-w-[180px]">
                  <button
                    onClick={() => {
                      handleDuplicateTeam();
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Duplicate Team
                  </button>
                  <button
                    onClick={() => {
                      setShowTeamMenu(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-600/20 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Team
                  </button>
                </div>
              </>
            )}
          </div>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-sm w-full">
            <h3 id="delete-dialog-title" className="text-lg font-semibold text-white mb-2">Delete Team?</h3>
            <p id="delete-dialog-description" className="text-gray-400 text-sm mb-4">
              Are you sure you want to delete &quot;{team.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleDeleteTeam();
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Confirm delete team"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label="Cancel delete team"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
                  onPlayerSelect={(player) => logger.debug('Player selected', { player: player.name })}
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

