import React, { useState, useRef, useEffect } from 'react';
import { logoOptions } from './team-logos';
import { POSITION_HELPERS, POSITIONS } from './draft/v3/constants/positions';

// Team colors (keep as before)
const TEAM_COLORS = [
  '#2563eb', // blue
  '#e11d48', // red
  '#10b981', // green
  '#f59e42', // orange
  '#a21caf', // purple
  '#14b8a6', // teal
  '#facc15', // yellow
  '#f472b6', // pink
  '#6b7280', // gray
  '#92400e', // brown
  '#84cc16', // lime
  '#6366f1', // indigo
];

// Using established position colors from constants

// SVG checkered flag overlay
const CheckeredFlag = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" style={{ position: 'absolute', top: 0, right: 0 }}>
    <rect width="18" height="18" fill="white" />
    <rect x="0" y="0" width="9" height="9" fill="black" />
    <rect x="9" y="9" width="9" height="9" fill="black" />
  </svg>
);

export default function FullDraftBoard({ room, picks, participants, draftOrder, PLAYER_POOL }) {
  const [hasVisitedBoard, setHasVisitedBoard] = useState(false);
  const [savedScrollPosition, setSavedScrollPosition] = useState(null);
  const tableRef = useRef(null);
  
  const totalRounds = room?.settings?.totalRounds || 18;
  const effectiveDraftOrder = draftOrder.length > 0 ? draftOrder : participants;
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);
  const maxTeams = 12;
  const gridParticipants = [...effectiveDraftOrder];
  while (gridParticipants.length < maxTeams) gridParticipants.push('---');

  // Build picks grid
  const picksByTeam = gridParticipants.map((team, teamIndex) =>
    rounds.map(round => {
      const isSnakeRound = round % 2 === 0;
      let pickPosition;
      if (isSnakeRound) {
        pickPosition = effectiveDraftOrder.length - 1 - teamIndex;
      } else {
        pickPosition = teamIndex;
      }
      const expectedTeam = effectiveDraftOrder[pickPosition];
      const pick = picks.find(p => p.user === expectedTeam && p.round === round);
      return pick ? pick.player : '';
    })
  );

  const getPositionColor = (position) => {
    return POSITION_HELPERS.getPositionColor(position);
  };

  // Robust player name matching function
  const findPlayerInPool = (playerName) => {
    if (!playerName || !PLAYER_POOL) return null;
    
    // Cache lowercase version to avoid repeated calls
    const playerNameLower = playerName.toLowerCase();
    
    // Try exact match first
    let player = PLAYER_POOL.find(p => p.name === playerName);
    if (player) return player;
    
    // Try case-insensitive match
    player = PLAYER_POOL.find(p => p.name && p.name.toLowerCase() === playerNameLower);
    if (player) return player;
    
    // Try matching by last name (common format: "McBride" vs "Trey McBride")
    const lastName = playerName.split(' ').pop();
    if (lastName && lastName.length > 2) {
      const lastNameLower = lastName.toLowerCase();
      player = PLAYER_POOL.find(p => p.name && p.name.toLowerCase().includes(lastNameLower));
      if (player) return player;
    }
    
    // Try matching by first name + last name variations
    const nameParts = playerName.split(' ');
    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const firstNameLower = firstName.toLowerCase();
      const lastName = nameParts.slice(1).join(' ');
      const lastNameLower = lastName.toLowerCase();
      
      // Try "First Last" format
      player = PLAYER_POOL.find(p => {
        if (!p.name) return false;
        const poolNameParts = p.name.split(' ');
        if (poolNameParts.length >= 2) {
          const poolFirstName = poolNameParts[0];
          const poolLastName = poolNameParts.slice(1).join(' ');
          return poolFirstName.toLowerCase() === firstNameLower && 
                 poolLastName.toLowerCase() === lastNameLower;
        }
        return false;
      });
      if (player) return player;
      
      // Try "Last, First" format (same logic as above)
      player = PLAYER_POOL.find(p => {
        if (!p.name) return false;
        const poolNameParts = p.name.split(' ');
        if (poolNameParts.length >= 2) {
          const poolFirstName = poolNameParts[0];
          const poolLastName = poolNameParts.slice(1).join(' ');
          return poolFirstName.toLowerCase() === firstNameLower && 
                 poolLastName.toLowerCase() === lastNameLower;
        }
        return false;
      });
      if (player) return player;
    }
    
    return null;
  };

  // Calculate position proportions for each team using picksByTeam (snake order)
  const getTeamPositionProportions = (teamIdx) => {
    const teamPlayers = picksByTeam[teamIdx] || [];
    const positionCounts = {};
    let totalPicks = 0;
    teamPlayers.forEach(playerName => {
      if (!playerName) return;
      const playerData = findPlayerInPool(playerName);
      if (playerData && playerData.position) {
        positionCounts[playerData.position] = (positionCounts[playerData.position] || 0) + 1;
        totalPicks++;
      }
    });
    if (totalPicks === 0) return [];
    // Always return in order: QB, RB, WR, TE
    return POSITIONS.map(position => ({
      position,
      proportion: (positionCounts[position] || 0) / totalPicks,
      color: getPositionColor(position)
    })).filter(prop => prop.proportion > 0); // Optionally, keep this filter to skip zero-width bars
  };

  // Handle first visit navigation to username
  useEffect(() => {
    if (!hasVisitedBoard && tableRef.current) {
      // Get username from localStorage (same as draft room)
      const userName = localStorage.getItem('draftUserName');
      
      if (userName) {
        // Find the user's column index
        const userIndex = effectiveDraftOrder.findIndex(participant => participant === userName);
        
        if (userIndex !== -1) {
          // Calculate the horizontal scroll position to center the user's column
          const tableElement = tableRef.current;
          const columnWidth = 72 + 12; // 72px column width + 12px for borders/spacing
          const viewportWidth = window.innerWidth;
          const targetScrollLeft = Math.max(0, (userIndex * columnWidth) - (viewportWidth / 2) + (columnWidth / 2));
          
          // Scroll to the user's column
          tableElement.scrollLeft = targetScrollLeft;
          
          // Mark as visited and save the position
          setHasVisitedBoard(true);
          setSavedScrollPosition(targetScrollLeft);
        }
      }
    }
  }, [hasVisitedBoard, effectiveDraftOrder]);

  // Restore saved scroll position on subsequent visits
  useEffect(() => {
    if (hasVisitedBoard && savedScrollPosition !== null && tableRef.current) {
      tableRef.current.scrollLeft = savedScrollPosition;
    }
  }, [hasVisitedBoard, savedScrollPosition]);

  // Save scroll position when user scrolls manually
  const handleScroll = (e) => {
    if (hasVisitedBoard) {
      setSavedScrollPosition(e.target.scrollLeft);
    }
  };

  // Early return AFTER all hooks
  if (!room) return null;

  return (
    <div className="mb-8 overflow-hidden">
      <div className="w-full overflow-x-auto" ref={tableRef} onScroll={handleScroll}>
        <table className="w-full max-w-none border-collapse text-sm" style={{ border: '6px solid #18181b', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th className="p-3 font-bold text-lg" style={{ background: '#18181b', color: '#fff', border: '6px solid #18181b', width: 10, minWidth: 10, maxWidth: 10, height: 80, boxSizing: 'border-box' }}>
                <div className="flex flex-col items-center">
                  <div className="text-xs" style={{ color: '#fff' }}>RND</div>
                </div>
              </th>
              {gridParticipants.map((team, idx) => (
                <th
                  key={team + idx}
                  className="p-0 border-2 font-bold text-lg relative"
                  style={{ 
                    background: '#18181b', 
                    color: '#fff', 
                    border: '6px solid #18181b', 
                    padding: 0, 
                    width: 72, 
                    minWidth: 72, 
                    maxWidth: 72, 
                    height: 80,
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Username positioned in the colored top border */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: '0',
                      left: '0',
                      right: '0',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: '#ffffff',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      zIndex: 10,
                      backgroundColor: idx === 0 
                        ? '#FBBF25' // Yellow background for user (first team)
                        : '#6B7280' // Gray background for others
                    }}
                  >
                    {team && typeof team === 'string' && team !== '---' 
                      ? (team.length > 8 ? team.substring(0, 8) + '...' : team)
                      : `Team ${idx + 1}`
                    }
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, height: 'calc(100% - 16px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                      {(() => {
                        if (typeof team !== 'string' || team === '---') return '';
                        // Use animal logo for each team
                        const logoIndex = idx % logoOptions.length;
                        const LogoComponent = logoOptions[logoIndex].component;
                        const bgColor = logoOptions[logoIndex].bgColor;
                        return <LogoComponent size={32} bgColor={bgColor} />;
                      })()}
                    </div>
                    <div style={{ height: 6, width: 90, borderRadius: 3, marginTop: 2, marginBottom: 18, display: 'flex', overflow: 'hidden' }}>
                      {(() => {
                        const proportions = getTeamPositionProportions(idx);
                        if (proportions.length === 0) {
                          return <div style={{ height: 6, width: 90, background: TEAM_COLORS[idx % TEAM_COLORS.length], borderRadius: 3 }} />;
                        }
                        // Always render in order QB, RB, WR, TE
                        return proportions.map((prop, propIdx) => (
                          <div
                            key={prop.position}
                            style={{
                              height: 6,
                              width: `${prop.proportion * 90}px`,
                              background: prop.color,
                              minWidth: prop.proportion > 0 ? '2px' : 0
                            }}
                          />
                        ));
                      })()}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rounds.map((round, rIdx) => (
              <tr key={round}>
                <td className="p-3 font-bold text-lg" style={{ background: '#18181b', color: '#fff', border: '6px solid #18181b', width: 10, minWidth: 10, maxWidth: 10, height: 80, boxSizing: 'border-box' }}>
                  <div className="flex flex-col items-center">
                    <div className="text-xs" style={{ color: '#fff' }}>{round}</div>
                  </div>
                </td>
                {gridParticipants.map((team, tIdx) => {
                  const playerName = picksByTeam[tIdx][rIdx];
                  let cellStyle = { background: '#18181b', color: '#fff', border: '6px solid #18181b', padding: 0, width: 72, minWidth: 72, maxWidth: 72, height: 80, minHeight: 80, maxHeight: 80, boxSizing: 'border-box' };
                  let playerData = null;
                  let innerBorderColor = null;
                  if (playerName) {
                    playerData = findPlayerInPool(playerName);
                    if (playerData) {
                      innerBorderColor = getPositionColor(playerData.position);
                    }
                  }
                  return (
                    <td
                      key={team + tIdx + round}
                      className="text-center font-bold"
                      style={cellStyle}
                    >
                      <div className="min-h-full flex items-center justify-center w-full h-full">
                        {playerName ? (
                          <div
                            className="text-sm rounded w-full h-full flex flex-col justify-center items-center"
                            style={{
                              position: 'relative',
                              overflow: 'visible',
                              background: 'transparent',
                              height: '100%',
                              width: '100%',
                              boxSizing: 'border-box',
                              borderTop: innerBorderColor ? `18px solid ${innerBorderColor}` : undefined,
                              borderLeft: innerBorderColor ? `4px solid ${innerBorderColor}` : undefined,
                              borderRight: innerBorderColor ? `4px solid ${innerBorderColor}` : undefined,
                              borderBottom: innerBorderColor ? `4px solid ${innerBorderColor}` : undefined,
                              borderRadius: 8,
                              margin: 0,
                              padding: 0,
                              textAlign: 'center',
                              alignItems: 'center',
                              paddingLeft: 4,
                              paddingRight: 4,
                            }}
                          >
                            {/* Pick number and round.pickInRound at the top border */}
                            <span
                              style={{
                                position: 'absolute',
                                top: -16,
                                left: 6,
                                right: 6,
                                height: 16,
                                width: 'calc(100% - 12px)',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontWeight: 700,
                                fontSize: 10,
                                color: '#fff',
                                zIndex: 4,
                                pointerEvents: 'none',
                              }}
                            >
                              {(() => {
                                const pickObj = picks.find(
                                  p => p.player === playerName && p.round === round
                                );
                                if (!pickObj) return '';
                                const pickNumber = pickObj.pickNumber;
                                const roundNum = pickObj.round;
                                const pickInRound = ((pickNumber - 1) % 12) + 1;
                                const pickInRoundStr = pickInRound < 10 ? `0${pickInRound}` : `${pickInRound}`;
                                return <>
                                  <span style={{ marginLeft: -2 }}>{pickNumber}</span>
                                  <span style={{ marginRight: -2 }}>{`${roundNum}.${pickInRoundStr}`}</span>
                                </>;
                              })()}
                            </span>
                            {/* NFL Team Logo */}
                            {playerData?.team && (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, marginBottom: 2 }}>
                                <img 
                                  src={`/logos/nfl/${playerData.team.toLowerCase()}.png`}
                                  alt={playerData.team}
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    objectFit: 'contain',
                                    display: 'block'
                                  }}
                                  onError={(e) => {
                                    console.log('Logo failed to load:', `/logos/nfl/${playerData.team.toLowerCase()}.png`);
                                    // Fallback to text if logo fails to load
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'inline-block';
                                  }}
                                  onLoad={() => {
                                    console.log('Logo loaded successfully:', `/logos/nfl/${playerData.team.toLowerCase()}.png`);
                                  }}
                                />
                                <span 
                                  className="text-gray-300"
                                  style={{ 
                                    display: 'none', 
                                    fontSize: '8px',
                                    color: '#fff',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {playerData.team}
                                </span>
                              </div>
                            )}

                            <div style={{ fontSize: 9, letterSpacing: 0.3, color: '#fff', marginTop: 2, fontFamily: 'Arial, Helvetica, sans-serif', lineHeight: 1.0, textAlign: 'center', wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', maxWidth: '100%', padding: '0 2px' }}>
                              {playerName || null}
                            </div>
                            <div className="text-xs" style={{ 
                              color: '#fff', 
                              fontWeight: 500, 
                              fontSize: 8, 
                              fontFamily: 'Futura, Helvetica, Arial, sans-serif', 
                              textAlign: 'center',
                              position: 'absolute',
                              bottom: '2px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: '100%'
                            }}>
                              {playerData ? `${playerData.position} • ${playerData.team}` : ''}
                            </div>
                          </div>
                        ) : (
                          // FUTURE PICK: Grey outline style matching completed picks
                          <div
                            className="text-sm rounded w-full h-full flex flex-col justify-center items-center"
                            style={{
                              position: 'relative',
                              overflow: 'visible',
                              background: 'transparent',
                              height: '100%',
                              width: '100%',
                              boxSizing: 'border-box',
                              borderTop: '18px solid #6b7280',
                              borderLeft: '4px solid #6b7280',
                              borderRight: '4px solid #6b7280',
                              borderBottom: '4px solid #6b7280',
                              borderRadius: 8,
                              margin: 0,
                              padding: 0,
                              textAlign: 'center',
                              alignItems: 'center',
                              paddingLeft: 4,
                              paddingRight: 4,
                            }}
                          >
                            {/* Pick number and round.pickInRound at the top border */}
                            <span
                              style={{
                                position: 'absolute',
                                top: -16,
                                left: 6,
                                right: 6,
                                height: 16,
                                width: 'calc(100% - 12px)',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontWeight: 700,
                                fontSize: 10,
                                color: '#fff',
                                zIndex: 4,
                                pointerEvents: 'none',
                              }}
                            >
                              {(() => {
                                // Calculate pick number and round info for future picks
                                const isSnakeRound = round % 2 === 0;
                                let pickPosition;
                                if (isSnakeRound) {
                                  pickPosition = effectiveDraftOrder.length - 1 - tIdx;
                                } else {
                                  pickPosition = tIdx;
                                }
                                const expectedTeam = effectiveDraftOrder[pickPosition];
                                const pickNumber = (round - 1) * effectiveDraftOrder.length + pickPosition + 1;
                                const pickInRound = pickPosition + 1;
                                const pickInRoundStr = pickInRound < 10 ? `0${pickInRound}` : `${pickInRound}`;
                                return <>
                                  <span style={{ marginLeft: -2 }}>{pickNumber}</span>
                                  <span style={{ marginRight: -2 }}>{`${round}.${pickInRoundStr}`}</span>
                                </>;
                              })()}
                            </span>

                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 