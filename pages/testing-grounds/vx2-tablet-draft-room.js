/**
 * VX2 Tablet Draft Room Test Page
 * 
 * Test page for the VX2 tablet draft room implementation.
 * Shows iPad landscape frame with three-panel layout.
 * 
 * On iPad: Shows fullscreen draft room.
 * On desktop: Shows tablet frame with dev controls.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { TabletDraftRoomVX2 } from '../../components/vx2/tablet';
import { TabletFrame } from '../../components/vx2/tablet';
import { useIsTablet } from '../../components/vx2/hooks/ui/useIsTablet';
import { OrientationGuard } from '../../components/vx2/tablet';

function VX2TabletDraftRoomPage() {
  const router = useRouter();
  const { isTablet, isIPad, isLoaded } = useIsTablet();
  const [draftKey, setDraftKey] = useState(0);
  const [fastMode, setFastMode] = useState(false);
  const [frameModel, setFrameModel] = useState('ipad-pro-11');
  const [isMounted, setIsMounted] = useState(false);
  
  // Track client-side mount to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const handleRestart = useCallback(() => {
    setDraftKey((prev) => prev + 1);
  }, []);
  
  const handleLeaveDraft = useCallback(() => {
    console.log('[VX2TabletDraftRoom] Leave draft clicked');
    router.push('/testing-grounds/vx2-tablet-app-demo');
  }, [router]);
  
  const handleToggleFastMode = useCallback(() => {
    setFastMode((prev) => !prev);
    setDraftKey((prev) => prev + 1);
  }, []);
  
  // Show loading state until device detection is complete and component is mounted
  // This ensures server and client render the same initial state
  if (!isLoaded || !isMounted) {
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
  // TABLET VIEW - Fullscreen draft room on actual iPad
  // ============================================================================
  if (isTablet || isIPad) {
    return (
      <>
        <Head>
          <title>Draft Room | TopDog</title>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
          />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="theme-color" content="#1E3A5F" />
        </Head>
        
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#101927',
            overflow: 'hidden',
          }}
        >
          <OrientationGuard enforceHorizontal>
            <TabletDraftRoomVX2
              key={draftKey}
              roomId="test-tablet-room-123"
              onLeave={handleLeaveDraft}
              fastMode={fastMode}
            />
          </OrientationGuard>
        </div>
      </>
    );
  }
  
  // ============================================================================
  // DESKTOP VIEW - Tablet frame with dev controls
  // ============================================================================
  return (
    <>
      <Head>
        <title>VX2 Tablet Draft Room | TopDog</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="min-h-screen bg-gray-900 flex items-start justify-center p-8 gap-8">
        {/* Tablet Frame */}
        <div className="flex-shrink-0">
          <TabletFrame model={frameModel} showStatusBar={false}>
            <TabletDraftRoomVX2
              key={draftKey}
              roomId="test-tablet-room-123"
              onLeave={handleLeaveDraft}
              fastMode={fastMode}
            />
          </TabletFrame>
        </div>
        
        {/* Controls Panel */}
        <div className="w-72 flex-shrink-0 space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-white text-xl font-bold">VX2 Tablet Draft Room</h2>
            <p className="text-gray-400 text-sm mt-1">Three-panel layout for iPad</p>
          </div>
          
          {/* Feature Checklist */}
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2 text-green-400">
              <span>V</span> Three-Panel Layout
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <span>V</span> Horizontal-Only Enforcement
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <span>V</span> Resizable Panels
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <span>V</span> Player List + Filters
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <span>V</span> Picks Bar
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <span>V</span> Queue + Roster Split
            </div>
            <div className="flex items-center gap-2 text-yellow-400">
              <span>~</span> Draft Board (Placeholder)
            </div>
          </div>
          
          {/* Frame Size Selector */}
          <div className="space-y-2">
            <label className="text-gray-400 text-sm font-medium">iPad Model</label>
            <select
              value={frameModel}
              onChange={(e) => {
                setFrameModel(e.target.value);
                setDraftKey((prev) => prev + 1);
              }}
              className="w-full p-2 bg-gray-800 text-white rounded-lg border border-gray-700"
            >
              <option value="ipad-pro-12.9">iPad Pro 12.9" (1366x1024)</option>
              <option value="ipad-pro-11">iPad Pro 11" (1194x834)</option>
              <option value="ipad-air">iPad Air (1180x820)</option>
              <option value="ipad-mini">iPad Mini (1133x744)</option>
            </select>
          </div>
          
          {/* Controls */}
          <div className="space-y-3">
            {/* Speed Toggle */}
            <button
              onClick={handleToggleFastMode}
              className="w-full py-3 px-4 rounded-lg font-bold text-sm transition-all"
              style={{
                backgroundColor: fastMode ? '#8B5CF6' : '#1F2937',
                color: '#FFFFFF',
                border: fastMode ? 'none' : '2px solid #374151',
              }}
            >
              {fastMode ? 'Fast Mode ON' : 'Normal Speed'}
            </button>
            
            {/* Restart */}
            <button
              onClick={handleRestart}
              className="w-full py-3 px-4 rounded-lg font-bold text-sm transition-all"
              style={{
                backgroundColor: 'transparent',
                color: '#EF4444',
                border: '2px solid #EF4444',
              }}
            >
              Restart Draft
            </button>
          </div>
          
          {/* Info */}
          <div className="p-4 bg-gray-800 rounded-lg text-xs text-gray-400 space-y-2">
            <p>
              <strong className="text-gray-300">Three-Panel Layout:</strong> Left panel
              shows available players, center shows picks bar and board, right shows
              queue and roster.
            </p>
            <p>
              <strong className="text-gray-300">Drag to Resize:</strong> Hover over panel
              dividers and drag to adjust panel widths.
            </p>
            <p>
              <strong className="text-gray-300">Orientation Lock:</strong> On real iPad,
              portrait mode shows "Please Rotate" screen.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default VX2TabletDraftRoomPage;