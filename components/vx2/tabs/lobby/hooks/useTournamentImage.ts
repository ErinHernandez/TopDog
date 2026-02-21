/**
 * useTournamentImage Hook
 *
 * Handles image preloading for tournament background images.
 * Extracts image URL from CSS background values and preloads the image
 * to enable smooth fade-in transitions.
 *
 * @module useTournamentImage
 */

import { useState, useEffect } from 'react';

export interface UseTournamentImageOptions {
  /** CSS background value (e.g., "url(/image.webp)" or "/image.webp") */
  image: string;
  /** Optional blur placeholder base64 string */
  placeholder?: string;
  /** Whether to enable the hook (useful for conditional loading) */
  enabled?: boolean;
}

export interface UseTournamentImageResult {
  /** Whether the full resolution image has loaded */
  isLoaded: boolean;
  /** Whether an error occurred during loading */
  hasError: boolean;
}

/**
 * Hook to preload tournament background images
 *
 * @param options - Configuration options
 * @returns Loading state and error state
 *
 * @example
 * ```tsx
 * const { isLoaded } = useTournamentImage({
 *   image: 'url(/tournament-bg.webp)',
 *   placeholder: 'data:image/webp;base64,...',
 * });
 *
 * <TournamentBackground
 *   image={image}
 *   placeholder={placeholder}
 *   isLoaded={isLoaded}
 * />
 * ```
 */
export function useTournamentImage({
  image,
  placeholder,
  enabled = true,
}: UseTournamentImageOptions): UseTournamentImageResult {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!enabled || !image) {
      setIsLoaded(true);
      return;
    }

    // Extract image URL from CSS background value
    // Handles both "url(/path)" and "/path" formats
    const urlMatch = image.match(/url\(['"]?([^'"]+)['"]?\)/);
    const imageUrl = urlMatch?.[1] || image;

    // Skip preloading for data URLs (already embedded)
    if (imageUrl.startsWith('data:')) {
      setIsLoaded(true);
      return;
    }

    // Skip preloading for gradients
    if (imageUrl.startsWith('linear-gradient') || imageUrl.startsWith('radial-gradient')) {
      setIsLoaded(true);
      return;
    }

    const img = new Image();

    img.onload = () => {
      setIsLoaded(true);
      setHasError(false);
    };

    img.onerror = () => {
      // Try PNG fallback for WebP images
      if (imageUrl.endsWith('.webp') || imageUrl.includes('.webp')) {
        const pngUrl = imageUrl.replace('.webp', '.png').split('?')[0];
        const fallbackImg = new Image();

        fallbackImg.onload = () => {
          setIsLoaded(true);
          setHasError(false);
        };

        fallbackImg.onerror = () => {
          // Both failed, show anyway (will use fallback color)
          setIsLoaded(true);
          setHasError(true);
        };

        fallbackImg.src = pngUrl!;
      } else {
        // For non-WebP images, show anyway
        setIsLoaded(true);
        setHasError(true);
      }
    };

    img.src = imageUrl;

    // Handle already-cached images
    if (img.complete) {
      setIsLoaded(true);
      setHasError(false);
    }

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [image, enabled]);

  return { isLoaded, hasError };
}

export default useTournamentImage;
