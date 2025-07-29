import React, { useState } from 'react';
import { clearPicksForRoom, clearPicksForCompletedRooms } from '../../lib/clearPicks';

export default function ClearPicksAdmin() {
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleClearSingleRoom = async () => {
    if (!roomId.trim()) {
      setMessage('Please enter a room ID');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await clearPicksForRoom(roomId.trim());
      setMessage(`Successfully cleared picks for room: ${roomId}`);
      setRoomId('');
    } catch (error) {
      setMessage(`Error clearing picks: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCompletedRooms = async () => {
    setLoading(true);
    setMessage('');

    try {
      await clearPicksForCompletedRooms();
      setMessage('Successfully cleared picks for all completed rooms');
    } catch (error) {
      setMessage(`Error clearing picks: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8" style={{ color: '#c4b5fd' }}>
          Clear Draft Picks - Admin
        </h1>

        <div className="bg-white/10 rounded p-6 mb-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#2DE2C5' }}>
            Clear Picks for Specific Room
          </h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              id="room-id-input"
              name="roomId"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="flex-1 px-3 py-2 rounded text-black"
            />
            <button
              onClick={handleClearSingleRoom}
              disabled={loading}
              className="px-4 py-2 rounded bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Clearing...' : 'Clear Picks'}
            </button>
          </div>
        </div>

        <div className="bg-white/10 rounded p-6 mb-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#2DE2C5' }}>
            Clear Picks for All Completed Rooms
          </h2>
          <p className="text-gray-300 mb-4">
            This will clear picks for all rooms with status 'completed'
          </p>
          <button
            onClick={handleClearCompletedRooms}
            disabled={loading}
            className="px-4 py-2 rounded bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Clearing...' : 'Clear All Completed'}
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded ${
            message.includes('Error') ? 'bg-red-600' : 'bg-green-600'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-yellow-600/20 border border-yellow-600 rounded p-4 mt-6">
          <h3 className="font-bold mb-2" style={{ color: '#c4b5fd' }}>
            ⚠️ Important Notes:
          </h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• This action cannot be undone</li>
            <li>• Only use this for debugging or maintenance</li>
            <li>• The system should automatically clear picks when drafts complete</li>
            <li>• Each new draft room gets a unique ID to prevent pick persistence</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 