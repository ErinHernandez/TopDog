/**
 * useDraftQueue
 * 
 * Hook for managing draft queue with localStorage persistence.
 * Handles queue CRUD operations and sync with picked players.
 * 
 * Part of Phase 2: Extract Hooks
 */

import { useEffect, useCallback } from 'react';
import { useDraftState, useDraftDispatch } from '../context/DraftRoomContext';
import { logger } from '@/lib/structuredLogger';
import { Player } from '../types/draft';

export interface UseDraftQueueOptions {
  storageKey?: string;
}

export interface UseDraftQueueResult {
  queue: Player[];
  addToQueue: (player: Player) => void;
  removeFromQueue: (playerName: string) => void;
  clearQueue: () => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
}

const DEFAULT_STORAGE_KEY = 'draftQueue';

/**
 * Hook for managing draft queue
 */
export function useDraftQueue({
  storageKey = DEFAULT_STORAGE_KEY,
}: UseDraftQueueOptions = {}): UseDraftQueueResult {
  const state = useDraftState();
  const dispatch = useDraftDispatch();
  const { queue, picks } = state;

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedQueue = JSON.parse(stored);
        if (Array.isArray(parsedQueue)) {
          // Validate queue items
          const validQueue = parsedQueue.filter(
            (item: unknown) =>
              item &&
              typeof item === 'object' &&
              'name' in item &&
              typeof (item as { name: unknown }).name === 'string'
          ) as Player[];
          dispatch({ type: 'SET_QUEUE', payload: validQueue });
        }
      }
    } catch (error) {
      logger.error('Error loading queue from localStorage', error, {
        component: 'useDraftQueue',
      });
      localStorage.removeItem(storageKey);
    }
  }, [storageKey, dispatch]);

  // Save to localStorage when queue changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (Array.isArray(queue) && queue.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(queue));
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      logger.error('Error saving queue to localStorage', error, {
        component: 'useDraftQueue',
      });
    }
  }, [queue, storageKey]);

  // Remove picked players from queue
  useEffect(() => {
    const pickedPlayerNames = new Set(picks.map((p) => p.player));
    const shouldRemove = queue.some((p) => pickedPlayerNames.has(p.name));

    if (shouldRemove) {
      const filteredQueue = queue.filter((p) => !pickedPlayerNames.has(p.name));
      dispatch({ type: 'SET_QUEUE', payload: filteredQueue });
    }
  }, [picks, queue, dispatch]);

  // Add to queue
  const addToQueue = useCallback(
    (player: Player) => {
      if (queue.some((p) => p.name === player.name)) {
        logger.debug('Player already in queue', {
          playerName: player.name,
          component: 'useDraftQueue',
        });
        return; // Already in queue
      }

      dispatch({ type: 'ADD_TO_QUEUE', payload: player });
    },
    [queue, dispatch]
  );

  // Remove from queue
  const removeFromQueue = useCallback(
    (playerName: string) => {
      dispatch({ type: 'REMOVE_FROM_QUEUE', payload: playerName });
    },
    [dispatch]
  );

  // Clear queue
  const clearQueue = useCallback(() => {
    dispatch({ type: 'SET_QUEUE', payload: [] });
  }, [dispatch]);

  // Reorder queue (for drag-drop)
  const reorderQueue = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newQueue = [...queue];
      const [removed] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, removed);
      dispatch({ type: 'SET_QUEUE', payload: newQueue });
    },
    [queue, dispatch]
  );

  return {
    queue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    reorderQueue,
  };
}
