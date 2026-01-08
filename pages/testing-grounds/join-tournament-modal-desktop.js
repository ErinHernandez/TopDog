/**
 * Join Tournament Modal (Desktop) Sandbox
 * 
 * Isolated testing environment for the desktop version of the Join Tournament Modal.
 * This includes authentication features (Log In / Sign Up) that are visible on desktop
 * where users may not be authenticated yet.
 * 
 * Note: Mobile app requires authentication before accessing, so mobile version
 * doesn't need these auth buttons.
 */

import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import DevNav from '../../components/dev/DevNav';
import { BG_COLORS, TEXT_COLORS } from '../../components/vx2/core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY, Z_INDEX } from '../../components/vx2/core/constants/sizes';
import { Close, ChevronDown, Plus } from '../../components/vx2/components/icons';
import Switch from '../../components/vx/shared/Switch';
import { formatCents } from '../../components/vx2/utils/formatting';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_ENTRIES = 150;
const WR_BLUE_BG = 'url(/wr_blue.png) center center / cover no-repeat';

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_TOURNAMENT = {
  id: 'desktop-test-1',
  title: 'THE TOPDOG INTERNATIONAL',
  entryFee: '$25',
  entryFeeCents: 2500,
  totalEntries: '571,480',
  firstPlacePrize: '$2M',
  currentEntries: 571480,
  maxEntries: 1000000,
  isFeatured: true,
};

const MOCK_USER_LOGGED_IN = {
  uid: 'test-user-1',
  email: 'test@topdog.com',
  balanceCents: 15000,
  balanceFormatted: '$150.00',
};

const MOCK_USER_LOW_BALANCE = {
  uid: 'test-user-2',
  email: 'lowbalance@topdog.com',
  balanceCents: 1000,
  balanceFormatted: '$10.00',
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between" style={{ marginBottom: `${SPACING.xs}px` }}>
      <span style={{ color: TEXT_COLORS.muted }}>{label}</span>
      <span className="font-semibold" style={{ color: TEXT_COLORS.primary }}>{value}</span>
    </div>
  );
}

// ============================================================================
// JOIN TOURNAMENT MODAL (DESKTOP VERSION)
// ============================================================================

function JoinTournamentModalDesktop({ 
  tournament, 
  user, // Can be null for logged-out state
  onClose, 
  onConfirm, 
  onSignIn,
  onSignUp,
  onDeposit,
  isJoining 
}) {
  
  // State
  const [numberOfEntries, setNumberOfEntries] = useState(1);
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Calculated values
  const totalCostCents = tournament.entryFeeCents * numberOfEntries;
  const userBalanceCents = user?.balanceCents ?? 0;
  const hasInsufficientBalance = user ? totalCostCents > userBalanceCents : false;

  // Handlers
  const handleEntriesChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setNumberOfEntries(Math.min(MAX_ENTRIES, Math.max(1, value)));
  };

  const handleConfirm = () => {
    onConfirm?.({ entries: numberOfEntries, autopilot: autopilotEnabled });
  };

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: Z_INDEX.modal }}
      onClick={onClose}
    >
      <div 
        className="w-80 mx-4"
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

          {/* Account Balance / Auth Section */}
          <div 
            style={{ 
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              backgroundColor: (user && hasInsufficientBalance) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)',
              borderRadius: `${RADIUS.md}px`,
              marginBottom: `${SPACING.md}px`,
              border: (user && hasInsufficientBalance) ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
            }}
          >
            {user ? (
              /* Logged in: Show Account Balance + Deposit */
              <>
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
                    onClick={onDeposit}
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
              </>
            ) : (
              /* Not logged in: Show Log In / Sign Up buttons (DESKTOP ONLY) */
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={onSignIn}
                  className="flex-1 font-semibold transition-all"
                  style={{
                    padding: `${SPACING.sm}px ${SPACING.md}px`,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: `${RADIUS.sm}px`,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
                    color: TEXT_COLORS.primary,
                  }}
                >
                  Log In
                </button>
                <button
                  onClick={onSignUp}
                  className="flex-1 font-semibold transition-all"
                  style={{
                    padding: `${SPACING.sm}px ${SPACING.md}px`,
                    background: WR_BLUE_BG,
                    borderRadius: `${RADIUS.sm}px`,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
                    color: '#fff',
                  }}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Number of Entries */}
          <div 
            className="flex items-center justify-between"
            style={{ 
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: `${RADIUS.md}px`,
              marginBottom: `${SPACING.sm}px`,
            }}
          >
            <span style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.primary }}>
              Number of entries
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={MAX_ENTRIES}
                value={numberOfEntries}
                onChange={handleEntriesChange}
                style={{
                  width: '60px',
                  padding: `${SPACING.xs}px ${SPACING.sm}px`,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: `${RADIUS.sm}px`,
                  border: 'none',
                  fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
                  color: TEXT_COLORS.primary,
                  textAlign: 'center',
                }}
              />
              <span style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.muted }}>
                Max: {MAX_ENTRIES}
              </span>
            </div>
          </div>

          {/* Autopilot Toggle */}
          <div 
            className="flex items-center justify-between"
            style={{ 
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: `${RADIUS.md}px`,
              marginBottom: `${SPACING.md}px`,
            }}
          >
            <span style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.primary }}>
              Autopilot
            </span>
            <Switch
              checked={autopilotEnabled}
              onChange={setAutopilotEnabled}
              size="sm"
            />
          </div>

          {/* Total Cost */}
          <div 
            className="text-center"
            style={{ marginBottom: `${SPACING.md}px` }}
          >
            <span style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.muted }}>
              Total:{' '}
            </span>
            <span 
              className="font-bold"
              style={{ fontSize: `${TYPOGRAPHY.fontSize.xl}px`, color: TEXT_COLORS.primary }}
            >
              {formatCents(totalCostCents)}
            </span>
          </div>

          {/* Collapsible Tournament Details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between"
            style={{
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: `${RADIUS.md}px`,
              border: 'none',
              cursor: 'pointer',
              marginBottom: showDetails ? `${SPACING.sm}px` : `${SPACING.md}px`,
            }}
          >
            <span style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.primary }}>
              Tournament Details
            </span>
            <ChevronDown
              size={16}
              color={TEXT_COLORS.muted}
              style={{
                transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>

          {showDetails && (
            <div 
              style={{
                padding: `${SPACING.sm}px ${SPACING.md}px`,
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: `${RADIUS.md}px`,
                marginBottom: `${SPACING.md}px`,
              }}
            >
              <InfoRow label="Scoring" value="Half PPR" />
              <InfoRow label="Roster" value="1QB 2RB 3WR 1TE 2FLEX" />
              <InfoRow label="Draft Type" value="Slow Draft" />
              <InfoRow label="Max Entries" value={MAX_ENTRIES.toString()} />
            </div>
          )}

          {/* Info Text */}
          <p 
            className="text-center"
            style={{ 
              fontSize: `${TYPOGRAPHY.fontSize.xs}px`, 
              color: TEXT_COLORS.muted,
              marginBottom: `${SPACING.md}px`,
              lineHeight: 1.4,
            }}
          >
            You will be placed in a draft room once enough players have joined.
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => alert('Rules modal would open')}
              className="flex-1 font-semibold"
              style={{
                padding: `${SPACING.sm}px ${SPACING.md}px`,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: `${RADIUS.md}px`,
                border: 'none',
                cursor: 'pointer',
                fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
                color: TEXT_COLORS.primary,
              }}
            >
              All rules
            </button>
            <button
              onClick={handleConfirm}
              disabled={isJoining || !user || hasInsufficientBalance}
              className="flex-1 font-semibold transition-all"
              style={{
                padding: `${SPACING.sm}px ${SPACING.md}px`,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: `${RADIUS.md}px`,
                border: 'none',
                cursor: (isJoining || !user || hasInsufficientBalance) ? 'not-allowed' : 'pointer',
                fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
                color: TEXT_COLORS.primary,
                opacity: (isJoining || !user || hasInsufficientBalance) ? 0.5 : 1,
              }}
            >
              {isJoining ? 'Joining...' : `Enter (${formatCents(totalCostCents)})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function JoinTournamentModalDesktopPage() {
  const [userState, setUserState] = useState('logged-out'); // 'logged-out' | 'logged-in' | 'low-balance'
  const [isJoining, setIsJoining] = useState(false);

  const currentUser = userState === 'logged-out' 
    ? null 
    : userState === 'low-balance' 
      ? MOCK_USER_LOW_BALANCE 
      : MOCK_USER_LOGGED_IN;

  const handleClose = useCallback(() => {
    alert('Modal closed');
  }, []);

  const handleConfirm = useCallback((options) => {
    setIsJoining(true);
    console.log('Joining with options:', options);
    setTimeout(() => {
      setIsJoining(false);
      alert(`Joined with ${options.entries} entries, autopilot: ${options.autopilot}`);
    }, 1500);
  }, []);

  const handleSignIn = useCallback(() => {
    setUserState('logged-in');
  }, []);

  const handleSignUp = useCallback(() => {
    setUserState('logged-in');
  }, []);

  const handleDeposit = useCallback(() => {
    alert('Deposit modal would open');
  }, []);

  return (
    <>
      <Head>
        <title>Join Tournament Modal (Desktop) Sandbox | TopDog</title>
      </Head>

      <div 
        className="min-h-screen"
        style={{ backgroundColor: '#0a0a0f' }}
      >
        <DevNav />

        {/* Page Header */}
        <div 
          style={{ 
            padding: '24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <h1 
            className="font-bold"
            style={{ 
              fontSize: '24px', 
              color: '#fff',
              marginBottom: '8px',
            }}
          >
            Join Tournament Modal (Desktop)
          </h1>
          <p style={{ color: TEXT_COLORS.muted, fontSize: '14px' }}>
            Desktop version with Log In / Sign Up buttons for unauthenticated users.
            Mobile app requires authentication before accessing, so mobile version removes these buttons.
          </p>
        </div>

        {/* Controls */}
        <div 
          style={{ 
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          <span style={{ color: TEXT_COLORS.muted, fontSize: '14px' }}>User State:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setUserState('logged-out')}
              style={{
                padding: '8px 16px',
                backgroundColor: userState === 'logged-out' ? '#3B82F6' : 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#fff',
              }}
            >
              Logged Out
            </button>
            <button
              onClick={() => setUserState('logged-in')}
              style={{
                padding: '8px 16px',
                backgroundColor: userState === 'logged-in' ? '#10B981' : 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#fff',
              }}
            >
              Logged In ($150)
            </button>
            <button
              onClick={() => setUserState('low-balance')}
              style={{
                padding: '8px 16px',
                backgroundColor: userState === 'low-balance' ? '#EF4444' : 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#fff',
              }}
            >
              Low Balance ($10)
            </button>
          </div>
        </div>

        {/* Modal Preview */}
        <div 
          className="relative"
          style={{ 
            height: 'calc(100vh - 200px)',
            backgroundColor: BG_COLORS.primary,
          }}
        >
          <JoinTournamentModalDesktop
            tournament={MOCK_TOURNAMENT}
            user={currentUser}
            onClose={handleClose}
            onConfirm={handleConfirm}
            onSignIn={handleSignIn}
            onSignUp={handleSignUp}
            onDeposit={handleDeposit}
            isJoining={isJoining}
          />
        </div>
      </div>
    </>
  );
}

