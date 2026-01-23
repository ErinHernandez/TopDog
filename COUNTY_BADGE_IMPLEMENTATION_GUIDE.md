# County Badge System - Implementation Guide

**Project:** Bestball Site
**Date:** January 2026
**Target Audience:** AI Agent / LLM in Cursor
**CRITICAL:** Follow this guide EXACTLY. Do NOT make assumptions or decisions. Copy code blocks verbatim.

---

## TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Phase 1: Type Extensions](#2-phase-1-type-extensions)
3. [Phase 2: County Detection Service](#3-phase-2-county-detection-service)
4. [Phase 3: Extend recordLocationVisit](#4-phase-3-extend-recordlocationvisit)
5. [Phase 4: Update All Call Sites](#5-phase-4-update-all-call-sites)
6. [Phase 5: Update useCustomization Hook](#6-phase-5-update-usecustomization-hook)
7. [Phase 6: Update FlagGrid Component](#7-phase-6-update-flaggrid-component)
8. [Phase 7: Update flags.ts](#8-phase-7-update-flagsts)
9. [Phase 8: County Data Files](#9-phase-8-county-data-files)
10. [Phase 9: Badge Deletion Feature](#10-phase-9-badge-deletion-feature)
11. [Phase 10: Address Geocoding for Signup](#11-phase-10-address-geocoding-for-signup)
12. [Phase 11: Draft Location Tracking](#12-phase-11-draft-location-tracking)
13. [Testing Checklist](#13-testing-checklist)

---

## 1. OVERVIEW

### What We Are Adding

We are extending the existing flag/badge system to support **US County badges** (3,143 counties).

### Current System (DO NOT MODIFY UNLESS SPECIFIED)

- `userLocations` Firestore collection stores `countries` and `states` arrays
- `FlagOption` type has `type: 'country' | 'state'`
- `recordLocationVisit()` records country and state visits
- `FlagGrid` displays flags grouped by type

### What We Are Adding

- `counties` array to `UserLocations` interface
- `'county'` type to `FlagOption`
- County code format: `US-{STATE}-{FIPS}` (e.g., `US-CA-06037` for Los Angeles County)
- County detection via address geocoding and reverse geocoding
- County badge deletion with undo functionality
- Draft location tracking

### County Code Format

```
US-{STATE_CODE}-{FIPS_CODE}

Examples:
- US-CA-06037 = Los Angeles County, California
- US-TX-48201 = Harris County, Texas
- US-NY-36061 = New York County, New York

Regex validation: /^US-[A-Z]{2}-\d{5}$/
```

---

## 2. PHASE 1: TYPE EXTENSIONS

### File: `lib/customization/types.ts`

**CURRENT FILE CONTENT:**
```typescript
import { Timestamp } from 'firebase/firestore';

export interface UserLocations {
  userId: string;
  countries: LocationRecord[];
  states: LocationRecord[];
  updatedAt: Timestamp;
  consentGiven: boolean;
}

export interface LocationRecord {
  code: string;
  name: string;
  firstSeen: Timestamp;
  lastSeen: Timestamp;
  visitCount: number;
}

export interface CustomizationPreferences {
  borderColor: string;
  backgroundType: 'none' | 'flag' | 'solid';
  backgroundFlagCode?: string;
  backgroundSolidColor?: string;
  overlayEnabled: boolean;
  overlayImageId: string;
  overlayPattern: OverlayPattern;
  overlaySize: number;
  overlayPositionX?: number;
  overlayPositionY?: number;
}

export type OverlayPattern =
  | 'single'
  | 'single-flipped'
  | 'scattered'
  | 'tiled'
  | 'placement';

export interface FlagOption {
  code: string;
  name: string;
  type: 'country' | 'state';
}

export const DEFAULT_PREFERENCES: CustomizationPreferences = {
  borderColor: '#9CA3AF',
  backgroundType: 'none',
  overlayEnabled: false,
  overlayImageId: 'hotdog',
  overlayPattern: 'single',
  overlaySize: 50,
};
```

**REPLACE ENTIRE FILE WITH:**
```typescript
import { Timestamp } from 'firebase/firestore';

export interface UserLocations {
  userId: string;
  countries: LocationRecord[];
  states: LocationRecord[];
  counties?: LocationRecord[];  // NEW - Optional for backward compatibility
  updatedAt: Timestamp;
  consentGiven: boolean;
}

export interface LocationRecord {
  code: string;
  name: string;
  firstSeen: Timestamp;
  lastSeen: Timestamp;
  visitCount: number;
}

export interface CustomizationPreferences {
  borderColor: string;
  backgroundType: 'none' | 'flag' | 'solid';
  backgroundFlagCode?: string;
  backgroundSolidColor?: string;
  overlayEnabled: boolean;
  overlayImageId: string;
  overlayPattern: OverlayPattern;
  overlaySize: number;
  overlayPositionX?: number;
  overlayPositionY?: number;
}

export type OverlayPattern =
  | 'single'
  | 'single-flipped'
  | 'scattered'
  | 'tiled'
  | 'placement';

export interface FlagOption {
  code: string;
  name: string;
  type: 'country' | 'state' | 'county';  // NEW - Added 'county'
}

export const DEFAULT_PREFERENCES: CustomizationPreferences = {
  borderColor: '#9CA3AF',
  backgroundType: 'none',
  overlayEnabled: false,
  overlayImageId: 'hotdog',
  overlayPattern: 'single',
  overlaySize: 50,
};

// NEW - County-specific types
export interface CountyInfo {
  code: string;      // Format: "US-{stateCode}-{fipsCode}"
  name: string;      // County name (e.g., "Los Angeles")
  fipsCode: string;  // 5-digit FIPS code
  stateCode: string; // 2-letter state code
}
```

---

## 3. PHASE 2: COUNTY DETECTION SERVICE

### CREATE NEW FILE: `lib/customization/countyDetection.ts`

```typescript
/**
 * County Detection Service
 *
 * Detects county from location data using reverse geocoding.
 * County code format: "US-{stateCode}-{fipsCode}"
 */

import type { CountyInfo } from './types';

/**
 * Generate county code from state code and FIPS code
 * Format: "US-{stateCode}-{fipsCode}"
 *
 * @param stateCode - 2-letter US state code (e.g., "CA")
 * @param fipsCode - 5-digit FIPS code (e.g., "06037")
 * @returns County code in format "US-CA-06037"
 */
export function generateCountyCode(stateCode: string, fipsCode: string): string {
  if (!/^[A-Z]{2}$/.test(stateCode)) {
    throw new Error(`Invalid state code: ${stateCode}`);
  }
  if (!/^\d{5}$/.test(fipsCode)) {
    throw new Error(`Invalid FIPS code: ${fipsCode}`);
  }
  return `US-${stateCode}-${fipsCode}`;
}

/**
 * Parse county code to extract components
 *
 * @param countyCode - County code in format "US-{stateCode}-{fipsCode}"
 * @returns Object with stateCode and fipsCode, or null if invalid
 */
export function parseCountyCode(countyCode: string): { stateCode: string; fipsCode: string } | null {
  const match = countyCode.match(/^US-([A-Z]{2})-(\d{5})$/);
  if (!match) {
    return null;
  }
  return {
    stateCode: match[1],
    fipsCode: match[2],
  };
}

/**
 * Validate county code format
 *
 * @param countyCode - County code to validate
 * @returns true if valid format, false otherwise
 */
export function isValidCountyCode(countyCode: string): boolean {
  return /^US-[A-Z]{2}-\d{5}$/.test(countyCode);
}

/**
 * Detect county from coordinates using reverse geocoding
 * Uses BigDataCloud API (free, no API key required)
 *
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns CountyInfo if county can be determined, null otherwise
 */
export async function detectCountyFromCoordinates(
  latitude: number,
  longitude: number
): Promise<CountyInfo | null> {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );

    if (!response.ok) {
      console.warn('BigDataCloud reverse geocode failed:', response.status);
      return null;
    }

    const data = await response.json();

    // BigDataCloud returns county in localityInfo.administrative
    const adminLevels = data.localityInfo?.administrative || [];

    // Find county-level administrative area (typically level 2 in US)
    const countyLevel = adminLevels.find((level: any) =>
      level.adminLevel === 2 ||
      level.description?.toLowerCase().includes('county')
    );

    if (!countyLevel) {
      return null;
    }

    // Extract state code from principalSubdivisionCode (format: "US-CA")
    const stateCode = data.principalSubdivisionCode?.split('-')[1];
    if (!stateCode || !/^[A-Z]{2}$/.test(stateCode)) {
      return null;
    }

    // Get FIPS code - BigDataCloud may include it in geonameId or we need to look it up
    // For now, we'll need to use the county name mapping to get FIPS
    const countyName = countyLevel.name?.replace(/ County$/i, '').trim();
    if (!countyName) {
      return null;
    }

    // Import county data to find FIPS code
    const { getCountyFipsCode } = await import('./countyData');
    const fipsCode = getCountyFipsCode(stateCode, countyName);

    if (!fipsCode) {
      console.warn(`Could not find FIPS code for ${countyName}, ${stateCode}`);
      return null;
    }

    return {
      code: generateCountyCode(stateCode, fipsCode),
      name: countyName,
      fipsCode,
      stateCode,
    };
  } catch (error) {
    console.error('Error detecting county from coordinates:', error);
    return null;
  }
}

/**
 * Detect county from IP-based location
 * Note: IP geolocation typically does not provide county-level data
 * This function attempts to use city coordinates for reverse geocoding
 *
 * @param location - GeolocationResult from IP detection
 * @returns CountyInfo if county can be determined, null otherwise
 */
export async function detectCountyFromLocation(
  location: { country?: { code: string }; state?: { code: string }; latitude?: number; longitude?: number }
): Promise<CountyInfo | null> {
  // Must be US location
  if (!location.country || location.country.code !== 'US') {
    return null;
  }

  if (!location.state) {
    return null;
  }

  // If we have coordinates, use reverse geocoding
  if (location.latitude && location.longitude) {
    return detectCountyFromCoordinates(location.latitude, location.longitude);
  }

  // Without coordinates, we cannot determine county from IP alone
  return null;
}
```

---

## 4. PHASE 3: EXTEND recordLocationVisit

### File: `lib/customization/geolocation.ts`

**FIND THIS FUNCTION (around line 146):**
```typescript
export async function recordLocationVisit(
  userId: string,
  location: GeolocationResult
): Promise<void> {
```

**REPLACE THE ENTIRE FUNCTION WITH:**
```typescript
export async function recordLocationVisit(
  userId: string,
  location: GeolocationResult,
  countyCode?: string,
  countyName?: string
): Promise<void> {
  if (!location.country) return;

  if (!db) {
    throw new Error('Firebase db not initialized');
  }
  const docRef = doc(db, 'userLocations', userId);
  const now = Timestamp.now();

  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(docRef);
    const data: UserLocations = docSnap.exists()
      ? (docSnap.data() as UserLocations)
      : {
          userId,
          countries: [],
          states: [],
          counties: [],
          consentGiven: true,
          updatedAt: now,
        };

    // Update or add country
    const countryIdx = data.countries.findIndex(
      (c) => c.code === location.country!.code
    );
    if (countryIdx >= 0) {
      data.countries[countryIdx].lastSeen = now;
      data.countries[countryIdx].visitCount++;
    } else {
      data.countries.push({
        code: location.country!.code,
        name: location.country!.name,
        firstSeen: now,
        lastSeen: now,
        visitCount: 1,
      });
    }

    // Update or add US state if present
    if (location.state) {
      const stateIdx = data.states.findIndex((s) => s.code === location.state!.code);
      if (stateIdx >= 0) {
        data.states[stateIdx].lastSeen = now;
        data.states[stateIdx].visitCount++;
      } else {
        data.states.push({
          code: location.state!.code,
          name: location.state!.name,
          firstSeen: now,
          lastSeen: now,
          visitCount: 1,
        });
      }
    }

    // NEW: Update or add US county if present
    if (
      countyCode &&
      countyName &&
      location.country.code === 'US' &&
      location.state
    ) {
      // Validate county code format
      if (!/^US-[A-Z]{2}-\d{5}$/.test(countyCode)) {
        console.warn('Invalid county code format:', countyCode);
      } else {
        // Ensure counties array exists (backward compatibility)
        if (!data.counties) {
          data.counties = [];
        }

        const countyIdx = data.counties.findIndex((c) => c.code === countyCode);
        if (countyIdx >= 0) {
          data.counties[countyIdx].lastSeen = now;
          data.counties[countyIdx].visitCount++;
        } else {
          data.counties.push({
            code: countyCode,
            name: countyName,
            firstSeen: now,
            lastSeen: now,
            visitCount: 1,
          });
        }
      }
    }

    data.updatedAt = now;
    transaction.set(docRef, data);
  });
}
```

---

## 5. PHASE 4: UPDATE ALL CALL SITES

There are 3 places that call `recordLocationVisit`. Update each one.

### 5.1 File: `pages/api/auth/signup.js`

**FIND (around line 52):**
```javascript
import { recordLocationVisit, grantLocationConsent } from '../../../lib/customization/geolocation';
```

**REPLACE WITH:**
```javascript
import { recordLocationVisit, grantLocationConsent } from '../../../lib/customization/geolocation';
import { detectCountyFromLocation } from '../../../lib/customization/countyDetection';
```

**FIND (around line 380-405) the location recording section:**
```javascript
// Record location for first flag earned
try {
  await grantLocationConsent(uid);

  const countryName = COUNTRY_NAMES[countryCode] || countryCode;
  const location = {
    country: { code: countryCode, name: countryName },
    state: (countryCode === 'US' && stateCode && US_STATE_NAMES[stateCode])
      ? { code: stateCode, name: US_STATE_NAMES[stateCode] }
      : null,
  };

  await recordLocationVisit(uid, location);
} catch (locationError) {
```

**REPLACE WITH:**
```javascript
// Record location for first flag earned
try {
  await grantLocationConsent(uid);

  const countryName = COUNTRY_NAMES[countryCode] || countryCode;
  const location = {
    country: { code: countryCode, name: countryName },
    state: (countryCode === 'US' && stateCode && US_STATE_NAMES[stateCode])
      ? { code: stateCode, name: US_STATE_NAMES[stateCode] }
      : null,
  };

  // Try to detect county (will be null if no coordinates available)
  let county = null;
  try {
    county = await detectCountyFromLocation(location);
  } catch (countyError) {
    logger.warn('Failed to detect county during signup', {
      component: 'auth',
      operation: 'signup',
      uid,
      error: countyError instanceof Error ? countyError.message : 'Unknown error',
    });
  }

  await recordLocationVisit(uid, location, county?.code, county?.name);
} catch (locationError) {
```

### 5.2 File: `components/vx2/auth/context/AuthContext.tsx`

**FIND (around line 492-510):**
```typescript
try {
  const { detectLocation, recordLocationVisit, grantLocationConsent } = await import('@/lib/customization/geolocation');

  await grantLocationConsent(firebaseUser.uid);

  const location = await detectLocation();
  if (location.country) {
    await recordLocationVisit(firebaseUser.uid, location);
  }
} catch (locationError) {
```

**REPLACE WITH:**
```typescript
try {
  const { detectLocation, recordLocationVisit, grantLocationConsent } = await import('@/lib/customization/geolocation');
  const { detectCountyFromLocation } = await import('@/lib/customization/countyDetection');

  await grantLocationConsent(firebaseUser.uid);

  const location = await detectLocation();
  if (location.country) {
    // Try to detect county
    let county = null;
    try {
      county = await detectCountyFromLocation(location);
    } catch (countyError) {
      console.warn('Failed to detect county during signup:', countyError);
    }

    await recordLocationVisit(firebaseUser.uid, location, county?.code, county?.name);
  }
} catch (locationError) {
```

### 5.3 File: `components/vx2/customization/hooks/useCustomization.ts`

**FIND the auto-detection section (around line 183-186) inside the useEffect:**
```typescript
const location = await detectLocation();
if (location.country) {
  await recordLocationVisit(user.uid, location);
```

**REPLACE WITH:**
```typescript
const location = await detectLocation();
if (location.country) {
  // Try to detect county
  let county = null;
  try {
    const { detectCountyFromLocation } = await import('@/lib/customization/countyDetection');
    county = await detectCountyFromLocation(location);
  } catch (countyError) {
    console.warn('Failed to detect county:', countyError);
  }

  await recordLocationVisit(user.uid, location, county?.code, county?.name);
```

**FIND the enableLocationTracking function (around line 260-262):**
```typescript
const location = await detectLocation();
if (location.country) {
  await recordLocationVisit(user.uid, location);
}
```

**REPLACE WITH:**
```typescript
const location = await detectLocation();
if (location.country) {
  // Try to detect county
  let county = null;
  try {
    const { detectCountyFromLocation } = await import('@/lib/customization/countyDetection');
    county = await detectCountyFromLocation(location);
  } catch (countyError) {
    console.warn('Failed to detect county:', countyError);
  }

  await recordLocationVisit(user.uid, location, county?.code, county?.name);
}
```

---

## 6. PHASE 5: UPDATE useCustomization HOOK

### File: `components/vx2/customization/hooks/useCustomization.ts`

**FIND the DEV_FLAGS constant (around line 56-61):**
```typescript
const DEV_FLAGS: FlagOption[] = [
  { code: 'US', name: 'United States', type: 'country' },
  { code: 'US-SC', name: 'South Carolina', type: 'state' },
  { code: 'US-NY', name: 'New York', type: 'state' },
  { code: 'IE', name: 'Ireland', type: 'country' },
];
```

**REPLACE WITH:**
```typescript
const DEV_FLAGS: FlagOption[] = [
  { code: 'US', name: 'United States', type: 'country' },
  { code: 'US-SC', name: 'South Carolina', type: 'state' },
  { code: 'US-NY', name: 'New York', type: 'state' },
  { code: 'IE', name: 'Ireland', type: 'country' },
  // Dev counties for testing
  { code: 'US-CA-06037', name: 'Los Angeles', type: 'county' },
  { code: 'US-TX-48201', name: 'Harris', type: 'county' },
  { code: 'US-NY-36061', name: 'New York', type: 'county' },
];
```

**FIND the subscription callback (around line 131-168) where flags are built from locations:**
```typescript
const flags: FlagOption[] = [
  ...(locations.countries || []).map((c) => ({
    code: c.code,
    name: c.name,
    type: 'country' as const,
  })),
  ...(locations.states || []).map((s) => ({
    code: `US-${s.code}`,
    name: s.name,
    type: 'state' as const,
  })),
];
```

**REPLACE WITH:**
```typescript
const flags: FlagOption[] = [
  ...(locations.countries || []).map((c) => ({
    code: c.code,
    name: c.name,
    type: 'country' as const,
  })),
  ...(locations.states || []).map((s) => ({
    code: `US-${s.code}`,
    name: s.name,
    type: 'state' as const,
  })),
  // NEW: Add counties
  ...(locations.counties || []).map((c) => ({
    code: c.code,  // Already in format "US-{stateCode}-{fipsCode}"
    name: c.name,
    type: 'county' as const,
  })),
];
```

---

## 7. PHASE 6: UPDATE FlagGrid COMPONENT

### File: `components/vx2/customization/FlagGrid.tsx`

**REPLACE ENTIRE FILE WITH:**
```typescript
import React, { useState } from 'react';
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
      <div className="text-center py-8" style={{ color: 'rgba(156, 163, 175, 0.8)' }}>
        <p>No flags unlocked yet.</p>
        <p className="text-sm mt-1">Enable location tracking to unlock flags from places you visit.</p>
      </div>
    );
  }

  // Group: countries first, then US states, then US counties
  const countries = flags.filter((f) => f.type === 'country');
  const states = flags.filter((f) => f.type === 'state');
  const counties = flags.filter((f) => f.type === 'county');

  return (
    <div className="space-y-4">
      {countries.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2" style={{ color: 'rgba(209, 213, 219, 0.9)' }}>Countries</h4>
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2 sm:gap-3">
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
          <h4 className="text-sm font-medium mb-2" style={{ color: 'rgba(209, 213, 219, 0.9)' }}>US States</h4>
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2 sm:gap-3">
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
          <h4 className="text-sm font-medium mb-2" style={{ color: 'rgba(209, 213, 219, 0.9)' }}>US Counties</h4>
          {counties.length > 50 && (
            <p className="text-xs text-gray-400 mb-2">
              Showing {counties.length} county badges
            </p>
          )}
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2 sm:gap-3">
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
  const [useFallback, setUseFallback] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onSelect(flag.code)}
      className={cn(
        'relative aspect-[3/2] rounded overflow-hidden border-2 transition-all',
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
      )}
      aria-label={`Select ${flag.name} flag`}
      aria-pressed={isSelected}
    >
      {imgError ? (
        <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{flag.code}</span>
        </div>
      ) : (
        <img
          src={useFallback ? '/badges/default.svg' : getFlagUrl(flag.code)}
          alt={flag.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => {
            if (!useFallback && flag.type === 'county') {
              setUseFallback(true);
            } else {
              setImgError(true);
            }
          }}
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
```

---

## 8. PHASE 7: UPDATE flags.ts

### File: `lib/customization/flags.ts`

**REPLACE ENTIRE FILE WITH:**
```typescript
export function getFlagUrl(code: string): string {
  // County format: "US-{stateCode}-{fipsCode}" (e.g., "US-CA-06037")
  if (/^US-[A-Z]{2}-\d{5}$/.test(code)) {
    return `/badges/county/${code}.svg`;
  }

  // State format: "US-{stateCode}" (e.g., "US-CA")
  if (code.startsWith('US-') && code.length === 5) {
    return `/flags/states/${code.slice(3).toLowerCase()}.svg`;
  }

  // Country format: "{countryCode}" (e.g., "US", "CA")
  return `/flags/countries/${code.toLowerCase()}.svg`;
}

export function parseFlagCode(code: string): { type: 'country' | 'state' | 'county'; code: string } {
  // County format: "US-{stateCode}-{fipsCode}"
  if (/^US-[A-Z]{2}-\d{5}$/.test(code)) {
    return { type: 'county', code };
  }

  // State format: "US-{stateCode}"
  if (code.startsWith('US-') && code.length === 5) {
    return { type: 'state', code: code.slice(3) };
  }

  // Country format
  return { type: 'country', code };
}

export function getFlagDisplayName(code: string): string {
  // County format: "US-{stateCode}-{fipsCode}"
  if (/^US-[A-Z]{2}-\d{5}$/.test(code)) {
    const countyName = COUNTY_NAMES[code];
    if (countyName) {
      const stateCode = code.split('-')[1];
      return `${countyName} County, ${stateCode}`;
    }
    return code;
  }

  // State format: "US-{stateCode}"
  if (code.startsWith('US-') && code.length === 5) {
    return US_STATE_NAMES[code.slice(3)] ?? code;
  }

  // Country format
  return COUNTRY_NAMES[code] ?? code;
}

export const US_STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'Washington D.C.',
};

export const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', CA: 'Canada', MX: 'Mexico', GB: 'United Kingdom',
  DE: 'Germany', FR: 'France', ES: 'Spain', IT: 'Italy', PT: 'Portugal',
  NL: 'Netherlands', BE: 'Belgium', CH: 'Switzerland', AT: 'Austria',
  SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland', IE: 'Ireland',
  PL: 'Poland', CZ: 'Czech Republic', GR: 'Greece', TR: 'Turkey',
  RU: 'Russia', UA: 'Ukraine', JP: 'Japan', CN: 'China', KR: 'South Korea',
  IN: 'India', AU: 'Australia', NZ: 'New Zealand', BR: 'Brazil', AR: 'Argentina',
  CL: 'Chile', CO: 'Colombia', PE: 'Peru', ZA: 'South Africa', EG: 'Egypt',
  NG: 'Nigeria', KE: 'Kenya', IL: 'Israel', AE: 'United Arab Emirates',
  SA: 'Saudi Arabia', SG: 'Singapore', MY: 'Malaysia', TH: 'Thailand',
  VN: 'Vietnam', PH: 'Philippines', ID: 'Indonesia', PK: 'Pakistan',
};

// County names mapping - Generated from counties.json
// Format: { "US-{stateCode}-{fipsCode}": "County Name" }
// This is a subset for common counties - full list in countyData.ts
export const COUNTY_NAMES: Record<string, string> = {
  'US-CA-06037': 'Los Angeles',
  'US-CA-06073': 'San Diego',
  'US-CA-06059': 'Orange',
  'US-CA-06065': 'Riverside',
  'US-CA-06071': 'San Bernardino',
  'US-TX-48201': 'Harris',
  'US-TX-48113': 'Dallas',
  'US-TX-48029': 'Bexar',
  'US-TX-48439': 'Tarrant',
  'US-TX-48453': 'Travis',
  'US-FL-12086': 'Miami-Dade',
  'US-FL-12011': 'Broward',
  'US-FL-12099': 'Palm Beach',
  'US-FL-12057': 'Hillsborough',
  'US-FL-12095': 'Orange',
  'US-NY-36061': 'New York',
  'US-NY-36047': 'Kings',
  'US-NY-36081': 'Queens',
  'US-NY-36005': 'Bronx',
  'US-NY-36085': 'Richmond',
  'US-IL-17031': 'Cook',
  'US-AZ-04013': 'Maricopa',
  'US-PA-42101': 'Philadelphia',
  'US-WA-53033': 'King',
  'US-NV-32003': 'Clark',
  'US-GA-13121': 'Fulton',
  'US-MA-25025': 'Suffolk',
  'US-CO-08031': 'Denver',
  'US-MI-26163': 'Wayne',
  'US-OH-39035': 'Cuyahoga',
  // Add more as needed - full list loaded from countyData.ts
};
```

---

## 9. PHASE 8: COUNTY DATA FILES

### CREATE NEW FILE: `lib/customization/countyData.ts`

```typescript
/**
 * County Data Service
 *
 * Provides lookup functions for county FIPS codes and names.
 * Data sourced from US Census Bureau.
 */

// County data structure: { stateCode: { countyName: fipsCode } }
// This is a subset - full data should be loaded from JSON file
const COUNTY_FIPS_MAP: Record<string, Record<string, string>> = {
  'CA': {
    'Los Angeles': '06037',
    'San Diego': '06073',
    'Orange': '06059',
    'Riverside': '06065',
    'San Bernardino': '06071',
    'Santa Clara': '06085',
    'Alameda': '06001',
    'Sacramento': '06067',
    'Contra Costa': '06013',
    'Fresno': '06019',
    'San Francisco': '06075',
  },
  'TX': {
    'Harris': '48201',
    'Dallas': '48113',
    'Tarrant': '48439',
    'Bexar': '48029',
    'Travis': '48453',
    'Collin': '48085',
    'Hidalgo': '48215',
    'El Paso': '48141',
    'Denton': '48121',
    'Fort Bend': '48157',
  },
  'FL': {
    'Miami-Dade': '12086',
    'Broward': '12011',
    'Palm Beach': '12099',
    'Hillsborough': '12057',
    'Orange': '12095',
    'Pinellas': '12103',
    'Duval': '12031',
    'Lee': '12071',
    'Polk': '12105',
    'Brevard': '12009',
  },
  'NY': {
    'New York': '36061',
    'Kings': '36047',
    'Queens': '36081',
    'Bronx': '36005',
    'Richmond': '36085',
    'Suffolk': '36103',
    'Nassau': '36059',
    'Westchester': '36119',
    'Erie': '36029',
    'Monroe': '36055',
  },
  'IL': {
    'Cook': '17031',
    'DuPage': '17043',
    'Lake': '17097',
    'Will': '17197',
    'Kane': '17089',
  },
  'PA': {
    'Philadelphia': '42101',
    'Allegheny': '42003',
    'Montgomery': '42091',
    'Bucks': '42017',
    'Delaware': '42045',
  },
  'AZ': {
    'Maricopa': '04013',
    'Pima': '04019',
    'Pinal': '04021',
    'Yavapai': '04025',
    'Mohave': '04015',
  },
  'GA': {
    'Fulton': '13121',
    'Gwinnett': '13135',
    'Cobb': '13067',
    'DeKalb': '13089',
    'Clayton': '13063',
  },
  'WA': {
    'King': '53033',
    'Pierce': '53053',
    'Snohomish': '53061',
    'Spokane': '53063',
    'Clark': '53011',
  },
  'MA': {
    'Suffolk': '25025',
    'Middlesex': '25017',
    'Essex': '25009',
    'Worcester': '25027',
    'Norfolk': '25021',
  },
  'CO': {
    'Denver': '08031',
    'El Paso': '08041',
    'Arapahoe': '08005',
    'Jefferson': '08059',
    'Adams': '08001',
  },
  'NV': {
    'Clark': '32003',
    'Washoe': '32031',
  },
  'OH': {
    'Cuyahoga': '39035',
    'Franklin': '39049',
    'Hamilton': '39061',
    'Summit': '39153',
    'Montgomery': '39113',
  },
  'MI': {
    'Wayne': '26163',
    'Oakland': '26125',
    'Macomb': '26099',
    'Kent': '26081',
    'Genesee': '26049',
  },
  'SC': {
    'Greenville': '45045',
    'Richland': '45079',
    'Charleston': '45019',
    'Horry': '45051',
    'Spartanburg': '45083',
    'Lexington': '45063',
    'York': '45091',
  },
  // Add more states as needed
};

/**
 * Get FIPS code for a county
 *
 * @param stateCode - 2-letter state code (e.g., "CA")
 * @param countyName - County name without "County" suffix (e.g., "Los Angeles")
 * @returns 5-digit FIPS code or null if not found
 */
export function getCountyFipsCode(stateCode: string, countyName: string): string | null {
  const stateCounties = COUNTY_FIPS_MAP[stateCode];
  if (!stateCounties) {
    return null;
  }

  // Try exact match first
  if (stateCounties[countyName]) {
    return stateCounties[countyName];
  }

  // Try case-insensitive match
  const normalizedName = countyName.toLowerCase();
  for (const [name, fips] of Object.entries(stateCounties)) {
    if (name.toLowerCase() === normalizedName) {
      return fips;
    }
  }

  return null;
}

/**
 * Get county name from FIPS code
 *
 * @param stateCode - 2-letter state code
 * @param fipsCode - 5-digit FIPS code
 * @returns County name or null if not found
 */
export function getCountyName(stateCode: string, fipsCode: string): string | null {
  const stateCounties = COUNTY_FIPS_MAP[stateCode];
  if (!stateCounties) {
    return null;
  }

  for (const [name, fips] of Object.entries(stateCounties)) {
    if (fips === fipsCode) {
      return name;
    }
  }

  return null;
}

/**
 * Check if a county exists in our data
 */
export function countyExists(stateCode: string, countyName: string): boolean {
  return getCountyFipsCode(stateCode, countyName) !== null;
}
```

### CREATE DIRECTORY AND DEFAULT BADGE:

Create directory: `public/badges/county/`

Create file: `public/badges/default.svg`
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="95" fill="#E5E7EB" stroke="#9CA3AF" stroke-width="2"/>
  <text x="100" y="105" font-family="Arial, sans-serif" font-size="14" fill="#6B7280" text-anchor="middle">County</text>
  <text x="100" y="125" font-family="Arial, sans-serif" font-size="14" fill="#6B7280" text-anchor="middle">Badge</text>
</svg>
```

---

## 10. PHASE 9: BADGE DELETION FEATURE

### CREATE NEW FILE: `lib/customization/badgeDeletion.ts`

```typescript
/**
 * Badge Deletion Service
 *
 * Allows users to delete county badges.
 * Only counties can be deleted, not countries or states.
 * Deleted badges can be re-earned by visiting the location again.
 */

import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserLocations, LocationRecord } from './types';

/**
 * Delete a county badge from user's location history
 *
 * @param userId - User ID
 * @param countyCode - County code to delete (format: "US-{stateCode}-{fipsCode}")
 */
export async function deleteCountyBadge(
  userId: string,
  countyCode: string
): Promise<void> {
  if (!db) {
    throw new Error('Firebase db not initialized');
  }

  // Validate county code format
  if (!/^US-[A-Z]{2}-\d{5}$/.test(countyCode)) {
    throw new Error('Invalid county code format');
  }

  const docRef = doc(db, 'userLocations', userId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return; // Nothing to delete
  }

  const data = docSnap.data() as UserLocations;
  const counties = data.counties || [];

  // Remove county from array
  const updatedCounties = counties.filter(c => c.code !== countyCode);

  // Only update if something was actually removed
  if (updatedCounties.length === counties.length) {
    return; // County not found, nothing to delete
  }

  await updateDoc(docRef, {
    counties: updatedCounties,
    updatedAt: serverTimestamp()
  });
}

/**
 * Restore a deleted county badge (for undo functionality)
 *
 * @param userId - User ID
 * @param countyCode - County code to restore
 * @param countyName - County name
 */
export async function restoreCountyBadge(
  userId: string,
  countyCode: string,
  countyName: string
): Promise<void> {
  if (!db) {
    throw new Error('Firebase db not initialized');
  }

  // Validate county code format
  if (!/^US-[A-Z]{2}-\d{5}$/.test(countyCode)) {
    throw new Error('Invalid county code format');
  }

  const docRef = doc(db, 'userLocations', userId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('User locations document not found');
  }

  const data = docSnap.data() as UserLocations;
  const counties = data.counties || [];

  // Check if county already exists
  const exists = counties.some(c => c.code === countyCode);
  if (exists) {
    return; // Already exists, nothing to restore
  }

  // Re-add county with current timestamp
  const now = Timestamp.now();
  const newCounty: LocationRecord = {
    code: countyCode,
    name: countyName,
    firstSeen: now,
    lastSeen: now,
    visitCount: 1,
  };

  await updateDoc(docRef, {
    counties: [...counties, newCounty],
    updatedAt: serverTimestamp()
  });
}
```

---

## 11. PHASE 10: ADDRESS GEOCODING FOR SIGNUP

### CREATE NEW FILE: `lib/customization/addressGeocoding.ts`

```typescript
/**
 * Address Geocoding Service
 *
 * Converts street addresses to county information.
 * Used during signup to detect user's county from their address.
 */

import type { CountyInfo } from './types';
import { generateCountyCode } from './countyDetection';
import { getCountyFipsCode } from './countyData';

export interface GeocodeResult {
  countyCode: string;
  countyName: string;
  stateCode: string;
  fipsCode: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Geocode an address to get county information
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 *
 * @param address - Full address string
 * @param countryCode - Country code (only US supported)
 * @returns GeocodeResult or null if geocoding failed
 */
export async function geocodeAddressToCounty(
  address: string,
  countryCode: string
): Promise<GeocodeResult | null> {
  // Only support US addresses
  if (countryCode !== 'US') {
    return null;
  }

  if (!address || address.trim().length < 5) {
    return null;
  }

  try {
    // Use Nominatim for free geocoding
    const encodedAddress = encodeURIComponent(address + ', United States');
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&addressdetails=1&limit=1`,
      {
        headers: {
          'User-Agent': 'BestballSite/1.0' // Required by Nominatim
        }
      }
    );

    if (!response.ok) {
      console.warn('Nominatim geocoding failed:', response.status);
      return null;
    }

    const results = await response.json();

    if (!results || results.length === 0) {
      return null;
    }

    const result = results[0];
    const addressDetails = result.address;

    if (!addressDetails) {
      return null;
    }

    // Extract county - Nominatim uses 'county' field
    let countyName = addressDetails.county;
    if (!countyName) {
      return null;
    }

    // Remove "County" suffix if present
    countyName = countyName.replace(/ County$/i, '').trim();

    // Extract state code
    const stateCode = addressDetails.ISO3166_2_lvl4?.split('-')[1];
    if (!stateCode || !/^[A-Z]{2}$/.test(stateCode)) {
      return null;
    }

    // Look up FIPS code
    const fipsCode = getCountyFipsCode(stateCode, countyName);
    if (!fipsCode) {
      console.warn(`Could not find FIPS code for ${countyName}, ${stateCode}`);
      return null;
    }

    return {
      countyCode: generateCountyCode(stateCode, fipsCode),
      countyName,
      stateCode,
      fipsCode,
      confidence: 'high',
    };
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}
```

---

## 12. PHASE 11: DRAFT LOCATION TRACKING

### CREATE NEW FILE: `lib/customization/draftLocationTracking.ts`

```typescript
/**
 * Draft Location Tracking Service
 *
 * Tracks user location during drafts for badge unlocking.
 * - Records location at draft start (both fast and slow drafts)
 * - Periodically updates location during slow drafts (every 5 minutes)
 */

import { recordLocationVisit } from './geolocation';
import { detectLocation } from './geolocation';
import { detectCountyFromLocation } from './countyDetection';

export interface DraftLocationContext {
  roomId: string;
  userId: string;
  draftType: 'fast' | 'slow';
  startedAt: number;
}

// Module-level state for tracking
let activeDraftTracking: {
  watchId: number | null;
  context: DraftLocationContext | null;
  lastRecordedAt: number;
} = {
  watchId: null,
  context: null,
  lastRecordedAt: 0
};

const LOCATION_UPDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Record location at draft start
 * Called for both fast and slow drafts
 */
export async function recordDraftStartLocation(
  userId: string,
  roomId: string,
  isFastDraft: boolean
): Promise<void> {
  try {
    const location = await detectLocation();
    if (!location.country) {
      return;
    }

    // Try to detect county
    let county = null;
    try {
      county = await detectCountyFromLocation(location);
    } catch (error) {
      console.warn('Failed to detect county at draft start:', error);
    }

    // Record location for badge unlocking
    await recordLocationVisit(userId, location, county?.code, county?.name);

    console.log(`Recorded draft start location for room ${roomId}`, {
      country: location.country.code,
      state: location.state?.code,
      county: county?.code,
      draftType: isFastDraft ? 'fast' : 'slow'
    });
  } catch (error) {
    console.error('Error recording draft start location:', error);
  }
}

/**
 * Start periodic location tracking for slow drafts
 * Only tracks slow drafts since fast drafts are too short
 */
export function startDraftLocationTracking(context: DraftLocationContext): void {
  // Only track slow drafts
  if (context.draftType === 'fast') {
    return;
  }

  // Stop any existing tracking
  stopDraftLocationTracking();

  activeDraftTracking.context = context;
  activeDraftTracking.lastRecordedAt = Date.now();

  // Use browser geolocation if available
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    activeDraftTracking.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();

        // Only record if enough time has passed
        if (now - activeDraftTracking.lastRecordedAt < LOCATION_UPDATE_INTERVAL_MS) {
          return;
        }

        if (!activeDraftTracking.context) {
          return;
        }

        try {
          const { detectCountyFromCoordinates } = await import('./countyDetection');
          const county = await detectCountyFromCoordinates(
            position.coords.latitude,
            position.coords.longitude
          );

          // Import detectLocation to get full location info
          const { detectLocation } = await import('./geolocation');
          const location = await detectLocation();

          if (location.country) {
            await recordLocationVisit(
              activeDraftTracking.context.userId,
              location,
              county?.code,
              county?.name
            );

            activeDraftTracking.lastRecordedAt = now;

            console.log('Recorded periodic draft location', {
              roomId: activeDraftTracking.context.roomId,
              county: county?.code
            });
          }
        } catch (error) {
          console.warn('Error recording periodic draft location:', error);
        }
      },
      (error) => {
        console.warn('Draft location tracking error:', error.message);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: LOCATION_UPDATE_INTERVAL_MS
      }
    );
  }
}

/**
 * Stop location tracking
 * Called when draft ends or user leaves draft room
 */
export function stopDraftLocationTracking(): void {
  if (activeDraftTracking.watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(activeDraftTracking.watchId);
  }

  activeDraftTracking = {
    watchId: null,
    context: null,
    lastRecordedAt: 0
  };
}
```

---

## 13. TESTING CHECKLIST

After implementing all phases, verify the following:

### Unit Tests

1. `isValidCountyCode('US-CA-06037')` returns `true`
2. `isValidCountyCode('US-CA')` returns `false`
3. `isValidCountyCode('CA-06037')` returns `false`
4. `generateCountyCode('CA', '06037')` returns `'US-CA-06037'`
5. `parseCountyCode('US-CA-06037')` returns `{ stateCode: 'CA', fipsCode: '06037' }`
6. `getFlagUrl('US-CA-06037')` returns `'/badges/county/US-CA-06037.svg'`
7. `getFlagUrl('US-CA')` returns `'/flags/states/ca.svg'`
8. `getFlagUrl('US')` returns `'/flags/countries/us.svg'`

### Integration Tests

1. New user signup records country, state, AND county (if detectable)
2. `userLocations` document has `counties` array
3. Counties appear in FlagGrid under "US Counties" section
4. Missing county images fall back to `/badges/default.svg`
5. Dev flags include test counties in development mode

### Manual Tests

1. Sign up with a US address - verify county badge appears
2. Select a county badge as background - verify it displays in draft room
3. Delete a county badge - verify it disappears
4. Undo deletion within 60 seconds - verify badge reappears
5. Existing users without counties array don't break

---

## FILE SUMMARY

### Files to MODIFY:
1. `lib/customization/types.ts` - Add counties array and county type
2. `lib/customization/geolocation.ts` - Extend recordLocationVisit
3. `lib/customization/flags.ts` - Handle county URLs and names
4. `components/vx2/customization/FlagGrid.tsx` - Display counties section
5. `components/vx2/customization/hooks/useCustomization.ts` - Include counties in flags
6. `pages/api/auth/signup.js` - Detect county during signup
7. `components/vx2/auth/context/AuthContext.tsx` - Detect county during signup

### Files to CREATE:
1. `lib/customization/countyDetection.ts` - County detection service
2. `lib/customization/countyData.ts` - County FIPS data
3. `lib/customization/badgeDeletion.ts` - Badge deletion service
4. `lib/customization/addressGeocoding.ts` - Address geocoding
5. `lib/customization/draftLocationTracking.ts` - Draft location tracking
6. `public/badges/default.svg` - Default county badge
7. `public/badges/county/` - Directory for county badge images

---

## IMPORTANT NOTES

1. **DO NOT** modify any code not specified in this document
2. **DO NOT** make assumptions about file locations - use the exact paths provided
3. **DO NOT** add features not described here
4. **COPY** code blocks exactly as written
5. **PRESERVE** all existing functionality when modifying files
6. County detection may return null - this is expected and should not break anything
7. Always handle the case where `counties` array is undefined (backward compatibility)
