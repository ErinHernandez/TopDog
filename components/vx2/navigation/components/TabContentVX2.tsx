/**
 * TabContentVX2 - Tab Content Container
 * 
 * Renders the active tab with:
 * - Direct imports for SSR compatibility
 * - Error boundary protection
 * - Scroll position preservation
 * - Loading states
 */

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useTabNavigation } from '../../core';
import type { TabId } from '../../core/types';
import { DEFAULT_TAB } from '../../core/constants';
import { useDebouncedCallback } from '../../hooks/ui/useDebounce';
import TabErrorBoundary from './TabErrorBoundary';
import { createScopedLogger } from '../../../../lib/clientLogger';

const logger = createScopedLogger('[TabContentVX2]');

// Direct imports for all tabs (SSR compatible)
// LobbyTab is client-only to prevent hydration issues
import dynamic from 'next/dynamic';
const LobbyTab = dynamic(
  () => import('../../tabs/lobby').then(mod => ({ default: mod.LobbyTabVX2 })),
  {
    ssr: false,
    loading: () => (
      <div className="vx2-lobby-container" style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%', 
        minHeight: '400px',
        flex: 1,
        backgroundColor: '#0a0a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff'
      }}>
        <div>Loading tournaments...</div>
      </div>
    ),
  }
);
import { DraftsTabVX2 as DraftsTab } from '../../tabs/live-drafts';
import { MyTeamsTabVX2 as MyTeamsTab } from '../../tabs/my-teams';
import { ExposureTabVX2 as ExposureTab } from '../../tabs/exposure';
import { ProfileTabVX2 as ProfileTab } from '../../tabs/profile';

// Debug: Log what DraftsTab is (only in development, client-side)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('[TabContentVX2] DraftsTab component loaded:', DraftsTab?.name || 'unknown');
}

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
  'live-drafts': DraftsTab,
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
  logger.debug('Rendering', { className, hasErrorComponent: !!errorComponent });
  const { state, saveTabState, getTabState, getTabConfig } = useTabNavigation();
  logger.debug('Tab navigation initialized', { activeTab: state.activeTab });
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Get tab config with fallback to default tab if not found
  // Use useMemo to ensure proper React tracking and memoization
  const tabConfig = useMemo(() => {
    const config = getTabConfig(state.activeTab);
    if (!config) {
      logger.warn('Tab config not found, falling back to default', { activeTab: state.activeTab });
      return getTabConfig(DEFAULT_TAB);
    }
    return config;
  }, [state.activeTab, getTabConfig]);
  
  const [isMounted, setIsMounted] = useState(false);
  
  // Track mount state for SSR
  useEffect(() => {
    setIsMounted(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run on mount
  }, []);
  
  // Restore scroll position when tab becomes active
  useEffect(() => {
    if (!isMounted || !tabConfig || !tabConfig.preserveState) {
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
  }, [state.activeTab, tabConfig, getTabState, isMounted]);
  
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
    if (!tabConfigRef.current || !tabConfigRef.current.preserveState) return;
    
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
  
  // Router for navigation
  const router = useRouter();
  
  // Handle entering a draft room
  const handleEnterDraft = useCallback((draft: { id: string; pickNumber: number; teamCount: number }) => {
    logger.debug('Entering draft', { draftId: draft.id, pickNumber: draft.pickNumber });
    const params = new URLSearchParams({
      roomId: draft.id,
      pickNumber: draft.pickNumber.toString(),
      teamCount: draft.teamCount.toString(),
    });
    router.push(`/testing-grounds/vx2-draft-room?${params.toString()}`);
  }, [router]);
  
  // Get the active tab component
  const TabComponent = TAB_COMPONENTS[state.activeTab];
  
  logger.debug('Tab component lookup', { activeTab: state.activeTab, hasTabComponent: !!TabComponent });
  
  if (!TabComponent) {
    logger.error('Tab component not found', undefined, { activeTab: state.activeTab });
  }
  
  // Render tab content with appropriate props
  const renderTabContent = () => {
    switch (state.activeTab) {
      case 'live-drafts':
        return (
          <DraftsTab
            onEnterFastDraft={handleEnterDraft}
            onEnterSlowDraft={(draft) => handleEnterDraft({
              id: draft.id,
              pickNumber: draft.pickNumber,
              teamCount: draft.teamCount,
            })}
          />
        );
      default:
        return TabComponent ? <TabComponent /> : null;
    }
  };
  
  return (
    <div 
      ref={contentRef}
      className={`flex-1 min-h-0 overflow-y-auto flex flex-col ${className}`}
      onScroll={onScroll}
      style={{
        // Hide scrollbar but allow scrolling
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
        // Ensure flex-1 calculates from stable parent height
        flexBasis: 0, // Force flex-1 to use available space, not content size
      }}
      role="tabpanel"
      id={`tabpanel-${state.activeTab}`}
      aria-labelledby={`tab-${state.activeTab}`}
      tabIndex={0}
      suppressHydrationWarning
    >
      {/* Hide scrollbar for WebKit browsers - only render after mount to prevent hydration mismatch */}
      {isMounted && (
        <style>{`
          #tabpanel-${state.activeTab}::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      )}
      
      <TabErrorBoundary
        tabId={state.activeTab}
        onRetry={handleRetry}
        fallback={errorComponent}
      >
        {TabComponent ? (
          renderTabContent()
        ) : (
          <div style={{ padding: '20px', color: '#fff' }} suppressHydrationWarning>
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
