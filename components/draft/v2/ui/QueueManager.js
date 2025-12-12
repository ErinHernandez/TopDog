import React from 'react';
import { useDraft } from '../providers/DraftProvider';

/**
 * QueueManager - Manage player queue for auto-picking
 */
export default function QueueManager({ 
  allowReorder = true, 
  showADP = true 
}) {
  const { queue, removeFromQueue, isMyTurn, makePick } = useDraft();

  const handleDraftNext = () => {
    if (queue.length > 0 && isMyTurn) {
      makePick(queue[0].name);
    }
  };

  const handleRemoveFromQueue = (playerName) => {
    removeFromQueue(playerName);
  };

  if (queue.length === 0) {
    return (
      <div className="p-4 bg-gray-800">
        <h3 className="font-bold text-white mb-2">Queue</h3>
        <p className="text-gray-400 text-sm">
          Add players to your queue for quick picking
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-white">Queue ({queue.length})</h3>
        {isMyTurn && queue.length > 0 && (
          <button
            onClick={handleDraftNext}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            Draft Next
          </button>
        )}
      </div>

      <div className="space-y-2">
        {queue.map((player, index) => (
          <div
            key={player.name}
            className="flex items-center justify-between p-2 bg-gray-700 rounded"
          >
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm font-mono">
                {index + 1}.
              </span>
              <div>
                <div className="text-white font-medium">{player.name}</div>
                <div className="text-gray-400 text-sm">
                  {player.position} - {player.team}
                  {showADP && ` (${player.adp.toFixed(1)})`}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => handleRemoveFromQueue(player.name)}
              className="text-red-400 hover:text-red-300 p-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}