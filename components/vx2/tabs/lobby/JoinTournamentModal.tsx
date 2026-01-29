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
import { cn } from '@/lib/styles';
import styles from './JoinTournamentModal.module.css';
import { type Tournament, useUser } from '../../hooks/data';
import { BG_COLORS, TEXT_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY, Z_INDEX } from '../../core/constants/sizes';
import { Close, Plus } from '../../components/icons';
import { Switch } from '../../../ui';
import TournamentRulesModal from '../../../mobile/modals/TournamentRulesModal';
import { formatCents } from '../../utils/formatting';
import { useModals } from '../../shell/AppShellVX2';
import { ProgressBar } from '../../../ui';
import { TILED_BG_STYLE } from '../../draft-room/constants';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_ENTRIES = 150;
const WR_BLUE_BG = 'url(/wr_blue.png) center center / cover no-repeat';

// Bottom section constants (matching TournamentCardBottomSectionV2)
const ROW_HEIGHTS = {
  progress: 8,
  button: 57,
  stats: 48,
} as const;

const BOTTOM_SECTION_SPACING = {
  rowGap: 16,
  statsGap: 24,
} as const;

const BOTTOM_SECTION_TYPOGRAPHY = {
  buttonFontSize: 14,
  statsValueFontSize: 18,
  statsLabelFontSize: 12,
} as const;

const BOTTOM_SECTION_COLORS = {
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  statBackground: '#000000',
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
  onConfirm: (options: { entries: number; autopilot: boolean }) => void;
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
  
  // State
  const [numberOfEntries, setNumberOfEntries] = useState(1);
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);
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
    onConfirm({ entries: numberOfEntries, autopilot: autopilotEnabled });
  };

  return (
    <>
      <div
        className={styles.overlay}
        onClick={onClose}
      >
        <div
          className={styles.modalContainer}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles.headerTitle}>
              Join Tournament
            </h2>
            <button
              onClick={onClose}
              className={styles.closeButton}
              aria-label="Close modal"
            >
              <Close size={16} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className={styles.scrollableContent}>
            {/* Tournament Title */}
            <h3 className={styles.tournamentTitle}>
              {tournament.title}
            </h3>
            
            {/* Statistics Bar - 3 columns */}
            <div className={styles.statsBar}>
              <div className={styles.statColumn}>
                <div className={styles.statValue}>
                  {tournament.entryFee}
                </div>
                <div className={styles.statLabel}>
                  Entry
                </div>
              </div>
              <div className={styles.statColumn}>
                <div className={styles.statValue}>
                  {tournament.totalEntries}
                </div>
                <div className={styles.statLabel}>
                  Entrants
                </div>
              </div>
              <div className={styles.statColumn}>
                <div className={styles.statValue}>
                  {tournament.firstPlacePrize}
                </div>
                <div className={styles.statLabel}>
                  1st Place
                </div>
              </div>
            </div>

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
                  <Plus size={12} color="#fff" />
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

              {/* Autopilot Row */}
              <div className={styles.autopilotRow}>
                <span className={styles.autopilotLabel}>
                  Autopilot
                </span>
                <Switch
                  checked={autopilotEnabled}
                  onChange={setAutopilotEnabled}
                  size="sm"
                />
              </div>
            </div>

            {/* Total Cost */}
            <div className={styles.totalCostSection}>
              <span className={styles.totalCostLabel}>Total: </span>
              <span className={styles.totalCostAmount}>
                {formatCents(totalCostCents, { showCents: false })}
              </span>
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
                <Plus size={16} color="#fff" />
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

            {/* Info Message */}
            <p className={styles.infoMessage}>
              You will be placed in a draft room once enough players have joined.
            </p>

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
                  fillBackgroundImage="url(/wr_blue.png)"
                  backgroundColor="rgba(55, 65, 81, 0.5)"
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
}

