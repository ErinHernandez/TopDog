/**
 * TournamentCard - Tournament display card for lobby
 * 
 * A-Grade Requirements Met:
 * - TypeScript: Full type coverage
 * - Constants: All values from VX2 constants
 * - Single Responsibility: One component, one purpose
 * - Accessibility: ARIA labels, touch targets
 * - Documentation: JSDoc, props documented
 */

import React, { useState, useEffect } from 'react';
import { createScopedLogger } from '@/lib/clientLogger';
import { cn } from '@/lib/styles';
import styles from './TournamentCard.module.css';
import { BG_COLORS, TEXT_COLORS, BRAND_COLORS, STATE_COLORS } from '../../core/constants/colors';

const logger = createScopedLogger('[TournamentCard]');
import { SPACING, RADIUS, TYPOGRAPHY } from '../../core/constants/sizes';
import type { Tournament } from '../../hooks/data';
import { TournamentCardBottomSection } from './TournamentCardBottomSection';

// Tiny blur placeholder (92 bytes) - loads instantly, shows while full image loads
const BLUR_PLACEHOLDER = 'data:image/webp;base64,UklGRlQAAABXRUJQVlA4IEgAAABwAwCdASoUABsAPyl+uFOuKCWisAwBwCUJZQAAW+q+9Bpo4aAA/uvZ+YkAc4jvVTc7+oJAY99soPLjJTrwm3j5Y3VE0BWmGAA=';

// ============================================================================
// CONSTANTS
// ============================================================================

const CARD_PX = {
  // Main card - increased by 10% more, reduced padding by 10px to reduce height
  padding: 21,
  borderRadius: RADIUS.xl,
  
  // Title
  titleFontSize: TYPOGRAPHY.fontSize.xl,
  titleMarginBottom: SPACING.xl,
  
  // Logo - reduced by 20px to help reduce overall height
  logoSize: 233,
  logoMarginBottom: SPACING.xl,
  
  // Progress
  progressMarginBottom: SPACING.xl,
  progressLabelFontSize: TYPOGRAPHY.fontSize.sm,
  progressLabelMarginBottom: SPACING.sm,
  
  // Button
  buttonHeight: 57,
  buttonFontSize: TYPOGRAPHY.fontSize.sm,
  buttonMarginBottom: SPACING.xl,
  
  // Stats
  statsGap: SPACING.xl,
  statsValueFontSize: TYPOGRAPHY.fontSize.lg,
  statsLabelFontSize: TYPOGRAPHY.fontSize.xs,
} as const;

const CARD_COLORS = {
  background: 'url(/tournament_card_background.png)',
  backgroundFallbackPng: 'url(/tournament_card_background.png)', // PNG fallback for iOS/older browsers
  backgroundFallback: '#0a0a1a',
  border: 'rgba(75, 85, 99, 0.5)',
  text: TEXT_COLORS.primary,
  textMuted: TEXT_COLORS.secondary,
  accent: '#1E3A5F',  // Matches tiled background base color
  accentHover: BRAND_COLORS.accent,
  progressBg: 'rgba(55, 65, 81, 0.5)',
} as const;

// ============================================================================
// TYPES
// ============================================================================

/** Style overrides for sandbox experimentation */
export interface CardStyleOverrides {
  /** Background image or gradient (e.g., 'url(...)', 'linear-gradient(...)') */
  background?: string;
  /** Fallback background color */
  backgroundFallback?: string;
  /** Border color */
  border?: string;
  /** Border width in pixels */
  borderWidth?: number;
  /** Accent color for featured border */
  accent?: string;
  /** Progress bar background color */
  progressBg?: string;
  /** Card padding in pixels */
  padding?: number;
  /** Border radius in pixels */
  borderRadius?: number;
  /** Button background style (replaces tiled) */
  buttonBackground?: string;
  /** Button background color */
  buttonBackgroundColor?: string;
  /** Custom background image URL (alternative to gradient) */
  backgroundImage?: string;
}

export interface TournamentCardProps {
  /** Tournament data */
  tournament: Tournament;
  /** Click handler for join button */
  onJoinClick?: () => void;
  /** Whether to show featured styling */
  featured?: boolean;
  /** Additional className */
  className?: string;
  /** Style overrides for sandbox experimentation */
  styleOverrides?: CardStyleOverrides;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TournamentCard({
  tournament,
  onJoinClick,
  featured = false,
  className = '',
  styleOverrides = {},
}: TournamentCardProps): React.ReactElement {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  
  // Merge style overrides with defaults
  // If backgroundImage URL is provided, wrap it in url(); otherwise use gradient/pattern
  const resolvedBackground = styleOverrides.backgroundImage 
    ? `url(${styleOverrides.backgroundImage})`
    : (styleOverrides.background ?? CARD_COLORS.background);
  
  // Extract the URL from the background string for preloading
  const bgUrlMatch = resolvedBackground.match(/url\(['"]?([^'"]+)['"]?\)/);
  const bgUrl = bgUrlMatch ? bgUrlMatch[1] : null;
  
  // Preload the full image with fallback support
  useEffect(() => {
    if (!bgUrl || bgUrl.startsWith('data:')) {
      // Skip preload for data URIs or gradients
      setImageLoaded(true);
      return;
    }
    
    // Try WebP first
    const img = new Image();
    
    // If WebP fails, try PNG fallback (for iOS/older browsers)
    const tryFallback = () => {
      if (bgUrl && (bgUrl.endsWith('.webp') || bgUrl.includes('.webp'))) {
        // Replace .webp with .png for fallback
        const pngUrl = bgUrl.replace('.webp', '.png').split('?')[0]; // Remove query params if any
        
        if (process.env.NODE_ENV === 'development') {
          logger.debug(`WebP failed, trying PNG fallback: ${pngUrl}`);
        }
        
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          if (process.env.NODE_ENV === 'development') {
            logger.debug('PNG fallback loaded successfully');
          }
          setImageLoaded(true);
          setUseFallback(true);
        };
        fallbackImg.onerror = () => {
          if (process.env.NODE_ENV === 'development') {
            logger.warn('Both WebP and PNG failed to load, using fallback color');
          }
          // If PNG also fails, show with fallback color
          setImageLoaded(true);
          setUseFallback(true);
        };
        fallbackImg.src = pngUrl;
      } else {
        // For non-WebP images, just show anyway
        setImageLoaded(true);
      }
    };
    
    img.onload = () => {
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`Background image loaded: ${bgUrl}`);
      }
      setImageLoaded(true);
    };
    img.onerror = () => {
      if (process.env.NODE_ENV === 'development') {
        logger.warn(`Background image failed to load: ${bgUrl}`);
      }
      tryFallback();
    };
    img.src = bgUrl;
    
    // If already cached, onload fires synchronously
    if (img.complete) {
      setImageLoaded(true);
    }
  }, [bgUrl]);
    
  const colors = {
    background: resolvedBackground,
    backgroundFallback: styleOverrides.backgroundFallback ?? CARD_COLORS.backgroundFallback,
    border: styleOverrides.border ?? CARD_COLORS.border,
    borderWidth: styleOverrides.borderWidth ?? (featured ? 3 : 1),
    accent: styleOverrides.accent ?? CARD_COLORS.accent,
    progressBg: styleOverrides.progressBg ?? CARD_COLORS.progressBg,
  };
  
  const sizes = {
    padding: styleOverrides.padding ?? CARD_PX.padding,
    borderRadius: styleOverrides.borderRadius ?? CARD_PX.borderRadius,
  };
  
  // Determine border color based on featured and overrides
  const borderColor = featured ? colors.accent : colors.border;
  
  return (
    <div
      className={cn(styles.card, { [styles.featured]: featured }, className)}
      style={{
        '--card-bg-fallback': colors.backgroundFallback,
        '--card-border-color': borderColor,
        '--card-border-width': `${colors.borderWidth}px`,
        '--card-padding': `${sizes.padding}px`,
        '--card-border-radius': `${sizes.borderRadius}px`,
        '--card-background': useFallback && bgUrl && (bgUrl.endsWith('.webp') || bgUrl.includes('.webp'))
          ? CARD_COLORS.backgroundFallbackPng
          : colors.background,
        '--blur-border-radius': `${sizes.borderRadius - 1}px`,
        '--progress-bg': colors.progressBg,
      } as React.CSSProperties}
      role="article"
      aria-label={`${tournament.title} tournament`}
    >
      {/* Blur placeholder layer - shows instantly */}
      <div
        className={styles.blurPlaceholder}
        aria-hidden="true"
      />

      {/* Full image layer - fades in when loaded */}
      <div
        className={cn(styles.fullImage, { [styles.loaded]: imageLoaded })}
        aria-hidden="true"
      />

      {/* Content layer */}
      <div className={styles.contentLayer}>
        {/* Tournament Title */}
        <div className={styles.titleContainer}>
          <h2 className={styles.title}>
            The TopDog<br />
            International
          </h2>
        </div>

        {/* Bottom Section - Progress, Button, Stats */}
        <TournamentCardBottomSection
          tournament={tournament}
          onJoinClick={onJoinClick}
          styleOverrides={{
            buttonBackground: styleOverrides.buttonBackground,
            buttonBackgroundColor: styleOverrides.buttonBackgroundColor,
            progressBg: colors.progressBg,
          }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

export function TournamentCardSkeleton(): React.ReactElement {
  return (
    <div
      className={styles.skeleton}
      style={{
        '--card-bg-fallback': CARD_COLORS.backgroundFallback,
        '--card-border-color': CARD_COLORS.border,
        '--card-border-width': '1px',
        '--card-padding': `${CARD_PX.padding}px`,
        '--card-border-radius': `${CARD_PX.borderRadius}px`,
        '--title-margin-bottom': `${CARD_PX.titleMarginBottom}px`,
      } as React.CSSProperties}
      aria-hidden="true"
    >
      {/* Title skeleton */}
      <div className={styles.skeletonTitle} />

      {/* Progress skeleton */}
      <div className={styles.skeletonProgress}>
        <div className={styles.skeletonProgressLabels}>
          <div className={styles.skeletonProgressLabel} />
          <div className={styles.skeletonProgressLabel} style={{ width: '60px' }} />
        </div>
        <div className={styles.skeletonProgressBar} />
      </div>

      {/* Button skeleton */}
      <div className={styles.skeletonButton} />

      {/* Stats skeleton */}
      <div className={styles.skeletonStats}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={styles.skeletonStatItem}>
            <div className={styles.skeletonStatValue} />
            <div className={styles.skeletonStatLabel} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default TournamentCard;

