/**
 * LiveDraftsTabVX - Live Drafts Tab (TypeScript)
 * 
 * Migrated from: components/mobile/tabs/LiveDraftsTab.js
 * 
 * Shows user's currently active drafts
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface LiveDraftsTabVXProps {
  onJoinDraft?: () => void;
  onEnterDraft?: (draftId: string) => void;
}

interface MockDraft {
  id: string;
  tournamentName: string;
  pickNumber: number;
  totalPicks: number;
  status: 'your-turn' | 'waiting' | 'complete';
  timeLeft?: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_DRAFTS: MockDraft[] = [
  {
    id: '1',
    tournamentName: 'TopDog International',
    pickNumber: 42,
    totalPicks: 216,
    status: 'your-turn',
    timeLeft: '0:45'
  },
  {
    id: '2',
    tournamentName: 'TopDog International',
    pickNumber: 89,
    totalPicks: 216,
    status: 'waiting',
  },
  {
    id: '3',
    tournamentName: 'TopDog International',
    pickNumber: 156,
    totalPicks: 216,
    status: 'waiting',
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LiveDraftsTabVX({ 
  onJoinDraft,
  onEnterDraft
}: LiveDraftsTabVXProps): React.ReactElement {
  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700/50">
        <h2 className="text-lg font-semibold text-white">Your Live Drafts</h2>
        <p className="text-sm text-gray-400">{MOCK_DRAFTS.length} active drafts</p>
      </div>

      {/* Drafts List */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div className="px-4 py-2 space-y-3">
          {MOCK_DRAFTS.map((draft) => (
            <DraftCard 
              key={draft.id} 
              draft={draft} 
              onClick={() => onEnterDraft?.(draft.id)}
            />
          ))}
        </div>
      </div>

      {/* Join New Draft Button */}
      <div className="p-4 border-t border-gray-700/50">
        <button
          onClick={onJoinDraft}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Join New Draft
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface DraftCardProps {
  draft: MockDraft;
  onClick?: () => void;
}

function DraftCard({ draft, onClick }: DraftCardProps): React.ReactElement {
  const isYourTurn = draft.status === 'your-turn';
  
  return (
    <button 
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-colors ${
        isYourTurn 
          ? 'bg-green-900/30 border-green-500/50 hover:bg-green-900/50' 
          : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-white">{draft.tournamentName}</h3>
        {isYourTurn && (
          <span className="px-2 py-1 bg-green-500 text-black text-xs font-bold rounded">
            YOUR TURN
          </span>
        )}
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          Pick {draft.pickNumber} of {draft.totalPicks}
        </span>
        {isYourTurn && draft.timeLeft && (
          <span className="text-green-400 font-mono font-bold">
            {draft.timeLeft}
          </span>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className="mt-2 w-full bg-gray-700 rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full ${isYourTurn ? 'bg-green-500' : 'bg-teal-500'}`}
          style={{ width: `${(draft.pickNumber / draft.totalPicks) * 100}%` }}
        />
      </div>
    </button>
  );
}

