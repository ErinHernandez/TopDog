/**
 * PicksBarCard - Sandbox Component
 * Built from scratch using TeamHeader as exact template
 * 
 * TeamHeader source styling:
 * - flex-shrink: 0
 * - display: flex
 * - flex-direction: column
 * - background-color: rgb(55, 65, 81) = #374151
 * - margin: 1px
 * - min-width: 92px
 * - width: 92px
 * - border-radius: 6px
 * - border: 4px solid rgb(59, 130, 246)
 * - overflow: hidden
 */

import React from 'react';

// ============================================================================
// CONSTANTS - Exact copy from Board's TeamHeader
// ============================================================================

const CARD = {
  // Outer container - EXACT from TeamHeader
  width: 92,
  minWidth: 92,
  margin: 1,
  borderRadius: 6,
  borderWidth: 4,
  backgroundColor: '#374151', // rgb(55, 65, 81)
  
  // Header section
  headerHeight: 20,
  headerFontSize: 10,
  headerMaxChars: 12,
  
  // Content area
  contentMinHeight: 70,
  contentPaddingBottom: 8,
  
  // Tracker bar
  trackerHeight: 9,
  trackerWidth: 78,
  trackerEmptyWidth: 79,
  trackerMarginTop: 2,
  trackerBorderRadius: 1,
} as const;

const COLORS = {
  userBorder: '#3B82F6',    // Blue
  otherBorder: '#6B7280',   // Gray
  onTheClockBorder: '#EF4444', // Red
  trackerEmpty: '#6B7280',
} as const;

// ============================================================================
// COMPONENT
// ============================================================================

interface PicksBarCardProps {
  participantName: string;
  isUser: boolean;
  isOnTheClock?: boolean;
  pickNumber?: string;
  children?: React.ReactNode;
}

export default function PicksBarCard({
  participantName,
  isUser,
  isOnTheClock = false,
  pickNumber,
  children,
}: PicksBarCardProps): React.ReactElement {
  // Determine border color
  const borderColor = isOnTheClock && isUser 
    ? COLORS.onTheClockBorder 
    : isUser 
      ? COLORS.userBorder 
      : COLORS.otherBorder;
  
  // Truncate name
  const displayName = participantName.length > CARD.headerMaxChars
    ? participantName.substring(0, CARD.headerMaxChars)
    : participantName;

  return (
    // Outer Container - EXACT TeamHeader styling
    <div
      style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: CARD.backgroundColor,
        margin: CARD.margin,
        minWidth: CARD.minWidth,
        width: CARD.width,
        borderRadius: CARD.borderRadius,
        border: `${CARD.borderWidth}px solid ${borderColor}`,
        overflow: 'hidden',
      }}
    >
      {/* Header - Participant Name */}
      <div
        style={{
          height: CARD.headerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 4px',
          backgroundColor: borderColor,
          fontSize: CARD.headerFontSize,
          fontWeight: 500,
          color: '#FFFFFF',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        {displayName}
      </div>
      
      {/* Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingBottom: CARD.contentPaddingBottom,
          minHeight: CARD.contentMinHeight,
        }}
      >
        {/* Pick Number (top-left) */}
        {pickNumber && (
          <div
            style={{
              alignSelf: 'flex-start',
              fontSize: 8,
              fontWeight: 500,
              color: '#FFFFFF',
              marginTop: 2,
              marginLeft: 2,
            }}
          >
            {pickNumber}
          </div>
        )}
        
        {/* Center content (timer, player info, etc.) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </div>
        
        {/* Position Tracker Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            marginTop: CARD.trackerMarginTop,
          }}
        >
          <div
            style={{
              height: CARD.trackerHeight,
              width: CARD.trackerEmptyWidth,
              backgroundColor: COLORS.trackerEmpty,
              borderRadius: CARD.trackerBorderRadius,
            }}
          />
        </div>
      </div>
    </div>
  );
}

