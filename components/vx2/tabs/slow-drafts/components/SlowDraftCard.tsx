/**
 * SlowDraftCard - Rich mini-dashboard for slow drafts
 *
 * Transforms each draft into a visual fingerprint with:
 * - Roster strip for instant recognition
 * - Position needs at a glance
 * - Quick actions without entering draft room
 *
 * Supports collapsed (compact) and expanded (full detail) states.
 */

import React from 'react';
import type { SlowDraftCardProps, SlowDraft } from '../types';
import {
  SLOW_DRAFT_LAYOUT,
  SLOW_DRAFT_COLORS,
  SLOW_DRAFT_TYPOGRAPHY,
  SLOW_DRAFT_THRESHOLDS,
  SLOW_DRAFT_ANIMATIONS,
} from '../constants';
import { TILED_BG_STYLE } from '../../../draft-room/constants';
import { RADIUS } from '../../../core/constants/sizes';
import { TEXT_COLORS, STATE_COLORS } from '../../../core/constants/colors';

import MyRosterStrip from './MyRosterStrip';
import PositionNeedsIndicator from './PositionNeedsIndicator';

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
    <div className="relative" style={{ marginTop: 12 }}>
      {/* Track */}
      <div
        style={{
          height: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
        }}
      >
        {/* Fill */}
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: isYourTurn ? '#FFFFFF' : STATE_COLORS.active,
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Round indicator */}
      <div
        className="flex justify-between items-center"
        style={{ marginTop: 6 }}
      >
        <span
          style={{
            fontSize: 11,
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: 500,
          }}
        >
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
    <span
      className="inline-flex flex-col items-center font-bold uppercase tracking-wider"
      style={{
        ...TILED_BG_STYLE,
        color: '#FFFFFF',
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 4,
        paddingBottom: 4,
        borderRadius: 8,
        fontSize: 10,
        lineHeight: 1.2,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      }}
    >
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
    <div
      className="flex gap-3"
      style={{ marginTop: SLOW_DRAFT_LAYOUT.sectionGap }}
    >
      {/* Enter Draft button */}
      <button
        onClick={onEnterDraft}
        className="flex-1 font-semibold transition-all active:scale-[0.98]"
        style={{
          height: 44,
          borderRadius: RADIUS.lg,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: TEXT_COLORS.primary,
          fontSize: 14,
        }}
      >
        Enter Draft
      </button>

      {/* Quick Pick button (only if your turn and we have a recommendation) */}
      {draft.status === 'your-turn' && recommendedPlayer && onQuickPick && (
        <button
          onClick={() => onQuickPick(recommendedPlayer.id)}
          className="flex-1 font-semibold transition-all active:scale-[0.98]"
          style={{
            height: 44,
            borderRadius: RADIUS.lg,
            backgroundColor: STATE_COLORS.active,
            color: '#FFFFFF',
            fontSize: 14,
          }}
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

  // Card background and border based on state
  const cardStyle = isYourTurn
    ? {
        backgroundColor: SLOW_DRAFT_COLORS.card.default,
        border: `1px solid ${SLOW_DRAFT_COLORS.card.yourTurnBorder}`,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
      }
    : {
        backgroundColor: SLOW_DRAFT_COLORS.card.default,
        border: `1px solid ${SLOW_DRAFT_COLORS.card.defaultBorder}`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      };

  return (
    <div
      className="relative overflow-hidden transition-all"
      style={{
        ...cardStyle,
        borderRadius: SLOW_DRAFT_LAYOUT.cardBorderRadius,
        padding: SLOW_DRAFT_LAYOUT.cardPaddingX,
      }}
    >

      {/* Content wrapper */}
      <div className="relative z-10">
        {/* ============================================================ */}
        {/* HEADER: Tournament name + Timer/Status */}
        {/* ============================================================ */}
        <button
          onClick={onToggleExpand}
          className="w-full text-left"
        >
          <div className="flex items-start justify-between gap-3">
            {/* Left: Name and pick info */}
            <div className="flex-1 min-w-0">
              <h3
                style={{
                  ...SLOW_DRAFT_TYPOGRAPHY.tournamentName,
                  color: '#FFFFFF',
                  marginBottom: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {draft.tournamentName}
              </h3>
              <p style={{ color: SLOW_DRAFT_TYPOGRAPHY.pickInfo.color }}>
                {formatPickInfo(draft)}
              </p>
            </div>

            {/* Right: Timer or status */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {isYourTurn ? (
                <div className="flex flex-col items-end gap-1">
                  <OnTheClockBadge />
                  {timeInfo && (
                    <div
                      style={{
                        ...SLOW_DRAFT_TYPOGRAPHY.timer,
                        color: getTimerColor(timeInfo),
                        fontSize: 14,
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                    >
                      {timeInfo.text}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-right">
                  {draft.picksAway > 0 && (
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'rgba(255, 255, 255, 0.6)',
                      }}
                    >
                      {draft.picksAway} pick{draft.picksAway !== 1 ? 's' : ''} away
                    </span>
                  )}
                  {timeInfo && (
                    <div
                      style={{
                        ...SLOW_DRAFT_TYPOGRAPHY.timer,
                        fontSize: 14,
                        fontWeight: 600,
                        color: getTimerColor(timeInfo),
                        marginTop: 2,
                        lineHeight: 1,
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
            {/* Roster strip (compact) */}
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  ...SLOW_DRAFT_TYPOGRAPHY.sectionLabel,
                  marginBottom: 6,
                }}
              >
                MY ROSTER
              </div>
              <MyRosterStrip
                picks={draft.myPicks}
                rosterSize={18}
                compact={true}
              />
            </div>

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
            style={{
              marginTop: SLOW_DRAFT_LAYOUT.sectionGap,
              animation: `slideDown ${SLOW_DRAFT_ANIMATIONS.expandDuration}ms ${SLOW_DRAFT_ANIMATIONS.expandEasing}`,
            }}
          >
            {/* Roster strip (expanded with player names) */}
            <div style={{ marginBottom: SLOW_DRAFT_LAYOUT.sectionGap }}>
              <MyRosterStrip
                picks={draft.myPicks}
                rosterSize={18}
                compact={false}
              />
            </div>

            {/* Position needs (expanded) */}
            <div style={{ marginBottom: SLOW_DRAFT_LAYOUT.sectionGap }}>
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
        <div
          className="flex justify-center"
          style={{ marginTop: 8 }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              color: 'rgba(255, 255, 255, 0.3)',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </div>
  );
}
