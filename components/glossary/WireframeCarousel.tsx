/**
 * WireframeCarousel Component
 *
 * Horizontal carousel of device frames that act as platform selectors.
 * Integrates with existing WireframePreview components.
 * Clicking a device updates the entire page to show platform-specific content.
 */

import React, { useRef, useEffect } from 'react';

import { DeviceFrame, Platform } from './DeviceFrame';
import styles from './WireframeCarousel.module.css';
import { WireframePreview } from './WireframePreview';

interface WireframeCarouselProps {
  selectedPlatform: Platform;
  onPlatformSelect: (platform: Platform) => void;
  elementId: string;
  elementName: string;
  wireframeContext?: {
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    highlightColor?: string;
    annotationPosition?: 'top' | 'right' | 'bottom' | 'left';
  };
  parentRegion?: string;
  availablePlatforms?: Platform[];
}

const DEFAULT_PLATFORMS: Platform[] = ['ios', 'ipad', 'web', 'android'];

export function WireframeCarousel({
  selectedPlatform,
  onPlatformSelect,
  elementId,
  elementName,
  wireframeContext,
  parentRegion,
  availablePlatforms = DEFAULT_PLATFORMS,
}: WireframeCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!carouselRef.current?.contains(document.activeElement)) return;

      const currentIndex = availablePlatforms.indexOf(selectedPlatform);

      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        const platform = availablePlatforms[currentIndex - 1];
        if (platform) onPlatformSelect(platform);
      } else if (e.key === 'ArrowRight' && currentIndex < availablePlatforms.length - 1) {
        e.preventDefault();
        const platform = availablePlatforms[currentIndex + 1];
        if (platform) onPlatformSelect(platform);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedPlatform, availablePlatforms, onPlatformSelect]);

  return (
    <div className={styles.carouselContainer}>
      <div className={styles.carouselWrapper}>
        <div
          ref={carouselRef}
          className={styles.carousel}
          role="tablist"
          aria-label="Platform selection"
        >
          {availablePlatforms.map((platform) => {
            if (!platform) return null;
            return (
            <DeviceFrame
              key={platform}
              platform={platform}
              isSelected={selectedPlatform === platform}
              onClick={() => onPlatformSelect(platform)}
            >
              <WireframePreview
                platform={platform}
                elementId={elementId}
                elementName={elementName}
                wireframeContext={wireframeContext}
                parentRegion={parentRegion}
              />
            </DeviceFrame>
            );
          })}
        </div>
      </div>

      {/* Selection indicator line */}
      <div className={styles.selectionIndicator}>
        <div
          className={styles.indicatorLine}
          style={{
            transform: `translateX(${availablePlatforms.indexOf(selectedPlatform) * 100}%)`,
            width: `${100 / availablePlatforms.length}%`,
          }}
        />
      </div>
    </div>
  );
}

export default WireframeCarousel;
