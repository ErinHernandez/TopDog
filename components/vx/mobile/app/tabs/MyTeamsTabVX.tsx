/**
 * MyTeamsTabVX - My Teams Tab (TypeScript)
 * 
 * Pixel-perfect match to: components/mobile/tabs/MyTeams/
 * 
 * Shows user's drafted teams with search, filtering, and roster view.
 */

import React, { useState, useRef } from 'react';
import { POSITION_COLORS } from '../../../constants/colors';
import { getPlayerPhotoUrl, getPlayerId } from '../../../../lib/playerPhotos';

// ============================================================================
// PIXEL-PERFECT CONSTANTS
// ============================================================================

const MYTEAMS_PX = {
  // Search Section
  searchPadding: 16,
  searchInputPaddingX: 16,
  searchInputPaddingY: 12,
  searchInputFontSize: 14,
  searchInputBorderRadius: 8,
  
  // Filter chips
  chipPaddingX: 12,
  chipPaddingY: 4,
  chipFontSize: 12,
  chipBorderRadius: 9999,
  chipGap: 8,
  chipMarginTop: 12,
  
  // Dropdown
  dropdownItemPaddingX: 16,
  dropdownItemPaddingY: 12,
  dropdownItemFontSize: 14,
  dropdownMaxHeight: 240,
  
  // Team List
  listPaddingX: 16,
  listPaddingTop: 16,
  listGap: 12,
  
  // Team Card
  cardPadding: 12,
  cardBorderRadius: 8,
  cardFontSize: 14,
  cardIconSize: 20,
  
  // Details Header
  headerPadding: 16,
  headerBorderWidth: 4,
  headerIconSize: 20,
  headerTitleFontSize: 18,
  
  // Player Row
  rowMinHeight: 18,
  rowPaddingX: 16,
  rowPaddingY: 4,
  
  // Player Photo
  photoSize: 36,
  photoMarginRight: 10,
  
  // Position Badge
  badgeWidth: 25,
  badgeHeight: 16,
  badgeMarginRight: 6,
  badgeFontSize: 10,
  
  // Player Info
  playerNameFontSize: 14,
  playerNameMaxWidth: 200,
  teamInfoFontSize: 12,
  teamInfoMarginTop: 4,
  
  // Projected Points
  projFontSize: 14,
} as const;

const MYTEAMS_COLORS = {
  background: '#101927',
  searchBg: '#1f2937',
  searchBorder: '#4b5563',
  searchText: '#ffffff',
  cardBg: 'rgba(31, 41, 55, 0.4)',
  cardBorder: 'rgba(55, 65, 81, 0.3)',
  cardHover: 'rgba(55, 65, 81, 0.6)',
  headerBorder: '#374151',
  rowBorder: '#374151',
  chipPlayer: '#2563eb',
  chipTeam: '#16a34a',
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
} as const;

// ============================================================================
// TYPES
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface MyTeamsTabVXProps {
  selectedTeam: any;
  setSelectedTeam: (team: any) => void;
  setDraftBoardTeam?: (team: any) => void;
  setShowDraftBoard?: (show: boolean) => void;
}

interface TeamPlayer {
  name: string;
  team: string;
  bye: number;
  adp: number;
  pick: number;
  projectedPoints?: number;
}

interface MockTeam {
  id: string;
  name: string;
  tournament: string;
  players: {
    QB: TeamPlayer[];
    RB: TeamPlayer[];
    WR: TeamPlayer[];
    TE: TeamPlayer[];
  };
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_TEAMS: MockTeam[] = [
  {
    id: 'the-topdog-1',
    name: 'The TopDog (1)',
    tournament: 'The TopDog',
    players: {
      QB: [
        { name: 'Jayden Daniels', team: 'WAS', bye: 12, adp: 42.8, pick: 48, projectedPoints: 320 },
        { name: 'Joe Burrow', team: 'CIN', bye: 10, adp: 53.9, pick: 72, projectedPoints: 295 }
      ],
      RB: [
        { name: 'Jordan Mason', team: 'MIN', bye: 6, adp: 105.2, pick: 96, projectedPoints: 180 },
        { name: 'Bhayshul Tuten', team: 'JAX', bye: 8, adp: 116.6, pick: 97, projectedPoints: 145 },
        { name: 'Austin Ekeler', team: 'WAS', bye: 12, adp: 157.8, pick: 121, projectedPoints: 120 },
        { name: 'Jarquez Hunter', team: 'LAR', bye: 8, adp: 198.2, pick: 169, projectedPoints: 85 }
      ],
      WR: [
        { name: "Ja'Marr Chase", team: 'CIN', bye: 10, adp: 1.1, pick: 1, projectedPoints: 285 },
        { name: 'Terry McLaurin', team: 'WAS', bye: 12, adp: 27.8, pick: 24, projectedPoints: 210 },
        { name: 'Rashee Rice', team: 'KC', bye: 10, adp: 29.7, pick: 25, projectedPoints: 195 },
        { name: 'Jerry Jeudy', team: 'CLE', bye: 9, adp: 67.4, pick: 73, projectedPoints: 155 },
        { name: 'Rashod Bateman', team: 'BAL', bye: 7, adp: 115.7, pick: 120, projectedPoints: 125 },
        { name: 'Alec Pierce', team: 'IND', bye: 11, adp: 170.8, pick: 168, projectedPoints: 95 }
      ],
      TE: [
        { name: 'George Kittle', team: 'SF', bye: 14, adp: 51.6, pick: 49, projectedPoints: 175 },
        { name: 'Zach Ertz', team: 'WAS', bye: 12, adp: 166.2, pick: 144, projectedPoints: 110 }
      ]
    }
  },
  {
    id: 'the-topdog-2',
    name: 'The TopDog (2)',
    tournament: 'The TopDog',
    players: {
      QB: [
        { name: 'Baker Mayfield', team: 'TB', bye: 9, adp: 92.4, pick: 94, projectedPoints: 280 },
        { name: 'Jared Goff', team: 'DET', bye: 8, adp: 116.7, pick: 118, projectedPoints: 265 }
      ],
      RB: [
        { name: 'Chase Brown', team: 'CIN', bye: 10, adp: 28.3, pick: 22, projectedPoints: 210 },
        { name: 'Chuba Hubbard', team: 'CAR', bye: 14, adp: 55.3, pick: 51, projectedPoints: 165 },
        { name: 'James Conner', team: 'ARI', bye: 8, adp: 65.8, pick: 70, projectedPoints: 155 }
      ],
      WR: [
        { name: 'Justin Jefferson', team: 'MIN', bye: 6, adp: 3.1, pick: 3, projectedPoints: 295 },
        { name: 'Mike Evans', team: 'TB', bye: 9, adp: 34.9, pick: 27, projectedPoints: 205 },
        { name: 'Jameson Williams', team: 'DET', bye: 8, adp: 43.3, pick: 46, projectedPoints: 185 },
        { name: 'Darnell Mooney', team: 'ATL', bye: 5, adp: 85.1, pick: 75, projectedPoints: 145 }
      ],
      TE: [
        { name: 'Isaiah Likely', team: 'BAL', bye: 7, adp: 144.9, pick: 142, projectedPoints: 130 },
        { name: 'Dallas Goedert', team: 'PHI', bye: 9, adp: 142.1, pick: 166, projectedPoints: 125 }
      ]
    }
  },
  {
    id: 'the-topdog-3',
    name: 'The TopDog (3)',
    tournament: 'The TopDog',
    players: {
      QB: [
        { name: 'Jaxson Dart', team: 'NYG', bye: 14, adp: 90.3, pick: 78, projectedPoints: 245 },
        { name: 'Aaron Rodgers', team: 'PIT', bye: 5, adp: 103.0, pick: 91, projectedPoints: 230 }
      ],
      RB: [
        { name: 'Saquon Barkley', team: 'PHI', bye: 9, adp: 7.5, pick: 6, projectedPoints: 260 },
        { name: 'Chase Brown', team: 'CIN', bye: 10, adp: 45.2, pick: 54, projectedPoints: 195 },
        { name: 'Cam Skattebo', team: 'NYG', bye: 14, adp: 113.6, pick: 115, projectedPoints: 140 }
      ],
      WR: [
        { name: 'Malik Nabers', team: 'NYG', bye: 14, adp: 21.8, pick: 19, projectedPoints: 235 },
        { name: 'Nico Collins', team: 'HOU', bye: 6, adp: 25.9, pick: 30, projectedPoints: 220 },
        { name: 'Rashee Rice', team: 'KC', bye: 10, adp: 56.4, pick: 43, projectedPoints: 185 },
        { name: 'Mike Evans', team: 'TB', bye: 9, adp: 63.2, pick: 67, projectedPoints: 175 }
      ],
      TE: [
        { name: 'Jonnu Smith', team: 'PIT', bye: 5, adp: 120.1, pick: 126, projectedPoints: 115 },
        { name: 'Zach Ertz', team: 'WAS', bye: 12, adp: 171.7, pick: 150, projectedPoints: 105 }
      ]
    }
  },
  {
    id: 'the-topdog-4',
    name: 'The TopDog (4)',
    tournament: 'The TopDog',
    players: {
      QB: [
        { name: 'Baker Mayfield', team: 'TB', bye: 9, adp: 92.0, pick: 88, projectedPoints: 275 },
        { name: 'Bryce Young', team: 'CAR', bye: 14, adp: 157.7, pick: 160, projectedPoints: 200 }
      ],
      RB: [
        { name: 'RJ Harvey', team: 'DEN', bye: 12, adp: 54.1, pick: 57, projectedPoints: 175 },
        { name: 'David Montgomery', team: 'DET', bye: 8, adp: 70.5, pick: 64, projectedPoints: 165 },
        { name: 'Kaleb Johnson', team: 'PIT', bye: 5, adp: 75.3, pick: 81, projectedPoints: 150 }
      ],
      WR: [
        { name: 'Malik Nabers', team: 'NYG', bye: 14, adp: 9.3, pick: 9, projectedPoints: 245 },
        { name: 'Rashee Rice', team: 'KC', bye: 10, adp: 27.7, pick: 16, projectedPoints: 200 },
        { name: 'Mike Evans', team: 'TB', bye: 9, adp: 34.7, pick: 33, projectedPoints: 190 },
        { name: 'Jameson Williams', team: 'DET', bye: 8, adp: 45.0, pick: 40, projectedPoints: 170 },
        { name: 'Kyle Williams', team: 'NE', bye: 14, adp: 118.0, pick: 112, projectedPoints: 125 }
      ],
      TE: [
        { name: 'Jake Ferguson', team: 'DAL', bye: 10, adp: 142.1, pick: 129, projectedPoints: 135 },
        { name: 'Isaiah Likely', team: 'BAL', bye: 7, adp: 148.9, pick: 136, projectedPoints: 120 }
      ]
    }
  }
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MyTeamsTabVX({ 
  selectedTeam,
  setSelectedTeam,
  setDraftBoardTeam,
  setShowDraftBoard
}: MyTeamsTabVXProps): React.ReactElement {
  if (selectedTeam) {
    return (
      <TeamDetailsView 
        team={selectedTeam}
        onBack={() => setSelectedTeam(null)}
        onViewDraftBoard={() => {
          setDraftBoardTeam?.(selectedTeam);
          setShowDraftBoard?.(true);
        }}
      />
    );
  }

  return (
    <TeamListView
      teams={MOCK_TEAMS}
      onTeamSelect={setSelectedTeam}
    />
  );
}

// ============================================================================
// TEAM LIST VIEW
// ============================================================================

interface TeamListViewProps {
  teams: MockTeam[];
  onTeamSelect: (team: MockTeam) => void;
}

function TeamListView({ teams, onTeamSelect }: TeamListViewProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter teams by search
  const filteredTeams = teams.filter(team => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return team.name.toLowerCase().includes(query);
  });

  return (
    <div 
      className="flex-1 min-h-0 flex flex-col"
      style={{ backgroundColor: MYTEAMS_COLORS.background }}
    >
      {/* Search Bar */}
      <div
        style={{
          padding: `${MYTEAMS_PX.searchPadding}px`,
          borderBottom: `1px solid ${MYTEAMS_COLORS.headerBorder}`,
        }}
      >
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: MYTEAMS_COLORS.searchBg,
            color: MYTEAMS_COLORS.searchText,
            paddingLeft: `${MYTEAMS_PX.searchInputPaddingX}px`,
            paddingRight: `${MYTEAMS_PX.searchInputPaddingX}px`,
            paddingTop: `${MYTEAMS_PX.searchInputPaddingY}px`,
            paddingBottom: `${MYTEAMS_PX.searchInputPaddingY}px`,
            borderRadius: `${MYTEAMS_PX.searchInputBorderRadius}px`,
            border: `1px solid ${MYTEAMS_COLORS.searchBorder}`,
            fontSize: `${MYTEAMS_PX.searchInputFontSize}px`,
            outline: 'none',
          }}
        />
      </div>

      {/* Teams List */}
      <div 
        className="flex-1 min-h-0 overflow-y-auto"
        style={{
          paddingLeft: `${MYTEAMS_PX.listPaddingX}px`,
          paddingRight: `${MYTEAMS_PX.listPaddingX}px`,
          paddingTop: `${MYTEAMS_PX.listPaddingTop}px`,
          paddingBottom: '32px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {filteredTeams.length === 0 ? (
          <div className="text-center" style={{ paddingTop: '32px' }}>
            <p style={{ color: MYTEAMS_COLORS.textSecondary }}>No teams found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${MYTEAMS_PX.listGap}px` }}>
            {filteredTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => onTeamSelect(team)}
                className="w-full flex items-center justify-between transition-colors"
                style={{
                  padding: `${MYTEAMS_PX.cardPadding}px`,
                  backgroundColor: MYTEAMS_COLORS.cardBg,
                  borderRadius: `${MYTEAMS_PX.cardBorderRadius}px`,
                  border: `1px solid ${MYTEAMS_COLORS.cardBorder}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = MYTEAMS_COLORS.cardHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = MYTEAMS_COLORS.cardBg;
                }}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <div
                    className="font-medium truncate"
                    style={{
                      color: MYTEAMS_COLORS.textPrimary,
                      fontSize: `${MYTEAMS_PX.cardFontSize}px`,
                    }}
                  >
                    {team.name}
                  </div>
                </div>
                <svg
                  width={MYTEAMS_PX.cardIconSize}
                  height={MYTEAMS_PX.cardIconSize}
                  fill="none"
                  stroke={MYTEAMS_COLORS.textSecondary}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TEAM DETAILS VIEW
// ============================================================================

interface TeamDetailsViewProps {
  team: MockTeam;
  onBack: () => void;
  onViewDraftBoard: () => void;
}

function TeamDetailsView({ team, onViewDraftBoard }: TeamDetailsViewProps): React.ReactElement {
  // Flatten players for rendering
  const allPlayers = [
    ...team.players.QB.map(p => ({ ...p, position: 'QB' as const })),
    ...team.players.RB.map(p => ({ ...p, position: 'RB' as const })),
    ...team.players.WR.map(p => ({ ...p, position: 'WR' as const })),
    ...team.players.TE.map(p => ({ ...p, position: 'TE' as const })),
  ];

  return (
    <div 
      className="flex-1 min-h-0 flex flex-col"
      style={{ backgroundColor: MYTEAMS_COLORS.background }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between flex-shrink-0"
        style={{
          padding: `${MYTEAMS_PX.headerPadding}px`,
          borderBottom: `${MYTEAMS_PX.headerBorderWidth}px solid ${MYTEAMS_COLORS.headerBorder}`,
          zIndex: 10,
        }}
      >
        <div className="flex items-center flex-1 min-w-0" style={{ marginRight: '16px' }}>
          {/* Edit button */}
          <button
            className="transition-colors"
            style={{ color: MYTEAMS_COLORS.textSecondary, marginRight: '12px' }}
          >
            <svg
              width={MYTEAMS_PX.headerIconSize}
              height={MYTEAMS_PX.headerIconSize}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <h2
            className="font-semibold truncate"
            style={{
              color: MYTEAMS_COLORS.textPrimary,
              fontSize: `${MYTEAMS_PX.headerTitleFontSize}px`,
            }}
          >
            {team.name}
          </h2>
        </div>

        <div className="flex items-center" style={{ gap: '8px' }}>
          {/* Share button */}
          <button
            className="p-2 rounded-lg transition-colors hover:bg-gray-800/50"
            style={{ color: MYTEAMS_COLORS.textSecondary }}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          
          {/* Draft Board button */}
          <button
            onClick={onViewDraftBoard}
            className="p-2 rounded-lg transition-colors hover:bg-gray-800/50"
            style={{ color: MYTEAMS_COLORS.textSecondary }}
            title="View Full Draft Board"
          >
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 4h2a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1zM11 4h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V5a1 1 0 011-1zM18 4h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V5a1 1 0 011-1zM4 10h2a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2a1 1 0 011-1zM11 10h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 011-1zM18 10h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 011-1zM4 16h2a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2a1 1 0 011-1zM11 16h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 011-1zM18 16h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 011-1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Player Roster */}
      <div 
        className="flex-1 overflow-y-auto min-h-0"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {allPlayers.map((player, index) => (
          <PlayerRow
            key={`${player.name}-${index}`}
            player={player}
            isFirst={index === 0}
            isLast={index === allPlayers.length - 1}
          />
        ))}
        {/* Bottom padding for scroll */}
        <div style={{ height: '100px', flexShrink: 0 }} />
      </div>
    </div>
  );
}

// ============================================================================
// PLAYER ROW
// ============================================================================

interface PlayerRowProps {
  player: TeamPlayer & { position: 'QB' | 'RB' | 'WR' | 'TE' };
  isFirst: boolean;
  isLast: boolean;
}

function PlayerRow({ player, isLast }: PlayerRowProps): React.ReactElement {
  const positionColor = POSITION_COLORS[player.position];
  const [imageError, setImageError] = React.useState(false);
  
  // Get player ID for image path
  const playerId = (player as any).id || getPlayerId(player.name);
  const photoUrl = getPlayerPhotoUrl(
    player.name,
    player.team,
    player.position,
    MYTEAMS_PX.photoSize,
    playerId,
    (player as any).photoUrl
  );

  return (
    <div
      className="transition-colors hover:bg-gray-800/50"
      style={{
        minHeight: `${MYTEAMS_PX.rowMinHeight}px`,
        paddingLeft: `${MYTEAMS_PX.rowPaddingX}px`,
        paddingRight: `${MYTEAMS_PX.rowPaddingX}px`,
        paddingTop: `${MYTEAMS_PX.rowPaddingY}px`,
        paddingBottom: `${MYTEAMS_PX.rowPaddingY}px`,
        borderTop: `1px solid ${MYTEAMS_COLORS.rowBorder}`,
        borderBottom: isLast ? `1px solid ${MYTEAMS_COLORS.rowBorder}` : 'none',
      }}
    >
      <div className="flex items-center justify-between">
        {/* Left Side - Photo and Info */}
        <div className="flex items-center flex-1 min-w-0">
          {/* Player Photo */}
          <div
            className="flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center"
            style={{
              width: `${MYTEAMS_PX.photoSize}px`,
              height: `${MYTEAMS_PX.photoSize}px`,
              marginRight: `${MYTEAMS_PX.photoMarginRight}px`,
              backgroundColor: imageError || !photoUrl ? '#4b5563' : 'transparent',
            }}
          >
            {photoUrl && !imageError ? (
              <img
                src={photoUrl}
                alt={player.name}
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  console.log('Image failed to load:', photoUrl, 'for player:', player.name);
                  setImageError(true);
                }}
                onLoad={() => {
                  // Image loaded successfully
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="#9ca3af" />
                <path d="M20 21c0-4.418-3.582-7-8-7s-8 2.582-8 7" fill="#9ca3af" />
              </svg>
            )}
          </div>

          {/* Player Info */}
          <div className="min-w-0 flex-1" style={{ marginLeft: '2px' }}>
            <div className="flex items-center overflow-hidden">
              <h3
                className="font-medium truncate"
                style={{
                  color: MYTEAMS_COLORS.textPrimary,
                  fontSize: `${MYTEAMS_PX.playerNameFontSize}px`,
                  maxWidth: `${MYTEAMS_PX.playerNameMaxWidth}px`,
                }}
              >
                {player.name}
              </h3>
            </div>

            {/* Position Badge and Team Info */}
            <div
              className="flex items-center"
              style={{
                fontSize: `${MYTEAMS_PX.teamInfoFontSize}px`,
                color: MYTEAMS_COLORS.textSecondary,
                marginTop: `${MYTEAMS_PX.teamInfoMarginTop}px`,
              }}
            >
              {/* Position Badge */}
              <div
                className="flex items-center justify-center font-bold"
                style={{
                  width: `${MYTEAMS_PX.badgeWidth}px`,
                  height: `${MYTEAMS_PX.badgeHeight}px`,
                  marginRight: `${MYTEAMS_PX.badgeMarginRight}px`,
                  borderRadius: '3px',
                  backgroundColor: positionColor,
                  color: MYTEAMS_COLORS.textPrimary,
                  fontSize: `${MYTEAMS_PX.badgeFontSize}px`,
                }}
              >
                {player.position}
              </div>
              <span>{player.team} ({player.bye})</span>
            </div>
          </div>
        </div>

        {/* Right Side - Projected Points */}
        <div className="flex items-center flex-shrink-0">
          <div
            className="font-medium text-left"
            style={{
              fontSize: `${MYTEAMS_PX.projFontSize}px`,
              color: MYTEAMS_COLORS.textSecondary,
            }}
          >
            Proj {player.projectedPoints || 0} pts
          </div>
        </div>
      </div>
    </div>
  );
}

// Export types
export type { MockTeam };
