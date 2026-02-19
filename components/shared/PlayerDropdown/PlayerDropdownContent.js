/**
 * PlayerDropdownContent - Expanded Dropdown Content
 * 
 * This component ONLY handles the expanded dropdown area (purple/gold gradient).
 * It's positioned absolutely below the existing player row without modifying it.
 */

import Image from 'next/image';
import React from 'react';

import { createTeamGradient } from '../../../lib/gradientUtils';

import { DROPDOWN_STYLES, DROPDOWN_DIMENSIONS } from './PlayerDropdownStyles';

export default function PlayerDropdownContent({
  player,
  context = 'DRAFT_ROOM',
  contextConfig = {},
  showStats = true,
  isMyTurn = false,
  onDraft = () => {},
  onQueue = () => {},
  customStyles = {},
  className = ''
}) {

  const handleDraft = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDraft(e);
  };

  const handleQueue = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onQueue(e);
  };


  // Calculate dynamic height based on available stats
  const calculateHeight = () => {
    const baseHeight = DROPDOWN_DIMENSIONS.EXPANDED_BASE_HEIGHT;
    const headerHeight = DROPDOWN_DIMENSIONS.STATS_HEADER_HEIGHT;
    const rowHeight = DROPDOWN_DIMENSIONS.STATS_ROW_HEIGHT;
    const bottomPadding = 16;

    // Mock calculation - in real implementation, count actual stat years
    let availableYears = 1; // Default: projection only
    
    if (player.stats) {
      availableYears = Object.keys(player.stats).length;
    }

    const totalRows = availableYears;
    return baseHeight + headerHeight + (totalRows * rowHeight) + bottomPadding;
  };

  // Get bye week for player's team
  const getByeWeek = (team) => {
    const byeWeeks = {
      'ARI': 11, 'ATL': 12, 'BAL': 14, 'BUF': 12, 'CAR': 11, 'CHI': 7,
      'CIN': 12, 'CLE': 10, 'DAL': 7, 'DEN': 14, 'DET': 5, 'GB': 10,
      'HOU': 14, 'IND': 14, 'JAX': 12, 'KC': 6, 'LV': 10, 'LAC': 5,
      'LAR': 6, 'MIA': 6, 'MIN': 6, 'NE': 14, 'NO': 12, 'NYG': 11,
      'NYJ': 12, 'PHI': 5, 'PIT': 9, 'SF': 9, 'SEA': 10, 'TB': 11,
      'TEN': 5, 'WAS': 14
    };
    return byeWeeks[team] || 'N/A';
  };

  // Sort stats entries to show: projection, 2023, 2022 (newest to oldest)
  const getSortedStatsEntries = (stats) => {
    if (!stats) return [];
    
    const entries = Object.entries(stats);
    
    // Custom sort order: projection first, then years in descending order
    return entries.sort(([yearA], [yearB]) => {
      // Projection always comes first
      if (yearA === 'projection') return -1;
      if (yearB === 'projection') return 1;
      
      // Then sort years in descending order (2023, 2022, 2021, etc.)
      const numA = parseInt(yearA);
      const numB = parseInt(yearB);
      
      // If both are valid years, sort descending
      if (!isNaN(numA) && !isNaN(numB)) {
        return numB - numA;
      }
      
      // Fallback to alphabetical
      return yearA.localeCompare(yearB);
    });
  };

  return (
    <div
      className={`${DROPDOWN_STYLES.DROPDOWN_CONTENT.className} ${className}`}
      style={{
        ...DROPDOWN_STYLES.DROPDOWN_CONTENT.getStyle(player),
        height: `${calculateHeight()}px`,
        ...customStyles
      }}
      onClick={(e) => e.stopPropagation()} // Prevent row click when clicking inside dropdown
    >
      {/* NFL Team Logo - Top Left */}
      <div className="flex justify-between items-center pl-3 pr-3" style={{ paddingTop: '6px', paddingBottom: '4px' }}>
        <Image
          src={`/logos/nfl/${player.team?.toLowerCase()}.png`}
          alt={`${player.team} logo`}
          width={55}
          height={55}
          style={{
            flexShrink: 0,
            display: 'block'
          }}
          onError={(e) => {
            // Hide broken image gracefully
            e.target.style.display = 'none';
          }}
        />
        
        {/* Player Info Headers - Between Logo and Button */}
        <div className="flex-1 px-3">
          <div className="text-xs text-gray-400 flex justify-center items-center gap-4">
            <div className="text-center" style={{ minWidth: '35px' }}>
              <div style={{ fontSize: '12px' }}>Bye</div>
              <div className="text-white font-medium" style={{ fontSize: '14px' }}>
                {getByeWeek(player.team)}
              </div>
            </div>
            <div className="text-center" style={{ minWidth: '45px' }}>
              <div style={{ fontSize: '12px' }}>ADP</div>
              <div className="text-white font-medium" style={{ fontSize: '14px' }}>
                {parseFloat(player.adp || 0).toFixed(1)}
              </div>
            </div>
            <div className="text-center" style={{ minWidth: '40px' }}>
              <div style={{ fontSize: '12px' }}>Proj</div>
              <div className="text-white font-medium" style={{ fontSize: '14px' }}>
                {parseFloat(player.projectedPoints || 0).toFixed(1) || 'N/A'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons - Top Right (no trades allowed) */}
        <div className="flex gap-2">
          {contextConfig.showDraftButton && (
            <button
              onClick={handleDraft}
              className="py-2 rounded text-xs font-bold"
              style={{ 
                backgroundColor: isMyTurn ? '#ef4444' : '#6B7280',
                color: '#000000',
                opacity: isMyTurn ? 1 : 0.7,
                paddingLeft: '17px',
                paddingRight: '17px',
                zIndex: 10
              }}
            >
              DRAFT
            </button>
          )}
          
          {contextConfig.showQueueButton && (
            <button
              onClick={handleQueue}
              className={DROPDOWN_STYLES.QUEUE_BUTTON.className}
              style={DROPDOWN_STYLES.QUEUE_BUTTON.style}
            >
              QUEUE
            </button>
          )}
          
          {/* Trade button removed globally */}
        </div>
      </div>

      {/* Stats Table */}
      {showStats && (
        <div className="pt-0 pb-1" style={{ paddingTop: '0px', paddingBottom: '0px', marginTop: '0px' }}>
          <style jsx>{`
            .stats-scroll-container::-webkit-scrollbar {
              display: none !important;
              width: 0px !important;
              height: 0px !important;
            }
            .stats-scroll-container::-webkit-scrollbar-track {
              display: none !important;
              background: transparent !important;
            }
            .stats-scroll-container::-webkit-scrollbar-thumb {
              display: none !important;
              background-color: transparent !important;
            }
          `}</style>
          {player.position === 'QB' ? (
            // QB Layout: YEAR CMP ATT YDS CMP% AVG TD INT LNG SACK CAR YDS AVG TD LNG FUM
            <div className="rounded text-xs overflow-x-auto hide-scrollbar" >
              <div style={{ minWidth: '900px' }}>
                {/* Column Headers */}
                <div className={DROPDOWN_STYLES.STATS_HEADER.className} style={DROPDOWN_STYLES.STATS_HEADER.style}>
                  <div style={{ position: 'absolute', bottom: '0px', left: '0px', right: '0px', height: '1px', background: '#4b5563' }}></div>
                  <div className="absolute text-left" style={{ left: '6px', width: '40px' }}>YEAR</div>
                  <div className="absolute text-center" style={{ left: '50px', width: '30px' }}>CMP</div>
                  <div className="absolute text-center" style={{ left: '84px', width: '30px' }}>ATT</div>
                  <div className="absolute text-center" style={{ left: '118px', width: '35px' }}>YDS</div>
                  <div className="absolute text-center" style={{ left: '157px', width: '35px' }}>CMP%</div>
                  <div className="absolute text-center" style={{ left: '196px', width: '30px' }}>AVG</div>
                  <div className="absolute text-center" style={{ left: '230px', width: '25px' }}>TD</div>
                  <div className="absolute text-center" style={{ left: '259px', width: '30px' }}>INT</div>
                  <div className="absolute text-center" style={{ left: '293px', width: '30px' }}>LNG</div>
                  <div className="absolute text-center" style={{ left: '327px', width: '35px' }}>SACK</div>
                  <div className="absolute text-center" style={{ left: '366px', width: '30px' }}>CAR</div>
                  <div className="absolute text-center" style={{ left: '400px', width: '35px' }}>YDS</div>
                  <div className="absolute text-center" style={{ left: '439px', width: '30px' }}>AVG</div>
                  <div className="absolute text-center" style={{ left: '473px', width: '25px' }}>TD</div>
                  <div className="absolute text-center" style={{ left: '502px', width: '30px' }}>LNG</div>
                  <div className="absolute text-center" style={{ left: '536px', width: '30px' }}>FUM</div>
                </div>

                {/* Stats Rows */}
                {getSortedStatsEntries(player.stats).map(([year, stats], index) => (
                  <div key={year} className={DROPDOWN_STYLES.STATS_ROW.className} style={DROPDOWN_STYLES.STATS_ROW.style}>
                    <div className="absolute text-left" style={{ left: '6px', width: '40px' }}>{year}</div>
                    <div className="absolute text-center" style={{ left: '50px', width: '30px' }}>{stats.completions || '-'}</div>
                    <div className="absolute text-center" style={{ left: '84px', width: '30px' }}>{stats.attempts || '-'}</div>
                    <div className="absolute text-center" style={{ left: '118px', width: '35px' }}>{stats.passingYards || '-'}</div>
                    <div className="absolute text-center" style={{ left: '157px', width: '35px' }}>{stats.completionPct || '-'}</div>
                    <div className="absolute text-center" style={{ left: '196px', width: '30px' }}>{stats.passingAvg || '-'}</div>
                    <div className="absolute text-center" style={{ left: '230px', width: '25px' }}>{stats.passingTDs || '-'}</div>
                    <div className="absolute text-center" style={{ left: '259px', width: '30px' }}>{stats.interceptions || '-'}</div>
                    <div className="absolute text-center" style={{ left: '293px', width: '30px' }}>{stats.passingLng || '-'}</div>
                    <div className="absolute text-center" style={{ left: '327px', width: '35px' }}>{stats.sacks || '-'}</div>
                    <div className="absolute text-center" style={{ left: '366px', width: '30px' }}>{stats.rushingAttempts || '-'}</div>
                    <div className="absolute text-center" style={{ left: '400px', width: '35px' }}>{stats.rushingYards || '-'}</div>
                    <div className="absolute text-center" style={{ left: '439px', width: '30px' }}>{stats.rushingAvg || '-'}</div>
                    <div className="absolute text-center" style={{ left: '473px', width: '25px' }}>{stats.rushingTDs || '-'}</div>
                    <div className="absolute text-center" style={{ left: '502px', width: '30px' }}>{stats.rushingLng || '-'}</div>
                    <div className="absolute text-center" style={{ left: '536px', width: '30px' }}>{stats.fumbles || '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : player.position === 'RB' ? (
            // RB Layout: YEAR CAR YDS AVG TD LNG FUM REC TGTS YDS AVG TD LNG FD
            <div className="rounded text-xs overflow-x-auto hide-scrollbar" >
              <div style={{ minWidth: '850px' }}>
                {/* Column Headers */}
                <div className={DROPDOWN_STYLES.STATS_HEADER.className} style={DROPDOWN_STYLES.STATS_HEADER.style}>
                  <div style={{ position: 'absolute', bottom: '0px', left: '0px', right: '0px', height: '1px', background: '#4b5563' }}></div>
                  <div className="absolute text-left" style={{ left: '6px', width: '40px' }}>YEAR</div>
                  <div className="absolute text-center" style={{ left: '50px', width: '30px' }}>CAR</div>
                  <div className="absolute text-center" style={{ left: '84px', width: '35px' }}>YDS</div>
                  <div className="absolute text-center" style={{ left: '123px', width: '30px' }}>AVG</div>
                  <div className="absolute text-center" style={{ left: '157px', width: '25px' }}>TD</div>
                  <div className="absolute text-center" style={{ left: '186px', width: '30px' }}>LNG</div>
                  <div className="absolute text-center" style={{ left: '220px', width: '30px' }}>FUM</div>
                  <div className="absolute text-center" style={{ left: '254px', width: '30px' }}>REC</div>
                  <div className="absolute text-center" style={{ left: '288px', width: '35px' }}>TGTS</div>
                  <div className="absolute text-center" style={{ left: '327px', width: '35px' }}>YDS</div>
                  <div className="absolute text-center" style={{ left: '366px', width: '30px' }}>AVG</div>
                  <div className="absolute text-center" style={{ left: '400px', width: '25px' }}>TD</div>
                  <div className="absolute text-center" style={{ left: '429px', width: '30px' }}>LNG</div>
                  <div className="absolute text-center" style={{ left: '463px', width: '25px' }}>FD</div>
                </div>

                {/* Stats Rows */}
                {getSortedStatsEntries(player.stats).map(([year, stats]) => (
                  <div key={year} className={DROPDOWN_STYLES.STATS_ROW.className} style={DROPDOWN_STYLES.STATS_ROW.style}>
                    <div className="absolute text-left" style={{ left: '6px', width: '40px' }}>{year}</div>
                    <div className="absolute text-center" style={{ left: '50px', width: '30px' }}>{stats.rushingAttempts || '-'}</div>
                    <div className="absolute text-center" style={{ left: '84px', width: '35px' }}>{stats.rushingYards || '-'}</div>
                    <div className="absolute text-center" style={{ left: '123px', width: '30px' }}>{stats.rushingAvg || '-'}</div>
                    <div className="absolute text-center" style={{ left: '157px', width: '25px' }}>{stats.rushingTDs || '-'}</div>
                    <div className="absolute text-center" style={{ left: '186px', width: '30px' }}>{stats.rushingLng || '-'}</div>
                    <div className="absolute text-center" style={{ left: '220px', width: '30px' }}>{stats.fumbles || '-'}</div>
                    <div className="absolute text-center" style={{ left: '254px', width: '30px' }}>{stats.receptions || '-'}</div>
                    <div className="absolute text-center" style={{ left: '288px', width: '35px' }}>{stats.targets || '-'}</div>
                    <div className="absolute text-center" style={{ left: '327px', width: '35px' }}>{stats.receivingYards || '-'}</div>
                    <div className="absolute text-center" style={{ left: '366px', width: '30px' }}>{stats.receivingAvg || '-'}</div>
                    <div className="absolute text-center" style={{ left: '400px', width: '25px' }}>{stats.receivingTDs || '-'}</div>
                    <div className="absolute text-center" style={{ left: '429px', width: '30px' }}>{stats.receivingLng || '-'}</div>
                    <div className="absolute text-center" style={{ left: '463px', width: '25px' }}>{stats.firstDowns || '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // WR/TE Layout: YEAR REC TGTS YDS AVG TD LNG FD CAR YDS AVG TD LNG FUM
            <div className="rounded text-xs overflow-x-auto hide-scrollbar" >
              <div style={{ minWidth: '850px' }}>
                {/* Column Headers */}
                <div className={DROPDOWN_STYLES.STATS_HEADER.className} style={DROPDOWN_STYLES.STATS_HEADER.style}>
                  <div style={{ position: 'absolute', bottom: '0px', left: '0px', right: '0px', height: '1px', background: '#4b5563' }}></div>
                  <div className="absolute text-left" style={{ left: '6px', width: '40px' }}>YEAR</div>
                  <div className="absolute text-center" style={{ left: '50px', width: '30px' }}>REC</div>
                  <div className="absolute text-center" style={{ left: '84px', width: '35px' }}>TGTS</div>
                  <div className="absolute text-center" style={{ left: '123px', width: '35px' }}>YDS</div>
                  <div className="absolute text-center" style={{ left: '162px', width: '30px' }}>AVG</div>
                  <div className="absolute text-center" style={{ left: '196px', width: '25px' }}>TD</div>
                  <div className="absolute text-center" style={{ left: '225px', width: '30px' }}>LNG</div>
                  <div className="absolute text-center" style={{ left: '259px', width: '25px' }}>FD</div>
                  <div className="absolute text-center" style={{ left: '288px', width: '30px' }}>CAR</div>
                  <div className="absolute text-center" style={{ left: '322px', width: '35px' }}>YDS</div>
                  <div className="absolute text-center" style={{ left: '361px', width: '30px' }}>AVG</div>
                  <div className="absolute text-center" style={{ left: '395px', width: '25px' }}>TD</div>
                  <div className="absolute text-center" style={{ left: '424px', width: '30px' }}>LNG</div>
                  <div className="absolute text-center" style={{ left: '458px', width: '30px' }}>FUM</div>
                </div>

                {/* Stats Rows */}
                {getSortedStatsEntries(player.stats).map(([year, stats]) => (
                  <div key={year} className={DROPDOWN_STYLES.STATS_ROW.className} style={DROPDOWN_STYLES.STATS_ROW.style}>
                    <div className="absolute text-left" style={{ left: '6px', width: '40px' }}>{year}</div>
                    <div className="absolute text-center" style={{ left: '50px', width: '30px' }}>{stats.receptions || '-'}</div>
                    <div className="absolute text-center" style={{ left: '84px', width: '35px' }}>{stats.targets || '-'}</div>
                    <div className="absolute text-center" style={{ left: '123px', width: '35px' }}>{stats.receivingYards || '-'}</div>
                    <div className="absolute text-center" style={{ left: '162px', width: '30px' }}>{stats.receivingAvg || '-'}</div>
                    <div className="absolute text-center" style={{ left: '196px', width: '25px' }}>{stats.receivingTDs || '-'}</div>
                    <div className="absolute text-center" style={{ left: '225px', width: '30px' }}>{stats.receivingLng || '-'}</div>
                    <div className="absolute text-center" style={{ left: '259px', width: '25px' }}>{stats.firstDowns || '-'}</div>
                    <div className="absolute text-center" style={{ left: '288px', width: '30px' }}>{stats.rushingAttempts || '-'}</div>
                    <div className="absolute text-center" style={{ left: '322px', width: '35px' }}>{stats.rushingYards || '-'}</div>
                    <div className="absolute text-center" style={{ left: '361px', width: '30px' }}>{stats.rushingAvg || '-'}</div>
                    <div className="absolute text-center" style={{ left: '395px', width: '25px' }}>{stats.rushingTDs || '-'}</div>
                    <div className="absolute text-center" style={{ left: '424px', width: '30px' }}>{stats.rushingLng || '-'}</div>
                    <div className="absolute text-center" style={{ left: '458px', width: '30px' }}>{stats.fumbles || '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
