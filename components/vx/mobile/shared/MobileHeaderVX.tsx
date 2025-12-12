/**
 * MobileHeaderVX - Mobile App Header (TypeScript)
 * 
 * Migrated from: components/mobile/MobileLayout.js (MobileHeader component)
 * 
 * Header with logo, back button, and deposit button
 */

import React from 'react';
import { useRouter } from 'next/router';

// ============================================================================
// TYPES
// ============================================================================

export interface MobileHeaderVXProps {
  /** Page title (if provided, shown instead of logo) */
  title?: string;
  /** Whether to show back button */
  showBackButton?: boolean;
  /** Callback for back button */
  onBackClick?: () => void;
  /** Whether to show deposit button (default: true) */
  showDepositButton?: boolean;
  /** Custom right side header content */
  headerRight?: React.ReactNode;
  /** Custom left side header content */
  headerLeft?: React.ReactNode;
  /** Callback when logo is clicked */
  onLogoClick?: () => void;
}

// ============================================================================
// PIXEL-PERFECT CONSTANTS
// ============================================================================

const HEADER_PX = {
  // Container - total height includes safe area
  height: 60,  // Content area height
  paddingX: 16,
  
  // Logo
  logoHeight: 40,
  
  // Title
  titleFontSize: 18,
  
  // Buttons
  buttonSize: 36,
  buttonRadius: 18,
  iconSize: 24,
  depositIconSize: 23,
} as const;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MobileHeaderVX({
  title,
  showBackButton = false,
  onBackClick,
  showDepositButton = true,
  headerRight,
  headerLeft,
  onLogoClick
}: MobileHeaderVXProps): React.ReactElement {
  const router = useRouter();

  return (
    <div 
      className="w-full shadow-lg flex-shrink-0"
      style={{
        background: 'url(/wr_blue.png) no-repeat center center',
        backgroundSize: 'cover',
        height: `${HEADER_PX.height}px`,
        position: 'relative',
        zIndex: 50, // Above content, below modals
      }}
    >
      {/* Left Side - Back Button (absolute positioned) */}
      {(headerLeft || showBackButton) && (
        <button
          onClick={onBackClick || (() => router.back())}
          className="absolute"
          style={{
            left: `${HEADER_PX.paddingX}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            minHeight: `${HEADER_PX.buttonSize}px`,
            minWidth: `${HEADER_PX.buttonSize}px`,
          }}
          title="Go back"
        >
          {headerLeft || (
            <div 
              className="rounded-full flex items-center justify-center"
              style={{
                width: `${HEADER_PX.buttonSize}px`,
                height: `${HEADER_PX.buttonSize}px`,
              }}
            >
              <svg 
                fill="white" 
                viewBox="0 0 24 24"
                style={{
                  width: `${HEADER_PX.iconSize}px`,
                  height: `${HEADER_PX.iconSize}px`,
                }}
              >
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </div>
          )}
        </button>
      )}

      {/* Center - Logo or Title (absolute positioned) */}
      {title ? (
        <h1 
          className="absolute text-white font-bold"
          style={{
            fontSize: `${HEADER_PX.titleFontSize}px`,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {title}
        </h1>
      ) : (
        <button
          onClick={onLogoClick}
          className="absolute"
          style={{ 
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: onLogoClick ? 'pointer' : 'default',
          }}
          aria-label="Go to Lobby"
        >
          <img 
            src="/logo.png" 
            alt="TopDog.dog Logo" 
            style={{ 
              height: `${HEADER_PX.logoHeight}px`,
            }}
          />
        </button>
      )}

      {/* Right Side - Deposit Button (absolute positioned) */}
      {(headerRight || showDepositButton) && (
        <button 
          className="absolute"
          style={{
            right: `${HEADER_PX.paddingX}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            minHeight: `${HEADER_PX.buttonSize}px`,
            minWidth: `${HEADER_PX.buttonSize}px`,
          }}
          title="Deposit funds"
          onClick={() => router.push('/mobile-payment')}
        >
          {headerRight || (
            <div 
              className="rounded-full flex items-center justify-center"
              style={{
                width: `${HEADER_PX.buttonSize}px`,
                height: `${HEADER_PX.buttonSize}px`,
              }}
            >
              <svg 
                className="text-white" 
                fill="currentColor" 
                viewBox="0 0 24 24"
                style={{ 
                  width: `${HEADER_PX.depositIconSize}px`, 
                  height: `${HEADER_PX.depositIconSize}px`,
                }}
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
              </svg>
            </div>
          )}
        </button>
      )}
    </div>
  );
}

