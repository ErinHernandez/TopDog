/**
 * Profile Customization Page
 * 
 * Enterprise-grade customization interface with location-based features.
 * Allows users to personalize their draft room cell appearance.
 */

import React, { useState } from 'react';
import { useCustomization } from './hooks/useCustomization';
import { FlagGrid } from './FlagGrid';
import { PatternPicker } from './PatternPicker';
import { OverlayControls } from './OverlayControls';
import { LivePreview } from './LivePreview';
import AppHeaderVX2 from '@/components/vx2/shell/AppHeaderVX2';
import { BG_COLORS, TEXT_COLORS, BORDER_COLORS, STATE_COLORS } from '@/components/vx2/core/constants/colors';
import { SPACING, RADIUS } from '@/components/vx2/core/constants/sizes';

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

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: BG_COLORS.primary }}>
        <AppHeaderVX2 title="Customization" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG_COLORS.primary }}>
      <AppHeaderVX2 title="Customization" />

      <div className="flex flex-col lg:flex-row" style={{ padding: '16px', paddingTop: '16px' }}>
        {/* Preview - Show at top on mobile, sidebar on desktop */}
        <div className="w-full mb-6 lg:w-64 lg:ml-8 lg:mt-0 lg:mb-0 order-first lg:order-last">
          <div className="lg:sticky lg:top-4">
            <LivePreview preferences={draft} />
          </div>
        </div>

        {/* Main controls */}
        <div className="flex-1 space-y-4 lg:space-y-6">
          {/* Section tabs */}
          <div 
            className="flex border-b"
            style={{ borderColor: BORDER_COLORS.light }}
          >
            <button
              onClick={() => setActiveSection('background')}
              className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex-1 lg:flex-initial min-h-[48px]`}
              style={{
                borderColor: activeSection === 'background' ? STATE_COLORS.info : 'transparent',
                color: activeSection === 'background' ? STATE_COLORS.info : TEXT_COLORS.secondary,
              }}
            >
              <PaletteIcon className="w-4 h-4" />
              <span className="lg:inline">Background</span>
            </button>
            <button
              onClick={() => setActiveSection('overlay')}
              className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex-1 lg:flex-initial min-h-[48px]`}
              style={{
                borderColor: activeSection === 'overlay' ? STATE_COLORS.info : 'transparent',
                color: activeSection === 'overlay' ? STATE_COLORS.info : TEXT_COLORS.secondary,
              }}
            >
              <LayersIcon className="w-4 h-4" />
              <span className="lg:inline">Overlay</span>
            </button>
          </div>

          {/* Background Section */}
          {activeSection === 'background' && (
            <div className="space-y-4 lg:space-y-6">
              {/* Background type selector */}
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: TEXT_COLORS.secondary }}
                >
                  Background Type
                </label>
                <div className="flex gap-2">
                  {(['none', 'flag', 'solid'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => updateDraft({ backgroundType: type })}
                      className={`flex-1 lg:flex-initial px-4 py-3 lg:py-2 rounded-lg text-sm capitalize transition-colors min-h-[48px]`}
                      style={{
                        backgroundColor: draft.backgroundType === type 
                          ? STATE_COLORS.info 
                          : BG_COLORS.tertiary,
                        color: draft.backgroundType === type 
                          ? '#FFFFFF' 
                          : TEXT_COLORS.secondary,
                      }}
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
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: TEXT_COLORS.secondary }}
                  >
                    Background Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={draft.backgroundSolidColor || '#ffffff'}
                      onChange={(e) => updateDraft({ backgroundSolidColor: e.target.value })}
                      className="w-16 h-10 rounded border cursor-pointer"
                      style={{ borderColor: BORDER_COLORS.default }}
                    />
                    <span 
                      className="text-sm font-mono"
                      style={{ color: TEXT_COLORS.muted }}
                    >
                      {draft.backgroundSolidColor || '#ffffff'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Overlay Section */}
          {activeSection === 'overlay' && (
            <div className="space-y-4 lg:space-y-6">
              {/* Enable toggle */}
              <label className="flex items-center gap-3 cursor-pointer min-h-[48px]">
                <input
                  type="checkbox"
                  checked={draft.overlayEnabled}
                  onChange={(e) => updateDraft({ overlayEnabled: e.target.checked })}
                  className="w-6 h-6 lg:w-5 lg:h-5 rounded"
                  style={{ accentColor: STATE_COLORS.info }}
                />
                <span 
                  className="text-sm font-medium"
                  style={{ color: TEXT_COLORS.primary }}
                >
                  Enable overlay
                </span>
              </label>

              {draft.overlayEnabled && (
                <>
                  {/* Image selector */}
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: TEXT_COLORS.secondary }}
                    >
                      Image
                    </label>
                    <div className="flex gap-2">
                      <button
                        className={`p-3 rounded-lg border-2 transition-colors`}
                        style={{
                          borderColor: draft.overlayImageId === 'hotdog' 
                            ? STATE_COLORS.info 
                            : BORDER_COLORS.light,
                          backgroundColor: draft.overlayImageId === 'hotdog'
                            ? 'rgba(59, 130, 246, 0.1)'
                            : BG_COLORS.tertiary,
                        }}
                      >
                        <img
                          src="/customization/images/hotdog.svg"
                          alt="Hot Dog"
                          className="w-10 h-10"
                        />
                      </button>
                      {/* Add more images here in the future */}
                    </div>
                  </div>

                  {/* Pattern picker */}
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: TEXT_COLORS.secondary }}
                    >
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
          <div 
            className="flex flex-col sm:flex-row gap-3 pt-4 border-t"
            style={{ borderColor: BORDER_COLORS.light }}
          >
            <button
              onClick={save}
              disabled={!isDirty || isSaving}
              className="flex-1 sm:flex-initial px-6 py-3 lg:py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
              style={{
                backgroundColor: STATE_COLORS.info,
                color: '#FFFFFF',
              }}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={reset}
              disabled={!isDirty}
              className="flex-1 sm:flex-initial px-6 py-3 lg:py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
              style={{
                backgroundColor: BG_COLORS.tertiary,
                color: TEXT_COLORS.secondary,
              }}
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
