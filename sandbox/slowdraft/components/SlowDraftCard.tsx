/**
 * SlowDraftCard - Rich mini-dashboard for slow drafts
 *
 * Transforms each draft into a visual fingerprint with:
 * - Roster strip for instant recognition
 * - Position needs at a glance
 * - Notable events feed
 * - Quick actions without entering draft room
 *
 * Supports collapsed (compact) and expanded (full detail) states.
 */

import React from 'react';

import {
  SLOW_DRAFT_LAYOUT,
  SLOW_DRAFT_COLORS,
  SLOW_DRAFT_TYPOGRAPHY,
  SLOW_DRAFT_THRESHOLDS,
  SLOW_DRAFT_ANIMATIONS,
} from '../constants';
import { RADIUS } from '../deps/core/constants/sizes';
import type { SlowDraftCardProps, SlowDraft } from '../types';

import MyRosterStrip from './MyRosterStrip';
import PositionNeedsIndicator from './PositionNeedsIndicator';
import styles from './SlowDraftCard.module.css';

// ============================================================================
// HELPERS
// ============================================================================

function formatTimeRemaining(seconds: number): { text: string; isUrgent: boolean; isCritical: boolean } {
  // Cap display at 12 hours (43200 seconds)
  const displaySeconds = Math.min(seconds, 43200);
  const hours = Math.floor(displaySeconds / 3600);
  const minutes = Math.floor((displaySeconds % 3600) / 60);

  let text: string;
  if (hours > 0) {
    text = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    text = `${minutes}m`;
  } else {
    text = '<1m';
  }

  return {
    text,
    isUrgent: seconds < SLOW_DRAFT_THRESHOLDS.timerWarning,
    isCritical: seconds < SLOW_DRAFT_THRESHOLDS.timerCritical,
  };
}

function formatPickInfo(draft: SlowDraft): string {
  const round = draft.currentRound;
  const pickInRound = ((draft.pickNumber - 1) % draft.teamCount) + 1;
  return `Pick ${round}.${pickInRound.toString().padStart(2, '0')}`;
}

function getTimerColor(timeInfo: { isUrgent: boolean; isCritical: boolean }): string {
  if (timeInfo.isCritical) return SLOW_DRAFT_COLORS.timer.critical;
  if (timeInfo.isUrgent) return SLOW_DRAFT_COLORS.timer.warning;
  return SLOW_DRAFT_COLORS.timer.normal;
}

// ============================================================================
// PROGRESS BAR
// ============================================================================

interface DraftProgressBarProps {
  currentRound: number;
  totalRounds: number;
  isYourTurn: boolean;
}

function DraftProgressBar({ currentRound, totalRounds, isYourTurn }: DraftProgressBarProps): React.ReactElement {
  const progress = (currentRound / totalRounds) * 100;

  return (
    <div className={styles.progressBar}>
      {/* Track */}
      <div className={styles.progressTrack}>
        {/* Fill */}
        <div
          className={`${styles.progressFill} ${
            isYourTurn ? styles.progressFillYourTurn : styles.progressFillDefault
          }`}
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      {/* Round indicator */}
      <div className={styles.roundIndicator}>
        <span className={styles.roundLabel}>
          Round {currentRound}/{totalRounds}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// ON THE CLOCK BADGE
// ============================================================================

function OnTheClockBadge(): React.ReactElement {
  return (
    <span className={styles.onTheClockBadge}>
      <span>YOUR</span>
      <span>TURN</span>
    </span>
  );
}

// ============================================================================
// QUICK ACTIONS (Expanded)
// ============================================================================

interface QuickActionsProps {
  draft: SlowDraft;
  onEnterDraft: () => void;
  onQuickPick?: (playerId: string) => void;
}

function QuickActions({ draft, onEnterDraft, onQuickPick }: QuickActionsProps): React.ReactElement {
  const topAvailable = draft.topAvailable;
  const urgentNeed = draft.positionNeeds.find(
    (n) => n.urgency === 'critical' || n.urgency === 'warning'
  );

  // Get best player at urgent need position
  let recommendedPlayer = null;
  if (urgentNeed && topAvailable && topAvailable[urgentNeed.position]?.length > 0) {
    recommendedPlayer = topAvailable[urgentNeed.position][0];
  }

  return (
    <div className={styles.quickActions}>
      {/* Enter Draft button */}
      <button
        onClick={onEnterDraft}
        className={`${styles.actionButton} ${styles.actionButtonDefault}`}
      >
        Enter Draft
      </button>

      {/* Quick Pick button (only if your turn and we have a recommendation) */}
      {draft.status === 'your-turn' && recommendedPlayer && onQuickPick && (
        <button
          onClick={() => onQuickPick(recommendedPlayer.id)}
          className={`${styles.actionButton} ${styles.actionButtonActive}`}
        >
          Quick Pick: {recommendedPlayer.name.split(' ').pop()}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SlowDraftCard({
  draft,
  isExpanded,
  onToggleExpand,
  onEnterDraft,
  onQuickPick,
}: SlowDraftCardProps): React.ReactElement {
  const isYourTurn = draft.status === 'your-turn';

  // Timer info
  const timeInfo = draft.timeLeftSeconds
    ? formatTimeRemaining(draft.timeLeftSeconds)
    : null;

  return (
    <div
      className={`${styles.card} ${isYourTurn ? styles.cardYourTurn : styles.cardDefault}`}
      style={{
        borderRadius: SLOW_DRAFT_LAYOUT.cardBorderRadius,
        padding: SLOW_DRAFT_LAYOUT.cardPaddingX,
      }}
    >

      {/* Content wrapper */}
      <div className={styles.contentWrapper}>
        {/* ============================================================ */}
        {/* HEADER: Tournament name + Timer/Status */}
        {/* ============================================================ */}
        <button
          onClick={onToggleExpand}
          className={styles.headerButton}
        >
          <div className={styles.headerContainer}>
            {/* Left: Name and pick info */}
            <div className={styles.titleSection}>
              <h3 className={styles.tournamentName}>
                {draft.tournamentName}
              </h3>
              <p className={styles.pickInfo}>
                {formatPickInfo(draft)}
              </p>
            </div>

            {/* Right: Timer or status */}
            <div className={styles.statusContainer}>
              {isYourTurn ? (
                <OnTheClockBadge />
              ) : (
                <div>
                  {draft.picksAway > 0 && (
                    <span className={styles.picksAwayText}>
                      {draft.picksAway} pick{draft.picksAway !== 1 ? 's' : ''} away
                    </span>
                  )}
                  {timeInfo && (
                    <div
                      className={styles.timerText}
                      style={{
                        color: getTimerColor(timeInfo),
                      }}
                    >
                      ⏱ {timeInfo.text}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </button>

        {/* ============================================================ */}
        {/* COLLAPSED VIEW */}
        {/* ============================================================ */}
        {!isExpanded && (
          <button
            onClick={onToggleExpand}
            className="w-full text-left"
            style={{ marginTop: SLOW_DRAFT_LAYOUT.sectionGap }}
          >
            {/* Roster strip (compact) - hidden for TopDog International 6 */}
            {draft.tournamentName !== 'TopDog International 6' && (
              <div className={styles.rosterSection}>
                <div className={styles.sectionLabel}>
                  MY ROSTER
                </div>
                <MyRosterStrip
                  picks={draft.myPicks}
                  rosterSize={18}
                  compact={true}
                />
              </div>
            )}

            {/* Position needs (compact) */}
            <PositionNeedsIndicator
              needs={draft.positionNeeds}
              compact={true}
            />

            {/* Progress bar */}
            <DraftProgressBar
              currentRound={draft.currentRound}
              totalRounds={draft.totalRounds}
              isYourTurn={isYourTurn}
            />
          </button>
        )}

        {/* ============================================================ */}
        {/* EXPANDED VIEW */}
        {/* ============================================================ */}
        {isExpanded && (
          <div
            className={styles.expandedContent}
            style={{
              animation: `slideDown ${SLOW_DRAFT_ANIMATIONS.expandDuration}ms ${SLOW_DRAFT_ANIMATIONS.expandEasing}`,
            }}
          >
            {/* Roster strip (expanded with player names) - hidden for TopDog International 6 */}
            {draft.tournamentName !== 'TopDog International 6' && (
              <div className={styles.sectionGap}>
                <MyRosterStrip
                  picks={draft.myPicks}
                  rosterSize={18}
                  compact={false}
                />
              </div>
            )}

            {/* Position needs (expanded) */}
            <div className={styles.sectionGap}>
              <PositionNeedsIndicator
                needs={draft.positionNeeds}
                compact={false}
              />
            </div>

            {/* Progress bar */}
            <DraftProgressBar
              currentRound={draft.currentRound}
              totalRounds={draft.totalRounds}
              isYourTurn={isYourTurn}
            />

            {/* Quick actions */}
            <QuickActions
              draft={draft}
              onEnterDraft={onEnterDraft}
              onQuickPick={onQuickPick}
            />
          </div>
        )}

        {/* Expand/collapse indicator */}
        <div className={styles.expandIcon}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`${styles.expandIconSvg} ${isExpanded ? styles.expandIconOpen : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </div>
  );
}
