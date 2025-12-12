/**
 * Card Sandbox - Visual comparison of PicksBar cards
 * Copy of current draft room cards for isolated testing
 */

import React from 'react';

// ============================================================================
// CONSTANTS - Exact copy from PicksBar.tsx
// ============================================================================

const PICKS_BAR_PX = {
  // Cards - EXACT match to Board's TeamHeader
  cardWidth: 92,
  cardBorderRadius: 6,
  cardBorderWidth: 4,
  cardMargin: 1,
  cardBg: '#374151', // gray-700
  
  // Header - matched to Board
  headerHeight: 20,
  headerFontSize: 10,
  headerMaxChars: 12,
  
  // Content area - matched to Board
  contentMinHeight: 70,
  contentPaddingBottom: 8,
  
  // Pick number & position row
  pickNumberFontSize: 8,
  pickNumberMarginTop: 2,
  pickNumberMarginLeft: 2,
  
  // Timer
  timerFontSize: 24,
  
  // Player name
  playerLastNameFontSize: 11,
  playerPosTeamFontSize: 9,
  playerPosTeamMarginTop: 1,
  
  // Position tracker bar
  trackerHeight: 9,
  trackerWidth: 74,
  trackerEmptyWidth: 75,
  trackerMarginTop: 2,
  trackerBorderRadius: 1,
};

const CARD_COLORS = {
  userPick: '#3B82F6',      // Blue
  onTheClock: '#EF4444',    // Red
  otherPick: '#6B7280',     // Gray
  emptyTracker: '#6B7280',
};

const POSITION_COLORS = {
  QB: '#F472B6',  // Pink
  RB: '#0fba80',  // Green
  WR: '#FBBF25',  // Yellow
  TE: '#7C3AED',  // Purple
};

// Helper to format pick display
function formatPickDisplay(pickNumber, teamCount = 12) {
  const round = Math.ceil(pickNumber / teamCount);
  const pickInRound = ((pickNumber - 1) % teamCount) + 1;
  return `${round}.${pickInRound.toString().padStart(2, '0')}`;
}

// Position order for tracker bar - always QB, RB, WR, TE
const POSITION_ORDER = ['QB', 'RB', 'WR', 'TE'];

// Helper to count positions and return sorted entries
function getPositionCounts(picks) {
  const counts = { QB: 0, RB: 0, WR: 0, TE: 0 };
  picks.forEach(pos => {
    if (counts[pos] !== undefined) {
      counts[pos]++;
    }
  });
  // Return only positions with counts > 0, in order
  return POSITION_ORDER
    .filter(pos => counts[pos] > 0)
    .map(pos => ({ position: pos, count: counts[pos] }));
}

// ============================================================================
// FILLED CARD - Copy from PicksBar.tsx
// ============================================================================

function FilledCard({ 
  participantName, 
  pickNumber, 
  playerName, 
  playerPosition, 
  playerTeam,
  participantPicks = [],
  teamCount = 12,
}) {
  const positionColor = POSITION_COLORS[playerPosition] || CARD_COLORS.otherPick;
  const displayName = participantName.length > PICKS_BAR_PX.headerMaxChars
    ? participantName.substring(0, PICKS_BAR_PX.headerMaxChars)
    : participantName;
  const nameParts = playerName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || playerName;
  
  return (
    <div
      style={{
        flexShrink: 0,
        width: PICKS_BAR_PX.cardWidth,
        minWidth: PICKS_BAR_PX.cardWidth,
        margin: PICKS_BAR_PX.cardMargin,
        borderRadius: PICKS_BAR_PX.cardBorderRadius,
        border: `${PICKS_BAR_PX.cardBorderWidth}px solid ${positionColor}`,
        backgroundColor: PICKS_BAR_PX.cardBg,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Header - 20px height */}
      <div
        style={{
          height: PICKS_BAR_PX.headerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 4px',
          backgroundColor: positionColor,
          fontSize: PICKS_BAR_PX.headerFontSize,
          fontWeight: 500,
          color: '#000000',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        {displayName.toUpperCase()}
      </div>
      
      {/* Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: PICKS_BAR_PX.contentMinHeight,
          position: 'relative',
        }}
      >
        {/* Pick Number & Position Row - absolutely positioned at top */}
        <div
          style={{
            position: 'absolute',
            top: 1,
            left: 2,
            right: 2,
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: PICKS_BAR_PX.pickNumberFontSize,
            fontWeight: 500,
            color: '#FFFFFF',
          }}
        >
          <span>{formatPickDisplay(pickNumber, teamCount)}</span>
          <span>{playerPosition}</span>
        </div>
        
        {/* Center content - player name (first + last on two lines) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginBottom: 4,
            paddingTop: 12,
          }}
        >
          {/* First Name */}
          <div
            style={{
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: PICKS_BAR_PX.playerLastNameFontSize,
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }}
          >
            {firstName}
          </div>
          {/* Last Name */}
          <div
            style={{
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: PICKS_BAR_PX.playerLastNameFontSize,
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }}
          >
            {lastName}
          </div>
        </div>
        
        {/* Position-Team - just above tracker */}
        <div
          style={{
            color: '#FFFFFF',
            fontSize: PICKS_BAR_PX.playerPosTeamFontSize,
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: 2,
          }}
        >
          {playerPosition}-{playerTeam}
        </div>
        
        {/* Position Tracker Bar - at bottom with padding */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            paddingBottom: 5,
          }}
        >
          {participantPicks.length === 0 ? (
            <div
              style={{
                height: PICKS_BAR_PX.trackerHeight,
                width: PICKS_BAR_PX.trackerEmptyWidth,
                backgroundColor: CARD_COLORS.emptyTracker,
                borderRadius: PICKS_BAR_PX.trackerBorderRadius,
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                height: PICKS_BAR_PX.trackerHeight,
                width: PICKS_BAR_PX.trackerWidth,
                borderRadius: PICKS_BAR_PX.trackerBorderRadius,
                overflow: 'hidden',
              }}
            >
              {getPositionCounts(participantPicks).map(({ position, count }) => (
                <div
                  key={position}
                  style={{
                    flex: count,
                    backgroundColor: POSITION_COLORS[position],
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// BLANK CARD - Copy from PicksBar.tsx
// ============================================================================

function BlankCard({ 
  participantName, 
  pickNumber,
  isUser = false,
  isOnTheClock = false,
  timer,
  picksAway,
  participantPicks = [],
  teamCount = 12,
}) {
  // Determine card color
  const getCardColor = () => {
    if (isOnTheClock && isUser) return CARD_COLORS.onTheClock;
    if (isUser) return CARD_COLORS.userPick;
    return CARD_COLORS.otherPick;
  };
  
  const cardColor = getCardColor();
  const displayName = participantName.length > PICKS_BAR_PX.headerMaxChars
    ? participantName.substring(0, PICKS_BAR_PX.headerMaxChars)
    : participantName;
  
  return (
    <div
      style={{
        flexShrink: 0,
        width: PICKS_BAR_PX.cardWidth,
        minWidth: PICKS_BAR_PX.cardWidth,
        margin: PICKS_BAR_PX.cardMargin,
        borderRadius: PICKS_BAR_PX.cardBorderRadius,
        border: `${PICKS_BAR_PX.cardBorderWidth}px solid ${cardColor}`,
        backgroundColor: PICKS_BAR_PX.cardBg,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Header - 20px height */}
      <div
        style={{
          height: PICKS_BAR_PX.headerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 4px',
          backgroundColor: cardColor,
          fontSize: PICKS_BAR_PX.headerFontSize,
          fontWeight: 500,
          color: isUser ? '#000000' : '#FFFFFF',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        {displayName.toUpperCase()}
      </div>
      
      {/* Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: PICKS_BAR_PX.contentMinHeight,
          position: 'relative',
        }}
      >
        {/* Pick Number Row - absolutely positioned at top */}
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: 2,
            right: 2,
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: PICKS_BAR_PX.pickNumberFontSize,
            fontWeight: 500,
            color: '#FFFFFF',
          }}
        >
          <span>{formatPickDisplay(pickNumber, teamCount)}</span>
          <span></span>
        </div>
        
        {/* Center Content - timer or status */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {timer !== undefined ? (
            <div
              style={{
                fontWeight: 700,
                color: '#FFFFFF',
                fontSize: PICKS_BAR_PX.timerFontSize,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {timer}
            </div>
          ) : isUser && picksAway !== undefined && picksAway > 0 ? (
            <div
              style={{
                color: '#FFFFFF',
                fontWeight: 500,
                fontSize: 11,
                textAlign: 'center',
                lineHeight: 1.2,
              }}
            >
              {picksAway === 1 ? 'Up Next' : `${picksAway} away`}
            </div>
          ) : null}
        </div>
        
        {/* Position Tracker Bar - at bottom with padding */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            paddingBottom: 5,
          }}
        >
          {participantPicks.length === 0 ? (
            <div
              style={{
                height: PICKS_BAR_PX.trackerHeight,
                width: PICKS_BAR_PX.trackerEmptyWidth,
                backgroundColor: CARD_COLORS.emptyTracker,
                borderRadius: PICKS_BAR_PX.trackerBorderRadius,
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                height: PICKS_BAR_PX.trackerHeight,
                width: PICKS_BAR_PX.trackerWidth,
                borderRadius: PICKS_BAR_PX.trackerBorderRadius,
                overflow: 'hidden',
              }}
            >
              {getPositionCounts(participantPicks).map(({ position, count }) => (
                <div
                  key={position}
                  style={{
                    flex: count,
                    backgroundColor: POSITION_COLORS[position],
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SANDBOX PAGE
// ============================================================================

export default function CardSandbox() {
  return (
    <div style={{ 
      backgroundColor: '#101927', 
      minHeight: '100vh', 
      padding: 40,
      display: 'flex',
      flexDirection: 'column',
      gap: 40,
    }}>
      <h1 style={{ color: '#FFFFFF', fontSize: 24, margin: 0 }}>Card Sandbox</h1>
      <p style={{ color: '#9CA3AF', fontSize: 14, margin: 0 }}>
        Copy of current PicksBar cards for isolated testing
      </p>
      
      {/* Filled Cards - Different Positions */}
      <div>
        <h2 style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 16 }}>Filled Cards (Position Colors)</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <FilledCard
            participantName="YOU"
            pickNumber={1}
            playerName="Ja'Marr Chase"
            playerPosition="WR"
            playerTeam="CIN"
            participantPicks={['WR']}
          />
          <FilledCard
            participantName="DRAGONSLAYER"
            pickNumber={2}
            playerName="Bijan Robinson"
            playerPosition="RB"
            playerTeam="ATL"
            participantPicks={['RB']}
          />
          <FilledCard
            participantName="FFCHAMPION"
            pickNumber={3}
            playerName="Lamar Jackson"
            playerPosition="QB"
            playerTeam="BAL"
            participantPicks={['QB']}
          />
          <FilledCard
            participantName="GRIDIRONGURU"
            pickNumber={4}
            playerName="Travis Kelce"
            playerPosition="TE"
            playerTeam="KC"
            participantPicks={['TE']}
          />
        </div>
      </div>
      
      {/* Blank Cards - User States */}
      <div>
        <h2 style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 16 }}>Blank Cards - User States</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <BlankCard
            participantName="YOU"
            pickNumber={1}
            isUser={true}
            isOnTheClock={true}
            timer={25}
          />
          <BlankCard
            participantName="YOU"
            pickNumber={13}
            isUser={true}
            isOnTheClock={false}
            picksAway={11}
          />
          <BlankCard
            participantName="YOU"
            pickNumber={25}
            isUser={true}
            isOnTheClock={false}
            picksAway={1}
          />
        </div>
      </div>
      
      {/* Blank Cards - Other Participants */}
      <div>
        <h2 style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 16 }}>Blank Cards - Other Participants</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <BlankCard
            participantName="DRAGONSLAYER"
            pickNumber={2}
            isUser={false}
            isOnTheClock={true}
            timer={30}
          />
          <BlankCard
            participantName="FFCHAMPION"
            pickNumber={3}
            isUser={false}
          />
          <BlankCard
            participantName="GRIDIRONGURU"
            pickNumber={4}
            isUser={false}
          />
        </div>
      </div>
      
      {/* Cards with Position Tracker */}
      <div>
        <h2 style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 16 }}>Cards with Position Tracker</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <FilledCard
            participantName="YOU"
            pickNumber={13}
            playerName="CeeDee Lamb"
            playerPosition="WR"
            playerTeam="DAL"
            participantPicks={['WR', 'RB', 'WR']}
          />
          <BlankCard
            participantName="YOU"
            pickNumber={25}
            isUser={true}
            picksAway={5}
            participantPicks={['WR', 'RB', 'WR', 'TE']}
          />
        </div>
      </div>
      
      {/* Reference */}
      <div style={{ marginTop: 20, padding: 16, backgroundColor: '#1F2937', borderRadius: 8 }}>
        <h2 style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 8 }}>Card Dimensions (from PICKS_BAR_PX):</h2>
        <pre style={{ color: '#6B7280', fontSize: 11, margin: 0 }}>
{`cardWidth: 92px
cardBorderRadius: 6px
cardBorderWidth: 4px
cardMargin: 1px
cardBg: #374151 (gray-700)
headerHeight: 20px
contentMinHeight: 70px
contentPaddingBottom: 8px
trackerHeight: 9px`}
        </pre>
      </div>
    </div>
  );
}
