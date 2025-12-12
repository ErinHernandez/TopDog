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
// DEBOUNCE UTILITY
// ============================================================================

function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TabContentVX2({ 
  className = '',
  errorComponent,
}: TabContentVX2Props): React.ReactElement {
  const { state, saveTabState, getTabState, getTabConfig } = useTabNavigation();
  const contentRef = useRef<HTMLDivElement>(null);
  const tabConfig = getTabConfig(state.activeTab);
  const [isMounted, setIsMounted] = useState(false);
  
  // Track mount state for SSR
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Restore scroll position when tab becomes active
  useEffect(() => {
    if (!isMounted || !tabConfig.preserveState) return;
    
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
  const handleScroll = useCallback(
    debounce((target: HTMLElement) => {
      if (!tabConfig.preserveState) return;
      
      saveTabState(state.activeTab, {
        scrollPosition: { 
          x: target.scrollLeft, 
          y: target.scrollTop 
        },
      });
    }, 100),
    [state.activeTab, tabConfig.preserveState, saveTabState]
  );
  
  // Scroll event handler
  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    handleScroll(e.currentTarget);
  }, [handleScroll]);
  
  // Error retry handler
  const handleRetry = useCallback(() => {
    // Force re-mount by clearing tab state
    window.location.reload();
  }, []);
  
  // Get the active tab component
  const TabComponent = TAB_COMPONENTS[state.activeTab];
  
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
        <TabComponent />
      </TabErrorBoundary>
    </div>
  );
}
