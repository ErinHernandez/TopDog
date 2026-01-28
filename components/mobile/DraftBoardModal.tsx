/**
 * DraftBoardModal - Full Screen Draft Board Overlay
 *
 * Extracted from pages/mobile.js for maintainability
 * Shows the complete draft board for a team using the VX2 DraftBoard component
 */

import React, { useMemo, useCallback } from 'react';
import { POSITION_COLORS } from '@/lib/constants/positions';
import type { FantasyPosition } from '@/types/player';
import DraftBoard from '@/components/vx2/draft-room/components/DraftBoard';
import type { DraftPick, Participant, Position } from '@/components/vx2/draft-room/types';

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

// ============================================================================
// CONSTANTS
// ============================================================================

const TEAM_COUNT = 12;
const ROSTER_SIZE = 18;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert team player data to DraftPick format for VX2 DraftBoard
 */
function convertTeamToPicks(
  team: Team,
  userParticipantIndex: number
): DraftPick[] {
  const picks: DraftPick[] = [];
  let pickNumber = 1;

  // Convert team players to picks format
  Object.entries(team.players).forEach(([position, players]) => {
    players.forEach((player) => {
      const actualPickNumber = player.pick || pickNumber++;
      const round = Math.ceil(actualPickNumber / TEAM_COUNT);
      const pickInRound = ((actualPickNumber - 1) % TEAM_COUNT) + 1;

      picks.push({
        id: `pick-${actualPickNumber}`,
        pickNumber: actualPickNumber,
        round,
        pickInRound,
        player: {
          id: `player-${actualPickNumber}`,
          name: player.name,
          position: position as Position,
          team: player.team,
          adp: player.adp || actualPickNumber,
          projectedPoints: 0,
          byeWeek: 0,
        },
        participantId: `participant-${userParticipantIndex}`,
        participantIndex: userParticipantIndex,
        timestamp: Date.now(),
      });
    });
  });

  // Sort picks by pick number
  picks.sort((a, b) => a.pickNumber - b.pickNumber);

  return picks;
}

/**
 * Create mock participants for a 12-team league
 */
function createMockParticipants(teamName: string): Participant[] {
  const participants: Participant[] = [];

  for (let i = 0; i < TEAM_COUNT; i++) {
    participants.push({
      id: `participant-${i}`,
      name: i === 0 ? teamName : `Team ${i + 1}`,
      draftPosition: i,
      isUser: i === 0,
    });
  }

  return participants;
}

// ============================================================================
// COMPONENT
// ============================================================================

const DraftBoardModal: React.FC<DraftBoardModalProps> = ({
  team,
  onClose
}): React.ReactElement | null => {
  const userParticipantIndex = 0;

  // Convert team data to VX2 format - hooks must be called unconditionally
  const picks = useMemo(
    () => (team ? convertTeamToPicks(team, userParticipantIndex) : []),
    [team]
  );

  const participants = useMemo(
    () => (team ? createMockParticipants(team.name) : []),
    [team]
  );

  // Get pick for a specific slot (used by DraftBoard)
  const getPickForSlot = useCallback(
    (round: number, participantIndex: number): DraftPick | null => {
      // Calculate pick number based on snake draft order
      const isEvenRound = round % 2 === 0;
      const pickInRound = isEvenRound
        ? TEAM_COUNT - participantIndex
        : participantIndex + 1;
      const pickNumber = (round - 1) * TEAM_COUNT + pickInRound;

      // Find the pick if it's for the user's team
      if (participantIndex === userParticipantIndex) {
        return picks.find(p => p.pickNumber === pickNumber) || null;
      }

      return null;
    },
    [picks]
  );

  // Early return AFTER all hooks are called
  if (!team) return null;

  // Total picks for the draft
  const currentPickNumber = picks.length + 1;

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

      {/* Draft Board Content - Using VX2 DraftBoard Component */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <DraftBoard
          picks={picks}
          currentPickNumber={currentPickNumber}
          participants={participants}
          userParticipantIndex={userParticipantIndex}
          isDraftActive={false}
          getPickForSlot={getPickForSlot}
        />
      </div>
    </div>
  );
};

export default DraftBoardModal;
