/**
 * VX2 Draft Room Test Page
 * 
 * Test page for the VX2 mobile draft room implementation.
 * Shows inside phone frame for desktop preview.
 * Includes dev tools for testing draft functionality.
 */

import React, { useState, useCallback, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { DraftRoomVX2 } from '../../components/vx2/draft-room';

export default function VX2DraftRoomPage() {
  const router = useRouter();
  const [draftKey, setDraftKey] = useState(0);
  const [fastMode, setFastMode] = useState(false);
  // Use ref instead of state to avoid infinite loops
  const devToolsRef = useRef(null);
  // Force re-render manually when needed
  const [, forceUpdate] = useState({});
  
  const handleRestart = useCallback(() => {
    setDraftKey(prev => prev + 1);
  }, []);
  
  const handleLeaveDraft = useCallback(() => {
    router.push('/testing-grounds/vx2-mobile-app-demo');
  }, [router]);
  
  const handleDevToolsReady = useCallback((tools) => {
    devToolsRef.current = tools;
    // Single force update after tools are ready
    forceUpdate({});
  }, []);
  
  const handleToggleFastMode = useCallback(() => {
    setFastMode(prev => !prev);
    // Restart draft with new speed
    setDraftKey(prev => prev + 1);
  }, []);

  return (
    <>
      <Head>
        <title>VX2 Draft Room | TopDog</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>
      
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        {/* Main Layout: Phone + Controls */}
        <div className="flex items-start gap-8">
          {/* Phone Frame */}
          <div
            className="bg-black rounded-[40px] overflow-hidden shadow-2xl flex-shrink-0 relative"
            style={{
              width: '375px',
              height: '812px',
            }}
          >
            <DraftRoomVX2
              key={draftKey}
              roomId="test-room-123"
              useAbsolutePosition={true}
              onLeave={handleLeaveDraft}
              fastMode={fastMode}
              onDevToolsReady={handleDevToolsReady}
            />
          </div>

          {/* Controls Panel (Outside Phone) */}
          <div className="w-64 flex-shrink-0">
            {/* Title */}
            <h2 className="text-white text-lg font-bold mb-4">VX2 Draft Room</h2>
        
            {/* Feature Checklist */}
            <div className="mb-6 text-sm">
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <span>V</span> 100% Fresh VX2 Code
              </div>
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <span>V</span> TypeScript + VX2 Constants
              </div>
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <span>V</span> Custom Hooks Architecture
              </div>
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <span>V</span> Player Pool Integration
              </div>
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <span>V</span> Queue with localStorage
              </div>
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <span>V</span> Snake Draft Math
              </div>
              <div className="flex items-center gap-2 text-yellow-400 mb-1">
                <span>~</span> Firebase Integration (Mock)
              </div>
            </div>
        
            {/* Mock Draft Controls */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {/* Start Mock / Pause Mock Button */}
              <button
                onClick={() => {
                  const tools = devToolsRef.current;
                  if (tools?.status !== 'active') {
                    tools?.startDraft();
                  } else {
                    tools?.togglePause();
                  }
                }}
                disabled={!devToolsRef.current}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  backgroundColor: devToolsRef.current?.status !== 'active' ? '#22C55E' : devToolsRef.current?.isPaused ? '#22C55E' : '#6B7280',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: 8,
                  cursor: devToolsRef.current ? 'pointer' : 'not-allowed',
                  opacity: devToolsRef.current ? 1 : 0.5,
                  transition: 'background-color 0.15s ease',
                }}
              >
                {devToolsRef.current?.status !== 'active' ? 'Start Mock' : devToolsRef.current?.isPaused ? 'Resume Mock' : 'Pause Mock'}
              </button>

              {/* Force Pick Button */}
              <button
                onClick={() => devToolsRef.current?.forcePick()}
                disabled={devToolsRef.current?.status !== 'active'}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  backgroundColor: devToolsRef.current?.status === 'active' ? '#F97316' : '#374151',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: 8,
                  cursor: devToolsRef.current?.status === 'active' ? 'pointer' : 'not-allowed',
                  opacity: devToolsRef.current?.status === 'active' ? 1 : 0.4,
                  transition: 'background-color 0.15s ease',
                }}
              >
                Force Pick
              </button>

              {/* Speed Toggle Button */}
              <button
                onClick={handleToggleFastMode}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  backgroundColor: fastMode ? '#8B5CF6' : '#1F2937',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 700,
                  border: fastMode ? 'none' : '2px solid #374151',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {fastMode ? '⚡ Fast Mode' : 'Normal Speed'}
              </button>

              {/* Restart Button */}
              <button
                onClick={handleRestart}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  backgroundColor: 'transparent',
                  color: '#EF4444',
                  fontSize: 14,
                  fontWeight: 700,
                  border: '2px solid #EF4444',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Restart Mock
              </button>

              {/* Status Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 8,
                  padding: '8px 12px',
                  backgroundColor: '#1F2937',
                  borderRadius: 6,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 
                      devToolsRef.current?.status === 'active' && !devToolsRef.current?.isPaused ? '#22C55E' :
                      devToolsRef.current?.status === 'active' && devToolsRef.current?.isPaused ? '#F59E0B' :
                      '#6B7280',
                  }}
                />
                <span
                  style={{
                    color: '#9CA3AF',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {devToolsRef.current?.status === 'active' && !devToolsRef.current?.isPaused ? 'Running' :
                   devToolsRef.current?.status === 'active' && devToolsRef.current?.isPaused ? 'Paused' :
                   devToolsRef.current?.status === 'waiting' ? 'Ready' :
                   'Loading...'}
                  {fastMode && ' • Fast'}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
