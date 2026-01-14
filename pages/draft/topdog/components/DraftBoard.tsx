/**
 * DraftBoard
 * 
 * Horizontal scrolling picks bar displaying all draft picks.
 * Uses PickCard components and auto-scrolls to current pick.
 * 
 * Part of Phase 3: Extract Components
 */

import React, { useEffect, useRef, useState } from 'react';
import { useDraftState } from '../context/DraftRoomContext';
import { PickCard } from './PickCard';
import { DraftPick } from '../types/draft';

export interface DraftBoardProps {
  onPickClick?: (pickNumber: number) => void;
}

/**
 * Draft board component - horizontal scrolling picks
 */
export function DraftBoard({ onPickClick }: DraftBoardProps) {
  const state = useDraftState();
  const picksScrollRef = useRef<HTMLDivElement>(null);
  const [showOverallPickNumbers, setShowOverallPickNumbers] = useState(false);

  const { room, picks, currentUser, timer, isInGracePeriod } = state;

  if (!room) {
    return null;
  }

  const draftOrder = room.draftOrder || [];
  const totalRounds = room.settings.totalRounds || 18;
  const totalSlots = totalRounds * draftOrder.length;
  const isDraftActive = room.status === 'active';
  const currentPickNumber = picks.length + 1;

  // Auto-scroll to current pick
  useEffect(() => {
    if (picksScrollRef.current && picks.length > 0) {
      setTimeout(() => {
        const completedPicksCount = picks.length;
        const currentPickIndex = completedPicksCount - 1;
        const currentPickElement = picksScrollRef.current?.children[currentPickIndex];
        if (currentPickElement) {
          currentPickElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'start',
          });
        }
      }, 300);
    }
  }, [picks.length]);

  // Get pick data for a pick number
  const getPickForNumber = (pickNumber: number): DraftPick | null => {
    return picks.find((p) => p.pickNumber === pickNumber) || null;
  };

  // Calculate if a pick is on the clock
  const isPickOnTheClock = (pickNumber: number): boolean => {
    return pickNumber === currentPickNumber && isDraftActive;
  };

  // Calculate current picker for a pick number
  const getPickerForPick = (pickNumber: number): string => {
    const round = Math.ceil(pickNumber / draftOrder.length);
    const isSnakeRound = round % 2 === 0;
    const pickIndex = (pickNumber - 1) % draftOrder.length;
    const teamIndex = isSnakeRound
      ? draftOrder.length - 1 - pickIndex
      : pickIndex;
    return draftOrder[teamIndex] || `Team ${teamIndex + 1}`;
  };

  return (
    <div
      className="zoom-resistant"
      style={{
        position: 'relative',
        width: '100vw',
        left: '0',
        right: '0',
        marginLeft: '0',
        marginRight: '0',
        transform: 'translateZ(0)',
        paddingTop: '30px',
        paddingBottom: '30px',
        paddingLeft: '0',
        paddingRight: '0',
        backgroundColor: '#101927',
      }}
    >
      <div
        className="relative zoom-resistant"
        style={{
          position: 'relative',
          transform: 'translateZ(0)',
          overflow: 'visible',
          minWidth: '100%',
          width: '100%',
        }}
      >
        <div
          ref={picksScrollRef}
          className="flex overflow-x-auto custom-scrollbar zoom-resistant"
          style={{
            height: '256px',
            position: 'relative',
            gap: '4.5px',
            paddingRight: '0',
            paddingBottom: '0',
            transform: 'translateZ(0)',
            minWidth: '100%',
            paddingLeft: '0',
            overflowX: 'auto',
            overflowY: 'visible',
            scrollSnapType: 'x mandatory',
            scrollPaddingLeft: '0',
            scrollPaddingRight: '0',
            scrollPaddingTop: '0',
            scrollPaddingBottom: '0',
            scrollBehavior: 'smooth',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            width: '100%',
          }}
        >
          {Array.from({ length: totalSlots }, (_, i) => {
            const pickNumber = i + 1;
            const pick = getPickForNumber(pickNumber);
            const isOnTheClock = isPickOnTheClock(pickNumber);
            const picker = getPickerForPick(pickNumber);
            const isMyPick = picker === currentUser;

            return (
              <PickCard
                key={pickNumber}
                pickNumber={pickNumber}
                pick={pick}
                draftOrder={draftOrder}
                currentUser={currentUser}
                isOnTheClock={isOnTheClock}
                isDraftActive={isDraftActive}
                timer={timer}
                onClick={() => onPickClick?.(pickNumber)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
