/**
 * VX Mobile Demo Page
 * 
 * Development area for Version X mobile-first components.
 * 
 * IMPORTANT: The original mobile demo remains untouched at:
 * /testing-grounds/mobile-apple-demo
 * 
 * This page is for VX migration development only.
 */

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import DraftRoomVX from '../../components/vx/mobile/draft/DraftRoomVX';

export default function VXMobileDemo() {
  // Draft control state (lifted to page level for external controls)
  const [isDraftActive, setIsDraftActive] = useState(false);
  const [isDraftPaused, setIsDraftPaused] = useState(false);
  const [mockDraftSpeed, setMockDraftSpeed] = useState(false);
  const [draftKey, setDraftKey] = useState(0); // For restarting
  const [forcePickTrigger, setForcePickTrigger] = useState(0); // Increment to trigger force pick

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevOverscroll = document.body.style.overscrollBehavior;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    const restore = () => {
      document.body.style.overflow = prevBodyOverflow || '';
      document.documentElement.style.overflow = prevHtmlOverflow || '';
      document.body.style.overscrollBehavior = prevOverscroll || '';
    };

    const timer = setTimeout(restore, 1000);
    return () => {
      clearTimeout(timer);
      restore();
    };
  }, []);

  // Draft control handlers
  const handleStartDraft = useCallback(() => {
    setIsDraftActive(true);
    setIsDraftPaused(false);
  }, []);

  const handlePauseDraft = useCallback(() => {
    setIsDraftPaused(prev => !prev);
  }, []);

  const handleRestartDraft = useCallback(() => {
    setIsDraftActive(false);
    setIsDraftPaused(false);
    setDraftKey(prev => prev + 1);
  }, []);

  const handleToggleSpeed = useCallback(() => {
    setMockDraftSpeed(prev => !prev);
  }, []);

  const handleForcePick = useCallback(() => {
    setForcePickTrigger(prev => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {/* Main Layout: Phone + Controls */}
      <div className="flex items-start gap-8">
        {/* Phone Frame */}
        <div
          className="bg-black rounded-[40px] overflow-hidden shadow-2xl flex-shrink-0"
          style={{
            width: '375px',
            height: '812px',
          }}
        >
          <DraftRoomVX
            key={draftKey}
            isDraftActive={isDraftActive}
            isDraftPaused={isDraftPaused}
            mockDraftSpeed={mockDraftSpeed}
            onDraftStart={handleStartDraft}
            forcePickTrigger={forcePickTrigger}
          />
        </div>

        {/* Controls Panel (Outside Phone) */}
        <div className="w-64 flex-shrink-0">
          {/* Title */}
          <h2 className="text-white text-lg font-bold mb-4">VX Draft Room</h2>

          {/* Feature Checklist */}
          <div className="mb-6 text-sm">
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <span>V</span> TypeScript components
            </div>
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <span>V</span> Modular architecture
            </div>
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <span>V</span> Centralized constants
            </div>
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <span>V</span> Position colors locked
            </div>
            <div className="flex items-center gap-2 text-yellow-400 mb-1">
              <span>~</span> Draft board (pending)
            </div>
          </div>

          {/* Draft Controls */}
          <div className="text-white text-sm font-medium mb-3">Draft Controls</div>
          <div className="space-y-3">
            {/* Start/Resume Button */}
            {!isDraftActive ? (
              <button
                onClick={handleStartDraft}
                className="w-full bg-green-500 text-white px-4 py-3 rounded-lg font-bold text-sm shadow-lg hover:bg-green-600 transition-all"
              >
                Start Draft
              </button>
            ) : (
              <button
                onClick={handlePauseDraft}
                className="w-full bg-green-500 text-white px-4 py-3 rounded-lg font-bold text-sm shadow-lg hover:bg-green-600 transition-all"
              >
                {isDraftPaused ? 'Resume Draft' : 'Pause Draft'}
              </button>
            )}

            {/* Force Pick Button */}
            {isDraftActive && (
              <button
                onClick={handleForcePick}
                className="w-full bg-orange-500 text-white px-4 py-3 rounded-lg font-bold text-sm shadow-lg hover:bg-orange-600 transition-all"
                title="Force a pick and advance to next player"
              >
                Force Pick
              </button>
            )}

            {/* Mock Draft Speed Toggle */}
            {isDraftActive && (
              <button
                onClick={handleToggleSpeed}
                className={`w-full px-4 py-3 rounded-lg font-bold text-sm shadow-lg transition-all ${
                  mockDraftSpeed 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
                title="Toggle mock draft speed"
              >
                {mockDraftSpeed ? 'Speed ON' : 'Normal Speed'}
              </button>
            )}

            {/* Restart Draft Button */}
            {isDraftActive && (
              <button
                onClick={handleRestartDraft}
                className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-bold text-sm shadow-lg hover:bg-red-700 transition-all"
                title="Restart the draft from the beginning"
              >
                Restart Draft
              </button>
            )}

            {/* Status Display */}
            <div className="text-xs text-gray-500 mt-2">
              Status: {!isDraftActive ? 'Not Started' : isDraftPaused ? 'Paused' : 'Active'}
              {isDraftActive && mockDraftSpeed && ' (Fast Mode)'}
            </div>
          </div>

          {/* Links */}
          <div className="mt-8 pt-4 border-t border-gray-700">
            <div className="text-gray-400 text-xs mb-3">Compare with original:</div>
            <Link 
              href="/testing-grounds/mobile-apple-demo"
              className="block px-3 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 text-sm mb-2"
            >
              View Original Demo
            </Link>
            <div className="text-gray-500 text-xs mt-3">
              VX: /components/vx/<br />
              Original: /components/draft/v3/mobile/apple/
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
