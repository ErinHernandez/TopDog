/**
 * TabContentVX2 - Tab Content Container
 *
 * Renders the active tab with:
 * - Direct imports for SSR compatibility
 * - Error boundary protection
 * - Scroll position preservation
 * - Loading states
 *
 * Migrated to CSS Modules for CSP compliance.
 */

import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';

import { cn } from '@/lib/styles';

import { createScopedLogger } from '../../../../lib/clientLogger';
import { useInPhoneFrame } from '../../../../lib/inPhoneFrameContext';
import { useTabNavigation } from '../../core';
import { DEFAULT_TAB } from '../../core/constants';
import type { TabId } from '../../core/types';
import { useDebouncedCallback } from '../../hooks/ui/useDebounce';
import { ExposureTabVX2 as ExposureTab } from '../../tabs/exposure';
import { DraftsTabVX2 as DraftsTab } from '../../tabs/live-drafts';
import { MyTeamsTabVX2 as MyTeamsTab } from '../../tabs/my-teams';
import { ProfileTabVX2 as ProfileTab } from '../../tabs/profile';

import styles from './TabContentVX2.module.css';
import TabErrorBoundary from './TabErrorBoundary';

const logger = createScopedLogger('[TabContentVX2]');

// Direct imports for all tabs (SSR compatible)
// LobbyTab is client-only to prevent hydration issues

// Create a stable loading component that's identical on server and client
const LobbyTabLoading = () => (
  <div className={styles.lobbyLoading} suppressHydrationWarning>
    <div>Loading tournaments...</div>
  </div>
);

const LobbyTab = dynamic(
  () => import('../../tabs/lobby').then(mod => ({ default: mod.LobbyTabVX2 })),
  {
    ssr: false,
    loading: () => <LobbyTabLoading />,
  },
);

// Debug: Log what DraftsTab is (only in development, client-side)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  logger.debug(`DraftsTab component loaded: ${DraftsTab?.name || 'unknown'}`);
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
  lobby: LobbyTab,
  'live-drafts': DraftsTab,
  'my-teams': MyTeamsTab,
  exposure: ExposureTab,
  profile: ProfileTab,
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
  const inPhoneFrame = useInPhoneFrame();
  logger.debug('Tab navigation initialized', { activeTab: state.activeTab });
  const contentRef = useRef<HTMLDivElement>(null);
  const isLobbyInPhone = state.activeTab === 'lobby' && inPhoneFrame;

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
  }, []);

  // Restore scroll position when tab becomes active
  useEffect(() => {
    if (!isMounted || !tabConfig || !tabConfig.preserveState) {
      return;
    }

    const savedState = getTabState(state.activeTab);
    if (savedState?.scrollPosition && contentRef.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      const scrollPosition = savedState.scrollPosition;
      requestAnimationFrame(() => {
        if (contentRef.current && scrollPosition) {
          contentRef.current.scrollTo({
            left: scrollPosition.x,
            top: scrollPosition.y,
            behavior: 'instant',
          });
        }
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

  const { debouncedCallback: handleScrollDebounced } = useDebouncedCallback(
    (target: HTMLElement) => {
      if (!tabConfigRef.current || !tabConfigRef.current.preserveState) return;

      saveTabStateRef.current(activeTabRef.current, {
        scrollPosition: {
          x: target.scrollLeft,
          y: target.scrollTop,
        },
      });
    },
    100,
  );

  // Scroll event handler
  const onScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      handleScrollDebounced(e.currentTarget);
    },
    [handleScrollDebounced],
  );

  // Error retry handler
  const handleRetry = useCallback(() => {
    // Force re-mount by clearing tab state
    window.location.reload();
  }, []);

  // Router for navigation
  const router = useRouter();

  // Handle entering a draft room
  const handleEnterDraft = useCallback(
    (draft: { id: string; pickNumber: number; teamCount: number }) => {
      logger.debug('Entering draft', { draftId: draft.id, pickNumber: draft.pickNumber });
      const params = new URLSearchParams({
        roomId: draft.id,
        pickNumber: draft.pickNumber.toString(),
        teamCount: draft.teamCount.toString(),
      });
      router.push(`/testing-grounds/vx2-draft-room?${params.toString()}`);
    },
    [router],
  );

  // Get the active tab component
  const TabComponent = TAB_COMPONENTS[state.activeTab];

  logger.debug('Tab component lookup', {
    activeTab: state.activeTab,
    hasTabComponent: !!TabComponent,
  });

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
            onEnterSlowDraft={draft =>
              handleEnterDraft({
                id: draft.id,
                pickNumber: draft.pickNumber,
                teamCount: draft.teamCount,
              })
            }
          />
        );
      default:
        return TabComponent ? <TabComponent /> : null;
    }
  };

  return (
    <div
      ref={contentRef}
      className={cn(
        styles.contentContainer,
        isLobbyInPhone ? styles.contentContainerHidden : styles.contentContainerScrollable,
        className,
      )}
      onScroll={onScroll}
      role="tabpanel"
      id={`tabpanel-${state.activeTab}`}
      aria-labelledby={`tab-${state.activeTab}`}
      tabIndex={0}
      suppressHydrationWarning
    >
      <TabErrorBoundary tabId={state.activeTab} onRetry={handleRetry} fallback={errorComponent}>
        {/* Only render content after mount to prevent hydration mismatch */}
        {isMounted && TabComponent ? (
          renderTabContent()
        ) : isMounted && !TabComponent ? (
          <div className={styles.errorMessage} suppressHydrationWarning>
            <p>Error: Tab component not found for &quot;{state.activeTab}&quot;</p>
            <p className={styles.errorDetail}>
              Available tabs: {Object.keys(TAB_COMPONENTS).join(', ')}
            </p>
          </div>
        ) : (
          <div className={styles.loadingMessage} suppressHydrationWarning>
            Loading...
          </div>
        )}
      </TabErrorBoundary>
    </div>
  );
}
