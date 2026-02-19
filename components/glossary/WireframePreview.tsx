/**
 * WireframePreview Component
 *
 * Displays a device wireframe showing where an element is positioned.
 * Supports multiple platforms: Web, iOS (iPhone), iPad, Android.
 * Each platform gets its own device frame with element highlighting.
 */

import { Monitor, Smartphone, Tablet } from 'lucide-react';
import React from 'react';

import styles from './WireframePreview.module.css';

export type DevicePlatform = 'web' | 'ios' | 'ipad' | 'android';

interface DeviceConfig {
  name: string;
  width: number;
  height: number;
  screenWidth: number;
  screenHeight: number;
  safeAreaTop: number;
  safeAreaBottom: number;
  borderRadius: number;
  icon: React.ReactNode;
  notchType?: 'dynamic-island' | 'notch' | 'none';
}

const DEVICE_CONFIGS: Record<DevicePlatform, DeviceConfig> = {
  web: {
    name: 'Web Browser',
    width: 320,
    height: 568,
    screenWidth: 320,
    screenHeight: 568,
    safeAreaTop: 0,
    safeAreaBottom: 0,
    borderRadius: 0,
    icon: <Monitor size={14} />,
    notchType: 'none',
  },
  ios: {
    name: 'iPhone 15 Pro',
    width: 280,
    height: 580,
    screenWidth: 260,
    screenHeight: 560,
    safeAreaTop: 59,
    safeAreaBottom: 34,
    borderRadius: 44,
    icon: <Smartphone size={14} />,
    notchType: 'dynamic-island',
  },
  ipad: {
    name: 'iPad Pro 11"',
    width: 400,
    height: 540,
    screenWidth: 380,
    screenHeight: 520,
    safeAreaTop: 24,
    safeAreaBottom: 20,
    borderRadius: 18,
    icon: <Tablet size={14} />,
    notchType: 'none',
  },
  android: {
    name: 'Pixel 8',
    width: 280,
    height: 580,
    screenWidth: 260,
    screenHeight: 560,
    safeAreaTop: 24,
    safeAreaBottom: 48,
    borderRadius: 36,
    icon: <Smartphone size={14} />,
    notchType: 'none',
  },
};

// Simplified screen regions for draft room layout
interface ScreenRegion {
  id: string;
  name: string;
  y: number;
  height: number;
  color: string;
}

const DRAFT_ROOM_REGIONS: ScreenRegion[] = [
  { id: 'status-bar', name: 'Status Bar', y: 0, height: 56, color: '#252525' },
  { id: 'picks-bar', name: 'Picks Bar', y: 56, height: 64, color: '#222222' },
  { id: 'main-content', name: 'Main Content', y: 120, height: 340, color: '#1a1a1a' },
  { id: 'footer', name: 'Footer', y: 460, height: 56, color: '#232323' },
];

interface WireframePreviewProps {
  platform: DevicePlatform;
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
  parentRegion?: string; // e.g., 'StatusBar', 'Footer', 'PicksBar'
}

export function WireframePreview({
  platform,
  elementId,
  elementName,
  wireframeContext,
  parentRegion,
}: WireframePreviewProps) {
  const config = DEVICE_CONFIGS[platform];
  const highlightColor = wireframeContext?.highlightColor || '#6366F1';

  // Calculate element position within the device frame
  const elementBox = wireframeContext?.boundingBox || {
    x: 10,
    y: 10,
    width: 44,
    height: 44,
  };

  // Scale factor to fit design (390px width) into device screen
  const scaleFactor = config.screenWidth / 390;

  const scaledBox = {
    x: elementBox.x * scaleFactor,
    y: (elementBox.y + config.safeAreaTop) * scaleFactor,
    width: elementBox.width * scaleFactor,
    height: elementBox.height * scaleFactor,
  };

  return (
    <div className={styles.wireframeContainer}>
      <div className={styles.platformHeader}>
        {config.icon}
        <span>{config.name}</span>
      </div>

      <div
        className={styles.deviceFrame}
        style={{
          width: config.width,
          height: config.height,
          borderRadius: config.borderRadius,
        }}
      >
        {/* Device bezel */}
        <div className={styles.bezel}>
          {/* Dynamic Island / Notch */}
          {config.notchType === 'dynamic-island' && (
            <div className={styles.dynamicIsland} />
          )}
          {config.notchType === 'notch' && (
            <div className={styles.notch} />
          )}

          {/* Screen */}
          <div
            className={styles.screen}
            style={{
              width: config.screenWidth,
              height: config.screenHeight,
              borderRadius: config.borderRadius - 8,
            }}
          >
            {/* Screen regions */}
            {DRAFT_ROOM_REGIONS.map((region) => (
              <div
                key={region.id}
                className={styles.screenRegion}
                style={{
                  top: (region.y + config.safeAreaTop) * scaleFactor,
                  height: region.height * scaleFactor,
                  backgroundColor: region.color,
                }}
              >
                <span className={styles.regionLabel}>{region.name}</span>
              </div>
            ))}

            {/* Element highlight */}
            <div
              className={styles.elementHighlight}
              style={{
                left: scaledBox.x,
                top: scaledBox.y,
                width: scaledBox.width,
                height: scaledBox.height,
                borderColor: highlightColor,
                boxShadow: `0 0 0 3px ${highlightColor}40`,
              }}
            />

            {/* Element label */}
            <div
              className={styles.elementLabel}
              style={{
                left: scaledBox.x + scaledBox.width + 8,
                top: scaledBox.y,
                color: highlightColor,
              }}
            >
              <span className={styles.elementLabelId}>{elementId}</span>
              <span className={styles.elementLabelName}>{elementName}</span>
            </div>

            {/* Safe area indicators */}
            {config.safeAreaTop > 0 && (
              <div
                className={styles.safeAreaIndicator}
                style={{
                  top: 0,
                  height: config.safeAreaTop * scaleFactor,
                }}
              >
                <span>Safe Area</span>
              </div>
            )}
            {config.safeAreaBottom > 0 && (
              <div
                className={styles.safeAreaIndicator}
                style={{
                  bottom: 0,
                  height: config.safeAreaBottom * scaleFactor,
                }}
              >
                <span>Home Indicator</span>
              </div>
            )}
          </div>
        </div>

        {/* Home indicator bar (iOS/iPad) */}
        {(platform === 'ios' || platform === 'ipad') && (
          <div className={styles.homeBar} />
        )}

        {/* Android nav buttons */}
        {platform === 'android' && (
          <div className={styles.androidNav}>
            <div className={styles.navButton} />
            <div className={styles.navButton} />
            <div className={styles.navButton} />
          </div>
        )}
      </div>

      <div className={styles.deviceSpecs}>
        <span>Screen: {config.screenWidth}×{config.screenHeight}</span>
        {config.safeAreaTop > 0 && <span>Safe Top: {config.safeAreaTop}pt</span>}
        {config.safeAreaBottom > 0 && <span>Safe Bottom: {config.safeAreaBottom}pt</span>}
      </div>
    </div>
  );
}

/**
 * Multi-platform wireframe display component
 * Shows wireframes for all available platforms horizontally with click-to-select
 */
interface MultiPlatformWireframeProps {
  elementId: string;
  elementName: string;
  wireframeContext?: WireframePreviewProps['wireframeContext'];
  parentRegion?: string;
  platforms?: DevicePlatform[];
}

export function MultiPlatformWireframe({
  elementId,
  elementName,
  wireframeContext,
  parentRegion,
  platforms = ['web', 'ios'],
}: MultiPlatformWireframeProps) {
  const [selectedPlatform, setSelectedPlatform] = React.useState<DevicePlatform>(platforms[0]!);
  const selectedConfig = DEVICE_CONFIGS[selectedPlatform];

  return (
    <div className={styles.multiPlatformContainer}>
      <h3 className={styles.sectionTitle}>
        <Smartphone size={18} />
        Element Position by Platform
      </h3>
      <p className={styles.sectionDescription}>
        Click a device to view platform-specific details.
      </p>

      {/* Horizontal device carousel */}
      <div className={styles.wireframeCarousel}>
        {platforms.map((platform) => (
          <button
            key={platform}
            className={`${styles.wireframeCard} ${selectedPlatform === platform ? styles.selected : ''}`}
            onClick={() => setSelectedPlatform(platform)}
            aria-pressed={selectedPlatform === platform}
          >
            <WireframePreview
              platform={platform}
              elementId={elementId}
              elementName={elementName}
              wireframeContext={wireframeContext}
              parentRegion={parentRegion}
            />
          </button>
        ))}
      </div>

      {/* Selected platform details panel */}
      <div className={styles.platformDetails}>
        <div className={styles.platformDetailsHeader}>
          {selectedConfig.icon}
          <span>{selectedConfig.name}</span>
        </div>

        <div className={styles.platformSpecsGrid}>
          <div className={styles.platformSpecItem}>
            <span className={styles.specLabel}>Screen Size</span>
            <span className={styles.specValue}>{selectedConfig.screenWidth} × {selectedConfig.screenHeight}</span>
          </div>
          <div className={styles.platformSpecItem}>
            <span className={styles.specLabel}>Safe Area Top</span>
            <span className={styles.specValue}>{selectedConfig.safeAreaTop}pt</span>
          </div>
          <div className={styles.platformSpecItem}>
            <span className={styles.specLabel}>Safe Area Bottom</span>
            <span className={styles.specValue}>{selectedConfig.safeAreaBottom}pt</span>
          </div>
          <div className={styles.platformSpecItem}>
            <span className={styles.specLabel}>Border Radius</span>
            <span className={styles.specValue}>{selectedConfig.borderRadius}px</span>
          </div>
          {selectedConfig.notchType !== 'none' && (
            <div className={styles.platformSpecItem}>
              <span className={styles.specLabel}>Notch Type</span>
              <span className={styles.specValue}>{selectedConfig.notchType === 'dynamic-island' ? 'Dynamic Island' : 'Notch'}</span>
            </div>
          )}
        </div>

        {wireframeContext?.boundingBox && (
          <div className={styles.elementPositionInfo}>
            <span className={styles.specLabel}>Element Position</span>
            <div className={styles.positionGrid}>
              <span>X: {wireframeContext.boundingBox.x}px</span>
              <span>Y: {wireframeContext.boundingBox.y}px</span>
              <span>W: {wireframeContext.boundingBox.width}px</span>
              <span>H: {wireframeContext.boundingBox.height}px</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WireframePreview;
