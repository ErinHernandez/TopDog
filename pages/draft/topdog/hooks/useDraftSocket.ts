/**
 * useDraftSocket
 * 
 * Hook for managing Firebase real-time listeners for draft room data.
 * Listens to room and picks collections and updates context.
 * 
 * Part of Phase 2: Extract Hooks
 */

import { useEffect } from 'react';
import { doc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useDraftDispatch } from '../context/DraftRoomContext';
import { DraftRoom, DraftPick } from '../types/draft';
import { logger } from '@/lib/structuredLogger';

export interface UseDraftSocketOptions {
  roomId: string | undefined;
}

/**
 * Hook to manage Firebase real-time listeners for draft room
 */
export function useDraftSocket({ roomId }: UseDraftSocketOptions): void {
  const dispatch = useDraftDispatch();

  // Room listener
  useEffect(() => {
    if (!roomId) return;

    logger.info('Connecting to draft room', { roomId, component: 'useDraftSocket' });

    const unsubRoom = onSnapshot(
      doc(db, 'draftRooms', roomId),
      (snapshot) => {
        if (!snapshot.exists()) {
          logger.warn('Draft room not found', { roomId });
          dispatch({
            type: 'SET_ERROR',
            payload: new Error(`Draft room ${roomId} not found`),
          });
          return;
        }

        const roomData = snapshot.data();
        const room: DraftRoom = {
          id: snapshot.id,
          status: roomData.status || 'waiting',
          currentPick: roomData.currentPick || 1,
          participants: roomData.participants || [],
          draftOrder: roomData.draftOrder || [],
          settings: {
            timerSeconds: roomData.settings?.timerSeconds || 30,
            totalRounds: roomData.settings?.totalRounds || 18,
            maxParticipants: roomData.settings?.maxParticipants || 12,
          },
          createdAt: roomData.createdAt,
          startedAt: roomData.startedAt,
          completedAt: roomData.completedAt,
          pausedAt: roomData.pausedAt,
          lastPickAt: roomData.lastPickAt,
          mockDrafters: roomData.mockDrafters,
          createdBy: roomData.createdBy,
          draftOrderTimestamp: roomData.draftOrderTimestamp,
          name: roomData.name,
        };

        dispatch({ type: 'SET_ROOM', payload: room });
        logger.debug('Room data updated', { roomId, status: room.status });
      },
      (error) => {
        logger.error('Room listener error', error, { roomId, component: 'useDraftSocket' });
        dispatch({ type: 'SET_ERROR', payload: error });
      }
    );

    return () => {
      logger.info('Disconnecting from draft room', { roomId });
      unsubRoom();
    };
  }, [roomId, dispatch]);

  // Picks listener
  useEffect(() => {
    if (!roomId) return;

    const picksQuery = query(
      collection(db, 'draftRooms', roomId, 'picks'),
      orderBy('pickNumber')
    );

    const unsubPicks = onSnapshot(
      picksQuery,
      (snapshot) => {
        const picks: DraftPick[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            pickNumber: data.pickNumber,
            round: data.round,
            user: data.user,
            player: data.player,
            roomId: data.roomId || roomId,
            timestamp: data.timestamp,
          };
        });

        dispatch({ type: 'SET_PICKS', payload: picks });
        logger.debug('Picks updated', { roomId, pickCount: picks.length });
      },
      (error) => {
        logger.error('Picks listener error', error, { roomId, component: 'useDraftSocket' });
        // Don't set error for picks - room error is enough
      }
    );

    return () => unsubPicks();
  }, [roomId, dispatch]);
}
