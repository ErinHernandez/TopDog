/**
 * Team Roster Modal - iOS Style
 * 
 * Native iOS modal presentation:
 * - Sheet-style modal from bottom
 * - iOS close gesture handling
 * - Touch-friendly team display
 */

import React, { useState } from 'react';
import { MOBILE_SIZES, PLATFORM_SPECIFIC } from '../../shared/constants/mobileSizes';
import PlayerStatsModal from './PlayerStatsModal';

export default function TeamRosterModal({ participants = [], picks = [], selectedParticipantIndex = 0, onParticipantChange, onClose }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Get the team for the selected participant
  const getTeamForParticipant = (participantIndex) => {
    const participantCount = participants.length || 12; // Default to 12 if participants is empty
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

  // Handle opening stats modal
  const handlePlayerStatsClick = (player) => {
    setSelectedPlayer(player);
    setIsStatsModalOpen(true);
  };

  // Handle closing stats modal
  const handleCloseStatsModal = () => {
    setIsStatsModalOpen(false);
    setSelectedPlayer(null);
  };

  return (
    <>
      <style jsx>{`
        .team-modal-scroll::-webkit-scrollbar {
          width: 0px;
          height: 0px;
        }
        .team-modal-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .team-modal-scroll::-webkit-scrollbar-thumb {
          background-color: transparent;
        }
        .team-modal-scroll::-webkit-scrollbar-thumb:hover {
          background-color: transparent;
        }
        .team-modal-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>
      <div 
        className="absolute inset-0 z-50 flex items-end"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      >
      <div 
        className="w-full bg-[#1a1a1a] rounded-t-3xl max-h-[80vh] overflow-hidden"
        style={{
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          animation: 'slideUp 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle Bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div 
            className="w-10 h-1 bg-gray-500 rounded-full"
            style={{ borderRadius: '2px' }}
          />
        </div>

        {/* Close Button - Top Right */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center z-20"
        >
          <span className="text-white text-lg">×</span>
        </button>

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="relative">
            {/* Dropdown Button */}
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between w-full text-left bg-white/10 rounded-lg px-3 py-2"
              style={{ borderRadius: PLATFORM_SPECIFIC.IOS.BORDER_RADIUS }}
            >
              <div>
                <div className="text-lg font-bold text-white">
                  {selectedParticipant?.name || 'Select Team'}
                </div>
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
                className="absolute top-full left-0 right-0 bg-[#2a2a2a] rounded-lg border border-white z-10 max-h-60 overflow-y-auto team-modal-scroll"
                style={{ borderRadius: PLATFORM_SPECIFIC.IOS.BORDER_RADIUS, marginTop: '12px' }}
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
                    } ${index === 0 ? 'rounded-t-lg' : ''} ${index === participants.length - 1 ? 'rounded-b-lg' : ''}`}
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
        <div className="overflow-y-auto flex-1 team-modal-scroll" style={{ maxHeight: 'calc(80vh - 120px)' }}>
          {team.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-400 text-lg mb-2">No players drafted yet</div>
              <div className="text-gray-500 text-sm">Your drafted players will appear here</div>
            </div>
          ) : (
            <div className="p-4 space-y-2 pb-8">
              {/* Starting Lineup Slots */}
              {['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'FLEX'].map((position, index) => (
                <div 
                  key={index}
                  className="flex items-center p-3 bg-white/5 rounded-lg"
                  style={{ 
                    minHeight: '32px',
                    borderRadius: PLATFORM_SPECIFIC.IOS.BORDER_RADIUS
                  }}
                >
                  <div className="w-12 text-center font-medium text-gray-300">
                    {position}
                  </div>
                  <div className="flex-1">
                    {/* Find player for this position slot */}
                    {(() => {
                      // Find first available player that matches this position
                      let slotPlayer = null;
                      
                      if (position === 'FLEX') {
                        // FLEX can be RB, WR, or TE
                        slotPlayer = team.find(player => 
                          (player.position === 'RB' || player.position === 'WR' || player.position === 'TE') &&
                          !team.slice(0, index).some(p => p === player) // Not already used in earlier slots
                        );
                      } else {
                        // Regular position matching
                        const positionPlayers = team.filter(player => player.position === position);
                        const positionIndex = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'FLEX']
                          .slice(0, index + 1)
                          .filter(pos => pos === position).length - 1;
                        slotPlayer = positionPlayers[positionIndex];
                      }
                      
                      if (slotPlayer) {
                        return (
                          <div 
                            className="text-white cursor-pointer hover:text-blue-300 transition-colors flex items-center justify-between"
                            onClick={() => handlePlayerStatsClick(slotPlayer)}
                          >
                            <span>{slotPlayer.name}</span>
                            <span className="text-xs text-gray-400">
                              {slotPlayer.position} • {slotPlayer.team}
                            </span>
                          </div>
                        );
                      } else {
                        return <div className="text-gray-400">Empty</div>;
                      }
                    })()}
                  </div>
                </div>
              ))}
              
              {/* Bench */}
              <div className="pt-4">
                <div className="text-gray-400 text-sm font-medium mb-2">BENCH</div>
                {[...Array(9)].map((_, index) => (
                  <div 
                    key={`bench-${index}`}
                    className="flex items-center p-3 bg-white/5 rounded-lg mb-2"
                    style={{ 
                      minHeight: MOBILE_SIZES.TOUCH_TARGET_MIN,
                      borderRadius: PLATFORM_SPECIFIC.IOS.BORDER_RADIUS
                    }}
                  >
                    <div className="w-12 text-center font-medium text-gray-300">
                      BN
                    </div>
                    <div className="flex-1">
                      {/* Find bench player for this slot */}
                      {(() => {
                        // Get players not in starting lineup (beyond first 9)
                        const benchPlayers = team.slice(9); // Players beyond starting 9
                        const benchPlayer = benchPlayers[index];
                        
                        if (benchPlayer) {
                          return (
                            <div 
                              className="text-white cursor-pointer hover:text-blue-300 transition-colors flex items-center justify-between"
                              onClick={() => handlePlayerStatsClick(benchPlayer)}
                            >
                              <span>{benchPlayer.name}</span>
                              <span className="text-xs text-gray-400">
                                {benchPlayer.position} • {benchPlayer.team}
                              </span>
                            </div>
                          );
                        } else {
                          return <div className="text-gray-400">Empty</div>;
                        }
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Player Stats Modal */}
      <PlayerStatsModal
        player={selectedPlayer}
        isOpen={isStatsModalOpen}
        onClose={handleCloseStatsModal}
      />

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
      </div>
    </>
  );
}
