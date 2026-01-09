/**
 * DraftInfo - Draft rules and information tab
 * 
 * Static content explaining draft rules, scoring, and format.
 * 
 * A-Grade Requirements:
 * - TypeScript: Full type coverage
 * - Constants: VX2 constants for colors/sizes
 * - Accessibility: Semantic HTML, proper headings
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { DRAFT_DEFAULTS, POSITION_LIMITS } from '../constants';
import { BG_COLORS, TEXT_COLORS, BORDER_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../core/constants/sizes';

// ============================================================================
// CONSTANTS
// ============================================================================

const INFO_PX = {
  sectionGap: SPACING.lg,
  itemGap: SPACING.sm,
  padding: SPACING.md,
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface DraftInfoProps {
  /** Draft settings (optional, uses defaults if not provided) */
  settings?: {
    teamCount?: number;
    rosterSize?: number;
    pickTimeSeconds?: number;
  };
  /** Initial scroll position to restore */
  initialScrollPosition?: number;
  /** Callback when scroll position changes */
  onScrollPositionChange?: (position: number) => void;
  /** Callback when tutorial button is tapped */
  onTutorial?: () => void;
  /** Callback when exit draft button is tapped */
  onLeave?: () => void;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps): React.ReactElement {
  return (
    <section
      style={{
        marginBottom: INFO_PX.sectionGap,
      }}
    >
      <h3
        style={{
          fontSize: TYPOGRAPHY.fontSize.base,
          fontWeight: TYPOGRAPHY.fontWeight.semibold,
          color: TEXT_COLORS.primary,
          marginBottom: INFO_PX.itemGap,
          padding: 0,
          margin: 0,
          marginTop: 0,
        }}
      >
        {title}
      </h3>
      <div
        style={{
          fontSize: TYPOGRAPHY.fontSize.sm,
          color: TEXT_COLORS.secondary,
          lineHeight: 1.5,
        }}
      >
        {children}
      </div>
    </section>
  );
}

interface InfoRowProps {
  label: string;
  value: string | number;
}

function InfoRow({ label, value }: InfoRowProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: `${INFO_PX.itemGap}px 0`,
        borderBottom: `1px solid ${BORDER_COLORS.light}`,
      }}
    >
      <span style={{ color: TEXT_COLORS.secondary }}>{label}</span>
      <span style={{ color: TEXT_COLORS.primary, fontWeight: TYPOGRAPHY.fontWeight.medium }}>
        {value}
      </span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DraftInfo({ 
  settings,
  initialScrollPosition = 0,
  onScrollPositionChange,
  onTutorial,
  onLeave,
}: DraftInfoProps): React.ReactElement {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Restore scroll position on mount
  useEffect(() => {
    if (scrollContainerRef.current && initialScrollPosition > 0) {
      scrollContainerRef.current.scrollTop = initialScrollPosition;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Save scroll position on scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (onScrollPositionChange) {
      onScrollPositionChange(e.currentTarget.scrollTop);
    }
  }, [onScrollPositionChange]);
  
  const teamCount = settings?.teamCount ?? DRAFT_DEFAULTS.teamCount;
  const rosterSize = settings?.rosterSize ?? DRAFT_DEFAULTS.rosterSize;
  const pickTime = settings?.pickTimeSeconds ?? DRAFT_DEFAULTS.pickTimeSeconds;
  const totalPicks = teamCount * rosterSize;
  
  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      style={{
        padding: INFO_PX.padding,
        paddingBottom: 24,
        backgroundColor: BG_COLORS.primary,
        height: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {/* Exit Draft and Tutorial Links */}
      {(onLeave || onTutorial) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: INFO_PX.sectionGap }}>
          {onLeave && (
            <button
              onClick={onLeave}
              style={{
                background: 'none',
                border: 'none',
                color: '#3B82F6',
                fontSize: TYPOGRAPHY.fontSize.base,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Exit Draft
            </button>
          )}
          {!onLeave && <div />}
          {onTutorial && (
            <button
              onClick={onTutorial}
              style={{
                background: 'none',
                border: 'none',
                color: '#3B82F6',
                fontSize: TYPOGRAPHY.fontSize.base,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Tutorial
            </button>
          )}
        </div>
      )}
      
      {/* Draft Format */}
      <Section title="Draft Format">
        <InfoRow label="Teams" value={teamCount} />
        <InfoRow label="Roster Size" value={rosterSize} />
        <InfoRow label="Total Picks" value={totalPicks} />
        <InfoRow label="Pick Time" value={`${pickTime} seconds`} />
        <InfoRow label="Draft Order" value="Snake" />
      </Section>
      
      {/* Roster Requirements */}
      <Section title="Roster Construction">
        <p style={{ marginBottom: INFO_PX.itemGap }}>
          Best Ball format - no weekly lineup decisions. Top scorers at each position are automatically counted.
        </p>
        <InfoRow label="QB" value={`${POSITION_LIMITS.QB.min}-${POSITION_LIMITS.QB.max} (rec: ${POSITION_LIMITS.QB.recommended})`} />
        <InfoRow label="RB" value={`${POSITION_LIMITS.RB.min}-${POSITION_LIMITS.RB.max} (rec: ${POSITION_LIMITS.RB.recommended})`} />
        <InfoRow label="WR" value={`${POSITION_LIMITS.WR.min}-${POSITION_LIMITS.WR.max} (rec: ${POSITION_LIMITS.WR.recommended})`} />
        <InfoRow label="TE" value={`${POSITION_LIMITS.TE.min}-${POSITION_LIMITS.TE.max} (rec: ${POSITION_LIMITS.TE.recommended})`} />
      </Section>
      
      {/* Starting Lineup */}
      <Section title="Weekly Lineup (Auto-Set)">
        <p>Each week, your highest-scoring players are automatically slotted:</p>
        <ul
          style={{
            margin: `${INFO_PX.itemGap}px 0`,
            paddingLeft: 20,
          }}
        >
          <li>1 QB</li>
          <li>2 RB</li>
          <li>3 WR</li>
          <li>1 TE</li>
          <li>1 FLEX (RB/WR/TE)</li>
        </ul>
      </Section>
      
      {/* Snake Draft */}
      <Section title="Snake Draft Order">
        <p>
          Pick order reverses each round. If you pick 1st in Round 1, you pick 12th in Round 2, then 1st again in Round 3.
        </p>
        <p style={{ marginTop: INFO_PX.itemGap }}>
          This balances draft advantage across all positions.
        </p>
      </Section>
      
      {/* Timer */}
      <Section title="Pick Timer">
        <p>
          You have {pickTime} seconds to make each pick. If the timer expires, the highest-ranked player in your queue (or by ADP if queue is empty) will be automatically selected.
        </p>
      </Section>
      
      {/* Queue */}
      <Section title="Using the Queue">
        <p>
          Add players to your queue to prioritize them. If you run out of time, your first available queued player will be drafted automatically.
        </p>
        <p style={{ marginTop: INFO_PX.itemGap }}>
          Drag to reorder your queue at any time. Players are removed from your queue when they are drafted by anyone.
        </p>
      </Section>
    </div>
  );
}

