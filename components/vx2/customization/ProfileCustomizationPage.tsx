import { useState } from 'react';
import { useCustomization } from './hooks/useCustomization';
import { FlagGrid } from './FlagGrid';
import { PatternPicker } from './PatternPicker';
import { OverlayControls } from './OverlayControls';
import { LivePreview } from './LivePreview';
import AppHeaderVX2 from '@/components/vx2/shell/AppHeaderVX2';
import { BG_COLORS } from '@/components/vx2/core/constants/colors';
import { SPACING } from '@/components/vx2/core/constants/sizes';
// Simple icon components
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
    locationConsent,
    enableLocationTracking,
  } = useCustomization();

  const [activeSection, setActiveSection] = useState<'background' | 'overlay'>('background');

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: BG_COLORS.primary }}>
        <AppHeaderVX2 title="Customization" showBackButton />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG_COLORS.primary }}>
      <AppHeaderVX2 title="Customization" showBackButton />

      <div className="flex flex-col lg:flex-row" style={{ padding: SPACING.lg }}>
        {/* Main controls */}
        <div className="flex-1 space-y-6">
          {/* Location consent banner */}
          {!locationConsent && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MapPinIcon className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-amber-800">
                    Enable location detection to unlock flag backgrounds based on places you visit.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={enableLocationTracking}
                      className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded hover:bg-amber-700"
                    >
                      Enable
                    </button>
                    <button className="px-3 py-1.5 text-amber-700 text-sm hover:bg-amber-100 rounded">
                      Not now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveSection('background')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                activeSection === 'background'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <PaletteIcon className="w-4 h-4" />
              Background
            </button>
            <button
              onClick={() => setActiveSection('overlay')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                activeSection === 'overlay'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayersIcon className="w-4 h-4" />
              Overlay
            </button>
          </div>

          {/* Background Section */}
          {activeSection === 'background' && (
            <div className="space-y-4">
              {/* Background type selector */}
              <div className="flex gap-2">
                {(['none', 'flag', 'solid'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => updateDraft({ backgroundType: type })}
                    className={`px-4 py-2 rounded text-sm capitalize ${
                      draft.backgroundType === type
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Flag selector */}
              {draft.backgroundType === 'flag' && (
                <FlagGrid
                  flags={availableFlags}
                  selectedCode={draft.backgroundFlagCode}
                  onSelect={(code) => updateDraft({ backgroundFlagCode: code })}
                  isLoading={flagsLoading}
                />
              )}

              {/* Solid color picker */}
              {draft.backgroundType === 'solid' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Background Color
                  </label>
                  <input
                    type="color"
                    value={draft.backgroundSolidColor || '#ffffff'}
                    onChange={(e) => updateDraft({ backgroundSolidColor: e.target.value })}
                    className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                </div>
              )}

              {/* Border color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Border Color
                </label>
                <input
                  type="color"
                  value={draft.borderColor}
                  onChange={(e) => updateDraft({ borderColor: e.target.value })}
                  className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Overlay Section */}
          {activeSection === 'overlay' && (
            <div className="space-y-4">
              {/* Enable toggle */}
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={draft.overlayEnabled}
                  onChange={(e) => updateDraft({ overlayEnabled: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Enable overlay</span>
              </label>

              {draft.overlayEnabled && (
                <>
                  {/* Image selector (just hotdog for now) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image
                    </label>
                    <div className="flex gap-2">
                      <button
                        className={`p-3 rounded border-2 ${
                          draft.overlayImageId === 'hotdog'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        }`}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={save}
              disabled={!isDirty || isSaving}
              className="px-6 py-2 bg-blue-500 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={reset}
              disabled={!isDirty}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Preview sidebar */}
        <div className="lg:w-64 lg:ml-8 mt-8 lg:mt-0">
          <div className="sticky top-4">
            <LivePreview preferences={draft} />
          </div>
        </div>
      </div>
    </div>
  );
}
