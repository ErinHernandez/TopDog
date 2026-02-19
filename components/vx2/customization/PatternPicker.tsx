import React from 'react';

import { OverlayPattern } from '@/lib/customization/types';
import { cn } from '@/lib/utils';

import styles from './PatternPicker.module.css';

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
          className={styles.button}
          style={
            {
              '--bg-color': selected === pattern.value ? 'rgba(59, 130, 246, 0.1)' : '#1F2937',
              '--border-color': selected === pattern.value ? '#60A5FA' : '#4B5563',
              '--border-color-hover': selected === pattern.value ? '#60A5FA' : '#374151',
              '--description-color': 'rgba(156, 163, 175, 0.8)',
            } as React.CSSProperties
          }
        >
          <div className={styles.label}>{pattern.label}</div>
          <div className={styles.description}>{pattern.description}</div>
        </button>
      ))}
    </div>
  );
}
