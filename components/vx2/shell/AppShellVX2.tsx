/**
 * AppShellVX2 - Main App Shell/Orchestrator
 *
 * The root component for the VX2 mobile app that orchestrates:
 * - Authentication gate (mandatory login before app access)
 * - Tab navigation via context
 * - Header rendering
 * - Content area
 * - Tab bar
 * - Modal layer
 *
 * This replaces MobileAppVX with a cleaner, context-driven architecture.
 *
 * AUTHENTICATION:
 * The app is wrapped with AuthGateVX2, which completely blocks access
 * to the app content until the user is authenticated. This is NOT a
 * dismissable modal - users MUST sign in or sign up to access the app.
 *
 * Migrated to CSS Modules for CSP compliance.
 */

import dynamic from 'next/dynamic';
import React, { useCallback, useState, useEffect, createContext, useContext } from 'react';

import { createScopedLogger } from '../../../lib/clientLogger';
import { draftSession } from '../../../lib/draftSession';
import { useInPhoneFrame } from '../../../lib/inPhoneFrameContext';
import { useAuth, AuthGateVX2 } from '../auth';
import { TabNavigationProvider, HeaderProvider, useTabNavigation } from '../core';
import type { TabId } from '../core/types';
import { useStableViewportHeight } from '../hooks/ui/useStableViewportHeight';
import {
  AutodraftLimitsModalVX2,
  DepositHistoryModalVX2
} from '../modals';
// Draft session management - handles return destination after leaving draft
// Light modals - static imports
// Type imports for dynamic modals
import type { DepositModalVX2Props } from '../modals/DepositModalVX2';
import type { PayMongoDepositModalVX2Props } from '../modals/PayMongoDepositModalVX2';
import type { PayMongoWithdrawModalVX2Props } from '../modals/PayMongoWithdrawModalVX2';
import type { PaystackDepositModalVX2Props } from '../modals/PaystackDepositModalVX2';
import type { PaystackWithdrawModalVX2Props } from '../modals/PaystackWithdrawModalVX2';
import type { RankingsModalVX2Props } from '../modals/RankingsModalVX2';
import type { WithdrawModalVX2Props } from '../modals/WithdrawModalVX2';
import type { XenditDepositModalVX2Props } from '../modals/XenditDepositModalVX2';
import type { XenditWithdrawModalVX2Props } from '../modals/XenditWithdrawModalVX2';
import { TabBarVX2, TabContentVX2 } from '../navigation';
import styles from './AppShellVX2.module.css';

// ============================================================================
// DYNAMIC IMPORTS FOR HEAVY PAYMENT MODALS
// ============================================================================

// Loading placeholder for payment modals - matches app visual style
const PaymentModalLoadingPlaceholder = () => (
  <div className={styles.loadingOverlay}>
    <div className={styles.loadingBackdrop} />
    <div className={styles.loadingModal}>
      <div className={styles.loadingContent}>
        <span className={styles.loadingSpinner} />
        <span className={styles.loadingText}>Loading payment...</span>
      </div>
    </div>
  </div>
);

// Dynamic imports for heavy payment modals
// ssr: false is critical because:
// 1. Stripe SDK requires browser APIs (PaymentElement, ExpressCheckoutElement)
// 2. WebAuthn biometric auth is browser-only
// 3. Prevents hydration mismatches with payment SDKs
const DepositModalVX2 = dynamic<DepositModalVX2Props>(
  () => import('../modals/DepositModalVX2').then(mod => ({ default: mod.DepositModalVX2 })),
  {
    ssr: false,
    loading: () => <PaymentModalLoadingPlaceholder />
  }
);

const WithdrawModalVX2 = dynamic<WithdrawModalVX2Props>(
  () => import('../modals/WithdrawModalVX2'),
  {
    ssr: false,
    loading: () => <PaymentModalLoadingPlaceholder />
  }
);

// Payment Processor Deposit Modals
const PaystackDepositModalVX2 = dynamic<PaystackDepositModalVX2Props>(
  () => import('../modals/PaystackDepositModalVX2').then(mod => ({ default: mod.PaystackDepositModalVX2 })),
  {
    ssr: false,
    loading: () => <PaymentModalLoadingPlaceholder />
  }
);

const PayMongoDepositModalVX2 = dynamic<PayMongoDepositModalVX2Props>(
  () => import('../modals/PayMongoDepositModalVX2').then(mod => ({ default: mod.PayMongoDepositModalVX2 })),
  {
    ssr: false,
    loading: () => <PaymentModalLoadingPlaceholder />
  }
);

const XenditDepositModalVX2 = dynamic<XenditDepositModalVX2Props>(
  () => import('../modals/XenditDepositModalVX2').then(mod => ({ default: mod.XenditDepositModalVX2 })),
  {
    ssr: false,
    loading: () => <PaymentModalLoadingPlaceholder />
  }
);

// Payment Processor Withdrawal Modals
const PaystackWithdrawModalVX2 = dynamic<PaystackWithdrawModalVX2Props>(
  () => import('../modals/PaystackWithdrawModalVX2').then(mod => ({ default: mod.PaystackWithdrawModalVX2 })),
  {
    ssr: false,
    loading: () => <PaymentModalLoadingPlaceholder />
  }
);

const PayMongoWithdrawModalVX2 = dynamic<PayMongoWithdrawModalVX2Props>(
  () => import('../modals/PayMongoWithdrawModalVX2').then(mod => ({ default: mod.PayMongoWithdrawModalVX2 })),
  {
    ssr: false,
    loading: () => <PaymentModalLoadingPlaceholder />
  }
);

const XenditWithdrawModalVX2 = dynamic<XenditWithdrawModalVX2Props>(
  () => import('../modals/XenditWithdrawModalVX2').then(mod => ({ default: mod.XenditWithdrawModalVX2 })),
  {
    ssr: false,
    loading: () => <PaymentModalLoadingPlaceholder />
  }
);

// Heavy modals opened on user action
const RankingsModalVX2 = dynamic<RankingsModalVX2Props>(
  () => import('../modals/RankingsModalVX2'),
  {
    ssr: false,
    loading: () => <PaymentModalLoadingPlaceholder />
  }
);

import { ModalContext, type ModalContextType } from './useModalsContext';

// Re-export for backward compatibility
export { useModals } from './useModalsContext';

const logger = createScopedLogger('[AppShell]');

// ============================================================================
// TYPES
// ============================================================================

export interface AppShellVX2Props {
  /** Initial tab to show */
  initialTab?: TabId;
  /** Badge overrides for tabs */
  badgeOverrides?: Partial<Record<TabId, number>>;
  /** Callback when tab changes */
  onTabChange?: (fromTab: TabId | null, toTab: TabId) => void;
}

// ============================================================================
// INNER SHELL (uses context) - Only rendered when authenticated
// ============================================================================

interface InnerShellProps {
  badgeOverrides?: Partial<Record<TabId, number>>;
}

function InnerShell({ badgeOverrides }: InnerShellProps): React.ReactElement {
  const inPhoneFrame = useInPhoneFrame();
  // Initialize stable viewport height (sets CSS variable)
  // Note: Hook always runs to set the CSS variable (needed for mobile), but when inPhoneFrame=true,
  // we use height: 100% which ignores the CSS variable and fills the fixed phone frame container
  useStableViewportHeight();

  const { state: authState } = useAuth();
  const { navigateToTab } = useTabNavigation();
  const [isMounted, setIsMounted] = useState(false);

  // Track mount state to prevent hydration mismatch with conditional modal rendering
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setting state from event listener
    setIsMounted(true);
  }, []);

  // Handle return destination from draft room
  // When user leaves a draft, they set a return destination (e.g., 'live-drafts' tab)
  // This effect reads that destination and navigates accordingly
  useEffect(() => {
    if (!isMounted) return;

    const returnDest = draftSession.getReturnDestination();
    if (returnDest) {
      logger.debug('Processing return destination', { tab: returnDest.tab, roomId: returnDest.roomId });

      // Navigate to the specified tab
      // Map return tab names to actual TabId values
      const tabMapping: Record<string, TabId> = {
        'live-drafts': 'live-drafts',
        'lobby': 'lobby',
        'my-teams': 'my-teams',
      };

      const targetTab = tabMapping[returnDest.tab];
      if (targetTab) {
        // Use setTimeout to ensure navigation happens after initial render
        setTimeout(() => {
          navigateToTab(targetTab as TabId);
          // Clear the return destination after navigation
          draftSession.clearReturnDestination();
          logger.debug('Navigated to return destination', { tab: targetTab });
        }, 0);
      } else {
        // Unknown tab, just clear the destination
        draftSession.clearReturnDestination();
        logger.warn('Unknown return destination tab', { tab: returnDest.tab });
      }
    }
  }, [isMounted, navigateToTab]);

  // Modal state
  const [showAutodraftLimits, setShowAutodraftLimits] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showDepositHistory, setShowDepositHistory] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showRankings, setShowRankings] = useState(false);

  // Modal handlers
  const modalContext: ModalContextType = {
    openAutodraftLimits: useCallback(() => {
      setShowAutodraftLimits(true);
    }, []),
    openDeposit: useCallback(() => {
      setShowDeposit(true);
    }, []),
    openDepositHistory: useCallback(() => {
      setShowDepositHistory(true);
    }, []),
    openWithdraw: useCallback(() => {
      setShowWithdraw(true);
    }, []),
    openRankings: useCallback(() => {
      setShowRankings(true);
    }, []),
  };

  return (
    <ModalContext.Provider value={modalContext}>
      <div className={styles.shellContainer}>
        {/* Main content - flex so TabContentVX2 gets defined height. In phone frame, no marginBottom so content sits flush with tab bar (goal). */}
        <main className={styles.mainContent}>
          <TabContentVX2 />
        </main>

        {/* Tab Bar */}
        <div className={styles.tabBarWrapper}>
          <TabBarVX2 badgeOverrides={badgeOverrides} />
        </div>

        {/* Modals - Only show for authenticated users after mount to prevent hydration mismatch */}
        <AutodraftLimitsModalVX2
          isOpen={showAutodraftLimits}
          onClose={() => setShowAutodraftLimits(false)}
        />
        {isMounted && authState.user && (
          <DepositModalVX2
            isOpen={showDeposit}
            onClose={() => setShowDeposit(false)}
            userId={authState.user.uid}
            userEmail={authState.user.email || ''}
            userName={authState.profile?.displayName || authState.user.displayName || undefined}
            onSuccess={() => setShowDeposit(false)}
          />
        )}
        <DepositHistoryModalVX2
          isOpen={showDepositHistory}
          onClose={() => setShowDepositHistory(false)}
        />
        {isMounted && authState.user && (
          <WithdrawModalVX2
            isOpen={showWithdraw}
            onClose={() => setShowWithdraw(false)}
            userId={authState.user.uid}
            userEmail={authState.user.email || ''}
          />
        )}
        <RankingsModalVX2
          isOpen={showRankings}
          onClose={() => setShowRankings(false)}
        />
      </div>
    </ModalContext.Provider>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AppShellVX2({
  initialTab = 'lobby',
  badgeOverrides,
  onTabChange,
}: AppShellVX2Props): React.ReactElement {
  return (
    <TabNavigationProvider initialTab={initialTab} onTabChange={onTabChange}>
      <HeaderProvider>
        <AuthGateVX2>
          <InnerShell badgeOverrides={badgeOverrides} />
        </AuthGateVX2>
      </HeaderProvider>
    </TabNavigationProvider>
  );
}
