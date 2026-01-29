/**
 * PicksBarCard - Sandbox Component
 * Built from scratch using TeamHeader as exact template
 *
 * CSP-compliant version using CSS Modules for styling.
 * Dynamic values are handled via CSS custom properties.
 */

import React from 'react';
import { cn } from '@/lib/styles';
import styles from './PicksBarCard.module.css';

// ============================================================================
// CONSTANTS - Exact copy from Board's TeamHeader
// ============================================================================

const CARD = {
  // Outer container - EXACT from TeamHeader
  width: 92,
  minWidth: 92,
  margin: 1,
  borderRadius: 6,
  borderWidth: 4,
  backgroundColor: '#374151', // rgb(55, 65, 81)
  
  // Header section
  headerHeight: 20,
  headerFontSize: 10,
  headerMaxChars: 12,
  
  // Content area
  contentMinHeight: 70,
  contentPaddingBottom: 8,
  
  // Tracker bar
  trackerHeight: 9,
  trackerWidth: 78,
  trackerEmptyWidth: 79,
  trackerMarginTop: 2,
  trackerBorderRadius: 1,
} as const;

const COLORS = {
  userBorder: '#3B82F6',    // Blue
  otherBorder: '#6B7280',   // Gray
  onTheClockBorder: '#EF4444', // Red
  trackerEmpty: '#6B7280',
} as const;

// ============================================================================
// COMPONENT
// ============================================================================

interface PicksBarCardProps {
  participantName: string;
  isUser: boolean;
  isOnTheClock?: boolean;
  pickNumber?: string;
  children?: React.ReactNode;
}

export default function PicksBarCard({
  participantName,
  isUser,
  isOnTheClock = false,
  pickNumber,
  children,
}: PicksBarCardProps): React.ReactElement {
  // Determine border color
  const borderColor = isOnTheClock && isUser 
    ? COLORS.onTheClockBorder 
    : isUser 
      ? COLORS.userBorder 
      : COLORS.otherBorder;
  
  // Truncate name
  const displayName = participantName.length > CARD.headerMaxChars
    ? participantName.substring(0, CARD.headerMaxChars)
    : participantName;

  // Determine border color variant class
  const borderColorClass = isOnTheClock && isUser
    ? styles.borderOnTheClockRed
    : isUser
      ? styles.borderUserBlue
      : styles.borderGray;

  return (
    // Outer Container - EXACT TeamHeader styling (now via CSS Module)
    <div className={cn(styles.container, borderColorClass)}>
      {/* Header - Participant Name */}
      <div className={styles.header}>
        {displayName}
      </div>

      {/* Content Area */}
      <div className={styles.content}>
        {/* Pick Number (top-left) */}
        {pickNumber && <div className={styles.pickNumber}>{pickNumber}</div>}

        {/* Center content (timer, player info, etc.) */}
        <div className={styles.centerContent}>{children}</div>

        {/* Position Tracker Bar */}
        <div className={styles.trackerContainer}>
          <div className={styles.tracker} />
        </div>
      </div>
    </div>
  );
}

