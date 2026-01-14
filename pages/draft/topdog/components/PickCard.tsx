/**
 * PickCard
 * 
 * Component for displaying a single pick in the horizontal scrolling draft board.
 * Shows pick number, team, player (if picked), and timer (if on the clock).
 * 
 * Part of Phase 3: Extract Components
 */

import React from 'react';
import { DraftPick } from '../types/draft';
import { useDraftState } from '../context/DraftRoomContext';
import { POSITION_COLORS } from '@/components/draft/v3/constants/positions';
import { PLAYER_POOL } from '@/lib/playerPool';
import SevenSegmentCountdown from '@/components/SevenSegmentCountdown';

export interface PickCardProps {
  pickNumber: number;
  pick: DraftPick | null;
  draftOrder: string[];
  currentUser: string;
  isOnTheClock: boolean;
  isDraftActive: boolean;
  timer: number;
  preDraftCountdown?: number;
  onClick?: () => void;
}

/**
 * Pick card component for draft board
 */
export function PickCard({
  pickNumber,
  pick,
  draftOrder,
  currentUser,
  isOnTheClock,
  isDraftActive,
  timer,
  preDraftCountdown,
  onClick,
}: PickCardProps) {

  // Calculate round and team
  const round = Math.ceil(pickNumber / draftOrder.length);
  const isSnakeRound = round % 2 === 0;
  const pickIndex = (pickNumber - 1) % draftOrder.length;
  const teamIndex = isSnakeRound ? draftOrder.length - 1 - pickIndex : pickIndex;
  const team = draftOrder[teamIndex] || `Team ${teamIndex + 1}`;
  const isMyPick = team === currentUser;
  const isCompleted = pick !== null;

  // Get player data if picked
  const playerData = pick
    ? PLAYER_POOL.find((p) => p.name === pick.player)
    : null;

  // Border color: red if on clock, position color if completed, gray if future
  const borderColor = isOnTheClock
    ? '#EF4444'
    : isCompleted
      ? POSITION_COLORS[playerData?.position as keyof typeof POSITION_COLORS]?.primary ||
        '#2DE2C5'
      : '#808080';

  return (
    <div
      className="flex-shrink-0 text-sm font-medium h-56 flex flex-col border-6 cursor-pointer"
      style={{
        width: '158px',
        borderWidth: '6px',
        position: 'relative',
        borderColor,
        borderTopWidth: '42px',
        backgroundColor: '#0a0a0a',
        borderRadius: '11px',
        overflow: 'visible',
        transform: 'translateZ(0)',
        minWidth: '174px',
        flexShrink: 0,
        scrollSnapAlign: pickNumber === 1 ? 'start' : 'center',
      }}
      onClick={onClick}
    >
      {/* Team username in border area */}
      <div
        className="absolute left-0 right-0 font-bold text-center"
        style={{
          fontSize: '16px',
          color: isOnTheClock ? 'black' : 'white',
          backgroundColor: 'transparent',
          zIndex: 9999,
          padding: '2px',
          top: '-20px',
          transform: 'translateY(-50%) translateZ(0)',
        }}
      >
        {team.replace(/[,\s]/g, '').toUpperCase().substring(0, 18)}
      </div>

      {/* Pick number */}
      <div
        className="absolute text-sm cursor-pointer rounded px-1"
        style={{
          top: '5px',
          left: '9px',
          color: 'white',
          zIndex: 9999,
          transform: 'translateZ(0)',
        }}
      >
        {(() => {
          const pickInRound = ((pickNumber - 1) % draftOrder.length) + 1;
          return `${round}.${String(pickInRound).padStart(2, '0')}`;
        })()}
      </div>

      {/* Timer (if on the clock) */}
      {isOnTheClock && (
        <div
          className="absolute"
          style={{
            bottom: '28px',
            left: '50%',
            transform: 'translateX(-50%) scale(0.9)',
          }}
        >
          <SevenSegmentCountdown
            initialSeconds={isDraftActive ? timer : preDraftCountdown || 60}
            useMonocraft={true}
            isUserOnClock={isMyPick && isDraftActive}
          />
        </div>
      )}

      {/* Player name (if picked) */}
      {isCompleted && pick && playerData && (
        <div
          className="absolute text-center"
          style={{
            bottom: '0px',
            left: '50%',
            transform: 'translateX(-50%) translateZ(0)',
            zIndex: 9999,
            padding: '36px',
          }}
        >
          <div
            className="font-bold text-sm"
            style={{
              marginTop: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '140px',
              lineHeight: '1.2',
              color: 'white',
            }}
          >
            {pick.player}
          </div>
          <div
            className="text-sm text-gray-400 mt-1"
            style={{ marginTop: '4px', whiteSpace: 'nowrap' }}
          >
            {playerData.position} - {playerData.team}
          </div>
        </div>
      )}
    </div>
  );
}
