/**
 * DraftBoardVX - Version X Draft Board (TypeScript)
 * 
 * Migrated from:
 * - components/draft/v3/mobile/apple/components/DraftBoardContainer.js
 * - components/draft/v3/mobile/apple/components/DraftBoardApple.js
 * 
 * Full draft board grid showing all picks across rounds.
 * Features:
 * - 18 rounds x 12 teams grid
 * - Snake draft visualization
 * - Position color coding
 * - Auto-scroll to current pick
 * - Pick details modal
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { POSITION_COLORS } from '../../constants/colors';
import type { Player, Participant, Pick } from '../../shared/types';
import { formatPlayerNameShort, formatPickNumber } from '../../shared/utils';

// Re-export types
export type { Player, Participant, Pick } from '../../shared/types';

// ============================================================================
// TYPES
// ============================================================================

export interface DraftBoardVXProps {
  picks?: Pick[];
  participants?: Participant[];
  currentPickNumber?: number;
  isDraftActive?: boolean;
  timer?: number;
  userBorderColor?: string;
}

interface PickSlot {
  pickNumber: number;
  round: number;
  position: number;
  participant: Participant | undefined;
  participantIndex: number;
  pick: Pick | undefined;
  isCurrentPick: boolean;
  isPastPick: boolean;
  isUserPick: boolean;
}

interface RoundData {
  round: number;
  picks: PickSlot[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TOTAL_ROUNDS = 18;
const CELL_WIDTH = 92;
const CELL_HEIGHT = 62;
const CELL_MARGIN = 1;

// Position order for tracker bar - always QB, RB, WR, TE
const POSITION_ORDER = ['QB', 'RB', 'WR', 'TE'] as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPositionColor(position: string): string {
  return POSITION_COLORS[position as keyof typeof POSITION_COLORS] || '#6b7280';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DraftBoardVX({
  picks = [],
  participants = [],
  currentPickNumber = 1,
  isDraftActive = false,
  timer = 120,
  userBorderColor: externalUserBorderColor,
}: DraftBoardVXProps): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedPick, setSelectedPick] = useState<PickSlot | null>(null);

  const totalTeams = participants.length || 12;

  // Determine if the user (participant index 0) is currently on the clock
  const currentRound = Math.ceil(currentPickNumber / totalTeams);
  const isSnakeRound = currentRound % 2 === 0;
  const pickIndexInRound = (currentPickNumber - 1) % totalTeams;
  const currentParticipantIndex = isSnakeRound 
    ? totalTeams - 1 - pickIndexInRound 
    : pickIndexInRound;
  const isUserOnClock = isDraftActive && currentParticipantIndex === 0;

  // User border color: red when on the clock, blue otherwise
  const userBorderColor = externalUserBorderColor || (isUserOnClock ? '#EF4444' : '#3B82F6');

  // Create draft grid
  const draftGrid = useMemo((): RoundData[] => {
    const grid: RoundData[] = [];
    
    for (let round = 1; round <= TOTAL_ROUNDS; round++) {
      const roundPicks: PickSlot[] = [];
      const isSnakeRound = round % 2 === 0;
      
      for (let displayPosition = 1; displayPosition <= totalTeams; displayPosition++) {
        const actualPosition = isSnakeRound ? totalTeams - displayPosition + 1 : displayPosition;
        const pickNumber = (round - 1) * totalTeams + actualPosition;
        const participantIndex = displayPosition - 1;
        const participant = participants[participantIndex];
        const pick = picks.find(p => p.pickNumber === pickNumber);
        
        roundPicks.push({
          pickNumber,
          round,
          position: displayPosition,
          participant,
          participantIndex,
          pick,
          isCurrentPick: pickNumber === currentPickNumber,
          isPastPick: pickNumber < currentPickNumber,
          isUserPick: participantIndex === 0,
        });
      }
      
      grid.push({ round, picks: roundPicks });
    }
    
    return grid;
  }, [picks, participants, currentPickNumber, totalTeams]);

  // Get position counts for a participant
  const getPositionCounts = (participantIndex: number) => {
    const counts = { QB: 0, RB: 0, WR: 0, TE: 0 };
    
    picks.forEach(pick => {
      const round = Math.ceil(pick.pickNumber / totalTeams);
      const isSnakeRound = round % 2 === 0;
      const pickIndexInRound = (pick.pickNumber - 1) % totalTeams;
      const pickParticipantIndex = isSnakeRound 
        ? totalTeams - 1 - pickIndexInRound 
        : pickIndexInRound;
      
      if (pickParticipantIndex === participantIndex && pick.player) {
        const pos = pick.player.position as keyof typeof counts;
        if (counts.hasOwnProperty(pos)) {
          counts[pos]++;
        }
      }
    });
    
    return counts;
  };

  // Auto-scroll to current pick
  useEffect(() => {
    if (scrollRef.current && isDraftActive) {
      const currentRound = Math.ceil(currentPickNumber / totalTeams);
      const roundElement = scrollRef.current.querySelector(`[data-round="${currentRound}"]`);
      if (roundElement) {
        roundElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentPickNumber, isDraftActive, totalTeams]);

  const getPicksAway = (pickNumber: number): number => {
    if (pickNumber <= currentPickNumber) return 0;
    return pickNumber - currentPickNumber;
  };

  // Find the next user pick (first future pick for user)
  const nextUserPickNumber = useMemo(() => {
    const allUserPicks = draftGrid.flatMap(round => 
      round.picks.filter(p => p.isUserPick && p.pickNumber > currentPickNumber)
    );
    if (allUserPicks.length === 0) return null;
    return Math.min(...allUserPicks.map(p => p.pickNumber));
  }, [draftGrid, currentPickNumber]);

  return (
    <div className="h-full flex flex-col bg-[#101927]">
      {/* Scrollable Grid */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-auto"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Team Headers - Sticky */}
        <div 
          className="sticky top-0 z-10 bg-[#101927]"
          style={{ paddingTop: '8px' }}
        >
          <div 
            className="flex"
            style={{ 
              minWidth: `${totalTeams * (CELL_WIDTH + CELL_MARGIN * 2)}px`,
              width: 'max-content',
            }}
          >
            {participants.map((participant, index) => (
              <TeamHeader
                key={index}
                participant={participant}
                index={index}
                isUser={index === 0}
                userBorderColor={userBorderColor}
                positionCounts={getPositionCounts(index)}
              />
            ))}
          </div>
        </div>

        {/* Draft Grid */}
        <div>
          {draftGrid.map((roundData) => (
            <div 
              key={roundData.round}
              data-round={roundData.round}
              className="flex"
              style={{ 
                minWidth: `${totalTeams * (CELL_WIDTH + CELL_MARGIN * 2)}px`,
                width: 'max-content',
              }}
            >
              {roundData.picks.map((pickData) => (
                <PickCell
                  key={pickData.pickNumber}
                  pickData={pickData}
                  totalTeams={totalTeams}
                  timer={timer}
                  userBorderColor={userBorderColor}
                  picksAway={getPicksAway(pickData.pickNumber)}
                  isNextUserPick={pickData.pickNumber === nextUserPickNumber}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pick Details Modal */}
      {selectedPick?.pick && (
        <PickDetailsModal
          pickData={selectedPick}
          onClose={() => setSelectedPick(null)}
        />
      )}
    </div>
  );
}

// ============================================================================
// TEAM HEADER COMPONENT
// ============================================================================

interface TeamHeaderProps {
  participant: Participant;
  index: number;
  isUser: boolean;
  userBorderColor: string;
  positionCounts: { QB: number; RB: number; WR: number; TE: number };
}

const TeamHeader = React.memo(function TeamHeader({ participant, index, isUser, userBorderColor, positionCounts }: TeamHeaderProps): React.ReactElement {
  const borderColor = isUser ? userBorderColor : '#6B7280';
  const totalPicks = Object.values(positionCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div 
      className="flex-shrink-0 flex flex-col bg-gray-800"
      style={{ 
        margin: `${CELL_MARGIN}px`,
        minWidth: `${CELL_WIDTH}px`,
        width: `${CELL_WIDTH}px`,
        borderRadius: '6px',
        border: `4px solid ${borderColor}`,
        overflow: 'hidden',
      }}
    >
      {/* Username Header - part of flexbox flow, not absolute */}
      <div 
        className="text-center font-medium text-xs text-white flex items-center justify-center px-1"
        style={{ 
          height: '20px',
          fontSize: '10px',
          textTransform: 'uppercase',
          backgroundColor: borderColor,
        }}
      >
        {participant.name?.length > 12 
          ? participant.name.substring(0, 12) 
          : participant.name || `Team ${index + 1}`
        }
      </div>

      {/* Content Area - grows to fill remaining space */}
      <div className="flex-1 flex flex-col justify-end items-center pb-2" style={{ minHeight: '70px' }}>
        {/* Position Tracker Bar */}
        <div className="flex justify-center w-full" style={{ marginTop: '2px' }}>
          {totalPicks === 0 ? (
            <div 
              className="bg-gray-500 rounded-sm"
              style={{ height: '9px', width: '79px' }}
            />
          ) : (
            <div 
              className="flex rounded-sm overflow-hidden"
              style={{ height: '9px', width: '78px' }}
            >
              {POSITION_ORDER
                .filter(pos => positionCounts[pos] > 0)
                .map((position, idx, arr) => (
                  <div
                    key={position}
                    style={{
                      width: `${(positionCounts[position] / totalPicks) * 100}%`,
                      height: '100%',
                      backgroundColor: getPositionColor(position),
                      borderRadius: idx === 0 ? '1px 0 0 1px' : idx === arr.length - 1 ? '0 1px 1px 0' : '0',
                    }}
                  />
                ))
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// PICK CELL COMPONENT
// ============================================================================

interface PickCellProps {
  pickData: PickSlot;
  totalTeams: number;
  timer: number;
  userBorderColor: string;
  picksAway: number;
  isNextUserPick: boolean;
}

const PickCell = React.memo(function PickCell({ pickData, totalTeams, timer, userBorderColor, picksAway, isNextUserPick }: PickCellProps): React.ReactElement {
  const { pick, isUserPick, isCurrentPick, pickNumber, round, participantIndex } = pickData;

  // Determine cell styling
  const getCellStyle = () => {
    const base = {
      minWidth: `${CELL_WIDTH}px`,
      width: `${CELL_WIDTH}px`,
      margin: `${CELL_MARGIN}px`,
      marginTop: round === 1 ? '7px' : `${CELL_MARGIN}px`,
      borderRadius: '6px',
    };

    if (pick) {
      const posColor = getPositionColor(pick.player.position);
      return {
        ...base,
        border: `4px solid ${posColor}`,
        backgroundColor: `${posColor}20`,
      };
    }

    if (isUserPick) {
      return {
        ...base,
        border: `4px solid ${userBorderColor}`,
        backgroundColor: 'transparent',
      };
    }

    return {
      ...base,
      border: '4px solid rgba(255, 255, 255, 0.1)',
      backgroundColor: 'transparent',
    };
  };

  return (
    <div 
      className="transition-colors"
      style={getCellStyle()}
    >
      <div className="flex flex-col" style={{ height: `${CELL_HEIGHT}px`, padding: '2px 3px' }}>
        {/* Pick number - top left, compact */}
        <div 
          className="text-white font-medium flex-shrink-0"
          style={{ fontSize: '8px', lineHeight: '1', marginTop: '2px', marginLeft: '1px' }}
        >
          {formatPickNumber(pickNumber, totalTeams)}
        </div>

        {/* Content area - grows to fill remaining space */}
        <div className="flex-1 flex flex-col justify-center items-center">
          {pick ? (
            // Picked player - First name / Last name / Position-Team
            <>
              <div 
                className="font-bold text-white text-center truncate w-full"
                style={{ fontSize: '10px', lineHeight: '1.2', marginTop: '-1px' }}
              >
                {pick.player.name.split(' ')[0]}
              </div>
              <div 
                className="font-bold text-white text-center truncate w-full"
                style={{ fontSize: '11px', lineHeight: '1.2' }}
              >
                {pick.player.name.split(' ').slice(1).join(' ') || pick.player.name}
              </div>
              <div 
                className="text-white text-center"
                style={{ fontSize: '9px', lineHeight: '1.2', marginTop: '6px' }}
              >
                {pick.player.position}-{pick.player.team}
              </div>
            </>
          ) : isCurrentPick ? (
            // Current pick - show "On The Clock"
            <div
              className="font-semibold text-white text-center"
              style={{ fontSize: '11px', lineHeight: 1.2, marginTop: '-2px' }}
            >
              On The<br />Clock
            </div>
          ) : isNextUserPick ? (
            // Next user pick only
            <div className="text-gray-400" style={{ fontSize: '12px', marginTop: '-4px' }}>
              {picksAway} away
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// PICK DETAILS MODAL
// ============================================================================

interface PickDetailsModalProps {
  pickData: PickSlot;
  onClose: () => void;
}

const PickDetailsModal = React.memo(function PickDetailsModal({ pickData, onClose }: PickDetailsModalProps): React.ReactElement {
  const { pick, pickNumber, round, position, participant } = pickData;
  if (!pick) return <></>;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#1a2332] rounded-2xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <h3 
            className="text-lg font-bold mb-2"
            style={{ color: getPositionColor(pick.player.position) }}
          >
            {pick.player.name}
          </h3>
          <p className="text-gray-300 mb-4">
            {pick.player.position} - {pick.player.team}
          </p>
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex justify-between">
              <span>Pick:</span>
              <span className="text-white">{pickNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Round:</span>
              <span className="text-white">{round}.{String(position).padStart(2, '0')}</span>
            </div>
            <div className="flex justify-between">
              <span>Drafted by:</span>
              <span className="text-white">{participant?.name || 'Unknown'}</span>
            </div>
            {pick.player.adp && (
              <div className="flex justify-between">
                <span>ADP:</span>
                <span className="text-white">{parseFloat(String(pick.player.adp)).toFixed(1)}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium"
            aria-label="Close pick details"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

