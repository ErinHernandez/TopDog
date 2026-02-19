# County Badge System - Implementation Handoff

**Project:** Bestball Site  
**Date:** January 2025  
**Status:** Ready for Implementation  
**Scope:** Extend existing flag/badge system to support county badges (3,143 US counties)

---

## Executive Summary

This document provides a complete implementation plan for **extending the existing flag/badge system** to support county-level badges. The system already has infrastructure for country and state flags/badges that unlock based on location visits. We will add county badges using the same pattern.

**Key Requirements:**
1. **Signup Integration:** Detect county from user's signup address (geocoding) - don't ask user directly
2. **Badge Display Control:** Badges are customization options (not privacy/security), users control which badges to display
3. **Location-Based Unlocking:** Users can only access counties they've been geolocated to
4. **Draft Location Tracking:** Record location at draft start and during drafts (especially slow drafts where users may be moving)
5. **Data Separation:** Clear delineation between slow and fast draft location data for research
6. **County Badge Deletion:** Users can delete county badges using press/hold gesture (like iOS app deletion)
7. **Undo Functionality:** 60 second countdown timer to undo deletion with explanation
8. **Remove Educational Text:** Hide explanations about earning flags after user earns second country flag
9. **Tags vs Badges:** "Experienced Drafter" is a TAG (not a badge), separate system, can be deferred

**Key Insight:** The existing system uses:
- `userLocations` collection in Firestore (stores countries and states)
- `FlagOption` type with `code`, `name`, `type: 'country' | 'state'`
- `FlagGrid` component for displaying flags
- `useCustomization` hook that converts locations to flags
- Location tracking that unlocks flags when users visit places
- User research system (`lib/userMetrics.js`, `lib/draftCompletionTracker.js`) for draft data

**What We're Adding:**
- County tracking in `userLocations` collection
- County type to `FlagOption` (`type: 'county'`)
- County badge images (using county seals)
- County detection and unlocking logic
- Display of county badges in existing `FlagGrid`
- **Badge display control** (customization option, not privacy feature - unified `badgesEnabled` flag)
- **Address geocoding** for signup county detection (`lib/customization/addressGeocoding.ts`)
- **Draft location tracking** (start + periodic for slow drafts) (`lib/customization/draftLocationTracking.ts`)
- **User research integration** with slow/fast draft separation (`lib/customization/draftLocationResearch.ts`)
- **County badge deletion** (press/hold gesture, undo with 60s timer, counties only)
- **Educational text removal** after second country flag earned

**Important Notes:**
- Tags (like "Experienced Drafter") are separate from badges - different data structure, different UI
- Tag implementation can be deferred (no user can reach 150 drafts this year - max limit)
- Badges are **customization options**, not privacy features - code structure should reflect this
- County deletion is for relationship privacy ("never say welcome back" principle)
- Deletion functions as if user never drafted from that location - can be re-earned naturally
- Only counties can be deleted, not countries/country flags
- Integrate with existing user research system - don't create new functions on app open

**Estimated Implementation Time:** 26-35 hours (includes address geocoding, draft tracking, badge deletion with undo, and educational text removal)

---

## Part 1: Signup Address & County Detection

### 1.1 Add Address Field to Signup

**Files to Modify:**
- `components/RegistrationModal.js` - Add address input field
- `pages/api/auth/signup.js` - Accept address in signup request
- `components/vx2/auth/context/AuthContext.tsx` - Handle address in email signup

**Address Field Requirements:**
- **Field Name:** `address` (optional but recommended)
- **Format:** Free-form text input (street address, city, state, zip)
- **UI:** Add after country selection, before username
- **Validation:** Basic format check (not empty if provided)
- **Important:** Do NOT ask user what county they are in - detect from address

**Implementation:**
```typescript
// In RegistrationModal.js
const [formData, setFormData] = useState({
  username: '',
  email: '',
  countryCode: 'US',
  displayName: '',
  address: ''  // NEW
});

// Add address input field
<div>
  <label className="block text-gray-300 mb-2">
    Address (Optional - helps us detect your county)
  </label>
  <input
    type="text"
    value={formData.address}
    onChange={(e) => handleInputChange('address', e.target.value)}
    className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600"
    placeholder="Street address, city, state, zip"
  />
  <p className="text-sm text-gray-400 mt-1">
    We'll use this to determine your county for badge unlocking
  </p>
</div>
```

### 1.2 Geocode Address to County

**New File:** `lib/customization/addressGeocoding.ts`

**Purpose:** Convert user's signup address to county information

**Implementation Strategy:**
1. Use free geocoding service (BigDataCloud, OpenStreetMap Nominatim, or Google Maps Geocoding API)
2. Extract county from geocoded result
3. Convert county name to FIPS code using county data mapping
4. Return county code in format: `US-{stateCode}-{fipsCode}`

**Function Signature:**
```typescript
export interface CountyGeocodeResult {
  countyCode: string;  // Format: "US-{stateCode}-{fipsCode}"
  countyName: string;
  stateCode: string;
  fipsCode: string;
  confidence: 'high' | 'medium' | 'low';
}

export async function geocodeAddressToCounty(
  address: string,
  countryCode: string
): Promise<CountyGeocodeResult | null> {
  // Only works for US addresses
  if (countryCode !== 'US') {
    return null;
  }
  
  // Use free geocoding service (BigDataCloud or Nominatim)
  // Extract county from result
  // Map county name to FIPS code
  // Return county code
}
```

**Geocoding Service Priority:**
1. **BigDataCloud** (free, no API key) - Primary
2. **OpenStreetMap Nominatim** (free, rate limited) - Fallback
3. **Google Maps Geocoding API** (paid, most accurate) - Optional enhancement

**County Name to FIPS Mapping:**
- Load from `data/counties.json` (same file used for county badges)
- Match county name + state code to FIPS code
- Handle variations (e.g., "Los Angeles County" vs "Los Angeles")

### 1.3 Integrate County Detection in Signup

**File:** `pages/api/auth/signup.js`

**Changes:**
- Accept `address` field in request body
- If address provided and country is US, geocode to get county
- Pass county info to `recordLocationVisit()` during signup
- Don't fail signup if geocoding fails

**Implementation:**
```typescript
// In signup handler, after location detection
let countyCode: string | undefined;
let countyName: string | undefined;

// If address provided, geocode to get county
if (address && countryCode === 'US') {
  try {
    const { geocodeAddressToCounty } = await import('../../../lib/customization/addressGeocoding');
    const countyResult = await geocodeAddressToCounty(address, countryCode);
    if (countyResult) {
      countyCode = countyResult.countyCode;
      countyName = countyResult.countyName;
    }
  } catch (error) {
    // Don't fail signup if geocoding fails
    logger.warn('Failed to geocode address to county', { error, address });
  }
}

// Record location with county if available
await recordLocationVisit(uid, location, countyCode, countyName);
```

**File:** `components/vx2/auth/context/AuthContext.tsx`

**Changes:**
- Accept `address` in email signup data
- Geocode address to county if provided
- Pass county to `recordLocationVisit()` during signup

---

## Part 2: Draft Location Tracking

### 2.1 Draft Start Location Tracking

**Requirement:** Record user's location when draft starts (both slow and fast drafts)

**Integration Points:**
- `components/vx2/draft-room/hooks/useDraftRoom.ts` - When draft starts
- `components/vx2/draft-logic/hooks/useDraftEngine.ts` - Draft engine initialization
- `pages/api/draft/submit-pick.ts` - First pick submission (draft start)

**Implementation:**
```typescript
// In useDraftRoom or draft start handler
const [hasRecordedStartLocation, setHasRecordedStartLocation] = useState(false);

useEffect(() => {
  if (status === 'active' && !hasRecordedStartLocation) {
    recordDraftLocation(roomId, userId, 'draft_start', fastMode);
    setHasRecordedStartLocation(true);
  }
}, [status, roomId, userId, fastMode]);

async function recordDraftLocation(
  roomId: string,
  userId: string,
  eventType: 'draft_start' | 'draft_location_update',
  isFastDraft: boolean
) {
  // Get current location (requires consent)
  const { getCurrentLocation } = await import('@/lib/location/geolocationProvider');
  const location = await getCurrentLocation();
  if (!location) return;
  
  // Detect county if US location
  const { detectCounty } = await import('@/lib/customization/countyDetection');
  const county = await detectCounty({
    country: { code: location.countryCode, name: location.countryName },
    state: location.stateCode ? { code: location.stateCode, name: location.stateName || '' } : null
  });
  
  // Record to userLocations (for badge unlocking)
  const { recordLocationVisit } = await import('@/lib/customization/geolocation');
  await recordLocationVisit(
    userId,
    {
      country: { code: location.countryCode, name: location.countryName },
      state: location.stateCode ? { code: location.stateCode, name: location.stateName || '' } : null
    },
    county?.code,
    county?.name
  );
  
  // Record to user research system (with draft context)
  const { recordDraftLocationForResearch } = await import('@/lib/customization/draftLocationResearch');
  await recordDraftLocationForResearch(userId, roomId, {
    country: { code: location.countryCode, name: location.countryName },
    state: location.stateCode ? { code: location.stateCode, name: location.stateName || '' } : null
  }, county, {
    eventType,
    draftType: isFastDraft ? 'fast' : 'slow',
    timestamp: Date.now()
  });
}
```

### 2.2 Periodic Location Tracking During Slow Drafts

**Requirement:** Track location during slow drafts (users may be moving/traveling)

**Implementation Strategy:**
- Use `watchPosition` API for continuous tracking (only when draft is active)
- Record location updates periodically (every 5 minutes during active slow draft)
- Stop tracking when draft completes or user leaves draft room
- Only track slow drafts (fast drafts are too quick)

**File:** `lib/customization/draftLocationTracking.ts` (NEW)

```typescript
export interface DraftLocationContext {
  roomId: string;
  userId: string;
  draftType: 'fast' | 'slow';
  startedAt: number;
}

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

export function startDraftLocationTracking(context: DraftLocationContext) {
  // Only track slow drafts (fast drafts are too quick)
  if (context.draftType === 'fast') {
    return;
  }
  
  // Check if user has location consent
  // If yes, start watching position
  if (typeof navigator !== 'undefined' && navigator.geolocation && 'watchPosition' in navigator.geolocation) {
    activeDraftTracking.context = context;
    activeDraftTracking.lastRecordedAt = Date.now();
    
    activeDraftTracking.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        // Only record if enough time has passed
        if (now - activeDraftTracking.lastRecordedAt < LOCATION_UPDATE_INTERVAL_MS) {
          return;
        }
        
        // Get location from coordinates (reverse geocode)
        const { reverseGeocode } = await import('./geolocationProvider');
        const location = await reverseGeocode(position.coords.latitude, position.coords.longitude);
        if (location) {
          const { detectCountyFromCoordinates } = await import('./countyDetection');
          const county = await detectCountyFromCoordinates(
            position.coords.latitude,
            position.coords.longitude
          );
          
          // Record location for badge unlocking
          const { recordLocationVisit } = await import('./geolocation');
          await recordLocationVisit(
            context.userId,
            location,
            county?.code,
            county?.name
          );
          
          // Record for research (with draft context)
          const { recordDraftLocationForResearch } = await import('./draftLocationResearch');
          await recordDraftLocationForResearch(
            context.userId,
            context.roomId,
            location,
            county,
            {
              eventType: 'draft_location_update',
              draftType: context.draftType,
              timestamp: now,
              coordinates: {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              }
            }
          );
          
          activeDraftTracking.lastRecordedAt = now;
        }
      },
      (error) => {
        console.warn('Draft location tracking error:', error);
        // Don't stop tracking on error, just log
      },
      {
        enableHighAccuracy: false, // We only need county-level accuracy
        timeout: 10000,
        maximumAge: LOCATION_UPDATE_INTERVAL_MS
      }
    );
  }
}

export function stopDraftLocationTracking() {
  if (activeDraftTracking.watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(activeDraftTracking.watchId);
    activeDraftTracking.watchId = null;
    activeDraftTracking.context = null;
  }
}
```

**Integration in Draft Room:**
```typescript
// In useDraftRoom.ts
useEffect(() => {
  if (status === 'active' && !fastMode) {
    // Start location tracking for slow drafts
    const { startDraftLocationTracking } = await import('@/lib/customization/draftLocationTracking');
    startDraftLocationTracking({
      roomId,
      userId: user.uid,
      draftType: 'slow',
      startedAt: Date.now()
    });
    
    return () => {
      // Stop tracking when component unmounts or draft ends
      const { stopDraftLocationTracking } = await import('@/lib/customization/draftLocationTracking');
      stopDraftLocationTracking();
    };
  }
}, [status, roomId, user?.uid, fastMode]);
```

### 2.3 User Research System Integration

**Requirement:** Store draft location data in user research system with clear slow/fast separation

**Existing System:** `lib/userMetrics.js` and `lib/draftCompletionTracker.js`

**New Function:** `lib/customization/draftLocationResearch.ts` (NEW)

```typescript
/**
 * Record draft location for user research
 * 
 * Stores location data with draft context for analysis.
 * Separate collections/fields for slow vs fast drafts.
 * 
 * IMPORTANT: Integrate with existing user research system.
 * Don't create new functions that run on app open - use existing infrastructure.
 */
export async function recordDraftLocationForResearch(
  userId: string,
  roomId: string,
  location: GeolocationResult,
  county: CountyInfo | null,
  context: {
    eventType: 'draft_start' | 'draft_location_update';
    draftType: 'fast' | 'slow';
    timestamp: number;
    coordinates?: { lat: number; lng: number };
  }
): Promise<void> {
  if (!db) return;
  
  const collectionName = context.draftType === 'slow' 
    ? 'userResearch_slowDraftLocations'
    : 'userResearch_fastDraftLocations';
  
  const docRef = doc(db, collectionName, `${userId}_${roomId}_${context.timestamp}`);
  
  await setDoc(docRef, {
    userId,
    roomId,
    eventType: context.eventType,
    draftType: context.draftType,
    timestamp: Timestamp.fromMillis(context.timestamp),
    
    // Location data
    country: location.country?.code || null,
    state: location.state?.code || null,
    county: county?.code || null,
    countyName: county?.name || null,
    
    // Coordinates (if available)
    coordinates: context.coordinates || null,
    
    // Metadata
    recordedAt: serverTimestamp()
  }, { merge: true });
}
```

**Firestore Collections:**
- `userResearch_slowDraftLocations/{userId}_{roomId}_{timestamp}` - Slow draft location events
- `userResearch_fastDraftLocations/{userId}_{roomId}_{timestamp}` - Fast draft location events

**Data Structure:**
```typescript
interface DraftLocationResearchRecord {
  userId: string;
  roomId: string;
  eventType: 'draft_start' | 'draft_location_update';
  draftType: 'fast' | 'slow';
  timestamp: Timestamp;
  country: string | null;
  state: string | null;
  county: string | null;  // Format: "US-{stateCode}-{fipsCode}"
  countyName: string | null;
  coordinates: { lat: number; lng: number } | null;
  recordedAt: Timestamp;
}
```

**Integration with Existing Research System:**
- Extend `lib/userMetrics.js` to include draft location data in exports
- Add draft location queries to research data export functions
- Ensure location data is included in `exportMetricsForResearch()`
- Use existing infrastructure - don't create new functions on app open

**Indexes Needed:**
- `userId` + `draftType` + `timestamp`
- `roomId` + `draftType` + `timestamp`
- `county` + `draftType` + `timestamp` (for county analysis)

---

## Part 1b: Understanding Existing Infrastructure

### 1.1 Current Flag/Badge System Architecture

**Location Storage:** `lib/customization/types.ts`
```typescript
export interface UserLocations {
  userId: string;
  countries: LocationRecord[];  // Existing
  states: LocationRecord[];     // Existing
  counties?: LocationRecord[];  // NEW - Add this
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

export interface FlagOption {
  code: string;
  name: string;
  type: 'country' | 'state' | 'county';  // NEW - Add 'county'
}
```

**Location Tracking:** `lib/customization/geolocation.ts`
- `recordLocationVisit()` - Records countries and states
- Needs extension to record counties
- Called from 4 locations:
  1. `pages/api/auth/signup.js` (line 396)
  2. `components/vx2/auth/context/AuthContext.tsx` (line 505)
  3. `components/vx2/customization/hooks/useCustomization.ts` (lines 186, 262)

**Flag Display:** `components/vx2/customization/FlagGrid.tsx`
- Already groups by type (countries, states)
- Has error handling for missing images (`imgError` state)
- Will automatically display counties when added

**Customization Hook:** `components/vx2/customization/hooks/useCustomization.ts`
- `subscribeToLocations()` - Subscribes to `userLocations` collection
- Converts locations to `FlagOption[]` for display
- Already handles countries and states - just add counties

**Draft Room Integration:** `components/vx2/draft-room/components/DraftBoard.tsx`
- Uses `generateBackgroundStyle()` from `lib/customization/patterns.ts`
- Calls `getFlagUrl()` which needs to handle county codes
- No changes needed - will work automatically once `getFlagUrl()` is updated

**Note:** There are TWO location systems:
1. **Old system:** `lib/customization/` - Used for flags/badges
2. **New system:** `lib/location/` - Used for security tracking

We're extending the OLD system (`lib/customization/`) since that's what powers flags/badges.

---

## Part 2: Database Schema Extension

### 2.1 Extend UserLocations Type

**File:** `lib/customization/types.ts`

```typescript
// EXISTING - Keep as is, just add counties
export interface UserLocations {
  userId: string;
  countries: LocationRecord[];
  states: LocationRecord[];
  updatedAt: Timestamp;
  consentGiven: boolean;
  
  // NEW - Add counties array (optional for backward compatibility)
  counties?: LocationRecord[];
}

// EXISTING - Keep as is (no changes needed)
export interface LocationRecord {
  code: string;
  name: string;
  firstSeen: Timestamp;
  lastSeen: Timestamp;
  visitCount: number;
  // NEW - Optional context for research (e.g., ['signup', 'draft_start', 'draft_update'])
  contexts?: string[];
}

// EXISTING - Extend type to include county
export interface FlagOption {
  code: string;
  name: string;
  type: 'country' | 'state' | 'county';  // ADD 'county'
}
```

### 2.2 County Code Format

County codes will follow the pattern: `US-{stateCode}-{fipsCode}`

**Examples:**
- `US-CA-06037` = Los Angeles County, CA (FIPS: 06037)
- `US-TX-48453` = Harris County, TX (FIPS: 48453)
- `US-NY-36061` = New York County, NY (FIPS: 36061)

**Format Rationale:**
- Consistent with state format (`US-{stateCode}`)
- FIPS code is 5 digits (state code + county code)
- Easy to parse and validate
- Unique identifier for all 3,143 counties

**Validation:**
- Must match pattern: `/^US-[A-Z]{2}-\d{5}$/`
- State code must be valid US state
- FIPS code must be valid (first 2 digits = state FIPS, last 3 = county FIPS)

---

## Part 3: Location Tracking Extension

**Note:** This section extends the existing `recordLocationVisit` function. For draft-specific location tracking, see Part 2.

### 3.1 Extend recordLocationVisit Function

**File:** `lib/customization/geolocation.ts`

**Current Implementation (lines 146-207):**
```typescript
export async function recordLocationVisit(
  userId: string,
  location: GeolocationResult
): Promise<void> {
  // ... existing code records countries and states
}
```

**Enhanced Implementation:**

```typescript
export async function recordLocationVisit(
  userId: string,
  location: GeolocationResult,
  countyCode?: string,  // NEW - Optional county code (format: "US-{stateCode}-{fipsCode}")
  countyName?: string   // NEW - Optional county name
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
          counties: [],  // NEW - Initialize counties array
          consentGiven: true,
          updatedAt: now,
        };

    // EXISTING - Update or add country (keep as is)
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

    // EXISTING - Update or add US state if present (keep as is)
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

    // NEW - Update or add US county if present
    // Only record if: US location, has state, and county info provided
    if (
      countyCode && 
      countyName && 
      location.country.code === 'US' && 
      location.state
    ) {
      // Validate county code format
      if (!/^US-[A-Z]{2}-\d{5}$/.test(countyCode)) {
        console.warn('Invalid county code format:', countyCode);
        // Don't throw - just skip county recording
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

**Key Changes:**
1. Added optional `countyCode` and `countyName` parameters
2. Added county validation (format check)
3. Initialize `counties` array in new documents
4. Handle backward compatibility (check if `counties` exists)
5. Only record counties for US locations with state

### 3.2 County Detection Service

**File:** `lib/customization/countyDetection.ts` (NEW)

```typescript
/**
 * County Detection Service
 * 
 * Detects county from location data.
 * Since IP geolocation doesn't provide county-level data,
 * this will need enhancement with reverse geocoding or enhanced APIs.
 * 
 * Primary method: Address geocoding (from signup)
 * Secondary method: Reverse geocoding from coordinates (during drafts)
 */

import type { GeolocationResult } from './geolocation';

export interface CountyInfo {
  code: string;  // Format: "US-{stateCode}-{fipsCode}"
  name: string; // County name (e.g., "Los Angeles")
  fipsCode: string;  // 5-digit FIPS code
  stateCode: string;  // 2-letter state code
}

/**
 * Resolve county from location
 * 
 * Current limitation: IP geolocation APIs don't provide county data.
 * This function will need to be enhanced with:
 * 1. Reverse geocoding API (Google Maps, Mapbox, etc.) - for draft locations
 * 2. Enhanced IP geolocation service (paid)
 * 3. Browser geolocation API (requires user permission)
 * 
 * For signup: Use address geocoding (see addressGeocoding.ts)
 * For drafts: Use reverse geocoding from coordinates
 * 
 * @param location - Geolocation result from IP-based detection
 * @returns CountyInfo if county can be determined, null otherwise
 */
export async function detectCounty(
  location: GeolocationResult
): Promise<CountyInfo | null> {
  // Must be US location with state
  if (!location.country || location.country.code !== 'US') {
    return null;
  }
  
  if (!location.state) {
    return null;
  }
  
  // TODO: Implement county detection from coordinates
  // Phase 1: Return null (county detection from IP not yet implemented)
  // Phase 2: Add reverse geocoding with coordinates (for draft locations)
  // Phase 3: Add browser geolocation fallback
  
  return null;
}

/**
 * Detect county from coordinates (for draft location tracking)
 * 
 * Uses reverse geocoding to get county from lat/lng.
 * This is used during draft location tracking.
 */
export async function detectCountyFromCoordinates(
  latitude: number,
  longitude: number
): Promise<CountyInfo | null> {
  // Use reverse geocoding service (BigDataCloud, Mapbox, etc.)
  // Extract county from result
  // Map county name to FIPS code
  // Return county info
  
  // TODO: Implement reverse geocoding
  return null;
}

/**
 * Generate county code from state code and FIPS code
 * Format: "US-{stateCode}-{fipsCode}"
 * 
 * @param stateCode - 2-letter US state code (e.g., "CA")
 * @param fipsCode - 5-digit FIPS code (e.g., "06037")
 * @returns County code in format "US-CA-06037"
 */
export function generateCountyCode(
  stateCode: string,
  fipsCode: string
): string {
  // Validate inputs
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
export function parseCountyCode(
  countyCode: string
): { stateCode: string; fipsCode: string } | null {
  // Format: "US-{stateCode}-{fipsCode}"
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
```

---

## Part 4: Update Customization Hook

### 4.1 Extend useCustomization Hook

**File:** `components/vx2/customization/hooks/useCustomization.ts`

**Current Implementation (lines 131-168):**
```typescript
const unsubscribe = subscribeToLocations(user.uid, async (locations) => {
  if (locations && (locations.countries?.length > 0 || locations.states?.length > 0)) {
    setLocationConsent(locations.consentGiven ?? false);
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
    // ... rest of code
  }
});
```

**Enhanced Implementation:**

```typescript
const unsubscribe = subscribeToLocations(user.uid, async (locations) => {
  // NEW - Check counties in condition
  if (locations && (
    locations.countries?.length > 0 || 
    locations.states?.length > 0 || 
    locations.counties?.length > 0  // NEW
  )) {
    setLocationConsent(locations.consentGiven ?? false);
    
    // ALL badges are controlled by badgesEnabled (customization option, not privacy)
    // Filter badges based on display preference
    const flags: FlagOption[] = preferences.badgesEnabled ? [
      // Countries (only if display enabled)
      ...(locations.countries || []).map((c) => ({
        code: c.code,
        name: c.name,
        type: 'country' as const,
      })),
      // States (only if display enabled)
      ...(locations.states || []).map((s) => ({
        code: `US-${s.code}`,
        name: s.name,
        type: 'state' as const,
      })),
      // Counties (only if display enabled)
      ...(locations.counties || []).map((c) => ({
        code: c.code,  // Already in format "US-{stateCode}-{fipsCode}"
        name: c.name,
        type: 'county' as const,
      })),
    ] : []; // Empty array if badges disabled
    
    // EXISTING - Dev flags merge logic (keep as is, but respect badgesEnabled)
    const finalFlags = process.env.NODE_ENV === 'development'
      ? [
          ...DEV_FLAGS,
          ...flags.filter(
            (f) => !DEV_FLAGS.some((df) => df.code === f.code)
          ),
        ]
      : flags;
    
    setAvailableFlags(finalFlags);
    setFlagsLoading(false);
  } else {
    // ... existing else logic (no changes needed)
  }
});
```

**Also update auto-detection logic (around line 186):**

```typescript
// In the auto-detection section (around line 183-186)
try {
  const location = await detectLocation();
  if (location.country) {
    // NEW - Try to detect county
    const { detectCounty } = await import('@/lib/customization/countyDetection');
    const county = await detectCounty(location);
    
    // Record location with county if available
    await recordLocationVisit(
      user.uid, 
      location,
      county?.code,      // NEW
      county?.name       // NEW
    );
    // Don't set flagsLoading to false yet - wait for subscription to fire with new data
  } else {
    // ... existing else logic
  }
} catch (detectErr) {
  // ... existing error handling
}
```

**Also update manual enable location tracking (around line 262):**

```typescript
// In enableLocationTracking function (around line 260-262)
const location = await detectLocation();
if (location.country) {
  // NEW - Try to detect county
  const { detectCounty } = await import('@/lib/customization/countyDetection');
  const county = await detectCounty(location);
  
  await recordLocationVisit(
    user.uid, 
    location,
    county?.code,      // NEW
    county?.name       // NEW
  );
}

// Also track via the new system (keep as is)
await trackLocation(user.uid);
```

### 4.2 Badge Display Control (Customization Option)

**IMPORTANT:** Badges are customization options - users control which badges to display for personalization (not a privacy/security feature).

**File:** `lib/customization/types.ts`

```typescript
export interface CustomizationPreferences {
  // ... existing fields
  badgesEnabled: boolean;  // NEW - Display control for ALL badges (customization option, not privacy)
}

export const DEFAULT_PREFERENCES: CustomizationPreferences = {
  // ... existing defaults
  badgesEnabled: false,  // Default to hidden (user can enable for customization)
};
```

**File:** `components/vx2/customization/hooks/useCustomization.ts`

```typescript
// ALL badges are opt-in - filter based on preferences.badgesEnabled
const flags: FlagOption[] = preferences.badgesEnabled ? [
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
  ...(locations.counties || []).map((c) => ({
    code: c.code,
    name: c.name,
    type: 'county' as const,
  })),
] : []; // Empty if badges disabled
```

### 4.3 Dev Flags for Testing

**File:** `components/vx2/customization/hooks/useCustomization.ts`

**Current Dev Flags (lines 56-61):**
```typescript
const DEV_FLAGS: FlagOption[] = [
  { code: 'US', name: 'United States', type: 'country' },
  { code: 'US-SC', name: 'South Carolina', type: 'state' },
  { code: 'US-NY', name: 'New York', type: 'state' },
  { code: 'IE', name: 'Ireland', type: 'country' },
];
```

**Enhanced Dev Flags (add sample counties):**

```typescript
const DEV_FLAGS: FlagOption[] = [
  { code: 'US', name: 'United States', type: 'country' },
  { code: 'US-SC', name: 'South Carolina', type: 'state' },
  { code: 'US-NY', name: 'New York', type: 'state' },
  { code: 'IE', name: 'Ireland', type: 'country' },
  // NEW - Add sample counties for dev testing
  { code: 'US-CA-06037', name: 'Los Angeles', type: 'county' },
  { code: 'US-TX-48453', name: 'Harris', type: 'county' },
  { code: 'US-NY-36061', name: 'New York', type: 'county' },
];
```

---

## Part 5: Update FlagGrid Component

### 5.1 Extend FlagGrid to Display Counties (Opt-In)

**File:** `components/vx2/customization/FlagGrid.tsx`

**IMPORTANT:** ALL badges are opt-in. Only show badges if `preferences.badgesEnabled === true`.

**Current Implementation (lines 33-72):**
```typescript
// Group: countries first, then US states
const countries = flags.filter((f) => f.type === 'country');
const states = flags.filter((f) => f.type === 'state');

return (
  <div className="space-y-4">
    {countries.length > 0 && (
      <div>
        <h4 className="text-sm font-medium mb-2">Countries</h4>
        {/* ... country grid */}
      </div>
    )}
    {states.length > 0 && (
      <div>
        <h4 className="text-sm font-medium mb-2">US States</h4>
        {/* ... state grid */}
      </div>
    )}
  </div>
);
```

**Enhanced Implementation:**

```typescript
// ALL badges are opt-in - filter based on preferences
// Only show badges if preferences.badgesEnabled === true
const countries = preferences.badgesEnabled
  ? flags.filter((f) => f.type === 'country')
  : [];
const states = preferences.badgesEnabled
  ? flags.filter((f) => f.type === 'state')
  : [];
const counties = preferences.badgesEnabled
  ? flags.filter((f) => f.type === 'county')  // NEW
  : [];

return (
  <div className="space-y-4">
    {/* EXISTING - Countries (keep as is) */}
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

    {/* EXISTING - States (keep as is) */}
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

    {/* NEW - Counties */}
    {counties.length > 0 && (
      <div>
        <h4 className="text-sm font-medium mb-2" style={{ color: 'rgba(209, 213, 219, 0.9)' }}>US Counties</h4>
        {/* Performance: Use virtual scrolling or pagination if many counties */}
        {counties.length > 50 ? (
          <div className="text-sm text-gray-400 mb-2">
            Showing {counties.length} counties. Use search to filter.
          </div>
        ) : null}
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
```

**Note:** `FlagItem` already has error handling (lines 83, 98-101), so county badges will automatically show fallback if image is missing.

### 5.2 Update Flag URL Function

**File:** `lib/customization/flags.ts`

**Current Implementation:**
```typescript
export function getFlagUrl(code: string): string {
  if (code.startsWith('US-')) {
    return `/flags/states/${code.slice(3).toLowerCase()}.svg`;
  }
  return `/flags/countries/${code.toLowerCase()}.svg`;
}
```

**Enhanced Implementation:**

```typescript
export function getFlagUrl(code: string): string {
  // County format: "US-{stateCode}-{fipsCode}"
  // Check for county pattern first (more specific)
  if (code.match(/^US-[A-Z]{2}-\d{5}$/)) {
    // County badge - use badges directory
    return `/badges/county/${code}.svg`;
  }
  
  // State format: "US-{stateCode}"
  if (code.startsWith('US-')) {
    return `/flags/states/${code.slice(3).toLowerCase()}.svg`;
  }
  
  // Country format: "{countryCode}"
  return `/flags/countries/${code.toLowerCase()}.svg`;
}

export function parseFlagCode(code: string): { type: 'country' | 'state' | 'county'; code: string } {
  // County format: "US-{stateCode}-{fipsCode}"
  if (code.match(/^US-[A-Z]{2}-\d{5}$/)) {
    return { type: 'county', code };
  }
  
  // State format: "US-{stateCode}"
  if (code.startsWith('US-')) {
    return { type: 'state', code: code.slice(3) };
  }
  
  // Country format: "{countryCode}"
  return { type: 'country', code };
}

export function getFlagDisplayName(code: string): string {
  // County format: "US-{stateCode}-{fipsCode}"
  if (code.match(/^US-[A-Z]{2}-\d{5}$/)) {
    // Try to get county name from mapping
    const countyName = COUNTY_NAMES[code];
    if (countyName) {
      const parts = code.split('-');
      return `${countyName} County, ${parts[1]}`;
    }
    // Fallback: return code if name not found
    return code;
  }
  
  // EXISTING - State and country logic (keep as is)
  if (code.startsWith('US-')) {
    return US_STATE_NAMES[code.slice(3)] ?? code;
  }
  return COUNTRY_NAMES[code] ?? code;
}
```

### 5.3 County Name Mapping

**File:** `lib/customization/flags.ts` (addition)

**Option 1: Static Mapping (Simple but large file)**

```typescript
// Add county name mapping
// This would be a large object with all 3,143 counties
// Better to generate dynamically from counties.json (see Option 2)
export const COUNTY_NAMES: Record<string, string> = {
  'US-CA-06037': 'Los Angeles',
  'US-CA-06073': 'San Diego',
  'US-TX-48453': 'Harris',
  // ... all 3,143 counties
  // This would be generated from counties.json
};
```

**Option 2: Dynamic Loading (Recommended)**

```typescript
// Load county names dynamically from JSON file
let COUNTY_NAMES_CACHE: Record<string, string> | null = null;

async function loadCountyNames(): Promise<Record<string, string>> {
  if (COUNTY_NAMES_CACHE) {
    return COUNTY_NAMES_CACHE;
  }
  
  try {
    // Load from public data file
    const response = await fetch('/data/counties.json');
    const counties = await response.json();
    
    COUNTY_NAMES_CACHE = {};
    counties.forEach((county: { fipsCode: string; stateCode: string; countyName: string }) => {
      const code = `US-${county.stateCode}-${county.fipsCode}`;
      COUNTY_NAMES_CACHE![code] = county.countyName;
    });
    
    return COUNTY_NAMES_CACHE;
  } catch (error) {
    console.error('Failed to load county names:', error);
    return {};
  }
}

// For server-side or initial load, use synchronous version
export const COUNTY_NAMES: Record<string, string> = {};
// This will be populated by a script or at build time

// Update getFlagDisplayName to handle async loading
export async function getFlagDisplayNameAsync(code: string): Promise<string> {
  if (code.match(/^US-[A-Z]{2}-\d{5}$/)) {
    const names = await loadCountyNames();
    const countyName = names[code];
    if (countyName) {
      const parts = code.split('-');
      return `${countyName} County, ${parts[1]}`;
    }
    return code;
  }
  
  // For states and countries, use sync version
  return getFlagDisplayName(code);
}
```

**Recommended Approach:** Use Option 1 (static mapping) generated at build time from `counties.json`:

**File:** `scripts/generate-county-names.js` (NEW)

```javascript
/**
 * Generate County Names Mapping
 * 
 * Reads counties.json and generates COUNTY_NAMES mapping for flags.ts
 * 
 * Usage: node scripts/generate-county-names.js
 */

const fs = require('fs');
const path = require('path');

const COUNTIES_FILE = path.join(__dirname, '../data/counties.json');
const OUTPUT_FILE = path.join(__dirname, '../lib/customization/countyNames.ts');

const counties = JSON.parse(fs.readFileSync(COUNTIES_FILE, 'utf8'));

const mapping = {};
counties.forEach(county => {
  const code = `US-${county.stateCode}-${county.fipsCode}`;
  mapping[code] = county.countyName;
});

const output = `/**
 * County Names Mapping
 * 
 * Auto-generated from data/counties.json
 * Last updated: ${new Date().toISOString()}
 * Total counties: ${counties.length}
 */

export const COUNTY_NAMES: Record<string, string> = ${JSON.stringify(mapping, null, 2)};
`;

fs.writeFileSync(OUTPUT_FILE, output);
console.log(`✓ Generated county names mapping: ${Object.keys(mapping).length} counties`);
```

Then import in `flags.ts`:
```typescript
import { COUNTY_NAMES } from './countyNames';
```

### 5.2 County Badge Deletion

**File:** `lib/customization/badgeDeletion.ts` (NEW)

```typescript
/**
 * Delete a county badge from user's location history
 * 
 * Behavior: Removes county as if user never drafted from that location.
 * User can re-earn the badge by drafting from that location again.
 * This prevents suspicion (missing badge looks normal if it can be re-earned).
 * 
 * Only counties can be deleted, not countries.
 * 
 * Privacy Note: Users may delete badges to avoid revealing
 * where they've been (relationship privacy concerns).
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
  
  await updateDoc(docRef, {
    counties: updatedCounties,
    updatedAt: serverTimestamp()
  });
}

/**
 * Restore a deleted county badge (undo deletion)
 * 
 * Re-adds the county badge to user's location history.
 * Used for undo functionality within 60 second window.
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
    // Create document if it doesn't exist
    await setDoc(docRef, {
      userId,
      countries: [],
      states: [],
      counties: [],
      consentGiven: true,
      updatedAt: serverTimestamp(),
    });
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
  counties.push({
    code: countyCode,
    name: countyName,
    firstSeen: now, // Reset to now (as if first time earning)
    lastSeen: now,
    visitCount: 1,
  });
  
  await updateDoc(docRef, {
    counties,
    updatedAt: serverTimestamp()
  });
}
```

**File:** `components/vx2/customization/FlagGrid.tsx`

**Press/Hold Implementation (like iOS app deletion):**

```typescript
// Press/hold gesture for county badge deletion
const [deletingCounty, setDeletingCounty] = useState<string | null>(null);
const [holdProgress, setHoldProgress] = useState(0);
const holdDuration = 1500; // 1.5 seconds - longer than typical to prevent accidents
const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

// Handle press start for county badges
const handlePressStart = (countyCode: string) => {
  if (flag.type !== 'county') return;
  
  setDeletingCounty(countyCode);
  setHoldProgress(0);
  
  // Animate progress bar during hold
  const startTime = Date.now();
  holdIntervalRef.current = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min((elapsed / holdDuration) * 100, 100);
    setHoldProgress(progress);
    
    if (progress >= 100) {
      // Hold complete - show confirmation
      clearInterval(holdIntervalRef.current!);
      handleDeleteConfirm(countyCode, flag.name);
      setDeletingCounty(null);
      setHoldProgress(0);
    }
  }, 16); // ~60fps animation
};

// Handle press end (cancel if not complete)
const handlePressEnd = () => {
  if (holdIntervalRef.current) {
    clearInterval(holdIntervalRef.current);
    holdIntervalRef.current = null;
  }
  setDeletingCounty(null);
  setHoldProgress(0);
};

// Undo functionality state
const [deletedCounty, setDeletedCounty] = useState<{ code: string; name: string } | null>(null);
const [undoTimer, setUndoTimer] = useState(60); // 60 second countdown
const undoIntervalRef = useRef<NodeJS.Timeout | null>(null);

// Start undo timer countdown
const startUndoTimer = () => {
  setUndoTimer(60);
  undoIntervalRef.current = setInterval(() => {
    setUndoTimer((prev) => {
      if (prev <= 1) {
        // Timer expired - hide undo button
        clearInterval(undoIntervalRef.current!);
        setDeletedCounty(null);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
};

// Undo deletion
const handleUndoDelete = async () => {
  if (!deletedCounty) return;
  
  try {
    // Re-add the county badge (restore it)
    const { restoreCountyBadge } = await import('@/lib/customization/badgeDeletion');
    await restoreCountyBadge(user.uid, deletedCounty.code, deletedCounty.name);
    
    // Clear undo state
    if (undoIntervalRef.current) {
      clearInterval(undoIntervalRef.current);
    }
    setDeletedCounty(null);
    setUndoTimer(60);
    
    // Badge restored, UI will update via subscription
  } catch (error) {
    console.error('Failed to undo deletion:', error);
    alert('Failed to restore badge. Please try again.');
  }
};

// Delete confirmation and execution
const handleDeleteConfirm = async (countyCode: string, countyName: string) => {
  if (!confirm(
    `Delete "${countyName}" county badge?\n\n` +
    `This will remove the badge. If you draft here again, you will earn the badge again.`
  )) {
    return;
  }
  
  try {
    const { deleteCountyBadge } = await import('@/lib/customization/badgeDeletion');
    await deleteCountyBadge(user.uid, countyCode);
    // Badge removed, UI will update via subscription
    // Show undo button with 60 second timer
    setDeletedCounty({ code: countyCode, name: countyName });
    startUndoTimer();
  } catch (error) {
    console.error('Failed to delete county badge:', error);
    alert('Failed to delete badge. Please try again.');
  }
};

// In FlagItem component for counties:
{flag.type === 'county' && (
  <div
    className="relative"
    onMouseDown={() => handlePressStart(flag.code)}
    onMouseUp={handlePressEnd}
    onMouseLeave={handlePressEnd}
    onTouchStart={() => handlePressStart(flag.code)}
    onTouchEnd={handlePressEnd}
  >
    {/* Shaking animation when deleting */}
    <div className={deletingCounty === flag.code ? 'animate-pulse' : ''}>
      {/* Badge content */}
    </div>
    
    {/* Progress indicator during hold */}
    {deletingCounty === flag.code && (
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded z-10">
        <div className="w-16 h-16 rounded-full border-4 border-red-500 relative">
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent"
            style={{
              borderTopColor: 'red',
              transform: `rotate(${holdProgress * 3.6}deg)`,
              transition: 'transform 0.1s linear'
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-red-500 text-xs font-bold">
            {Math.round(holdProgress)}%
          </div>
        </div>
      </div>
    )}
  </div>
)}

// Undo button at bottom of badge page (shown after deletion)
{deletedCounty && (
  <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-red-500 rounded-lg p-4 shadow-lg z-50 max-w-md">
    <div className="flex items-center justify-between mb-2">
      <p className="text-white font-medium">
        County badge deleted: {deletedCounty.name}
      </p>
      <span className="text-red-400 font-bold text-lg">
        {undoTimer}s
      </span>
    </div>
    <button
      onClick={handleUndoDelete}
      className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded font-medium transition-colors"
    >
      That was a mistake, I didn't mean to delete that!
    </button>
    <p className="text-xs text-gray-400 mt-2 text-center">
      When the timer expires ({undoTimer} seconds remaining), this undo button will disappear and the deletion will be permanent.
    </p>
  </div>
)}
```

**Key Features:**
- Press/hold gesture (like iOS app deletion)
- Longer hold duration (1.5 seconds) to prevent accidental deletion
- Visual feedback during hold (shaking animation, progress indicator)
- Updated confirmation message: "If you draft here again, you will earn the badge again"
- Undo button appears at bottom of badge page after deletion
- 60 second countdown timer on undo button
- Explanation text: "When the timer expires, this undo button will disappear and the deletion will be permanent"
- Undo functionality restores deleted badge within 60 second window
- Deletion functions as if user never drafted from that location
- User can re-earn badge by drafting from that location again

**Restore Function (for undo):**

```typescript
/**
 * Restore a deleted county badge (undo deletion)
 * 
 * Re-adds the county badge to user's location history.
 * Used for undo functionality within 60 second window.
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
    // Create document if it doesn't exist
    await setDoc(docRef, {
      userId,
      countries: [],
      states: [],
      counties: [],
      consentGiven: true,
      updatedAt: serverTimestamp(),
    });
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
  counties.push({
    code: countyCode,
    name: countyName,
    firstSeen: now, // Reset to now (as if first time earning)
    lastSeen: now,
    visitCount: 1,
  });
  
  await updateDoc(docRef, {
    counties,
    updatedAt: serverTimestamp()
  });
}
```

### 5.3 Remove Educational Text After Second Country Flag

**Requirement:** Hide explanations about earning flags after user earns their second country flag

**Implementation:**
- Check if user has 2+ country flags
- Conditionally hide educational/help text about earning flags
- Apply to any UI that explains how flags are earned

**File:** `components/vx2/customization/ProfileCustomizationPage.tsx`

```typescript
// Check if user has 2+ countries
const hasMultipleCountries = locations.countries?.length >= 2;

// Conditionally show educational text
{!hasMultipleCountries && (
  <div className="text-sm text-gray-400 mb-4 p-3 bg-gray-800 rounded">
    <p className="font-medium mb-1">How to Earn Badges</p>
    <p>Earn badges by visiting new locations. Enable location tracking to start collecting badges!</p>
  </div>
)}
```

---

## Part 6: County Data and Images

### 6.1 County Data Structure

**File:** `data/counties.json` (NEW)

```json
[
  {
    "fipsCode": "06037",
    "stateCode": "CA",
    "stateName": "California",
    "countyName": "Los Angeles",
    "population": 10014009
  },
  {
    "fipsCode": "06073",
    "stateCode": "CA",
    "stateName": "California",
    "countyName": "San Diego",
    "population": 3298634
  }
  // ... all 3,143 counties
]
```

**Data Sources:**
- US Census Bureau FIPS codes
- County names and population data
- State codes and names

### 6.2 Image Storage Structure

```
public/
  flags/
    countries/          # Existing (country flags)
    states/             # Existing (state flags)
  badges/
    county/             # NEW (county badges)
      US-CA-06037.svg   # Los Angeles County, CA
      US-CA-06073.svg   # San Diego County, CA
      US-TX-48453.svg   # Harris County, TX
      # ... all 3,143 counties
    default.svg         # NEW - Fallback badge image
```

**Image Specifications:**
- **Format:** SVG (preferred) or PNG
- **Size:** 200x200px base size
- **Style:** Circular badge with county seal in center
- **Naming:** `US-{stateCode}-{fipsCode}.svg`
- **Fallback:** `/badges/default.svg` for missing badges

### 6.3 Image Processing Script

**File:** `scripts/process-county-seals.js` (NEW)

```javascript
/**
 * Process County Seals Script
 * 
 * Converts county seal images into standardized badge format.
 * 
 * Usage: node scripts/process-county-seals.js [input-dir] [output-dir]
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const INPUT_DIR = process.argv[2] || './data/county-seals';
const OUTPUT_DIR = process.argv[3] || './public/badges/county';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Load county data
const COUNTIES_FILE = path.join(__dirname, '../data/counties.json');
const countiesData = JSON.parse(fs.readFileSync(COUNTIES_FILE, 'utf8'));

/**
 * Process a single county seal into badge format
 */
async function processCountySeal(inputPath, outputPath, county) {
  try {
    const image = await loadImage(inputPath);
    
    // Create circular canvas
    const size = 200;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Draw white background circle
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw seal in center (with padding)
    const padding = 20;
    const sealSize = size - (padding * 2);
    const x = padding;
    const y = padding;
    
    ctx.drawImage(image, x, y, sealSize, sealSize);
    
    // Save as SVG (convert from canvas)
    // For now, save as PNG - can convert to SVG later if needed
    const buffer = canvas.toBuffer('image/png');
    const svgPath = outputPath.replace('.png', '.svg');
    
    // Create SVG wrapper
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="circle">
      <circle cx="100" cy="100" r="98"/>
    </clipPath>
  </defs>
  <circle cx="100" cy="100" r="98" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="2"/>
  <image href="data:image/png;base64,${buffer.toString('base64')}" 
         x="20" y="20" width="160" height="160" 
         clip-path="url(#circle)"/>
</svg>`;
    
    fs.writeFileSync(svgPath, svgContent);
    
    console.log(`✓ Processed ${county.fipsCode}: ${svgPath}`);
  } catch (error) {
    console.error(`✗ Failed to process ${county.fipsCode}:`, error.message);
  }
}

/**
 * Main processing function
 */
async function main() {
  const files = fs.readdirSync(INPUT_DIR);
  const imageFiles = files.filter(f => 
    /\.(png|jpg|jpeg|svg)$/i.test(f)
  );
  
  console.log(`Processing ${imageFiles.length} county seals...`);
  
  let processed = 0;
  let skipped = 0;
  
  for (const file of imageFiles) {
    // Extract FIPS code from filename
    // Expected formats:
    // - {fipsCode}.{ext}
    // - {county-name}-{fipsCode}.{ext}
    // - {stateCode}-{fipsCode}.{ext}
    const match = file.match(/(\d{5})/);
    if (!match) {
      console.warn(`Skipping ${file}: No FIPS code found`);
      skipped++;
      continue;
    }
    
    const fipsCode = match[1];
    
    // Find county in data
    const county = countiesData.find(c => c.fipsCode === fipsCode);
    if (!county) {
      console.warn(`Skipping ${file}: County not found in data for FIPS ${fipsCode}`);
      skipped++;
      continue;
    }
    
    const inputPath = path.join(INPUT_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, `US-${county.stateCode}-${fipsCode}.svg`);
    
    await processCountySeal(inputPath, outputPath, county);
    processed++;
    
    if (processed % 100 === 0) {
      console.log(`Progress: ${processed}/${imageFiles.length}`);
    }
  }
  
  console.log(`\n✓ Processing complete!`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Total: ${imageFiles.length}`);
}

main().catch(console.error);
```

---

## Part 7: Integration Points - All Call Sites

### 7.1 Update Signup API

**File:** `pages/api/auth/signup.js` (around line 396)

**Current Implementation:**
```javascript
// Record location for first flag earned
await recordLocationVisit(uid, location);
```

**Enhanced Implementation:**

```javascript
// Record location for first flag earned
let countyCode: string | undefined;
let countyName: string | undefined;

// If address provided, geocode to get county (don't ask user directly)
if (address && countryCode === 'US') {
  try {
    const { geocodeAddressToCounty } = await import('../../../lib/customization/addressGeocoding');
    const countyResult = await geocodeAddressToCounty(address, countryCode);
    if (countyResult) {
      countyCode = countyResult.countyCode;
      countyName = countyResult.countyName;
    }
  } catch (error) {
    // Don't fail signup if geocoding fails
    logger.warn('Failed to geocode address to county', { error, address });
  }
}

// Also try to detect county from IP-based location (fallback)
if (!countyCode) {
  try {
    const { detectCounty } = await import('../../../lib/customization/countyDetection');
    const county = await detectCounty(location);
    if (county) {
      countyCode = county.code;
      countyName = county.name;
    }
  } catch (error) {
    // Don't fail signup if county detection fails
    logger.warn('Failed to detect county from location', { error });
  }
}

// Record location with county if available
try {
  await recordLocationVisit(
    uid, 
    location,
    countyCode,      // NEW
    countyName       // NEW
  );
} catch (locationError) {
  // Don't fail signup if location recording fails
  logger.warn('Failed to record location during signup', {
    component: 'auth',
    operation: 'signup',
    uid,
    error: locationError instanceof Error ? locationError.message : 'Unknown error',
  });
}
```

### 7.2 Update Auth Context

**File:** `components/vx2/auth/context/AuthContext.tsx` (around line 492-510)

**Current Implementation:**
```typescript
// Record location for first flag earned
try {
  const { detectLocation, recordLocationVisit, grantLocationConsent } = await import('@/lib/customization/geolocation');
  
  await grantLocationConsent(firebaseUser.uid);
  
  const location = await detectLocation();
  if (location.country) {
    await recordLocationVisit(firebaseUser.uid, location);
  }
} catch (locationError) {
  console.warn('Failed to record location during signup:', locationError);
}
```

**Enhanced Implementation:**

```typescript
// Record location for first flag earned
try {
  const { detectLocation, recordLocationVisit, grantLocationConsent } = await import('@/lib/customization/geolocation');
  const { detectCounty } = await import('@/lib/customization/countyDetection');
  
  await grantLocationConsent(firebaseUser.uid);
  
  const location = await detectLocation();
  if (location.country) {
    // Try to detect county from IP-based location
    const county = await detectCounty(location);
    
    // Record location with county if available
    await recordLocationVisit(
      firebaseUser.uid, 
      location,
      county?.code,      // NEW
      county?.name       // NEW
    );
  }
} catch (locationError) {
  // Non-critical - log but don't fail signup
  console.warn('Failed to record location during signup:', locationError);
}
```

**Note:** For email signup, if address is provided in signup data, geocode it to get county (see Part 1.3).

### 7.3 Update useCustomization Hook (2 locations)

**File:** `components/vx2/customization/hooks/useCustomization.ts`

**Location 1: Auto-detection (around line 183-186)**

```typescript
// In auto-detection try block
try {
  const location = await detectLocation();
  if (location.country) {
    // NEW - Try to detect county
    const { detectCounty } = await import('@/lib/customization/countyDetection');
    const county = await detectCounty(location);
    
    // Record the location visit - this will trigger the subscription again with new data
    await recordLocationVisit(
      user.uid, 
      location,
      county?.code,      // NEW
      county?.name       // NEW
    );
    // Don't set flagsLoading to false yet - wait for subscription to fire with new data
  } else {
    // ... existing else logic
  }
} catch (detectErr) {
  // ... existing error handling
}
```

**Location 2: Manual enable (around line 260-262)**

```typescript
// In enableLocationTracking function
const location = await detectLocation();
if (location.country) {
  // NEW - Try to detect county
  const { detectCounty } = await import('@/lib/customization/countyDetection');
  const county = await detectCounty(location);
  
  await recordLocationVisit(
    user.uid, 
    location,
    county?.code,      // NEW
    county?.name       // NEW
  );
}

// Also track via the new system (keep as is)
await trackLocation(user.uid);
```

### 7.4 Update Location Settings Display

**File:** `components/vx2/location/LocationSettingsSection.tsx`

**Current Implementation (lines 116-153):**
```typescript
<div className="grid grid-cols-2 gap-4 mb-6">
  <div className="text-center p-4 rounded-lg">
    <div className="text-2xl font-bold">{userLocations.countries.length}</div>
    <div className="text-sm">Countries</div>
  </div>
  <div className="text-center p-4 rounded-lg">
    <div className="text-2xl font-bold">{userLocations.states.length}</div>
    <div className="text-sm">US States</div>
  </div>
</div>
```

**Enhanced Implementation:**

```typescript
<div className="grid grid-cols-3 gap-4 mb-6">  {/* Changed to 3 columns */}
  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: BG_COLORS.secondary }}>
    <div className="text-2xl font-bold" style={{ color: TEXT_COLORS.primary }}>
      {userLocations.countries.length}
    </div>
    <div className="text-sm" style={{ color: TEXT_COLORS.secondary }}>
      Countries
    </div>
  </div>
  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: BG_COLORS.secondary }}>
    <div className="text-2xl font-bold" style={{ color: TEXT_COLORS.primary }}>
      {userLocations.states.length}
    </div>
    <div className="text-sm" style={{ color: TEXT_COLORS.secondary }}>
      US States
    </div>
  </div>
  {/* NEW - Counties stat */}
  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: BG_COLORS.secondary }}>
    <div className="text-2xl font-bold" style={{ color: TEXT_COLORS.primary }}>
      {userLocations.counties?.length || 0}  {/* Handle missing counties array */}
    </div>
    <div className="text-sm" style={{ color: TEXT_COLORS.secondary }}>
      US Counties
    </div>
  </div>
</div>
```

**Also update known locations display (around line 182):**

```typescript
// Update flag URL logic to handle counties
<img
  src={`/flags/${loc.code.startsWith('US-') ? 'states' : 'countries'}/${loc.code.replace('US-', '').toLowerCase()}.svg`}
  // ... existing props
/>
```

**Enhanced:**

```typescript
// Determine flag/badge URL based on code format
const getLocationImageUrl = (code: string): string => {
  // County format: "US-{stateCode}-{fipsCode}"
  if (code.match(/^US-[A-Z]{2}-\d{5}$/)) {
    return `/badges/county/${code}.svg`;
  }
  // State format: "US-{stateCode}"
  if (code.startsWith('US-')) {
    return `/flags/states/${code.replace('US-', '').toLowerCase()}.svg`;
  }
  // Country format
  return `/flags/countries/${code.toLowerCase()}.svg`;
};

// In the map function:
<img
  src={getLocationImageUrl(loc.code)}
  alt=""
  className="w-6 h-4 object-cover rounded"
  onError={(e) => {
    (e.target as HTMLImageElement).style.display = 'none';
  }}
/>
```

---

## Part 8: Backward Compatibility & Migration

### 8.1 Handle Existing UserLocations Documents

**Issue:** Existing `userLocations` documents don't have `counties` array.

**Solution:** Always check if `counties` exists before accessing:

```typescript
// In recordLocationVisit
if (!data.counties) {
  data.counties = [];
}

// In useCustomization hook
...(locations.counties || []).map(...)  // Safe access with ||

// In LocationSettingsSection
{userLocations.counties?.length || 0}  // Optional chaining
```

### 8.2 Migration Script (Optional)

**File:** `scripts/migrate-user-locations-counties.js` (NEW - Optional)

```javascript
/**
 * Migration Script: Add counties array to existing userLocations documents
 * 
 * This script ensures all userLocations documents have the counties array initialized.
 * Run once after deploying the counties feature.
 * 
 * Usage: node scripts/migrate-user-locations-counties.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrateUserLocations() {
  const usersRef = db.collection('userLocations');
  const snapshot = await usersRef.get();
  
  console.log(`Found ${snapshot.size} userLocations documents`);
  
  let updated = 0;
  let skipped = 0;
  
  const batch = db.batch();
  let batchCount = 0;
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    
    // Only update if counties array is missing
    if (!data.counties) {
      batch.update(doc.ref, {
        counties: [],
      });
      batchCount++;
      updated++;
      
      // Firestore batch limit is 500
      if (batchCount >= 500) {
        batch.commit();
        batchCount = 0;
      }
    } else {
      skipped++;
    }
  });
  
  // Commit remaining updates
  if (batchCount > 0) {
    await batch.commit();
  }
  
  console.log(`\n✓ Migration complete!`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Total: ${snapshot.size}`);
}

migrateUserLocations().catch(console.error);
```

---

## Part 9: Performance Considerations

### 9.1 FlagGrid Performance

**Issue:** Users could have 100+ counties, causing performance issues.

**Solutions:**

1. **Lazy Loading:** Images already use `loading="lazy"` (line 107 in FlagGrid.tsx)
2. **Virtual Scrolling:** For 50+ counties, consider virtual scrolling
3. **Pagination:** Show counties in pages of 50
4. **Search/Filter:** Allow users to filter counties by state

**Enhanced FlagGrid with Performance:**

```typescript
// In FlagGrid.tsx, add state for filtering
const [countyFilter, setCountyFilter] = useState<string>('');  // Filter by state

// Filter counties by state if filter is set
const filteredCounties = useMemo(() => {
  if (!countyFilter) return counties;
  return counties.filter(c => c.code.startsWith(`US-${countyFilter}-`));
}, [counties, countyFilter]);

// Add state filter dropdown for counties
{counties.length > 20 && (
  <div className="mb-2">
    <select
      value={countyFilter}
      onChange={(e) => setCountyFilter(e.target.value)}
      className="text-sm px-2 py-1 rounded"
    >
      <option value="">All States</option>
      {Array.from(new Set(counties.map(c => c.code.split('-')[1]))).map(state => (
        <option key={state} value={state}>{state}</option>
      ))}
    </select>
  </div>
)}
```

### 9.2 Image Loading Performance

**Current:** FlagGrid uses `loading="lazy"` which is good.

**Enhancement:** Consider preloading selected flag:

```typescript
// Preload selected flag image
useEffect(() => {
  if (selectedCode) {
    const img = new Image();
    img.src = getFlagUrl(selectedCode);
  }
}, [selectedCode]);
```

### 9.3 County Name Lookup Performance

**Issue:** Loading 3,143 county names could be slow.

**Solution:** 
- Generate static mapping at build time (see Part 5.3)
- Use tree-shaking to only include used counties
- Or lazy-load county names on demand

---

## Part 10: Error Handling & Edge Cases

### 10.1 Missing County Images

**Current:** FlagGrid already handles this (lines 98-101):
```typescript
{imgError ? (
  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
    <span className="text-xs font-mono text-gray-500">{flag.code}</span>
  </div>
) : (
  <img ... onError={() => setImgError(true)} />
)}
```

**Enhancement:** Add fallback to default badge:

```typescript
const [imgError, setImgError] = useState(false);
const [useFallback, setUseFallback] = useState(false);

// In img onError:
onError={() => {
  if (!useFallback) {
    // Try fallback badge
    setUseFallback(true);
  } else {
    // Both failed, show code
    setImgError(true);
  }
}}

// In render:
{imgError ? (
  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
    <span className="text-xs font-mono text-gray-500">{flag.code}</span>
  </div>
) : (
  <img
    src={useFallback ? '/badges/default.svg' : getFlagUrl(flag.code)}
    alt={flag.name}
    className="w-full h-full object-cover"
    loading="lazy"
    onError={() => {
      if (!useFallback) {
        setUseFallback(true);
      } else {
        setImgError(true);
      }
    }}
  />
)}
```

### 10.2 Invalid County Codes

**Validation in recordLocationVisit:**
```typescript
// Validate county code format
if (!/^US-[A-Z]{2}-\d{5}$/.test(countyCode)) {
  console.warn('Invalid county code format:', countyCode);
  // Don't throw - just skip county recording
  return; // Skip county recording
}
```

### 10.3 County Detection Failures

**Graceful Degradation:**
- If county detection fails, still record country/state
- Don't block location recording if county unavailable
- Log warnings but don't throw errors

---

## Part 11: Testing Strategy

### 11.1 Unit Tests

**File:** `__tests__/lib/customization/countyDetection.test.ts` (NEW)

```typescript
import { 
  generateCountyCode, 
  parseCountyCode,
  isValidCountyCode 
} from '@/lib/customization/countyDetection';

describe('County Detection', () => {
  describe('generateCountyCode', () => {
    test('generates county code correctly', () => {
      expect(generateCountyCode('CA', '06037')).toBe('US-CA-06037');
    });
    
    test('throws on invalid state code', () => {
      expect(() => generateCountyCode('XX', '06037')).toThrow();
    });
    
    test('throws on invalid FIPS code', () => {
      expect(() => generateCountyCode('CA', '123')).toThrow();
    });
  });
  
  describe('parseCountyCode', () => {
    test('parses county code correctly', () => {
      const result = parseCountyCode('US-CA-06037');
      expect(result).toEqual({ stateCode: 'CA', fipsCode: '06037' });
    });
    
    test('returns null for invalid format', () => {
      expect(parseCountyCode('US-CA')).toBeNull();
      expect(parseCountyCode('CA-06037')).toBeNull();
      expect(parseCountyCode('US-CA-123')).toBeNull(); // Invalid FIPS length
    });
  });
  
  describe('isValidCountyCode', () => {
    test('validates correct format', () => {
      expect(isValidCountyCode('US-CA-06037')).toBe(true);
      expect(isValidCountyCode('US-TX-48453')).toBe(true);
    });
    
    test('rejects invalid formats', () => {
      expect(isValidCountyCode('US-CA')).toBe(false);
      expect(isValidCountyCode('CA-06037')).toBe(false);
      expect(isValidCountyCode('US-CA-123')).toBe(false);
    });
  });
});
```

**File:** `__tests__/lib/customization/flags.test.ts` (NEW)

```typescript
import { getFlagUrl, parseFlagCode, getFlagDisplayName } from '@/lib/customization/flags';

describe('Flag Functions', () => {
  describe('getFlagUrl', () => {
    test('returns county badge URL for county code', () => {
      expect(getFlagUrl('US-CA-06037')).toBe('/badges/county/US-CA-06037.svg');
    });
    
    test('returns state flag URL for state code', () => {
      expect(getFlagUrl('US-CA')).toBe('/flags/states/ca.svg');
    });
    
    test('returns country flag URL for country code', () => {
      expect(getFlagUrl('US')).toBe('/flags/countries/us.svg');
    });
  });
  
  describe('parseFlagCode', () => {
    test('identifies county type', () => {
      expect(parseFlagCode('US-CA-06037')).toEqual({ type: 'county', code: 'US-CA-06037' });
    });
    
    test('identifies state type', () => {
      expect(parseFlagCode('US-CA')).toEqual({ type: 'state', code: 'CA' });
    });
    
    test('identifies country type', () => {
      expect(parseFlagCode('US')).toEqual({ type: 'country', code: 'US' });
    });
  });
});
```

### 11.2 Integration Tests

**File:** `__tests__/lib/customization/geolocation.test.ts` (EXTEND)

```typescript
import { recordLocationVisit } from '@/lib/customization/geolocation';

describe('recordLocationVisit', () => {
  test('records county when provided', async () => {
    const location = {
      country: { code: 'US', name: 'United States' },
      state: { code: 'CA', name: 'California' },
    };
    
    await recordLocationVisit(
      'test-user',
      location,
      'US-CA-06037',  // NEW
      'Los Angeles'    // NEW
    );
    
    // Verify county was recorded
    const userLocations = await getUserLocations('test-user');
    expect(userLocations.counties).toHaveLength(1);
    expect(userLocations.counties[0].code).toBe('US-CA-06037');
  });
  
  test('does not record county for non-US locations', async () => {
    const location = {
      country: { code: 'CA', name: 'Canada' },
      state: null,
    };
    
    await recordLocationVisit(
      'test-user',
      location,
      'US-CA-06037',  // County provided but should be ignored
      'Los Angeles'
    );
    
    const userLocations = await getUserLocations('test-user');
    expect(userLocations.counties).toBeUndefined();
  });
});
```

### 11.3 Component Tests

**File:** `__tests__/components/vx2/customization/FlagGrid.test.tsx` (EXTEND)

```typescript
import { render, screen } from '@testing-library/react';
import { FlagGrid } from '@/components/vx2/customization/FlagGrid';

describe('FlagGrid', () => {
  test('displays counties section when counties present', () => {
    const flags = [
      { code: 'US', name: 'United States', type: 'country' },
      { code: 'US-CA-06037', name: 'Los Angeles', type: 'county' },
    ];
    
    render(<FlagGrid flags={flags} onSelect={() => {}} />);
    
    expect(screen.getByText('US Counties')).toBeInTheDocument();
    expect(screen.getByText('Los Angeles')).toBeInTheDocument();
  });
  
  test('handles missing county images gracefully', () => {
    const flags = [
      { code: 'US-CA-06037', name: 'Los Angeles', type: 'county' },
    ];
    
    render(<FlagGrid flags={flags} onSelect={() => {}} />);
    
    // Should show fallback (code) when image fails
    const img = screen.getByAltText('Los Angeles');
    fireEvent.error(img);
    
    expect(screen.getByText('US-CA-06037')).toBeInTheDocument();
  });
});
```

---

## Part 12: Implementation Checklist

### Phase 1: Signup Address & County Detection (4-6 hours)

- [ ] Add address field to RegistrationModal.js
- [ ] Add address field to signup API endpoint
- [ ] Create addressGeocoding.ts service
- [ ] Implement geocodeAddressToCounty function
- [ ] Integrate county detection in signup flow (don't ask user directly)
- [ ] Test geocoding with various address formats
- [ ] Handle geocoding failures gracefully (don't fail signup)

### Phase 2: Type Extensions (2-3 hours)

- [ ] Extend `UserLocations` interface to include `counties?: LocationRecord[]`
- [ ] Extend `FlagOption` type to include `'county'`
- [ ] Extend `CustomizationPreferences` to include `badgesEnabled` (customization option)
- [ ] Create `countyDetection.ts` service file
- [ ] Add county code generation/parsing/validation functions
- [ ] Write unit tests for county detection functions

### Phase 3: Location Tracking (3-4 hours)

- [ ] Update `recordLocationVisit()` to accept and record counties
- [ ] Add county validation in `recordLocationVisit()`
- [ ] Update all call sites of `recordLocationVisit()`:
  - [ ] `pages/api/auth/signup.js` (with address geocoding)
  - [ ] `components/vx2/auth/context/AuthContext.tsx`
  - [ ] `components/vx2/customization/hooks/useCustomization.ts` (2 locations)
- [ ] Test county recording in Firestore
- [ ] Write integration tests

### Phase 4: Draft Location Tracking (6-8 hours)

- [ ] Create draftLocationTracking.ts service
- [ ] Implement startDraftLocationTracking for slow drafts
- [ ] Implement stopDraftLocationTracking
- [ ] Integrate draft start location recording (both slow and fast)
- [ ] Integrate periodic location updates for slow drafts (watchPosition)
- [ ] Test location tracking during active drafts
- [ ] Handle location permission denial gracefully

### Phase 5: User Research Integration (3-4 hours)

- [ ] Create draftLocationResearch.ts service
- [ ] Implement recordDraftLocationForResearch
- [ ] Create Firestore collections for slow/fast draft locations
- [ ] Add Firestore indexes
- [ ] Integrate with existing userMetrics.js
- [ ] Update exportMetricsForResearch to include draft locations
- [ ] Test data separation between slow and fast drafts
- [ ] Verify integration with existing user research system (no new app-open functions)

### Phase 6: Flag Display (3-4 hours)

- [ ] Add `badgesEnabled` to `CustomizationPreferences` (customization option, not privacy)
- [ ] Update `useCustomization` hook to include counties in flags
- [ ] Update hook to filter ALL badges based on `badgesEnabled` flag (countries, states, counties)
- [ ] Update condition to check for counties
- [ ] Add counties to dev flags for testing
- [ ] Update `FlagGrid` component to display counties section (only if display enabled)
- [ ] Add badge display toggle to ProfileCustomizationPage (framed as personalization, not privacy)
- [ ] Group counties by state in FlagGrid for better organization
- [ ] Add performance optimizations (filtering, pagination if needed)
- [ ] Update `getFlagUrl()` to handle county codes
- [ ] Update `parseFlagCode()` to handle county codes
- [ ] Update `getFlagDisplayName()` to handle county names
- [ ] Create county name generation script
- [ ] Generate county name mapping
- [ ] Write component tests

### Phase 7: Location Settings (1-2 hours)

- [ ] Update `LocationSettingsSection` to show counties count
- [ ] Update location image URL logic to handle counties
- [ ] Test location settings display

### Phase 8: County Badge Deletion (4-5 hours)

- [ ] Create `badgeDeletion.ts` service with `deleteCountyBadge` function
- [ ] Add `restoreCountyBadge` function for undo functionality
- [ ] Implement press/hold gesture for county badges (like iOS app deletion)
- [ ] Add longer hold duration (1.5 seconds) to prevent accidental deletion
- [ ] Add visual feedback during hold (shaking animation, progress indicator)
- [ ] Update deletion confirmation message: "If you draft here again, you will earn the badge again"
- [ ] Implement undo button at bottom of badge page after deletion
- [ ] Add 60 second countdown timer for undo button
- [ ] Add explanation text under undo button about timer expiration
- [ ] Implement undo functionality to restore deleted badge
- [ ] Test county badge deletion
- [ ] Test undo functionality within 60 second window
- [ ] Test undo button disappearing after timer expires
- [ ] Verify countries cannot be deleted (no press/hold on countries)
- [ ] Test deletion persistence after undo timer expires
- [ ] Test re-earning deleted county badge by drafting from that location
- [ ] Verify deletion functions as if user never drafted from that location

### Phase 9: Remove Educational Text (1 hour)

- [ ] Add check for 2+ country flags in ProfileCustomizationPage
- [ ] Hide educational text about earning flags after second country earned
- [ ] Test text visibility based on country count
- [ ] Apply to all relevant UI components

### Phase 10: County Data (2-3 hours)

- [ ] Source county data (FIPS codes, names, population)
- [ ] Create `data/counties.json` with all 3,143 counties
- [ ] Create script to generate county name mapping
- [ ] Generate `lib/customization/countyNames.ts`
- [ ] Verify all 3,143 counties are accounted for
- [ ] Validate FIPS codes and state codes

### Phase 11: Image Processing (8-12 hours)

- [ ] Source county seal images (3,143 counties)
- [ ] Create image processing script
- [ ] Process all county seals into badge format
- [ ] Upload to `public/badges/county/`
- [ ] Create fallback badge image (`/badges/default.svg`)
- [ ] Verify all images are valid SVG/PNG
- [ ] Test image loading and error handling

### Phase 12: County Detection Enhancement (4-6 hours)

- [ ] Research and select county detection method
- [ ] Implement reverse geocoding or enhanced API
- [ ] Add browser geolocation fallback
- [ ] Add manual county selection UI (optional)
- [ ] Test county detection accuracy
- [ ] Handle detection failures gracefully

### Phase 13: Backward Compatibility (1-2 hours)

- [ ] Ensure all code handles missing `counties` array
- [ ] Test with existing userLocations documents
- [ ] Create migration script (optional)
- [ ] Run migration script if needed

### Phase 14: Testing & Polish (4-6 hours)

- [ ] Test signup with address geocoding
- [ ] Test draft start location recording
- [ ] Test slow draft periodic location updates
- [ ] Test fast draft location recording (should only record at start)
- [ ] Test county badge unlocking from all sources
- [ ] Test badge display toggle (customization option)
- [ ] Test county badge deletion and undo
- [ ] Test undo timer expiration
- [ ] Test re-earning deleted county badge
- [ ] Verify data separation between slow and fast drafts
- [ ] Test county display in FlagGrid
- [ ] Test county selection in customization
- [ ] Test county display in draft room
- [ ] Verify all county images load correctly
- [ ] Test error handling (missing images, invalid codes)
- [ ] Performance testing with many counties (100+)
- [ ] UI/UX polish
- [ ] Mobile responsiveness testing
- [ ] Write comprehensive test suite

### Phase 15: Tags System (Deferred - No users will earn tags this year)

- [ ] Design tag data structure (separate from badges)
- [ ] Create UserTags type and collection
- [ ] Implement tag earning logic (150 drafts, 500 drafts)
- [ ] Create tag display component (separate from badge section)
- [ ] Note: Can be deferred since max draft limit is 150 this year

### Phase 16: Documentation (1-2 hours)

- [ ] Update code comments
- [ ] Document county code format
- [ ] Document county detection strategy
- [ ] Document badge display control (customization, not privacy)
- [ ] Document county deletion and undo functionality
- [ ] Document draft location tracking integration
- [ ] Update API documentation if needed
- [ ] Create developer guide for county badges

---

## Part 13: County Detection Strategy (Detailed)

### Current Limitation

IP geolocation APIs (ipapi.co, BigDataCloud, ipinfo.io) do **not** provide county-level data. They typically provide:
- Country ✓
- State/Region (for US) ✓
- City ✓
- **NOT County** ✗

### Solutions (in priority order)

#### Option 1: Reverse Geocoding API (Recommended for Phase 2)

Use coordinates to get county via reverse geocoding:

**Services:**
- **Google Maps Geocoding API** (paid, most accurate)
  - Cost: $5 per 1,000 requests
  - Accuracy: Very high
  - Requires API key
  
- **Mapbox Geocoding API** (paid, good accuracy)
  - Cost: $0.50 per 1,000 requests (after free tier)
  - Accuracy: High
  - Requires API key
  
- **OpenStreetMap Nominatim** (free, less accurate)
  - Cost: Free (with rate limits)
  - Accuracy: Medium
  - Rate limit: 1 request/second

**Implementation:**

```typescript
// In countyDetection.ts
export async function detectCountyFromCoordinates(
  lat: number,
  lng: number
): Promise<CountyInfo | null> {
  try {
    // Option A: Mapbox (recommended for cost/accuracy balance)
    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (MAPBOX_TOKEN) {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=district`
      );
      const data = await response.json();
      
      // Extract county from features
      const countyFeature = data.features.find((f: any) => 
        f.place_type.includes('district') && 
        f.context?.some((c: any) => c.id?.startsWith('district'))
      );
      
      if (countyFeature) {
        // Extract FIPS code and county name
        // Mapbox returns county as "district" in US
        const countyName = countyFeature.text;
        const fipsCode = countyFeature.properties?.fips_code;
        const stateCode = countyFeature.context?.find((c: any) => 
          c.id?.startsWith('region')
        )?.short_code;
        
        if (fipsCode && stateCode) {
          return {
            code: generateCountyCode(stateCode, fipsCode),
            name: countyName,
            fipsCode,
            stateCode,
          };
        }
      }
    }
    
    // Option B: Google Maps (fallback)
    const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (GOOGLE_API_KEY) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}&result_type=administrative_area_level_2`
      );
      const data = await response.json();
      
      if (data.results.length > 0) {
        const result = data.results[0];
        const countyName = result.address_components.find((c: any) =>
          c.types.includes('administrative_area_level_2')
        )?.long_name;
        
        // Would need to map county name to FIPS code
        // This requires a lookup table
      }
    }
    
    return null;
  } catch (error) {
    console.error('County detection from coordinates failed:', error);
    return null;
  }
}

// Enhanced detectCounty function
export async function detectCounty(
  location: GeolocationResult
): Promise<CountyInfo | null> {
  // Must be US location with state
  if (!location.country || location.country.code !== 'US') {
    return null;
  }
  
  if (!location.state) {
    return null;
  }
  
  // Try to get coordinates from browser geolocation
  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        });
      });
      
      const { latitude, longitude } = position.coords;
      return await detectCountyFromCoordinates(latitude, longitude);
    } catch (error) {
      // User denied or error - continue to other methods
      console.log('Browser geolocation failed:', error);
    }
  }
  
  // TODO: Phase 2 - Implement reverse geocoding with IP-based coordinates
  // For now, return null
  return null;
}
```

#### Option 2: Enhanced IP Geolocation Service

Use a paid service that provides county data:
- **MaxMind GeoIP2** (paid, accurate)
  - Cost: $70/month for GeoIP2 City (includes county)
  - Accuracy: High
  - Requires server-side implementation
  
- **IP2Location** (paid, good coverage)
  - Cost: $49/month for LITE database
  - Accuracy: Medium-High
  - Can be used client-side or server-side

#### Option 3: Browser Geolocation API

Request user permission for precise location:
```typescript
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;
    // Use reverse geocoding with coordinates
  },
  (error) => {
    // User denied or error
  },
  {
    enableHighAccuracy: true,
    timeout: 5000,
  }
);
```

**Pros:**
- Most accurate
- Free (no API costs)
- Works with reverse geocoding

**Cons:**
- Requires user permission
- May be denied by user
- Privacy concerns

#### Option 4: Manual Selection

Allow users to manually select their county from a dropdown.

**Implementation:**

```typescript
// Component for manual county selection
export function CountySelector({
  stateCode,
  onSelect,
}: {
  stateCode: string;
  onSelect: (countyCode: string, countyName: string) => void;
}) {
  const [counties, setCounties] = useState<CountyInfo[]>([]);
  
  useEffect(() => {
    // Load counties for state
    loadCountiesForState(stateCode).then(setCounties);
  }, [stateCode]);
  
  return (
    <select onChange={(e) => {
      const county = counties.find(c => c.code === e.target.value);
      if (county) onSelect(county.code, county.name);
    }}>
      <option value="">Select County</option>
      {counties.map(county => (
        <option key={county.code} value={county.code}>
          {county.name} County
        </option>
      ))}
    </select>
  );
}
```

**Recommended Approach:**
- **Phase 1:** Return null (county detection not implemented)
- **Phase 2:** Add browser geolocation + reverse geocoding (Mapbox)
- **Phase 3:** Add manual selection as fallback
- **Phase 4:** Consider enhanced IP service for automatic detection

---

## Part 14: File Structure Summary

```
lib/
  customization/
    types.ts                    # EXTEND - Add counties to UserLocations, badgesEnabled to CustomizationPreferences
    geolocation.ts              # EXTEND - Add county parameter to recordLocationVisit
    flags.ts                    # EXTEND - Add county URL/name handling
    countyDetection.ts          # NEW - County detection service (from coordinates)
    addressGeocoding.ts         # NEW - Address geocoding for signup county detection
    badgeDeletion.ts            # NEW - County badge deletion and restore (undo)
    draftLocationTracking.ts    # NEW - Draft location tracking (start + periodic for slow)
    draftLocationResearch.ts    # NEW - Draft location research integration (slow/fast separation)
    countyNames.ts              # NEW - Generated county name mapping
    storage.ts                  # NO CHANGE - Already handles UserLocations
    patterns.ts                 # NO CHANGE - Uses getFlagUrl (will work automatically)

components/
  vx2/
    customization/
      FlagGrid.tsx              # EXTEND - Add counties section, badge display control, deletion with undo
      ProfileCustomizationPage.tsx  # EXTEND - Badge display toggle, educational text removal
      hooks/
        useCustomization.ts     # EXTEND - Include counties in flags, filter by badgesEnabled
    location/
      LocationSettingsSection.tsx  # EXTEND - Show counties count
    draft-room/
      hooks/
        useDraftRoom.ts         # EXTEND - Draft start location tracking
    draft-logic/
      hooks/
        useDraftEngine.ts       # EXTEND - Draft start location tracking

pages/
  api/
    auth/
      signup.js                 # EXTEND - Address geocoding, county detection call
    draft/
      submit-pick.ts            # EXTEND - Draft start location recording

components/
  vx2/
    auth/
      context/
        AuthContext.tsx         # EXTEND - Address handling, county detection call
  RegistrationModal.js          # EXTEND - Add address input field

public/
  badges/
    county/                     # NEW - County badge images (3,143 files)
    default.svg                 # NEW - Fallback badge
  flags/
    countries/                  # EXISTING
    states/                     # EXISTING

scripts/
  process-county-seals.js      # NEW - Image processing
  generate-county-names.js     # NEW - Generate county name mapping
  migrate-user-locations-counties.js  # NEW - Optional migration script

data/
  counties.json                 # NEW - County data source (3,143 entries)

__tests__/
  lib/
    customization/
      countyDetection.test.ts   # NEW - Unit tests
      addressGeocoding.test.ts  # NEW - Address geocoding tests
      badgeDeletion.test.ts     # NEW - Deletion and undo tests
      flags.test.ts             # NEW - Flag function tests
      geolocation.test.ts       # EXTEND - Test county recording
  components/
    vx2/
      customization/
        FlagGrid.test.tsx       # EXTEND - Test county display, deletion, undo
```

**Firestore Collections:**
```
userLocations/{userId}                    # EXISTING - Extended with counties array
userResearch_slowDraftLocations/{docId}   # NEW - Slow draft location events
userResearch_fastDraftLocations/{docId}  # NEW - Fast draft location events
```

---

## Part 15: Key Differences from Original Plan

### What We're NOT Creating

1. **No new `userBadges` collection** - Using existing `userLocations`
2. **No new `badgeCatalog` collection** - Counties are just flags
3. **No separate badge service** - Using existing flag system
4. **No new API endpoints** - Flags are already handled
5. **No new badge components** - Using existing `FlagGrid`
6. **No badge rarity system** - Counties are just location-based flags
7. **No badge earning logic** - Counties unlock like countries/states
8. **No tag system in badges** - Tags (like "Experienced Drafter") are separate from badges
9. **No new app-open functions** - Integrate with existing user research system

### Tags vs Badges

**IMPORTANT:** Tags are NOT badges. They are a completely separate system.

**Tags:**
- Achievement-based (e.g., "Experienced Drafter" - 150 drafts, 500 drafts)
- Separate data structure (`UserTags` collection - future)
- Separate UI location (not in badge section)
- Can be deferred (no user can reach 150 drafts this year - max limit is 150)
- Two levels: 150 drafts (Level 1), 500 drafts (Level 2)

**Badges:**
- Location-based (countries, states, counties)
- Stored in `userLocations` collection
- Displayed in `FlagGrid` component
- Badge display control (unified `badgesEnabled` flag - customization option, not privacy)
- Counties can be deleted (press/hold gesture, undo with 60s timer)
- Countries cannot be deleted

### What We ARE Extending

1. **Extend `UserLocations`** - Add `counties` array
2. **Extend `FlagOption`** - Add `'county'` type
3. **Extend `recordLocationVisit()`** - Accept county parameters
4. **Extend `useCustomization` hook** - Include counties in flags
5. **Extend `FlagGrid`** - Display counties section
6. **Extend flag URL/name functions** - Handle county codes
7. **Extend location settings** - Show counties count
8. **Update all call sites** - 4 locations that call `recordLocationVisit()`

### Benefits of This Approach

- **Much simpler** - Reuse existing infrastructure
- **Consistent UX** - Counties appear alongside countries/states
- **Less code** - ~20-30 hours vs 40-60 hours
- **Faster implementation** - No new systems to build
- **Easier maintenance** - One system, not two
- **Backward compatible** - Existing users work without changes
- **Same patterns** - Follows existing code patterns

---

## Part 16: Edge Cases & Error Handling

### 16.1 Missing County Images

**Handling:**
- FlagGrid already has `imgError` state
- Shows county code as fallback
- Could enhance to show default badge image

### 16.2 Invalid County Codes

**Handling:**
- Validate format in `recordLocationVisit()`
- Log warning but don't throw
- Skip county recording if invalid

### 16.3 County Detection Failures

**Handling:**
- Don't block location recording
- Still record country/state
- Log warnings for debugging
- User can manually select later (if implemented)

### 16.4 Many Counties (Performance)

**Handling:**
- Lazy loading images (already implemented)
- Consider pagination for 50+ counties
- Add state filter for counties
- Virtual scrolling if needed

### 16.5 Backward Compatibility

**Handling:**
- Always check if `counties` exists
- Use optional chaining (`counties?.length`)
- Initialize `counties` array in new documents
- Migration script available if needed

### 16.6 County Name Lookup Failures

**Handling:**
- Fallback to county code if name not found
- Generate names at build time (reliable)
- Cache county names to avoid repeated lookups

### 16.7 Address Geocoding Failures

**Handling:**
- Don't fail signup if geocoding fails
- Fallback: User can still sign up, county will be unlocked later via geolocation
- Log geocoding failures for debugging
- Try multiple geocoding services (BigDataCloud → Nominatim)

### 16.8 Draft Location Tracking Errors

**Handling:**
- Log errors but don't stop tracking
- Fallback: Continue tracking, skip failed updates
- UX: Silent failures, don't interrupt user experience
- Handle location permission denial gracefully (don't block draft)

### 16.9 County Badge Deletion Edge Cases

**Handling:**
- User cancels press/hold before completion → No action taken
- User deletes county → Undo button appears with 60s timer
- Timer expires → Undo button disappears, deletion permanent
- User clicks undo → Badge restored immediately
- Multiple deletions → Only show undo for most recent deletion
- User navigates away → Undo timer continues, button persists on return (if within 60s)

### 16.10 Educational Text Visibility

**Handling:**
- Check if user has 2+ country flags
- Hide educational text if condition met
- Show educational text if user has 0-1 country flags
- Apply to all relevant UI components consistently

---

## Part 17: Future Enhancements

### 17.1 County Detection Improvements

- Implement reverse geocoding (Phase 2)
- Add browser geolocation fallback
- Add manual county selection UI
- Consider enhanced IP geolocation service

### 17.2 Performance Optimizations

- Virtual scrolling for large county lists
- County search/filter functionality
- Lazy load county names
- Image preloading for selected county

### 17.3 Additional Features

- County statistics (most visited, etc.)
- County grouping by state in FlagGrid
- County badges in user profile
- County leaderboards (most counties collected)

---

## Part 18: Testing Checklist

### Unit Tests

- [ ] `generateCountyCode()` - Valid inputs
- [ ] `generateCountyCode()` - Invalid inputs (throws)
- [ ] `parseCountyCode()` - Valid formats
- [ ] `parseCountyCode()` - Invalid formats (returns null)
- [ ] `isValidCountyCode()` - Valid/invalid codes
- [ ] `getFlagUrl()` - County codes
- [ ] `getFlagUrl()` - State codes (regression)
- [ ] `getFlagUrl()` - Country codes (regression)
- [ ] `parseFlagCode()` - All three types
- [ ] `getFlagDisplayName()` - County names

### Integration Tests

- [ ] `recordLocationVisit()` - Records county
- [ ] `recordLocationVisit()` - Skips invalid county codes
- [ ] `recordLocationVisit()` - Handles missing counties array
- [ ] `geocodeAddressToCounty()` - Geocodes address to county
- [ ] `geocodeAddressToCounty()` - Handles geocoding failures gracefully
- [ ] `deleteCountyBadge()` - Deletes county from userLocations
- [ ] `restoreCountyBadge()` - Restores deleted county badge
- [ ] `startDraftLocationTracking()` - Starts tracking for slow drafts
- [ ] `stopDraftLocationTracking()` - Stops tracking correctly
- [ ] `recordDraftLocationForResearch()` - Records to correct collection (slow/fast)
- [ ] `useCustomization` - Includes counties in flags (only if badgesEnabled)
- [ ] `useCustomization` - Filters all badges based on badgesEnabled
- [ ] `FlagGrid` - Displays counties section (only if badgesEnabled)
- [ ] `FlagGrid` - Shows press/hold on counties only
- [ ] `FlagGrid` - Shows undo button after deletion
- [ ] County badge image loading
- [ ] County badge fallback on error

### E2E Tests

- [ ] User signs up with address → County geocoded → County badge unlocked
- [ ] User signs up without address → County unlocked later via geolocation
- [ ] User visits new location → County detected → County badge unlocked
- [ ] User starts draft → Location recorded → County badge unlocked (if US)
- [ ] User drafts during slow draft (moving) → Periodic location updates → New counties unlocked
- [ ] User enables badge display → All badges appear
- [ ] User disables badge display → All badges hidden
- [ ] User presses/holds county badge → Deletion confirmation → Badge deleted
- [ ] User deletes county badge → Undo button appears → Timer counts down
- [ ] User clicks undo within 60s → Badge restored
- [ ] User lets undo timer expire → Undo button disappears → Deletion permanent
- [ ] User deletes county → Drafts from that location again → Badge re-earned
- [ ] User earns second country flag → Educational text hidden
- [ ] User selects county badge → Appears in draft room
- [ ] User with many counties → FlagGrid performs well
- [ ] Missing county image → Fallback displays correctly
- [ ] Countries cannot be deleted (no press/hold on countries)

---

## Part 19: Deployment Considerations

### 19.1 Firestore Rules

**File:** `firestore.rules` (NO CHANGES NEEDED)

The existing rules for `userLocations` collection already allow users to write to their own document. Counties are just another field in the same document, so no rule changes needed.

### 19.2 Environment Variables

**New Variables (for county detection - Phase 2):**
- `NEXT_PUBLIC_MAPBOX_TOKEN` - For Mapbox reverse geocoding (optional)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - For Google Maps geocoding (optional)

**No variables needed for Phase 1** (county detection returns null)

### 19.3 Build Process

**New Build Step:**
```json
// package.json
{
  "scripts": {
    "generate:county-names": "node scripts/generate-county-names.js",
    "prebuild": "npm run generate:county-names"
  }
}
```

### 19.4 Image Assets

- 3,143 county badge images need to be added to `public/badges/county/`
- Fallback badge image at `public/badges/default.svg`
- Total size: ~50-100 MB (depending on format/quality)

### 19.5 Monitoring

- Track county detection success rate (address geocoding, draft locations)
- Monitor county badge image load times
- Track county unlocking events (signup, draft start, draft updates)
- Monitor FlagGrid performance with many counties
- Track county badge deletion events
- Monitor undo button usage (how often users undo deletions)
- Track draft location recording (slow vs fast separation)
- Monitor geocoding API rate limits and failures

---

## Part 20: Rollout Strategy

### Phase 1: Foundation (Week 1)
- Type extensions
- Location tracking updates
- Flag display updates
- Basic testing

### Phase 2: Data & Images (Week 2)
- County data collection
- Image processing
- County name mapping
- Image upload

### Phase 3: Detection (Week 3)
- County detection implementation
- Testing and refinement
- Manual selection (if needed)

### Phase 4: Polish & Launch (Week 4)
- Performance optimization
- UI/UX polish
- Comprehensive testing
- Documentation
- Deployment

---

## Conclusion

This plan extends the existing flag/badge system to support county badges, reusing all existing infrastructure. The implementation is much simpler than creating a new badge system and integrates seamlessly with the current location-based flag unlocking mechanism.

**Key Points:**
- Extends existing system, doesn't create new one
- **Badges are customization options** (unified `badgesEnabled` flag - not privacy/security)
- **County badge deletion** available (press/hold gesture, 1.5s duration, undo with 60s timer, allows re-earning, counties only)
- **Educational text removed** after second country flag earned
- **Draft location tracking** integrated with existing user research system
- **Address geocoding** for signup (don't ask user directly)
- **Tags are separate from badges** (different system, can be deferred)
- Backward compatible with existing users
- Handles all edge cases and errors gracefully
- Performance optimized for large county lists
- Comprehensive testing strategy
- Clear implementation phases

**Important Clarifications:**
- **Badges** = Location-based (countries, states, counties) - Display control for customization
- **Badge Deletion** = Counties can be deleted using press/hold gesture (like iOS app deletion), countries cannot be deleted
- **Deletion Behavior** = Functions as if user never drafted from that location - can be re-earned naturally
- **Undo Functionality** = 60 second countdown timer with explanation text, restore deleted badge
- **Suspicion Prevention** = Missing badge looks normal if it can be re-earned by drafting from that location
- **Privacy Principle** = "Never say welcome back" - respect relationship privacy
- **Draft Tracking** = Record at start (both slow/fast), periodic updates for slow drafts (users may be moving)
- **Data Separation** = Separate Firestore collections for slow vs fast draft locations
- **User Research** = Integrate with existing system, don't create new functions on app open
- **Tags** = Achievement-based (e.g., "Experienced Drafter" - 150/500 drafts) - Separate system, can be deferred

**Next Steps:**
1. Review and approve this comprehensive plan
2. Begin Phase 1 (signup address & county detection)
3. Implement type extensions and location tracking
4. Add draft location tracking (start + periodic for slow)
5. Integrate with user research system
6. Implement badge display control (customization option)
7. Add county display to FlagGrid (with badge control)
8. Implement county badge deletion with undo
9. Add educational text removal
10. Process county seal images
11. Enhance county detection (reverse geocoding)
12. Test and deploy

**Implementation Priority:**
- **High:** Signup address geocoding, badge display control, county deletion
- **Medium:** Draft location tracking, user research integration
- **Low:** County detection enhancement (can be phased)
- **Deferred:** Tags system (no users will earn tags this year)

**Estimated Total Time:** 26-35 hours (includes address geocoding, draft location tracking, badge deletion with undo, and educational text removal)  
**Priority:** Medium (can be implemented incrementally)

**Implementation Order:**
1. Phase 1: Signup address & county detection (4-6 hours)
2. Phase 2: Type extensions (2-3 hours)
3. Phase 3: Location tracking updates (3-4 hours)
4. Phase 4: Draft location tracking (6-8 hours)
5. Phase 5: User research integration (3-4 hours)
6. Phase 6: Flag display with badge control (3-4 hours)
7. Phase 7: Location settings (1-2 hours)
8. Phase 8: County badge deletion with undo (4-5 hours)
9. Phase 9: Educational text removal (1 hour)
10. Phase 10-12: County data, images, detection enhancement (14-21 hours)
11. Phase 13-14: Backward compatibility, testing (5-8 hours)
12. Phase 15: Tags (deferred - no users will earn tags this year)
13. Phase 16: Documentation (1-2 hours)

---

## Appendix: Quick Reference

### County Code Format
- Pattern: `US-{stateCode}-{fipsCode}`
- Example: `US-CA-06037` (Los Angeles County, CA)
- Validation: `/^US-[A-Z]{2}-\d{5}$/`

### File Paths
- County badges: `/badges/county/US-{stateCode}-{fipsCode}.svg`
- County data: `/data/counties.json`
- County names: `lib/customization/countyNames.ts` (generated)

### Key Functions
- `geocodeAddressToCounty(address, countryCode)` - Geocode address to county (signup)
- `generateCountyCode(stateCode, fipsCode)` - Create county code
- `parseCountyCode(countyCode)` - Extract components
- `isValidCountyCode(countyCode)` - Validate format
- `detectCounty(location)` - Detect county from location (IP-based)
- `detectCountyFromCoordinates(lat, lng)` - Detect county from coordinates (draft tracking)
- `recordLocationVisit(userId, location, countyCode?, countyName?)` - Record location with county
- `deleteCountyBadge(userId, countyCode)` - Delete county badge (press/hold)
- `restoreCountyBadge(userId, countyCode, countyName)` - Restore deleted badge (undo)
- `startDraftLocationTracking(context)` - Start tracking for slow drafts
- `stopDraftLocationTracking()` - Stop draft location tracking
- `recordDraftLocationForResearch(...)` - Record draft location to research system
- `getFlagUrl(code)` - Get image URL (handles counties)
- `getFlagDisplayName(code)` - Get display name (handles counties)

### Call Sites to Update
1. `pages/api/auth/signup.js` - Address geocoding, county detection
2. `components/vx2/auth/context/AuthContext.tsx` - Address handling, county detection
3. `components/vx2/customization/hooks/useCustomization.ts` - County detection (2 locations)
4. `components/vx2/draft-room/hooks/useDraftRoom.ts` - Draft start location tracking
5. `components/vx2/draft-logic/hooks/useDraftEngine.ts` - Draft start location tracking
6. `pages/api/draft/submit-pick.ts` - Draft start location recording
