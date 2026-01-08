/**
 * CompletedDraftBoardModal - Shows completed draft board for a team
 * 
 * Displays a full draft board view with all picks from the draft
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import DraftBoard from '../../draft-room/components/DraftBoard';
import type { DraftPick, Participant } from '../../draft-room/types';
import type { MyTeam, TeamPlayer } from '../../hooks/data/useMyTeams';
import { BG_COLORS, TEXT_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS, Z_INDEX } from '../../core/constants/sizes';
import { Close } from '../../components/icons';

// ============================================================================
// TYPES
// ============================================================================

export interface CompletedDraftBoardModalProps {
  team: MyTeam;
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CompletedDraftBoardModal({
  team,
  isOpen,
  onClose,
}: CompletedDraftBoardModalProps): React.ReactElement | null {
  const router = useRouter();
  const [isCapturing, setIsCapturing] = useState(false);

  // Determine user's draft position from their first pick
  const userDraftPosition = useMemo(() => {
    if (team.players.length === 0) return 0;
    const firstPick = Math.min(...team.players.map(p => p.pick));
    const firstRound = Math.ceil(firstPick / 12);
    const pickInRound = ((firstPick - 1) % 12) + 1;
    // participantIndex is 0-based, pickInRound is 1-based
    return pickInRound - 1;
  }, [team.players]);

  // Convert team players to picks format
  const picks: DraftPick[] = useMemo(() => {
    return team.players
      .map((player: TeamPlayer) => {
        const pickNumber = player.pick;
        const round = Math.ceil(pickNumber / 12);
        const pickInRound = ((pickNumber - 1) % 12) + 1;
        
        // Calculate participant index from pick number (accounting for snake draft)
        const isSnakeRound = round % 2 === 0;
        const participantIndex = isSnakeRound 
          ? 12 - pickInRound  // Even rounds are reversed
          : pickInRound - 1;  // Odd rounds are normal (0-based)
        
        return {
          id: `pick-${pickNumber}`,
          pickNumber,
          round,
          pickInRound,
          player: {
            id: `${player.name}-${player.pick}`,
            name: player.name,
            position: player.position,
            team: player.team,
            adp: player.adp,
            projectedPoints: player.projectedPoints,
            byeWeek: player.bye,
          },
          participantId: team.id,
          participantIndex,
          timestamp: new Date(team.draftedAt).getTime(),
        };
      })
      .sort((a, b) => a.pickNumber - b.pickNumber);
  }, [team.players, team.draftedAt, team.id]);

  // Create mock participants (12-team league)
  const participants: Participant[] = useMemo(() => {
    const mockParticipants: Participant[] = [];
    
    // Create all 12 participants, placing user's team at the correct position
    for (let i = 0; i < 12; i++) {
      if (i === userDraftPosition) {
        mockParticipants.push({
          name: team.name,
          id: team.id,
          isUser: true,
          draftPosition: i,
        });
      } else {
        mockParticipants.push({
          name: `Team ${i + 1}`,
          id: `team-${i + 1}`,
          isUser: false,
          draftPosition: i,
        });
      }
    }
    
    return mockParticipants;
  }, [team.name, team.id, userDraftPosition]);

  // Calculate total picks (18 rounds * 12 teams = 216)
  const totalPicks = 18 * 12;
  const currentPickNumber = picks.length > 0 ? picks[picks.length - 1].pickNumber + 1 : 1;

  // Get pick for slot function (for DraftBoard component)
  // participantIndex is the display position (0-11)
  const getPickForSlot = useCallback((round: number, participantIndex: number): DraftPick | null => {
    // Calculate pick number based on round and participant index (snake draft)
    const isSnakeRound = round % 2 === 0;
    const positionInRound = isSnakeRound ? 12 - participantIndex : participantIndex + 1;
    const pickNumber = (round - 1) * 12 + positionInRound;
    
    // Find pick that matches this pick number
    return picks.find(p => p.pickNumber === pickNumber) || null;
  }, [picks]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        backgroundColor: BG_COLORS.primary,
        zIndex: Z_INDEX.modal,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${SPACING.md}px ${SPACING.lg}px`,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <h2
          style={{
            color: TEXT_COLORS.primary,
            fontSize: '18px',
            fontWeight: 700,
          }}
        >
          Draft Board
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: `${RADIUS.md}px`,
            transition: 'background 0.15s',
          }}
          aria-label="Close draft board"
        >
          <Close size={20} color={TEXT_COLORS.secondary} />
        </button>
      </div>

      {/* Draft Board */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <DraftBoard
          picks={picks}
          currentPickNumber={currentPickNumber}
          participants={participants}
          userParticipantIndex={userDraftPosition}
          timer={0}
          isDraftActive={false}
          getPickForSlot={getPickForSlot}
          initialScrollPosition={0}
          onScrollPositionChange={() => {}}
        />
      </div>
    </div>
  );
}

