/**
 * RosterPanelVX - Version X Roster Panel (TypeScript)
 * 
 * Pixel-perfect recreation of: components/draft/v3/mobile/apple/components/RosterPage.js
 * 
 * Layout uses flexbox - no magic pixel values for scroll height.
 * Content naturally fills available space.
 */

import React, { useState, useEffect, useRef } from 'react';
import { POSITION_COLORS } from '../../constants/colors';
import { PLATFORM } from '../../constants/sizes';
import { PositionBadgeInline } from '../../shared/PositionBadge';
import type { FantasyPosition, RosterPosition } from '../../constants/positions';
import type { Player, Participant, Pick } from '../../shared/types';
import { getByeWeek } from '../../shared/utils';

// Re-export types
export type { Player, Participant } from '../../shared/types';

export interface RosterPanelVXProps {
  participants: Participant[];
  picks?: Pick[];
  selectedParticipantIndex?: number;
  onParticipantChange?: (index: number) => void;
  onDraftPlayer?: (player: Player) => void;
  isMyTurn?: boolean;
  /** Current pick number to determine who's on the clock */
  currentPickNumber?: number;
}

// ============================================================================
// PIXEL CONSTANTS
// ============================================================================

const ROSTER_PX = {
  // Header
  headerPaddingTop: 0,
  headerPaddingBottom: 16,
  headerPaddingX: 24,
  dropdownWidth: 240,
  dropdownBorderRadius: 12,
  dropdownMarginTop: 9,
  dropdownMaxHeight: 520,
  dropdownItemPaddingTop: 7,
  dropdownItemPaddingBottom: 9,
  dropdownItemPaddingX: 12,
  dropdownNameWidth: 150,
  dropdownArrowLeft: 12,
  dropdownArrowSize: 16,
  buttonPaddingY: 6,
  chevronSize: 16,
  chevronContainerSize: 20,
  
  // Roster Rows
  rowHeight: 40,
  rowBorderWidth: 1,
  
  // Position Badge Column
  badgeColumnWidth: 64,
  badgeColumnPaddingLeft: 8,
  starterBadgeWidth: 44,
  starterBadgeHeight: 28,
  benchBadgeWidth: 30,
  benchBadgeHeight: 19,
  benchEmptyBadgeWidth: 44,
  benchEmptyBadgeHeight: 28,
  
  // Player Content
  playerContentPaddingX: 8,
  playerNameFontSize: 13,
  teamByeFontSize: 11,
  teamByeMinWidth: 60,
  teamByeMarginLeft: 12,
  teamByeMarginRight: 8,
  
  // Bench
  benchHeaderPaddingX: 24,
  benchHeaderPaddingTop: 16,
  benchHeaderPaddingBottom: 8,
  benchHeaderFontSize: 14,
  benchHeaderTranslateY: -4,
  
  // Slots
  startingSlots: 9,
  benchSlots: 9,
} as const;

const ROSTER_COLORS = {
  background: '#101927',
  rowBackground: 'rgba(255, 255, 255, 0.02)',
  rowBorder: 'rgba(255, 255, 255, 0.1)',
  headerBorder: 'rgba(255, 255, 255, 0.1)',
  dropdownBg: '#374151',
  dropdownBorder: '#1f2833',
  dropdownHoverBg: '#4b5563',
  dropdownSelectedBg: '#4B5563',
  buttonBg: '#374151',
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  chevronColor: '#9ca3af',
  arrowColor: '#3B82F6',
} as const;

// ============================================================================
// ROSTER CONFIGURATION
// ============================================================================

const STARTING_POSITIONS: RosterPosition[] = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'FLEX'];
const BENCH_SLOTS = ROSTER_PX.benchSlots;
const ROW_HEIGHT = ROSTER_PX.rowHeight;

function createRosterGradient(position: string): string {
  const color = POSITION_COLORS[position as keyof typeof POSITION_COLORS] || POSITION_COLORS.BN;
  return `linear-gradient(to right, ${color}40 0%, transparent 50%)`;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RosterPanelVX({
  participants = [],
  picks = [],
  selectedParticipantIndex = 0,
  onParticipantChange,
  isMyTurn = false,
  currentPickNumber = 1,
}: RosterPanelVXProps): React.ReactElement {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate which participant is on the clock and draft direction
  const participantCount = participants.length || 12;
  const currentRound = Math.ceil(currentPickNumber / participantCount);
  const isSnakeRound = currentRound % 2 === 0;
  const pickIndexInRound = (currentPickNumber - 1) % participantCount;
  const onTheClockIndex = isSnakeRound 
    ? participantCount - 1 - pickIndexInRound 
    : pickIndexInRound;
  // Draft direction: odd rounds go down (1→12), even rounds go up (12→1)
  const draftDirectionUp = isSnakeRound;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Get team for selected participant (snake draft logic)
  const getTeamForParticipant = (participantIndex: number): Player[] => {
    const participantCount = participants.length || 12;
    return picks.filter(pick => {
      const round = Math.ceil(pick.pickNumber / participantCount);
      const isSnakeRound = round % 2 === 0;
      const pickIndexInRound = (pick.pickNumber - 1) % participantCount;
      const pickParticipantIndex = isSnakeRound 
        ? participantCount - 1 - pickIndexInRound 
        : pickIndexInRound;
      return pickParticipantIndex === participantIndex && pick.player;
    }).map(pick => pick.player);
  };

  const team = getTeamForParticipant(selectedParticipantIndex);
  const selectedParticipant = participants[selectedParticipantIndex];

  return (
    <div 
      className="h-full text-white flex flex-col overflow-hidden"
      style={{ backgroundColor: ROSTER_COLORS.background }}
    >
      {/* Header with Dropdown */}
      <div 
        className="flex-shrink-0 flex justify-center"
        style={{ 
          paddingTop: `${ROSTER_PX.headerPaddingTop}px`, 
          paddingBottom: `${ROSTER_PX.headerPaddingBottom}px`,
          paddingLeft: `${ROSTER_PX.headerPaddingX}px`,
          paddingRight: `${ROSTER_PX.headerPaddingX}px`,
        }}
      >
        <div className="relative" style={{ width: `${ROSTER_PX.dropdownWidth}px` }}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-center w-full"
            style={{ 
              borderRadius: `${ROSTER_PX.dropdownBorderRadius}px`, 
              paddingLeft: `${ROSTER_PX.dropdownItemPaddingX}px`, 
              paddingRight: `${ROSTER_PX.dropdownItemPaddingX}px`,
              paddingTop: `${ROSTER_PX.buttonPaddingY}px`,
              paddingBottom: `${ROSTER_PX.buttonPaddingY}px`,
              position: 'relative',
              backgroundColor: ROSTER_COLORS.buttonBg,
            }}
          >
            <div 
              className="text-sm font-bold text-center"
              style={{ color: ROSTER_COLORS.textPrimary }}
            >
              {selectedParticipant?.name || 'Select Team'}
            </div>
            <div 
              className="transition-transform flex items-center justify-center"
              style={{ 
                position: 'absolute', 
                right: `${ROSTER_PX.dropdownItemPaddingX}px`,
                width: `${ROSTER_PX.chevronContainerSize}px`,
                height: `${ROSTER_PX.chevronContainerSize}px`,
                color: ROSTER_COLORS.chevronColor,
              }}
            >
              <svg 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ 
                  width: `${ROSTER_PX.chevronSize}px`, 
                  height: `${ROSTER_PX.chevronSize}px` 
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div 
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 z-50 overflow-y-auto"
              style={{ 
                borderRadius: `${ROSTER_PX.dropdownBorderRadius}px`, 
                marginTop: `${ROSTER_PX.dropdownMarginTop}px`,
                backgroundColor: ROSTER_COLORS.dropdownBg,
                border: `1px solid ${ROSTER_COLORS.dropdownBorder}`,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                maxHeight: `${ROSTER_PX.dropdownMaxHeight}px`,
              }}
            >
              {participants.map((participant, index) => {
                const isSelected = index === selectedParticipantIndex;
                const isOnTheClock = index === onTheClockIndex;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      onParticipantChange?.(index);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full transition-colors flex justify-center"
                    style={{ 
                      paddingTop: `${ROSTER_PX.dropdownItemPaddingTop}px`, 
                      paddingBottom: `${ROSTER_PX.dropdownItemPaddingBottom}px`,
                      paddingLeft: `${ROSTER_PX.dropdownItemPaddingX}px`,
                      paddingRight: `${ROSTER_PX.dropdownItemPaddingX}px`,
                      backgroundColor: isSelected ? ROSTER_COLORS.dropdownSelectedBg : 'transparent',
                      position: 'relative',
                    }}
                  >
                    {/* Draft direction arrow - absolutely positioned */}
                    <div 
                      style={{ 
                        position: 'absolute', 
                        left: `${ROSTER_PX.dropdownArrowLeft}px`, 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}
                    >
                      {isOnTheClock && (
                        <svg 
                          width={ROSTER_PX.dropdownArrowSize} 
                          height={ROSTER_PX.dropdownArrowSize} 
                          viewBox="0 0 24 24" 
                          fill="none"
                        >
                          <path
                            d={draftDirectionUp 
                              ? "M12 19V5M12 5L5 12M12 5L19 12"  // Up arrow
                              : "M12 5V19M12 19L5 12M12 19L19 12" // Down arrow
                            }
                            stroke={ROSTER_COLORS.arrowColor}
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <div 
                      className="font-medium text-sm text-left" 
                      style={{ 
                        width: `${ROSTER_PX.dropdownNameWidth}px`,
                        color: ROSTER_COLORS.textPrimary,
                      }}
                    >
                      {participant.name}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Roster List - Scrollable area that fills remaining space */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          borderTop: `2px solid ${ROSTER_COLORS.headerBorder}`,
        }}
      >
        {/* Starting Lineup */}
        {STARTING_POSITIONS.map((position, index) => (
          <RosterRow
            key={`start-${index}`}
            position={position}
            player={getPlayerForSlot(team, position, index, STARTING_POSITIONS)}
            isStarter={true}
          />
        ))}
        
        {/* Bench Header */}
        <div 
          className="font-medium"
          style={{ 
            paddingLeft: `${ROSTER_PX.benchHeaderPaddingX}px`,
            paddingRight: `${ROSTER_PX.benchHeaderPaddingX}px`,
            paddingTop: `${ROSTER_PX.benchHeaderPaddingTop}px`,
            paddingBottom: `${ROSTER_PX.benchHeaderPaddingBottom}px`,
            fontSize: `${ROSTER_PX.benchHeaderFontSize}px`,
            transform: `translateY(${ROSTER_PX.benchHeaderTranslateY}px)`,
            color: ROSTER_COLORS.textSecondary,
          }}
        >
          BENCH
        </div>
        
        {/* Bench Slots */}
        {[...Array(BENCH_SLOTS)].map((_, index) => {
          const benchPlayers = team.slice(ROSTER_PX.startingSlots);
          const benchPlayer = benchPlayers[index] || null;
          
          return (
            <RosterRow
              key={`bench-${index}`}
              position={benchPlayer?.position || 'BN'}
              player={benchPlayer}
              isStarter={false}
              showTopBorder={index === 0}
            />
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// HELPER: Get player for a starting lineup slot
// ============================================================================

function getPlayerForSlot(
  team: Player[],
  position: RosterPosition,
  slotIndex: number,
  allPositions: RosterPosition[]
): Player | null {
  if (position === 'FLEX') {
    // FLEX can be RB, WR, or TE - find first unused
    return team.find(player => 
      (player.position === 'RB' || player.position === 'WR' || player.position === 'TE') &&
      !team.slice(0, slotIndex).some(p => p === player)
    ) || null;
  }
  
  // Regular position - count how many of this position come before this slot
  const positionPlayers = team.filter(player => player.position === position);
  const positionIndex = allPositions
    .slice(0, slotIndex + 1)
    .filter(pos => pos === position).length - 1;
  
  return positionPlayers[positionIndex] || null;
}

// ============================================================================
// ROSTER ROW COMPONENT
// ============================================================================

interface RosterRowProps {
  position: RosterPosition | FantasyPosition | 'BN';
  player: Player | null;
  isStarter: boolean;
  showTopBorder?: boolean;
}

function RosterRow({ position, player, isStarter, showTopBorder = false }: RosterRowProps): React.ReactElement {
  // Starters and empty slots use 'lg' (44x28), filled bench uses 'md' (30x19)
  const badgeSize: 'sm' | 'md' | 'lg' | 'xl' = (isStarter || !player) ? 'lg' : 'md';
  const displayPosition = player ? player.position : position;

  return (
    <div 
      className="flex items-center relative overflow-hidden"
      style={{ 
        height: `${ROSTER_PX.rowHeight}px`,
        backgroundColor: ROSTER_COLORS.rowBackground,
        borderBottom: `${ROSTER_PX.rowBorderWidth}px solid ${ROSTER_COLORS.rowBorder}`,
        borderTop: showTopBorder ? `${ROSTER_PX.rowBorderWidth}px solid ${ROSTER_COLORS.rowBorder}` : 'none',
      }}
    >
      {/* Gradient overlay for filled bench slots */}
      {!isStarter && player && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ background: createRosterGradient(player.position), zIndex: 1 }}
        />
      )}
      
      {/* Position Badge - fixed width column */}
      <div 
        className="flex-shrink-0 flex items-center justify-center z-10"
        style={{ 
          width: `${ROSTER_PX.badgeColumnWidth}px`, 
          paddingLeft: `${ROSTER_PX.badgeColumnPaddingLeft}px` 
        }}
      >
        <PositionBadgeInline position={displayPosition} size={badgeSize} />
      </div>
      
      {/* Player Content - fills remaining space */}
      {player ? (
        <div 
          className="flex-1 flex items-center z-10"
          style={{ paddingLeft: `${ROSTER_PX.playerContentPaddingX}px`, paddingRight: `${ROSTER_PX.playerContentPaddingX}px` }}
        >
          {/* Player Name - takes available space */}
          <div 
            className="flex-1 font-medium truncate"
            style={{ 
              fontSize: `${ROSTER_PX.playerNameFontSize}px`,
              color: ROSTER_COLORS.textPrimary,
            }}
          >
            {player.name}
          </div>
          
          {/* Team (Bye) - right aligned */}
          <div 
            className="flex-shrink-0 text-right"
            style={{ 
              fontSize: `${ROSTER_PX.teamByeFontSize}px`, 
              minWidth: `${ROSTER_PX.teamByeMinWidth}px`,
              marginLeft: `${ROSTER_PX.teamByeMarginLeft}px`,
              marginRight: `${ROSTER_PX.teamByeMarginRight}px`,
              color: ROSTER_COLORS.textSecondary,
            }}
          >
            {player.team} ({getByeWeek(player.team) || 'TBD'})
          </div>
        </div>
      ) : (
        <div className="flex-1 z-10" />
      )}
    </div>
  );
}
