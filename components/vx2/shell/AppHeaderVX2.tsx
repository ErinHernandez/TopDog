/**
 * AppHeaderVX2 - App Header Component
 *
 * Migrated from VX AppHeaderVX with improvements:
 * - Integration with TabNavigationContext
 * - Cleaner props interface
 * - Better accessibility
 *
 * Migrated to CSS Modules for CSP compliance.
 */

import { useRouter } from 'next/router';
import React, { useContext } from 'react';

import { cn } from '@/lib/styles';

import { createScopedLogger } from '../../../lib/clientLogger';
import { HEADER } from '../core/constants';
import { TabNavigationContext } from '../core/context/TabNavigationContext';


import styles from './AppHeaderVX2.module.css';

const logger = createScopedLogger('[AppHeader]');

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
  /** Callback when deposit button is clicked */
  onDepositClick?: () => void;
  /** Custom content for right side (overrides deposit button) */
  rightContent?: React.ReactNode;
  /** Custom content for left side (overrides back button) */
  leftContent?: React.ReactNode;
  /** Visual variant for background */
  variant?: 'default' | 'urgent' | 'success';
  /** Hide the center logo (for when logo is rendered as overlay) */
  hideLogo?: boolean;
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
  onDepositClick,
  rightContent,
  leftContent,
  variant = 'default',
  hideLogo = false,
}: AppHeaderVX2Props): React.ReactElement {
  // Try to get tab navigation context (may not be available in standalone pages)
  const tabNavigationContext = useContext(TabNavigationContext);
  const router = useRouter();

  // Determine header class based on variant
  const getHeaderClass = (): string => {
    switch (variant) {
      case 'urgent':
        return styles.headerUrgent!;
      case 'success':
        return styles.headerSuccess!;
      default:
        return styles.headerDefault!;
    }
  };

  // Handle logo click - navigate to Lobby
  // Use tab navigation if available, otherwise use router
  const handleLogoClick = () => {
    if (tabNavigationContext?.navigateToTab) {
      tabNavigationContext.navigateToTab('lobby');
    } else {
      // Fallback for standalone pages - navigate to home
      router.push('/');
    }
  };

  // Handle back click
  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    }
  };

  return (
    <header
      className={cn(styles.header, getHeaderClass())}
      role="banner"
    >
      {/* Inner content container with fixed height */}
      <div className={styles.innerContent}>
        {/* LEFT SECTION - Back button or custom content */}
        <div className={styles.leftSection}>
          {leftContent ? (
            leftContent
          ) : showBackButton ? (
            <button
              onClick={handleBackClick}
              className={styles.iconButton}
              aria-label="Go back"
            >
              <BackIcon />
            </button>
          ) : (
            // Empty spacer for layout balance
            <div className={styles.spacer} />
          )}
        </div>
      </div>
    </header>
  );
}
