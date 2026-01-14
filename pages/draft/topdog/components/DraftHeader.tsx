/**
 * DraftHeader
 * 
 * Header component displaying timer, current pick, and round information.
 * Uses context to get state.
 * 
 * Part of Phase 3: Extract Components
 */

import React from 'react';
import { useDraftState } from '../context/DraftRoomContext';

export function DraftHeader() {
  const state = useDraftState();
  const { room, timer, currentUser } = state;

  if (!room) {
    return null;
  }

  // Calculate current pick info
  const currentPickerIndex = (room.currentPick - 1) % room.draftOrder.length;
  const currentPicker = room.draftOrder[currentPickerIndex] || '';
  const round = Math.ceil(room.currentPick / room.draftOrder.length);
  const isMyTurn = currentPicker === currentUser;

  // Timer color based on remaining time
  const timerColor = timer <= 10 ? 'text-red-500' : timer <= 20 ? 'text-yellow-500' : 'text-white';

  return (
    <header className="bg-gray-800 border-b border-gray-700 p-4">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        {/* Left: Round and Pick Info */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            <span className="font-semibold text-white">Round {round}</span>
            <span className="mx-2">•</span>
            <span className="font-semibold text-white">Pick {room.currentPick}</span>
          </div>
        </div>

        {/* Center: Timer */}
        <div className="text-center">
          <div className={`text-4xl font-bold ${timerColor} transition-colors`}>
            {timer}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            {isMyTurn ? (
              <span className="text-green-400 font-semibold">Your Pick!</span>
            ) : (
              <span>{currentPicker}&apos;s turn</span>
            )}
          </div>
        </div>

        {/* Right: User Info */}
        <div className="text-right">
          <div className="text-sm text-gray-400">
            <span className="text-gray-300">You: </span>
            <span className="font-semibold text-white">{currentUser}</span>
          </div>
          {room.status === 'paused' && (
            <div className="text-xs text-yellow-400 mt-1">Draft Paused</div>
          )}
        </div>
      </div>
    </header>
  );
}
