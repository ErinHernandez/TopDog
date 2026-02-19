import React, { useState, useMemo } from 'react';

import { getFlagUrl, getFlagDisplayName, COUNTRY_NAMES } from '@/lib/customization/flags';
import { FlagOption } from '@/lib/customization/types';
import { cn } from '@/lib/utils';

import styles from './FlagGrid.module.css';

interface FlagGridProps {
  flags: FlagOption[];
  selectedCode?: string;
  onSelect: (code: string) => void;
  isLoading?: boolean;
}

export function FlagGrid({ flags, selectedCode, onSelect, isLoading }: FlagGridProps) {
  // Group: countries first, then US states, then US counties, then international divisions
  const countries = flags.filter((f) => f.type === 'country');
  const states = flags.filter((f) => f.type === 'state');
  const counties = flags.filter((f) => f.type === 'county');
  const divisions = flags.filter((f) => f.type === 'division');

  // Group divisions by country for better organization
  const divisionsByCountry = useMemo(() => {
    const grouped: Record<string, FlagOption[]> = {};
    divisions.forEach(div => {
      const codeParts = div.code.split('-');
      const countryCode = codeParts[0] || div.code;
      if (!grouped[countryCode]) {
        grouped[countryCode] = [];
      }
      const countryGroup = grouped[countryCode];
      if (countryGroup) {
        countryGroup.push(div);
      }
    });
    return grouped;
  }, [divisions]);

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
      <div className={styles.emptyContainer}>
        <p>No flags unlocked yet.</p>
        <p className="text-sm mt-1">Enable location tracking to unlock flags from places you visit.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {countries.length > 0 && (
        <div>
          <h4 className={cn('text-sm font-medium mb-2', styles.sectionTitle)}>Countries</h4>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
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
          <h4 className={cn('text-sm font-medium mb-2', styles.sectionTitle)}>US States</h4>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
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

      {counties.length > 0 && (
        <div>
          <h4 className={cn('text-sm font-medium mb-2', styles.sectionTitle)}>US Counties</h4>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
            {counties.map((flag) => (
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

      {Object.keys(divisionsByCountry).length > 0 && (
        <div>
          <h4 className={cn('text-sm font-medium mb-2', styles.sectionTitle)}>
            Regions & Provinces
          </h4>
          {Object.entries(divisionsByCountry).map(([countryCode, countryDivisions]) => (
            <div key={countryCode} className="mb-3">
              <h5 className={cn('text-xs font-medium mb-1', styles.divisionSubtitle)}>
                {COUNTRY_NAMES[countryCode] || countryCode}
              </h5>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
                {countryDivisions.map((flag) => (
                  <FlagItem
                    key={flag.code}
                    flag={flag}
                    isSelected={selectedCode === flag.code}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </div>
          ))}
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
        styles.flagButton,
        isSelected ? styles.flagButtonSelected : styles.flagButtonUnselected
      )}
      aria-label={`Select ${flag.name} flag`}
      aria-pressed={isSelected}
    >
      {imgError ? (
        <div className={styles.flagErrorContainer}>
          <span className={styles.flagErrorText}>{flag.code}</span>
        </div>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getFlagUrl(flag.code)}
            alt={flag.name}
            className={styles.flagImage}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        </>
      )}

      {isSelected && (
        <div className={styles.checkmarkContainer}>
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

      <div className={styles.flagLabel}>
        <span className={styles.flagLabelText}>{getFlagDisplayName(flag.code)}</span>
      </div>
    </button>
  );
}
