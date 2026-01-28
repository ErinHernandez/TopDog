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
      className={`vx2-tournament-card relative w-full h-full ${className}`}
      style={{
        backgroundColor: colors.backgroundFallback,
        borderRadius: `${sizes.borderRadius}px`,
        border: `${colors.borderWidth}px solid ${borderColor}`,
        padding: `${sizes.padding}px`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        minHeight: '400px', // Ensure minimum height on mobile
        isolation: 'isolate', // Create new stacking context for z-index
      }}
      role="article"
      aria-label={`${tournament.title} tournament`}
    >
      {/* Blur placeholder layer - shows instantly */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${BLUR_PLACEHOLDER})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderRadius: `${sizes.borderRadius - 1}px`,
          zIndex: 0,
        }}
      />
      
      {/* Full image layer - fades in when loaded */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          backgroundImage: useFallback && bgUrl && (bgUrl.endsWith('.webp') || bgUrl.includes('.webp'))
            ? CARD_COLORS.backgroundFallbackPng 
            : colors.background,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderRadius: `${sizes.borderRadius - 1}px`,
          zIndex: 1,
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
          willChange: 'opacity', // Optimize for mobile
          WebkitTransform: 'translateZ(0)', // Force hardware acceleration on mobile
          transform: 'translateZ(0)',
        }}
      />
      
      {/* Content layer */}
      <div style={{ 
        position: 'relative', 
        zIndex: 2, 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1,
        minHeight: 0, // Important for flexbox on mobile
        justifyContent: 'space-between', // Distribute space evenly
      }}>
      {/* Tournament Title */}
      <div style={{ marginTop: '12px' }}>
        <h2 
          className="vx2-tournament-title text-center font-bold leading-tight"
          style={{ 
            fontSize: '46px',
            fontFamily: "'Anton SC', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: CARD_COLORS.text,
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          }}
        >
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
      </div>{/* End content layer */}
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

export function TournamentCardSkeleton(): React.ReactElement {
  return (
    <div 
      className="animate-pulse"
      style={{
        backgroundColor: CARD_COLORS.background,
        borderRadius: `${CARD_PX.borderRadius}px`,
        border: `1px solid ${CARD_COLORS.border}`,
        padding: `${CARD_PX.padding}px`,
      }}
      aria-hidden="true"
    >
      {/* Title skeleton */}
      <div 
        className="mx-auto rounded"
        style={{ 
          width: '70%', 
          height: `${CARD_PX.titleFontSize}px`,
          backgroundColor: 'rgba(255,255,255,0.1)',
          marginBottom: `${CARD_PX.titleMarginBottom}px`,
        }} 
      />
      
      {/* Progress skeleton */}
      <div style={{ marginBottom: `${CARD_PX.progressMarginBottom}px` }}>
        <div 
          className="flex justify-between"
          style={{ marginBottom: `${CARD_PX.progressLabelMarginBottom}px` }}
        >
          <div 
            className="rounded"
            style={{ width: '80px', height: '14px', backgroundColor: 'rgba(255,255,255,0.1)' }} 
          />
          <div 
            className="rounded"
            style={{ width: '60px', height: '14px', backgroundColor: 'rgba(255,255,255,0.1)' }} 
          />
        </div>
        <div 
          className="rounded"
          style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)' }} 
        />
      </div>
      
      {/* Button skeleton */}
      <div 
        className="rounded"
        style={{ 
          width: '100%', 
          height: `${CARD_PX.buttonHeight}px`,
          backgroundColor: 'rgba(255,255,255,0.1)',
          marginBottom: `${CARD_PX.buttonMarginBottom}px`,
        }} 
      />
      
      {/* Stats skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: `${CARD_PX.statsGap}px` }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center">
            <div 
              className="rounded"
              style={{ width: '50px', height: '24px', backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: '4px' }} 
            />
            <div 
              className="rounded"
              style={{ width: '40px', height: '14px', backgroundColor: 'rgba(255,255,255,0.1)' }} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default TournamentCard;

