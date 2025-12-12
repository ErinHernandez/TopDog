/**
 * AppHeaderVX2 - App Header Component
 * 
 * Migrated from VX AppHeaderVX with improvements:
 * - Integration with TabNavigationContext
 * - Cleaner props interface
 * - Better accessibility
 */

import React from 'react';
import { useTabNavigation } from '../core';
import { HEADER, Z_INDEX, SAFE_AREA } from '../core/constants';
import { HEADER_COLORS, STATE_COLORS } from '../core/constants/colors';

// ============================================================================
// TYPES
// ============================================================================

export interface AppHeaderVX2Props {
  /** Optional title (overrides logo when provided) */
  title?: string;
  /** Whether to show back button */
  showBackButton?: boolean;
  /** Callback when back button is clicked */
  onBackClick?: () => void;
  /** Whether to show deposit button (default: true) */
  showDeposit?: boolean;
  /** Custom content for right side (overrides deposit button) */
  rightContent?: React.ReactNode;
  /** Custom content for left side (overrides back button) */
  leftContent?: React.ReactNode;
  /** Visual variant for background */
  variant?: 'default' | 'urgent' | 'success';
}

// ============================================================================
// ICON COMPONENTS
// ============================================================================

function BackIcon(): React.ReactElement {
  return (
    <svg
      width={HEADER.iconSize}
      height={HEADER.iconSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 19L8 12L15 5"
        stroke="white"
        strokeWidth={HEADER.iconStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DepositIcon(): React.ReactElement {
  return (
    <svg
      width={HEADER.depositIconSize}
      height={HEADER.depositIconSize}
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
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AppHeaderVX2({
  title,
  showBackButton = false,
  onBackClick,
  showDeposit = true,
  rightContent,
  leftContent,
  variant = 'default',
}: AppHeaderVX2Props): React.ReactElement {
  const { navigateToTab } = useTabNavigation();

  // Determine background based on variant
  const getBackgroundStyle = (): React.CSSProperties => {
    switch (variant) {
      case 'urgent':
        return { backgroundColor: STATE_COLORS.onTheClock };
      case 'success':
        return { backgroundColor: STATE_COLORS.success };
      default:
        return {
          background: 'url(/wr_blue.png) no-repeat center center',
          backgroundSize: 'cover',
        };
    }
  };

  // Handle logo click - navigate to Lobby
  const handleLogoClick = () => {
    navigateToTab('lobby');
  };

  // Handle back click
  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    }
  };

  return (
    <header
      className="w-full flex-shrink-0"
      style={{
        // Safe area handling for notched devices
        paddingTop: SAFE_AREA.top,
        // Background
        ...getBackgroundStyle(),
        // Stacking context
        position: 'relative',
        zIndex: Z_INDEX.header,
      }}
      role="banner"
    >
      {/* Inner content container with fixed height */}
      <div
        className="flex items-center justify-between w-full"
        style={{
          height: `${HEADER.height}px`,
          paddingLeft: `${HEADER.paddingX}px`,
          paddingRight: `${HEADER.paddingX}px`,
        }}
      >
        {/* LEFT SECTION - Back button or custom content */}
        <div 
          className="flex items-center justify-start"
          style={{ minWidth: `${HEADER.buttonSize}px` }}
        >
          {leftContent ? (
            leftContent
          ) : showBackButton ? (
            <button
              onClick={handleBackClick}
              className="flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
              style={{
                width: `${HEADER.buttonSize}px`,
                height: `${HEADER.buttonSize}px`,
              }}
              aria-label="Go back"
            >
              <BackIcon />
            </button>
          ) : (
            // Empty spacer for layout balance
            <div style={{ width: `${HEADER.buttonSize}px` }} />
          )}
        </div>

        {/* CENTER SECTION - Logo or Title */}
        <div className="flex-1 flex items-center justify-center">
          {title ? (
            <h1 
              className="text-white font-bold text-center truncate"
              style={{ fontSize: `${HEADER.titleFontSize}px` }}
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
                maxHeight: `${HEADER.logoHeight}px`,
                maxWidth: `${HEADER.logoMaxWidth}px`,
              }}
              aria-label="Go to Lobby"
            >
              <img
                src="/logo.png"
                alt="TopDog"
                style={{
                  height: `${HEADER.logoHeight}px`,
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
          style={{ minWidth: `${HEADER.buttonSize}px` }}
        >
          {rightContent ? (
            rightContent
          ) : showDeposit ? (
            <button
              onClick={() => console.log('Deposit clicked')}
              className="flex items-center justify-center rounded-full transition-colors"
              style={{
                width: `${HEADER.depositButtonSize}px`,
                height: `${HEADER.depositButtonSize}px`,
                backgroundColor: HEADER_COLORS.depositButton,
              }}
              aria-label="Deposit funds"
            >
              <DepositIcon />
            </button>
          ) : (
            // Empty spacer for layout balance
            <div style={{ width: `${HEADER.buttonSize}px` }} />
          )}
        </div>
      </div>
    </header>
  );
}

