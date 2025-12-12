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
import { SPACING } from '../../core/constants/sizes';
import { POSITION_COLORS } from '../../core/constants/colors';

// ============================================================================
// CONSTANTS
// ============================================================================

const MODAL_COLORS = {
  backdrop: 'rgba(0, 0, 0, 0.7)',
  background: '#1E293B',
  title: '#FFFFFF',
  sectionTitle: '#FFFFFF',
  text: '#94A3B8',
  textLight: '#64748B',
  closeButton: '#475569',
  closeButtonText: '#FFFFFF',
  divider: '#334155',
  keyDot: '#FFFFFF',
} as const;

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
  color, 
  label 
}: { 
  color: string; 
  label: string; 
}): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 14,
          color: MODAL_COLORS.text,
        }}
      >
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
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        paddingBottom: 8,
      }}
    >
      <span
        style={{
          fontSize: 14,
          color: MODAL_COLORS.textLight,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: MODAL_COLORS.title,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <h3
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: MODAL_COLORS.textLight,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 12,
      }}
    >
      {children}
    </h3>
  );
}

function Divider(): React.ReactElement {
  return (
    <div
      style={{
        height: 1,
        backgroundColor: MODAL_COLORS.divider,
        marginTop: 16,
        marginBottom: 16,
      }}
    />
  );
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
    teams = 12,
    rounds = 18,
    pickTime = 30,
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
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: MODAL_COLORS.backdrop,
        zIndex: 1000,
        padding: SPACING.md,
      }}
      onClick={onClose}
    >
      {/* Modal Content */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 340,
          maxHeight: '80%',
          backgroundColor: MODAL_COLORS.background,
          borderRadius: 20,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 20px 0 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            id="info-modal-title"
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: MODAL_COLORS.title,
              margin: 0,
            }}
          >
            {format} Draft
          </h2>
          {onTutorial && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTutorial();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#3B82F6',
                fontSize: 16,
                fontWeight: 500,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Tutorial
            </button>
          )}
        </div>
        
        {/* Header Divider */}
        <div
          style={{
            height: 1,
            backgroundColor: MODAL_COLORS.divider,
            marginLeft: 20,
            marginRight: 20,
            marginTop: 16,
          }}
        />
        
        {/* Scrollable Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
          }}
        >
          {/* Position Key */}
          <SectionTitle>Position Key</SectionTitle>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}
          >
            <KeyItem color={POSITION_COLORS.QB} label="Quarterback (QB)" />
            <KeyItem color={POSITION_COLORS.RB} label="Running Back (RB)" />
            <KeyItem color={POSITION_COLORS.WR} label="Wide Receiver (WR)" />
            <KeyItem color={POSITION_COLORS.TE} label="Tight End (TE)" />
          </div>
          
          <Divider />
          
          {/* Tutorial Button */}
          {onTutorial && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTutorial();
              }}
              style={{
                width: '100%',
                height: 44,
                backgroundColor: '#3B82F6',
                border: 'none',
                borderRadius: 10,
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 16,
              }}
            >
              View Tutorial
            </button>
          )}
          
          {/* Draft Settings */}
          <SectionTitle>Draft Settings</SectionTitle>
          <div>
            <InfoRow label="Format" value={format} />
            <InfoRow label="Teams" value={teams} />
            <InfoRow label="Rounds" value={rounds} />
            <InfoRow label="Pick Time" value={`${pickTime}s`} />
            <InfoRow label="Scoring" value={scoring} />
          </div>
          
          <Divider />
          
          {/* How It Works */}
          <SectionTitle>How It Works</SectionTitle>
          <p
            style={{
              fontSize: 14,
              color: MODAL_COLORS.text,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            In a snake draft, pick order reverses each round. Your roster is automatically
            optimized each week to maximize points. No need to set lineups - just draft
            your best team.
          </p>
        </div>
        
        {/* Close Button */}
        <div
          style={{
            padding: 20,
            paddingTop: 0,
          }}
        >
          <button
            ref={closeButtonRef}
            onClick={onClose}
            style={{
              width: '100%',
              height: 52,
              backgroundColor: MODAL_COLORS.closeButton,
              border: 'none',
              borderRadius: 12,
              color: MODAL_COLORS.closeButtonText,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
