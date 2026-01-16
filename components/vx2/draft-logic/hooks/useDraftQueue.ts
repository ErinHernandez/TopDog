/**
 * VX2 Draft Logic - Draft Queue Hook
 * 
 * Manages the user's pick queue with persistence.
 * All new implementation - no code reuse.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { DraftPlayer, QueuedPlayer } from '../types';
import { STORAGE_KEYS } from '../constants';

// Debounce delay for localStorage saves (ms)
const STORAGE_SAVE_DEBOUNCE = 300;

// ============================================================================
// TYPES
// ============================================================================

export interface UseDraftQueueOptions {
  /** Room ID for namespacing storage */
  roomId?: string;
  /** IDs of players already picked (to auto-remove from queue) */
  pickedPlayerIds?: Set<string>;
  /** Persist queue to localStorage */
  persist?: boolean;
}

export interface UseDraftQueueResult {
  /** Current queue */
  queue: QueuedPlayer[];
  /** Queue player IDs in order */
  queueIds: string[];
  /** Number of players in queue */
  queueLength: number;
  /** Add player to queue */
  addToQueue: (player: DraftPlayer) => void;
  /** Remove player from queue */
  removeFromQueue: (playerId: string) => void;
  /** Move player up in queue */
  moveUp: (playerId: string) => void;
  /** Move player down in queue */
  moveDown: (playerId: string) => void;
  /** Reorder queue (drag and drop) */
  reorder: (fromIndex: number, toIndex: number) => void;
  /** Clear entire queue */
  clearQueue: () => void;
  /** Check if player is in queue */
  isQueued: (playerId: string) => boolean;
  /** Get queue position for player (1-indexed, or null) */
  getQueuePosition: (playerId: string) => number | null;
  /** Get next available player from queue */
  getNextInQueue: () => QueuedPlayer | null;
}

// ============================================================================
// HELPERS
// ============================================================================

function getStorageKey(roomId?: string): string {
  return roomId 
    ? `${STORAGE_KEYS.queue}_${roomId}` 
    : STORAGE_KEYS.queue;
}

function loadQueue(roomId?: string): QueuedPlayer[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(getStorageKey(roomId));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedPlayer[], roomId?: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(getStorageKey(roomId), JSON.stringify(queue));
  } catch {
    // Ignore storage errors
  }
}

function playerToQueued(player: DraftPlayer, position: number): QueuedPlayer {
  return {
    ...player,
    queuePosition: position,
    queuedAt: Date.now(),
  };
}

// ============================================================================
// HOOK
// ============================================================================

export function useDraftQueue({
  roomId,
  pickedPlayerIds = new Set<string>(),
  persist = true,
}: UseDraftQueueOptions = {}): UseDraftQueueResult {
  // Load initial queue
  const [queue, setQueue] = useState<QueuedPlayer[]>(() =>
    persist ? loadQueue(roomId) : []
  );

  // Ref for debounced save timeout
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create lookup set for O(1) checks
  const queuedIds = useMemo(
    () => new Set(queue.map(p => p.id)),
    [queue]
  );

  // Auto-remove picked players from queue
  useEffect(() => {
    if (pickedPlayerIds.size === 0) return;

    setQueue(prev => {
      const filtered = prev.filter(p => !pickedPlayerIds.has(p.id));
      if (filtered.length !== prev.length) {
        // Re-index queue positions
        return filtered.map((p, i) => ({ ...p, queuePosition: i }));
      }
      return prev;
    });
  }, [pickedPlayerIds]);

  // Persist queue changes with debouncing
  useEffect(() => {
    if (!persist) return;

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce the save to avoid rapid localStorage writes
    saveTimeoutRef.current = setTimeout(() => {
      saveQueue(queue, roomId);
    }, STORAGE_SAVE_DEBOUNCE);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [queue, roomId, persist]);
  
  // Add player to end of queue
  const addToQueue = useCallback((player: DraftPlayer) => {
    setQueue(prev => {
      // Don't add if already queued
      if (prev.some(p => p.id === player.id)) {
        return prev;
      }
      const queued = playerToQueued(player, prev.length);
      return [...prev, queued];
    });
  }, []);
  
  // Remove player from queue
  const removeFromQueue = useCallback((playerId: string) => {
    setQueue(prev => {
      const filtered = prev.filter(p => p.id !== playerId);
      // Re-index positions
      return filtered.map((p, i) => ({ ...p, queuePosition: i }));
    });
  }, []);
  
  // Move player up in queue
  const moveUp = useCallback((playerId: string) => {
    setQueue(prev => {
      const index = prev.findIndex(p => p.id === playerId);
      if (index <= 0) return prev; // Already at top or not found
      
      const newQueue = [...prev];
      [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
      
      // Update positions
      return newQueue.map((p, i) => ({ ...p, queuePosition: i }));
    });
  }, []);
  
  // Move player down in queue
  const moveDown = useCallback((playerId: string) => {
    setQueue(prev => {
      const index = prev.findIndex(p => p.id === playerId);
      if (index < 0 || index >= prev.length - 1) return prev; // At bottom or not found
      
      const newQueue = [...prev];
      [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
      
      // Update positions
      return newQueue.map((p, i) => ({ ...p, queuePosition: i }));
    });
  }, []);
  
  // Reorder via drag and drop
  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    setQueue(prev => {
      if (fromIndex < 0 || fromIndex >= prev.length) return prev;
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      if (fromIndex === toIndex) return prev;
      
      const newQueue = [...prev];
      const [removed] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, removed);
      
      // Update positions
      return newQueue.map((p, i) => ({ ...p, queuePosition: i }));
    });
  }, []);
  
  // Clear queue
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);
  
  // Check if player is queued
  const isQueued = useCallback((playerId: string): boolean => {
    return queuedIds.has(playerId);
  }, [queuedIds]);
  
  // Get queue position (1-indexed for display)
  const getQueuePosition = useCallback((playerId: string): number | null => {
    const index = queue.findIndex(p => p.id === playerId);
    return index >= 0 ? index + 1 : null;
  }, [queue]);
  
  // Get next available player
  const getNextInQueue = useCallback((): QueuedPlayer | null => {
    // Find first player not already picked
    for (const player of queue) {
      if (!pickedPlayerIds.has(player.id)) {
        return player;
      }
    }
    return null;
  }, [queue, pickedPlayerIds]);
  
  return {
    queue,
    queueIds: queue.map(p => p.id),
    queueLength: queue.length,
    addToQueue,
    removeFromQueue,
    moveUp,
    moveDown,
    reorder,
    clearQueue,
    isQueued,
    getQueuePosition,
    getNextInQueue,
  };
}

export default useDraftQueue;

