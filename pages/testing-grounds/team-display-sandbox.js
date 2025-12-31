/**
 * Team Display Sandbox - Design new team roster layout
 */

import React, { useState, useEffect } from 'react';
import { TEXT_COLORS } from '../../components/vx2/core/constants/colors';
import { createTeamGradient } from '@/lib/gradientUtils';
import { BYE_WEEKS } from '@/lib/nflConstants';
import { generatePlayerId } from '../../components/vx2/draft-room/utils';
import * as historicalService from '@/lib/historicalStats/service';

// ============================================================================
// PlayerExpandedCardNoDraft - Same as PlayerExpandedCard but without draft button
// ============================================================================
const HISTORICAL_SEASONS = [2024, 2023, 2022, 2021];

const WRTE_COLUMNS = [
  { label: 'YEAR', left: 6, width: 35 },
  { label: 'REC', left: 57, width: 30 },
  { label: 'TGTS', left: 99, width: 35 },
  { label: 'YDS', left: 146, width: 35 },
  { label: 'AVG', left: 193, width: 30 },
  { label: 'TD', left: 235, width: 25 },
  { label: 'CAR', left: 277, width: 30 },
  { label: 'YDS', left: 319, width: 35 },
  { label: 'AVG', left: 366, width: 30 },
  { label: 'TD', left: 408, width: 25 },
  { label: 'FUM', left: 445, width: 30 },
];

const RB_COLUMNS = [
  { label: 'YEAR', left: 6, width: 35 },
  { label: 'CAR', left: 57, width: 30 },
  { label: 'YDS', left: 99, width: 35 },
  { label: 'AVG', left: 146, width: 30 },
  { label: 'TD', left: 188, width: 25 },
  { label: 'FUM', left: 225, width: 30 },
  { label: 'REC', left: 267, width: 30 },
  { label: 'TGTS', left: 309, width: 35 },
  { label: 'YDS', left: 356, width: 35 },
  { label: 'AVG', left: 403, width: 30 },
  { label: 'TD', left: 445, width: 25 },
];

const QB_COLUMNS = [
  { label: 'YEAR', left: 6, width: 40 },
  { label: 'CMP', left: 62, width: 35 },
  { label: 'ATT', left: 109, width: 35 },
  { label: 'YDS', left: 156, width: 40 },
  { label: 'CMP%', left: 208, width: 40 },
  { label: 'AVG', left: 260, width: 35 },
  { label: 'TD', left: 307, width: 30 },
  { label: 'INT', left: 349, width: 30 },
  { label: 'SACK', left: 391, width: 40 },
  { label: 'CAR', left: 443, width: 30 },
  { label: 'YDS', left: 485, width: 35 },
  { label: 'AVG', left: 532, width: 30 },
  { label: 'TD', left: 574, width: 25 },
  { label: 'FUM', left: 611, width: 30 },
];

function formatStat(value, decimals) {
  if (value === undefined || value === null) return '0';
  if (decimals !== undefined) return value.toFixed(decimals);
  return value.toString();
}

function formatWRTEStats(stats) {
  if (!stats) return ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-'];
  const rec = stats.receiving;
  const rush = stats.rushing;
  return [
    formatStat(rec?.receptions), formatStat(rec?.targets), formatStat(rec?.yards),
    rec?.yardsPerReception ? formatStat(rec.yardsPerReception, 1) : '0.0',
    formatStat(rec?.touchdowns), formatStat(rush?.attempts), formatStat(rush?.yards),
    rush?.yardsPerAttempt ? formatStat(rush.yardsPerAttempt, 1) : '0.0',
    formatStat(rush?.touchdowns), formatStat(rush?.fumbles),
  ];
}

function formatRBStats(stats) {
  if (!stats) return ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-'];
  const rush = stats.rushing;
  const rec = stats.receiving;
  return [
    formatStat(rush?.attempts), formatStat(rush?.yards),
    rush?.yardsPerAttempt ? formatStat(rush.yardsPerAttempt, 1) : '0.0',
    formatStat(rush?.touchdowns), formatStat(rush?.fumbles),
    formatStat(rec?.receptions), formatStat(rec?.targets), formatStat(rec?.yards),
    rec?.yardsPerReception ? formatStat(rec.yardsPerReception, 1) : '0.0',
    formatStat(rec?.touchdowns),
  ];
}

function formatQBStats(stats) {
  if (!stats) return ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'];
  const pass = stats.passing;
  const rush = stats.rushing;
  return [
    formatStat(pass?.completions), formatStat(pass?.attempts), formatStat(pass?.yards),
    pass?.completionPct ? formatStat(pass.completionPct, 1) : '0.0',
    pass?.yardsPerAttempt ? formatStat(pass.yardsPerAttempt, 1) : '0.0',
    formatStat(pass?.touchdowns), formatStat(pass?.interceptions), formatStat(pass?.sacks),
    formatStat(rush?.attempts), formatStat(rush?.yards),
    rush?.yardsPerAttempt ? formatStat(rush.yardsPerAttempt, 1) : '0.0',
    formatStat(rush?.touchdowns), formatStat(rush?.fumbles),
  ];
}

function formatStatsForPosition(position, stats) {
  if (position === 'QB') return formatQBStats(stats);
  if (position === 'RB') return formatRBStats(stats);
  return formatWRTEStats(stats);
}

function PlayerExpandedCardNoDraft({ player, onClose, hideOuterGradient = false }) {
  const [historicalStats, setHistoricalStats] = useState(new Map());
  
  useEffect(() => {
    if (!player?.name) return;
    const playerId = generatePlayerId(player.name);
    historicalService.getPlayerAllSeasons(playerId)
      .then(seasons => {
        const statsMap = new Map();
        HISTORICAL_SEASONS.forEach(year => statsMap.set(year, null));
        seasons.forEach(stat => {
          if (HISTORICAL_SEASONS.includes(stat.season)) {
            statsMap.set(stat.season, stat);
          }
        });
        setHistoricalStats(statsMap);
      })
      .catch(() => setHistoricalStats(new Map()));
  }, [player?.name]);
  
  if (!player) return null;
  
  const { name, team, position, adp, projectedPoints } = player;
  const byeWeek = BYE_WEEKS[team] ?? 'N/A';
  const teamGradient = createTeamGradient(team);
  
  // Get columns based on position
  let columns, minWidth, emptyDataLength;
  if (position === 'QB') {
    columns = QB_COLUMNS; minWidth = 650; emptyDataLength = 13;
  } else if (position === 'RB') {
    columns = RB_COLUMNS; minWidth = 480; emptyDataLength = 10;
  } else {
    columns = WRTE_COLUMNS; minWidth = 480; emptyDataLength = 10;
  }
  const emptyData = Array(emptyDataLength).fill('-');
  
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClose?.(); }}
      style={hideOuterGradient ? {} : {
        background: teamGradient.firstGradient,
        padding: 2,
        borderRadius: 4,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Header: Logo + Badges (NO Draft Button) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px 6px 12px',
        gap: 16,
      }}>
        <img
          src={`/logos/nfl/${team?.toLowerCase()}.png`}
          alt={`${team} logo`}
          style={{ width: 36, height: 36, flexShrink: 0 }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#9ca3af', letterSpacing: '0.5px' }}>BYE</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{byeWeek}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#9ca3af', letterSpacing: '0.5px' }}>ADP</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{parseFloat(adp ?? 0).toFixed(1)}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#9ca3af', letterSpacing: '0.5px' }}>PROJ</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{parseFloat(projectedPoints ?? 0).toFixed(1)}</div>
          </div>
        </div>
      </div>
      
      {/* Stats Table */}
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          paddingBottom: 8, 
          overflowX: 'auto', 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="hide-scrollbar"
      >
        <div style={{ borderRadius: 4, fontSize: 12, minWidth }}>
          {/* Header */}
          <div style={{ position: 'relative', height: 24, paddingTop: 3, color: '#9ca3af', fontSize: 14, fontWeight: 500 }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: '#4b5563' }} />
            {columns.map((col, i) => (
              <div key={col.label + i} style={{ position: 'absolute', left: col.left, width: col.width, textAlign: i === 0 ? 'left' : 'center' }}>
                {col.label}
              </div>
            ))}
          </div>
          {/* Rows */}
          <div style={{ padding: '0 0 6px 0' }}>
            {/* Proj row */}
            <div style={{ position: 'relative', height: 20, padding: '4px 0', color: '#fff', fontSize: 14 }}>
              <div style={{ position: 'absolute', left: 10, width: 35, textAlign: 'left' }}>Proj.</div>
              {emptyData.map((val, i) => (
                <div key={i} style={{ position: 'absolute', left: columns.slice(1)[i]?.left ?? 0, width: columns.slice(1)[i]?.width ?? 30, textAlign: 'center' }}>
                  {val}
                </div>
              ))}
            </div>
            {/* Historical rows */}
            {HISTORICAL_SEASONS.map(season => {
              const stats = historicalStats.get(season);
              const values = stats ? formatStatsForPosition(position, stats) : emptyData;
              return (
                <div key={season} style={{ position: 'relative', height: 20, padding: '4px 0', color: '#fff', fontSize: 14 }}>
                  <div style={{ position: 'absolute', left: 10, width: 35, textAlign: 'left' }}>{season}</div>
                  {values.map((val, i) => (
                    <div key={i} style={{ position: 'absolute', left: columns.slice(1)[i]?.left ?? 0, width: columns.slice(1)[i]?.width ?? 30, textAlign: 'center' }}>
                      {val}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Position colors
const POSITION_COLORS = {
  QB: '#F472B6',
  RB: '#0fba80', 
  WR: '#FBBF25',
  TE: '#7C3AED',
};

// Mock team data
const MOCK_TEAM = {
  name: 'TopDog International IV',
  players: [
    // QBs (2)
    { name: 'Baker Mayfield', position: 'QB', team: 'TB', bye: 9, projectedPoints: 280, adp: 45.2 },
    { name: 'Josh Allen', position: 'QB', team: 'BUF', bye: 6, projectedPoints: 305, adp: 18.5 },
    // RBs (6)
    { name: 'Chuba Hubbard', position: 'RB', team: 'CAR', bye: 14, projectedPoints: 165, adp: 72.3 },
    { name: 'Bijan Robinson', position: 'RB', team: 'ATL', bye: 12, projectedPoints: 260, adp: 4.2 },
    { name: 'Jarquez Hunter', position: 'RB', team: 'LAR', bye: 8, projectedPoints: 85, adp: 145.8 },
    { name: 'Austin Ekeler', position: 'RB', team: 'WAS', bye: 12, projectedPoints: 120, adp: 89.4 },
    { name: 'Saquon Barkley', position: 'RB', team: 'PHI', bye: 9, projectedPoints: 260, adp: 8.7 },
    { name: "De'Von Achane", position: 'RB', team: 'MIA', bye: 5, projectedPoints: 225, adp: 12.1 },
    // WRs (8)
    { name: 'Courtland Sutton', position: 'WR', team: 'DEN', bye: 6, projectedPoints: 155, adp: 58.9 },
    { name: 'Garrett Wilson', position: 'WR', team: 'NYJ', bye: 5, projectedPoints: 240, adp: 21.4 },
    { name: 'Tyreek Hill', position: 'WR', team: 'MIA', bye: 5, projectedPoints: 270, adp: 6.3 },
    { name: 'Mike Evans', position: 'WR', team: 'TB', bye: 9, projectedPoints: 205, adp: 34.7 },
    { name: "Ja'Marr Chase", position: 'WR', team: 'CIN', bye: 10, projectedPoints: 285, adp: 3.8 },
    { name: 'CeeDee Lamb', position: 'WR', team: 'DAL', bye: 7, projectedPoints: 280, adp: 2.1 },
    { name: 'Nico Collins', position: 'WR', team: 'HOU', bye: 6, projectedPoints: 220, adp: 15.6 },
    { name: 'Drake London', position: 'WR', team: 'ATL', bye: 12, projectedPoints: 195, adp: 42.3 },
    // TEs (2)
    { name: 'Travis Kelce', position: 'TE', team: 'KC', bye: 10, projectedPoints: 220, adp: 14.2 },
    { name: 'Mark Andrews', position: 'TE', team: 'BAL', bye: 14, projectedPoints: 175, adp: 38.5 },
  ],
};

// Group players by position
function groupByPosition(players) {
  const groups = {};
  const posOrder = ['QB', 'RB', 'WR', 'TE'];
  
  players.forEach(player => {
    if (!groups[player.position]) {
      groups[player.position] = [];
    }
    groups[player.position].push(player);
  });
  
  return posOrder
    .filter(pos => groups[pos])
    .map(pos => ({ position: pos, players: groups[pos] }));
}

// Position Badge Component
function PositionBadge({ position }) {
  const color = POSITION_COLORS[position] || '#6B7280';
  return (
    <div
      style={{
        backgroundColor: color,
        color: '#000',
        fontSize: '10px',
        fontWeight: 600,
        padding: '2px 6px',
        borderRadius: '3px',
        textTransform: 'uppercase',
      }}
    >
      {position}
    </div>
  );
}

// ============================================================================
// DESIGN C: Cards with position color accent
// ============================================================================
function DesignC({ team }) {
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const expandedRef = React.useRef(null);
  const grouped = groupByPosition(team.players);
  
  const togglePlayer = (playerName) => {
    setExpandedPlayer(prev => prev === playerName ? null : playerName);
  };
  
  // Auto-scroll to expanded card
  React.useEffect(() => {
    if (expandedPlayer && expandedRef.current) {
      setTimeout(() => {
        expandedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }, [expandedPlayer]);
  
  return (
    <div style={{ backgroundColor: '#101927', padding: '8px 12px' }}>
      {grouped.map(({ position, players }, groupIdx) => (
        <React.Fragment key={position}>
          {groupIdx > 0 && <div style={{ height: '6px' }} />}
          
          {players.map((player, idx) => {
            const isExpanded = expandedPlayer === player.name;
            const isLastInGroup = idx === players.length - 1;
            return (
              <div
                key={player.name}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '3px',
                  marginBottom: isLastInGroup ? '0px' : '2px',
                  overflow: 'hidden',
                }}
              >
                {/* Player Row */}
                <div
                  onClick={() => togglePlayer(player.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <PositionBadge position={player.position} />
                    <span style={{ color: '#fff', fontSize: '12px', fontWeight: 500 }}>
                      {player.name}
                    </span>
                    <span style={{ color: '#6B7280', fontSize: '10px' }}>
                      {player.team}
                    </span>
                  </div>
                </div>
                
                {/* Expanded Stats - Universal PlayerExpandedCard (no draft button for team view) */}
                {isExpanded && (
                  <div 
                    ref={expandedRef} 
                    style={{ 
                      padding: '2px 4px 4px',
                    }}
                  >
                    <PlayerExpandedCardNoDraft
                      player={{
                        name: player.name,
                        team: player.team,
                        position: player.position,
                        adp: player.adp,
                        projectedPoints: player.projectedPoints,
                      }}
                      onClose={() => setExpandedPlayer(null)}
                      hideOuterGradient={false}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN SANDBOX PAGE
// ============================================================================
export default function TeamDisplaySandbox() {
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  
  const handleShare = () => {
    setShowShareModal(true);
  };
  
  const handleNativeShare = async () => {
    const shareData = {
      title: MOCK_TEAM.name,
      text: `Check out my team: ${MOCK_TEAM.name}`,
      url: window.location.href,
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShowShareModal(false);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  };
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowShareModal(false);
      }, 1000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div style={{ 
      backgroundColor: '#0a0f1a', 
      minHeight: '100vh',
      padding: '20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingTop: '40px',
    }}>
      {/* iPhone Frame */}
      <div style={{ 
        width: '280px',
        height: '580px',
        backgroundColor: '#000',
        borderRadius: '36px',
        padding: '8px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}>
        {/* Screen */}
        <div style={{
          backgroundColor: '#101927',
          borderRadius: '28px',
          overflow: 'hidden',
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Dynamic Island */}
          <div style={{
            position: 'absolute',
            top: '6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '70px',
            height: '20px',
            backgroundColor: '#000',
            borderRadius: '12px',
            zIndex: 10,
          }} />
          
          {/* Combined Status Bar + App Header */}
          <div style={{
            padding: '6px 12px 2px 12px',
            backgroundImage: 'url(/wr_blue.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            flexShrink: 0,
          }}>
            {/* Status indicators row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px',
              fontWeight: 600,
              color: '#fff',
              marginBottom: '4px',
            }}>
              <span>9:41</span>
              <div style={{ width: '70px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <svg width="14" height="10" viewBox="0 0 16 12" fill="#fff">
                  <path d="M1 4h2v8H1V4zm4-2h2v10H5V2zm4-2h2v12H9V0zm4 4h2v8h-2V4z"/>
                </svg>
                <div style={{
                  width: '18px',
                  height: '9px',
                  border: '1px solid #fff',
                  borderRadius: '2px',
                  padding: '1px',
                }}>
                  <div style={{ width: '80%', height: '100%', backgroundColor: '#fff', borderRadius: '1px' }} />
                </div>
              </div>
            </div>
            
            {/* Logo row with back button and share */}
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}>
              <button style={{ 
                background: 'none',
                border: 'none',
                color: '#fff', 
                position: 'absolute',
                left: '0',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <img 
                src="/logo.png" 
                alt="TopDog" 
                style={{ height: '32px', objectFit: 'contain' }}
              />
              <button 
                onClick={handleShare}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  position: 'absolute',
                  right: '0',
                }}
                title="Share team"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Content - Scrollable (hidden scrollbar) */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            backgroundColor: '#101927',
          }} className="hide-scrollbar">
            {/* Team name bar - scrolls with content */}
            <div style={{
              backgroundColor: '#101927',
              padding: '10px 12px 6px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '6px',
            }}>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Edit team name"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <span style={{ color: '#fff', fontSize: '12px', fontWeight: 500, paddingTop: 2 }}>
                {MOCK_TEAM.name}
              </span>
            </div>
            <DesignC team={MOCK_TEAM} />
          </div>
          <style jsx>{`
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          {/* Home Indicator */}
          <div style={{
            padding: '6px 0 4px 0',
            display: 'flex',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <div style={{
              width: '100px',
              height: '4px',
              backgroundColor: '#fff',
              borderRadius: '2px',
              opacity: 0.3,
            }} />
          </div>
          
          {/* iOS Share Sheet Modal */}
          {showShareModal && (
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'flex-end',
                zIndex: 100,
              }}
              onClick={() => setShowShareModal(false)}
            >
              <div 
                style={{
                  width: '100%',
                  backgroundColor: '#1C1C1E',
                  borderTopLeftRadius: 10,
                  borderTopRightRadius: 10,
                  overflow: 'hidden',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with preview */}
                <div style={{ 
                  backgroundColor: '#2C2C2E',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  {/* Site favicon/icon */}
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: '#3A3A3C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <img src="/logo.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                  </div>
                  {/* Title and URL */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: 15, 
                      fontWeight: 500, 
                      color: '#fff', 
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {MOCK_TEAM.name}
                    </div>
                    <div style={{ 
                      fontSize: 12, 
                      color: '#8E8E93',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      topdog.dog
                    </div>
                  </div>
                </div>
                
                {/* App icons row */}
                <div style={{ 
                  padding: '16px 12px',
                  display: 'flex',
                  gap: 8,
                  overflowX: 'auto',
                  borderBottom: '0.5px solid rgba(84,84,88,0.65)',
                }}>
                  {/* AirDrop */}
                  <button onClick={handleNativeShare} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 0, minWidth: 60 }}>
                    <div style={{ width: 50, height: 50, borderRadius: 25, background: 'linear-gradient(180deg, #5AC8FA 0%, #007AFF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                    </div>
                    <span style={{ fontSize: 10, color: '#fff', textAlign: 'center' }}>AirDrop</span>
                  </button>
                  
                  {/* Messages */}
                  <button onClick={handleNativeShare} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 0, minWidth: 60 }}>
                    <div style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#34C759', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                    </div>
                    <span style={{ fontSize: 10, color: '#fff', textAlign: 'center' }}>Messages</span>
                  </button>
                  
                  {/* Mail */}
                  <button onClick={handleNativeShare} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 0, minWidth: 60 }}>
                    <div style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#007AFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                    </div>
                    <span style={{ fontSize: 10, color: '#fff', textAlign: 'center' }}>Mail</span>
                  </button>
                  
                  {/* Notes */}
                  <button onClick={handleNativeShare} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 0, minWidth: 60 }}>
                    <div style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFCC00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#000"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                    </div>
                    <span style={{ fontSize: 10, color: '#fff', textAlign: 'center' }}>Notes</span>
                  </button>
                </div>
                
                {/* Action list */}
                <div style={{ backgroundColor: '#2C2C2E', margin: '8px', borderRadius: 10, overflow: 'hidden' }}>
                  {/* Copy */}
                  <button
                    onClick={handleCopy}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: '0.5px solid rgba(84,84,88,0.65)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div style={{
                      width: 29,
                      height: 29,
                      borderRadius: 6,
                      backgroundColor: copied ? '#34C759' : '#636366',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {copied ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                      )}
                    </div>
                    <span style={{ fontSize: 17, color: '#fff' }}>
                      {copied ? 'Copied!' : 'Copy'}
                    </span>
                  </button>
                  
                  {/* Add to Reading List */}
                  <button
                    onClick={() => setShowShareModal(false)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div style={{
                      width: 29,
                      height: 29,
                      borderRadius: 6,
                      backgroundColor: '#636366',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: 17, color: '#fff' }}>Add to Reading List</span>
                  </button>
                </div>
                
                {/* Cancel section */}
                <div style={{ padding: '0 8px 12px' }}>
                  <button
                    onClick={() => setShowShareModal(false)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#2C2C2E',
                      border: 'none',
                      borderRadius: 10,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 17, fontWeight: 600, color: '#007AFF' }}>Cancel</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}

