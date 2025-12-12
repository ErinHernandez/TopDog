/**
 * Draft Room V3 - Fixed Elements Layer
 * 
 * All absolutely positioned elements with exact pixel positioning.
 * These maintain your precise layout measurements.
 * 
 * Elements included:
 * - On The Clock card (288px at top: 0px, left: 45.5px)
 * - Full Draft Board button (top: 118px)  
 * - Autodraft container (174px at top: 182px)
 * - Picks Away calendar (top: 182px, left: 215.5px)
 */

import React from 'react';
import Link from 'next/link';

export default function FixedElementsLayer({
  // On The Clock props
  isDraftActive = false,
  currentPicker = 'Waiting...',
  isMyTurn = false,
  
  // Autodraft props
  autoPickPlayer = null,
  
  // Picks Away props
  picksAway = 0,
  
  // Navigation props
  roomId = '',
  
  // Mock drafter detection
  mockDrafters = []
}) {

  return (
    <>
      {/* On The Clock Container */}
      <OnTheClockCard
        isDraftActive={isDraftActive}
        currentPicker={currentPicker}
        isMyTurn={isMyTurn}
        mockDrafters={mockDrafters}
      />

      {/* Full Draft Board Button */}
      <FullDraftBoardButton roomId={roomId} />

      {/* Autodraft Container */}
      {autoPickPlayer && (
        <AutodraftContainer autoPickPlayer={autoPickPlayer} />
      )}

      {/* Picks Away Calendar */}
      <PicksAwayCalendar picksAway={picksAway} />
    </>
  );
}

/**
 * On The Clock Card Component
 * Exact positioning and styling from current implementation
 */
function OnTheClockCard({ isDraftActive, currentPicker, isMyTurn, mockDrafters }) {
  
  const getDisplayPicker = () => {
    if (!currentPicker || currentPicker === 'Waiting...') return 'Waiting...';
    if (currentPicker === 'Not Todd Middleton') return currentPicker;
    
    // Check if this is a mock drafter
    const isMockDrafter = mockDrafters.includes(currentPicker);
    
    // Clean the picker name (exact logic from current implementation)
    const cleanPicker = currentPicker.replace(/[,\s]/g, '').toUpperCase().substring(0, 18);
    return cleanPicker;
  };

  return (
    <div 
      className="pb-4" 
      style={{ 
        position: 'absolute', 
        top: '480px',  // Move down further (380px + 100px)
        left: '0px'    // Already at left edge
      }}
    >
      <div 
        className="inline-block rounded-lg p-4 shadow-lg transition-all duration-1000 bg-white/10"
        style={{
          opacity: 1,
          position: 'relative',
          width: 288,
          minWidth: 288,
          maxWidth: 288,
          height: '100px',
          minHeight: '100px',
          maxHeight: '100px',
          border: '2px solid #FBBF25'
        }}
      >
        <div className="flex justify-between items-center h-full">
          <div 
            className="flex flex-col justify-center h-full" 
            style={{ marginLeft: '-4px' }}
          >
            <div 
              className="text-xl font-bold text-white mb-3" 
              style={{ marginTop: '-0.5em' }}
            >
              {isDraftActive ? 'ON THE CLOCK:' : 'DRAFT STARTING'}
            </div>
            <div className="text-2xl font-semibold text-white">
              {isDraftActive ? getDisplayPicker() : 'Get Ready!'}
            </div>
          </div>

          <div className="flex items-center gap-6" style={{ backgroundColor: 'transparent' }}>
            <div className="text-right">
              {/* Timer moved to horizontal scrolling card */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Full Draft Board Button
 * Exact positioning and styling
 */
function FullDraftBoardButton({ roomId }) {
  return (
    <div 
      style={{ 
        position: 'absolute', 
        top: '598px',  // Move down further (498px + 100px)
        left: '0px',   // Already at left edge
        marginBottom: '18px'
      }}
    >
      <div className="flex gap-2">
        <Link 
          href={`/draft/topdog/${roomId}/full-board`}
          className="px-4 py-3 font-bold rounded-lg transition-colors text-sm text-center block"
          style={{ 
            width: '288px',
            backgroundColor: '#6b7280',
            border: '1px solid rgba(128, 128, 128, 0.4)',
            color: '#fff'
          }}
        >
          Full Draft Board
        </Link>
      </div>
    </div>
  );
}

/**
 * Autodraft Container
 * Shows what autodraft would pick
 */
function AutodraftContainer({ autoPickPlayer }) {
  return (
    <div 
      style={{ 
        position: 'absolute', 
        top: '562px',  // Move down (380px + 182px = 562px)
        left: '0px'    // Already at left edge
      }}
    >
      <div 
        className="rounded-lg border-l-4 border-[#2DE2C5] bg-white/10 flex flex-col"
        style={{ 
          width: '174px',
          height: '90px',
          minHeight: '90px',
          maxHeight: '90px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderLeft: '4px solid #2DE2C5'
        }}
      >
        <div 
          className="text-sm font-bold text-[#60A5FA] mb-1" 
          style={{ 
            marginTop: '8px',
            marginLeft: '12px'
          }}
        >
          Autodraft Would Be:
        </div>
        <div 
          className="flex items-center justify-between gap-3 flex-1" 
          style={{ 
            marginTop: '8px',
            marginLeft: '12px',
            marginRight: '12px'
          }}
        >
          <div className="flex-1">
            <div 
              className="font-bold text-white text-sm whitespace-nowrap overflow-hidden text-ellipsis" 
              style={{ marginTop: '-12px' }}
            >
              {autoPickPlayer.name}
            </div>
            <div className="text-sm text-gray-300 opacity-75">
              {autoPickPlayer.position} • {autoPickPlayer.team}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Picks Away Calendar
 * Shows how many picks until user's turn
 */
function PicksAwayCalendar({ picksAway }) {
  return (
    <div 
      style={{ 
        position: 'absolute', 
        top: '562px',  // Move down (380px + 182px = 562px)
        left: '170px', // Already adjusted left position
        paddingLeft: '16px',
        paddingRight: '32px'
      }}
    >
      <PicksAwayDisplay picksAway={picksAway} />
    </div>
  );
}

/**
 * Picks Away Display Component
 * This will be extracted from the current PicksAwayCalendar component
 */
function PicksAwayDisplay({ picksAway }) {
  // If it's user's turn, show "ON THE CLOCK"
  if (picksAway === 0) {
    return (
      <div className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold text-center">
        <div className="text-lg">ON THE</div>
        <div className="text-xl">CLOCK</div>
      </div>
    );
  }

  // Show picks away count
  return (
    <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-center">
      <div className="text-white text-sm font-semibold">Autodraft Would Be:</div>
      <div className="text-white text-lg font-bold">{picksAway}</div>
      <div className="text-gray-300 text-xs">PICKS AWAY</div>
    </div>
  );
}

/**
 * Development Demo Component
 */
export function FixedElementsLayerDemo() {
  const mockAutoPickPlayer = {
    name: 'Saquon Barkley',
    position: 'RB',
    team: 'PHI'
  };

  return (
    <div className="bg-[#101927] min-h-screen relative text-white p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-4">Fixed Elements Layer Demo</h1>
        <p className="text-gray-300">
          Absolutely positioned elements with exact pixel measurements preserved
        </p>
      </div>

      {/* Show positioning guides for development */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {/* Guidelines showing exact positions */}
        <div 
          className="absolute border border-red-500 border-dashed"
          style={{
            top: LAYOUT.FIXED_ELEMENTS.ON_THE_CLOCK.top,
            left: LAYOUT.FIXED_ELEMENTS.ON_THE_CLOCK.left,
            width: LAYOUT.FIXED_ELEMENTS.ON_THE_CLOCK.width,
            height: LAYOUT.FIXED_ELEMENTS.ON_THE_CLOCK.height
          }}
        />
        <div 
          className="absolute border border-blue-500 border-dashed"
          style={{
            top: LAYOUT.FIXED_ELEMENTS.FULL_BOARD_BUTTON.top,
            left: LAYOUT.FIXED_ELEMENTS.FULL_BOARD_BUTTON.left,
            width: LAYOUT.FIXED_ELEMENTS.FULL_BOARD_BUTTON.width,
            height: '40px'
          }}
        />
        <div 
          className="absolute border border-green-500 border-dashed"
          style={{
            top: LAYOUT.FIXED_ELEMENTS.AUTODRAFT.top,
            left: LAYOUT.FIXED_ELEMENTS.AUTODRAFT.left,
            width: LAYOUT.FIXED_ELEMENTS.AUTODRAFT.width,
            height: LAYOUT.FIXED_ELEMENTS.AUTODRAFT.height
          }}
        />
      </div>

      <FixedElementsLayer
        isDraftActive={true}
        currentPicker="NOTTODDMIDDLETON"
        isMyTurn={false}
        autoPickPlayer={mockAutoPickPlayer}
        picksAway={21}
        roomId="demo-room"
        mockDrafters={[]}
      />

      {/* Position labels for development */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 p-4 rounded text-xs">
        <div className="space-y-1">
          <div className="text-red-400">Red: On The Clock (0px, 45.5px)</div>
          <div className="text-blue-400">Blue: Full Board Button (118px, 45.5px)</div>
          <div className="text-green-400">Green: Autodraft (182px, 45.5px)</div>
          <div className="text-yellow-400">Yellow: Picks Away (182px, 215.5px)</div>
        </div>
      </div>
    </div>
  );
}
