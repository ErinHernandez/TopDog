/**
 * Draft Room V3 - Route Handler
 * 
 * This is the V3 draft room route that will eventually replace
 * the current implementation. Currently for testing and development.
 * 
 * Access via: /draft/v3/[roomId]
 */

import React from 'react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import DraftRoomV3 from '../../../components/draft/v3/DraftRoomV3';

export default function DraftRoomV3Route() {
  const router = useRouter();
  const { roomId } = router.query;
  const [isReady, setIsReady] = useState(false);

  // Wait for router to be ready
  useEffect(() => {
    if (router.isReady && roomId) {
      setIsReady(true);
    }
  }, [router.isReady, roomId]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-xl mb-4">Initializing V3 draft room...</div>
          <div className="text-sm text-gray-400">Loading with preserved measurements</div>
        </div>
      </div>
    );
  }

  return <DraftRoomV3 roomId={roomId} />;
}
