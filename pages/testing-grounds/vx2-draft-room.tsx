/**
 * VX2 Draft Room Test Page
 * 
 * Test page for the VX2 mobile draft room implementation.
 * 
 * On mobile devices (iPhone/iPad): Shows fullscreen draft room like real app.
 * On desktop: Shows phone frame with dev controls for testing.
 */

import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { JSX } from 'react';

import { DraftRoomVX2 } from '../../components/vx2/draft-room';
import { useIsMobileDevice } from '../../hooks/useIsMobileDevice';
import { trackDraftVersion } from '../../lib/analytics/draftVersionTracking';
import { draftSession } from '../../lib/draftSession';
import type { DraftSpeed } from '../../lib/draftSession';

interface DevTools {
  status?: 'active' | 'waiting' | 'inactive';
  isPaused?: boolean;
  startDraft?: () => void;
  togglePause?: () => void;
  forcePick?: () => void;
}

function VX2DraftRoomPage(): JSX.Element {
  const router = useRouter();
  const isMobileRaw = useIsMobileDevice();
  const isLoaded = isMobileRaw !== null;
  const isMobile = isMobileRaw === true;
  const [draftKey, setDraftKey] = useState<number>(0);
  const [fastMode, setFastMode] = useState<boolean>(false);
  // Use ref instead of state to avoid infinite loops
  const devToolsRef = useRef<DevTools | null>(null);
  // Track if we've auto-started on mobile
  const hasAutoStarted = useRef<boolean>(false);
  // Track if dev tools are ready to trigger UI update
  const [devToolsReady, setDevToolsReady] = useState<boolean>(false);
  
  // Get roomId from query params, fallback to test roomId for testing
  const roomId = (router.query.roomId && typeof router.query.roomId === 'string' ? router.query.roomId : null) || 'test-room-123';
  
  // Track draft version access for Phase 4 consolidation
  useEffect(() => {
    if (router.isReady && roomId) {
      trackDraftVersion('vx2', roomId, null);
    }
  }, [router.isReady, roomId]);
  
  // Get initial pick number and team count from query params
  const initialPickNumber = router.query.pickNumber
    ? parseInt(router.query.pickNumber as string, 10)
    : 1;
  const teamCount = router.query.teamCount
    ? parseInt(router.query.teamCount as string, 10)
    : 12;

  // Get draft options from query params or session
  const queryEntries = router.query.entries ? parseInt(router.query.entries as string, 10) : null;
  const querySpeed = router.query.speed as DraftSpeed | undefined;
  const sessionOptions = draftSession.getDraftOptions();
  const entryCount = queryEntries ?? sessionOptions?.entries ?? 1;
  const draftSpeed = querySpeed ?? sessionOptions?.speed ?? 'slow';

  // Authorization state machine: 'checking' -> 'authorized' | 'redirecting'
  // IMPORTANT: Always start with 'checking' on both server and client to avoid hydration mismatch.
  // The useEffect below will immediately set to 'authorized' for desktop users after hydration.
  const [authState, setAuthState] = useState<'checking' | 'authorized' | 'redirecting'>('checking');

  // Check if mobile user is authorized to access draft room
  // Authorization sources (in priority order):
  // 1. Desktop device - always authorized (dev/testing mode)
  // 2. roomId in query params - deep link access
  // 3. Active draft session for this roomId - joined via lobby
  React.useEffect(() => {
    // Desktop users are always authorized (check width >= 768px)
    // This check comes FIRST - don't wait for router on desktop
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setAuthState('authorized');
      return;
    }

    // For mobile, wait for router to be ready (needed for query params)
    if (!router.isReady) return;

    // Wait for mobile detection to complete
    if (!isLoaded) return;

    // Non-mobile, non-desktop edge case - authorize
    if (!isMobile) {
      setAuthState('authorized');
      return;
    }

    // Mobile authorization checks
    const roomIdFromQuery = router.query.roomId as string | undefined;
    const targetRoomId = roomIdFromQuery || 'test-room-123';

    // Check 1: Has roomId in query (deep link) - authorize
    if (roomIdFromQuery) {
      // TODO: In production, validate via API that user has access to this room
      setAuthState('authorized');
      return;
    }

    // Check 2: Has active draft session for this room
    if (draftSession.isAuthorizedForRoom(targetRoomId)) {
      setAuthState('authorized');
      return;
    }

    // Check 3: Legacy flag support (migration period)
    const legacyFlag = sessionStorage.getItem('topdog_joined_draft');
    if (legacyFlag) {
      // Migrate to new session system
      draftSession.join(targetRoomId, { entries: 1, speed: 'slow' });
      sessionStorage.removeItem('topdog_joined_draft');
      setAuthState('authorized');
      return;
    }

    // Not authorized - redirect to lobby
    setAuthState('redirecting');
    router.replace('/testing-grounds/vx2-mobile-app-demo');
  }, [isMobile, isLoaded, router.isReady, router.query.roomId, router, roomId]);
  
  const handleRestart = useCallback((): void => {
    setDraftKey(prev => prev + 1);
  }, []);
  
  const handleLeaveDraft = useCallback((): void => {
    // Mark that user is leaving and should return to live-drafts tab
    draftSession.leave('live-drafts', roomId);

    // Navigate to app shell - it will read the return destination
    // Use router.replace for proper SPA navigation (maintains history)
    router.replace('/testing-grounds/vx2-mobile-app-demo');
  }, [router, roomId]);
  
  // Desktop: just store tools for manual control
  // Use ref callback to avoid dependency on changing devTools object
  const handleDevToolsReady = useCallback((tools: { startDraft: () => void; togglePause: () => void; forcePick: () => void; isPaused: boolean; status: string }): void => {
    // Only update if tools actually changed to prevent infinite loops
    const wasReady = !!devToolsRef.current;
    const currentStatus = devToolsRef.current?.status;
    const currentIsPaused = devToolsRef.current?.isPaused;
    
    if (currentStatus !== tools.status || currentIsPaused !== tools.isPaused) {
      devToolsRef.current = tools as DevTools;
      // Only trigger re-render if tools weren't ready before (first time setup)
      // This ensures buttons become enabled when tools first become available
      if (!wasReady) {
        setDevToolsReady(true);
      }
    }

    // Update localStorage for DevNav to read
    try {
      localStorage.setItem('devnav-draft-controls', JSON.stringify({
        status: tools.status,
        isPaused: tools.isPaused,
        fastMode: fastMode,
      }));
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [fastMode]);

  // Listen for actions from DevNav
  useEffect(() => {
    const handleDraftAction = (event: CustomEvent) => {
      const action = event.detail;
      const tools = devToolsRef.current;

      switch (action) {
        case 'start':
          tools?.startDraft?.();
          break;
        case 'pause':
          tools?.togglePause?.();
          break;
        case 'resume':
          tools?.togglePause?.();
          break;
        case 'forcePick':
          tools?.forcePick?.();
          break;
        case 'toggleSpeed':
          setFastMode(prev => !prev);
          setDraftKey(prev => prev + 1);
          break;
        case 'restart':
          setDraftKey(prev => prev + 1);
          break;
      }
    };

    window.addEventListener('devnav-draft-action', handleDraftAction as EventListener);
    return () => {
      window.removeEventListener('devnav-draft-action', handleDraftAction as EventListener);
    };
  }, []);

  // Update localStorage when fastMode changes
  useEffect(() => {
    if (devToolsRef.current) {
      try {
        localStorage.setItem('devnav-draft-controls', JSON.stringify({
          status: devToolsRef.current.status,
          isPaused: devToolsRef.current.isPaused,
          fastMode: fastMode,
        }));
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }, [fastMode]);
  
  // Mobile: auto-start draft when tools are ready
  const handleMobileDevToolsReady = useCallback((tools: { startDraft: () => void; togglePause: () => void; forcePick: () => void; isPaused: boolean; status: string }): void => {
    devToolsRef.current = tools as DevTools;
    if (!hasAutoStarted.current && tools.startDraft) {
      hasAutoStarted.current = true;
      // Small delay to ensure UI is fully rendered
      setTimeout(() => {
        tools.startDraft();
      }, 500);
    }
  }, []);
  
  const handleToggleFastMode = useCallback((): void => {
    setFastMode(prev => !prev);
    // Restart draft with new speed
    setDraftKey(prev => prev + 1);
  }, []);

  // Show loading/redirecting state for mobile users during auth check
  // Desktop users skip this entirely (authState starts as 'authorized')
  const showLoadingState = authState === 'checking' || authState === 'redirecting';

  if (showLoadingState) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#101927',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ color: '#6B7280', fontSize: 14 }}>
          {authState === 'redirecting' ? 'Redirecting...' : 'Loading...'}
        </div>
      </div>
    );
  }

  // ============================================================================
  // MOBILE VIEW - Fullscreen draft room (no phone frame, no dev controls)
  // Only render if mobile detection complete, is mobile, and authorized
  // ============================================================================
  if (isLoaded && isMobile && authState === 'authorized') {
    return (
      <>
        <Head>
          <title>Draft Room | TopDog</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="theme-color" content="#1E3A5F" />
        </Head>
        
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          backgroundColor: '#101927',
          overflow: 'hidden',
        }}>
          <DraftRoomVX2
            key={draftKey}
            roomId={roomId}
            onLeave={handleLeaveDraft}
            fastMode={false}
            onDevToolsReady={handleMobileDevToolsReady}
            initialPickNumber={initialPickNumber}
            teamCount={teamCount}
          />
        </div>
      </>
    );
  }

  // ============================================================================
  // DESKTOP VIEW - Phone frame with dev controls panel
  // ============================================================================
  return (
    <>
      <Head>
        <title>VX2 Draft Room | TopDog</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>
      
      {/* Frame is handled by _app.tsx automatically */}
      <DraftRoomVX2
        key={draftKey}
        roomId={roomId}
        onLeave={handleLeaveDraft}
        fastMode={fastMode}
        onDevToolsReady={handleDevToolsReady}
        initialPickNumber={initialPickNumber}
        teamCount={teamCount}
      />
    </>
  );
}

export default VX2DraftRoomPage;
