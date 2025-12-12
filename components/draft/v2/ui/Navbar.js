import React from 'react';
import Link from 'next/link';
import { useDraft } from '../providers/DraftProvider';

/**
 * Navbar - Draft room navigation and controls
 * 
 * Features:
 * - Room information display
 * - User status
 * - Navigation controls
 * - View mode switching
 * - Responsive design
 */
export default function Navbar({ 
  showLogo = true, 
  showUserInfo = true, 
  compact = false,
  minimal = false,
  showDevTools = false
}) {
  const { 
    room, 
    userName, 
    participants, 
    currentPick, 
    currentRound, 
    viewMode, 
    setViewMode,
    isDraftActive,
    isDraftComplete
  } = useDraft();

  const getStatusColor = () => {
    if (isDraftComplete) return 'text-green-400';
    if (isDraftActive) return 'text-blue-400';
    return 'text-yellow-400';
  };

  const getStatusText = () => {
    if (isDraftComplete) return 'Complete';
    if (isDraftActive) return 'Active';
    return 'Waiting';
  };

  if (minimal) {
    return (
      <nav className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">
            Draft Board
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setViewMode('standard')}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
            >
              Back to Draft
            </button>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={`bg-gray-800 border-b border-gray-700 ${compact ? 'px-2 py-1' : 'px-6 py-3'}`}>
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-6">
          {showLogo && (
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BB</span>
              </div>
              {!compact && <span className="text-xl font-bold text-white">Best Ball</span>}
            </Link>
          )}

          {/* Room Info */}
          <div className={`flex items-center space-x-4 ${compact ? 'text-sm' : ''}`}>
            <div className="text-white">
              <span className="font-medium">{room?.name || 'Draft Room'}</span>
            </div>
            
            <div className={`px-2 py-1 rounded text-xs ${getStatusColor()} bg-gray-700`}>
              {getStatusText()}
            </div>

            {isDraftActive && (
              <div className="text-gray-300 text-sm">
                Pick {currentPick} • Round {currentRound}
              </div>
            )}
          </div>
        </div>

        {/* Center Section - View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <div className="bg-gray-700 rounded-lg p-1 flex">
            <button
              onClick={() => setViewMode('standard')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'standard' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Draft
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'board' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Board
            </button>
            {!compact && (
              <button
                onClick={() => setViewMode('compact')}
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === 'compact' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Compact
              </button>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {showUserInfo && (
            <div className={`text-gray-300 ${compact ? 'text-sm' : ''}`}>
              <span className="text-white font-medium">{userName || 'Guest'}</span>
              <span className="text-gray-400 ml-2">
                ({participants.length}/12 players)
              </span>
            </div>
          )}

          {showDevTools && process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => setViewMode('development')}
              className="px-3 py-1 bg-purple-600 text-white rounded text-sm"
            >
              Dev Tools
            </button>
          )}

          {/* Settings/Menu */}
          <div className="relative">
            <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Development Banner */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 px-3 py-1 bg-yellow-600 text-yellow-100 text-xs rounded">
          <strong>Development Mode:</strong> V2 Draft Room Architecture
        </div>
      )}
    </nav>
  );
}