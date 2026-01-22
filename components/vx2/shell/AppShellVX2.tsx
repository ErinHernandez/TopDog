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
 */

import React, { useCallback, useState, useEffect, createContext, useContext } from 'react';
import dynamic from 'next/dynamic';
import { TabNavigationProvider, HeaderProvider } from '../core';
import type { TabId } from '../core/types';
import type { DevicePresetId } from '../core/constants/sizes';
import { BG_COLORS, TEXT_COLORS } from '../core/constants/colors';
import { getDeviceClassFromPreset } from '../core/constants/responsive';
import type { DeviceClass } from '../core/constants/responsive';
import { TabBarVX2, TabContentVX2 } from '../navigation';
import MobilePhoneFrame from './MobilePhoneFrame';
// Light modals - static imports
import {
  AutodraftLimitsModalVX2,
  DepositHistoryModalVX2,
  RankingsModalVX2
} from '../modals';
// Type imports for dynamic modals
import type { DepositModalVX2Props } from '../modals/DepositModalVX2';
import type { WithdrawModalVX2Props } from '../modals/WithdrawModalVX2';
import { useAuth, AuthGateVX2 } from '../auth';
import { useStableViewportHeight } from '../hooks/ui/useStableViewportHeight';

// ============================================================================
// DYNAMIC IMPORTS FOR HEAVY PAYMENT MODALS
// ============================================================================

// Loading placeholder for payment modals - matches app visual style
const PaymentModalLoadingPlaceholder = () => (
  <div
    className="fixed inset-0 flex items-center justify-center"
    style={{ zIndex: 9999 }}
  >
    <div className="absolute inset-0 bg-black/60" />
    <div
      className="relative p-8 rounded-xl max-w-sm mx-4"
      style={{ backgroundColor: BG_COLORS.secondary }}
    >
      <div className="flex items-center gap-3">
        <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
        <span style={{ color: TEXT_COLORS.primary }}>Loading payment...</span>
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

// ============================================================================
// MODAL CONTEXT
// ============================================================================

interface ModalContextType {
  openAutodraftLimits: () => void;
  openDeposit: () => void;
  openDepositHistory: () => void;
  openWithdraw: () => void;
  openRankings: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export function useModals(): ModalContextType | null {
  return useContext(ModalContext);
}

// ============================================================================
// TYPES
// ============================================================================

export interface AppShellVX2Props {
  /** Initial tab to show */
  initialTab?: TabId;
  /** Whether to show in phone frame (for desktop preview) */
  showPhoneFrame?: boolean;
  /** Device preset for phone frame (optional, defaults to standard iPhone) */
  devicePreset?: DevicePresetId;
  /** Badge overrides for tabs */
  badgeOverrides?: Partial<Record<TabId, number>>;
  /** Callback when tab changes */
  onTabChange?: (fromTab: TabId | null, toTab: TabId) => void;
  /** Whether phone frame should be fullscreen (false for side-by-side layouts) */
  fullScreen?: boolean;
}

// ============================================================================
// INNER SHELL (uses context) - Only rendered when authenticated
// ============================================================================

interface InnerShellProps {
  badgeOverrides?: Partial<Record<TabId, number>>;
  deviceClass?: DeviceClass;
  inPhoneFrame?: boolean;
}

function InnerShell({ badgeOverrides, deviceClass = 'standard', inPhoneFrame = false }: InnerShellProps): React.ReactElement {
  // Initialize stable viewport height (sets CSS variable)
  // Note: Hook always runs to set the CSS variable (needed for mobile), but when inPhoneFrame=true,
  // we use height: 100% which ignores the CSS variable and fills the fixed phone frame container
  useStableViewportHeight();
  
  const { state: authState } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  
  // Track mount state to prevent hydration mismatch with conditional modal rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
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
      <div 
        className={`flex flex-col relative vx2-device-${deviceClass}`}
        data-device-class={deviceClass}
        suppressHydrationWarning
        style={{ 
          backgroundColor: BG_COLORS.primary,
          // When in phone frame, use 100% to fill the fixed frame container
          // When not in phone frame (actual mobile), use stable viewport height
          // Use fallback for SSR to prevent hydration mismatch
          height: inPhoneFrame 
            ? '100%' 
            : typeof window === 'undefined' 
              ? '100vh' 
              : 'calc(var(--stable-vh, 1vh) * 100)',
          overflow: 'hidden',
        }}
      >
        {/* Tab Content Area */}
        <TabContentVX2 />
        
        {/* Tab Bar */}
        <TabBarVX2 badgeOverrides={badgeOverrides} />
        
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
  showPhoneFrame = true,
  devicePreset,
  badgeOverrides,
  onTabChange,
  fullScreen = true,
}: AppShellVX2Props): React.ReactElement {
  // Get device class from preset for simulated frames
  const deviceClass = getDeviceClassFromPreset(devicePreset);
  
  // Optionally wrap in phone frame for desktop preview
  if (showPhoneFrame) {
    return (
      <TabNavigationProvider 
        initialTab={initialTab}
        onTabChange={onTabChange}
      >
        <HeaderProvider>
          <MobilePhoneFrame devicePreset={devicePreset} fullScreen={fullScreen}>
            {/* AuthGateVX2 gates all app content - must authenticate to access */}
            <AuthGateVX2>
              <InnerShell badgeOverrides={badgeOverrides} deviceClass={deviceClass} inPhoneFrame={true} />
            </AuthGateVX2>
          </MobilePhoneFrame>
        </HeaderProvider>
      </TabNavigationProvider>
    );
  }
  
  // Without phone frame (actual mobile device) - use standard, CSS media queries will handle it
  return (
    <TabNavigationProvider 
      initialTab={initialTab}
      onTabChange={onTabChange}
    >
      <HeaderProvider>
        {/* AuthGateVX2 gates all app content - must authenticate to access */}
        <AuthGateVX2>
          <InnerShell badgeOverrides={badgeOverrides} deviceClass="standard" />
        </AuthGateVX2>
      </HeaderProvider>
    </TabNavigationProvider>
  );
}
