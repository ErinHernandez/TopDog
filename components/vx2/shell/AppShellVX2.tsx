/**
 * AppShellVX2 - Main App Shell/Orchestrator
 * 
 * The root component for the VX2 mobile app that orchestrates:
 * - Tab navigation via context
 * - Header rendering
 * - Content area
 * - Tab bar
 * - Modal layer
 * 
 * This replaces MobileAppVX with a cleaner, context-driven architecture.
 */

import React, { useCallback, useState, createContext, useContext } from 'react';
import { TabNavigationProvider, useTabNavigation } from '../core';
import type { TabId } from '../core/types';
import { BG_COLORS } from '../core/constants/colors';
import { TabBarVX2, TabContentVX2 } from '../navigation';
import AppHeaderVX2 from './AppHeaderVX2';
import MobilePhoneFrame from './MobilePhoneFrame';
import { 
  AutodraftLimitsModalVX2, 
  DepositHistoryModalVX2, 
  WithdrawModalVX2, 
  RankingsModalVX2 
} from '../modals';

const LOGO_HEIGHT = 32;

// ============================================================================
// MODAL CONTEXT
// ============================================================================

interface ModalContextType {
  openAutodraftLimits: () => void;
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
  /** Badge overrides for tabs */
  badgeOverrides?: Partial<Record<TabId, number>>;
  /** Callback when tab changes */
  onTabChange?: (fromTab: TabId | null, toTab: TabId) => void;
}

// ============================================================================
// INNER SHELL (uses context)
// ============================================================================

interface InnerShellProps {
  badgeOverrides?: Partial<Record<TabId, number>>;
}

function InnerShell({ badgeOverrides }: InnerShellProps): React.ReactElement {
  // Modal state
  const [showAutodraftLimits, setShowAutodraftLimits] = useState(false);
  const [showDepositHistory, setShowDepositHistory] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showRankings, setShowRankings] = useState(false);
  
  // Modal handlers
  const modalContext: ModalContextType = {
    openAutodraftLimits: useCallback(() => setShowAutodraftLimits(true), []),
    openDepositHistory: useCallback(() => setShowDepositHistory(true), []),
    openWithdraw: useCallback(() => setShowWithdraw(true), []),
    openRankings: useCallback(() => setShowRankings(true), []),
  };
  
  return (
    <ModalContext.Provider value={modalContext}>
      <div 
        className="h-full flex flex-col relative"
        style={{ backgroundColor: BG_COLORS.primary }}
      >
        {/* App Header - No back button, deposit button, or logo (logo rendered as overlay in MobilePhoneFrame) */}
        <AppHeaderVX2
          showBackButton={false}
          showDeposit={false}
          hideLogo={true}
        />
        
        {/* Tab Content Area */}
        <TabContentVX2 />
        
        {/* Tab Bar */}
        <TabBarVX2 badgeOverrides={badgeOverrides} />
        
        {/* Modals */}
        <AutodraftLimitsModalVX2 
          isOpen={showAutodraftLimits} 
          onClose={() => setShowAutodraftLimits(false)} 
        />
        <DepositHistoryModalVX2 
          isOpen={showDepositHistory} 
          onClose={() => setShowDepositHistory(false)} 
        />
        <WithdrawModalVX2 
          isOpen={showWithdraw} 
          onClose={() => setShowWithdraw(false)} 
        />
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

// Logo overlay component for header
function LogoOverlay(): React.ReactElement {
  const { navigateToTab } = useTabNavigation();
  
  const handleLogoClick = () => {
    navigateToTab('lobby');
  };
  
  return (
    <button
      onClick={handleLogoClick}
      style={{
        pointerEvents: 'auto',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
      }}
      aria-label="Go to Lobby"
    >
      <img
        src="/logo.png"
        alt="TopDog"
        style={{
          height: `${LOGO_HEIGHT}px`,
          width: 'auto',
          display: 'block',
          objectFit: 'contain',
        }}
      />
    </button>
  );
}

export default function AppShellVX2({
  initialTab = 'lobby',
  showPhoneFrame = true,
  badgeOverrides,
  onTabChange,
}: AppShellVX2Props): React.ReactElement {
  // Optionally wrap in phone frame for desktop preview
  if (showPhoneFrame) {
    return (
      <TabNavigationProvider 
        initialTab={initialTab}
        onTabChange={onTabChange}
      >
        <MobilePhoneFrame
          headerOverlay={<LogoOverlay />}
        >
          <InnerShell badgeOverrides={badgeOverrides} />
        </MobilePhoneFrame>
      </TabNavigationProvider>
    );
  }
  
  // Without phone frame (actual mobile device)
  return (
    <TabNavigationProvider 
      initialTab={initialTab}
      onTabChange={onTabChange}
    >
      <InnerShell badgeOverrides={badgeOverrides} />
    </TabNavigationProvider>
  );
}

