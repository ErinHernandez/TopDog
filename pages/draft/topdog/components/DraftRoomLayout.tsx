/**
 * DraftRoomLayout
 * 
 * Main layout component that orchestrates all draft room components.
 * Arranges DraftHeader, DraftBoard, PlayerList, and other components.
 * 
 * Part of Phase 3: Extract Components
 */

import React, { useState } from 'react';
import { useDraftState } from '../context/DraftRoomContext';
import { DraftHeader } from './DraftHeader';
import { DraftBoard } from './DraftBoard';
import { PlayerList } from './PlayerList';
import { TeamRoster } from './TeamRoster';
import { Player } from '../types/draft';
import DraftNavbar from '@/components/draft/v2/ui/DraftNavbar';

export interface DraftRoomLayoutProps {
  onPlayerClick?: (player: Player) => void;
  onPickClick?: (pickNumber: number) => void;
}

/**
 * Main draft room layout component
 */
export function DraftRoomLayout({
  onPlayerClick,
  onPickClick,
}: DraftRoomLayoutProps) {
  const state = useDraftState();
  const { room, currentUser, selectedPlayer } = state;
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(currentUser);

  if (!room) {
    return (
      <div className="min-h-screen bg-[#101927] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4">Loading Draft Room...</div>
          <div className="text-gray-400">Connecting to room...</div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-[#101927] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4 text-red-400">Error</div>
          <div className="text-gray-400">{state.error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101927] text-white overflow-x-auto zoom-resistant">
      <DraftNavbar />

      {/* Header */}
      <DraftHeader />

      {/* Draft Board (Horizontal Scrolling Picks) */}
      <DraftBoard onPickClick={onPickClick} />

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Player List */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 rounded-lg" style={{ height: '600px' }}>
              <PlayerList onPlayerClick={onPlayerClick} />
            </div>
          </div>

          {/* Right Column: Team Roster */}
          <div className="lg:col-span-1">
            <TeamRoster
              teamName={currentUser}
              onPlayerClick={(playerName) => {
                const player = state.availablePlayers.find((p) => p.name === playerName);
                if (player) {
                  onPlayerClick?.(player);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Team Modal (if needed - can be added later) */}
      {showTeamModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowTeamModal(false)}
        >
          <div
            className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">{selectedTeam}&apos;s Team</h2>
              <button
                onClick={() => setShowTeamModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <TeamRoster teamName={selectedTeam} />
          </div>
        </div>
      )}
    </div>
  );
}
