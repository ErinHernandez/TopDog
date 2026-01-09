import { useState } from 'react';
import { FlagOption } from '@/lib/customization/types';
import { getFlagUrl, getFlagDisplayName } from '@/lib/customization/flags';
import { cn } from '@/lib/utils';

interface FlagGridProps {
  flags: FlagOption[];
  selectedCode?: string;
  onSelect: (code: string) => void;
  isLoading?: boolean;
}

export function FlagGrid({ flags, selectedCode, onSelect, isLoading }: FlagGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/2] bg-gray-200 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (flags.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No flags unlocked yet.</p>
        <p className="text-sm mt-1">Enable location tracking to unlock flags from places you visit.</p>
      </div>
    );
  }

  // Group: countries first, then US states
  const countries = flags.filter((f) => f.type === 'country');
  const states = flags.filter((f) => f.type === 'state');

  return (
    <div className="space-y-4">
      {countries.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">Countries</h4>
          <div className="grid grid-cols-4 gap-2">
            {countries.map((flag) => (
              <FlagItem
                key={flag.code}
                flag={flag}
                isSelected={selectedCode === flag.code}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      )}

      {states.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">US States</h4>
          <div className="grid grid-cols-4 gap-2">
            {states.map((flag) => (
              <FlagItem
                key={flag.code}
                flag={flag}
                isSelected={selectedCode === flag.code}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FlagItem({
  flag,
  isSelected,
  onSelect,
}: {
  flag: FlagOption;
  isSelected: boolean;
  onSelect: (code: string) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onSelect(flag.code)}
      className={cn(
        'relative aspect-[3/2] rounded overflow-hidden border-2 transition-all',
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300'
      )}
      aria-label={`Select ${flag.name} flag`}
      aria-pressed={isSelected}
    >
      {imgError ? (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <span className="text-xs font-mono text-gray-500">{flag.code}</span>
        </div>
      ) : (
        <img
          src={getFlagUrl(flag.code)}
          alt={flag.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      )}

      {isSelected && (
        <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5">
          <svg
            width={12}
            height={12}
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
        <span className="text-[10px] text-white truncate block">{getFlagDisplayName(flag.code)}</span>
      </div>
    </button>
  );
}
