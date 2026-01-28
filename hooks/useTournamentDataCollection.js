/**
 * React Hook for Tournament Data Collection
 * Easy integration with existing draft rooms
 */

import { useEffect, useRef } from 'react';
import { draftDataCollector } from '../lib/draftDataIntegration.js';
import { createScopedLogger } from '../lib/clientLogger';

const logger = createScopedLogger('[TournamentData]');

export function useTournamentDataCollection(roomId, participants, picks) {
  const isInitialized = useRef(false);
  const lastPickCount = useRef(0);

  // Initialize data collection when draft starts
  useEffect(() => {
    if (roomId && participants?.length > 0 && !isInitialized.current) {
      logger.debug('Initializing tournament data collection', { roomId });

      try {
        draftDataCollector.initializeDraftDataCollection(
          roomId,
          participants.map(p => ({
            userId: p.id || p.user || p.userId,
            username: p.name || p.username || p.displayName,
            teamName: p.teamName || `${p.name || p.username}'s Team`
          }))
        );

        isInitialized.current = true;
        logger.debug('Tournament data collection initialized');
      } catch (error) {
        logger.error('Failed to initialize tournament data collection', error);
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
      
      newPicks.forEach((pick, index) => {
        try {
          // Extract player data from pick
          const playerData = pick.playerData || {};
          
          draftDataCollector.recordDraftPick({
            userId: pick.user || pick.userId,
            username: pick.username || pick.user,
            playerId: playerData.id || `player_${pick.player?.replace(/\s+/g, '_')}`,
            playerName: pick.player || pick.playerName,
            position: playerData.position || pick.position,
            team: playerData.team || pick.team,
            
            // Pick timing (if available)
            timeUsed: pick.timeUsed || null,
            wasTimeout: pick.wasTimeout || false,
            wasAutodraft: pick.wasAutodraft || pick.autodrafted || false,
            pickSource: pick.source || (pick.wasAutodraft ? 'auto' : 'user'),
            
            // Analytics data (if available)
            adp: playerData.adp || pick.adp,
            projectedPoints: playerData.proj || pick.projectedPoints
          });
          
          logger.debug('Recorded pick', { player: pick.player, user: pick.user });
        } catch (error) {
          logger.error('Failed to record pick', error, { player: pick.player });
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
          logger.error('Failed to complete draft data collection', error);
        }
      }
    };
  }, []);

  // Return utility functions for manual integration if needed
  return {
    recordPick: (pickData) => {
      if (isInitialized.current) {
        return draftDataCollector.recordDraftPick(pickData);
      }
    },
    
    startPickTimer: (userId) => {
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