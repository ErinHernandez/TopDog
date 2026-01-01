/**
 * PicksBarPanel - Horizontal Scrolling Picks for Tablet
 * 
 * Shows draft picks in a horizontal scrolling bar.
 * PIXEL-PERFECT match to VX2 PicksBar.tsx design.
 */

import React, { useRef, useEffect, type ReactElement } from 'react';
import { BG_COLORS, TEXT_COLORS, POSITION_COLORS, STATE_COLORS } from '../../../core/constants/colors';
import { TABLET_DRAFT, TABLET_SPACING } from '../../../core/constants/tablet';
import { TILED_BG_STYLE } from '../../../draft-room/constants';
import type { DraftPick, Participant } from '../../../draft-room/types';

// ============================================================================
// TYPES
// ============================================================================

export interface PicksBarPanelProps {
  /** All draft picks */
  picks: DraftPick[];
  /** Current pick number */
  currentPickNumber: number;
  /** Participants list */
  participants: Participant[];
  /** User's participant index */
  userParticipantIndex: number;
  /** Timer seconds */
  timer: number;
  /** Draft status */
  status: string;
}

// ============================================================================
// VX2 PIXEL-PERFECT CONSTANTS
// ============================================================================

const PX = {
  // Container
  containerHeight: 116,
  containerBg: '#101927',
  containerPaddingX: 8,
  containerPaddingTop: 2,
  
  // Cards - EXACT match to VX2
  cardWidth: 96,
  cardMargin: 1,
  cardBorderRadius: 6,
  cardBorderWidth: 4,
  cardBg: '#374151',
  
  // Header
  headerHeight: 20,
  headerFontSize: 11,
  headerMaxChars: 11,
  
  // Content
  contentMinHeight: 78,
  
  // Pick number
  pickNumberFontSize: 9,
  
  // Timer
  timerFontSize: 24,
  
  // Player name
  playerLastNameFontSize: 11,
  playerPosTeamFontSize: 10,
} as const;

const COLORS = {
  userPick: '#1E3A5F',
  onTheClock: '#1E3A5F',
  onTheClockUrgent: '#DC2626',
  otherPick: '#6B7280',
  headerTextDark: '#000000',
  headerTextLight: '#FFFFFF',
  pickNumberText: '#6B7280',
} as const;

// ============================================================================
// PICK CARD
// ============================================================================

interface PickCardProps {
  pickNumber: number;
  pick?: DraftPick;
  participant?: Participant;
  isCurrentPick: boolean;
  isUserPick: boolean;
  timer?: number;
}

function PickCard({
  pickNumber,
  pick,
  participant,
  isCurrentPick,
  isUserPick,
  timer,
}: PickCardProps): ReactElement {
  const hasPick = !!pick?.player;
  const positionColor = pick?.player?.position 
    ? POSITION_COLORS[pick.player.position] 
    : undefined;
  
  // Determine card color (VX2 logic)
  const isUrgent = isCurrentPick && timer !== undefined && timer <= 9;
  const getCardColor = (): string => {
    if (isCurrentPick && isUserPick) {
      return isUrgent ? COLORS.onTheClockUrgent : COLORS.onTheClock;
    }
    if (isUserPick) return COLORS.userPick;
    return COLORS.otherPick;
  };
  
  const cardColor = hasPick && positionColor ? positionColor : getCardColor();
  const usesImageStyle = isUserPick && !isUrgent && !hasPick;
  
  // Header text color
  const headerTextColor = hasPick 
    ? COLORS.headerTextDark 
    : (isUrgent ? COLORS.headerTextLight : (isUserPick ? COLORS.headerTextDark : COLORS.headerTextLight));
  
  // Truncate participant name
  const displayName = participant?.name 
    ? (participant.name.length > PX.headerMaxChars 
        ? participant.name.substring(0, PX.headerMaxChars) 
        : participant.name)
    : `Pick ${pickNumber}`;
  
  // Get last name for player display
  const getLastName = (fullName: string): string => {
    const parts = fullName.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : fullName;
  };
  
  return (
    <div
      style={{
        flexShrink: 0,
        flexGrow: 0,
        boxSizing: 'border-box',
        width: PX.cardWidth,
        minWidth: PX.cardWidth,
        maxWidth: PX.cardWidth,
        marginTop: 4,
        marginBottom: PX.cardMargin,
        marginLeft: PX.cardMargin,
        marginRight: PX.cardMargin,
        borderRadius: PX.cardBorderRadius,
        border: usesImageStyle ? 'none' : `${PX.cardBorderWidth}px solid ${cardColor}`,
        backgroundColor: PX.cardBg,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        ...(usesImageStyle ? {
          backgroundImage: 'url(/wr_blue.png)',
          backgroundSize: '30px 30px',
          padding: PX.cardBorderWidth,
        } : {}),
      }}
    >
      {/* Header - Participant Name */}
      <div
        style={{
          height: PX.headerHeight + (PX.cardBorderWidth * 2),
          marginTop: usesImageStyle ? 0 : -(PX.cardBorderWidth * 2),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 4px',
          backgroundColor: usesImageStyle ? 'transparent' : cardColor,
          borderTopLeftRadius: PX.cardBorderRadius,
          borderTopRightRadius: PX.cardBorderRadius,
          ...(usesImageStyle ? {
            backgroundImage: 'url(/wr_blue.png)',
            backgroundSize: '30px 30px',
          } : {}),
        }}
      >
        <span
          style={{
            fontSize: PX.headerFontSize,
            fontWeight: 500,
            color: headerTextColor,
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {displayName}
        </span>
      </div>
      
      {/* Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: PX.contentMinHeight,
          backgroundColor: PX.cardBg,
          borderRadius: usesImageStyle ? PX.cardBorderRadius - 2 : 0,
          position: 'relative',
        }}
      >
        {/* Pick Number */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 2,
            fontSize: PX.pickNumberFontSize,
            color: COLORS.pickNumberText,
          }}
        >
          {pickNumber}
        </div>
        
        {hasPick ? (
          // Filled card
          <>
            <div
              style={{
                fontSize: PX.playerLastNameFontSize,
                fontWeight: 600,
                color: TEXT_COLORS.primary,
                textAlign: 'center',
                lineHeight: 1.2,
                maxWidth: '90%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {getLastName(pick.player.name)}
            </div>
            <div
              style={{
                fontSize: PX.playerPosTeamFontSize,
                color: TEXT_COLORS.secondary,
                marginTop: 1,
              }}
            >
              {pick.player.position} - {pick.player.team}
            </div>
          </>
        ) : isCurrentPick ? (
          // On the clock
          <div
            style={{
              fontSize: PX.timerFontSize,
              fontWeight: 700,
              color: isUrgent ? COLORS.onTheClockUrgent : TEXT_COLORS.primary,
            }}
          >
            {timer !== undefined ? timer : '--'}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PicksBarPanel({
  picks,
  currentPickNumber,
  participants,
  userParticipantIndex,
  timer,
  status,
}: PicksBarPanelProps): ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to current pick
  useEffect(() => {
    if (!scrollRef.current) return;
    
    const cardWidth = PX.cardWidth + (PX.cardMargin * 2);
    const scrollPosition = (currentPickNumber - 1) * cardWidth;
    const containerWidth = scrollRef.current.clientWidth;
    const centerOffset = containerWidth / 2 - PX.cardWidth / 2;
    
    scrollRef.current.scrollTo({
      left: Math.max(0, scrollPosition - centerOffset),
      behavior: 'smooth',
    });
  }, [currentPickNumber]);
  
  // Generate pick slots
  const totalPicks = participants.length * 18;
  const teamCount = participants.length;
  
  const getParticipantForPick = (pickNum: number): Participant | undefined => {
    const round = Math.ceil(pickNum / teamCount);
    const pickInRound = (pickNum - 1) % teamCount;
    const isEvenRound = round % 2 === 0;
    const participantIndex = isEvenRound 
      ? teamCount - 1 - pickInRound 
      : pickInRound;
    return participants[participantIndex];
  };
  
  const isUserPick = (pickNum: number): boolean => {
    const participant = getParticipantForPick(pickNum);
    return participant?.isUser || false;
  };
  
  return (
    <div
      style={{
        height: PX.containerHeight,
        minHeight: PX.containerHeight,
        flexShrink: 0,
        backgroundColor: PX.containerBg,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingTop: PX.containerPaddingTop,
        paddingLeft: PX.containerPaddingX,
        paddingRight: PX.containerPaddingX,
      }}
    >
      <div
        ref={scrollRef}
        style={{
          height: '100%',
          display: 'flex',
          overflowX: 'auto',
          overflowY: 'hidden',
        }}
        className="tablet-scroll-hidden"
      >
        {Array.from({ length: Math.min(totalPicks, 216) }, (_, i) => {
          const pickNum = i + 1;
          const pick = picks.find(p => p.pickNumber === pickNum);
          const participant = getParticipantForPick(pickNum);
          
          return (
            <PickCard
              key={pickNum}
              pickNumber={pickNum}
              pick={pick}
              participant={participant}
              isCurrentPick={pickNum === currentPickNumber}
              isUserPick={isUserPick(pickNum)}
              timer={pickNum === currentPickNumber ? timer : undefined}
            />
          );
        })}
      </div>
      
      <style>{`
        .tablet-scroll-hidden::-webkit-scrollbar {
          display: none !important;
        }
        .tablet-scroll-hidden {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
      `}</style>
    </div>
  );
}
