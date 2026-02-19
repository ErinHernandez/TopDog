/**
 * React Hook for Tournament Data Collection
 * Easy integration with existing draft rooms
 */

import { useEffect, useRef } from 'react';

import { createScopedLogger } from '../lib/clientLogger';
import { draftDataCollector } from '../lib/draftDataIntegration';

const logger = createScopedLogger('[TournamentData]');

interface Participant {
  id?: string;
  user?: string;
  userId?: string;
  name?: string;
  username?: string;
  displayName?: string;
  teamName?: string;
}

interface PlayerData {
  id?: string;
  position?: string;
  team?: string;
  adp?: number;
  proj?: number;
}

interface Pick {
  user?: string;
  userId?: string;
  username?: string;
  player?: string;
  playerName?: string;
  playerData?: PlayerData;
  position?: string;
  team?: string;
  timeUsed?: number | null;
  wasTimeout?: boolean;
  wasAutodraft?: boolean;
  autodrafted?: boolean;
  source?: string;
  adp?: number;
  projectedPoints?: number;
}

interface RecordPickData {
  userId?: string;
  username?: string;
  playerId?: string;
  playerName?: string;
  position?: string;
  team?: string;
  timeUsed?: number | null;
  wasTimeout?: boolean;
  wasAutodraft?: boolean;
  pickSource?: string;
  adp?: number;
  projectedPoints?: number;
}

interface UseTournamentDataCollectionReturn {
  recordPick: (pickData: RecordPickData) => void;
  startPickTimer: (userId: string) => void;
  getDraftStatus: () => unknown;
  exportDraftData: (format?: string) => unknown;
}

export function useTournamentDataCollection(
  roomId: string | undefined,
  participants: Participant[] | undefined,
  picks: Pick[] | undefined
): UseTournamentDataCollectionReturn {
  const isInitialized = useRef<boolean>(false);
  const lastPickCount = useRef<number>(0);

  // Initialize data collection when draft starts
  useEffect(() => {
    if (roomId && participants?.length && !isInitialized.current) {
      logger.debug('Initializing tournament data collection', { roomId });

      try {
        draftDataCollector.initializeDraftDataCollection(
          roomId,
          participants.map(p => ({
            userId: p.id || p.user || p.userId || '',
            username: p.name || p.username || p.displayName || '',
            teamName: p.teamName || `${p.name || p.username}'s Team`
          }))
        );

        isInitialized.current = true;
        logger.debug('Tournament data collection initialized');
      } catch (error) {
        logger.error('Failed to initialize tournament data collection', error instanceof Error ? error : new Error(String(error)));
      }
    }
  }, [roomId, participants]);

  // Record new picks as they happen
  useEffect(() => {
    if (!isInitialized.current || !picks) return;

    const newPickCount = picks.length;

    // Only process if we have new picks
    if (newPickCount > lastPickCount.current) {
      const newPicks = picks.slice(lastPickCount.current);

      newPicks.forEach((pick) => {
        try {
          // Extract player data from pick
          const playerData = pick.playerData || {};

          draftDataCollector.recordDraftPick({
            userId: pick.user || pick.userId || '',
            username: pick.username || pick.user || '',
            playerId: playerData.id || `player_${pick.player?.replace(/\s+/g, '_') || 'unknown'}`,
            playerName: pick.player || pick.playerName || '',
            position: playerData.position || pick.position || '',
            team: playerData.team || pick.team || '',
            wasTimeout: pick.wasTimeout || false,
            wasAutodraft: pick.wasAutodraft || pick.autodrafted || false,
            adp: playerData.adp || pick.adp || null,
            projectedPoints: playerData.proj || pick.projectedPoints || null
          });

          logger.debug('Recorded pick', { player: pick.player, user: pick.user });
        } catch (error) {
          logger.error('Failed to record pick', error instanceof Error ? error : new Error(String(error)), { player: pick.player });
        }
      });

      lastPickCount.current = newPickCount;
    }
  }, [picks]);

  // Complete draft when finished
  useEffect(() => {
    return () => {
      if (isInitialized.current) {
        logger.debug('Draft completed, finalizing data collection');
        try {
          draftDataCollector.completeDraft();
        } catch (error) {
          logger.error('Failed to complete draft data collection', error instanceof Error ? error : new Error(String(error)));
        }
      }
    };
  }, []);

  // Return utility functions for manual integration if needed
  return {
    recordPick: (pickData: RecordPickData) => {
      if (isInitialized.current) {
        draftDataCollector.recordDraftPick(pickData as any);
      }
    },

    startPickTimer: (userId: string) => {
      if (isInitialized.current) {
        draftDataCollector.startPickTimer(userId);
      }
    },

    getDraftStatus: () => {
      if (isInitialized.current) {
        return draftDataCollector.getDraftStatus();
      }
      return null;
    },

    exportDraftData: (format = 'json') => {
      if (isInitialized.current) {
        return draftDataCollector.exportCurrentDraft(format);
      }
      return null;
    }
  };
}
