/**
 * JoinTournamentModal - Enhanced Tournament Entry Modal
 * 
 * Features:
 * - Multi-entry support (1-150 entries)
 * - Autopilot toggle
 * - Dynamic total cost calculation
 * - Collapsible tournament details (scoring, roster)
 * - Rules modal integration
 * 
 * @example
 * ```tsx
 * <JoinTournamentModal
 *   tournament={selectedTournament}
 *   onClose={handleClose}
 *   onConfirm={handleConfirm}
 *   isJoining={isJoining}
 * />
 * ```
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/styles';
import { usePhoneFramePortal } from '@/lib/usePhoneFramePortal';

import TournamentRulesModal from '../../../mobile/modals/TournamentRulesModal';
import { Switch } from '../../../ui';
import { ProgressBar } from '../../../ui';
import { Close, Plus } from '../../components/icons';
import { LOBBY_THEME, TEXT_COLORS, BG_COLORS } from '../../core/constants/colors';
import { TYPOGRAPHY } from '../../core/constants/sizes';
import { type Tournament, useUser } from '../../hooks/data';
import { useModals } from '../../shell/useModalsContext';
import { formatCents } from '../../utils/formatting';

import styles from './JoinTournamentModal.module.css';



// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_ENTRIES = 150;
const WR_BLUE_BG = 'url(/square_background.png) center center / cover no-repeat';

// Bottom section constants (matching TournamentCardBottomSectionV2)
// Uses CSS custom properties (--spacing-lg, --spacing-xl) for spacing
const ROW_HEIGHTS = {
  progress: 8,
  button: 57,
  stats: 48,
} as const;

const BOTTOM_SECTION_SPACING = {
  rowGap: 16, // --spacing-lg
  statsGap: 24, // --spacing-xl
} as const;

const BOTTOM_SECTION_TYPOGRAPHY = {
  buttonFontSize: 14,
  statsValueFontSize: 18,
  statsLabelFontSize: 12,
} as const;

/** Bottom section colors from LOBBY_THEME / BG_COLORS (core/constants/colors) */
const BOTTOM_SECTION_COLORS = {
  textPrimary: LOBBY_THEME.cardTextPrimary,
  textSecondary: LOBBY_THEME.cardTextSecondary,
  statBackground: BG_COLORS.black,
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface JoinTournamentModalProps {
  /** Tournament to join */
  tournament: Tournament;
  /** Close modal handler */
  onClose: () => void;
  /** Confirm join handler with entry options */
  onConfirm: (options: { entries: number; draftSpeed: 'fast' | 'slow' }) => void;
  /** Whether join is in progress */
  isJoining: boolean;
  /** Custom text boxes to display at the bottom of the modal */
  bottomTextBoxes?: Array<{ id?: number | string; text: string; onChange?: (value: string) => void }>;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function InfoRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }): React.ReactElement {
  return (
    <div className={styles.statItem}>
      <span className={styles.statItemValue}>{value}</span>
      <span className={styles.statItemLabel}>{label}</span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function JoinTournamentModal({ 
  tournament, 
  onClose, 
  onConfirm, 
  isJoining,
  bottomTextBoxes = [],
}: JoinTournamentModalProps): React.ReactElement {
  // Hooks
  const { user } = useUser();
  const modals = useModals();
  const { portalRoot } = usePhoneFramePortal();
  
  // State
  const [numberOfEntries, setNumberOfEntries] = useState(1);
  const [draftSpeed, setDraftSpeed] = useState<'fast' | 'slow'>('fast');
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Calculated values
  const totalCostCents = tournament.entryFeeCents * numberOfEntries;
  const userBalanceCents = user?.balanceCents ?? 0;
  const hasInsufficientBalance = totalCostCents > userBalanceCents;
  
  // Progress bar calculation
  const hasProgress = Boolean(tournament.maxEntries);
  const fillPercentage = tournament.maxEntries
    ? Math.round((tournament.currentEntries / tournament.maxEntries) * 100)
    : 0;
  
  // Text boxes check
  const hasTextBoxes = bottomTextBoxes && bottomTextBoxes.length > 0 && bottomTextBoxes.some(box => box.text && box.text.trim());
  const textBoxesHeight = hasTextBoxes ? 60 : 0;

  // Handlers
  const handleEntriesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setNumberOfEntries(Math.min(MAX_ENTRIES, Math.max(1, value)));
  };

  const handleConfirm = () => {
    onConfirm({ entries: numberOfEntries, draftSpeed });
  };

  const modalContent = (
    <>
      <div
        className={styles.overlay}
        onClick={onClose}
      >
        <div
          className={styles.modalContainer}
          onClick={e => e.stopPropagation()}
        >
          {/* Blue outline wrapper - auth modal branding */}
          <div className={styles.blueOutline} aria-hidden="true" />

          {/* Close button - absolute positioned */}
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close modal"
          >
            <Close size={16} />
          </button>

          {/* Scrollable Content */}
          <div className={styles.scrollableContent}>
            {/* Tournament Title - Split last word to second line */}
            <h3 className={styles.tournamentTitle}>
              {(() => {
                const words = tournament.title.split(' ');
                if (words.length > 1) {
                  const lastWord = words.pop();
                  return (
                    <>
                      <span>{words.join(' ')}</span>
                      <br />
                      <span>{lastWord}</span>
                    </>
                  );
                }
                return tournament.title;
              })()}
            </h3>

          {/* Account Balance Section */}
          {/* Note: Mobile app requires authentication, so user will always exist */}
          {user && (
            <div
              className={cn(
                styles.balanceSection,
                hasInsufficientBalance && styles.insufficientBalance
              )}
            >
              <div className={styles.balanceRow}>
                <div className={styles.balanceInfo}>
                  <div className={styles.balanceLabel}>
                    Account Balance
                  </div>
                  <div
                    className={cn(
                      styles.balanceAmount,
                      hasInsufficientBalance && styles.insufficientBalance
                    )}
                  >
                    {user.balanceFormatted ?? '$0.00'}
                  </div>
                </div>
                <button
                  onClick={() => modals?.openDeposit()}
                  className={styles.depositButton}
                >
                  <Plus size={12} color={TEXT_COLORS.primary} />
                  Deposit
                </button>
              </div>
              {hasInsufficientBalance && (
                <div className={styles.insufficientBalanceMessage}>
                  Insufficient balance for {numberOfEntries} {numberOfEntries === 1 ? 'entry' : 'entries'}
                </div>
              )}
            </div>
          )}

            {/* Entry Controls */}
            <div className={styles.entryControls}>
              {/* Number of Entries Row */}
              <div className={styles.entryRow}>
                <label className={styles.entryLabel}>
                  Number of entries
                </label>
                <div className={styles.entryInputWrapper}>
                  <input
                    type="number"
                    min={1}
                    max={MAX_ENTRIES}
                    value={numberOfEntries}
                    onChange={handleEntriesChange}
                    className={styles.entryInput}
                    aria-label="Number of entries"
                  />
                  <span className={styles.entryMax}>
                    Max: {MAX_ENTRIES}
                  </span>
                </div>
              </div>

            </div>

            {/* Draft Speed Row */}
            <div className={styles.draftSpeedRow}>
              <div className={styles.draftSpeedButtons}>
                <button
                  type="button"
                  className={`${styles.draftSpeedButton} ${draftSpeed === 'fast' ? styles.draftSpeedButtonActive : ''}`}
                  onClick={() => setDraftSpeed('fast')}
                >
                  Fast <span className={styles.draftSpeedTime}>30s</span>
                </button>
                <button
                  type="button"
                  className={`${styles.draftSpeedButton} ${draftSpeed === 'slow' ? styles.draftSpeedButtonActive : ''}`}
                  onClick={() => setDraftSpeed('slow')}
                >
                  Slow <span className={styles.draftSpeedTime}>12hrs</span>
                </button>
              </div>
              <label className={styles.draftSpeedLabel}>
                Draft Speed
              </label>
            </div>

            {/* Deposit Button */}
            <div className={styles.depositFundsSection}>
              <button
                onClick={() => {
                  modals?.openDeposit();
                  onClose();
                }}
                className={styles.depositFundsButton}
              >
                <Plus size={16} color={TEXT_COLORS.primary} />
                Deposit Funds
              </button>
            </div>

            {/* Tournament Details Section */}
            <div id="tournament-details" className={styles.detailsSection}>
              {/* Section Header */}
              <div className={styles.detailsHeader}>
                Tournament Details
              </div>
              {/* Basic Info */}
              <InfoRow label="Game Type" value="Best Ball" />
              <InfoRow label="Draft Size" value="12 players" />
              <InfoRow label="Pick Clock" value="30 seconds" />
              <InfoRow label="Draft Rounds" value="18 rounds" />

              {/* Scoring */}
              <div className={styles.subsectionDivider}>
                <div className={styles.subsectionHeader}>
                  Scoring
                </div>
                <div className={styles.scoringGrid}>
                  <span>Reception: 0.5</span>
                  <span>Pass TD: 4.0</span>
                  <span>Rush/Rec Yard: 0.1</span>
                  <span>Rush/Rec TD: 6.0</span>
                  <span>INT: -1.0</span>
                  <span>Fumble: -2.0</span>
                </div>
              </div>

              {/* Roster */}
              <div className={styles.subsectionDivider}>
                <div className={styles.subsectionHeader}>
                  Roster
                </div>
                <div className={styles.rosterInfo}>
                  QB: 1 | RB: 2 | WR: 3 | TE: 1 | FLEX: 1 | BN: 10
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className={styles.buttonsSection}>
              <button
                onClick={() => setShowRulesModal(true)}
                className={styles.rulesButton}
              >
                All rules
              </button>
            </div>
          </div>

          {/* Bottom Section - Progress Bar, Join Button, Stats - Fixed at bottom of modal */}
          <div
            className={cn(
              styles.bottomSection,
              hasProgress && hasTextBoxes && styles.withProgressAndTextBoxes,
              hasProgress && !hasTextBoxes && styles.withProgress,
              !hasProgress && hasTextBoxes && styles.withoutProgressWithTextBoxes,
              !hasProgress && !hasTextBoxes && styles.withoutProgress,
            )}
          >
            {/* Progress Bar */}
            {hasProgress && (
              <div className={styles.progressSection}>
                <ProgressBar
                  value={fillPercentage}
                  fillBackgroundImage="url(/square_background.png)"
                  backgroundColor={LOBBY_THEME.progressBg}
                  size="md"
                />
              </div>
            )}

            {/* Join Button */}
            <button
              onClick={handleConfirm}
              disabled={isJoining || hasInsufficientBalance || !user}
              className={styles.joinButton}
              aria-label={`Join ${tournament.title} for ${tournament.entryFee}`}
            >
              {isJoining ? (
                <>
                  <div className={styles.joinButtonSpinner} />
                  Joining...
                </>
              ) : (
                `Join Tournament (${formatCents(totalCostCents, { showCents: false })})`
              )}
            </button>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
              <StatItem value={tournament.entryFee} label="Entry" />
              <StatItem value={tournament.totalEntries} label="Entries" />
              <StatItem value={tournament.firstPlacePrize} label="1st Place" />
            </div>

            {/* Text Boxes Section (if provided) */}
            {bottomTextBoxes && bottomTextBoxes.length > 0 && bottomTextBoxes.some(box => box.text && box.text.trim()) && (
              <div className={styles.textBoxesGrid}>
                {bottomTextBoxes
                  .slice(0, 3)
                  .map((box, index) => (
                    <input
                      key={box.id || index}
                      type="text"
                      value={box.text || ''}
                      onChange={(e) => {
                        if (box.onChange) {
                          box.onChange(e.target.value);
                        }
                      }}
                      placeholder={`Text ${index + 1}`}
                      className={styles.textBoxInput}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rules Modal - wrapped with higher z-index to appear above join modal */}
      {showRulesModal && (
        <div className={styles.rulesModalWrapper}>
          <TournamentRulesModal
            open={showRulesModal}
            onClose={() => setShowRulesModal(false)}
          />
        </div>
      )}
    </>
  );

  // Portal into frame's modal root when in phone frame (covers safe area)
  if (portalRoot) {
    return createPortal(modalContent, portalRoot);
  }

  // Normal rendering when outside phone frame
  return modalContent;
}

