/**
 * DraftInfoVX - Version X Draft Info Panel (TypeScript)
 * 
 * Migrated from: components/draft/v3/mobile/apple/DraftRoomApple.js (Info tab section)
 * 
 * Shows tournament and draft information:
 * - Draft details (entry, entrants, prizes)
 * - Tournament info
 * - Prize breakdown
 * - Scoring settings
 * - Roster configuration
 * - Tournament schedule
 */

import React from 'react';
import { Button } from '../../shared';

// ============================================================================
// PIXEL CONSTANTS
// ============================================================================

const INFO_PX = {
  // Container
  containerPaddingX: 16,
  containerPaddingTop: 0,
  containerPaddingBottom: 64,
  
  // Card
  cardPadding: 16,
  cardMarginBottom: 16,
  cardBorderRadius: 8,
  cardTitleFontSize: 18,
  cardTitleMarginBottom: 12,
  
  // Round advancement
  roundAdvancementMarginBottom: 16,
  roundAdvancementLabelMarginBottom: 4,
  
  // Grid layouts
  gridGapX: 24,
  gridGapY: 12,
  gridItemGapY: 12,
  prizeGridGapX: 16,
  prizeGridGapY: 4,
  rosterGridCols: 3,
  
  // Text
  bodyFontSize: 14,
  labelFontSize: 14,
  valueFontSize: 14,
  
  // Button container
  buttonContainerPaddingBottom: 40,
} as const;

const INFO_COLORS = {
  background: '#101927',
  cardBg: 'rgba(31, 41, 55, 0.4)',
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface DraftInfoVXProps {
  /** Callback when Full Rules button is clicked */
  onShowRules?: () => void;
  /** Tournament data (optional - uses defaults if not provided) */
  tournament?: TournamentInfo;
}

interface TournamentInfo {
  entry: string;
  entrants: string;
  prizes: string;
  sport: string;
  fill: string;
  rake: string;
  gameType: string;
  draftRounds: number;
  tournamentRounds: number;
  maxEntries: number;
  draftSize: number;
  startTime: string;
  roundAdvancement: string;
}

// ============================================================================
// DEFAULT DATA
// ============================================================================

const DEFAULT_TOURNAMENT: TournamentInfo = {
  entry: '$25',
  entrants: '672,672',
  prizes: '$15M',
  sport: 'NFL',
  fill: '100%',
  rake: '10.8%',
  gameType: 'NFL Best Ball',
  draftRounds: 18,
  tournamentRounds: 4,
  maxEntries: 150,
  draftSize: 12,
  startTime: '9/04/25 8:00PM EDT',
  roundAdvancement: '2/12 - 1/13 - 1/16 - 539 Seat Final',
};

const PRIZE_BREAKDOWN_LEFT = [
  { place: '1st:', prize: '$2,000,000' },
  { place: '2nd:', prize: '$1,000,000' },
  { place: '3rd:', prize: '$504,370' },
  { place: '4th:', prize: '$400,000' },
  { place: '5th:', prize: '$300,000' },
  { place: '6th:', prize: '$250,000' },
  { place: '7th:', prize: '$200,000' },
  { place: '8th:', prize: '$175,000' },
  { place: '9th:', prize: '$150,000' },
  { place: '10th:', prize: '$125,000' },
  { place: '11 - 15th:', prize: '$100,000' },
  { place: '16 - 20th:', prize: '$70,000' },
  { place: '21 - 30th:', prize: '$50,000' },
];

const PRIZE_BREAKDOWN_RIGHT = [
  { place: '31 - 40th:', prize: '$30,000' },
  { place: '41 - 50th:', prize: '$15,000' },
  { place: '51 - 100th:', prize: '$10,000' },
  { place: '101 - 200th:', prize: '$7,000' },
  { place: '201 - 300th:', prize: '$5,000' },
  { place: '301 - 539th:', prize: '$3,750' },
  { place: '540 - 1078th:', prize: '$1,000' },
  { place: '1079 - 1617th:', prize: '$500' },
  { place: '1618 - 2156th:', prize: '$250' },
  { place: '2157 - 2695th:', prize: '$100' },
  { place: '2696 - 8624th:', prize: '$70' },
  { place: '8625 - 112112th:', prize: '$25' },
];

const SCORING_LEFT = [
  { stat: 'Reception', points: '0.5' },
  { stat: 'Receiving TD', points: '6.0' },
  { stat: 'Receiving Yard', points: '0.1' },
  { stat: 'Rushing TD', points: '6.0' },
  { stat: 'Rushing Yard', points: '0.1' },
];

const SCORING_RIGHT = [
  { stat: 'Passing Yard', points: '0.05' },
  { stat: 'Passing TD', points: '4.0' },
  { stat: 'Interception', points: '-1.0' },
  { stat: '2-PT Conversion', points: '2.0' },
  { stat: 'Fumble Lost', points: '-2.0' },
];

const ROSTER_CONFIG = [
  { position: 'QB', count: '1' },
  { position: 'RB', count: '2' },
  { position: 'WR', count: '3' },
  { position: 'TE', count: '1' },
  { position: 'FLEX', count: '2' },
  { position: 'BENCH', count: '9' },
];

const TOURNAMENT_SCHEDULE = [
  { round: 'Qualifiers:', weeks: 'Weeks 1-14' },
  { round: 'Quarterfinals:', weeks: 'Week 15' },
  { round: 'Semifinals:', weeks: 'Week 16' },
  { round: 'Championship:', weeks: 'Week 17' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DraftInfoVX({
  onShowRules,
  tournament = DEFAULT_TOURNAMENT,
}: DraftInfoVXProps): React.ReactElement {
  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: INFO_COLORS.background }}>
      <div 
        className="flex-1 overflow-y-auto"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div 
          className="text-center"
          style={{
            paddingLeft: `${INFO_PX.containerPaddingX}px`,
            paddingRight: `${INFO_PX.containerPaddingX}px`,
            paddingTop: `${INFO_PX.containerPaddingTop}px`,
            paddingBottom: `${INFO_PX.containerPaddingBottom}px`,
          }}
        >
            
          {/* Draft Details */}
          <InfoCard title="Draft Details">
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${INFO_PX.prizeGridGapY * 2}px`, fontSize: `${INFO_PX.bodyFontSize}px` }}>
              <InfoRow label="Entry:" value={tournament.entry} />
              <InfoRow label="Entrants:" value={tournament.entrants} />
              <InfoRow label="Prizes:" value={tournament.prizes} />
            </div>
          </InfoCard>

          {/* Basic Tournament Info */}
          <InfoCard title="Basic tournament info">
            {/* Round Advancement - Full Width */}
            <div style={{ marginBottom: `${INFO_PX.roundAdvancementMarginBottom}px` }}>
              <div style={{ color: INFO_COLORS.textSecondary, marginBottom: `${INFO_PX.roundAdvancementLabelMarginBottom}px` }}>Round Advancement:</div>
              <div style={{ color: INFO_COLORS.textPrimary }}>{tournament.roundAdvancement}</div>
            </div>

            {/* Two Column Layout */}
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                columnGap: `${INFO_PX.gridGapX}px`, 
                rowGap: `${INFO_PX.gridGapY}px`,
                fontSize: `${INFO_PX.bodyFontSize}px`,
              }}
            >
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${INFO_PX.gridItemGapY}px` }}>
                <InfoItem label="Sport" value={tournament.sport} />
                <InfoItem label="Fill" value={tournament.fill} />
                <InfoItem label="Rake" value={tournament.rake} />
                <InfoItem label="Game type" value={tournament.gameType} />
                <InfoItem label="Draft rounds" value={String(tournament.draftRounds)} />
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${INFO_PX.gridItemGapY}px` }}>
                <InfoItem label="Current entrants" value={tournament.entrants} />
                <InfoItem label="Tournament rounds" value={String(tournament.tournamentRounds)} />
                <InfoItem label="Max entries" value={String(tournament.maxEntries)} />
                <InfoItem label="Draft size" value={String(tournament.draftSize)} />
                <InfoItem label="Start time" value={tournament.startTime} />
              </div>
            </div>
          </InfoCard>

          {/* Tournament Prize Breakdown */}
          <InfoCard title="Tournament prize breakdown">
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                columnGap: `${INFO_PX.prizeGridGapX}px`, 
                rowGap: `${INFO_PX.prizeGridGapY}px`,
                fontSize: `${INFO_PX.bodyFontSize}px`,
              }}
            >
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${INFO_PX.prizeGridGapY}px` }}>
                {PRIZE_BREAKDOWN_LEFT.map((item, idx) => (
                  <InfoRow key={idx} label={item.place} value={item.prize} />
                ))}
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${INFO_PX.prizeGridGapY}px` }}>
                {PRIZE_BREAKDOWN_RIGHT.map((item, idx) => (
                  <InfoRow key={idx} label={item.place} value={item.prize} />
                ))}
              </div>
            </div>
          </InfoCard>

          {/* Scoring Settings */}
          <InfoCard title="Scoring">
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                columnGap: `${INFO_PX.gridGapX}px`, 
                rowGap: `${INFO_PX.gridGapY}px`,
                fontSize: `${INFO_PX.bodyFontSize}px`,
              }}
            >
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${INFO_PX.gridItemGapY}px` }}>
                {SCORING_LEFT.map((item, idx) => (
                  <InfoItem key={idx} label={item.stat} value={item.points} />
                ))}
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${INFO_PX.gridItemGapY}px` }}>
                {SCORING_RIGHT.map((item, idx) => (
                  <InfoItem key={idx} label={item.stat} value={item.points} />
                ))}
              </div>
            </div>
          </InfoCard>

          {/* Roster Configuration */}
          <InfoCard title="Roster">
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: `repeat(${INFO_PX.rosterGridCols}, 1fr)`, 
                columnGap: `${INFO_PX.gridGapX}px`, 
                rowGap: `${INFO_PX.gridGapY}px`,
                fontSize: `${INFO_PX.bodyFontSize}px`,
              }}
            >
              {ROSTER_CONFIG.map((item, idx) => (
                <div key={idx} style={{ textAlign: 'center' }}>
                  <div style={{ color: INFO_COLORS.textSecondary }}>{item.position}</div>
                  <div style={{ color: INFO_COLORS.textPrimary }}>{item.count}</div>
                </div>
              ))}
            </div>
          </InfoCard>

          {/* Tournament Schedule */}
          <InfoCard title="Tournament schedule">
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${INFO_PX.prizeGridGapY * 2}px`, fontSize: `${INFO_PX.bodyFontSize}px` }}>
              {TOURNAMENT_SCHEDULE.map((item, idx) => (
                <InfoRow key={idx} label={item.round} value={item.weeks} />
              ))}
            </div>
          </InfoCard>

          {/* Rules Button */}
          <div className="flex justify-center" style={{ paddingBottom: `${INFO_PX.buttonContainerPaddingBottom}px` }}>
            <Button onClick={onShowRules} variant="primary" size="lg">
              Full Rules
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
}

function InfoCard({ title, children }: InfoCardProps): React.ReactElement {
  return (
    <div 
      style={{
        backgroundColor: INFO_COLORS.cardBg,
        borderRadius: `${INFO_PX.cardBorderRadius}px`,
        padding: `${INFO_PX.cardPadding}px`,
        marginBottom: `${INFO_PX.cardMarginBottom}px`,
        textAlign: 'left',
      }}
    >
      <h3 
        className="font-medium"
        style={{
          fontSize: `${INFO_PX.cardTitleFontSize}px`,
          color: INFO_COLORS.textPrimary,
          marginBottom: `${INFO_PX.cardTitleMarginBottom}px`,
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps): React.ReactElement {
  return (
    <div className="flex justify-between">
      <span style={{ color: INFO_COLORS.textSecondary }}>{label}</span>
      <span style={{ color: INFO_COLORS.textPrimary }}>{value}</span>
    </div>
  );
}

interface InfoItemProps {
  label: string;
  value: string;
}

function InfoItem({ label, value }: InfoItemProps): React.ReactElement {
  return (
    <div>
      <div style={{ color: INFO_COLORS.textSecondary }}>{label}</div>
      <div style={{ color: INFO_COLORS.textPrimary }}>{value}</div>
    </div>
  );
}

