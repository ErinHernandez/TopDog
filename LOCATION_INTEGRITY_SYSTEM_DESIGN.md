# Location & Integrity Data Collection System

**Project:** Bestball Site
**Date:** January 2026
**Status:** Design Complete - Ready for Implementation
**Target:** AI Agent / LLM in Cursor

---

## EXECUTIVE SUMMARY

This document specifies a new unified location data collection system that serves three purposes:

1. **User Research** - Where do users draft from? Geographic patterns.
2. **Integrity/Fraud Detection** - Are users co-located? Behavioral anomalies when together.
3. **County Badges** - Derived from location data collected during drafts.

### Key Decisions Made

- Store precise lat/lng coordinates (user already consents to location for draft entry)
- Record location with **every pick** (not just draft entry)
- Flag `within50ft` and `sameIp` as arrays of userIds (who specifically)
- Total annual cost: ~$92 (trivial for $15M tournament)
- Deprecate existing `lib/location/` and `lib/customization/geolocation.ts` systems
- Build fresh - do not reuse existing code

### What This System Does NOT Do

- Block users for being co-located (friends draft together, that's fine)
- Automatically flag collusion (algorithm does not exist yet)
- Backfill historical data (starts fresh from deployment)

---

## TABLE OF CONTENTS

1. [Data Architecture](#1-data-architecture)
2. [Firestore Schema](#2-firestore-schema)
3. [Core Service: LocationIntegrityService](#3-core-service-locationintegrityservice)
4. [Integration Points](#4-integration-points)
5. [County Badge Derivation](#5-county-badge-derivation)
6. [County Data & Images](#6-county-data--images)
7. [Systems to Deprecate](#7-systems-to-deprecate)
8. [Implementation Phases](#8-implementation-phases)
9. [Future: Collusion Detection Algorithm](#9-future-collusion-detection-algorithm)
10. [Testing Checklist](#10-testing-checklist)

---

## 1. DATA ARCHITECTURE

### Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PICK SUBMISSION                          │
│                                                                 │
│  User makes pick → Get location → Compare to other drafters    │
│                          ↓                                      │
│              ┌───────────────────────┐                         │
│              │   pickLocations/{id}   │                         │
│              │   - lat, lng, ip       │                         │
│              │   - countyCode         │                         │
│              │   - within50ft: []     │                         │
│              │   - sameIp: []         │                         │
│              └───────────────────────┘                         │
│                          ↓                                      │
│              ┌───────────────────────┐                         │
│              │  userBadges/{userId}   │  (aggregated async)    │
│              │   - counties: []       │                         │
│              │   - countries: []      │                         │
│              │   - states: []         │                         │
│              └───────────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Pick Submission** - User submits pick via existing pick API
2. **Location Capture** - Get current lat/lng from browser Geolocation API
3. **County Lookup** - Reverse geocode to get county FIPS code
4. **Proximity Check** - Read other drafters' latest locations, compute flags
5. **Write Pick Location** - Single document write with all data
6. **Badge Update** - Async process updates `userBadges` if new county

---

## 2. FIRESTORE SCHEMA

### Collection: `pickLocations`

**Document ID:** `{draftId}_{odcsickNumber}_{userId}`

```typescript
interface PickLocation {
  // === IDENTIFIERS ===
  id: string;                    // Document ID
  draftId: string;               // Draft room ID
  odcsickNumber: number;            // Overall pick number in draft (1-228)
  userId: string;                // User who made the pick

  // === TIMESTAMP ===
  timestamp: Timestamp;          // When pick was made

  // === ABSOLUTE LOCATION (Research + Badges) ===
  lat: number;                   // Latitude (6 decimal places)
  lng: number;                   // Longitude (6 decimal places)
  accuracy: number;              // GPS accuracy in meters
  ipAddress: string;             // User's IP address
  countyCode: string | null;     // "US-CA-06037" or null if outside US/detection failed
  countryCode: string;           // "US", "CA", etc.
  stateCode: string | null;      // "CA", "NY", etc. (US only)

  // === RELATIVE LOCATION (Integrity) ===
  within50ft: string[];          // UserIds of other drafters within 50ft
  sameIp: string[];              // UserIds of other drafters with same IP

  // === DEVICE ===
  deviceId: string;              // Persistent device identifier

  // === METADATA ===
  createdAt: Timestamp;          // Server timestamp
}
```

**Indexes Required:**
```
- draftId + odcsickNumber (for draft reconstruction)
- odcsaftId + userId (for user's picks in a draft)
- userId + timestamp (for user history)
- userId + countyCode (for badge aggregation)
- countyCode + timestamp (for geographic research)
- within50ft (array-contains) + timestamp (for co-location queries)
- sameIp (array-contains) + timestamp (for IP sharing queries)
```

### Collection: `userBadges`

**Document ID:** `{userId}`

```typescript
interface UserBadges {
  userId: string;

  // === LOCATION BADGES ===
  countries: BadgeRecord[];
  states: BadgeRecord[];
  counties: BadgeRecord[];

  // === METADATA ===
  updatedAt: Timestamp;
  createdAt: Timestamp;
}

interface BadgeRecord {
  code: string;              // "US", "US-CA", "US-CA-06037"
  name: string;              // "United States", "California", "Los Angeles"
  firstEarned: Timestamp;    // First time user was detected here
  lastSeen: Timestamp;       // Most recent detection
  pickCount: number;         // How many picks made from this location
}
```

### Collection: `draftLocationState` (Ephemeral)

**Document ID:** `{draftId}`

Used during active drafts to track current locations without querying pickLocations.

```typescript
interface DraftLocationState {
  draftId: string;

  // Map of userId -> their latest location
  locations: {
    [userId: string]: {
      lat: number;
      lng: number;
      ipAddress: string;
      lastPickNumber: number;
      timestamp: Timestamp;
    }
  };

  updatedAt: Timestamp;
}
```

This document is:
- Created when draft starts
- Updated with each pick
- Deleted when draft completes (or after 24h TTL)

---

## 3. CORE SERVICE: LocationIntegrityService

### File: `lib/integrity/LocationIntegrityService.ts`

```typescript
/**
 * LocationIntegrityService
 *
 * Unified location data collection for:
 * - User research (geographic patterns)
 * - Integrity analysis (co-location detection)
 * - County badges (derived from pick locations)
 *
 * This service REPLACES:
 * - lib/location/* (deprecated)
 * - lib/customization/geolocation.ts (deprecated)
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// === TYPES ===

export interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  ipAddress: string;
}

export interface PickLocationData {
  draftId: string;
  pickNumber: number;
  userId: string;
  location: LocationData;
  deviceId: string;
}

export interface PickLocationRecord {
  id: string;
  draftId: string;
  pickNumber: number;
  userId: string;
  timestamp: Timestamp;
  lat: number;
  lng: number;
  accuracy: number;
  ipAddress: string;
  countyCode: string | null;
  countryCode: string;
  stateCode: string | null;
  within50ft: string[];
  sameIp: string[];
  deviceId: string;
  createdAt: Timestamp;
}

export interface ProximityFlags {
  within50ft: string[];
  sameIp: string[];
}

// === CONSTANTS ===

const FIFTY_FEET_IN_METERS = 15.24;
const EARTH_RADIUS_METERS = 6371000;

// === MAIN SERVICE ===

export class LocationIntegrityService {

  /**
   * Record location data for a pick
   * Called on every pick submission
   */
  async recordPickLocation(data: PickLocationData): Promise<PickLocationRecord> {
    const { draftId, pickNumber, userId, location, deviceId } = data;

    // 1. Reverse geocode to get county/state/country
    const geoData = await this.reverseGeocode(location.lat, location.lng);

    // 2. Get other drafters' locations and compute proximity flags
    const proximityFlags = await this.computeProximityFlags(
      draftId,
      userId,
      location
    );

    // 3. Update draft location state (for next proximity check)
    await this.updateDraftLocationState(draftId, userId, location, pickNumber);

    // 4. Build and write pick location document
    const docId = `${draftId}_${pickNumber}_${userId}`;
    const record: PickLocationRecord = {
      id: docId,
      draftId,
      pickNumber,
      userId,
      timestamp: Timestamp.now(),
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy,
      ipAddress: location.ipAddress,
      countyCode: geoData.countyCode,
      countryCode: geoData.countryCode,
      stateCode: geoData.stateCode,
      within50ft: proximityFlags.within50ft,
      sameIp: proximityFlags.sameIp,
      deviceId,
      createdAt: Timestamp.now(),
    };

    await setDoc(doc(db, 'pickLocations', docId), record);

    // 5. Queue badge update (async, non-blocking)
    this.queueBadgeUpdate(userId, geoData).catch(console.error);

    return record;
  }

  /**
   * Get current location from browser
   */
  async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Get IP address
          const ipAddress = await this.getIpAddress();

          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            ipAddress,
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  /**
   * Reverse geocode coordinates to get county/state/country
   */
  private async reverseGeocode(lat: number, lng: number): Promise<{
    countyCode: string | null;
    countryCode: string;
    stateCode: string | null;
  }> {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );

      if (!response.ok) {
        throw new Error(`Geocode failed: ${response.status}`);
      }

      const data = await response.json();

      const countryCode = data.countryCode || 'UNKNOWN';
      let stateCode: string | null = null;
      let countyCode: string | null = null;

      // Extract state code for US
      if (countryCode === 'US' && data.principalSubdivisionCode) {
        stateCode = data.principalSubdivisionCode.replace('US-', '');
      }

      // Extract county for US
      if (countryCode === 'US' && stateCode) {
        const adminLevels = data.localityInfo?.administrative || [];
        const countyLevel = adminLevels.find((level: any) =>
          level.adminLevel === 2 ||
          level.description?.toLowerCase().includes('county')
        );

        if (countyLevel?.name) {
          const countyName = countyLevel.name.replace(/ County$/i, '').trim();
          const fipsCode = await this.lookupCountyFips(stateCode, countyName);
          if (fipsCode) {
            countyCode = `US-${stateCode}-${fipsCode}`;
          }
        }
      }

      return { countyCode, countryCode, stateCode };
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return { countyCode: null, countryCode: 'UNKNOWN', stateCode: null };
    }
  }

  /**
   * Compute proximity flags by comparing to other drafters
   */
  private async computeProximityFlags(
    draftId: string,
    currentUserId: string,
    currentLocation: LocationData
  ): Promise<ProximityFlags> {
    const within50ft: string[] = [];
    const sameIp: string[] = [];

    // Get draft location state
    const stateRef = doc(db, 'draftLocationState', draftId);
    const stateSnap = await getDoc(stateRef);

    if (!stateSnap.exists()) {
      return { within50ft, sameIp };
    }

    const state = stateSnap.data();
    const locations = state.locations || {};

    // Compare against each other drafter
    for (const [userId, locData] of Object.entries(locations)) {
      if (userId === currentUserId) continue;

      const otherLoc = locData as { lat: number; lng: number; ipAddress: string };

      // Check distance
      const distance = this.calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        otherLoc.lat,
        otherLoc.lng
      );

      if (distance <= FIFTY_FEET_IN_METERS) {
        within50ft.push(userId);
      }

      // Check IP
      if (currentLocation.ipAddress === otherLoc.ipAddress) {
        sameIp.push(userId);
      }
    }

    return { within50ft, sameIp };
  }

  /**
   * Update ephemeral draft location state
   */
  private async updateDraftLocationState(
    draftId: string,
    userId: string,
    location: LocationData,
    pickNumber: number
  ): Promise<void> {
    const stateRef = doc(db, 'draftLocationState', draftId);

    await runTransaction(db, async (transaction) => {
      const stateSnap = await transaction.get(stateRef);

      if (!stateSnap.exists()) {
        // Create new state document
        transaction.set(stateRef, {
          draftId,
          locations: {
            [userId]: {
              lat: location.lat,
              lng: location.lng,
              ipAddress: location.ipAddress,
              lastPickNumber: pickNumber,
              timestamp: Timestamp.now(),
            }
          },
          updatedAt: serverTimestamp(),
        });
      } else {
        // Update existing
        transaction.update(stateRef, {
          [`locations.${userId}`]: {
            lat: location.lat,
            lng: location.lng,
            ipAddress: location.ipAddress,
            lastPickNumber: pickNumber,
            timestamp: Timestamp.now(),
          },
          updatedAt: serverTimestamp(),
        });
      }
    });
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_METERS * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get user's IP address
   */
  private async getIpAddress(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'UNKNOWN';
    } catch {
      return 'UNKNOWN';
    }
  }

  /**
   * Look up county FIPS code from state and county name
   */
  private async lookupCountyFips(stateCode: string, countyName: string): Promise<string | null> {
    // Import from county data module
    const { getCountyFipsCode } = await import('./countyData');
    return getCountyFipsCode(stateCode, countyName);
  }

  /**
   * Queue badge update (non-blocking)
   */
  private async queueBadgeUpdate(
    userId: string,
    geoData: { countyCode: string | null; countryCode: string; stateCode: string | null }
  ): Promise<void> {
    const badgeRef = doc(db, 'userBadges', userId);

    await runTransaction(db, async (transaction) => {
      const badgeSnap = await transaction.get(badgeRef);
      const now = Timestamp.now();

      let badges: {
        countries: any[];
        states: any[];
        counties: any[];
      };

      if (!badgeSnap.exists()) {
        badges = { countries: [], states: [], counties: [] };
      } else {
        const data = badgeSnap.data();
        badges = {
          countries: data.countries || [],
          states: data.states || [],
          counties: data.counties || [],
        };
      }

      // Update country badge
      if (geoData.countryCode && geoData.countryCode !== 'UNKNOWN') {
        const countryIdx = badges.countries.findIndex(b => b.code === geoData.countryCode);
        if (countryIdx >= 0) {
          badges.countries[countryIdx].lastSeen = now;
          badges.countries[countryIdx].pickCount++;
        } else {
          badges.countries.push({
            code: geoData.countryCode,
            name: await this.getCountryName(geoData.countryCode),
            firstEarned: now,
            lastSeen: now,
            pickCount: 1,
          });
        }
      }

      // Update state badge (US only)
      if (geoData.stateCode) {
        const stateCode = `US-${geoData.stateCode}`;
        const stateIdx = badges.states.findIndex(b => b.code === stateCode);
        if (stateIdx >= 0) {
          badges.states[stateIdx].lastSeen = now;
          badges.states[stateIdx].pickCount++;
        } else {
          badges.states.push({
            code: stateCode,
            name: await this.getStateName(geoData.stateCode),
            firstEarned: now,
            lastSeen: now,
            pickCount: 1,
          });
        }
      }

      // Update county badge (US only)
      if (geoData.countyCode) {
        const countyIdx = badges.counties.findIndex(b => b.code === geoData.countyCode);
        if (countyIdx >= 0) {
          badges.counties[countyIdx].lastSeen = now;
          badges.counties[countyIdx].pickCount++;
        } else {
          badges.counties.push({
            code: geoData.countyCode,
            name: await this.getCountyName(geoData.countyCode),
            firstEarned: now,
            lastSeen: now,
            pickCount: 1,
          });
        }
      }

      transaction.set(badgeRef, {
        userId,
        countries: badges.countries,
        states: badges.states,
        counties: badges.counties,
        updatedAt: now,
        createdAt: badgeSnap.exists() ? badgeSnap.data().createdAt : now,
      });
    });
  }

  /**
   * Get country name from code
   */
  private async getCountryName(code: string): Promise<string> {
    const { COUNTRY_NAMES } = await import('./locationNames');
    return COUNTRY_NAMES[code] || code;
  }

  /**
   * Get state name from code
   */
  private async getStateName(code: string): Promise<string> {
    const { US_STATE_NAMES } = await import('./locationNames');
    return US_STATE_NAMES[code] || code;
  }

  /**
   * Get county name from code
   */
  private async getCountyName(code: string): Promise<string> {
    const { getCountyNameFromCode } = await import('./countyData');
    return getCountyNameFromCode(code) || code;
  }

  /**
   * Clean up draft location state after draft completes
   */
  async cleanupDraftState(draftId: string): Promise<void> {
    const stateRef = doc(db, 'draftLocationState', draftId);
    await deleteDoc(stateRef);
  }
}

// Singleton export
export const locationIntegrityService = new LocationIntegrityService();
```

---

## 4. INTEGRATION POINTS

### Pick Submission API

**File:** Wherever pick submission is handled (e.g., `pages/api/draft/submit-pick.ts`)

**Add to pick submission flow:**

```typescript
import { locationIntegrityService } from '@/lib/integrity/LocationIntegrityService';

// In pick submission handler, AFTER validating the pick:

async function handlePickSubmission(req, res) {
  const { draftId, pickNumber, userId, playerId, deviceId } = req.body;

  // ... existing pick validation and recording ...

  // Record location data (non-blocking, but await for integrity)
  try {
    const location = await locationIntegrityService.getCurrentLocation();
    await locationIntegrityService.recordPickLocation({
      draftId,
      pickNumber,
      userId,
      location,
      deviceId,
    });
  } catch (locationError) {
    // Log but don't fail the pick
    console.error('Failed to record pick location:', locationError);
  }

  // ... rest of pick handling ...
}
```

**IMPORTANT:** Location recording should NOT block pick submission. If location fails, the pick still goes through.

### Draft Completion

**Add cleanup call when draft ends:**

```typescript
import { locationIntegrityService } from '@/lib/integrity/LocationIntegrityService';

async function handleDraftComplete(draftId: string) {
  // ... existing completion logic ...

  // Clean up ephemeral location state
  await locationIntegrityService.cleanupDraftState(draftId);
}
```

### Client-Side Location Capture

The `getCurrentLocation()` method uses browser Geolocation API, which only works client-side.

**Option A: Capture on client, send with pick**
```typescript
// In draft room component
const handleMakePick = async (playerId: string) => {
  const location = await locationIntegrityService.getCurrentLocation();

  await submitPick({
    draftId,
    pickNumber,
    playerId,
    location, // Send location with pick
    deviceId,
  });
};
```

**Option B: Capture on client, API fetches server-side**
```typescript
// API gets IP from request headers
const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

// Client sends lat/lng only
const { lat, lng, accuracy } = req.body.location;
```

**Recommendation:** Option A is simpler and more accurate for IP.

---

## 5. COUNTY BADGE DERIVATION

Badges are automatically updated by `LocationIntegrityService.queueBadgeUpdate()` on each pick.

### Reading Badges for Display

**File:** `lib/integrity/badgeService.ts`

```typescript
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface UserBadges {
  countries: BadgeRecord[];
  states: BadgeRecord[];
  counties: BadgeRecord[];
}

export interface BadgeRecord {
  code: string;
  name: string;
  firstEarned: Timestamp;
  lastSeen: Timestamp;
  pickCount: number;
}

export async function getUserBadges(userId: string): Promise<UserBadges> {
  const badgeRef = doc(db, 'userBadges', userId);
  const badgeSnap = await getDoc(badgeRef);

  if (!badgeSnap.exists()) {
    return { countries: [], states: [], counties: [] };
  }

  const data = badgeSnap.data();
  return {
    countries: data.countries || [],
    states: data.states || [],
    counties: data.counties || [],
  };
}

export async function deleteCountyBadge(userId: string, countyCode: string): Promise<void> {
  const badgeRef = doc(db, 'userBadges', userId);
  const badgeSnap = await getDoc(badgeRef);

  if (!badgeSnap.exists()) return;

  const data = badgeSnap.data();
  const counties = (data.counties || []).filter(c => c.code !== countyCode);

  await updateDoc(badgeRef, {
    counties,
    updatedAt: serverTimestamp(),
  });
}
```

### Badge Display Component

Use existing `FlagGrid` component (updated per original plan) to display badges from `userBadges` collection instead of `userLocations`.

---

## 6. COUNTY DATA & IMAGES

### County FIPS Lookup

**File:** `lib/integrity/countyData.ts`

```typescript
/**
 * County FIPS code lookup
 *
 * Maps state + county name to 5-digit FIPS code.
 * Data sourced from US Census Bureau.
 */

// Structure: { stateCode: { countyName: fipsCode } }
const COUNTY_FIPS: Record<string, Record<string, string>> = {
  'AL': {
    'Autauga': '01001',
    'Baldwin': '01003',
    'Barbour': '01005',
    // ... all 67 Alabama counties
  },
  'AK': {
    'Aleutians East': '02013',
    'Aleutians West': '02016',
    'Anchorage': '02020',
    // ... all Alaska boroughs/census areas
  },
  // ... all 50 states + DC
  // Full data: 3,143 counties
};

// Reverse lookup: { "US-CA-06037": "Los Angeles" }
const COUNTY_NAMES: Record<string, string> = {};

// Build reverse lookup on module load
for (const [stateCode, counties] of Object.entries(COUNTY_FIPS)) {
  for (const [countyName, fipsCode] of Object.entries(counties)) {
    COUNTY_NAMES[`US-${stateCode}-${fipsCode}`] = countyName;
  }
}

export function getCountyFipsCode(stateCode: string, countyName: string): string | null {
  const stateCounties = COUNTY_FIPS[stateCode];
  if (!stateCounties) return null;

  // Try exact match
  if (stateCounties[countyName]) {
    return stateCounties[countyName];
  }

  // Try case-insensitive
  const normalized = countyName.toLowerCase();
  for (const [name, fips] of Object.entries(stateCounties)) {
    if (name.toLowerCase() === normalized) {
      return fips;
    }
  }

  return null;
}

export function getCountyNameFromCode(code: string): string | null {
  return COUNTY_NAMES[code] || null;
}

export function isValidCountyCode(code: string): boolean {
  return /^US-[A-Z]{2}-\d{5}$/.test(code) && COUNTY_NAMES[code] !== undefined;
}
```

### County Badge Images

**Directory:** `public/badges/county/`

**Naming:** `{countyCode}.svg` (e.g., `US-CA-06037.svg`)

**Fallback:** `public/badges/default.svg`

**Source options for 3,143 county images:**
1. US Census Bureau / Government sources (public domain)
2. Wikipedia Commons (check licenses)
3. Programmatically generated (county name + state on generic badge template)

**Recommendation:** Start with programmatic generation, replace with real seals over time.

### Location Names

**File:** `lib/integrity/locationNames.ts`

```typescript
export const COUNTRY_NAMES: Record<string, string> = {
  'US': 'United States',
  'CA': 'Canada',
  'MX': 'Mexico',
  'GB': 'United Kingdom',
  // ... etc
};

export const US_STATE_NAMES: Record<string, string> = {
  'AL': 'Alabama',
  'AK': 'Alaska',
  'AZ': 'Arizona',
  // ... all 50 + DC
};
```

---

## 7. SYSTEMS TO DEPRECATE

After the new system is deployed and verified, deprecate:

### Files to Remove

```
lib/location/
├── locationService.ts      # DEPRECATED
├── securityService.ts      # DEPRECATED (security logic moves to integrity queries)
├── geolocationProvider.ts  # DEPRECATED
├── consentManager.ts       # DEPRECATED (consent is mandatory for draft entry)
├── types.ts                # DEPRECATED
└── index.ts                # DEPRECATED

lib/customization/
├── geolocation.ts          # DEPRECATED
└── (keep types.ts, flags.ts - update to use userBadges)

components/vx2/location/
├── LocationConsentModal.tsx      # KEEP but simplify
├── LocationSettingsSection.tsx   # UPDATE to read from userBadges
└── hooks/
    ├── useLocationTracking.ts    # DEPRECATED
    └── useLocationConsent.ts     # DEPRECATED (consent is mandatory)
```

### Firestore Collections to Deprecate

```
userLocations/{userId}     # DEPRECATED - replaced by userBadges + pickLocations
```

**Migration:** No backfill. New system starts fresh. Old `userLocations` can remain for historical reference but is no longer written to.

---

## 8. IMPLEMENTATION PHASES

### Phase 1: Core Infrastructure (4-6 hours)

1. Create `lib/integrity/` directory
2. Implement `LocationIntegrityService.ts`
3. Implement `countyData.ts` with full FIPS data
4. Implement `locationNames.ts`
5. Implement `badgeService.ts`
6. Create Firestore indexes

### Phase 2: Integration (3-4 hours)

1. Add location recording to pick submission API
2. Add draft state cleanup to draft completion
3. Update client to capture and send location with picks
4. Test end-to-end pick flow

### Phase 3: Badge Display (2-3 hours)

1. Update `FlagGrid` to read from `userBadges`
2. Update `useCustomization` hook to use new badge service
3. Add county section to FlagGrid
4. Test badge display

### Phase 4: Badge Images (4-8 hours)

1. Generate or source 3,143 county badge images
2. Create default fallback badge
3. Upload to `public/badges/county/`
4. Test image loading and fallbacks

### Phase 5: Cleanup (2-3 hours)

1. Remove deprecated files
2. Update imports throughout codebase
3. Test that nothing breaks
4. Document deprecated systems

**Total: 15-24 hours**

---

## 9. FUTURE: COLLUSION DETECTION ALGORITHM

**Status:** NOT IMPLEMENTED - Design only

This section documents requirements for future implementation.

### What We're Tracking

For any pair of users (A, B) who have drafted together:

| Metric | Description |
|--------|-------------|
| `draftsTogether` | Total drafts where both participated |
| `draftsColocated` | Drafts where they were within 50ft at any point |
| `draftsSameIp` | Drafts where they shared IP at any point |
| `picksColocated` | Individual picks where they were within 50ft |
| `picksSameIp` | Individual picks where they shared IP |

### Behavioral Signals to Analyze

When User A and User B are co-located vs not:

1. **Pass Rate on Mutual Targets**
   - Does A pass on players B needs more often when co-located?

2. **Draft Position Exploitation**
   - When A picks before B, does A avoid B's preferred positions?
   - Does this pattern differ when co-located?

3. **Pick Timing**
   - Does pick timing correlate when co-located? (simultaneous decisions)

4. **Value Deviation**
   - Do A's picks deviate from expected value in ways that benefit B?

### Flagging Criteria (TBD)

Potential thresholds (require statistical analysis to validate):

- Difference in pass rate > 20% when co-located vs not
- p-value < 0.05 on behavioral difference
- Minimum sample size: 10+ drafts together

### Implementation Notes

- This requires a batch analysis job, not real-time
- Need baseline "normal" behavior for comparison
- False positives are expensive (accusing innocent users)
- Start with flagging for human review, not automatic action

---

## 10. TESTING CHECKLIST

### Unit Tests

- [ ] `calculateDistance()` returns correct meters for known coordinates
- [ ] `reverseGeocode()` returns county for US coordinates
- [ ] `reverseGeocode()` returns null county for non-US coordinates
- [ ] `lookupCountyFips()` finds correct FIPS for known counties
- [ ] `isValidCountyCode()` validates format correctly
- [ ] Proximity flags correctly identify users within 50ft
- [ ] Proximity flags correctly identify users with same IP

### Integration Tests

- [ ] Pick submission records location data
- [ ] Pick submission computes proximity flags correctly
- [ ] Badge is created on first pick from new location
- [ ] Badge pickCount increments on subsequent picks
- [ ] Draft state is cleaned up after draft completion
- [ ] Missing location doesn't block pick submission

### End-to-End Tests

- [ ] Complete draft with location tracking
- [ ] Verify all picks have location records
- [ ] Verify badges reflect draft locations
- [ ] Verify proximity flags when two test users are "co-located"
- [ ] Verify badge display in UI

### Performance Tests

- [ ] Pick submission latency with location recording
- [ ] Proximity check latency with 12 users in draft
- [ ] Badge update latency

---

## APPENDIX: COST SUMMARY

| Item | One-Time | Annual |
|------|----------|--------|
| Firestore writes (10.8M picks) | $20 | $20 |
| Firestore reads (proximity checks) | $71 | $71 |
| Firestore storage (3.25 GB) | - | $7 |
| Analysis queries (estimated) | - | $65 |
| **Total** | **$91** | **$163** |

Badge images: Separate cost (either free from public sources or time to generate)

---

## APPENDIX: FILE STRUCTURE

```
lib/integrity/
├── LocationIntegrityService.ts   # Main service
├── badgeService.ts               # Badge read/delete operations
├── countyData.ts                 # FIPS lookup (3,143 counties)
├── locationNames.ts              # Country/state name mappings
├── types.ts                      # TypeScript interfaces
└── index.ts                      # Exports

public/badges/
├── default.svg                   # Fallback badge
└── county/
    ├── US-CA-06037.svg          # Los Angeles County
    ├── US-TX-48201.svg          # Harris County
    └── ... (3,143 files)
```
