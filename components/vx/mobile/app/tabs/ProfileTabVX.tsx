/**
 * ProfileTabVX - User Profile Tab (TypeScript)
 * 
 * Pixel-perfect match to: components/mobile/tabs/ProfileTab.js
 * 
 * Shows user avatar customization box and profile menu options
 */

import React from 'react';

// ============================================================================
// PIXEL-PERFECT CONSTANTS (matching ProfileTab.js)
// ============================================================================

const PROFILE_PX = {
  // Container
  containerPaddingX: 24,
  containerPaddingY: 32,
  
  // Player Box
  boxWidth: 120,
  boxHeight: 140,
  boxBorderWidth: 6,
  boxTopBorderWidth: 32,
  boxBorderRadius: 11,
  
  // Username in border
  usernameFontSize: 12,
  usernameTop: -16,
  usernamePadding: 2,
  
  // Placeholder text
  placeholderFontSize: 12,
  
  // Title section
  titleMarginBottom: 32,
  boxMarginBottom: 16,
  titleFontSize: 20,
  subtitleFontSize: 14,
  titleMarginBottomSmall: 8,
  
  // Menu items
  menuGap: 16,
  menuButtonPaddingY: 12,
  menuButtonPaddingX: 16,
  menuButtonBorderRadius: 8,
  menuButtonFontSize: 14,
  menuIconSize: 20,
} as const;

const PROFILE_COLORS = {
  background: '#101927',
  boxBorder: '#ef4444',
  boxBg: '#18181a',
  menuButtonBg: '#374151',
  menuButtonHover: '#4b5563',
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  usernameText: '#000000',
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface ProfileTabVXProps {
  /** Callback to open autodraft limits modal */
  onOpenAutodraftLimits?: () => void;
  /** Callback to open rankings modal */
  onOpenRankings?: () => void;
  /** Callback to open deposit history modal */
  onOpenDepositHistory?: () => void;
  /** Callback to open withdraw modal */
  onOpenWithdraw?: () => void;
}

interface ProfileMenuItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactElement;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_USER = {
  displayName: 'TopDogPlayer',
  email: 'player@topdog.dog',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProfileTabVX({ onOpenAutodraftLimits, onOpenRankings, onOpenDepositHistory, onOpenWithdraw }: ProfileTabVXProps): React.ReactElement {
  const menuItems: ProfileMenuItem[] = [
    {
      id: 'payment',
      label: 'Payment Methods',
      path: '/testing-grounds/vx-mobile-app-demo/payment-methods',
      icon: (
        <svg 
          width={PROFILE_PX.menuIconSize} 
          height={PROFILE_PX.menuIconSize} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      id: 'rankings',
      label: 'Rankings',
      path: '/testing-grounds/vx-mobile-app-demo/rankings',
      icon: (
        <svg 
          width={PROFILE_PX.menuIconSize} 
          height={PROFILE_PX.menuIconSize} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      ),
    },
    {
      id: 'customization',
      label: 'Customization',
      path: '/testing-grounds/vx-mobile-app-demo/customization',
      icon: (
        <svg 
          width={PROFILE_PX.menuIconSize} 
          height={PROFILE_PX.menuIconSize} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5v12a2 2 0 002 2 2 2 0 002-2V3zM17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2m-2-4h2m-2-4h2m-2 8h2" />
        </svg>
      ),
    },
    {
      id: 'autodraft',
      label: 'Autodraft Limits',
      path: '/testing-grounds/vx-mobile-app-demo/autodraft-limits',
      icon: (
        <svg 
          width={PROFILE_PX.menuIconSize} 
          height={PROFILE_PX.menuIconSize} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      ),
    },
    {
      id: 'profile',
      label: 'Account Information',
      path: '/testing-grounds/vx-mobile-app-demo/account-information',
      icon: (
        <svg 
          width={PROFILE_PX.menuIconSize} 
          height={PROFILE_PX.menuIconSize} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      ),
    },
    {
      id: 'history',
      label: 'Deposit History',
      path: '/testing-grounds/vx-mobile-app-demo/deposit-history',
      icon: (
        <svg 
          width={PROFILE_PX.menuIconSize} 
          height={PROFILE_PX.menuIconSize} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      id: 'withdraw',
      label: 'Withdraw',
      path: '/testing-grounds/vx-mobile-app-demo/withdraw',
      icon: (
        <svg 
          width={PROFILE_PX.menuIconSize} 
          height={PROFILE_PX.menuIconSize} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const handleMenuClick = (item: ProfileMenuItem) => {
    // Handle autodraft modal - stays in profile context
    if (item.id === 'autodraft' && onOpenAutodraftLimits) {
      onOpenAutodraftLimits();
      return;
    }
    // Handle rankings modal - stays in profile context
    if (item.id === 'rankings' && onOpenRankings) {
      onOpenRankings();
      return;
    }
    // Handle deposit history modal - stays in profile context
    if (item.id === 'history' && onOpenDepositHistory) {
      onOpenDepositHistory();
      return;
    }
    // Handle withdraw modal - stays in profile context
    if (item.id === 'withdraw' && onOpenWithdraw) {
      onOpenWithdraw();
      return;
    }
    // Other items would use router.push(item.path) in real implementation
    console.log('Navigate to:', item.path);
  };

  return (
    <div 
      className="flex-1 flex flex-col"
      style={{
        paddingLeft: `${PROFILE_PX.containerPaddingX}px`,
        paddingRight: `${PROFILE_PX.containerPaddingX}px`,
        paddingTop: `${PROFILE_PX.containerPaddingY}px`,
        paddingBottom: `${PROFILE_PX.containerPaddingY}px`,
      }}
    >
      {/* Header Section */}
      <div 
        className="text-center"
        style={{ marginBottom: `${PROFILE_PX.titleMarginBottom}px` }}
      >
        {/* Custom Player Box */}
        <div 
          className="flex justify-center"
          style={{ marginBottom: `${PROFILE_PX.boxMarginBottom}px` }}
        >
          <div
            className="flex-shrink-0 font-medium flex flex-col"
            style={{
              width: `${PROFILE_PX.boxWidth}px`,
              height: `${PROFILE_PX.boxHeight}px`,
              borderWidth: `${PROFILE_PX.boxBorderWidth}px`,
              borderStyle: 'solid',
              borderColor: PROFILE_COLORS.boxBorder,
              borderTopWidth: `${PROFILE_PX.boxTopBorderWidth}px`,
              backgroundColor: PROFILE_COLORS.boxBg,
              borderRadius: `${PROFILE_PX.boxBorderRadius}px`,
              position: 'relative',
              overflow: 'visible',
            }}
          >
            {/* Username in border area */}
            <div
              className="absolute left-0 right-0 font-bold text-center truncate"
              style={{
                fontSize: `${PROFILE_PX.usernameFontSize}px`,
                color: PROFILE_COLORS.usernameText,
                backgroundColor: 'transparent',
                zIndex: 10, // Below modal (500), above red box
                padding: `${PROFILE_PX.usernamePadding}px`,
                top: `${PROFILE_PX.usernameTop}px`,
                transform: 'translateY(-50%)',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                maxWidth: '100%',
                width: '100%',
                textTransform: 'uppercase',
              }}
            >
              {MOCK_USER.displayName || MOCK_USER.email || 'Username'}
            </div>

            {/* Empty content area - ready for customization */}
            <div className="flex-1 flex items-center justify-center">
              <div 
                className="text-center"
                style={{
                  fontSize: `${PROFILE_PX.placeholderFontSize}px`,
                  color: PROFILE_COLORS.textMuted,
                }}
              >
                Background
                <br />
                Customization
                <br />
                Coming Soon
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Menu Options */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: `${PROFILE_PX.menuGap}px`,
        }}
      >
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleMenuClick(item)}
            className="w-full flex items-center justify-between font-semibold transition-colors duration-200"
            style={{
              backgroundColor: PROFILE_COLORS.menuButtonBg,
              color: PROFILE_COLORS.textPrimary,
              paddingTop: `${PROFILE_PX.menuButtonPaddingY}px`,
              paddingBottom: `${PROFILE_PX.menuButtonPaddingY}px`,
              paddingLeft: `${PROFILE_PX.menuButtonPaddingX}px`,
              paddingRight: `${PROFILE_PX.menuButtonPaddingX}px`,
              borderRadius: `${PROFILE_PX.menuButtonBorderRadius}px`,
              fontSize: `${PROFILE_PX.menuButtonFontSize}px`,
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = PROFILE_COLORS.menuButtonHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = PROFILE_COLORS.menuButtonBg;
            }}
          >
            <span>{item.label}</span>
            {item.icon}
          </button>
        ))}
      </div>

    </div>
  );
}
