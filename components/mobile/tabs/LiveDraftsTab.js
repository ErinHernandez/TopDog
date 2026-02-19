/**
 * LiveDraftsTab - Active Drafts List
 * 
 * Extracted from pages/mobile.js for maintainability
 * Shows user's currently active draft rooms
 */

import React from 'react';

export default function LiveDraftsTab({ onJoinDraft }) {
  return (
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white mb-2">Live Drafts</h2>
        <p className="text-gray-400 mb-6">No active drafts at the moment</p>
        <button 
          onClick={onJoinDraft}
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
        >
          Join a Draft
        </button>
      </div>
    </div>
  );
}

