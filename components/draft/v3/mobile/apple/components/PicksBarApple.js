/**
 * Picks Bar - iOS Optimized
 * 
 * Horizontal scrolling picks with iOS design:
 * - Smaller cards optimized for mobile
 * - Touch-friendly scrolling
 * - iOS animations and styling
 * - Simplified information display
 */

import React, { useRef, useEffect, useState } from 'react';
import { MOBILE_SIZES, PLATFORM_SPECIFIC } from '../../shared/constants/mobileSizes';
import { useUserPreferences } from '../../../../../../hooks/useUserPreferences';

export default function PicksBarApple({ 
  picks = [], 
  participants = [],
  currentPickNumber = 1,
  isDraftActive = false,
  timer = 120,
  isInGracePeriod = false,
  isMyTurn = false,
  scrollRef,
  onPlayerCardClick
}) {
  // State for pick number format toggle
  const [showAbsolutePickNumbers, setShowAbsolutePickNumbers] = useState(false);
  
  // Get user's custom border color
  const { getBorderColor } = useUserPreferences();
  const userBorderColor = getBorderColor();

  // Handle pick number format toggle
  const handlePickNumberToggle = () => {
    setShowAbsolutePickNumbers(!showAbsolutePickNumbers);
  };
  const localScrollRef = useRef(null);
  const scrollContainer = scrollRef || localScrollRef;

  // Auto-scroll to current pick (mobile optimized)
  useEffect(() => {
    if (!scrollContainer.current) return;
    
    const container = scrollContainer.current;
    const cardWidth = parseInt(MOBILE_SIZES.PICKS_BAR.cardWidth);
    const cardGap = parseInt(MOBILE_SIZES.PICKS_BAR.cardGap);
    const cardTotalWidth = cardWidth + cardGap;
    
    // Always center pick 1.01 (currentPickNumber = 1) in the middle of the screen
    // Account for 2 blank cards before pick 1.01
    const pickToCenter = currentPickNumber || 1;
    const targetPosition = (pickToCenter - 1 + 2) * cardTotalWidth;
    const containerWidth = container.offsetWidth;
    const centerPosition = targetPosition - (containerWidth / 2) + (cardWidth / 2);
    
    container.scrollTo({
      left: Math.max(0, centerPosition),
      behavior: 'smooth'
    });
  }, [currentPickNumber, scrollContainer]);

  return (
    <>
      <style jsx global>{`
        .picks-bar-scroll::-webkit-scrollbar {
          width: 0px !important;
          height: 0px !important;
          display: none !important;
        }
        .picks-bar-scroll::-webkit-scrollbar-track {
          background: transparent !important;
          display: none !important;
        }
        .picks-bar-scroll::-webkit-scrollbar-thumb {
          background-color: transparent !important;
          display: none !important;
        }
        .picks-bar-scroll::-webkit-scrollbar-thumb:hover {
          background-color: transparent !important;
          display: none !important;
        }
        .picks-bar-scroll {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        
        /* Additional scrollbar hiding for picks bar */
        .picks-bar-scroll * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        
        .picks-bar-scroll *::-webkit-scrollbar {
          width: 0px !important;
          height: 0px !important;
          display: none !important;
        }
      `}</style>
      <div 
        className="h-full bg-[#101927] py-3"
        style={{ height: '160px' }}
      >
        <div 
          ref={scrollContainer}
          className="flex gap-2 overflow-x-auto h-full picks-bar-scroll"
          style={{
            gap: MOBILE_SIZES.PICKS_BAR.cardGap,
            WebkitOverflowScrolling: 'touch'
          }}
        >
        {/* Two blank cards before 1.01 */}
        {Array.from({ length: 2 }, (_, index) => (
          <BlankCardApple key={`blank-${index}`} />
        ))}
        
        {/* Generate cards for all rounds (18 rounds) */}
        {Array.from({ length: (participants.length || 12) * 18 }, (_, index) => {
          const pickNumber = index + 1;
          const pick = picks.find(p => p.pickNumber === pickNumber);
          const isCurrentPick = pickNumber === currentPickNumber;
          
          // Find the next unpicked slot to show as "on the clock"
          const nextUnpickedSlot = Array.from({ length: (participants.length || 12) * 18 }, (_, i) => i + 1)
            .find(num => !picks.find(p => p.pickNumber === num));
          const isOnTheClock = isDraftActive && pickNumber === nextUnpickedSlot;
          
          return (
            <PickCardApple
              key={`pick-${pickNumber}`}
              pickNumber={pickNumber}
              pick={pick}
              isCurrentPick={isCurrentPick}
              isOnTheClock={isOnTheClock}
              isDraftActive={isDraftActive}
              timer={timer}
              isInGracePeriod={isInGracePeriod}
              isMyTurn={isMyTurn}
              participants={participants}
              currentPickNumber={currentPickNumber}
              picks={picks}
              onPlayerCardClick={onPlayerCardClick}
              showAbsolutePickNumbers={showAbsolutePickNumbers}
              onPickNumberToggle={handlePickNumberToggle}
              userBorderColor={userBorderColor}
            />
          );
        })}
      </div>
    </div>
    </>
  );
}

/**
 * Blank Card Component - Same size as pick cards but empty
 */
function BlankCardApple() {
  return (
    <div 
      className="flex-shrink-0"
      style={{
        width: MOBILE_SIZES.PICKS_BAR.cardWidth,
        height: MOBILE_SIZES.PICKS_BAR.cardHeight,
        backgroundColor: 'transparent'
      }}
    >
      {/* Completely empty card for spacing */}
    </div>
  );
}

/**
 * Individual Pick Card - iOS Style (Mobile Optimized)
 */
function PickCardApple({ 
  pickNumber, 
  pick, 
  isCurrentPick, 
  isOnTheClock,
  isDraftActive,
  timer,
  isInGracePeriod,
  isMyTurn,
  participants,
  currentPickNumber,
  picks,
  onPlayerCardClick,
  showAbsolutePickNumbers,
  onPickNumberToggle,
  userBorderColor
}) {

  // Helper function to get participant for any pick number
  const getParticipantForPick = (pickNum = pickNumber) => {
    const participantCount = participants.length || 12;
    if (!participantCount) return null;
    
    const round = Math.ceil(pickNum / participantCount);
    const isSnakeRound = round % 2 === 0;
    const pickIndexInRound = (pickNum - 1) % participantCount;
    
    const participantIndex = isSnakeRound 
      ? participantCount - 1 - pickIndexInRound 
      : pickIndexInRound;
    
    return participants[participantIndex] || null;
  };

  // Calculate position tracker bar for completed picks and future picks
  const getPositionTrackerData = () => {
    // For completed picks, calculate based on actual team composition
    if (pick && pick.player) {
      // Get the participant for this pick
      const participant = getParticipantForPick();
      if (!participant) {
        return { showBar: false, color: '#6B7280' };
      }

      // Find all picks for this participant up to and including this pick
      const participantPicks = picks.filter(p => {
        if (!p || !p.pickNumber) return false;
        const participantForPick = getParticipantForPick(p.pickNumber);
        return participantForPick && participantForPick.name === participant.name && p.pickNumber <= pickNumber;
      });

      return calculateBarSegments(participantPicks);
    }

    // For future picks, use the most recent pick from the same participant
    else {
      // Get the participant for this future pick
      const futurePickParticipant = getParticipantForPick();
      if (!futurePickParticipant) {
        return { showBar: false, color: '#6B7280' };
      }

      // Find all picks made by this same participant
      const sameParticipantPicks = picks.filter(p => {
        if (!p || !p.pickNumber) return false;
        const participantForPick = getParticipantForPick(p.pickNumber);
        return participantForPick && participantForPick.name === futurePickParticipant.name;
      });

      if (sameParticipantPicks.length === 0) {
        return { showBar: false, color: '#6B7280' };
      }

      return calculateBarSegments(sameParticipantPicks);
    }
  };

  // Helper function to calculate bar segments from picks
  const calculateBarSegments = (participantPicks) => {
    // Count positions
    const positionCounts = {
      QB: 0,
      RB: 0,
      WR: 0,
      TE: 0
    };

    participantPicks.forEach(p => {
      if (p.player && p.player.position) {
        positionCounts[p.player.position] = (positionCounts[p.player.position] || 0) + 1;
      }
    });

    // Calculate total picks
    const totalPicks = Object.values(positionCounts).reduce((sum, count) => sum + count, 0);
    
    if (totalPicks === 0) {
      return { showBar: false, color: '#6B7280' };
    }

    // Create segments for the bar
    const segments = [];
    const positionColors = {
      QB: '#F472B6',  // Pink
      RB: '#0fba80',  // Green  
      WR: '#FBBF25',  // Yellow
      TE: '#7C3AED'   // Purple
    };

    Object.entries(positionCounts).forEach(([position, count]) => {
      if (count > 0) {
        const percentage = (count / totalPicks) * 100;
        segments.push({
          position,
          count,
          percentage,
          color: positionColors[position]
        });
      }
    });

    return {
      showBar: true,
      segments,
      totalPicks
    };
  };

  const participant = getParticipantForPick();
  const trackerData = getPositionTrackerData();

  // Card styling
  const getCardStyling = () => {
    // Check if this is a user's pick (participant index 0)
    const isUserPick = participant && participants.indexOf(participant) === 0;
    
    // On-the-clock picks - vivid red for all
    if (isOnTheClock) {
      return {
        border: 'none',
        boxShadow: 'inset 0 0 0 4px #EF4444', // Vivid red for on-the-clock
        boxSizing: 'border-box'
      };
    }
    // Completed picks have inside border matching their position color
    if (pick && pick.player) {
      const position = pick.player.position;
      const colors = {
        QB: '#F472B6',
        RB: '#0fba80',
        WR: '#FBBF25',
        TE: '#7C3AED'
      };
      const positionColor = colors[position] || '#6B7280';
      
      return {
        border: 'none',
        boxShadow: `inset 0 0 0 4px ${positionColor}`, // Inside border matching position color
        boxSizing: 'border-box'
      };
    }
    if (pick) {
      return {
        border: 'none',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        boxShadow: 'none' // Remove any box shadows that might cause line artifacts
      };
    }
    // Check if this is a user's future pick (participant index 0)
    
    return {
      border: 'none',
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      boxShadow: `inset 0 0 0 4px ${isUserPick ? userBorderColor : '#6B7280'}`, // Custom color for user's future picks, grey for others
      boxSizing: 'border-box'
    };
  };

  const cardStyling = getCardStyling();

  // Round and pick calculation - with safety check for participants
  const participantCount = participants.length || 12; // Default to 12 if participants is empty
  const round = Math.ceil(pickNumber / participantCount);
  const pickInRound = ((pickNumber - 1) % participantCount) + 1;

  return (
      <div 
        className="flex-shrink-0 relative bg-gray-800 overflow-hidden"
        style={{
          width: MOBILE_SIZES.PICKS_BAR.cardWidth,
          height: 'calc(100% - 8px)',
          borderRadius: '6px',
          minWidth: MOBILE_SIZES.PICKS_BAR.cardWidth,
          maxWidth: MOBILE_SIZES.PICKS_BAR.cardWidth,
          flexShrink: 0,
          flexGrow: 0,
          boxSizing: 'border-box', // Ensure border is included in dimensions
          cursor: pick?.player ? 'pointer' : 'default',
        ...cardStyling
      }}
      onClick={pick?.player ? () => onPlayerCardClick?.(pickNumber) : undefined}
    >
      {/* Header Section (Username + Yellow Line) - Part of Border */}
      <div 
        className="relative"
        style={{
          borderRadius: '6px 6px 0 0',
          paddingTop: '2px',
          paddingBottom: '2px',
          paddingLeft: '0px',
          paddingRight: '0px',
          marginTop: '0px',
          marginLeft: '0px',
          marginRight: '0px'
        }}
      >
        {/* Participant Name (Top) */}
        <div 
          className={`text-center text-white font-medium text-xs mb-1 ${
            participant?.name === 'TITANIMPLOSION' ? 'horizontalscrollingusernamerbakcground' : 
            (pick && pick.player && pick.player.position === 'QB') ? 'pinkhorizontalscrollingborder' :
            (pick && pick.player && pick.player.position === 'WR') ? 'bluehorizontalscrollingborder' :
            (pick && pick.player && pick.player.position === 'RB') ? 'greenhorizontalscrollingborder' :
            (pick && pick.player && pick.player.position === 'TE') ? 'purplehorizontalscrollingborder' :
            isOnTheClock ? 'horizontalscrollingotcborder' : ''
          }`}
          style={{ 
            fontSize: '12px',
            lineHeight: '13px',
            overflow: 'hidden',
            paddingLeft: '4px',
            paddingRight: '4px',
            paddingTop: (pick && pick.player) ? '7.5px' : isOnTheClock ? '7.5px' : (!pick && !isOnTheClock) ? '7.5px' : '5px',
            paddingBottom: (pick && pick.player) ? '6.5px' : isOnTheClock ? '6.5px' : (!pick && !isOnTheClock) ? '6.5px' : '0',
            marginTop: (pick && pick.player) || isOnTheClock || (!pick && !isOnTheClock) ? '-2px' : '1px',
            marginLeft: (pick && pick.player) || isOnTheClock || (!pick && !isOnTheClock) ? '-8px' : '0',
            marginRight: (pick && pick.player) || isOnTheClock || (!pick && !isOnTheClock) ? '-8px' : '0',
            backgroundColor: (pick && pick.player && pick.player.position === 'QB') ? '#F472B6' :
              (pick && pick.player && pick.player.position === 'WR') ? '#FBBF25' :
              (pick && pick.player && pick.player.position === 'RB') ? '#0fba80' :
              (pick && pick.player && pick.player.position === 'TE') ? '#7C3AED' :
              isOnTheClock ? '#EF4444' : // Vivid red for on-the-clock
              (participant && participants.indexOf(participant) === 0) ? userBorderColor : '#6B7280', // Custom color for user's future picks, grey for everything else
            color: pick ? 'black' : 'white',
            borderRadius: (pick && pick.player) || isOnTheClock || (!pick && !isOnTheClock) ? '6px 6px 0 0' : '0',
            border: 'none', // Remove any border from inside the colored header area
            boxShadow: 'none' // Remove any shadows that might create line artifacts
          }}
          data-participant={participant?.name}
        >
          {((participant?.name?.replace(/[,\s]/g, '') || 'TBD').length > 12 
            ? (participant?.name?.replace(/[,\s]/g, '') || 'TBD').substring(0, 12)
            : (participant?.name?.replace(/[,\s]/g, '') || 'TBD')
          )}
        </div>


      </div>

      {/* Player Content Area - Below Header */}
      <div 
        className="flex-1 flex flex-col items-center justify-start px-2"
        style={{
          borderRadius: '0 0 6px 6px',
          paddingTop: '6px'
        }}
      >
        {/* Pick Number - Top Left */}
        {!(pickNumber === 1 && !isDraftActive && !pick?.player) && (
          <div 
            className="absolute text-xs font-bold cursor-pointer"
            style={{ 
              fontSize: '11.5px', // Same font size for all pick numbers
              color: '#6B7280', // Grey for all pick numbers
              letterSpacing: '-0.5px', // Reduce spacing between numbers
              zIndex: 10,
              top: pickNumber === 1 ? '31px' : (isOnTheClock ? '29px' : '30px'), // All pick numbers moved down 1px more
              left: pickNumber === 1 ? '12px' : (isOnTheClock ? '10px' : '11px')  // 1.01 moved right 1px more to 12px
            }}
            onClick={(e) => {
              e.stopPropagation();
              onPickNumberToggle();
            }}
          >
            {showAbsolutePickNumbers ? pickNumber : `${round}.${pickInRound < 10 ? `0${pickInRound}` : pickInRound}`}
          </div>
        )}

        {/* Position - Top Right (for completed picks) */}
        {pick?.player && (
          <div 
            className="absolute text-xs font-bold"
            style={{ 
              fontSize: '11.5px',
              color: '#6B7280', // Grey to match pick number
              zIndex: 10,
              top: '30px',
              right: '10px'
            }}
          >
            {pick.player.position}
          </div>
        )}

        {/* Player Content */}
        <div className="flex-1 flex items-center justify-center" style={{ paddingTop: '8px' }}>
          {pick?.player ? (
            <div className="text-white font-bold text-sm text-center">
              {/* Player initial removed */}
            </div>
          ) : (
            <div className="text-gray-500 text-xs text-center">
              {/* Empty - no pick number displayed */}
            </div>
          )}
        </div>
        
        {/* Picks Away Text - aligned with timer height for future picks - only for user picks */}
        {!pick?.player && !isOnTheClock && pickNumber > currentPickNumber && participant && participants.indexOf(participant) === 0 && (
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ zIndex: 10, paddingTop: '12px' }}
          >
            <div 
              className="text-gray-400 font-medium text-center"
              style={{
                fontSize: '12px',
                textAlign: 'center'
              }}
            >
              {pickNumber - currentPickNumber === 1 ? 'Up Next' : `${pickNumber - currentPickNumber} away`}
            </div>
          </div>
        )}
        
        {/* Timer overlay for on-the-clock picks */}
        {isOnTheClock && (
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ zIndex: 10, paddingTop: '12px' }}
          >
            <div 
              className="font-bold text-center transition-colors duration-[4000ms]"
              style={{ 
                fontSize: '44px', // Increased timer size
                color: isInGracePeriod ? '#ffffff' : isMyTurn ? (timer > 12 ? '#ffffff' : '#ef4444') : '#ffffff', // White during grace period, White/Red only for user, White for other players
                minWidth: '120px', // Fixed width to prevent shifting
                width: '120px', // Exact width
                height: '70px', // Fixed height to prevent vertical movement
                display: 'flex',
                alignItems: 'center',
                marginTop: '2px',
                justifyContent: 'center',
                textAlign: 'center',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                letterSpacing: (pickNumber >= 10 && pickNumber <= 19) ? '-1px' : '0px', // Reduce spacing for picks 10-19
                lineHeight: '1', // Consistent line height
                fontVariantNumeric: 'tabular-nums' // Use tabular numbers for consistent width
              }}
            >
              {(() => {
                // For 30-second draft rooms, show simple 2-digit format
                if (timer <= 30) {
                  return timer.toString().padStart(2, '0');
                }
                
                // For longer timers, show hour format down to 1h, then switch to mm:ss
                if (timer >= 3600) {
                  return `${Math.floor(timer / 3600)}h`;
                } else {
                  const minutes = Math.floor(timer / 60);
                  const seconds = timer % 60;
                  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }
              })()}
            </div>
          </div>
        )}

        {/* Pre-draft countdown for pick 1.01 */}
        {!isDraftActive && pickNumber === 1 && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ zIndex: 10, paddingTop: '12px' }}
          >
            <div 
              className="font-bold text-white transition-colors duration-[4000ms]"
              style={{ 
                fontSize: '44px', // Increased pre-draft timer
                minWidth: '120px', // Fixed width to prevent shifting
                width: '120px', // Exact width
                height: '50px', // Reduced height to make room for text below
                display: 'flex',
                alignItems: 'center',
                marginTop: '2px',
                justifyContent: 'center',
                textAlign: 'center',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                letterSpacing: '0px', // Remove any letter spacing
                lineHeight: '1', // Consistent line height
                fontVariantNumeric: 'tabular-nums' // Use tabular numbers for consistent width
              }}
            >
              {timer.toString().padStart(2, '0')}
            </div>
            <div 
              className="text-white font-medium"
              style={{
                fontSize: '12px',
                textAlign: 'center',
                marginTop: '2px'
              }}
            >
              Draft Starts In
            </div>
          </div>
        )}
      </div>

      {/* Player Info (if picked) */}
      {pick?.player && (
        <div className="absolute left-2 right-2 text-center" style={{ bottom: '24px' }}>
          {/* NFL Logo */}
          <div 
            className="flex items-center justify-center mb-2"
            style={{ 
              marginBottom: '3px',
              transform: 'translateY(-5px)'
            }}
          >
            <img 
              src={`/logos/nfl/${pick.player.team.toLowerCase()}.png`}
              alt={pick.player.team}
              className="inline-block"
              style={{
                width: '40.824px',
                height: '40.824px',
                objectFit: 'contain'
              }}
              onError={(e) => {
                // Fallback to text if logo fails to load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'inline';
              }}
            />
            <span 
              className="text-gray-300 text-xs"
              style={{ display: 'none', fontSize: '10px' }}
            >
              {pick.player.team}
            </span>
          </div>
          
          {/* Player Name */}
          <div 
            className="text-white text-xs font-medium"
            style={{ 
              fontSize: '11px',
              lineHeight: '12px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              transform: 'translateY(-3px)'
            }}
          >
            {(() => {
              const name = pick.player.name;
              const nameParts = name.split(' ');
              if (nameParts.length >= 2) {
                const firstName = nameParts[0];
                const lastName = nameParts.slice(1).join(' ');
                return `${firstName.charAt(0)}. ${lastName}`;
              }
              return name;
            })()}
          </div>
        </div>
      )}
      
      {/* Position Tracker Bar - Segmented by Position Percentages */}
      {trackerData.showBar ? (
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 flex"
          style={{ 
            height: '8px',
            width: '80%',
            bottom: '12px',
            borderRadius: '1.5px',
            zIndex: 5,
            overflow: 'hidden'
          }}
        >
          {trackerData.segments.map((segment, index) => (
            <div
              key={`${segment.position}-${index}`}
              style={{
                width: `${segment.percentage}%`,
                height: '100%',
                backgroundColor: segment.color,
                borderRadius: index === 0 ? '1.5px 0 0 1.5px' : index === trackerData.segments.length - 1 ? '0 1.5px 1.5px 0' : '0'
              }}
              title={`${segment.position}: ${segment.count} player${segment.count !== 1 ? 's' : ''} (${segment.percentage.toFixed(1)}%)`}
            />
          ))}
        </div>
      ) : (
        // Fallback for future picks or picks without data
        <div 
          className="absolute left-1/2 transform -translate-x-1/2"
        style={{ 
            height: '8px',
            width: '80%',
            backgroundColor: '#6B7280',
            bottom: '12px',
            borderRadius: '1.5px',
            zIndex: 5
          }}
        />
      )}
    </div>
  );
}
