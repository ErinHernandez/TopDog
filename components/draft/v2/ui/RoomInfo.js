import React from 'react';
import { useDraft } from '../providers/DraftProvider';

/**
 * RoomInfo - Display current draft room information
 */
export default function RoomInfo({ 
  showTimer = true, 
  showPickNumber = true, 
  showRound = true 
}) {
  const { 
    room, 
    currentPick, 
    currentRound, 
    timer, 
    participants, 
    totalPicks, 
    picksRemaining,
    isDraftActive,
    isDraftComplete
  } = useDraft();

  const progress = ((totalPicks - picksRemaining) / totalPicks) * 100;

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Draft Progress */}
        <div className="flex items-center space-x-6">
          {showPickNumber && (
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {currentPick}
              </div>
              <div className="text-sm text-gray-400">
                Pick
              </div>
            </div>
          )}

          {showRound && (
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {currentRound}
              </div>
              <div className="text-sm text-gray-400">
                Round
              </div>
            </div>
          )}

          <div className="text-center">
            <div className="text-lg font-medium text-white">
              {participants.length}/12
            </div>
            <div className="text-sm text-gray-400">
              Players
            </div>
          </div>
        </div>

        {/* Timer */}
        {showTimer && isDraftActive && (
          <div className="text-center">
            <div className={`text-3xl font-bold font-mono ${
              timer <= 10 ? 'text-red-400' : timer <= 30 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {Math.max(0, timer)}
            </div>
            <div className="text-sm text-gray-400">
              Seconds
            </div>
          </div>
        )}

        {/* Status */}
        <div className="text-center">
          <div className={`px-3 py-1 rounded font-medium ${
            isDraftComplete 
              ? 'bg-green-600 text-white' 
              : isDraftActive 
                ? 'bg-blue-600 text-white' 
                : 'bg-yellow-600 text-white'
          }`}>
            {isDraftComplete ? 'Complete' : isDraftActive ? 'Active' : 'Waiting'}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            {room?.name || 'Draft Room'}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Draft Progress</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}