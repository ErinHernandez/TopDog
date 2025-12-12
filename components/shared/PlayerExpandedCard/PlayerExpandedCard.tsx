/**
 * PlayerExpandedCard - Expanded player stats dropdown
 * 
 * Master component for the expanded player card with:
 * - Team logo
 * - Bye/ADP/Proj badges
 * - DRAFT button
 * - Year-by-year stats table (position-specific layouts)
 * 
 * Copied from: components/draft/v3/mobile/apple/components/PlayerListApple.js
 * Preview/develop at: /dev/components
 */

import React from 'react';
import { createTeamGradient } from '@/lib/gradientUtils';
import { BYE_WEEKS } from '@/lib/nflConstants';
import { getPlayerPhotoUrl } from '@/lib/playerPhotos';

import type { FantasyPosition } from '@/types/player';

// ============================================================================
// TYPES
// ============================================================================

/** Player data for the expanded card */
interface PlayerData {
  name: string;
  team: string;
  position: FantasyPosition | string;
  adp?: number | string | null;
  projectedPoints?: number | string | null;
  proj?: string | null;
}

/** Props for PlayerExpandedCard component */
interface PlayerExpandedCardProps {
  /** Player data to display */
  player: PlayerData | null;
  /** Callback when draft button is clicked */
  onDraft?: (player: PlayerData) => void;
  /** Callback when card is closed */
  onClose?: () => void;
  /** Whether it's the user's turn to draft */
  isMyTurn?: boolean;
  /** Whether to show the draft button (false shows headshot instead) */
  showDraftButton?: boolean;
  /** URL for player headshot image */
  headshotUrl?: string | null;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

/** Props for stats table components */
interface StatsTableProps {
  availableYears: number;
  team: string;
}

/** Props for data row components */
interface DataRowProps {
  label: string;
  values: string[];
}

// Teams with light backgrounds that need dark header text
const LIGHT_BG_TEAMS = ['DET']; // Lions have light blue background

// Note: Scrollbar hiding is now handled globally in globals.css
// Use class "hide-scrollbar" or "mobile-no-scrollbar" for explicit hiding


// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PlayerExpandedCard({
  player,
  onDraft,
  onClose,
  isMyTurn = false,
  showDraftButton = true,
  headshotUrl = null,
  style = {},
}: PlayerExpandedCardProps): React.ReactElement | null {
  if (!player) return null;

  const { name, team, position, adp, projectedPoints } = player;
  const byeWeek = (BYE_WEEKS as Record<string, number>)[team] || 'N/A';
  const teamGradient = createTeamGradient(team);

  const handleDraft = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    onDraft?.(player);
  };

  // Calculate available years based on player data
  const getAvailableYears = (): number => {
    let availableYears = 3; // Default: Proj + 2024 + 2023
    if (name?.includes('rookie') || name?.includes('2024')) {
      availableYears = 1;
    } else if (name?.length % 3 === 0) {
      availableYears = 2;
    } else if (name?.length % 4 === 0) {
      availableYears = 4;
    }
    return availableYears;
  };

  const availableYears = getAvailableYears();

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    onClose?.();
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    e.currentTarget.style.display = 'none';
  };

  const handleHeadshotError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    e.currentTarget.src = `/logos/nfl/${team?.toLowerCase()}.png`;
  };

  return (
    <>
      <div
        className="border border-gray-600 rounded-lg shadow-xl"
        style={{
          background: teamGradient.firstGradient,
          border: `2px solid ${teamGradient.primaryColor}`,
          ...style,
        }}
        onClick={handleCardClick}
      >
      {/* Header: Logo + Badges + Draft Button */}
      <div className="flex justify-between items-center pl-3 pr-3" style={{ paddingTop: '6px', paddingBottom: '4px' }}>
        {/* Team Logo */}
        <img
          src={`/logos/nfl/${team?.toLowerCase()}.png`}
          alt={`${team} logo`}
          style={{
            width: '55px',
            height: '55px',
            flexShrink: 0,
            display: 'block'
          }}
          onError={handleImageError}
        />

        {/* Bye / ADP / Proj Badges */}
        <div className="flex-1 px-3">
          <div className="text-xs flex justify-center items-center gap-4">
            <div className="text-center" style={{ minWidth: '35px' }}>
              <div style={{ fontSize: '12px', color: LIGHT_BG_TEAMS.includes(team) ? '#000000' : '#9ca3af' }}>Bye</div>
              <div className="text-white font-medium" style={{ fontSize: '14px' }}>{byeWeek}</div>
            </div>
            <div className="text-center" style={{ minWidth: '45px' }}>
              <div style={{ fontSize: '12px', color: LIGHT_BG_TEAMS.includes(team) ? '#000000' : '#9ca3af' }}>ADP</div>
              <div className="text-white font-medium" style={{ fontSize: '14px' }}>{parseFloat(String(adp || 0)).toFixed(1)}</div>
            </div>
            <div className="text-center" style={{ minWidth: '40px' }}>
              <div style={{ fontSize: '12px', color: LIGHT_BG_TEAMS.includes(team) ? '#000000' : '#9ca3af' }}>Proj</div>
              <div className="text-white font-medium" style={{ fontSize: '14px' }}>{parseFloat(String(projectedPoints || 0)).toFixed(1) || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Draft Button or Player Photo */}
        {showDraftButton ? (
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
        ) : (
          <div 
            className="rounded-full overflow-hidden flex-shrink-0"
            style={{ width: '50px', height: '50px' }}
          >
            <img 
              src={headshotUrl || getPlayerPhotoUrl(name, team, position, 50)}
              alt={name}
              className="w-full h-full object-cover"
              onError={handleHeadshotError}
            />
          </div>
        )}
      </div>

      {/* Stats Table */}
      <div className="pt-0 pb-1" style={{ paddingTop: '0px', paddingBottom: '0px', marginTop: '0px' }}>
        {position === 'QB' ? (
          <QBStatsTable availableYears={availableYears} team={team} />
        ) : position === 'RB' ? (
          <RBStatsTable availableYears={availableYears} team={team} />
        ) : (position === 'WR' || position === 'TE') ? (
          <WRTEStatsTable availableYears={availableYears} team={team} />
        ) : (
          <DefaultStatsTable />
        )}
      </div>
      </div>
    </>
  );
}


// ============================================================================
// QB STATS TABLE
// ============================================================================

function QBStatsTable({ availableYears, team }: StatsTableProps): React.ReactElement {
  const headerColor = LIGHT_BG_TEAMS.includes(team) ? '#000000' : '#9ca3af';
  const lineColor = LIGHT_BG_TEAMS.includes(team) ? '#000000' : '#4b5563';
  
  return (
    <div className="rounded text-xs overflow-x-auto hide-scrollbar">
      <div style={{ minWidth: '726px' }}>
        {/* Column Headers */}
        <div className="relative px-0 font-medium text-sm" style={{ height: '24px', paddingTop: '3px', paddingBottom: '4px', color: headerColor }}>
          <div style={{ position: 'absolute', bottom: '0px', left: '0px', right: '0px', height: '1px', background: lineColor }}></div>
          <div className="absolute text-left" style={{ left: '6px', width: '40px', textAlign: 'left' }}>YEAR</div>
          <div className="absolute flex justify-center items-center" style={{ left: '62px', width: '35px' }}>CMP</div>
          <div className="absolute flex justify-center items-center" style={{ left: '109px', width: '35px' }}>ATT</div>
          <div className="absolute flex justify-center items-center" style={{ left: '156px', width: '35px' }}>YDS</div>
          <div className="absolute flex justify-center items-center" style={{ left: '203px', width: '40px' }}>CMP%</div>
          <div className="absolute flex justify-center items-center" style={{ left: '255px', width: '35px' }}>AVG</div>
          <div className="absolute flex justify-center items-center" style={{ left: '302px', width: '30px' }}>TD</div>
          <div className="absolute flex justify-center items-center" style={{ left: '344px', width: '30px' }}>INT</div>
          <div className="absolute flex justify-center items-center" style={{ left: '386px', width: '35px' }}>LNG</div>
          <div className="absolute flex justify-center items-center" style={{ left: '433px', width: '40px' }}>SACK</div>
          <div className="absolute flex justify-center items-center" style={{ left: '485px', width: '30px' }}>CAR</div>
          <div className="absolute flex justify-center items-center" style={{ left: '527px', width: '30px' }}>YDS</div>
          <div className="absolute flex justify-center items-center" style={{ left: '569px', width: '30px' }}>AVG</div>
          <div className="absolute flex justify-center items-center" style={{ left: '611px', width: '25px' }}>TD</div>
          <div className="absolute flex justify-center items-center" style={{ left: '648px', width: '30px' }}>LNG</div>
          <div className="absolute flex justify-center items-center" style={{ left: '690px', width: '30px' }}>FUM</div>
        </div>

        {/* Data Rows */}
        <div className="space-y-0.5" style={{ padding: '0px 0px 6px 0px' }}>
          {/* Proj. row */}
          <QBDataRow label="Proj." values={['280', '420', '3850', '66.7', '9.2', '28', '12', '65', '32', '85', '450', '5.3', '6', '28', '3']} />
          {/* 2025 row */}
          <QBDataRow label="2025" values={['280', '420', '3850', '66.7', '9.2', '28', '12', '65', '32', '85', '450', '5.3', '6', '28', '3']} />
          {/* Historical years */}
          {availableYears > 1 && <QBDataRow label="2024" values={['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']} />}
          {availableYears > 2 && <QBDataRow label="2023" values={['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']} />}
          {availableYears > 3 && <QBDataRow label="2022" values={['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']} />}
        </div>
      </div>
    </div>
  );
}

function QBDataRow({ label, values }: DataRowProps): React.ReactElement {
  const positions = [62, 109, 156, 203, 255, 302, 344, 386, 433, 485, 527, 569, 611, 648, 690];
  const widths = [35, 35, 35, 40, 35, 30, 30, 35, 40, 30, 30, 30, 25, 30, 30];
  
  return (
    <div className="relative px-0 py-1 text-white text-sm" style={{ height: '20px' }}>
      <div className="absolute text-left" style={{ left: '10px', width: '40px' }}>{label}</div>
      {values.map((val, i) => (
        <div key={i} className="absolute flex justify-center items-center" style={{ left: `${positions[i]}px`, width: `${widths[i]}px` }}>{val}</div>
      ))}
    </div>
  );
}


// ============================================================================
// RB STATS TABLE
// ============================================================================

function RBStatsTable({ availableYears, team }: StatsTableProps): React.ReactElement {
  const headerColor = LIGHT_BG_TEAMS.includes(team) ? '#000000' : '#9ca3af';
  const lineColor = LIGHT_BG_TEAMS.includes(team) ? '#000000' : '#4b5563';
  
  return (
    <div className="rounded text-xs overflow-x-auto hide-scrollbar">
      <div style={{ minWidth: '587px' }}>
        {/* Column Headers */}
        <div className="relative px-0 font-medium text-sm" style={{ height: '24px', paddingTop: '3px', paddingBottom: '4px', color: headerColor }}>
          <div style={{ position: 'absolute', bottom: '0px', left: '0px', right: '0px', height: '1px', background: lineColor }}></div>
          <div className="absolute text-left" style={{ left: '6px', width: '35px', textAlign: 'left' }}>YEAR</div>
          <div className="absolute flex justify-center items-center" style={{ left: '57px', width: '30px' }}>CAR</div>
          <div className="absolute flex justify-center items-center" style={{ left: '99px', width: '30px' }}>YDS</div>
          <div className="absolute flex justify-center items-center" style={{ left: '141px', width: '30px' }}>AVG</div>
          <div className="absolute flex justify-center items-center" style={{ left: '183px', width: '25px' }}>TD</div>
          <div className="absolute flex justify-center items-center" style={{ left: '220px', width: '30px' }}>LNG</div>
          <div className="absolute flex justify-center items-center" style={{ left: '262px', width: '30px' }}>FUM</div>
          <div className="absolute flex justify-center items-center" style={{ left: '304px', width: '30px' }}>REC</div>
          <div className="absolute flex justify-center items-center" style={{ left: '346px', width: '35px' }}>TGTS</div>
          <div className="absolute flex justify-center items-center" style={{ left: '393px', width: '30px' }}>YDS</div>
          <div className="absolute flex justify-center items-center" style={{ left: '435px', width: '30px' }}>AVG</div>
          <div className="absolute flex justify-center items-center" style={{ left: '477px', width: '25px' }}>TD</div>
          <div className="absolute flex justify-center items-center" style={{ left: '514px', width: '30px' }}>LNG</div>
          <div className="absolute flex justify-center items-center" style={{ left: '556px', width: '25px' }}>FD</div>
        </div>

        {/* Data Rows */}
        <div className="space-y-0.5" style={{ padding: '0px 0px 6px 0px' }}>
          <RBDataRow label="Proj." values={['180', '850', '4.7', '8', '45', '2', '45', '65', '420', '9.3', '3', '28', '22']} />
          <RBDataRow label="2025" values={['180', '850', '4.7', '8', '45', '2', '45', '65', '420', '9.3', '3', '28', '22']} />
          {availableYears > 1 && <RBDataRow label="2024" values={['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']} />}
          {availableYears > 2 && <RBDataRow label="2023" values={['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']} />}
          {availableYears > 3 && <RBDataRow label="2022" values={['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']} />}
        </div>
      </div>
    </div>
  );
}

function RBDataRow({ label, values }: DataRowProps): React.ReactElement {
  const positions = [57, 99, 141, 183, 220, 262, 304, 346, 393, 435, 477, 514, 556];
  const widths = [30, 30, 30, 25, 30, 30, 30, 35, 30, 30, 25, 30, 25];
  
  return (
    <div className="relative px-0 py-1 text-white text-sm" style={{ height: '20px' }}>
      <div className="absolute text-left" style={{ left: '10px', width: '35px' }}>{label}</div>
      {values.map((val, i) => (
        <div key={i} className="absolute flex justify-center items-center" style={{ left: `${positions[i]}px`, width: `${widths[i]}px` }}>{val}</div>
      ))}
    </div>
  );
}


// ============================================================================
// WR/TE STATS TABLE
// ============================================================================

function WRTEStatsTable({ availableYears, team }: StatsTableProps): React.ReactElement {
  const headerColor = LIGHT_BG_TEAMS.includes(team) ? '#000000' : '#9ca3af';
  const lineColor = LIGHT_BG_TEAMS.includes(team) ? '#000000' : '#4b5563';
  
  return (
    <div className="rounded text-xs overflow-x-auto hide-scrollbar">
      <div style={{ minWidth: '587px' }}>
        {/* Column Headers */}
        <div className="relative px-0 font-medium text-sm" style={{ height: '24px', paddingTop: '3px', paddingBottom: '4px', color: headerColor }}>
          <div style={{ position: 'absolute', bottom: '0px', left: '0px', right: '0px', height: '1px', background: lineColor }}></div>
          <div className="absolute text-left" style={{ left: '6px', width: '35px', textAlign: 'left' }}>YEAR</div>
          <div className="absolute flex justify-center items-center" style={{ left: '57px', width: '30px' }}>REC</div>
          <div className="absolute flex justify-center items-center" style={{ left: '99px', width: '35px' }}>TGTS</div>
          <div className="absolute flex justify-center items-center" style={{ left: '146px', width: '30px' }}>YDS</div>
          <div className="absolute flex justify-center items-center" style={{ left: '188px', width: '30px' }}>AVG</div>
          <div className="absolute flex justify-center items-center" style={{ left: '230px', width: '25px' }}>TD</div>
          <div className="absolute flex justify-center items-center" style={{ left: '267px', width: '30px' }}>LNG</div>
          <div className="absolute flex justify-center items-center" style={{ left: '309px', width: '25px' }}>FD</div>
          <div className="absolute flex justify-center items-center" style={{ left: '346px', width: '30px' }}>CAR</div>
          <div className="absolute flex justify-center items-center" style={{ left: '388px', width: '30px' }}>YDS</div>
          <div className="absolute flex justify-center items-center" style={{ left: '430px', width: '30px' }}>AVG</div>
          <div className="absolute flex justify-center items-center" style={{ left: '472px', width: '25px' }}>TD</div>
          <div className="absolute flex justify-center items-center" style={{ left: '509px', width: '30px' }}>LNG</div>
          <div className="absolute flex justify-center items-center" style={{ left: '551px', width: '30px' }}>FUM</div>
        </div>

        {/* Data Rows */}
        <div className="space-y-0.5" style={{ padding: '0px 0px 6px 0px' }}>
          <WRTEDataRow label="Proj." values={['85', '125', '1200', '14.1', '8', '45', '48', '5', '25', '5.0', '0', '15', '0']} />
          <WRTEDataRow label="2025" values={['85', '125', '1200', '14.1', '8', '45', '48', '5', '25', '5.0', '0', '15', '0']} />
          {availableYears > 1 && <WRTEDataRow label="2024" values={['90', '145', '1229', '13.7', '4', '65', '58', '0', '0', '0.0', '0', '0', '0']} />}
          {availableYears > 2 && <WRTEDataRow label="2023" values={['54', '87', '758', '14.0', '2', '42', '32', '-', '-', '-', '-', '-', '-']} />}
          {availableYears > 3 && <WRTEDataRow label="2022" values={['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']} />}
        </div>
      </div>
    </div>
  );
}

function WRTEDataRow({ label, values }: DataRowProps): React.ReactElement {
  const positions = [57, 99, 146, 188, 230, 267, 309, 346, 388, 430, 472, 509, 551];
  const widths = [30, 35, 30, 30, 25, 30, 25, 30, 30, 30, 25, 30, 30];
  
  return (
    <div className="relative px-0 py-1 text-white text-sm" style={{ height: '20px' }}>
      <div className="absolute text-left" style={{ left: '10px', width: '35px' }}>{label}</div>
      {values.map((val, i) => (
        <div key={i} className="absolute flex justify-center items-center" style={{ left: `${positions[i]}px`, width: `${widths[i]}px` }}>{val}</div>
      ))}
    </div>
  );
}


// ============================================================================
// DEFAULT STATS TABLE
// ============================================================================

function DefaultStatsTable(): React.ReactElement {
  return (
    <div className="rounded text-xs">
      <div className="grid grid-cols-6 gap-1 px-2 py-1 border-b border-gray-600 text-gray-400 font-medium">
        <div className="text-center">DATE</div>
        <div className="text-center">REC</div>
        <div className="text-center">YDS</div>
        <div className="text-center">TD</div>
        <div className="text-center">ATT</div>
        <div className="text-center">TOT</div>
      </div>
      <div className="space-y-0.5 p-1">
        <div className="grid grid-cols-6 gap-1 px-1 py-1 text-white text-sm">
          <div className="text-center">2025</div>
          <div className="text-center">-</div>
          <div className="text-center">-</div>
          <div className="text-center">-</div>
          <div className="text-center">-</div>
          <div className="text-center">-</div>
        </div>
      </div>
    </div>
  );
}

