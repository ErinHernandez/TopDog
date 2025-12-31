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

import React, { useCallback, useState, createContext, useContext, useEffect } from 'react';
import { TabNavigationProvider, HeaderProvider } from '../core';
import type { TabId } from '../core/types';
import type { DevicePresetId } from '../core/constants/sizes';
import { BG_COLORS } from '../core/constants/colors';
import { getDeviceClassFromPreset } from '../core/constants/responsive';
import type { DeviceClass } from '../core/constants/responsive';
import { TabBarVX2, TabContentVX2 } from '../navigation';
import MobilePhoneFrame from './MobilePhoneFrame';
import { 
  AutodraftLimitsModalVX2, 
  DepositHistoryModalVX2, 
  WithdrawModalVX2, 
  RankingsModalVX2 
} from '../modals';

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
  /** Device preset for phone frame (optional, defaults to standard iPhone) */
  devicePreset?: DevicePresetId;
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
  deviceClass?: DeviceClass;
}

function InnerShell({ badgeOverrides, deviceClass = 'standard' }: InnerShellProps): React.ReactElement {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2aaead3f-67a7-4f92-b03f-ef7a26e0239e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppShellVX2.tsx:70',message:'InnerShell rendering',data:{hasBadgeOverrides:!!badgeOverrides},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  // Modal state
  const [showAutodraftLimits, setShowAutodraftLimits] = useState(false);
  const [showDepositHistory, setShowDepositHistory] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showRankings, setShowRankings] = useState(false);
  
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/2aaead3f-67a7-4f92-b03f-ef7a26e0239e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppShellVX2.tsx:74',message:'InnerShell modal state',data:{showAutodraftLimits,showDepositHistory,showWithdraw,showRankings},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'F'})}).catch(()=>{});
  }, [showAutodraftLimits, showDepositHistory, showWithdraw, showRankings]);
  // #endregion
  
  // Modal handlers
  const modalContext: ModalContextType = {
    openAutodraftLimits: useCallback(() => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2aaead3f-67a7-4f92-b03f-ef7a26e0239e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppShellVX2.tsx:79',message:'openAutodraftLimits called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      setShowAutodraftLimits(true);
    }, []),
    openDepositHistory: useCallback(() => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2aaead3f-67a7-4f92-b03f-ef7a26e0239e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppShellVX2.tsx:83',message:'openDepositHistory called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      setShowDepositHistory(true);
    }, []),
    openWithdraw: useCallback(() => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2aaead3f-67a7-4f92-b03f-ef7a26e0239e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppShellVX2.tsx:87',message:'openWithdraw called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      setShowWithdraw(true);
    }, []),
    openRankings: useCallback(() => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2aaead3f-67a7-4f92-b03f-ef7a26e0239e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppShellVX2.tsx:91',message:'openRankings called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      setShowRankings(true);
    }, []),
  };
  
  return (
    <ModalContext.Provider value={modalContext}>
      <div 
        className={`h-full flex flex-col relative vx2-device-${deviceClass}`}
        data-device-class={deviceClass}
        style={{ backgroundColor: BG_COLORS.primary }}
      >
        {/* Logo bar with blue background */}
        <div
          className="vx2-logo-bar"
          style={{
            height: 44,
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            backgroundImage: 'url(/wr_blue.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            paddingLeft: 12,
            paddingRight: 12,
          }}
        >
          <img
            src="/logo.png"
            alt="TopDog"
            style={{
              height: 28,
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        </div>
        
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

export default function AppShellVX2({
  initialTab = 'lobby',
  showPhoneFrame = true,
  devicePreset,
  badgeOverrides,
  onTabChange,
}: AppShellVX2Props): React.ReactElement {
  // #region agent log
  console.warn('[VX2 DEBUG] AppShellVX2 rendering', {initialTab, showPhoneFrame, devicePreset, hasBadgeOverrides: !!badgeOverrides, hasOnTabChange: !!onTabChange});
  fetch('http://127.0.0.1:7242/ingest/2aaead3f-67a7-4f92-b03f-ef7a26e0239e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppShellVX2.tsx:164',message:'AppShellVX2 rendering',data:{initialTab,showPhoneFrame,devicePreset,hasBadgeOverrides:!!badgeOverrides,hasOnTabChange:!!onTabChange},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch((e)=>console.error('[VX2 DEBUG] Fetch failed', e));
  // #endregion
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
          <MobilePhoneFrame
            devicePreset={devicePreset}
          >
            <InnerShell badgeOverrides={badgeOverrides} deviceClass={deviceClass} />
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
        <InnerShell badgeOverrides={badgeOverrides} deviceClass="standard" />
      </HeaderProvider>
    </TabNavigationProvider>
  );
}

