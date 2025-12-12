/**
 * MobileLayoutVX - Unified Mobile Page Layout Wrapper (TypeScript)
 * 
 * Migrated from: components/mobile/MobileLayout.js
 * 
 * Provides consistent structure for all mobile pages:
 * - Phone frame simulation (for desktop preview)
 * - Header with logo and navigation
 * - Content area with proper safe areas
 * - Footer navigation
 */

import React from 'react';
import { useRouter } from 'next/router';
import MobileHeaderVX from './MobileHeaderVX';
import MobileFooterAppVX from './MobileFooterAppVX';

// ============================================================================
// TYPES
// ============================================================================

export type AppTab = 'Lobby' | 'Live Drafts' | 'My Teams' | 'Exposure' | 'Profile';

export interface MobileLayoutVXProps {
  children: React.ReactNode;
  /** Optional page title (shown in header) */
  title?: string;
  /** Whether to show the header (default: true) */
  showHeader?: boolean;
  /** Whether to show the footer (default: true) */
  showFooter?: boolean;
  /** Whether to show back button */
  showBackButton?: boolean;
  /** Callback for back button */
  onBackClick?: () => void;
  /** Whether to show deposit button (default: true) */
  showDepositButton?: boolean;
  /** Current active footer tab */
  activeTab?: AppTab;
  /** Callback for footer tab change */
  onTabChange?: (tab: AppTab) => void;
  /** Custom right side header content */
  headerRight?: React.ReactNode;
  /** Custom left side header content */
  headerLeft?: React.ReactNode;
  /** Whether to show phone frame simulation (default: true) */
  phoneFrame?: boolean;
  /** Whether content should take full height (default: false) */
  fullHeight?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const HEADER_HEIGHT = 60;
const FOOTER_HEIGHT = 80;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MobileLayoutVX({
  children,
  title,
  showHeader = true,
  showFooter = true,
  showBackButton = false,
  onBackClick,
  showDepositButton = true,
  activeTab = 'Lobby',
  onTabChange,
  headerRight,
  headerLeft,
  phoneFrame = true,
  fullHeight = false,
  className = ''
}: MobileLayoutVXProps): React.ReactElement {
  const router = useRouter();

  // Header height calculation
  const headerHeight = showHeader ? HEADER_HEIGHT : 0;
  const footerHeight = showFooter ? FOOTER_HEIGHT : 0;

  // Content wrapper
  const content = (
    <div className="h-full bg-[#101927] text-white flex flex-col">
      {/* Header */}
      {showHeader && (
        <MobileHeaderVX
          title={title}
          showBackButton={showBackButton}
          onBackClick={onBackClick || (() => router.back())}
          showDepositButton={showDepositButton}
          headerRight={headerRight}
          headerLeft={headerLeft}
        />
      )}

      {/* Main Content */}
      <div 
        className={`flex flex-col overflow-hidden ${className}`}
        style={{ 
          height: fullHeight 
            ? `calc(100% - ${headerHeight}px)` 
            : `calc(100% - ${headerHeight}px - ${footerHeight}px)`
        }}
      >
        {children}
      </div>

      {/* Footer */}
      {showFooter && (
        <MobileFooterAppVX 
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      )}
    </div>
  );

  // With phone frame (for desktop preview)
  if (phoneFrame) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
        <div 
          className="bg-black rounded-3xl p-1"
          style={{ 
            width: '375px', 
            height: '812px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}
        >
          <div 
            className="bg-black rounded-3xl overflow-hidden relative"
            style={{ width: '100%', height: '100%' }}
          >
            {content}
          </div>
        </div>
      </div>
    );
  }

  // Without phone frame (for actual mobile)
  return (
    <div className="min-h-screen bg-[#101927]">
      {content}
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface MobileScrollContentVXProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Scrollable content area with hidden scrollbars
 */
export function MobileScrollContentVX({ 
  children, 
  className = '' 
}: MobileScrollContentVXProps): React.ReactElement {
  return (
    <div 
      className={`flex-1 min-h-0 overflow-y-auto ${className}`}
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {children}
    </div>
  );
}

interface MobileCenteredContentVXProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Centered content for empty states or loading
 */
export function MobileCenteredContentVX({ 
  children, 
  className = '' 
}: MobileCenteredContentVXProps): React.ReactElement {
  return (
    <div className={`flex-1 flex items-center justify-center px-6 ${className}`}>
      <div className="text-center">
        {children}
      </div>
    </div>
  );
}

interface MobileLoadingVXProps {
  message?: string;
}

/**
 * Loading spinner
 */
export function MobileLoadingVX({ 
  message = 'Loading...' 
}: MobileLoadingVXProps): React.ReactElement {
  return (
    <MobileCenteredContentVX>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
      <p className="text-gray-300">{message}</p>
    </MobileCenteredContentVX>
  );
}

interface MobileComingSoonVXProps {
  title?: string;
  message?: string;
}

/**
 * Coming soon placeholder
 */
export function MobileComingSoonVX({ 
  title = 'Coming Soon', 
  message = 'This feature is under development' 
}: MobileComingSoonVXProps): React.ReactElement {
  return (
    <MobileCenteredContentVX>
      <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
      <p className="text-gray-400">{message}</p>
    </MobileCenteredContentVX>
  );
}

