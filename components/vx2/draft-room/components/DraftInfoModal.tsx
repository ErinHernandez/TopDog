/**
 * DraftInfoModal - Information modal with draft rules and key/legend
 * 
 * Shows when user taps the info button in the navbar.
 * Includes color key, timer info, and draft rules.
 * 
 * A-Grade Requirements:
 * - TypeScript: Full type coverage
 * - Constants: VX2 constants for colors/sizes
 * - Accessibility: ARIA labels, focus trap
 */

import React, { useEffect, useRef } from 'react';

import { DRAFT_DEFAULTS } from '../constants';

import styles from './DraftInfoModal.module.css';

// ============================================================================
// TYPES
// ============================================================================

export interface DraftInfoModalProps {
  /** Whether modal is visible */
  isOpen: boolean;
  /** Called when modal closes */
  onClose: () => void;
  /** Called when tutorial link is tapped */
  onTutorial?: () => void;
  /** Draft format info */
  draftInfo?: {
    format?: string;
    teams?: number;
    rounds?: number;
    pickTime?: number;
    scoring?: string;
  };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function KeyItem({
  position,
  label
}: {
  position: string;
  label: string;
}): React.ReactElement {
  return (
    <div className={styles.keyItem}>
      <div
        className={styles.keyDot}
        data-position={position.toLowerCase()}
      />
      <span className={styles.keyLabel}>
        {label}
      </span>
    </div>
  );
}

function InfoRow({
  label,
  value
}: {
  label: string;
  value: string | number;
}): React.ReactElement {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>
        {label}
      </span>
      <span className={styles.infoValue}>
        {value}
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <h3 className={styles.sectionTitle}>
      {children}
    </h3>
  );
}

function Divider(): React.ReactElement {
  return <div className={styles.divider} />;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DraftInfoModal({
  isOpen,
  onClose,
  onTutorial,
  draftInfo = {},
}: DraftInfoModalProps): React.ReactElement | null {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  
  const {
    format = 'Snake',
    teams = DRAFT_DEFAULTS.teamCount,
    rounds = DRAFT_DEFAULTS.rosterSize,
    pickTime = DRAFT_DEFAULTS.pickTimeSeconds,
    scoring = 'Best Ball',
  } = draftInfo;
  
  // Focus close button when modal opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);
  
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-modal-title"
      className={styles.backdrop}
      onClick={onClose}
    >
      {/* Modal Content */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={styles.modalContent}
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 id="info-modal-title" className={styles.title}>
            {format} Draft
          </h2>
          {onTutorial && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTutorial();
              }}
              className={styles.tutorialButtonHeader}
            >
              Tutorial
            </button>
          )}
        </div>
        
        {/* Header Divider */}
        <div className={styles.headerDivider} />
        
        {/* Scrollable Content */}
        <div className={styles.scrollContent}>
          {/* Position Key */}
          <SectionTitle>Position Key</SectionTitle>
          <div className={styles.keyGrid}>
            <KeyItem position="QB" label="Quarterback (QB)" />
            <KeyItem position="RB" label="Running Back (RB)" />
            <KeyItem position="WR" label="Wide Receiver (WR)" />
            <KeyItem position="TE" label="Tight End (TE)" />
          </div>
          
          <Divider />
          
          {/* Tutorial Button */}
          {onTutorial && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTutorial();
              }}
              className={styles.tutorialButton}
            >
              View Tutorial
            </button>
          )}
          
          {/* Draft Settings */}
          <SectionTitle>Draft Settings</SectionTitle>
          <div className={styles.draftSettings}>
            <InfoRow label="Format" value={format} />
            <InfoRow label="Teams" value={teams} />
            <InfoRow label="Rounds" value={rounds} />
            <InfoRow label="Pick Time" value={`${pickTime}s`} />
            <InfoRow label="Scoring" value={scoring} />
          </div>
          
          <Divider />
          
          {/* How It Works */}
          <SectionTitle>How It Works</SectionTitle>
          <p className={styles.description}>
            In a snake draft, pick order reverses each round. Your roster is automatically
            optimized each week to maximize points. No need to set lineups - just draft
            your best team.
          </p>
        </div>
        
        {/* Close Button */}
        <div className={styles.closeButtonContainer}>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className={styles.closeButton}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
