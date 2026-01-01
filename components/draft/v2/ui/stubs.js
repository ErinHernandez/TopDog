import React from 'react';

/**
 * Stub Components - Placeholder components for the element system
 * 
 * These allow the architecture to work immediately while components
 * are being developed. They can be easily replaced with full implementations.
 */

// Stub components that return basic implementations
export const TeamRoster = ({ showPositions = true, showStats = true }) => (
  <div className="p-4 bg-gray-800">
    <h3 className="font-bold text-white mb-2">My Team</h3>
    <p className="text-gray-400 text-sm">Your drafted players will appear here</p>
  </div>
);

export const DraftStats = ({ showPositionBreakdown = true, showValuePicks = true }) => (
  <div className="p-4 bg-gray-800">
    <h3 className="font-bold text-white mb-2">Draft Stats</h3>
    <p className="text-gray-400 text-sm">Statistics and analytics</p>
  </div>
);

export const Chat = () => (
  <div className="p-4 bg-gray-800">
    <h3 className="font-bold text-white mb-2">Chat</h3>
    <p className="text-gray-400 text-sm">Draft room chat (coming soon)</p>
  </div>
);

export const Controls = ({ mobile = false, showQueue = true }) => (
  <div className="p-4 bg-gray-800 border-t border-gray-700">
    <div className="flex justify-center space-x-4">
      <button className="px-4 py-2 bg-blue-600 text-white rounded">
        Auto Pick
      </button>
      <button className="px-4 py-2 bg-gray-600 text-white rounded">
        Settings
      </button>
    </div>
  </div>
);

export const Settings = () => (
  <div className="p-4 bg-gray-800">
    <h3 className="font-bold text-white mb-2">Settings</h3>
    <p className="text-gray-400 text-sm">Draft room settings</p>
  </div>
);

export const FullBoard = ({ showTeamLogos = true, showPositionColors = true, showStats = true }) => (
  <div className="p-8 bg-gray-800 text-center">
    <h2 className="text-2xl font-bold text-white mb-4">Full Draft Board</h2>
    <p className="text-gray-400">Complete draft board view will be implemented here</p>
    <p className="text-gray-400 text-sm mt-2">
      This will show the full FullDraftBoard component-style view
    </p>
  </div>
);

export const PlayerCard = () => (
  <div className="p-4 bg-gray-800">
    <h3 className="font-bold text-white mb-2">Player Card</h3>
    <p className="text-gray-400 text-sm">Individual player card component</p>
  </div>
);

export const Rankings = () => (
  <div className="p-4 bg-gray-800">
    <h3 className="font-bold text-white mb-2">Rankings</h3>
    <p className="text-gray-400 text-sm">Player rankings and custom lists</p>
  </div>
);

export const DraftBoard = () => (
  <div className="p-4 bg-gray-800">
    <h3 className="font-bold text-white mb-2">Draft Board</h3>
    <p className="text-gray-400 text-sm">Draft board display</p>
  </div>
);

export const PickHistory = () => (
  <div className="p-4 bg-gray-800">
    <h3 className="font-bold text-white mb-2">Pick History</h3>
    <p className="text-gray-400 text-sm">Recent picks and draft history</p>
  </div>
);

export const DraftTimer = () => (
  <div className="p-4 bg-gray-800 text-center">
    <div className="text-3xl font-bold text-white font-mono">30</div>
    <div className="text-sm text-gray-400">Seconds</div>
  </div>
);

export const PerformanceMonitor = ({ showMetrics = true, showLogs = true }) => (
  <div className="p-4 bg-gray-800">
    <h3 className="font-bold text-white mb-2">Performance Monitor</h3>
    <div className="space-y-2 text-sm">
      {showMetrics && (
        <div className="p-2 bg-gray-700 rounded">
          <div className="text-gray-300">Render Time: 12ms</div>
          <div className="text-gray-300">Memory: 45MB</div>
          <div className="text-gray-300">FPS: 60</div>
        </div>
      )}
      {showLogs && (
        <div className="p-2 bg-gray-700 rounded">
          <div className="text-green-400 text-xs">✓ Components loaded</div>
          <div className="text-blue-400 text-xs">ℹ Firebase connected</div>
          <div className="text-yellow-400 text-xs">⚠ Using stub components</div>
        </div>
      )}
    </div>
  </div>
);

// Export all stubs for easy importing
const Stubs = {
  TeamRoster,
  DraftStats,
  Chat,
  Controls,
  Settings,
  FullBoard,
  PlayerCard,
  Rankings,
  DraftBoard,
  PickHistory,
  DraftTimer,
  PerformanceMonitor
};

export default Stubs;