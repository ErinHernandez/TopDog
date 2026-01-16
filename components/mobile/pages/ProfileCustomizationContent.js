/**
 * ProfileCustomizationContent - Mobile Profile Customization Page
 * 
 * Full customization interface for mobile with flags, overlays, and patterns.
 * Uses the VX2 customization system with mobile-optimized UI.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCustomization } from '@/components/vx2/customization/hooks/useCustomization';
import { FlagGrid } from '@/components/vx2/customization/FlagGrid';
import { PatternPicker } from '@/components/vx2/customization/PatternPicker';
import { OverlayControls } from '@/components/vx2/customization/OverlayControls';
import { LivePreview } from '@/components/vx2/customization/LivePreview';
import MobilePhoneFrame, { MobilePhoneContent } from '../shared/MobilePhoneFrame';
import { useAuth } from '@/components/vx2/auth/hooks/useAuth';

// Icons
function MapPinIcon({ className = '' }) {
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

function LayersIcon({ className = '' }) {
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

function PaletteIcon({ className = '' }) {
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

export default function ProfileCustomizationContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { user, state: authState } = useAuth();
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

  const [activeSection, setActiveSection] = useState('background');

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Only block on auth if we're truly initializing AND have no user yet
  // Once user exists, render immediately (profile loads in background)
  const shouldShowLoading = !mounted || (authState.isInitializing && !authState.user);

  if (shouldShowLoading) {
    return (
      <MobilePhoneFrame>
        <MobilePhoneContent className="items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </MobilePhoneContent>
      </MobilePhoneFrame>
    );
  }

  return (
    <MobilePhoneFrame>
      <MobilePhoneContent>
        {/* Mobile Header */}
        <div 
          className="w-full shadow-lg relative"
          style={{
            background: 'url(/wr_blue.png) no-repeat center center',
            backgroundSize: 'cover',
            paddingTop: '44px',
            height: '60px'
          }}
        >
          {/* Back Arrow */}
          <button
            onClick={() => router.push('/mobile?tab=Profile')}
            className="absolute left-4 z-10"
            style={{
              top: '50%',
              transform: 'translateY(-50%)',
              minHeight: '44px',
              minWidth: '44px'
            }}
            title="Go back to profile"
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center">
              <svg 
                className="w-6 h-6 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </button>

          {/* Header Title */}
          <div className="absolute inset-0 flex items-center justify-center z-0">
            <h1 className="text-white font-semibold text-lg">Customization</h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto mobile-no-scrollbar" style={{ padding: '16px' }}>
          {/* Location consent banner */}
          {!locationConsent && (
            <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <MapPinIcon className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-amber-200 mb-3">
                    Enable location detection to unlock flag backgrounds based on places you visit.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={enableLocationTracking}
                      className="px-4 py-2 bg-amber-600 text-white text-sm rounded-lg font-medium"
                    >
                      Enable
                    </button>
                    <button className="px-4 py-2 text-amber-300 text-sm hover:bg-amber-800/30 rounded-lg">
                      Not now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview at top on mobile */}
          <div className="mb-6 flex justify-center">
            <LivePreview preferences={draft} />
          </div>

          {/* Section tabs */}
          <div className="flex border-b border-gray-700 mb-4">
            <button
              onClick={() => setActiveSection('background')}
              className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex-1 min-h-[48px]`}
              style={{
                borderColor: activeSection === 'background' ? '#4285F4' : 'transparent',
                color: activeSection === 'background' ? '#4285F4' : '#9CA3AF',
              }}
            >
              <PaletteIcon className="w-4 h-4" />
              Background
            </button>
            <button
              onClick={() => setActiveSection('overlay')}
              className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex-1 min-h-[48px]`}
              style={{
                borderColor: activeSection === 'overlay' ? '#4285F4' : 'transparent',
                color: activeSection === 'overlay' ? '#4285F4' : '#9CA3AF',
              }}
            >
              <LayersIcon className="w-4 h-4" />
              Overlay
            </button>
          </div>

          {/* Background Section */}
          {activeSection === 'background' && (
            <div className="space-y-4">
              {/* Background type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Background Type
                </label>
                <div className="flex gap-2">
                  {['none', 'flag', 'solid'].map((type) => (
                    <button
                      key={type}
                      onClick={() => updateDraft({ backgroundType: type })}
                      className={`flex-1 px-4 py-3 rounded-lg text-sm capitalize transition-colors min-h-[48px]`}
                      style={{
                        backgroundColor: draft.backgroundType === type 
                          ? '#4285F4' 
                          : '#1F2937',
                        color: draft.backgroundType === type 
                          ? '#FFFFFF' 
                          : '#D1D5DB',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Background Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={draft.backgroundSolidColor || '#ffffff'}
                      onChange={(e) => updateDraft({ backgroundSolidColor: e.target.value })}
                      className="w-16 h-12 rounded border border-gray-600 cursor-pointer"
                      style={{ backgroundColor: '#1F2937' }}
                    />
                    <span className="text-sm font-mono text-gray-400">
                      {draft.backgroundSolidColor || '#ffffff'}
                    </span>
                  </div>
                </div>
              )}

              {/* Border color picker */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Border Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={draft.borderColor}
                    onChange={(e) => updateDraft({ borderColor: e.target.value })}
                    className="w-16 h-12 rounded border border-gray-600 cursor-pointer"
                    style={{ backgroundColor: '#1F2937' }}
                  />
                  <span className="text-sm font-mono text-gray-400">
                    {draft.borderColor}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Overlay Section */}
          {activeSection === 'overlay' && (
            <div className="space-y-4">
              {/* Enable toggle */}
              <label className="flex items-center gap-3 cursor-pointer min-h-[48px]">
                <input
                  type="checkbox"
                  checked={draft.overlayEnabled}
                  onChange={(e) => updateDraft({ overlayEnabled: e.target.checked })}
                  className="w-6 h-6 rounded"
                  style={{ accentColor: '#4285F4' }}
                />
                <span className="text-sm font-medium text-gray-200">
                  Enable overlay
                </span>
              </label>

              {draft.overlayEnabled && (
                <>
                  {/* Image selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Image
                    </label>
                    <div className="flex gap-2">
                      <button
                        className={`p-3 rounded-lg border-2 transition-colors`}
                        style={{
                          borderColor: draft.overlayImageId === 'hotdog' 
                            ? '#4285F4' 
                            : '#374151',
                          backgroundColor: draft.overlayImageId === 'hotdog'
                            ? 'rgba(66, 133, 244, 0.1)'
                            : '#1F2937',
                        }}
                      >
                        <img
                          src="/customization/images/hotdog.svg"
                          alt="Hot Dog"
                          className="w-10 h-10"
                        />
                      </button>
                    </div>
                  </div>

                  {/* Pattern picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
          <div className="flex flex-col gap-3 pt-6 mt-6 border-t border-gray-700">
            <button
              onClick={save}
              disabled={!isDirty || isSaving}
              className="w-full px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
              style={{
                backgroundColor: '#4285F4',
                color: '#FFFFFF',
              }}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={reset}
              disabled={!isDirty}
              className="w-full px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
              style={{
                backgroundColor: '#1F2937',
                color: '#D1D5DB',
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </MobilePhoneContent>
    </MobilePhoneFrame>
  );
}
