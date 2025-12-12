import React from 'react';
import { useDraft } from '../providers/DraftProvider';
import LoadingSpinner from '../../../LoadingSpinner';
import ErrorBoundary from '../ui/ErrorBoundary';
import ElementRenderer from '../elements/ElementRenderer';
import { defaultLayout } from '../config/layouts';

/**
 * DraftLayout - Main layout component with element system
 * 
 * Features:
 * - Configurable layout system
 * - Easy element replacement
 * - Responsive design
 * - Error boundaries
 * - Performance monitoring
 */
export default function DraftLayout() {
  const { isLoading, error, room, participants, picks, availablePlayers, isMyTurn } = useDraft();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner message="Loading draft room..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Draft Room Error</h2>
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Development Mode Indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-600 text-black text-center py-1 text-sm font-bold">
          🔧 DEVELOPMENT MODE - Mock Data Active
        </div>
      )}
      
      <ErrorBoundary>
        <ElementRenderer element={defaultLayout.navbar} />
      </ErrorBoundary>
      
      <main className="flex-1 flex flex-col p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          {/* Left Column - Main Draft Area */}
          <div className="md:col-span-2 flex flex-col space-y-4">
            <ErrorBoundary>
              <ElementRenderer element={defaultLayout.roomInfo} />
            </ErrorBoundary>
            <ErrorBoundary>
              <ElementRenderer element={defaultLayout.pickCards} />
            </ErrorBoundary>
            <ErrorBoundary>
              <ElementRenderer element={defaultLayout.playerList} />
            </ErrorBoundary>
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="md:col-span-1 flex flex-col space-y-4">
            <ErrorBoundary>
              <ElementRenderer element={defaultLayout.queueManager} />
            </ErrorBoundary>
            <ErrorBoundary>
              <ElementRenderer element={defaultLayout.teamRoster} />
            </ErrorBoundary>
            <ErrorBoundary>
              <ElementRenderer element={defaultLayout.draftStats} />
            </ErrorBoundary>
            <ErrorBoundary>
              <ElementRenderer element={defaultLayout.chat} />
            </ErrorBoundary>
            <ErrorBoundary>
              <ElementRenderer element={defaultLayout.controls} />
            </ErrorBoundary>
            <ErrorBoundary>
              <ElementRenderer element={defaultLayout.settings} />
            </ErrorBoundary>
            <ErrorBoundary>
              <ElementRenderer element={defaultLayout.devTools} />
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
}