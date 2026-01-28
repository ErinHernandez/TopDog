/**
 * VX2 Draft Room Test Page
 * 
 * Test page for the VX2 mobile draft room implementation.
 * 
 * On mobile devices (iPhone/iPad): Shows fullscreen draft room like real app.
 * On desktop: Shows phone frame with dev controls for testing.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { JSX } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { DraftRoomVX2 } from '../../components/vx2/draft-room';
import { useIsMobileDevice } from '../../hooks/useIsMobileDevice';
import { trackDraftVersion } from '../../lib/analytics/draftVersionTracking';

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
  // Track if we've verified the user can access the draft room
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
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
  
  // Check if mobile user is authorized to access draft room
  // (must come from clicking "Join Tournament" which sets the session flag)
  React.useEffect(() => {
    if (!router.isReady) return;
    
    // Desktop users are always authorized - check immediately if we can determine desktop
    // This allows authorization even if useIsMobileDevice hasn't loaded yet
    if (typeof window !== 'undefined') {
      const isDesktop = window.innerWidth >= 768;
      if (isDesktop) {
        setIsAuthorized(true);
        return;
      }
    }
    
    // Wait for mobile detection to complete before checking mobile authorization
    if (!isLoaded) return;
    
    // Mobile users need authorization check
    if (isMobile) {
      // On mobile, check if user came from the app (has session flag) OR has roomId in query
      if (typeof window === 'undefined') return;
      const cameFromApp = sessionStorage.getItem('topdog_joined_draft');
      const hasRoomId = router.query.roomId;
      
      if (!cameFromApp && !hasRoomId) {
        // Direct access on mobile without roomId - redirect to app demo (lobby)
        // Use router.isReady to prevent multiple redirects
        if (router.isReady) {
          router.replace('/testing-grounds/vx2-mobile-app-demo');
        }
        return;
      }
      
      // Clear the flag so refreshing the page will redirect (unless roomId is in query)
      if (typeof window !== 'undefined' && !hasRoomId) {
        sessionStorage.removeItem('topdog_joined_draft');
      }
      setIsAuthorized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, isLoaded, router.isReady, router.query.roomId]);
  
  const handleRestart = useCallback((): void => {
    setDraftKey(prev => prev + 1);
  }, []);
  
  const handleLeaveDraft = useCallback((): void => {
    // Set flag so app knows to open live-drafts tab
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('topdog_came_from_draft', 'true');
      } catch (e) {
        console.error('[VX2DraftRoomPage] Failed to set session flag:', e);
      }
    }
    // Navigate to app (will read flag and go to live-drafts)
    const targetPath = '/testing-grounds/vx2-mobile-app-demo';
    // Use window.location.replace for more reliable navigation (doesn't add to history)
    // Use setTimeout to ensure it happens after any React state updates
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.replace(targetPath);
      }
    }, 100);
  }, []);
  
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

  // Show loading state until device detection AND authorization check are complete
  // This prevents the draft room from flashing before redirect on mobile
  if (!isLoaded || !isAuthorized) {
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
        <div style={{ color: '#6B7280', fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  // ============================================================================
  // MOBILE VIEW - Fullscreen draft room (no phone frame, no dev controls)
  // ============================================================================
  if (isMobile) {
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
