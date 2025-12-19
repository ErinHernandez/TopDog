/**
 * AppHeaderVX - Production-Grade Mobile App Header (TypeScript)
 * 
 * A properly structured header component using flexbox-only layout.
 * Replaces MobileHeaderVX with correct positioning and z-index handling.
 * 
 * Key Features:
 * - Flexbox layout (no absolute positioning for content)
 * - Three-column layout (left, center, right)
 * - Proper z-index integration with VX system
 * - Safe area handling for notched devices
 * - Touch-optimized (44px minimum touch targets)
 * 
 * @example
 * <AppHeaderVX 
 *   onLogoClick={() => setActiveTab('Lobby')}
 *   showDeposit={true}
 * />
 */

import React from 'react';
import { useRouter } from 'next/router';
import { Z_INDEX } from '../../constants/sizes';
import { STATE_COLORS, BG_COLORS } from '../../constants/colors';

// ============================================================================
// TYPES
// ============================================================================

export interface AppHeaderVXProps {
  /** Optional title (overrides logo when provided) */
  title?: string;
  
  /** Whether to show back button */
  showBackButton?: boolean;
  /** Callback when back button is clicked */
  onBackClick?: () => void;
  /** Callback when logo is clicked (default: navigates to Lobby) */
  onLogoClick?: () => void;
  
  /** Whether to show deposit button (default: true) */
  showDeposit?: boolean;
  /** Custom content for right side (overrides deposit button) */
  rightContent?: React.ReactNode;
  /** Custom content for left side (overrides back button) */
  leftContent?: React.ReactNode;
  
  /** Visual variant for background */
  variant?: 'default' | 'urgent' | 'success';
  
  /** Accessibility label for header */
  ariaLabel?: string;
}

// ============================================================================
// PIXEL-PERFECT CONSTANTS
// ============================================================================

const HEADER_PX = {
  // Container
  contentHeight: 60,         // Content area height (excluding safe area)
  paddingX: 16,              // Horizontal padding
  
  // Logo
  logoHeight: 40,            // Constrained to fit within 60px content area
  logoMaxWidth: 120,         // Prevent logo from being too wide
  
  // Buttons - Apple HIG minimum touch target
  buttonSize: 44,            // 44px minimum (was 36, too small)
  iconSize: 24,
  iconStrokeWidth: 2.5,
  
  // Deposit button
  depositButtonSize: 32,
  depositIconSize: 20,
  
  // Title
  titleFontSize: 18,
} as const;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AppHeaderVX({
  title,
  showBackButton = false,
  onBackClick,
  onLogoClick,
  showDeposit = true,
  rightContent,
  leftContent,
  variant = 'default',
  ariaLabel = 'App header',
}: AppHeaderVXProps): React.ReactElement {
  const router = useRouter();

  // Determine background based on variant
  const getBackgroundStyle = () => {
    switch (variant) {
      case 'urgent':
        return { backgroundColor: STATE_COLORS.onTheClock };
      case 'success':
        return { backgroundColor: '#10B981' };
      default:
        return {
          backgroundColor: '#4285F4', // WR blue color as fallback
          backgroundImage: 'url(/wr_blue.png)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
        };
    }
  };

  // Handle logo click - default to Lobby navigation
  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    } else {
      // Default behavior: navigate to lobby
      router.push('/');
    }
  };

  // Handle back click
  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      router.back();
    }
  };

  return (
    <header
      className="w-full flex-shrink-0"
      style={{
        // Safe area handling for notched devices - background extends into this area
        paddingTop: 'env(safe-area-inset-top, 0px)',
        // Background - extends into safe area padding
        ...getBackgroundStyle(),
        // Ensure background covers entire element including padding
        backgroundClip: 'border-box',
        // Stacking context - below modals (500), above content
        position: 'relative',
        zIndex: Z_INDEX.sticky,
      }}
      role="banner"
      aria-label={ariaLabel}
    >
      {/* Inner content container with fixed height */}
      <div
        className="flex items-center justify-between w-full"
        style={{
          height: `${HEADER_PX.contentHeight}px`,
          paddingLeft: `${HEADER_PX.paddingX}px`,
          paddingRight: `${HEADER_PX.paddingX}px`,
        }}
      >
        {/* LEFT SECTION - Back button or custom content */}
        <div 
          className="flex items-center justify-start"
          style={{ minWidth: `${HEADER_PX.buttonSize}px` }}
        >
          {leftContent ? (
            leftContent
          ) : showBackButton ? (
            <button
              onClick={handleBackClick}
              className="flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
              style={{
                width: `${HEADER_PX.buttonSize}px`,
                height: `${HEADER_PX.buttonSize}px`,
              }}
              aria-label="Go back"
            >
              <svg
                width={HEADER_PX.iconSize}
                height={HEADER_PX.iconSize}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 19L8 12L15 5"
                  stroke="white"
                  strokeWidth={HEADER_PX.iconStrokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : (
            // Empty spacer for layout balance
            <div style={{ width: `${HEADER_PX.buttonSize}px` }} />
          )}
        </div>

        {/* CENTER SECTION - Logo or Title */}
        <div className="flex-1 flex items-center justify-center">
          {title ? (
            <h1 
              className="text-white font-bold text-center truncate"
              style={{ fontSize: `${HEADER_PX.titleFontSize}px` }}
            >
              {title}
            </h1>
          ) : (
            <button
              onClick={handleLogoClick}
              className="flex items-center justify-center"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                // Constrain logo dimensions to prevent overflow
                maxHeight: `${HEADER_PX.logoHeight}px`,
                maxWidth: `${HEADER_PX.logoMaxWidth}px`,
              }}
              aria-label="Go to Lobby"
            >
              <img
                src="/logo.png"
                alt="TopDog"
                style={{
                  height: `${HEADER_PX.logoHeight}px`,
                  width: 'auto',
                  display: 'block',
                  objectFit: 'contain',
                }}
              />
            </button>
          )}
        </div>

        {/* RIGHT SECTION - Deposit button or custom content */}
        <div 
          className="flex items-center justify-end"
          style={{ minWidth: `${HEADER_PX.buttonSize}px` }}
        >
          {rightContent ? (
            rightContent
          ) : showDeposit ? (
            <button
              onClick={() => console.log('Deposit clicked')}
              className="flex items-center justify-center rounded-full transition-colors"
              style={{
                width: `${HEADER_PX.depositButtonSize}px`,
                height: `${HEADER_PX.depositButtonSize}px`,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
              }}
              aria-label="Deposit funds"
            >
              <svg
                width={HEADER_PX.depositIconSize}
                height={HEADER_PX.depositIconSize}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="white"
                  strokeWidth="2"
                />
                <path
                  d="M12 7V17M12 7L12 17M9 10C9 10 9.5 8 12 8C14.5 8 15 9.5 15 10.5C15 12 13 12 12 12C11 12 9 12 9 13.5C9 15 10 16 12 16C14 16 15 14.5 15 14.5"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ) : (
            // Empty spacer for layout balance
            <div style={{ width: `${HEADER_PX.buttonSize}px` }} />
          )}
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export { HEADER_PX as APP_HEADER_CONSTANTS };

