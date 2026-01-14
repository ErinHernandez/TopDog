import React from 'react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import DraftProvider from '../../../components/draft/v2/providers/DraftProvider';
import DraftLayout from '../../../components/draft/v2/layout/DraftLayout';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { trackDraftVersion } from '../../../lib/analytics/draftVersionTracking';

/**
 * V2 Draft Room - Clean Architecture
 * 
 * @deprecated This version is deprecated. Use vx2 instead.
 * Migration: /draft/vx2/[roomId]
 * Deprecation date: TBD (pending traffic analysis)
 * See: PHASE4_DRAFT_CONSOLIDATION_PLAN.md
 * 
 * This is a completely rebuilt draft room following best practices:
 * - Modular component architecture
 * - Easy element replacement system
 * - Scalable for 47,000+ concurrent drafts
 * - Proper separation of concerns
 * - Context-based state management
 * - Optimized Firebase queries
 * - Security-first approach
 */
export default function DraftRoomV2() {
  const router = useRouter();
  const { roomId } = router.query;
  const [isReady, setIsReady] = useState(false);

  // Wait for router to be ready
  useEffect(() => {
    if (router.isReady && roomId) {
      setIsReady(true);
      // Track draft version access for Phase 4 consolidation
      trackDraftVersion('v2', roomId, null);
    }
  }, [router.isReady, roomId]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner message="Initializing draft room..." />
      </div>
    );
  }

  return (
    <DraftProvider roomId={roomId}>
      <DraftLayout />
    </DraftProvider>
  );
}