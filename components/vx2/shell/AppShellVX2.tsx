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

import React, { useCallback, useState, createContext, useContext } from 'react';
import { TabNavigationProvider, HeaderProvider } from '../core';
import type { TabId } from '../core/types';
import type { DevicePresetId } from '../core/constants/sizes';
import { BG_COLORS } from '../core/constants/colors';
import { getDeviceClassFromPreset } from '../core/constants/responsive';
import type { DeviceClass } from '../core/constants/responsive';
import { TabBarVX2, TabContentVX2 } from '../navigation';
import MobilePhoneFrame from './MobilePhoneFrame';
import AppHeaderVX2 from './AppHeaderVX2';
import { 
  AutodraftLimitsModalVX2, 
  DepositHistoryModalVX2, 
  DepositModalVX2,
  WithdrawModalVX2, 
  RankingsModalVX2 
} from '../modals';
import { useAuth, AuthGateVX2 } from '../auth';
import { useHeader } from '../core';

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
}

// ============================================================================
// INNER SHELL (uses context) - Only rendered when authenticated
// ============================================================================

interface InnerShellProps {
  badgeOverrides?: Partial<Record<TabId, number>>;
  deviceClass?: DeviceClass;
}

function InnerShell({ badgeOverrides, deviceClass = 'standard' }: InnerShellProps): React.ReactElement {
  const { state: authState } = useAuth();
  const { state: headerState } = useHeader();
  
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
  
  // Deposit handler that uses modal context
  const handleDepositClick = useCallback(() => {
    setShowDeposit(true);
  }, []);
  
  return (
    <ModalContext.Provider value={modalContext}>
      <div 
        className={`h-full flex flex-col relative vx2-device-${deviceClass}`}
        data-device-class={deviceClass}
        style={{ backgroundColor: BG_COLORS.primary }}
      >
        {/* App Header */}
        <AppHeaderVX2
          showBackButton={headerState.showBackButton}
          onBackClick={headerState.onBackClick || undefined}
          showDeposit={true}
          onDepositClick={handleDepositClick}
        />
        
        {/* Tab Content Area */}
        <TabContentVX2 />
        
        {/* Tab Bar */}
        <TabBarVX2 badgeOverrides={badgeOverrides} />
        
        {/* Modals - Only show for authenticated users */}
        <AutodraftLimitsModalVX2 
          isOpen={showAutodraftLimits} 
          onClose={() => setShowAutodraftLimits(false)} 
        />
        {authState.user && (
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
        {authState.user && (
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
          <MobilePhoneFrame devicePreset={devicePreset}>
            {/* AuthGateVX2 gates all app content - must authenticate to access */}
            <AuthGateVX2>
              <InnerShell badgeOverrides={badgeOverrides} deviceClass={deviceClass} />
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
