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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {PATTERNS.map((pattern) => (
        <button
          key={pattern.value}
          type="button"
          onClick={() => onSelect(pattern.value)}
          className={cn(
            'p-3 rounded-lg border-2 text-left transition-all',
            selected === pattern.value
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <div className="font-medium text-sm">{pattern.label}</div>
          <div className="text-xs text-gray-500">{pattern.description}</div>
        </button>
      ))}
    </div>
  );
}
