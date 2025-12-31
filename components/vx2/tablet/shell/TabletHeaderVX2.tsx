/**
 * TabletHeaderVX2 - Tablet Header Bar
 * 
 * Top header for tablet app shell with logo, navigation, and actions.
 * Optimized for landscape orientation.
 */

import React, { type ReactElement } from 'react';
import { BG_COLORS, TEXT_COLORS, BRAND_COLORS } from '../../core/constants/colors';
import { TABLET_HEADER, TABLET_SAFE_AREA, TABLET_Z_INDEX } from '../../core/constants/tablet';

// ============================================================================
// TYPES
// ============================================================================

export interface TabletHeaderVX2Props {
  /** Show back button */
  showBackButton?: boolean;
  /** Back button click handler */
  onBackClick?: () => void;
  /** Show deposit button */
  showDeposit?: boolean;
  /** Deposit button click handler */
  onDepositClick?: () => void;
  /** Custom title (instead of logo) */
  title?: string;
  /** Right-side action button */
  rightAction?: React.ReactNode;
  /** Use tiled background */
  useTiledBackground?: boolean;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function BackButton({ onClick }: { onClick?: () => void }): ReactElement {
  return (
    <button
      onClick={onClick}
      style={{
        width: TABLET_HEADER.buttonSize,
        height: TABLET_HEADER.buttonSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        borderRadius: 8,
      }}
      aria-label="Go back"
    >
      <svg
        width={TABLET_HEADER.iconSize}
        height={TABLET_HEADER.iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={TEXT_COLORS.primary}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}

function DepositButton({ onClick }: { onClick?: () => void }): ReactElement {
  return (
    <button
      onClick={onClick}
      style={{
        height: 36,
        paddingLeft: 16,
        paddingRight: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: BRAND_COLORS.primary,
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        color: '#000000',
        fontSize: 14,
        fontWeight: 600,
      }}
      aria-label="Deposit funds"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      Deposit
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TabletHeaderVX2({
  showBackButton = false,
  onBackClick,
  showDeposit = true,
  onDepositClick,
  title,
  rightAction,
  useTiledBackground = true,
}: TabletHeaderVX2Props): ReactElement {
  const backgroundStyle = useTiledBackground
    ? {
        backgroundImage: 'url(/wr_blue.png)',
        backgroundRepeat: 'repeat',
        backgroundSize: '60px 60px',
        backgroundColor: '#1E3A5F',
      }
    : {
        backgroundColor: '#1E3A5F',
      };
  
  return (
    <header
      style={{
        height: TABLET_HEADER.height,
        ...backgroundStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: `max(${TABLET_HEADER.paddingX}px, ${TABLET_SAFE_AREA.left})`,
        paddingRight: `max(${TABLET_HEADER.paddingX}px, ${TABLET_SAFE_AREA.right})`,
        position: 'relative',
        zIndex: TABLET_Z_INDEX.header,
      }}
    >
      {/* Left Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {showBackButton && <BackButton onClick={onBackClick} />}
        
        {title ? (
          <h1
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: TEXT_COLORS.primary,
              margin: 0,
            }}
          >
            {title}
          </h1>
        ) : (
          <img
            src="/logo.png"
            alt="TopDog"
            style={{
              height: TABLET_HEADER.logoHeight,
              width: 'auto',
            }}
          />
        )}
      </div>
      
      {/* Right Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {rightAction}
        {showDeposit && <DepositButton onClick={onDepositClick} />}
      </div>
    </header>
  );
}

