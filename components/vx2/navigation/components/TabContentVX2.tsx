/**
 * TabContentVX2 - Tab Content Container
 * 
 * Renders the active tab with:
 * - Direct imports for SSR compatibility
 * - Error boundary protection
 * - Scroll position preservation
 * - Loading states
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useTabNavigation } from '../../core';
import type { TabId } from '../../core/types';
import { useDebouncedCallback } from '../../hooks/ui/useDebounce';
import TabErrorBoundary from './TabErrorBoundary';

// Direct imports for all tabs (SSR compatible)
import { LobbyTabVX2 as LobbyTab } from '../../tabs/lobby';
import { LiveDraftsTabVX2 as LiveDraftsTab } from '../../tabs/live-drafts';
import { MyTeamsTabVX2 as MyTeamsTab } from '../../tabs/my-teams';
import { ExposureTabVX2 as ExposureTab } from '../../tabs/exposure';
import { ProfileTabVX2 as ProfileTab } from '../../tabs/profile';

// ============================================================================
// TYPES
// ============================================================================

export interface TabContentVX2Props {
  /** Additional className */
  className?: string;
  /** Custom error component */
  errorComponent?: React.ReactNode;
}

// ============================================================================
// TAB COMPONENT MAP
// ============================================================================

const TAB_COMPONENTS: Record<TabId, React.ComponentType> = {
  'lobby': LobbyTab,
  'live-drafts': LiveDraftsTab,
  'my-teams': MyTeamsTab,
  'exposure': ExposureTab,
  'profile': ProfileTab,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TabContentVX2({ 
  className = '',
  errorComponent,
}: TabContentVX2Props): React.ReactElement {
  const logData = {location:'TabContentVX2.tsx:51',message:'TabContentVX2 rendering',data:{className,hasErrorComponent:!!errorComponent},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'};
  console.warn('[VX2 DEBUG] TabContentVX2 START', logData);
  const { state, saveTabState, getTabState, getTabConfig } = useTabNavigation();
  console.warn('[VX2 DEBUG] TabContentVX2 useTabNavigation success', {activeTab: state.activeTab});
  const contentRef = useRef<HTMLDivElement>(null);
  const tabConfig = getTabConfig(state.activeTab);
  const [isMounted, setIsMounted] = useState(false);
  
  
  // Track mount state for SSR
  useEffect(() => {
    setIsMounted(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run on mount
  }, []);
  
  // Restore scroll position when tab becomes active
  useEffect(() => {
    if (!isMounted || !tabConfig.preserveState) {
      return;
    }
    
    const savedState = getTabState(state.activeTab);
    if (savedState?.scrollPosition && contentRef.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        contentRef.current?.scrollTo({
          left: savedState.scrollPosition!.x,
          top: savedState.scrollPosition!.y,
          behavior: 'instant',
        });
      });
    }
  }, [state.activeTab, tabConfig.preserveState, getTabState, isMounted]);
  
  // Save scroll position on scroll (debounced)
  // Use refs to capture current values for the debounced callback
  const tabConfigRef = useRef(tabConfig);
  const activeTabRef = useRef(state.activeTab);
  const saveTabStateRef = useRef(saveTabState);
  
  useEffect(() => {
    tabConfigRef.current = tabConfig;
    activeTabRef.current = state.activeTab;
    saveTabStateRef.current = saveTabState;
  }, [tabConfig, state.activeTab, saveTabState]);
  
  const { debouncedCallback: handleScrollDebounced } = useDebouncedCallback((target: HTMLElement) => {
    if (!tabConfigRef.current.preserveState) return;
    
    saveTabStateRef.current(activeTabRef.current, {
      scrollPosition: { 
        x: target.scrollLeft, 
        y: target.scrollTop 
      },
    });
  }, 100);
  
  // Scroll event handler
  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    handleScrollDebounced(e.currentTarget);
  }, [handleScrollDebounced]);
  
  // Error retry handler
  const handleRetry = useCallback(() => {
    // Force re-mount by clearing tab state
    window.location.reload();
  }, []);
  
  // Get the active tab component
  const TabComponent = TAB_COMPONENTS[state.activeTab];
  
  const logDataTab = {location:'TabContentVX2.tsx:120',message:'TabComponent lookup',data:{activeTab:state.activeTab,hasTabComponent:!!TabComponent},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'E'};
  console.log('[DEBUG]', logDataTab);
  
  if (!TabComponent) {
    const logDataError = {location:'TabContentVX2.tsx:123',message:'TabComponent ERROR - component not found',data:{activeTab:state.activeTab},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'E'};
    console.error('[DEBUG ERROR]', logDataError);
  }
  
  return (
    <div 
      ref={contentRef}
      className={`flex-1 min-h-0 overflow-y-auto ${className}`}
      onScroll={onScroll}
      style={{
        // Hide scrollbar but allow scrolling
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
      role="tabpanel"
      id={`tabpanel-${state.activeTab}`}
      aria-labelledby={`tab-${state.activeTab}`}
      tabIndex={0}
    >
      {/* Hide scrollbar for WebKit browsers */}
      <style>{`
        #tabpanel-${state.activeTab}::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      <TabErrorBoundary
        tabId={state.activeTab}
        onRetry={handleRetry}
        fallback={errorComponent}
      >
        {TabComponent ? (
          <TabComponent />
        ) : (
          <div style={{ padding: '20px', color: '#fff' }}>
            <p>Error: Tab component not found for "{state.activeTab}"</p>
            <p style={{ fontSize: '12px', color: '#999' }}>
              Available tabs: {Object.keys(TAB_COMPONENTS).join(', ')}
            </p>
          </div>
        )}
      </TabErrorBoundary>
    </div>
  );
}
