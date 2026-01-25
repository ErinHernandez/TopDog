/**
 * MobileLayout - Unified Mobile Page Layout Wrapper
 * 
 * Provides consistent structure for all mobile pages:
 * - Phone frame simulation (for desktop preview)
 * - Header with logo and navigation
 * - Content area with proper safe areas
 * - Footer navigation
 * 
 * Props:
 *   - children: Page content
 *   - title: Optional page title (shown in header)
 *   - showHeader: Whether to show the header (default: true)
 *   - showFooter: Whether to show the footer (default: true)
 *   - showBackButton: Whether to show back button
 *   - onBackClick: Callback for back button
 *   - showDepositButton: Whether to show deposit button (default: true)
 *   - activeTab: Current active footer tab
 *   - onTabChange: Callback for footer tab change
 *   - headerRight: Custom right side header content
 *   - headerLeft: Custom left side header content
 *   - phoneFrame: Whether to show phone frame simulation (default: true)
 *   - fullHeight: Whether content should take full height (default: false)
 */

import React from 'react';
import { useRouter } from 'next/router';
import MobileFooter from './MobileFooter';
import { MOBILE_SIZES, PLATFORM_SPECIFIC } from '../draft/v3/mobile/shared/constants/mobileSizes';

export default function MobileLayout({
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
}) {
  const router = useRouter();

  // Header height calculation
  const headerHeight = showHeader ? 60 : 0;
  const footerHeight = showFooter ? 80 : 0;

  // Content wrapper
  const content = (
    <div className="h-full bg-[#101927] text-white flex flex-col">
      {/* Header */}
      {showHeader && (
        <MobileHeader
          title={title}
          showBackButton={showBackButton}
          onBackClick={onBackClick}
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
        <MobileFooter 
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

// ============================================
// MOBILE HEADER COMPONENT
// ============================================

export function MobileHeader({
  title,
  showBackButton = false,
  onBackClick,
  showDepositButton = true,
  headerRight,
  headerLeft
}) {
  const router = useRouter();

  return (
    <div 
      className="w-full shadow-lg relative flex-shrink-0"
      style={{
        background: 'url(/wr_blue.png) no-repeat center center',
        backgroundSize: 'cover',
        paddingTop: PLATFORM_SPECIFIC.IOS.SAFE_AREA_TOP,
        height: '60px'
      }}
    >
      {/* Left Side */}
      <div className="absolute left-4" style={{ top: '50%', transform: 'translateY(-50%)' }}>
        {headerLeft ? (
          headerLeft
        ) : showBackButton ? (
          <button
            onClick={onBackClick || (() => router.back())}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ minHeight: MOBILE_SIZES.TOUCH_TARGET_MIN }}
          >
            <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>
        ) : null}
      </div>

      {/* Center - Logo or Title */}
      {title ? (
        <h1 
          className="absolute text-white font-bold text-lg"
          style={{ 
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          {title}
        </h1>
      ) : (
        <img 
          src="/logo.png" 
          alt="TopDog.dog Logo" 
          className="absolute"
          style={{ 
            height: '64px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        />
      )}

      {/* Right Side */}
      <div className="absolute right-4" style={{ top: '50%', transform: 'translateY(-50%)' }}>
        {headerRight ? (
          headerRight
        ) : showDepositButton ? (
          <button 
            onClick={() => router.push('/mobile-payment')}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ minHeight: MOBILE_SIZES.TOUCH_TARGET_MIN }}
            title="Deposit funds"
          >
            <svg 
              className="text-white" 
              fill="currentColor" 
              viewBox="0 0 24 24"
              style={{ width: '23px', height: '23px' }}
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ============================================
// MOBILE CONTENT HELPERS
// ============================================

/**
 * Scrollable content area with hidden scrollbars
 */
export function MobileScrollContent({ children, className = '' }) {
  return (
    <div className={`flex-1 min-h-0 overflow-y-auto mobile-no-scrollbar ${className}`}>
      {children}
    </div>
  );
}

/**
 * Centered content for empty states or loading
 */
export function MobileCenteredContent({ children, className = '' }) {
  return (
    <div className={`flex-1 flex items-center justify-center px-6 ${className}`}>
      <div className="text-center">
        {children}
      </div>
    </div>
  );
}

/**
 * Loading spinner
 */
export function MobileLoading({ message = 'Loading...' }) {
  return (
    <MobileCenteredContent>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
      <p className="text-gray-300">{message}</p>
    </MobileCenteredContent>
  );
}

/**
 * Coming soon placeholder
 */
export function MobileComingSoon({ title = 'Coming Soon', message = 'This feature is under development' }) {
  return (
    <MobileCenteredContent>
      <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
      <p className="text-gray-400">{message}</p>
    </MobileCenteredContent>
  );
}

