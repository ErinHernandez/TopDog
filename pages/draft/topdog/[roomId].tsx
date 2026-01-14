/**
 * Draft Room Page
 * 
 * Main entry point for draft room with feature flag routing.
 * Routes to either legacy or new implementation based on feature flag.
 * 
 * Part of Phase 0: Safety Net
 */

import { useRouter } from 'next/router';
import { FEATURE_FLAGS, shouldUseNewDraftRoom } from '@/lib/featureFlags';
import { DraftRoomLegacy } from './DraftRoomLegacy';
import { DraftRoomNew } from './DraftRoomNew';
import { DraftErrorBoundary } from './components/DraftErrorBoundary';

export default function DraftRoomPage() {
  const router = useRouter();
  const { roomId, useNew } = router.query;

  // Validate roomId
  if (!roomId || typeof roomId !== 'string') {
    return (
      <div className="min-h-screen bg-[#101927] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Room ID</h1>
          <p className="text-gray-400">Please check the URL and try again.</p>
        </div>
      </div>
    );
  }

  // Allow override via query param for testing
  const useNewDraftRoom =
    useNew === 'true' ||
    FEATURE_FLAGS.USE_REFACTORED_DRAFT_ROOM ||
    (typeof window !== 'undefined' &&
      typeof (window as any).localStorage !== 'undefined' &&
      (window as any).localStorage.getItem('useNewDraftRoom') === 'true');

  // Wrap both implementations in error boundary
  return (
    <DraftErrorBoundary roomId={roomId}>
      {useNewDraftRoom ? (
        <DraftRoomNew roomId={roomId} />
      ) : (
        <DraftRoomLegacy roomId={roomId} />
      )}
    </DraftErrorBoundary>
  );
}
