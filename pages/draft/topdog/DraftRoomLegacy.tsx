/**
 * DraftRoomLegacy
 * 
 * Legacy draft room implementation (original 4,860-line file).
 * This will be gradually replaced by DraftRoomNew.
 * 
 * Part of Phase 0: Safety Net - Parallel implementation
 * 
 * Note: This is a wrapper that redirects to the original [roomId].js file.
 * The original file will continue to work as-is until we complete the refactor.
 */

import { useRouter } from 'next/router';
import { useEffect } from 'react';

export interface DraftRoomLegacyProps {
  roomId: string;
}

/**
 * Legacy draft room wrapper.
 * 
 * For now, we redirect to the original route which will handle the legacy component.
 * This allows the original [roomId].js to continue working unchanged.
 */
export function DraftRoomLegacy({ roomId }: DraftRoomLegacyProps) {
  const router = useRouter();

  // Ensure we're on the correct route with roomId in query
  useEffect(() => {
    if (router.query.roomId !== roomId) {
      router.replace(`/draft/topdog/${roomId}`, undefined, { shallow: true });
    }
  }, [roomId, router]);

  // The original [roomId].js will be loaded by Next.js routing
  // We just need to ensure the route is correct
  return null;
}
