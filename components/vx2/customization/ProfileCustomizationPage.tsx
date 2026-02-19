/**
 * Profile Customization Page
 *
 * Enterprise-grade customization interface with location-based features.
 * Allows users to personalize their draft room cell appearance.
 */

import Image from 'next/image';
import React, { useState } from 'react';

import AppHeaderVX2 from '@/components/vx2/shell/AppHeaderVX2';
import { cn } from '@/lib/styles';

import { FlagGrid } from './FlagGrid';
import { useCustomization } from './hooks/useCustomization';
import { LivePreview } from './LivePreview';
import { OverlayControls } from './OverlayControls';
import { PatternPicker } from './PatternPicker';
import styles from './ProfileCustomizationPage.module.css';


// Icons
function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function PaletteIcon({ className }: { className?: string }) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

export function ProfileCustomizationPage() {
  const {
    draft,
    updateDraft,
    isDirty,
    save,
    reset,
    isSaving,
    isLoading,
    availableFlags,
    flagsLoading,
  } = useCustomization();

  const [activeSection, setActiveSection] = useState<'background' | 'overlay'>('background');

  // Always show content since draft is initialized with defaults
  // This prevents persistent loading state when data is already present
  // The draft object always has valid default values, so we can render immediately

  return (
    <div className={styles.root}>
      <AppHeaderVX2 title="Customization" />

      <div className={styles.container}>
        <div className={styles.previewSection}>
          <LivePreview preferences={draft} />
        </div>

        <div className={styles.sectionsContainer}>
          <div className={styles.tabsHeader}>
            <button
              onClick={() => setActiveSection('background')}
              className={cn(styles.tabButton, activeSection === 'background' && styles.active)}
            >
              <PaletteIcon className="w-4 h-4" />
              <span className="inline">Background</span>
            </button>
            <button
              onClick={() => setActiveSection('overlay')}
              className={cn(styles.tabButton, activeSection === 'overlay' && styles.active)}
            >
              <LayersIcon className="w-4 h-4" />
              <span className="inline">Overlay</span>
            </button>
          </div>

          {activeSection === 'background' && (
            <div className={styles.contentSection}>
              {/* Background type selector */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Background Type
                </label>
                <div className={styles.backgroundTypeContainer}>
                  {(['none', 'flag', 'solid'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => updateDraft({ backgroundType: type })}
                      className={cn(
                        styles.backgroundTypeButton,
                        draft.backgroundType === type && styles.active
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flag selector */}
              {draft.backgroundType === 'flag' && (
                <div>
                  <FlagGrid
                    flags={availableFlags}
                    selectedCode={draft.backgroundFlagCode}
                    onSelect={(code) => updateDraft({ backgroundFlagCode: code })}
                    isLoading={flagsLoading}
                  />
                </div>
              )}

              {/* Solid color picker */}
              {draft.backgroundType === 'solid' && (
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Background Color
                  </label>
                  <div className={styles.colorPickerContainer}>
                    <input
                      type="color"
                      value={draft.backgroundSolidColor || '#ffffff'}
                      onChange={(e) => updateDraft({ backgroundSolidColor: e.target.value })}
                      className={styles.colorInput}
                    />
                    <span className={styles.colorValue}>
                      {draft.backgroundSolidColor || '#ffffff'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === 'overlay' && (
            <div className={styles.contentSection}>
              <label className={styles.overlayCheckbox}>
                <input
                  type="checkbox"
                  checked={draft.overlayEnabled}
                  onChange={(e) => updateDraft({ overlayEnabled: e.target.checked })}
                  className={styles.checkboxInput}
                />
                <span className={styles.checkboxLabel}>
                  Enable overlay
                </span>
              </label>

              {draft.overlayEnabled && (
                <>
                  {/* Image selector */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>
                      Image
                    </label>
                    <div className={styles.imageSelector}>
                      <button
                        className={cn(
                          styles.imageButton,
                          draft.overlayImageId === 'hotdog' && styles.active
                        )}
                        onClick={() => updateDraft({ overlayImageId: 'hotdog' })}
                      >
                        <Image
                          src="/customization/images/hotdog.svg"
                          alt="Hot Dog"
                          className={styles.imageIcon}
                          width={40}
                          height={40}
                          unoptimized
                        />
                      </button>
                      {/* Add more images here in the future */}
                    </div>
                  </div>

                  {/* Pattern picker */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>
                      Pattern
                    </label>
                    <PatternPicker
                      selected={draft.overlayPattern}
                      onSelect={(pattern) => updateDraft({ overlayPattern: pattern })}
                    />
                  </div>

                  {/* Size and position controls */}
                  <OverlayControls
                    size={draft.overlaySize}
                    onSizeChange={(size) => updateDraft({ overlaySize: size })}
                    pattern={draft.overlayPattern}
                    positionX={draft.overlayPositionX}
                    positionY={draft.overlayPositionY}
                    onPositionChange={(x, y) =>
                      updateDraft({ overlayPositionX: x, overlayPositionY: y })
                    }
                  />
                </>
              )}
            </div>
          )}

          {/* Save/Reset buttons */}
          <div className={styles.actionsContainer}>
            <button
              onClick={save}
              disabled={!isDirty || isSaving}
              className={cn(styles.actionButton, styles.saveButton)}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={reset}
              disabled={!isDirty}
              className={cn(styles.actionButton, styles.resetButton)}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export default ProfileCustomizationPage;
