import React from 'react';
import { logoOptions } from './team-logos';

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

// Exact Underdog-style position colors
const POSITION_COLORS = {
  QB: '#7C3AED', // deep purple
  RB: '#008C47', // darker green
  WR: '#F59E42', // bright orange
  TE: '#F472B6', // hot pink
};

// SVG checkered flag overlay
const CheckeredFlag = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" style={{ position: 'absolute', top: 0, right: 0 }}>
    <rect width="18" height="18" fill="white" />
    <rect x="0" y="0" width="9" height="9" fill="black" />
    <rect x="9" y="9" width="9" height="9" fill="black" />
  </svg>
);

export default function FullDraftBoard({ room, picks, participants, draftOrder, PLAYER_POOL }) {
  if (!room) return null;

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
    switch (position) {
      case 'QB': return '#ff6b5a';
      case 'RB': return '#c4b5fd';
      case 'WR': return '#13b8a6';
      case 'TE': return '#6366f1';
      default: return '#6b7280';
    }
  };

  // Robust player name matching function
  const findPlayerInPool = (playerName) => {
    if (!playerName || !PLAYER_POOL) return null;
    
    // Try exact match first
    let player = PLAYER_POOL.find(p => p.name === playerName);
    if (player) return player;
    
    // Try case-insensitive match
    player = PLAYER_POOL.find(p => p.name.toLowerCase() === playerName.toLowerCase());
    if (player) return player;
    
    // Try matching by last name (common format: "McBride" vs "Trey McBride")
    const lastName = playerName.split(' ').pop();
    if (lastName && lastName.length > 2) {
      player = PLAYER_POOL.find(p => p.name.toLowerCase().includes(lastName.toLowerCase()));
      if (player) return player;
    }
    
    // Try matching by first name + last name variations
    const nameParts = playerName.split(' ');
    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      
      // Try "First Last" format
      player = PLAYER_POOL.find(p => {
        const poolNameParts = p.name.split(' ');
        if (poolNameParts.length >= 2) {
          const poolFirstName = poolNameParts[0];
          const poolLastName = poolNameParts.slice(1).join(' ');
          return poolFirstName.toLowerCase() === firstName.toLowerCase() && 
                 poolLastName.toLowerCase() === lastName.toLowerCase();
        }
        return false;
      });
      if (player) return player;
      
      // Try "Last, First" format
      player = PLAYER_POOL.find(p => {
        const poolNameParts = p.name.split(' ');
        if (poolNameParts.length >= 2) {
          const poolFirstName = poolNameParts[0];
          const poolLastName = poolNameParts.slice(1).join(' ');
          return poolFirstName.toLowerCase() === firstName.toLowerCase() && 
                 poolLastName.toLowerCase() === lastName.toLowerCase();
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
    const positions = ['QB', 'RB', 'WR', 'TE'];
    return positions.map(position => ({
      position,
      proportion: (positionCounts[position] || 0) / totalPicks,
      color: getPositionColor(position)
    })).filter(prop => prop.proportion > 0); // Optionally, keep this filter to skip zero-width bars
  };

  return (
    <div className="mb-8">
      <div className="overflow-x-auto w-full">
        <table className="w-full max-w-none border-collapse text-sm" style={{ border: '6px solid #18181b' }}>
          <thead>
            <tr>
              <th className="p-3 font-bold text-lg" style={{ background: '#18181b', color: '#fff', border: '6px solid #18181b', width: 10, minWidth: 10, maxWidth: 10, height: 80 }}></th>
              {gridParticipants.map((team, idx) => (
                <th
                  key={team + idx}
                  className="p-0 border-2 font-bold text-lg"
                  style={{ background: '#18181b', color: '#fff', border: '6px solid #18181b', padding: 0, width: 72, minWidth: 72, maxWidth: 72, height: 80 }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                      {(() => {
                        if (typeof team !== 'string' || team === '---') return '';
                        // Use animal logo for each team
                        const logoIndex = idx % logoOptions.length;
                        const LogoComponent = logoOptions[logoIndex].component;
                        const bgColor = logoOptions[logoIndex].bgColor;
                        return <LogoComponent size={36} bgColor={bgColor} />;
                      })()}
                    </div>
                    <div className="text-xs text-center w-full break-words leading-tight" style={{ color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 10, fontFamily: 'Arial, Helvetica, sans-serif' }}>
                      {team}
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
                <td className="p-3 font-bold text-lg" style={{ background: '#18181b', color: '#fff', border: '6px solid #18181b', width: 10, minWidth: 10, maxWidth: 10, height: 80 }}>
                  <div className="flex flex-col items-center">
                    <div className="text-xs" style={{ color: '#fff' }}>{round}</div>
                  </div>
                </td>
                {gridParticipants.map((team, tIdx) => {
                  const playerName = picksByTeam[tIdx][rIdx];
                  let cellStyle = { background: '#18181b', color: '#fff', border: '6px solid #18181b', padding: 0, width: 72, minWidth: 72, maxWidth: 72, height: 80, minHeight: 80, maxHeight: 80 };
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
                              textAlign: 'left',
                              alignItems: 'flex-start',
                              paddingLeft: 8,
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
                            <div style={{ fontSize: 12, letterSpacing: 0.5, color: '#fff', marginTop: 4, fontFamily: 'Arial, Helvetica, sans-serif' }}>
                              {(() => {
                                if (!playerName) return null;
                                const nameParts = playerName.split(' ');
                                if (nameParts.length === 1) {
                                  return <span>{playerName}</span>;
                                }
                                const firstName = nameParts[0];
                                const lastName = nameParts.slice(1).join(' ');
                                return <>
                                  <span style={{ display: 'block', marginBottom: 0, lineHeight: 1, marginTop: 5 }}>{firstName}</span>
                                  <span style={{ display: 'block', lineHeight: 1, marginBottom: 2 }}>{lastName}</span>
                                </>;
                              })()}
                            </div>
                            <div className="text-xs" style={{ color: '#fff', fontWeight: 500, marginBottom: 8, fontSize: 10, fontFamily: 'Futura, Helvetica, Arial, sans-serif' }}>
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
                              textAlign: 'left',
                              alignItems: 'flex-start',
                              paddingLeft: 8,
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