/**
 * VX2 Draft Room - Production Route
 *
 * Route: /draft/vx2/[roomId]
 * Frame vs fullscreen is handled by _app.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { DraftRoomVX2 } from '../../../components/vx2/draft-room';
import { trackDraftVersion } from '../../../lib/analytics/draftVersionTracking';

export default function DraftRoomVX2Route() {
  const router = useRouter();
  const { roomId } = router.query;
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (router.isReady && roomId && typeof roomId === 'string') {
      setIsReady(true);
      trackDraftVersion('vx2', roomId, null);
    }
  }, [router.isReady, roomId]);

  const initialPickNumber = router.query.pickNumber
    ? parseInt(router.query.pickNumber as string, 10)
    : 1;
  const teamCount = router.query.teamCount
    ? parseInt(router.query.teamCount as string, 10)
    : 12;
  const fastMode = router.query.fastMode === 'true';

  if (!isReady || !roomId || typeof roomId !== 'string') {
    return (
      <>
        <Head>
          <title>Loading Draft Room...</title>
        </Head>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-xl mb-4">Initializing draft room...</div>
            <div className="text-sm text-gray-400">Loading VX2 draft room</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Draft Room – {roomId}</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#1E3A5F" />
      </Head>
      <DraftRoomVX2
        roomId={roomId}
        initialPickNumber={initialPickNumber}
        teamCount={teamCount}
        fastMode={fastMode}
      />
    </>
  );
}
