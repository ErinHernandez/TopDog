/**
 * DraftBoardModal - Full Screen Draft Board Overlay
 * 
 * Extracted from pages/mobile.js for maintainability
 * Shows the complete draft board for a team
 */

import React from 'react';
import DraftBoardApple from '../draft/v3/mobile/apple/components/DraftBoardApple';
import { POSITION_COLORS } from '../draft/v3/constants/positions';
import type { FantasyPosition } from '@/types/player';

// ============================================================================
// TYPES
// ============================================================================

interface TeamPlayer {
  name: string;
  position: string;
  team: string;
  adp?: number;
  pick?: number;
}

interface Team {
  name: string;
  players: Record<FantasyPosition | string, TeamPlayer[]>;
}

export interface DraftBoardModalProps {
  /** Team data to display */
  team: Team | null;
  /** Callback when modal is closed */
  onClose: () => void;
}

interface MockPick {
  pickNumber: number;
  player: {
    name: string;
    position: string;
    team: string;
    adp?: number;
  };
  timestamp: number;
  teamCompositionAtTime: string;
}

interface MockParticipant {
  name: string;
  team: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const DraftBoardModal: React.FC<DraftBoardModalProps> = ({ 
  team, 
  onClose 
}): React.ReactElement | null => {
  if (!team) return null;

  // Convert team data to draft board format
  const mockPicks: MockPick[] = [];
  let pickNumber = 1;
  
  // Convert team players to picks format
  Object.entries(team.players).forEach(([position, players]) => {
    players.forEach((player) => {
      mockPicks.push({
        pickNumber: player.pick || pickNumber++,
        player: {
          name: player.name,
          position: position,
          team: player.team,
          adp: player.adp,
        },
        timestamp: Date.now(),
        teamCompositionAtTime: POSITION_COLORS[position as FantasyPosition]?.primary || '#6b7280',
      });
    });
  });

  // Sort picks by pick number
  mockPicks.sort((a, b) => (a.pickNumber || 999) - (b.pickNumber || 999));

  // Mock participants (12-team league)
  const mockParticipants: MockParticipant[] = [
    { name: team.name, team: 'Your Team' },
    { name: 'Team 2', team: 'Opponent' },
    { name: 'Team 3', team: 'Opponent' },
    { name: 'Team 4', team: 'Opponent' },
    { name: 'Team 5', team: 'Opponent' },
    { name: 'Team 6', team: 'Opponent' },
    { name: 'Team 7', team: 'Opponent' },
    { name: 'Team 8', team: 'Opponent' },
    { name: 'Team 9', team: 'Opponent' },
    { name: 'Team 10', team: 'Opponent' },
    { name: 'Team 11', team: 'Opponent' },
    { name: 'Team 12', team: 'Opponent' },
  ];

  const handleClose = (): void => {
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#101927] flex flex-col">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b border-gray-700" 
        style={{ background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover' }}
      >
        <div className="flex items-center">
          {/* Edit Icon */}
          <svg 
            className="w-6 h-6 text-white mr-3" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <h2 className="text-xl font-semibold text-white">{team.name}</h2>
        </div>
        <button 
          onClick={handleClose}
          className="w-8 h-8 rounded-full hover:bg-gray-700/50 flex items-center justify-center transition-colors"
          aria-label="Close draft board"
        >
          <span className="text-white text-xl">×</span>
        </button>
      </div>

      {/* Draft Board Content */}
      <div className="flex-1 min-h-0">
        <DraftBoardApple
          picks={mockPicks}
          participants={mockParticipants}
          currentPickNumber={mockPicks.length + 1}
          isMyTurn={false}
          timer={0}
        />
      </div>
    </div>
  );
};

export default DraftBoardModal;
