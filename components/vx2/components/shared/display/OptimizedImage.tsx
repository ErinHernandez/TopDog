/**
 * OptimizedImage Component
 * 
 * Image component with automatic format fallbacks and lazy loading.
 * Provides WebP with PNG/JPG fallback for legacy devices.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <OptimizedImage
 *   src="/players/mahomes_patrick.webp"
 *   alt="Patrick Mahomes"
 *   width={100}
 *   height={100}
 * />
 * 
 * // With priority loading (above fold)
 * <OptimizedImage
 *   src="/players/mahomes_patrick.webp"
 *   alt="Patrick Mahomes"
 *   width={100}
 *   height={100}
 *   priority
 * />
 * ```
 * 
 * Created: December 30, 2024
 */

import React, { useState, useCallback, useMemo, CSSProperties } from 'react';
import { useDeviceCapabilities } from '../../../hooks/ui/useDeviceCapabilities';

// ============================================================================
// TYPES
// ============================================================================

export interface OptimizedImageProps {
  /** Image source (preferably WebP) */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Image width in pixels */
  width?: number | string;
  /** Image height in pixels */
  height?: number | string;
  /** Whether this image is above the fold (skips lazy loading) */
  priority?: boolean;
  /** Object-fit CSS property */
  objectFit?: CSSProperties['objectFit'];
  /** Object-position CSS property */
  objectPosition?: CSSProperties['objectPosition'];
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
  /** Callback when image loads */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: () => void;
  /** Border radius */
  borderRadius?: number | string;
  /** Whether to show loading placeholder */
  showPlaceholder?: boolean;
  /** Placeholder background color */
  placeholderColor?: string;
  /** ARIA label override */
  ariaLabel?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get fallback image source (WebP -> PNG -> JPG)
 */
function getFallbackSrc(src: string): string {
  if (src.endsWith('.webp')) {
    // Try PNG first, then JPG
    return src.replace('.webp', '.png');
  }
  return src;
}

/**
 * Get alternative formats for picture element
 */
function getImageFormats(src: string): { webp: string; fallback: string; type: string } {
  const isWebP = src.endsWith('.webp');
  const isPng = src.endsWith('.png');
  const isJpg = src.endsWith('.jpg') || src.endsWith('.jpeg');
  
  if (isWebP) {
    return {
      webp: src,
      fallback: src.replace('.webp', '.png'),
      type: 'image/png',
    };
  }
  
  if (isPng) {
    return {
      webp: src.replace('.png', '.webp'),
      fallback: src,
      type: 'image/png',
    };
  }
  
  if (isJpg) {
    const base = src.replace(/\.(jpg|jpeg)$/, '');
    return {
      webp: `${base}.webp`,
      fallback: src,
      type: 'image/jpeg',
    };
  }
  
  // Unknown format, return as-is
  return {
    webp: src,
    fallback: src,
    type: 'image/png',
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  objectFit = 'cover',
  objectPosition = 'center',
  className = '',
  style,
  onLoad,
  onError,
  borderRadius,
  showPlaceholder = true,
  placeholderColor = '#1E3A5F',
  ariaLabel,
}: OptimizedImageProps): React.ReactElement {
  const { supportsWebP, isLegacyDevice } = useDeviceCapabilities();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Get image formats
  const formats = useMemo(() => getImageFormats(src), [src]);
  
  // Determine which source to use
  const imgSrc = useMemo(() => {
    if (hasError) {
      return formats.fallback;
    }
    return supportsWebP ? formats.webp : formats.fallback;
  }, [supportsWebP, hasError, formats]);
  
  // Handle load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);
  
  // Handle error - try fallback
  const handleError = useCallback(() => {
    if (!hasError && imgSrc !== formats.fallback) {
      setHasError(true);
    } else {
      onError?.();
    }
  }, [hasError, imgSrc, formats.fallback, onError]);
  
  // Build styles
  const containerStyle: CSSProperties = useMemo(() => ({
    position: 'relative',
    width,
    height,
    borderRadius,
    overflow: 'hidden',
    backgroundColor: showPlaceholder && !isLoaded ? placeholderColor : 'transparent',
    ...style,
  }), [width, height, borderRadius, showPlaceholder, isLoaded, placeholderColor, style]);
  
  const imgStyle: CSSProperties = useMemo(() => ({
    width: '100%',
    height: '100%',
    objectFit,
    objectPosition,
    opacity: isLoaded ? 1 : 0,
    transition: isLegacyDevice ? 'none' : 'opacity 0.2s ease-in-out',
  }), [objectFit, objectPosition, isLoaded, isLegacyDevice]);
  
  // For modern browsers, use picture element with source sets
  // For legacy or when WebP check is uncertain, use simple img with fallback handling
  if (supportsWebP && !isLegacyDevice) {
    return (
      <div className={className} style={containerStyle}>
        <picture>
          <source srcSet={formats.webp} type="image/webp" />
          <source srcSet={formats.fallback} type={formats.type} />
          <img
            src={formats.fallback}
            alt={alt}
            width={typeof width === 'number' ? width : undefined}
            height={typeof height === 'number' ? height : undefined}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            style={imgStyle}
            onLoad={handleLoad}
            onError={handleError}
            aria-label={ariaLabel || alt}
          />
        </picture>
        {showPlaceholder && !isLoaded && (
          <LoadingPlaceholder isLegacyDevice={isLegacyDevice} />
        )}
      </div>
    );
  }
  
  // Simple img for legacy devices
  return (
    <div className={className} style={containerStyle}>
      <img
        src={imgSrc}
        alt={alt}
        width={typeof width === 'number' ? width : undefined}
        height={typeof height === 'number' ? height : undefined}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        style={imgStyle}
        onLoad={handleLoad}
        onError={handleError}
        aria-label={ariaLabel || alt}
      />
      {showPlaceholder && !isLoaded && (
        <LoadingPlaceholder isLegacyDevice={isLegacyDevice} />
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface LoadingPlaceholderProps {
  isLegacyDevice: boolean;
}

function LoadingPlaceholder({ isLegacyDevice }: LoadingPlaceholderProps): React.ReactElement {
  const style: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: isLegacyDevice 
      ? '#1E3A5F' // Solid color for legacy
      : 'linear-gradient(90deg, #1E3A5F 0%, #2A4A6F 50%, #1E3A5F 100%)',
    backgroundSize: '200% 100%',
    animation: isLegacyDevice ? 'none' : 'shimmer 1.5s infinite',
  };
  
  return <div style={style} aria-hidden="true" />;
}

// ============================================================================
// PLAYER IMAGE VARIANT
// ============================================================================

export interface PlayerImageProps extends Omit<OptimizedImageProps, 'src'> {
  /** Player ID (e.g., 'mahomes_patrick') */
  playerId: string;
  /** Image variant */
  variant?: 'standard' | 'thumbnail' | 'highRes';
}

/**
 * Convenience component for player images
 * Automatically constructs the correct path
 */
export function PlayerImage({
  playerId,
  variant = 'standard',
  ...props
}: PlayerImageProps): React.ReactElement {
  const src = useMemo(() => {
    const suffix = variant === 'thumbnail' ? '-thumbnail' : variant === 'highRes' ? '-highRes' : '';
    return `/players/${playerId}${suffix}.webp`;
  }, [playerId, variant]);
  
  return <OptimizedImage src={src} {...props} />;
}

// ============================================================================
// TEAM LOGO VARIANT
// ============================================================================

export interface TeamLogoProps extends Omit<OptimizedImageProps, 'src'> {
  /** Team abbreviation (e.g., 'KC', 'PHI') */
  team: string;
}

/**
 * Convenience component for NFL team logos
 */
export function TeamLogo({
  team,
  ...props
}: TeamLogoProps): React.ReactElement {
  const src = useMemo(() => {
    return `/logos/nfl/${team.toLowerCase()}.png`;
  }, [team]);
  
  return (
    <OptimizedImage 
      src={src} 
      objectFit="contain"
      showPlaceholder={false}
      {...props} 
    />
  );
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default OptimizedImage;


