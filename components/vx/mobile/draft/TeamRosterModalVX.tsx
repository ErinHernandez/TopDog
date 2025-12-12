/**
 * TeamRosterModalVX - Version X Team Roster Modal (TypeScript)
 * 
 * Migrated from: components/draft/v3/mobile/apple/components/TeamRosterModal.js
 * 
 * iOS-style bottom sheet modal showing a participant's team roster.
 */

import React, { useState } from 'react';
import { PLATFORM, Z_INDEX } from '../../constants/sizes';
import { Sheet, IconButton, EmptyState, Select } from '../../shared';
import type { Player, Participant, Pick } from '../../shared/types';
import PlayerStatsModalVX from './PlayerStatsModalVX';

// ============================================================================
// TYPES
// ============================================================================

export interface TeamRosterModalVXProps {
  participants?: Participant[];
  picks?: Pick[];
  selectedParticipantIndex?: number;
  onParticipantChange?: (index: number) => void;
  onClose: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STARTING_POSITIONS = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'FLEX'];
const BENCH_SLOTS = 9;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TeamRosterModalVX({
  participants = [],
  picks = [],
  selectedParticipantIndex = 0,
  onParticipantChange,
  onClose,
}: TeamRosterModalVXProps): React.ReactElement {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Get team for selected participant (snake draft logic)
  const getTeamForParticipant = (participantIndex: number): Player[] => {
    const participantCount = participants.length || 12;
    return picks.filter(pick => {
      const round = Math.ceil(pick.pickNumber / participantCount);
      const isSnakeRound = round % 2 === 0;
      const pickIndexInRound = (pick.pickNumber - 1) % participantCount;
      const pickParticipantIndex = isSnakeRound 
        ? participantCount - 1 - pickIndexInRound 
        : pickIndexInRound;
      return pickParticipantIndex === participantIndex && pick.player;
    }).map(pick => pick.player);
  };

  const team = getTeamForParticipant(selectedParticipantIndex);
  const selectedParticipant = participants[selectedParticipantIndex];

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
    setIsStatsModalOpen(true);
  };

  const handleCloseStatsModal = () => {
    setIsStatsModalOpen(false);
    setSelectedPlayer(null);
  };

  // Get player for starting lineup slot
  const getPlayerForSlot = (position: string, slotIndex: number): Player | null => {
    if (position === 'FLEX') {
      return team.find(player => 
        (player.position === 'RB' || player.position === 'WR' || player.position === 'TE') &&
        !team.slice(0, slotIndex).some(p => p === player)
      ) || null;
    }
    
    const positionPlayers = team.filter(player => player.position === position);
    const positionIndex = STARTING_POSITIONS
      .slice(0, slotIndex + 1)
      .filter(pos => pos === position).length - 1;
    return positionPlayers[positionIndex] || null;
  };

  return (
    <>
      <div 
        className="absolute inset-0 flex items-end"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: Z_INDEX.modal }}
        onClick={onClose}
      >
        <div 
          className="w-full bg-[#1a1a1a] max-h-[80vh] overflow-hidden"
          style={{
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            animation: 'slideUp 0.3s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle Bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-500 rounded-full" />
          </div>

          {/* Close Button */}
          <IconButton
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
            onClick={onClose}
            size="sm"
            variant="ghost"
            className="absolute top-4 right-4 z-20 text-white"
            aria-label="Close"
          />

          {/* Header with Dropdown */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between w-full text-left bg-white/10 px-3 py-2"
                style={{ borderRadius: PLATFORM.ios.borderRadius }}
              >
                <div className="text-lg font-bold text-white">
                  {selectedParticipant?.name || 'Select Team'}
                </div>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div 
                  className="absolute top-full left-0 right-0 bg-[#2a2a2a] border border-white/20 max-h-60 overflow-y-auto"
                  style={{ 
                    borderRadius: PLATFORM.ios.borderRadius, 
                    marginTop: '12px',
                    zIndex: 10,
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  {participants.map((participant, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        onParticipantChange?.(index);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-3 hover:bg-white/10 transition-colors ${
                        index === selectedParticipantIndex ? 'bg-blue-500/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-white font-medium">{participant.name}</div>
                        <div className="text-xs text-gray-500">#{index + 1}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Team Roster */}
          <div 
            className="overflow-y-auto flex-1"
            style={{ 
              maxHeight: 'calc(80vh - 120px)',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {team.length === 0 ? (
              <EmptyState
                title="No players drafted yet"
                description="Drafted players will appear here"
                className="p-6"
              />
            ) : (
              <div className="p-4 space-y-2 pb-8">
                {/* Starting Lineup */}
                {STARTING_POSITIONS.map((position, index) => {
                  const slotPlayer = getPlayerForSlot(position, index);
                  
                  return (
                    <div 
                      key={index}
                      className="flex items-center p-3 bg-white/5"
                      style={{ 
                        minHeight: '44px',
                        borderRadius: PLATFORM.ios.borderRadius,
                      }}
                    >
                      <div className="w-12 text-center font-medium text-gray-300">
                        {position}
                      </div>
                      <div className="flex-1">
                        {slotPlayer ? (
                          <div 
                            className="text-white cursor-pointer hover:text-blue-300 transition-colors flex items-center justify-between"
                            onClick={() => handlePlayerClick(slotPlayer)}
                          >
                            <span>{slotPlayer.name}</span>
                            <span className="text-xs text-gray-400">
                              {slotPlayer.position} - {slotPlayer.team}
                            </span>
                          </div>
                        ) : (
                          <div className="text-gray-400">Empty</div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Bench */}
                <div className="pt-4">
                  <div className="text-gray-400 text-sm font-medium mb-2">BENCH</div>
                  {[...Array(BENCH_SLOTS)].map((_, index) => {
                    const benchPlayers = team.slice(9);
                    const benchPlayer = benchPlayers[index] || null;
                    
                    return (
                      <div 
                        key={`bench-${index}`}
                        className="flex items-center p-3 bg-white/5 mb-2"
                        style={{ 
                          minHeight: '44px',
                          borderRadius: PLATFORM.ios.borderRadius,
                        }}
                      >
                        <div className="w-12 text-center font-medium text-gray-300">
                          BN
                        </div>
                        <div className="flex-1">
                          {benchPlayer ? (
                            <div 
                              className="text-white cursor-pointer hover:text-blue-300 transition-colors flex items-center justify-between"
                              onClick={() => handlePlayerClick(benchPlayer)}
                            >
                              <span>{benchPlayer.name}</span>
                              <span className="text-xs text-gray-400">
                                {benchPlayer.position} - {benchPlayer.team}
                              </span>
                            </div>
                          ) : (
                            <div className="text-gray-400">Empty</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Player Stats Modal */}
        <PlayerStatsModalVX
          player={selectedPlayer}
          isOpen={isStatsModalOpen}
          onClose={handleCloseStatsModal}
        />
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

