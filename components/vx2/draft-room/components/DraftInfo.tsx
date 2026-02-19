/**
 * DraftInfo - Draft rules and information tab
 *
 * Static content explaining draft rules, scoring, and format.
 *
 * A-Grade Requirements:
 * - TypeScript: Full type coverage
 * - Constants: VX2 constants for colors/sizes
 * - Accessibility: Semantic HTML, proper headings
 * - CSP Compliance: CSS Modules with no inline styles
 */

import React, { useRef, useEffect, useCallback } from 'react';

import { cn } from '@/lib/styles';

import { DRAFT_DEFAULTS, POSITION_LIMITS } from '../constants';

import styles from './DraftInfo.module.css';

// ============================================================================
// CONSTANTS
// ============================================================================

// CSS custom properties are defined in the CSS Module using spacing tokens

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
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>
        {title}
      </h3>
      <div className={styles.sectionContent}>
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
    <div className={styles.infoRow}>
      <span className={styles.infoRowLabel}>{label}</span>
      <span className={styles.infoRowValue}>
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
      className={styles.container}
    >
      {/* Exit Draft and Tutorial Links */}
      {(onLeave || onTutorial) && (
        <div className={styles.actionsBar}>
          {onLeave && (
            <button
              onClick={onLeave}
              className={styles.actionButton}
            >
              Exit Draft
            </button>
          )}
          {!onLeave && <div className={styles.actionSpacer} />}
          {onTutorial && (
            <button
              onClick={onTutorial}
              className={styles.actionButton}
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
        <p>
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
        <ul>
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
        <p>
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
        <p>
          Drag to reorder your queue at any time. Players are removed from your queue when they are drafted by anyone.
        </p>
      </Section>
    </div>
  );
}

