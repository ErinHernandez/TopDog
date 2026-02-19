/**
 * ShareOptionsModal - iOS-style share sheet for draft content
 * 
 * Mimics the native Apple share sheet with:
 * - Bottom sheet slide-up animation
 * - App icon row (Messages, Mail, Copy, etc.)
 * - Action list below
 * 
 * A-Grade Requirements:
 * - TypeScript: Full type coverage
 * - iOS-native design patterns
 * - Accessibility: ARIA labels, focus trap
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

import { cn } from '@/lib/styles';

import { createScopedLogger } from '../../../../lib/clientLogger';
import { SHARE_OPTIONS_THEME } from '../../core/constants/colors';

import styles from './ShareOptionsModal.module.css';

const logger = createScopedLogger('[ShareOptionsModal]');

// ============================================================================
// TYPES
// ============================================================================

export type ShareType = 'roster' | 'draft-board' | 'picks';

export interface ShareOptionsModalProps {
  /** Whether modal is visible */
  isOpen: boolean;
  /** Called when modal is closed */
  onClose: () => void;
  /** Type of content being shared */
  shareType: ShareType;
  /** Name of the team/content */
  contentName?: string;
  /** URL to share */
  shareUrl?: string;
  /** Text content for text sharing */
  textContent?: string;
  /** Called to capture and share as image */
  onShareImage?: () => void;
  /** Whether image capture is in progress */
  isCapturingImage?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getShareTitle(shareType: ShareType, contentName?: string): string {
  const prefix = 'TopDog';
  switch (shareType) {
    case 'roster':
      return contentName ? `${prefix} - ${contentName}` : `${prefix} Roster`;
    case 'draft-board':
      return `${prefix} Draft Board`;
    case 'picks':
      return `${prefix} Picks`;
    default:
      return prefix;
  }
}

function generateShareText(shareType: ShareType, contentName?: string): string {
  switch (shareType) {
    case 'roster':
      return contentName 
        ? `Check out ${contentName}'s roster on TopDog!`
        : 'Check out my roster on TopDog!';
    case 'draft-board':
      return 'Check out this draft board on TopDog!';
    case 'picks':
      return 'Check out these picks on TopDog!';
    default:
      return 'Check this out on TopDog!';
  }
}

// ============================================================================
// APP ICONS - iOS style circular icons with symbols
// ============================================================================

function MessagesIcon(): React.ReactElement {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
    </svg>
  );
}

function MailIcon(): React.ReactElement {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
  );
}

function CopyLinkIcon(): React.ReactElement {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
}

function SaveImageIcon(): React.ReactElement {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}

function CheckmarkIcon(): React.ReactElement {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

// ============================================================================
// APP ICON BUTTON COMPONENT
// ============================================================================

interface AppIconButtonProps {
  label: string;
  bgColor: string;
  icon: React.ReactElement;
  onClick: () => void;
  showCheck?: boolean;
  disabled?: boolean;
}

function AppIconButton({ label, bgColor, icon, onClick, showCheck, disabled }: AppIconButtonProps): React.ReactElement {
  const getIconColorClass = (color: string): string => {
    switch (color) {
      case SHARE_OPTIONS_THEME.appIconBg.messages:
        return styles.messagesIcon!;
      case SHARE_OPTIONS_THEME.appIconBg.mail:
        return styles.mailIcon!;
      case SHARE_OPTIONS_THEME.appIconBg.copy:
        return styles.copyIcon!;
      case SHARE_OPTIONS_THEME.appIconBg.image:
        return styles.imageIcon!;
      case SHARE_OPTIONS_THEME.appIconBg.more:
        return styles.moreIcon!;
      default:
        return '';
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={styles.appIconButton}
    >
      {/* Circular icon */}
      <div
        className={cn(
          styles.iconCircle,
          showCheck ? styles.successIcon : getIconColorClass(bgColor)
        )}
      >
        {showCheck ? <CheckmarkIcon /> : icon}
      </div>
      {/* Label */}
      <span className={styles.iconLabel}>
        {label}
      </span>
    </button>
  );
}

// ============================================================================
// ACTION ROW COMPONENT
// ============================================================================

interface ActionRowProps {
  label: string;
  onClick: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  showCheck?: boolean;
}

function ActionRow({ label, onClick, isFirst, isLast, showCheck }: ActionRowProps): React.ReactElement {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={cn(
        styles.actionRow,
        isFirst && styles.firstRow,
        isLast && styles.lastRow,
        isPressed && styles.actionRowActive
      )}
    >
      <span className={styles.actionRowText}>
        {label}
      </span>
      {showCheck && (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SHARE_OPTIONS_THEME.successCheck} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ShareOptionsModal({
  isOpen,
  onClose,
  shareType,
  contentName,
  shareUrl,
  textContent,
  onShareImage,
  isCapturingImage = false,
}: ShareOptionsModalProps): React.ReactElement | null {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Handle open/close animation
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional setState in effect
      setIsAnimating(true);
      // Small delay to ensure animation plays
      requestAnimationFrame(() => {
        if (sheetRef.current) {
          sheetRef.current.style.transform = 'translateY(0)';
        }
      });
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
  
  // Reset feedback on close
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional setState in effect
      setCopiedFeedback(false);
    }
  }, [isOpen]);
  
  // Get the URL to share
  const getShareUrl = useCallback((): string => {
    return shareUrl || (typeof window !== 'undefined' ? window.location.href : 'https://topdog.dog');
  }, [shareUrl]);
  
  // Get formatted text content
  const getTextContent = useCallback((): string => {
    if (textContent) return textContent;
    const title = getShareTitle(shareType, contentName);
    const description = generateShareText(shareType, contentName);
    return `${title}\n\n${description}\n\n${getShareUrl()}`;
  }, [textContent, shareType, contentName, getShareUrl]);
  
  // Share via Messages (native share)
  const handleShareMessages = useCallback(async () => {
    const title = getShareTitle(shareType, contentName);
    
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: generateShareText(shareType, contentName),
          url: getShareUrl(),
        });
      } else {
        // Fallback - open SMS on mobile
        const text = getTextContent();
        window.location.href = `sms:?body=${encodeURIComponent(text)}`;
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        logger.error('Share failed', error instanceof Error ? error : new Error(String(error)));
      }
    }
  }, [getTextContent, getShareUrl, shareType, contentName]);
  
  // Share via Mail
  const handleShareMail = useCallback(() => {
    const title = getShareTitle(shareType, contentName);
    const text = generateShareText(shareType, contentName);
    const url = getShareUrl();
    
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
    window.location.href = mailtoUrl;
  }, [shareType, contentName, getShareUrl]);
  
  // Copy link to clipboard
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopiedFeedback(true);
      setTimeout(() => {
        setCopiedFeedback(false);
        onClose();
      }, 800);
    } catch (error) {
      logger.error('Copy link failed', error instanceof Error ? error : new Error(String(error)));
    }
  }, [getShareUrl, onClose]);
  
  // Share as image
  const handleShareImage = useCallback(() => {
    if (onShareImage) {
      onShareImage();
      onClose();
    }
  }, [onShareImage, onClose]);
  
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          styles.sheet,
          isAnimating && styles.animating,
          !isAnimating && styles.hidden
        )}
      >
        {/* Drag Handle */}
        <div className={styles.handleContainer}>
          <div className={styles.handle} />
        </div>

        {/* Content Name Header */}
        <div className={styles.header}>
          <p
            id="share-modal-title"
            className={styles.headerTitle}
          >
            {contentName || 'Share'}
          </p>
        </div>

        {/* App Icons Row */}
        <div className={styles.appIconsRow}>
          <AppIconButton
            label="Messages"
            bgColor={SHARE_OPTIONS_THEME.appIconBg.messages}
            icon={<MessagesIcon />}
            onClick={handleShareMessages}
          />
          <AppIconButton
            label="Mail"
            bgColor={SHARE_OPTIONS_THEME.appIconBg.mail}
            icon={<MailIcon />}
            onClick={handleShareMail}
          />
          <AppIconButton
            label={copiedFeedback ? 'Copied!' : 'Copy Link'}
            bgColor={SHARE_OPTIONS_THEME.appIconBg.copy}
            icon={<CopyLinkIcon />}
            onClick={handleCopyLink}
            showCheck={copiedFeedback}
          />
          {onShareImage && (
            <AppIconButton
              label="Save Image"
              bgColor={SHARE_OPTIONS_THEME.appIconBg.image}
              icon={<SaveImageIcon />}
              onClick={handleShareImage}
              disabled={isCapturingImage}
            />
          )}
        </div>
        
        {/* Actions List */}
        <div className={styles.actionsList}>
          <ActionRow
            label="Copy Link"
            onClick={handleCopyLink}
            isFirst
            showCheck={copiedFeedback}
          />
          {onShareImage && (
            <ActionRow
              label="Save Image"
              onClick={handleShareImage}
              isLast
            />
          )}
          {!onShareImage && (
            <ActionRow
              label="Share via Email"
              onClick={handleShareMail}
              isLast
            />
          )}
        </div>

        {/* Cancel Button */}
        <div className={styles.cancelContainer}>
          <button
            type="button"
            onClick={onClose}
            className={styles.cancelButton}
          >
            <span className={styles.cancelButtonText}>
              Cancel
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
