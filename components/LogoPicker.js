import React from 'react';
import { logoOptions } from './team-logos';

export default function LogoPicker({ selected, onSelect, customColors, onColorChange }) {
  return (
    <div className="flex flex-wrap gap-4">
      {logoOptions.map((option, idx) => {
        const Logo = option.component;
        const color = customColors && customColors[idx] ? customColors[idx] : option.bgColor;
        return (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button
              onClick={() => onSelect(idx)}
              style={{
                border: selected === idx ? '3px solid #60A5FA' : '2px solid #ccc',
                borderRadius: 8,
                padding: 4,
                background: 'none',
                cursor: 'pointer',
                outline: 'none',
                transition: 'border 0.2s',
              }}
              aria-label={`Select ${option.label} logo`}
            >
              <Logo size={64} bgColor={color} />
              <div className="text-xs text-center mt-1 text-white">{option.label}</div>
            </button>
            <input
              type="color"
              value={color}
              onChange={e => onColorChange(idx, e.target.value)}
              style={{ marginTop: 8, width: 32, height: 32, border: 'none', background: 'none', cursor: 'pointer' }}
              aria-label={`Pick background color for ${option.label}`}
            />
          </div>
        );
      })}
    </div>
  );
} 