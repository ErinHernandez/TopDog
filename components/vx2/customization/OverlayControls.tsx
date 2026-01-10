import React from 'react';
import { OverlayPattern } from '@/lib/customization/types';

interface OverlayControlsProps {
  size: number;
  onSizeChange: (size: number) => void;
  pattern: OverlayPattern;
  positionX?: number;
  positionY?: number;
  onPositionChange?: (x: number, y: number) => void;
}

export function OverlayControls({
  size,
  onSizeChange,
  pattern,
  positionX = 50,
  positionY = 50,
  onPositionChange,
}: OverlayControlsProps) {
  return (
    <div className="space-y-4">
      {/* Size Slider */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'inherit' }}>
          Size: {size}%
        </label>
        <input
          type="range"
          min={10}
          max={100}
          value={size}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="w-full h-3 sm:h-2 rounded-lg appearance-none cursor-pointer touch-none"
          style={{
            WebkitAppearance: 'none',
            appearance: 'none',
            background: 'rgba(156, 163, 175, 0.2)',
          }}
        />
      </div>

      {/* Position Controls (only for placement pattern) */}
      {pattern === 'placement' && onPositionChange && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'inherit' }}>
              Horizontal: {positionX}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={positionX}
              onChange={(e) => onPositionChange(Number(e.target.value), positionY)}
              className="w-full h-3 sm:h-2 rounded-lg appearance-none cursor-pointer touch-none"
              style={{
                WebkitAppearance: 'none',
                appearance: 'none',
                background: 'rgba(156, 163, 175, 0.2)',
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'inherit' }}>
              Vertical: {positionY}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={positionY}
              onChange={(e) => onPositionChange(positionX, Number(e.target.value))}
              className="w-full h-3 sm:h-2 rounded-lg appearance-none cursor-pointer touch-none"
              style={{
                WebkitAppearance: 'none',
                appearance: 'none',
                background: 'rgba(156, 163, 175, 0.2)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
