/**
 * ScreenshotHero - Primary element screenshot display
 *
 * This component displays the hero screenshot for a glossary element,
 * serving as the visual centerpiece of the element detail page.
 *
 * Features:
 * - Primary hero screenshot prominently displayed
 * - Platform selector for multi-platform screenshots
 * - State selector for viewing different element states
 * - Zoom/lightbox capability
 * - Graceful fallback when screenshots unavailable
 */

import { Monitor, Smartphone, Tablet, ZoomIn, X } from 'lucide-react';
import Image from 'next/image';
import React, { useState, useMemo } from 'react';

import type { Screenshot, Platform, ElementState } from '@/lib/glossary/types';

import styles from './ScreenshotHero.module.css';

// ============================================================================
// TYPES
// ============================================================================

export interface ScreenshotHeroProps {
  /** Element ID for display */
  elementId: string;
  /** Element name for display */
  elementName: string;
  /** All screenshots for this element */
  screenshots: Screenshot[];
  /** Fallback content when no screenshots available */
  fallbackContent?: React.ReactNode;
}

// Platform config
const PLATFORM_CONFIG: Record<Platform, { icon: React.ReactNode; label: string }> = {
  web: { icon: <Monitor size={16} />, label: 'Web' },
  ios: { icon: <Smartphone size={16} />, label: 'iOS' },
  ipad: { icon: <Tablet size={16} />, label: 'iPad' },
  android: { icon: <Smartphone size={16} />, label: 'Android' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ScreenshotHero({
  elementId,
  elementName,
  screenshots,
  fallbackContent,
}: ScreenshotHeroProps): React.ReactElement {
  // Find hero screenshot or use first available
  const heroScreenshot = useMemo(() => {
    return screenshots.find((s) => s.isHero) || screenshots[0];
  }, [screenshots]);

  // Get available platforms
  const availablePlatforms = useMemo(() => {
    const platforms = new Set(screenshots.map((s) => s.platform));
    return Array.from(platforms) as Platform[];
  }, [screenshots]);

  // Get available states for current platform
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(
    heroScreenshot?.platform || 'web'
  );

  const availableStates = useMemo(() => {
    const states = screenshots
      .filter((s) => s.platform === selectedPlatform)
      .map((s) => s.state);
    return Array.from(new Set(states));
  }, [screenshots, selectedPlatform]);

  const [selectedState, setSelectedState] = useState<ElementState>(
    heroScreenshot?.state || 'default'
  );

  // Get current screenshot based on selections
  const currentScreenshot = useMemo(() => {
    return screenshots.find(
      (s) => s.platform === selectedPlatform && s.state === selectedState
    ) || heroScreenshot;
  }, [screenshots, selectedPlatform, selectedState, heroScreenshot]);

  // Lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // No screenshots available
  if (!screenshots.length || !currentScreenshot) {
    return (
      <div className={styles.container}>
        <div className={styles.noScreenshots}>
          <div className={styles.placeholder}>
            <h3>No Screenshots</h3>
            <p>{elementName} ({elementId})</p>
          </div>
        </div>
        {fallbackContent && (
          <div className={styles.fallbackContent}>
            {fallbackContent}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Platform & State Selectors */}
      <div className={styles.controls}>
        {/* Platform Selector */}
        {availablePlatforms.length > 1 && (
          <div className={styles.platformSelector}>
            {availablePlatforms.map((platform) => (
              <button
                key={platform}
                className={`${styles.platformButton} ${
                  selectedPlatform === platform ? styles.active : ''
                }`}
                onClick={() => setSelectedPlatform(platform)}
                aria-pressed={selectedPlatform === platform}
              >
                {PLATFORM_CONFIG[platform].icon}
                <span>{PLATFORM_CONFIG[platform].label}</span>
              </button>
            ))}
          </div>
        )}

        {/* State Selector */}
        {availableStates.length > 1 && (
          <div className={styles.stateSelector}>
            <label>State:</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value as ElementState)}
              className={styles.stateSelect}
            >
              {availableStates.map((state) => (
                <option key={state} value={state}>
                  {state.charAt(0).toUpperCase() + state.slice(1).replace(/-/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Hero Screenshot Display */}
      <div className={styles.heroContainer}>
        <div
          className={styles.screenshotWrapper}
          onClick={() => setIsLightboxOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setIsLightboxOpen(true)}
          aria-label={`View ${elementName} screenshot in full size`}
        >
          <Image
            src={currentScreenshot.path}
            alt={currentScreenshot.alt || `${elementName} - ${currentScreenshot.state} state on ${currentScreenshot.platform}`}
            width={currentScreenshot.width}
            height={currentScreenshot.height}
            className={styles.heroImage}
            priority
          />
          <div className={styles.zoomOverlay}>
            <ZoomIn size={24} />
            <span>Click to enlarge</span>
          </div>
        </div>

        {/* Caption */}
        {currentScreenshot.caption && (
          <p className={styles.caption}>{currentScreenshot.caption}</p>
        )}

        {/* Screenshot Meta */}
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            {PLATFORM_CONFIG[currentScreenshot.platform].icon}
            {PLATFORM_CONFIG[currentScreenshot.platform].label}
          </span>
          <span className={styles.metaItem}>
            {currentScreenshot.width} × {currentScreenshot.height}
          </span>
          {currentScreenshot.context && (
            <span className={styles.metaItem}>
              {currentScreenshot.context === 'isolated' ? 'Isolated' : 'In Context'}
            </span>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div
          className={styles.lightbox}
          onClick={() => setIsLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${elementName} screenshot enlarged view`}
        >
          <button
            className={styles.closeButton}
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close enlarged view"
          >
            <X size={24} />
          </button>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <Image
              src={currentScreenshot.path}
              alt={currentScreenshot.alt || `${elementName} enlarged view`}
              width={currentScreenshot.width * 2}
              height={currentScreenshot.height * 2}
              className={styles.lightboxImage}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ScreenshotHero;
