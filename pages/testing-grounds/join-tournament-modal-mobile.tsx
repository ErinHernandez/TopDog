/**
 * Join Tournament Modal (Mobile) Sandbox
 * 
 * Isolated testing environment for the mobile version of the Join Tournament Modal.
 * Uses the VX2 JoinTournamentModal component in a mobile phone frame.
 * 
 * Note: Mobile app requires authentication before accessing, so this version
 * assumes user is authenticated (no Log In / Sign Up buttons).
 */

import React, { useState, useCallback } from 'react';
import type { JSX } from 'react';
import Head from 'next/head';
import DevNav from '../../components/dev/DevNav';
import MobilePhoneFrame from '../../components/vx2/shell/MobilePhoneFrame';
import { AuthProvider } from '../../components/vx2/auth';
import { AppShellVX2 } from '../../components/vx2';
import JoinTournamentModal from '../../components/vx2/tabs/lobby/JoinTournamentModal';
import { BG_COLORS, TEXT_COLORS } from '../../components/vx2/core/constants/colors';
import { SPACING } from '../../components/vx2/core/constants/sizes';
import type { Tournament } from '../../components/vx2/hooks/data';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type UserState = 'logged-in' | 'low-balance';

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_TOURNAMENT: Tournament = {
  id: 'mobile-test-1',
  title: 'THE TOPDOG INTERNATIONAL',
  entryFee: '$25',
  entryFeeCents: 2500,
  totalEntries: '571,480',
  firstPlacePrize: '$2M',
  currentEntries: 571480,
  maxEntries: 1000000,
  isFeatured: true,
  status: 'filling',
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

function JoinTournamentModalMobilePage(): JSX.Element {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(true);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [userState, setUserState] = useState<UserState>('logged-in');

  const handleClose = useCallback((): void => {
    setIsModalOpen(false);
    setTimeout(() => setIsModalOpen(true), 100); // Reopen for demo
  }, []);

  const handleConfirm = useCallback((options: { entries: number; autopilot: boolean }): void => {
    setIsJoining(true);
    setTimeout(() => {
      setIsJoining(false);
      alert(`Joined with ${options.entries} entries, autopilot: ${options.autopilot}`);
    }, 1500);
  }, []);

  return (
    <>
      <Head>
        <title>Join Tournament Modal (Mobile) Sandbox | TopDog</title>
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
            Join Tournament Modal (Mobile)
          </h1>
          <p style={{ color: TEXT_COLORS.muted, fontSize: '14px' }}>
            Mobile version using VX2 JoinTournamentModal component. 
            Mobile app requires authentication, so no Log In / Sign Up buttons.
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
            flexWrap: 'wrap',
          }}
        >
          <span style={{ color: TEXT_COLORS.muted, fontSize: '14px' }}>User State:</span>
          <div className="flex gap-2">
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
          <button
            onClick={() => setIsModalOpen(!isModalOpen)}
            style={{
              padding: '8px 16px',
              backgroundColor: isModalOpen ? '#3B82F6' : 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#fff',
            }}
          >
            {isModalOpen ? 'Close Modal' : 'Open Modal'}
          </button>
        </div>

        {/* Mobile Phone Frame with Modal */}
        <div 
          style={{ 
            padding: `${SPACING.xl}px`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            minHeight: 'calc(100vh - 200px)',
          }}
        >
          <AuthProvider>
            <div style={{ position: 'relative' }}>
              <MobilePhoneFrame>
                {/* AppShellVX2 provides modals context and auth gate */}
                {/* Note: Modal will render on top via absolute positioning */}
                <AppShellVX2 initialTab="lobby" onTabChange={() => {}} />
                
                {/* Join Tournament Modal - rendered as sibling, positioned absolutely */}
                {isModalOpen && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 9999 }}>
                    <JoinTournamentModal
                      tournament={MOCK_TOURNAMENT}
                      onClose={handleClose}
                      onConfirm={handleConfirm}
                      isJoining={isJoining}
                    />
                  </div>
                )}
              </MobilePhoneFrame>
            </div>
          </AuthProvider>
        </div>
      </div>
    </>
  );
}

export default JoinTournamentModalMobilePage;
