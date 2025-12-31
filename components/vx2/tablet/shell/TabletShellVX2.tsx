/**
 * TabletShellVX2 - Main Tablet App Shell
 * 
 * Root component for the VX2 tablet experience.
 * Orchestrates orientation guard, navigation, and content.
 * 
 * @example
 * ```tsx
 * // Desktop preview with frame
 * <TabletShellVX2 showFrame initialTab="lobby" />
 * 
 * // On actual iPad
 * <TabletShellVX2 initialTab="lobby" />
 * ```
 */

import React, { useState, useCallback, type ReactElement } from 'react';
import { BG_COLORS } from '../../core/constants/colors';
import { TABLET_FRAME } from '../../core/constants/tablet';
import { TabletLayoutProvider } from '../../core/context/TabletLayoutContext';
import { OrientationGuard } from '../orientation';
import TabletFrame from './TabletFrame';
import TabletHeaderVX2 from './TabletHeaderVX2';
import type { TabletShellProps, TabletNavStyle } from '../../core/types/tablet';

// ============================================================================
// TYPES
// ============================================================================

interface TabletContentProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  navStyle: TabletNavStyle;
}

// ============================================================================
// CONTENT COMPONENT
// ============================================================================

/**
 * TabletContent - Inner content area with navigation
 */
function TabletContent({
  activeTab,
  onTabChange,
  navStyle,
}: TabletContentProps): ReactElement {
  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'lobby':
        return (
          <div style={{ padding: 24, color: '#fff' }}>
            <h2 style={{ fontSize: 24, marginBottom: 16 }}>Lobby</h2>
            <p style={{ color: '#9CA3AF' }}>Tournament grid will appear here</p>
          </div>
        );
      case 'live-drafts':
        return (
          <div style={{ padding: 24, color: '#fff' }}>
            <h2 style={{ fontSize: 24, marginBottom: 16 }}>Live Drafts</h2>
            <p style={{ color: '#9CA3AF' }}>Active drafts will appear here</p>
          </div>
        );
      case 'my-teams':
        return (
          <div style={{ padding: 24, color: '#fff' }}>
            <h2 style={{ fontSize: 24, marginBottom: 16 }}>My Teams</h2>
            <p style={{ color: '#9CA3AF' }}>Your teams will appear here</p>
          </div>
        );
      case 'exposure':
        return (
          <div style={{ padding: 24, color: '#fff' }}>
            <h2 style={{ fontSize: 24, marginBottom: 16 }}>Exposure</h2>
            <p style={{ color: '#9CA3AF' }}>Player exposure will appear here</p>
          </div>
        );
      case 'profile':
        return (
          <div style={{ padding: 24, color: '#fff' }}>
            <h2 style={{ fontSize: 24, marginBottom: 16 }}>Profile</h2>
            <p style={{ color: '#9CA3AF' }}>Profile settings will appear here</p>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <TabletHeaderVX2
        showBackButton={false}
        showDeposit={true}
      />
      
      {/* Content Area */}
      <main
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: BG_COLORS.primary,
        }}
      >
        {renderTabContent()}
      </main>
      
      {/* Bottom Navigation */}
      {navStyle === 'bottom' && (
        <nav
          style={{
            height: 64,
            backgroundColor: '#000000',
            borderTop: '1px solid #374151',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
          }}
        >
          {['lobby', 'live-drafts', 'my-teams', 'exposure', 'profile'].map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              style={{
                flex: 1,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: activeTab === tab ? '#60A5FA' : '#9CA3AF',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 500 }}>
                {tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

// ============================================================================
// INNER SHELL
// ============================================================================

interface InnerShellProps {
  initialTab: string;
  navStyle: TabletNavStyle;
  onTabChange?: (fromTab: string | null, toTab: string) => void;
}

function InnerShell({
  initialTab,
  navStyle,
  onTabChange,
}: InnerShellProps): ReactElement {
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const handleTabChange = useCallback((tab: string) => {
    const prevTab = activeTab;
    setActiveTab(tab);
    onTabChange?.(prevTab, tab);
  }, [activeTab, onTabChange]);
  
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: BG_COLORS.primary,
      }}
    >
      <TabletContent
        activeTab={activeTab}
        onTabChange={handleTabChange}
        navStyle={navStyle}
      />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * TabletShellVX2 - Main entry point for tablet app
 */
export default function TabletShellVX2({
  initialTab = 'lobby',
  showFrame = false,
  navStyle = 'bottom',
  frameModel = 'ipad-pro-11',
  onTabChange,
}: TabletShellProps): ReactElement {
  const content = (
    <TabletLayoutProvider>
      <OrientationGuard enforceHorizontal={!showFrame}>
        <InnerShell
          initialTab={initialTab}
          navStyle={navStyle}
          onTabChange={onTabChange}
        />
      </OrientationGuard>
    </TabletLayoutProvider>
  );
  
  // Wrap in frame for desktop preview
  if (showFrame) {
    return (
      <TabletFrame model={frameModel}>
        {content}
      </TabletFrame>
    );
  }
  
  return content;
}

