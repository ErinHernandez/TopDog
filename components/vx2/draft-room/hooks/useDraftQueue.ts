/**
 * useDraftQueue - Player queue management hook
 * 
 * Manages the user's draft queue with localStorage persistence.
 * Automatically removes picked players from queue.
 * 
 * @example
 * ```tsx
 * const { queue, addToQueue, removeFromQueue, isQueued } = useDraftQueue({
 *   pickedPlayerIds: picks.map(p => p.player.id),
 * });
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { DraftPlayer, QueuedPlayer } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface UseDraftQueueOptions {
  /** IDs of players that have been picked (to auto-remove from queue) */
  pickedPlayerIds?: string[];
  /** Storage key for localStorage */
  storageKey?: string;
}

export interface UseDraftQueueResult {
  /** Players in the queue */
  queue: QueuedPlayer[];
  /** Number of players in queue */
  queueCount: number;
  
  /** Add a player to the queue */
  addToQueue: (player: DraftPlayer) => void;
  /** Remove a player from the queue */
  removeFromQueue: (playerId: string) => void;
  /** Reorder queue (drag and drop) */
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  /** Clear all players from queue */
  clearQueue: () => void;
  /** Toggle player in queue (add if not queued, remove if queued) */
  toggleQueue: (player: DraftPlayer) => void;
  
  /** Check if a player is in the queue */
  isQueued: (playerId: string) => boolean;
  /** Get next player in queue (first available) */
  getNextInQueue: () => QueuedPlayer | null;
  /** Get queue position for a player (1-indexed, null if not queued) */
  getQueuePosition: (playerId: string) => number | null;
}

// ============================================================================
// STORAGE HELPERS
// ============================================================================

const DEFAULT_STORAGE_KEY = 'vx2-draft-queue';

function loadQueueFromStorage(key: string): QueuedPlayer[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveQueueToStorage(key: string, queue: QueuedPlayer[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(queue));
  } catch {
    // Storage full or unavailable
  }
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing draft queue
 */
export function useDraftQueue({
  pickedPlayerIds = [],
  storageKey = DEFAULT_STORAGE_KEY,
}: UseDraftQueueOptions = {}): UseDraftQueueResult {
  // Initialize from localStorage
  const [queue, setQueue] = useState<QueuedPlayer[]>(() => 
    loadQueueFromStorage(storageKey)
  );
  
  // Persist to localStorage on change
  useEffect(() => {
    saveQueueToStorage(storageKey, queue);
  }, [queue, storageKey]);
  
  // Auto-remove picked players from queue
  useEffect(() => {
    if (pickedPlayerIds.length === 0) return;
    
    setQueue(prev => {
      const filtered = prev.filter(p => !pickedPlayerIds.includes(p.id));
      if (filtered.length === prev.length) return prev; // No change
      
      // Reindex queue positions
      return filtered.map((p, index) => ({
          ...p,
        queuePosition: index,
        }));
    });
  }, [pickedPlayerIds]);
  
  // Derived values
  const queueCount = queue.length;
  
  // Create a Set for fast lookup
  const queuedIds = useMemo(() => new Set(queue.map(p => p.id)), [queue]);
  
  // Actions
  const addToQueue = useCallback((player: DraftPlayer) => {
    setQueue(prev => {
      // Don't add if already queued
      if (prev.some(p => p.id === player.id)) return prev;
      
      const queuedPlayer: QueuedPlayer = {
        ...player,
        queuedAt: Date.now(),
        queuePosition: prev.length,
      };
      
      return [...prev, queuedPlayer];
    });
  }, []);
  
  const removeFromQueue = useCallback((playerId: string) => {
    setQueue(prev => {
      const filtered = prev.filter(p => p.id !== playerId);
      if (filtered.length === prev.length) return prev; // No change
      
      // Reindex queue positions
      return filtered.map((p, index) => ({
        ...p,
        queuePosition: index,
      }));
    });
  }, []);
  
  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue(prev => {
      if (fromIndex === toIndex) return prev;
      if (fromIndex < 0 || fromIndex >= prev.length) return prev;
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      
      const newQueue = [...prev];
      const [moved] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, moved);
      
      // Reindex queue positions
      return newQueue.map((p, index) => ({
        ...p,
        queuePosition: index,
      }));
    });
  }, []);
  
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);
  
  const toggleQueue = useCallback((player: DraftPlayer) => {
    setQueue(prev => {
      const existingIndex = prev.findIndex(p => p.id === player.id);
      
      if (existingIndex >= 0) {
        // Remove from queue
        const filtered = prev.filter((_, i) => i !== existingIndex);
        return filtered.map((p, index) => ({
          ...p,
          queuePosition: index,
        }));
      } else {
        // Add to queue
        const queuedPlayer: QueuedPlayer = {
          ...player,
          queuedAt: Date.now(),
          queuePosition: prev.length,
        };
        return [...prev, queuedPlayer];
      }
    });
  }, []);
  
  // Queries
  const isQueued = useCallback((playerId: string): boolean => {
    return queuedIds.has(playerId);
  }, [queuedIds]);
  
  const getNextInQueue = useCallback((): QueuedPlayer | null => {
    return queue[0] ?? null;
  }, [queue]);
  
  const getQueuePosition = useCallback((playerId: string): number | null => {
    const index = queue.findIndex(p => p.id === playerId);
    return index >= 0 ? index + 1 : null;
  }, [queue]);
  
  return {
    queue,
    queueCount,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    toggleQueue,
    isQueued,
    getNextInQueue,
    getQueuePosition,
  };
}

export default useDraftQueue;
