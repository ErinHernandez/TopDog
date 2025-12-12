/**
 * ExposureTabVX - Exposure Report Tab (TypeScript)
 * 
 * Pixel-perfect match to: components/mobile/ExposureReportMobile.js
 * 
 * Shows player exposure across user's teams
 */

import React, { useState } from 'react';
import { POSITION_COLORS } from '../../../constants/colors';

// ============================================================================
// PIXEL-PERFECT CONSTANTS (matching ExposureReportMobile.js)
// ============================================================================

const EXPOSURE_PX = {
  // Header Section
  headerPaddingX: 16,
  headerPaddingTop: 8,
  headerPaddingBottom: 16,
  
  // Search Input
  searchPaddingX: 12,
  searchPaddingY: 8,
  searchFontSize: 14,
  searchBorderRadius: 6,
  
  // Position Filter Grid
  filterGap: 8,
  filterButtonPaddingX: 12,
  filterButtonPaddingY: 8,
  filterButtonFontSize: 14,
  filterButtonBorderRadius: 6,
  filterButtonBorderWidth: 2,
  filterMarginTop: 16,
  
  // Sort Header
  sortHeaderPaddingX: 8,
  sortHeaderPaddingY: 4,
  sortArrowSize: 18,
  
  // Player Row
  rowMinHeight: 32,
  rowPaddingX: 8,
  rowPaddingY: 4,
  rowLastPaddingBottom: 16,
  
  // Player Photo
  photoSize: 36,
  photoMarginLeft: 8,
  photoMarginRight: 10,
  
  // Player Info
  playerInfoMarginLeft: 2,
  playerNameFontSize: 14,
  playerNameMaxWidth: 200,
  
  // Position Badge (inline)
  badgeWidth: 25,
  badgeHeight: 16,
  badgeMarginRight: 6,
  badgeFontSize: 10,
  
  // Team Info
  teamInfoFontSize: 12,
  teamInfoMarginTop: 4,
  
  // Exposure Stats
  exposureMinWidth: 80,
  exposureMarginRight: 10,
  exposureFontSize: 14,
  exposureValueWidth: 40,
} as const;

const EXPOSURE_COLORS = {
  background: '#101927',
  headerBorder: '#374151',
  rowBorder: '#374151',
  searchBg: '#1f2937',
  searchBorder: '#4b5563',
  searchText: '#ffffff',
  searchPlaceholder: '#9ca3af',
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  buttonHoverBg: 'rgba(31, 41, 55, 0.5)',
  // Position colors
  QB: '#F472B6',
  RB: '#0fba80',
  WR: '#FBBF25',
  TE: '#7C3AED',
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface ExposureTabVXProps {
  // Currently no props needed
}

type PositionFilter = 'ALL' | 'QB' | 'RB' | 'WR' | 'TE';

interface ExposurePlayer {
  id: string;
  name: string;
  position: 'QB' | 'RB' | 'WR' | 'TE';
  team: string;
  exposure: number; // percentage
  teams: number;
  adp: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

// Realistic exposure data based on 150 drafts (18 rounds each = 2,700 picks)
const MOCK_EXPOSURE: ExposurePlayer[] = [
  // High exposure - early round targets (40%+)
  { id: '1', name: "Ja'Marr Chase", position: 'WR', team: 'CIN', exposure: 52.0, teams: 78, adp: 2.1 },
  { id: '2', name: 'CeeDee Lamb', position: 'WR', team: 'DAL', exposure: 47.3, teams: 71, adp: 3.4 },
  { id: '3', name: 'Amon-Ra St. Brown', position: 'WR', team: 'DET', exposure: 44.7, teams: 67, adp: 4.8 },
  
  // Strong exposure - core targets (30-40%)
  { id: '4', name: 'Bijan Robinson', position: 'RB', team: 'ATL', exposure: 38.7, teams: 58, adp: 1.8 },
  { id: '5', name: 'Breece Hall', position: 'RB', team: 'NYJ', exposure: 36.0, teams: 54, adp: 6.2 },
  { id: '6', name: 'Garrett Wilson', position: 'WR', team: 'NYJ', exposure: 34.7, teams: 52, adp: 11.3 },
  { id: '7', name: 'Tyreek Hill', position: 'WR', team: 'MIA', exposure: 33.3, teams: 50, adp: 8.7 },
  { id: '8', name: 'Puka Nacua', position: 'WR', team: 'LAR', exposure: 31.3, teams: 47, adp: 9.4 },
  
  // Moderate exposure - regular picks (20-30%)
  { id: '9', name: 'Travis Kelce', position: 'TE', team: 'KC', exposure: 28.7, teams: 43, adp: 18.5 },
  { id: '10', name: 'Josh Allen', position: 'QB', team: 'BUF', exposure: 27.3, teams: 41, adp: 24.1 },
  { id: '11', name: 'Saquon Barkley', position: 'RB', team: 'PHI', exposure: 26.0, teams: 39, adp: 5.2 },
  { id: '12', name: 'Davante Adams', position: 'WR', team: 'NYJ', exposure: 24.7, teams: 37, adp: 16.8 },
  { id: '13', name: 'Chris Olave', position: 'WR', team: 'NO', exposure: 23.3, teams: 35, adp: 22.4 },
  { id: '14', name: 'Jahmyr Gibbs', position: 'RB', team: 'DET', exposure: 22.0, teams: 33, adp: 7.1 },
  { id: '15', name: 'Sam LaPorta', position: 'TE', team: 'DET', exposure: 21.3, teams: 32, adp: 38.6 },
  
  // Mid exposure - value picks (15-20%)
  { id: '16', name: 'Jalen Hurts', position: 'QB', team: 'PHI', exposure: 19.3, teams: 29, adp: 31.2 },
  { id: '17', name: 'DeVonta Smith', position: 'WR', team: 'PHI', exposure: 18.7, teams: 28, adp: 28.9 },
  { id: '18', name: 'Jonathan Taylor', position: 'RB', team: 'IND', exposure: 18.0, teams: 27, adp: 12.4 },
  { id: '19', name: 'Drake London', position: 'WR', team: 'ATL', exposure: 17.3, teams: 26, adp: 35.7 },
  { id: '20', name: 'Mark Andrews', position: 'TE', team: 'BAL', exposure: 16.7, teams: 25, adp: 42.3 },
  { id: '21', name: 'Lamar Jackson', position: 'QB', team: 'BAL', exposure: 16.0, teams: 24, adp: 45.8 },
  { id: '22', name: 'Kyren Williams', position: 'RB', team: 'LAR', exposure: 15.3, teams: 23, adp: 14.6 },
  
  // Lower exposure - late round value (10-15%)
  { id: '23', name: 'George Pickens', position: 'WR', team: 'PIT', exposure: 14.7, teams: 22, adp: 33.1 },
  { id: '24', name: 'Patrick Mahomes', position: 'QB', team: 'KC', exposure: 14.0, teams: 21, adp: 52.4 },
  { id: '25', name: 'Dalton Kincaid', position: 'TE', team: 'BUF', exposure: 13.3, teams: 20, adp: 58.7 },
  { id: '26', name: 'De\'Von Achane', position: 'RB', team: 'MIA', exposure: 12.7, teams: 19, adp: 19.3 },
  { id: '27', name: 'Rashee Rice', position: 'WR', team: 'KC', exposure: 12.0, teams: 18, adp: 41.2 },
  { id: '28', name: 'Travis Etienne', position: 'RB', team: 'JAX', exposure: 11.3, teams: 17, adp: 21.8 },
  { id: '29', name: 'Zay Flowers', position: 'WR', team: 'BAL', exposure: 10.7, teams: 16, adp: 47.5 },
  { id: '30', name: 'Anthony Richardson', position: 'QB', team: 'IND', exposure: 10.0, teams: 15, adp: 68.3 },
  
  // Dart throws - late round fliers (5-10%)
  { id: '31', name: 'Trey McBride', position: 'TE', team: 'ARI', exposure: 9.3, teams: 14, adp: 72.1 },
  { id: '32', name: 'Jordan Addison', position: 'WR', team: 'MIN', exposure: 8.7, teams: 13, adp: 54.6 },
  { id: '33', name: 'Jaylen Waddle', position: 'WR', team: 'MIA', exposure: 8.0, teams: 12, adp: 26.4 },
  { id: '34', name: 'Isiah Pacheco', position: 'RB', team: 'KC', exposure: 7.3, teams: 11, adp: 36.9 },
  { id: '35', name: 'C.J. Stroud', position: 'QB', team: 'HOU', exposure: 6.7, teams: 10, adp: 78.2 },
  { id: '36', name: 'Tee Higgins', position: 'WR', team: 'CIN', exposure: 6.0, teams: 9, adp: 25.1 },
  { id: '37', name: 'David Njoku', position: 'TE', team: 'CLE', exposure: 5.3, teams: 8, adp: 94.6 },
  { id: '38', name: 'Marvin Harrison Jr.', position: 'WR', team: 'ARI', exposure: 4.7, teams: 7, adp: 15.2 },
  { id: '39', name: 'Rachaad White', position: 'RB', team: 'TB', exposure: 4.0, teams: 6, adp: 62.8 },
  { id: '40', name: 'Caleb Williams', position: 'QB', team: 'CHI', exposure: 3.3, teams: 5, adp: 112.4 },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ExposureTabVX(_props: ExposureTabVXProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPositions, setSelectedPositions] = useState<PositionFilter[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Filter players
  const filteredPlayers = MOCK_EXPOSURE.filter(player => {
    // Position filter
    if (selectedPositions.length > 0 && !selectedPositions.includes(player.position)) {
      return false;
    }
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        player.name.toLowerCase().includes(query) ||
        player.position.toLowerCase().includes(query) ||
        player.team.toLowerCase().includes(query)
      );
    }
    return true;
  }).sort((a, b) => {
    return sortOrder === 'desc' 
      ? b.exposure - a.exposure 
      : a.exposure - b.exposure;
  });

  const handlePositionClick = (position: PositionFilter) => {
    setSelectedPositions(prev => {
      if (prev.includes(position)) {
        return prev.filter(p => p !== position);
      }
      const newPositions = [...prev, position];
      // Auto-clear if all 4 selected
      if (newPositions.length === 4) {
        setTimeout(() => setSelectedPositions([]), 3500);
      }
      return newPositions;
    });
  };

  const getPositionColor = (position: string): string => {
    return EXPOSURE_COLORS[position as keyof typeof EXPOSURE_COLORS] as string || '#6B7280';
  };

  return (
    <div 
      className="h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: EXPOSURE_COLORS.background }}
    >
      {/* Header Section */}
      <div
        className="flex-shrink-0"
        style={{
          paddingLeft: `${EXPOSURE_PX.headerPaddingX}px`,
          paddingRight: `${EXPOSURE_PX.headerPaddingX}px`,
          paddingTop: `${EXPOSURE_PX.headerPaddingTop}px`,
          paddingBottom: `${EXPOSURE_PX.headerPaddingBottom}px`,
          borderBottom: `1px solid ${EXPOSURE_COLORS.headerBorder}`,
        }}
      >
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            paddingLeft: `${EXPOSURE_PX.searchPaddingX}px`,
            paddingRight: `${EXPOSURE_PX.searchPaddingX}px`,
            paddingTop: `${EXPOSURE_PX.searchPaddingY}px`,
            paddingBottom: `${EXPOSURE_PX.searchPaddingY}px`,
            backgroundColor: EXPOSURE_COLORS.searchBg,
            border: `1px solid ${EXPOSURE_COLORS.searchBorder}`,
            borderRadius: `${EXPOSURE_PX.searchBorderRadius}px`,
            color: EXPOSURE_COLORS.searchText,
            fontSize: `${EXPOSURE_PX.searchFontSize}px`,
            outline: 'none',
          }}
        />

        {/* Position Filter Grid - Hidden when search is active */}
        {!searchQuery && (
          <div
            className="grid grid-cols-4"
            style={{
              gap: `${EXPOSURE_PX.filterGap}px`,
              marginTop: `${EXPOSURE_PX.filterMarginTop}px`,
            }}
          >
            {(['QB', 'RB', 'WR', 'TE'] as const).map(position => {
              const isSelected = selectedPositions.includes(position);
              const posColor = getPositionColor(position);
              return (
                <button
                  key={position}
                  onClick={() => handlePositionClick(position)}
                  className="font-medium transition-colors"
                  style={{
                    paddingLeft: `${EXPOSURE_PX.filterButtonPaddingX}px`,
                    paddingRight: `${EXPOSURE_PX.filterButtonPaddingX}px`,
                    paddingTop: `${EXPOSURE_PX.filterButtonPaddingY}px`,
                    paddingBottom: `${EXPOSURE_PX.filterButtonPaddingY}px`,
                    borderRadius: `${EXPOSURE_PX.filterButtonBorderRadius}px`,
                    border: `${EXPOSURE_PX.filterButtonBorderWidth}px solid ${posColor}`,
                    backgroundColor: isSelected ? posColor : 'transparent',
                    color: isSelected ? EXPOSURE_COLORS.textPrimary : EXPOSURE_COLORS.textSecondary,
                    fontSize: `${EXPOSURE_PX.filterButtonFontSize}px`,
                  }}
                >
                  {position}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sort Header */}
      <div
        className="flex-shrink-0 flex items-center justify-between"
        style={{
          paddingLeft: `${EXPOSURE_PX.sortHeaderPaddingX}px`,
          paddingRight: `${EXPOSURE_PX.sortHeaderPaddingX}px`,
          paddingTop: `${EXPOSURE_PX.sortHeaderPaddingY}px`,
          paddingBottom: `${EXPOSURE_PX.sortHeaderPaddingY}px`,
        }}
      >
        <div className="flex items-center flex-1">
          <div style={{ width: '40px', marginLeft: '6px' }} />
          <div className="flex-1" style={{ marginLeft: '16px' }} />
        </div>
        <div
          className="flex items-center justify-center"
          style={{ width: '60px', marginRight: '2px' }}
        >
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="hover:text-gray-300 transition-colors cursor-pointer"
            style={{
              color: EXPOSURE_COLORS.textPrimary,
              fontSize: `${EXPOSURE_PX.sortArrowSize}px`,
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Player List */}
      <div 
        className="flex-1 min-h-0 overflow-y-auto"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div style={{ paddingBottom: '32px' }}>
          {filteredPlayers.map((player, index) => (
            <ExposureRow 
              key={player.id} 
              player={player} 
              isFirst={index === 0}
              isLast={index === filteredPlayers.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface ExposureRowProps {
  player: ExposurePlayer;
  isFirst?: boolean;
  isLast?: boolean;
}

function ExposureRow({ player, isFirst = false, isLast = false }: ExposureRowProps): React.ReactElement {
  const [showShares, setShowShares] = useState(false);
  const positionColor = POSITION_COLORS[player.position];
  const exposurePercent = Math.round(player.exposure);
  
  return (
    <div
      style={{
        paddingLeft: `${EXPOSURE_PX.rowPaddingX}px`,
        paddingRight: `${EXPOSURE_PX.rowPaddingX}px`,
        paddingTop: isLast ? `${EXPOSURE_PX.rowPaddingY}px` : `${EXPOSURE_PX.rowPaddingY}px`,
        paddingBottom: isLast ? `${EXPOSURE_PX.rowLastPaddingBottom}px` : `${EXPOSURE_PX.rowPaddingY}px`,
        minHeight: `${EXPOSURE_PX.rowMinHeight}px`,
        borderBottom: `1px solid ${EXPOSURE_COLORS.rowBorder}`,
        borderTop: isFirst ? `1px solid ${EXPOSURE_COLORS.rowBorder}` : 'none',
      }}
    >
      <div className="flex items-center justify-between">
        {/* Left Side - Player Info */}
        <div className="flex items-center flex-1 min-w-0">
          {/* Player Info */}
          <div className="min-w-0 flex-1" style={{ marginLeft: `${EXPOSURE_PX.photoMarginLeft}px` }}>
            <div className="flex items-center overflow-hidden">
              <h3
                className="font-medium truncate"
                style={{
                  color: EXPOSURE_COLORS.textPrimary,
                  fontSize: `${EXPOSURE_PX.playerNameFontSize}px`,
                  maxWidth: `${EXPOSURE_PX.playerNameMaxWidth}px`,
                }}
              >
                {player.name}
              </h3>
            </div>

            {/* Position Badge and Team Info */}
            <div
              className="flex items-center"
              style={{
                fontSize: `${EXPOSURE_PX.teamInfoFontSize}px`,
                color: EXPOSURE_COLORS.textSecondary,
                marginTop: `${EXPOSURE_PX.teamInfoMarginTop}px`,
              }}
            >
              {/* Position Badge */}
              <div
                className="flex items-center justify-center font-bold"
                style={{
                  width: `${EXPOSURE_PX.badgeWidth}px`,
                  height: `${EXPOSURE_PX.badgeHeight}px`,
                  marginRight: `${EXPOSURE_PX.badgeMarginRight}px`,
                  borderRadius: '3px',
                  backgroundColor: positionColor,
                  color: EXPOSURE_COLORS.textPrimary,
                  fontSize: `${EXPOSURE_PX.badgeFontSize}px`,
                }}
              >
                {player.position}
              </div>
              <span>{player.team}</span>
            </div>
          </div>
        </div>

        {/* Right Side - Exposure/Shares Toggle */}
        <div className="flex items-center flex-shrink-0">
          <div
            className="font-medium text-right"
            style={{
              minWidth: `${EXPOSURE_PX.exposureMinWidth}px`,
              marginRight: `${EXPOSURE_PX.exposureMarginRight}px`,
              fontSize: `${EXPOSURE_PX.exposureFontSize}px`,
              color: EXPOSURE_COLORS.textPrimary,
            }}
          >
            <span
              className="cursor-pointer hover:text-blue-300 transition-colors inline-block text-center"
              style={{ width: `${EXPOSURE_PX.exposureValueWidth}px` }}
              onClick={(e) => {
                e.stopPropagation();
                setShowShares(!showShares);
              }}
            >
              {showShares ? `shares: ${player.teams}` : `${exposurePercent}%`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

