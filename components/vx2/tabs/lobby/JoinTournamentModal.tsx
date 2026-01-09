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
import { type Tournament, useUser } from '../../hooks/data';
import { BG_COLORS, TEXT_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY, Z_INDEX } from '../../core/constants/sizes';
import { Close, Plus } from '../../components/icons';
import Switch from '../../../vx/shared/Switch';
import TournamentRulesModal from '../../../mobile/modals/TournamentRulesModal';
import { formatCents } from '../../utils/formatting';
import { useModals } from '../../shell/AppShellVX2';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_ENTRIES = 150;
const WR_BLUE_BG = 'url(/wr_blue.png) center center / cover no-repeat';

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
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function InfoRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="flex justify-between" style={{ marginBottom: '4px' }}>
      <span style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.muted }}>{label}</span>
      <span style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.primary }}>{value}</span>
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
  isJoining 
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
        className="absolute inset-0 flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: Z_INDEX.modal }}
        onClick={onClose}
      >
        <div 
          className="w-96 mx-4"
          style={{ 
            backgroundColor: BG_COLORS.secondary,
            borderRadius: `${RADIUS.xl}px`,
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between flex-shrink-0"
            style={{ 
              padding: `${SPACING.md}px ${SPACING.lg}px`,
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <h2 
              className="font-bold"
              style={{ fontSize: `${TYPOGRAPHY.fontSize.lg}px`, color: TEXT_COLORS.primary }}
            >
              Join Tournament
            </h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center transition-all"
              style={{ 
                width: '32px',
                height: '32px',
                borderRadius: `${RADIUS.md}px`,
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: TEXT_COLORS.muted,
                border: 'none',
                cursor: 'pointer',
              }}
              aria-label="Close modal"
            >
              <Close size={16} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div 
            className="flex-1 overflow-y-auto"
            style={{ 
              padding: `${SPACING.lg}px`,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {/* Tournament Title */}
            <h3 
              className="font-bold text-center"
              style={{ 
                fontSize: `${TYPOGRAPHY.fontSize.base}px`, 
                color: TEXT_COLORS.primary,
                marginBottom: `${SPACING.md}px`,
              }}
            >
              {tournament.title}
            </h3>
            
            {/* Statistics Bar - 3 columns */}
            <div 
              className="flex justify-around"
              style={{ marginBottom: `${SPACING.lg}px` }}
            >
              <div className="text-center">
                <div 
                  className="font-bold" 
                  style={{ 
                    fontSize: `${TYPOGRAPHY.fontSize.xl}px`, 
                    color: TEXT_COLORS.primary,
                  }}
                >
                  {tournament.entryFee}
                </div>
                <div style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.muted }}>
                  Entry
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold" style={{ fontSize: `${TYPOGRAPHY.fontSize.xl}px`, color: TEXT_COLORS.primary }}>
                  {tournament.totalEntries}
                </div>
                <div style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.muted }}>
                  Entrants
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold" style={{ fontSize: `${TYPOGRAPHY.fontSize.xl}px`, color: TEXT_COLORS.primary }}>
                  {tournament.firstPlacePrize}
                </div>
                <div style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.muted }}>
                  1st Place
                </div>
              </div>
            </div>

          {/* Account Balance Section */}
          {/* Note: Mobile app requires authentication, so user will always exist */}
          {user && (
            <div 
              style={{ 
                padding: `${SPACING.sm}px ${SPACING.md}px`,
                backgroundColor: hasInsufficientBalance ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)',
                borderRadius: `${RADIUS.md}px`,
                marginBottom: `${SPACING.md}px`,
                border: hasInsufficientBalance ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.muted }}>
                    Account Balance
                  </div>
                  <div 
                    className="font-bold" 
                    style={{ 
                      fontSize: `${TYPOGRAPHY.fontSize.lg}px`, 
                      color: hasInsufficientBalance ? '#EF4444' : TEXT_COLORS.primary,
                    }}
                  >
                    {user.balanceFormatted ?? '$0.00'}
                  </div>
                </div>
                <button
                  onClick={() => modals?.openDeposit()}
                  className="flex items-center gap-1 font-semibold transition-all"
                  style={{
                    padding: `${SPACING.xs}px ${SPACING.sm}px`,
                    background: WR_BLUE_BG,
                    borderRadius: `${RADIUS.sm}px`,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
                    color: '#fff',
                  }}
                >
                  <Plus size={12} color="#fff" />
                  Deposit
                </button>
              </div>
              {hasInsufficientBalance && (
                <div 
                  style={{ 
                    fontSize: `${TYPOGRAPHY.fontSize.xs}px`, 
                    color: '#EF4444',
                    marginTop: `${SPACING.xs}px`,
                  }}
                >
                  Insufficient balance for {numberOfEntries} {numberOfEntries === 1 ? 'entry' : 'entries'}
                </div>
              )}
            </div>
          )}

            {/* Entry Controls */}
            <div style={{ 
              padding: `${SPACING.md}px`,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: `${RADIUS.md}px`,
              marginBottom: `${SPACING.md}px`,
            }}>
              {/* Number of Entries Row */}
              <div className="flex items-center justify-between" style={{ marginBottom: `${SPACING.sm}px` }}>
                <label style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.primary }}>
                  Number of entries
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={MAX_ENTRIES}
                    value={numberOfEntries}
                    onChange={handleEntriesChange}
                    style={{
                      width: '60px',
                      height: '36px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: `${RADIUS.sm}px`,
                      color: TEXT_COLORS.primary,
                      textAlign: 'center',
                      fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
                      outline: 'none',
                    }}
                    aria-label="Number of entries"
                  />
                  <span style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.muted }}>
                    Max: {MAX_ENTRIES}
                  </span>
                </div>
              </div>
              
              {/* Autopilot Row */}
              <div className="flex items-center justify-between">
                <span style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.primary }}>
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
            <div className="text-center" style={{ marginBottom: `${SPACING.sm}px` }}>
              <span style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.muted }}>Total: </span>
              <span 
                style={{ 
                  fontSize: `${TYPOGRAPHY.fontSize.lg}px`, 
                  fontWeight: 'bold',
                  color: TEXT_COLORS.primary,
                }}
              >
                {formatCents(totalCostCents, { showCents: false })}
              </span>
            </div>

            {/* Deposit Button */}
            <div className="text-center" style={{ marginBottom: `${SPACING.md}px` }}>
              <button
                onClick={() => {
                  modals?.openDeposit();
                  onClose();
                }}
                className="flex items-center justify-center gap-2 font-semibold transition-all mx-auto"
                style={{
                  padding: `${SPACING.sm}px ${SPACING.md}px`,
                  background: WR_BLUE_BG,
                  borderRadius: `${RADIUS.md}px`,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
                  color: '#fff',
                }}
              >
                <Plus size={16} color="#fff" />
                Deposit Funds
              </button>
            </div>

            {/* Tournament Details Section */}
            <div 
              id="tournament-details"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: `${RADIUS.sm}px`,
                padding: `${SPACING.md}px`,
                marginBottom: `${SPACING.md}px`,
              }}
            >
              {/* Section Header */}
              <div style={{ 
                fontSize: `${TYPOGRAPHY.fontSize.sm}px`, 
                color: TEXT_COLORS.secondary,
                marginBottom: `${SPACING.sm}px`,
                fontWeight: '600',
              }}>
                Tournament Details
              </div>
                {/* Basic Info */}
                <InfoRow label="Game Type" value="Best Ball" />
                <InfoRow label="Draft Size" value="12 players" />
                <InfoRow label="Pick Clock" value="30 seconds" />
                <InfoRow label="Draft Rounds" value="18 rounds" />
                
                {/* Scoring */}
                <div style={{ 
                  marginTop: `${SPACING.sm}px`, 
                  paddingTop: `${SPACING.sm}px`, 
                  borderTop: '1px solid rgba(255,255,255,0.1)' 
                }}>
                  <div style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.muted, marginBottom: '4px' }}>
                    Scoring
                  </div>
                  <div 
                    className="grid grid-cols-2 gap-1" 
                    style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.secondary }}
                  >
                    <span>Reception: 0.5</span>
                    <span>Pass TD: 4.0</span>
                    <span>Rush/Rec Yard: 0.1</span>
                    <span>Rush/Rec TD: 6.0</span>
                    <span>INT: -1.0</span>
                    <span>Fumble: -2.0</span>
                  </div>
                </div>
                
                {/* Roster */}
                <div style={{ 
                  marginTop: `${SPACING.sm}px`, 
                  paddingTop: `${SPACING.sm}px`, 
                  borderTop: '1px solid rgba(255,255,255,0.1)' 
                }}>
                  <div style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.muted, marginBottom: '4px' }}>
                    Roster
                  </div>
                  <div style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.secondary }}>
                    QB: 1 | RB: 2 | WR: 3 | TE: 1 | FLEX: 1 | BN: 10
                  </div>
                </div>
            </div>

            {/* Info Message */}
            <p 
              className="text-center"
              style={{ 
                fontSize: `${TYPOGRAPHY.fontSize.sm}px`, 
                color: TEXT_COLORS.muted,
                marginBottom: `${SPACING.lg}px`,
              }}
            >
              You will be placed in a draft room once enough players have joined.
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowRulesModal(true)}
                className="flex-1 font-semibold transition-all"
                style={{ 
                  height: '44px',
                  borderRadius: `${RADIUS.md}px`,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: TEXT_COLORS.primary,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
                }}
              >
                All rules
              </button>
              <button
                onClick={handleConfirm}
                disabled={isJoining || hasInsufficientBalance || !user}
                className="flex-1 font-semibold transition-all flex items-center justify-center gap-2"
                style={{ 
                  height: '44px',
                  borderRadius: `${RADIUS.md}px`,
                  background: (isJoining || hasInsufficientBalance || !user) ? BG_COLORS.tertiary : WR_BLUE_BG,
                  color: '#fff',
                  border: 'none',
                  cursor: (isJoining || hasInsufficientBalance || !user) ? 'not-allowed' : 'pointer',
                  fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
                  opacity: (isJoining || hasInsufficientBalance || !user) ? 0.5 : 1,
                }}
              >
                {isJoining ? (
                  <>
                    <div 
                      className="animate-spin rounded-full h-4 w-4 border-2" 
                      style={{ borderColor: '#fff transparent transparent transparent' }} 
                    />
                    Joining...
                  </>
                ) : (
                  `Enter (${formatCents(totalCostCents, { showCents: false })})`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Modal - wrapped with higher z-index to appear above join modal */}
      {showRulesModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: Z_INDEX.modal + 100 }}>
          <TournamentRulesModal 
            open={showRulesModal} 
            onClose={() => setShowRulesModal(false)} 
          />
        </div>
      )}
    </>
  );
}

