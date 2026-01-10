import React from 'react';
import { OverlayPattern } from '@/lib/customization/types';
import { cn } from '@/lib/utils';

interface PatternPickerProps {
  selected: OverlayPattern;
  onSelect: (pattern: OverlayPattern) => void;
}

const PATTERNS: { value: OverlayPattern; label: string; description: string }[] = [
  { value: 'single', label: 'Single', description: 'One centered image' },
  { value: 'single-flipped', label: 'Flipped', description: 'One image, upside down' },
  { value: 'scattered', label: 'Scattered', description: 'Multiple scattered images' },
  { value: 'tiled', label: 'Tiled', description: 'Repeating grid pattern' },
  { value: 'placement', label: 'Custom', description: 'Position anywhere' },
];

export function PatternPicker({ selected, onSelect }: PatternPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-2 sm:grid-cols-3">
      {PATTERNS.map((pattern) => (
        <button
          key={pattern.value}
          type="button"
          onClick={() => onSelect(pattern.value)}
          className={cn(
            'p-4 sm:p-3 rounded-lg border-2 text-left transition-all min-h-[64px] sm:min-h-0',
            selected === pattern.value
              ? 'border-blue-500 bg-blue-900/20 border-blue-400'
              : 'border-gray-600 hover:border-gray-500'
          )}
          style={
            selected === pattern.value
              ? {
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                }
              : {
                  backgroundColor: '#1F2937',
                }
          }
        >
          <div className="font-medium text-sm" style={{ color: 'inherit' }}>{pattern.label}</div>
          <div className="text-xs mt-0.5" style={{ color: 'rgba(156, 163, 175, 0.8)' }}>{pattern.description}</div>
        </button>
      ))}
    </div>
  );
}
