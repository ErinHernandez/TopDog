/**
 * AutodraftLimitsModalVX - Position Limits Modal for VX Profile
 * 
 * Allows users to set maximum position limits for autodraft.
 * Opens as modal overlay within Profile tab (no navigation).
 * Uses contained Modal to stay within phone frame bounds.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../../../../shared/Modal';
import { POSITION_COLORS, TEXT_COLORS, BG_COLORS, BRAND_COLORS } from '../../../../constants/colors';

// ============================================================================
// TYPES
// ============================================================================

export interface AutodraftLimitsModalVXProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PositionLimits {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
}

type Position = keyof PositionLimits;

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_LIMITS: PositionLimits = {
  QB: 4,
  RB: 10,
  WR: 11,
  TE: 5,
};

const MAX_LIMITS: PositionLimits = {
  QB: 4,
  RB: 10,
  WR: 11,
  TE: 5,
};

const POSITIONS: Position[] = ['QB', 'RB', 'WR', 'TE'];

// ============================================================================
// POSITION ROW COMPONENT
// ============================================================================

interface PositionRowProps {
  position: Position;
  value: number;
  maxValue: number;
  onChange: (delta: number) => void;
  disabled?: boolean;
}

function PositionRow({ position, value, maxValue, onChange, disabled }: PositionRowProps): React.ReactElement {
  const color = POSITION_COLORS[position] || '#ffffff';
  const atMin = value <= 0;
  const atMax = value >= maxValue;

  return (
    <div 
      className="flex items-center justify-between"
      style={{
        padding: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '12px',
        borderLeft: `3px solid ${color}`,
      }}
    >
      {/* Position info */}
      <div>
        <div 
          className="text-lg font-bold"
          style={{ color }}
        >
          {position}
        </div>
        <div 
          className="text-xs"
          style={{ color: TEXT_COLORS.muted }}
        >
          Maximum
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Decrement */}
        <button
          onClick={() => onChange(-1)}
          disabled={disabled || atMin}
          className="flex items-center justify-center transition-all"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: atMin ? BG_COLORS.tertiary : 'rgba(255, 255, 255, 0.1)',
            color: atMin ? TEXT_COLORS.disabled : TEXT_COLORS.primary,
            border: 'none',
            cursor: atMin || disabled ? 'not-allowed' : 'pointer',
            opacity: atMin ? 0.4 : 1,
            fontSize: '20px',
            fontWeight: 'bold',
          }}
          aria-label={`Decrease ${position} limit`}
        >
          -
        </button>

        {/* Value */}
        <div 
          className="text-center font-bold"
          style={{
            width: '36px',
            fontSize: '20px',
            color: TEXT_COLORS.primary,
          }}
        >
          {value}
        </div>

        {/* Increment */}
        <button
          onClick={() => onChange(1)}
          disabled={disabled || atMax}
          className="flex items-center justify-center transition-all"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: atMax ? BG_COLORS.tertiary : 'rgba(255, 255, 255, 0.1)',
            color: atMax ? TEXT_COLORS.disabled : TEXT_COLORS.primary,
            border: 'none',
            cursor: atMax || disabled ? 'not-allowed' : 'pointer',
            opacity: atMax ? 0.4 : 1,
            fontSize: '20px',
            fontWeight: 'bold',
          }}
          aria-label={`Increase ${position} limit`}
        >
          +
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AutodraftLimitsModalVX({ 
  isOpen, 
  onClose 
}: AutodraftLimitsModalVXProps): React.ReactElement | null {
  // State
  const [limits, setLimits] = useState<PositionLimits>(DEFAULT_LIMITS);
  const [originalLimits, setOriginalLimits] = useState<PositionLimits>(DEFAULT_LIMITS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const hasChanges = JSON.stringify(limits) !== JSON.stringify(originalLimits);
  const isAtDefaults = JSON.stringify(limits) === JSON.stringify(DEFAULT_LIMITS);

  // Load limits when modal opens
  useEffect(() => {
    if (isOpen) {
      loadLimits();
    }
  }, [isOpen]);

  const loadLimits = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Dynamic import to avoid SSR issues
      const { getAutodraftLimits, DEFAULT_AUTODRAFT_LIMITS } = await import('../../../../../../lib/autodraftLimits');
      const saved = await getAutodraftLimits();
      const validLimits = {
        QB: saved?.QB ?? DEFAULT_AUTODRAFT_LIMITS.QB,
        RB: saved?.RB ?? DEFAULT_AUTODRAFT_LIMITS.RB,
        WR: saved?.WR ?? DEFAULT_AUTODRAFT_LIMITS.WR,
        TE: saved?.TE ?? DEFAULT_AUTODRAFT_LIMITS.TE,
      };
      setLimits(validLimits);
      setOriginalLimits(validLimits);
    } catch (e) {
      console.error('Error loading autodraft limits:', e);
      // Use defaults on error
      setLimits(DEFAULT_LIMITS);
      setOriginalLimits(DEFAULT_LIMITS);
    } finally {
      setIsLoading(false);
    }
  };

  // Update single position
  const updateLimit = useCallback((position: Position, delta: number) => {
    setLimits(prev => {
      const newValue = Math.max(0, Math.min(MAX_LIMITS[position], prev[position] + delta));
      return { ...prev, [position]: newValue };
    });
  }, []);

  // Save limits
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const { setAutodraftLimits } = await import('../../../../../../lib/autodraftLimits');
      await setAutodraftLimits(limits);
      setOriginalLimits(limits);
      onClose();
    } catch (e) {
      console.error('Error saving autodraft limits:', e);
      setError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = useCallback(() => {
    setLimits(DEFAULT_LIMITS);
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Position Limits"
      size="sm"
      contained={true}
    >
      {/* Description */}
      <p 
        className="mb-6"
        style={{ 
          color: TEXT_COLORS.secondary,
          fontSize: '14px',
          lineHeight: '1.5',
        }}
      >
        Set the maximum number of players you want at each position if you are 
        not able to make your picks or are on Autopilot.
      </p>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-2"
            style={{ 
              borderColor: `${BRAND_COLORS.primary} transparent transparent transparent` 
            }}
          />
        </div>
      ) : (
        <>
          {/* Position rows */}
          <div className="flex flex-col gap-3 mb-6">
            {POSITIONS.map(position => (
              <PositionRow
                key={position}
                position={position}
                value={limits[position]}
                maxValue={MAX_LIMITS[position]}
                onChange={(delta) => updateLimit(position, delta)}
                disabled={isSaving}
              />
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div 
              className="mb-4 p-3 rounded-lg text-sm"
              style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
              }}
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {/* Reset button */}
            <button
              onClick={handleReset}
              disabled={isAtDefaults || isSaving}
              className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all"
              style={{
                backgroundColor: isAtDefaults ? BG_COLORS.tertiary : 'rgba(255, 255, 255, 0.1)',
                color: isAtDefaults ? TEXT_COLORS.disabled : TEXT_COLORS.primary,
                border: 'none',
                cursor: isAtDefaults || isSaving ? 'not-allowed' : 'pointer',
                opacity: isAtDefaults ? 0.5 : 1,
              }}
            >
              Reset
            </button>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: (!hasChanges || isSaving) ? BG_COLORS.tertiary : BRAND_COLORS.primary,
                color: (!hasChanges || isSaving) ? TEXT_COLORS.disabled : '#000000',
                border: 'none',
                cursor: (!hasChanges || isSaving) ? 'not-allowed' : 'pointer',
                opacity: (!hasChanges || isSaving) ? 0.5 : 1,
              }}
            >
              {isSaving ? (
                <>
                  <div 
                    className="animate-spin rounded-full h-4 w-4 border-2"
                    style={{ 
                      borderColor: 'currentColor transparent transparent transparent' 
                    }}
                  />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

