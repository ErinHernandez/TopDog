/**
 * DraftRoomNew
 * 
 * New refactored draft room implementation.
 * Integrates all components, hooks, and services.
 * 
 * Part of Phase 4: Integration
 */

import React, { useState, useEffect } from 'react';
import { DraftErrorBoundary } from './components/DraftErrorBoundary';
import { DraftRoomProvider, useDraftRoom } from './context/DraftRoomContext';
import { DraftRoomLayout } from './components/DraftRoomLayout';
import { useDraftSocket } from './hooks/useDraftSocket';
import { useDraftTimer } from './hooks/useDraftTimer';
import { useDraftActions } from './hooks/useDraftActions';
import { useDraftQueue } from './hooks/useDraftQueue';
import { usePlayerFilters } from './hooks/usePlayerFilters';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Player } from './types/draft';
import { logger } from '@/lib/structuredLogger';

export interface DraftRoomNewProps {
  roomId: string;
}

/**
 * Inner component that uses hooks (must be inside DraftRoomProvider)
 */
function DraftRoomContent({ roomId }: { roomId: string }) {
  const { state, dispatch } = useDraftRoom();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Initialize all hooks
  useDraftSocket({ roomId });
  useDraftTimer({
    onExpire: () => {
      // Timer expiration handled in useDraftActions hook
      logger.info('Timer expired', { roomId, component: 'DraftRoomNew' });
    },
  });
  const { makePickAction, canDraftPlayerAction } = useDraftActions();
  const { queue, addToQueue, removeFromQueue } = useDraftQueue();
  usePlayerFilters(); // Initialize filters hook

  // Handle player click (open player modal - can be implemented later)
  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
    logger.info('Player clicked', { playerName: player.name, component: 'DraftRoomNew' });
    // TODO: Open player modal
  };

  // Handle pick click (select team - can be implemented later)
  const handlePickClick = (pickNumber: number) => {
    logger.info('Pick clicked', { pickNumber, component: 'DraftRoomNew' });
    // TODO: Show team modal or select team
  };

  // Show loading state
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-[#101927] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4">Loading Draft Room...</div>
          <div className="text-gray-400">Connecting to room {roomId}...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (state.error) {
    return (
      <div className="min-h-screen bg-[#101927] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4 text-red-400">Error</div>
          <div className="text-gray-400 mb-4">{state.error.message}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <DraftRoomLayout
      onPlayerClick={handlePlayerClick}
      onPickClick={handlePickClick}
    />
  );
}

/**
 * New draft room implementation
 * 
 * This is the main entry point for the refactored draft room.
 * It sets up the context provider and error boundary.
 */
export function DraftRoomNew({ roomId }: DraftRoomNewProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Get current user
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      logger.info('Auth state changed', {
        userId: currentUser?.uid,
        displayName: currentUser?.displayName,
        component: 'DraftRoomNew',
      });
    });

    return () => unsubscribe();
  }, []);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#101927] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4">Loading...</div>
          <div className="text-gray-400">Checking authentication...</div>
        </div>
      </div>
    );
  }

  // Require authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-[#101927] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4">Authentication Required</div>
          <div className="text-gray-400 mb-4">
            Please sign in to join the draft room.
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Get user identifier (displayName or uid)
  const userIdentifier = user.displayName || user.uid;

  return (
    <DraftErrorBoundary roomId={roomId}>
      <DraftRoomProvider initialUser={userIdentifier}>
        <DraftRoomContent roomId={roomId} />
      </DraftRoomProvider>
    </DraftErrorBoundary>
  );
}
