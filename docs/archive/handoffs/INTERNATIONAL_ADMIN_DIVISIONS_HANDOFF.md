# International Administrative Divisions - Implementation Handoff

**Project:** Bestball Site  
**Date:** January 2025  
**Status:** Ready for Implementation  
**Scope:** Extend existing flag/badge system to support administrative divisions for countries outside the United States (provinces, regions, states, districts, etc.)

---

## Executive Summary

This document provides a complete implementation plan for **extending the existing flag/badge system** to support administrative division badges for countries outside the United States. The system already has infrastructure for country flags, US state flags, and US county badges that unlock based on location visits. We will add international administrative divisions using the same pattern.

**Key Requirements:**
1. **Signup Integration:** Detect administrative division from user's signup address (geocoding) - don't ask user directly
2. **Badge Display Control:** Badges are customization options (not privacy/security), users control which badges to display
3. **Location-Based Unlocking:** Users can only access divisions they've been geolocated to
4. **Draft Location Tracking:** Record location at draft start and during drafts (especially slow drafts where users may be moving)
5. **Data Separation:** Clear delineation between slow and fast draft location data for research
6. **Division Badge Deletion:** Users can delete division badges using press/hold gesture (like iOS app deletion)
7. **Undo Functionality:** 60 second countdown timer to undo deletion with explanation
8. **Multi-Country Support:** Handle different administrative division types per country (provinces, regions, states, districts, etc.)
9. **ISO 3166-2 Standard:** Use ISO 3166-2 codes for consistent international division identification
10. **Tags vs Badges:** "Experienced Drafter" is a TAG (not a badge), separate system, can be deferred

**Key Insight:** The existing system uses:
- `userLocations` collection in Firestore (stores countries, US states, and US counties)
- `FlagOption` type with `code`, `name`, `type: 'country' | 'state' | 'county'`
- `FlagGrid` component for displaying flags
- `useCustomization` hook that converts locations to flags
- Location tracking that unlocks flags when users visit places
- User research system (`lib/userMetrics.js`, `lib/draftCompletionTracker.js`) for draft data

**What We're Adding:**
- International administrative division tracking in `userLocations` collection
- Division type to `FlagOption` (`type: 'division'`)
- Division badge images (using regional flags/seals/emblems)
- Division detection and unlocking logic
- Display of division badges in existing `FlagGrid`
- **Badge display control** (customization option, not privacy feature - unified `badgesEnabled` flag)
- **Address geocoding** for signup division detection (`lib/customization/addressGeocoding.ts` - extend for international)
- **Draft location tracking** (start + periodic for slow drafts) (`lib/customization/draftLocationTracking.ts`)
- **User research integration** with slow/fast draft separation (`lib/customization/draftLocationResearch.ts`)
- **Division badge deletion** (press/hold gesture, undo with 60s timer, divisions only)
- **ISO 3166-2 code mapping** for standardized division identification

**Important Notes:**
- Tags (like "Experienced Drafter") are separate from badges - different data structure, different UI
- Tag implementation can be deferred (no user can reach 150 drafts this year - max limit)
- Badges are **customization options**, not privacy features - code structure should reflect this
- Division deletion is for relationship privacy ("never say welcome back" principle)
- Deletion functions as if user never drafted from that location - can be re-earned naturally
- Only divisions can be deleted, not countries/country flags
- Integrate with existing user research system - don't create new functions on app open
- Different countries have different administrative structures (provinces, regions, states, districts, etc.)
- Use ISO 3166-2 standard codes for consistency across countries

**Estimated Implementation Time:** 35-45 hours (includes address geocoding, draft tracking, badge deletion with undo, ISO 3166-2 integration, and multi-country support)

---

## Part 1: Understanding International Administrative Divisions

### 1.1 Administrative Division Types by Country

Different countries use different administrative division structures:

**Countries with Provinces:**
- **Canada:** 10 provinces + 3 territories (e.g., ON, QC, BC)
- **China:** 23 provinces + 5 autonomous regions + 4 municipalities + 2 special administrative regions
- **South Africa:** 9 provinces
- **Pakistan:** 4 provinces + 1 federal territory
- **Argentina:** 23 provinces + 1 autonomous city
- **Netherlands:** 12 provinces

**Countries with States:**
- **Australia:** 6 states + 2 territories (e.g., NSW, VIC, QLD)
- **Brazil:** 26 states + 1 federal district
- **Mexico:** 32 states (e.g., Jalisco, Nuevo León, Puebla)
- **India:** 28 states + 8 union territories
- **Germany:** 16 states (Länder) (e.g., BY, NW, BW)
- **Nigeria:** 36 states + 1 federal capital territory

**Countries with Regions:**
- **France:** 18 regions (e.g., Île-de-France, Auvergne-Rhône-Alpes)
- **Italy:** 20 regions (e.g., Lombardy, Lazio, Tuscany)
- **Spain:** 17 autonomous communities + 2 autonomous cities
- **United Kingdom:** 4 countries (England, Scotland, Wales, Northern Ireland) + regions
- **Chile:** 16 regions
- **Peru:** 25 regions

**Countries with Districts/Other:**
- **Japan:** 47 prefectures
- **Thailand:** 77 provinces (changwat)
- **Philippines:** 17 regions + 81 provinces
- **Indonesia:** 38 provinces
- **Vietnam:** 63 provinces and municipalities

### 1.2 ISO 3166-2 Standard

**ISO 3166-2** is the international standard for identifying administrative subdivisions.

**Code Format:** `{countryCode}-{subdivisionCode}`

**Examples:**
- `CA-ON` = Ontario, Canada
- `AU-NSW` = New South Wales, Australia
- `GB-ENG` = England, United Kingdom
- `DE-BY` = Bavaria (Bayern), Germany
- `FR-IDF` = Île-de-France, France
- `IT-LO` = Lombardy, Italy
- `MX-JAL` = Jalisco, Mexico
- `BR-SP` = São Paulo, Brazil
- `IN-MH` = Maharashtra, India
- `JP-13` = Tokyo, Japan (uses numeric codes)

**Benefits:**
- Standardized codes across all countries
- Consistent format for parsing and validation
- Widely supported by geocoding APIs
- Easy to extend to new countries

### 1.3 Priority Countries

**Phase 1 (High Priority - Most Users):**
1. **Canada** - Provinces (10) + Territories (3) = 13 divisions
2. **United Kingdom** - Countries (4) + Major regions = ~12 divisions
3. **Australia** - States (6) + Territories (2) = 8 divisions
4. **Germany** - States (16 Länder)
5. **France** - Regions (18)
6. **Italy** - Regions (20)
7. **Spain** - Autonomous communities (17) + Cities (2) = 19 divisions
8. **Mexico** - States (32)
9. **Brazil** - States (26) + Federal district (1) = 27 divisions
10. **India** - States (28) + Union territories (8) = 36 divisions

**Phase 2 (Medium Priority):**
- Netherlands, Belgium, Switzerland, Austria, Sweden, Norway, Denmark, Finland
- Japan, South Korea, China, Thailand, Philippines, Indonesia, Vietnam
- Argentina, Chile, Colombia, Peru
- South Africa, Nigeria, Kenya, Egypt

**Phase 3 (Lower Priority - Add as needed):**
- Remaining countries based on user base

---

## Part 2: Signup Address & Division Detection

### 2.1 Add Address Field to Signup (International)

**Files to Modify:**
- `components/RegistrationModal.js` - Add address input field (already exists for US counties)
- `pages/api/auth/signup.js` - Accept address in signup request (extend existing)
- `components/vx2/auth/context/AuthContext.tsx` - Handle address in email signup (extend existing)

**Address Field Requirements:**
- **Field Name:** `address` (optional but recommended)
- **Format:** Free-form text input (street address, city, state/province/region, postal code, country)
- **UI:** Add after country selection, before username (already exists)
- **Validation:** Basic format check (not empty if provided)
- **Important:** Do NOT ask user what division they are in - detect from address
- **International Support:** Handle addresses from any country, not just US

**Implementation:**
```typescript
// In RegistrationModal.js (extend existing address field)
const [formData, setFormData] = useState({
  username: '',
  email: '',
  countryCode: 'US',  // Can be any country
  displayName: '',
  address: ''  // Already exists - works for any country
});

// Address input field (already exists, but update label for international)
<div>
  <label className="block text-gray-300 mb-2">
    Address (Optional - helps us detect your region/province/state)
  </label>
  <input
    type="text"
    value={formData.address}
    onChange={(e) => handleInputChange('address', e.target.value)}
    className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600"
    placeholder="Street address, city, state/province, postal code"
  />
  <p className="text-sm text-gray-400 mt-1">
    We'll use this to determine your administrative division for badge unlocking
  </p>
</div>
```

### 2.2 Geocode Address to Administrative Division

**File:** `lib/customization/addressGeocoding.ts` (EXTEND existing file)

**Purpose:** Convert user's signup address to administrative division information (extend beyond US counties)

**Implementation Strategy:**
1. Use free geocoding service (BigDataCloud, OpenStreetMap Nominatim, or Google Maps Geocoding API)
2. Extract administrative division from geocoded result
3. Convert division name to ISO 3166-2 code using division data mapping
4. Return division code in format: `{countryCode}-{subdivisionCode}`

**Function Signature:**
```typescript
export interface DivisionGeocodeResult {
  divisionCode: string;  // Format: "{countryCode}-{subdivisionCode}" (ISO 3166-2)
  divisionName: string;
  countryCode: string;
  subdivisionCode: string;  // ISO 3166-2 subdivision code
  divisionType: 'province' | 'state' | 'region' | 'district' | 'prefecture' | 'territory' | 'other';
  confidence: 'high' | 'medium' | 'low';
}

export async function geocodeAddressToDivision(
  address: string,
  countryCode: string
): Promise<DivisionGeocodeResult | null> {
  // Works for any country, not just US
  // Use free geocoding service (BigDataCloud or Nominatim)
  // Extract administrative division from result
  // Map division name to ISO 3166-2 code
  // Return division code
}
```

**Geocoding Service Priority:**
1. **BigDataCloud** (free, no API key) - Primary
2. **OpenStreetMap Nominatim** (free, rate limited) - Fallback
3. **Google Maps Geocoding API** (paid, most accurate) - Optional enhancement

**Division Name to ISO 3166-2 Mapping:**
- Load from `data/administrativeDivisions.json` (new file with ISO 3166-2 mappings)
- Match division name + country code to ISO 3166-2 code
- Handle variations (e.g., "Ontario" vs "ON", "New South Wales" vs "NSW")

### 2.3 Integrate Division Detection in Signup

**File:** `pages/api/auth/signup.js` (EXTEND existing)

**Changes:**
- Accept `address` field in request body (already exists)
- If address provided, geocode to get administrative division (extend beyond US)
- Pass division info to `recordLocationVisit()` during signup
- Don't fail signup if geocoding fails
- Support any country, not just US

**Implementation:**
```typescript
// In signup handler, after location detection
let divisionCode: string | undefined;
let divisionName: string | undefined;
let divisionType: string | undefined;

// If address provided, geocode to get division (any country)
if (address && countryCode) {
  try {
    const { geocodeAddressToDivision } = await import('../../../lib/customization/addressGeocoding');
    const divisionResult = await geocodeAddressToDivision(address, countryCode);
    if (divisionResult) {
      divisionCode = divisionResult.divisionCode;
      divisionName = divisionResult.divisionName;
      divisionType = divisionResult.divisionType;
    }
  } catch (error) {
    // Don't fail signup if geocoding fails
    logger.warn('Failed to geocode address to division', { error, address, countryCode });
  }
}

// Record location with division if available
await recordLocationVisit(uid, location, divisionCode, divisionName, divisionType);
```

**File:** `components/vx2/auth/context/AuthContext.tsx` (EXTEND existing)

**Changes:**
- Accept `address` in email signup data (already exists)
- Geocode address to division if provided (extend beyond US)
- Pass division to `recordLocationVisit()` during signup
- Support any country

---

## Part 3: Database Schema Extension

### 3.1 Extend UserLocations Type

**File:** `lib/customization/types.ts`

```typescript
// EXISTING - Keep as is, add divisions
export interface UserLocations {
  userId: string;
  countries: LocationRecord[];
  states: LocationRecord[];  // US states only
  counties?: LocationRecord[];  // US counties only
  divisions?: LocationRecord[];  // NEW - International administrative divisions
  updatedAt: Timestamp;
  consentGiven: boolean;
}

// EXISTING - Keep as is (no changes needed)
export interface LocationRecord {
  code: string;
  name: string;
  firstSeen: Timestamp;
  lastSeen: Timestamp;
  visitCount: number;
  contexts?: string[];
  // NEW - Optional metadata for divisions
  divisionType?: 'province' | 'state' | 'region' | 'district' | 'prefecture' | 'territory' | 'other';
}

// EXISTING - Extend type to include division
export interface FlagOption {
  code: string;
  name: string;
  type: 'country' | 'state' | 'county' | 'division';  // ADD 'division'
}
```

### 3.2 Division Code Format

Division codes will follow the **ISO 3166-2** standard: `{countryCode}-{subdivisionCode}`

**Examples:**
- `CA-ON` = Ontario, Canada
- `AU-NSW` = New South Wales, Australia
- `GB-ENG` = England, United Kingdom
- `DE-BY` = Bavaria, Germany
- `FR-IDF` = Île-de-France, France
- `IT-LO` = Lombardy, Italy
- `MX-JAL` = Jalisco, Mexico
- `BR-SP` = São Paulo, Brazil
- `IN-MH` = Maharashtra, India
- `JP-13` = Tokyo, Japan

**Format Rationale:**
- International standard (ISO 3166-2)
- Consistent across all countries
- Easy to parse and validate
- Widely supported by geocoding APIs
- Unique identifier for all administrative divisions

**Validation:**
- Must match pattern: `/^[A-Z]{2}-[A-Z0-9]{1,3}$/`
- Country code must be valid ISO 3166-1 alpha-2 code
- Subdivision code must be valid ISO 3166-2 code for that country

---

## Part 4: Location Tracking Extension

### 4.1 Extend recordLocationVisit Function

**File:** `lib/customization/geolocation.ts` (EXTEND existing)

**Current Implementation:**
```typescript
export async function recordLocationVisit(
  userId: string,
  location: GeolocationResult
): Promise<void> {
  // ... existing code records countries and US states
}
```

**Enhanced Implementation:**

```typescript
export async function recordLocationVisit(
  userId: string,
  location: GeolocationResult,
  divisionCode?: string,  // NEW - ISO 3166-2 code (e.g., "CA-ON", "AU-NSW")
  divisionName?: string,  // NEW - Division name
  divisionType?: string   // NEW - Division type (province, state, region, etc.)
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
          divisions: [],  // NEW - Initialize divisions array
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
    if (location.state && location.country.code === 'US') {
      const stateIdx = data.states.findIndex((s) => s.code === location.state!.code);
      if (stateIdx >= 0) {
        data.states[stateIdx].lastSeen = now;
        data.states[stateIdx].visitCount++;
      } else {
        data.states.push({
          code: `US-${location.state.code}`,  // Keep US- prefix for states
          name: location.state.name,
          firstSeen: now,
          lastSeen: now,
          visitCount: 1,
        });
      }
    }

    // NEW - Update or add international administrative division if present
    // Only record if: non-US location, and division info provided
    if (
      divisionCode && 
      divisionName && 
      location.country.code !== 'US'  // US uses states/counties, not divisions
    ) {
      // Validate division code format (ISO 3166-2)
      if (!/^[A-Z]{2}-[A-Z0-9]{1,3}$/.test(divisionCode)) {
        console.warn('Invalid division code format:', divisionCode);
        // Don't throw - just skip division recording
      } else {
        // Ensure divisions array exists (backward compatibility)
        if (!data.divisions) {
          data.divisions = [];
        }
        
        const divisionIdx = data.divisions.findIndex((d) => d.code === divisionCode);
        if (divisionIdx >= 0) {
          data.divisions[divisionIdx].lastSeen = now;
          data.divisions[divisionIdx].visitCount++;
        } else {
          data.divisions.push({
            code: divisionCode,
            name: divisionName,
            firstSeen: now,
            lastSeen: now,
            visitCount: 1,
            divisionType: divisionType as any,  // Store division type metadata
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
1. Added optional `divisionCode`, `divisionName`, and `divisionType` parameters
2. Added division validation (ISO 3166-2 format check)
3. Initialize `divisions` array in new documents
4. Handle backward compatibility (check if `divisions` exists)
5. Only record divisions for non-US locations (US uses states/counties)
6. Store division type metadata for display purposes

### 4.2 Division Detection Service

**File:** `lib/customization/divisionDetection.ts` (NEW)

```typescript
/**
 * Division Detection Service
 * 
 * Detects administrative division from location data for international countries.
 * Uses ISO 3166-2 standard codes.
 * 
 * Primary method: Address geocoding (from signup)
 * Secondary method: Reverse geocoding from coordinates (during drafts)
 */

import type { GeolocationResult } from './geolocation';

export interface DivisionInfo {
  code: string;  // Format: "{countryCode}-{subdivisionCode}" (ISO 3166-2)
  name: string;  // Division name (e.g., "Ontario", "New South Wales")
  subdivisionCode: string;  // ISO 3166-2 subdivision code (e.g., "ON", "NSW")
  countryCode: string;  // ISO 3166-1 alpha-2 country code
  divisionType: 'province' | 'state' | 'region' | 'district' | 'prefecture' | 'territory' | 'other';
}

/**
 * Detect division from location
 * 
 * Current limitation: IP geolocation APIs don't always provide division-level data.
 * This function will need to be enhanced with:
 * 1. Reverse geocoding API (Google Maps, Mapbox, etc.) - for draft locations
 * 2. Enhanced IP geolocation service (paid)
 * 3. Browser geolocation API (requires user permission)
 * 
 * For signup: Use address geocoding (see addressGeocoding.ts)
 * For drafts: Use reverse geocoding from coordinates
 * 
 * @param location - Geolocation result from IP-based detection
 * @returns DivisionInfo if division can be determined, null otherwise
 */
export async function detectDivision(
  location: GeolocationResult
): Promise<DivisionInfo | null> {
  // Must be non-US location (US uses states/counties, not divisions)
  if (!location.country || location.country.code === 'US') {
    return null;
  }
  
  // TODO: Implement division detection from coordinates
  // Phase 1: Return null (division detection from IP not yet implemented)
  // Phase 2: Add reverse geocoding with coordinates (for draft locations)
  // Phase 3: Add browser geolocation fallback
  
  return null;
}

/**
 * Detect division from coordinates (for draft location tracking)
 * 
 * Uses reverse geocoding to get division from lat/lng.
 * This is used during draft location tracking.
 */
export async function detectDivisionFromCoordinates(
  latitude: number,
  longitude: number,
  countryCode: string
): Promise<DivisionInfo | null> {
  // Use reverse geocoding service (BigDataCloud, Mapbox, etc.)
  // Extract division from result
  // Map division name to ISO 3166-2 code
  // Return division info
  
  // TODO: Implement reverse geocoding
  return null;
}

/**
 * Generate division code from country code and subdivision code
 * Format: "{countryCode}-{subdivisionCode}" (ISO 3166-2)
 * 
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., "CA")
 * @param subdivisionCode - ISO 3166-2 subdivision code (e.g., "ON")
 * @returns Division code in format "CA-ON"
 */
export function generateDivisionCode(
  countryCode: string,
  subdivisionCode: string
): string {
  // Validate inputs
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    throw new Error(`Invalid country code: ${countryCode}`);
  }
  if (!/^[A-Z0-9]{1,3}$/.test(subdivisionCode)) {
    throw new Error(`Invalid subdivision code: ${subdivisionCode}`);
  }
  
  return `${countryCode}-${subdivisionCode}`;
}

/**
 * Parse division code to extract components
 * 
 * @param divisionCode - Division code in format "{countryCode}-{subdivisionCode}"
 * @returns Object with countryCode and subdivisionCode, or null if invalid
 */
export function parseDivisionCode(
  divisionCode: string
): { countryCode: string; subdivisionCode: string } | null {
  // Format: "{countryCode}-{subdivisionCode}"
  const match = divisionCode.match(/^([A-Z]{2})-([A-Z0-9]{1,3})$/);
  if (!match) {
    return null;
  }
  
  return {
    countryCode: match[1],
    subdivisionCode: match[2],
  };
}

/**
 * Validate division code format
 * 
 * @param divisionCode - Division code to validate
 * @returns true if valid format, false otherwise
 */
export function isValidDivisionCode(divisionCode: string): boolean {
  return /^[A-Z]{2}-[A-Z0-9]{1,3}$/.test(divisionCode);
}

/**
 * Get division type label for display
 * 
 * @param divisionType - Division type
 * @returns Human-readable label
 */
export function getDivisionTypeLabel(
  divisionType: 'province' | 'state' | 'region' | 'district' | 'prefecture' | 'territory' | 'other'
): string {
  const labels: Record<string, string> = {
    province: 'Province',
    state: 'State',
    region: 'Region',
    district: 'District',
    prefecture: 'Prefecture',
    territory: 'Territory',
    other: 'Division',
  };
  return labels[divisionType] || 'Division';
}
```

---

## Part 5: Update Customization Hook

### 5.1 Extend useCustomization Hook

**File:** `components/vx2/customization/hooks/useCustomization.ts` (EXTEND existing)

**Current Implementation:**
```typescript
const unsubscribe = subscribeToLocations(user.uid, async (locations) => {
  if (locations && (
    locations.countries?.length > 0 || 
    locations.states?.length > 0 || 
    locations.counties?.length > 0
  )) {
    setLocationConsent(locations.consentGiven ?? false);
    
    const flags: FlagOption[] = preferences.badgesEnabled ? [
      ...(locations.countries || []).map((c) => ({
        code: c.code,
        name: c.name,
        type: 'country' as const,
      })),
      ...(locations.states || []).map((s) => ({
        code: s.code,
        name: s.name,
        type: 'state' as const,
      })),
      ...(locations.counties || []).map((c) => ({
        code: c.code,
        name: c.name,
        type: 'county' as const,
      })),
    ] : [];
    // ... rest of code
  }
});
```

**Enhanced Implementation:**

```typescript
const unsubscribe = subscribeToLocations(user.uid, async (locations) => {
  // NEW - Check divisions in condition
  if (locations && (
    locations.countries?.length > 0 || 
    locations.states?.length > 0 || 
    locations.counties?.length > 0 ||
    locations.divisions?.length > 0  // NEW
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
      // US States (only if display enabled)
      ...(locations.states || []).map((s) => ({
        code: s.code,  // Already in format "US-{stateCode}"
        name: s.name,
        type: 'state' as const,
      })),
      // US Counties (only if display enabled)
      ...(locations.counties || []).map((c) => ({
        code: c.code,  // Already in format "US-{stateCode}-{fipsCode}"
        name: c.name,
        type: 'county' as const,
      })),
      // International Divisions (only if display enabled)
      ...(locations.divisions || []).map((d) => ({
        code: d.code,  // Already in format "{countryCode}-{subdivisionCode}"
        name: d.name,
        type: 'division' as const,
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
// In the auto-detection section
try {
  const location = await detectLocation();
  if (location.country) {
    // NEW - Try to detect division (for non-US countries)
    if (location.country.code !== 'US') {
      const { detectDivision } = await import('@/lib/customization/divisionDetection');
      const division = await detectDivision(location);
      
      // Record location with division if available
      await recordLocationVisit(
        user.uid, 
        location,
        undefined,  // countyCode (US only)
        undefined,  // countyName (US only)
        division?.code,      // NEW - divisionCode
        division?.name,       // NEW - divisionName
        division?.divisionType  // NEW - divisionType
      );
    } else {
      // US location - use county detection (existing logic)
      const { detectCounty } = await import('@/lib/customization/countyDetection');
      const county = await detectCounty(location);
      
      await recordLocationVisit(
        user.uid, 
        location,
        county?.code,
        county?.name
      );
    }
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
// In enableLocationTracking function
const location = await detectLocation();
if (location.country) {
  // NEW - Try to detect division (for non-US countries)
  if (location.country.code !== 'US') {
    const { detectDivision } = await import('@/lib/customization/divisionDetection');
    const division = await detectDivision(location);
    
    await recordLocationVisit(
      user.uid, 
      location,
      undefined,  // countyCode (US only)
      undefined,  // countyName (US only)
      division?.code,      // NEW
      division?.name,       // NEW
      division?.divisionType  // NEW
    );
  } else {
    // US location - use county detection (existing logic)
    const { detectCounty } = await import('@/lib/customization/countyDetection');
    const county = await detectCounty(location);
    
    await recordLocationVisit(
      user.uid, 
      location,
      county?.code,
      county?.name
    );
  }
}

// Also track via the new system (keep as is)
await trackLocation(user.uid);
```

### 5.2 Dev Flags for Testing

**File:** `components/vx2/customization/hooks/useCustomization.ts`

**Enhanced Dev Flags (add sample divisions):**

```typescript
const DEV_FLAGS: FlagOption[] = [
  { code: 'US', name: 'United States', type: 'country' },
  { code: 'US-SC', name: 'South Carolina', type: 'state' },
  { code: 'US-NY', name: 'New York', type: 'state' },
  { code: 'US-CA-06037', name: 'Los Angeles', type: 'county' },
  { code: 'IE', name: 'Ireland', type: 'country' },
  // NEW - Add sample divisions for dev testing
  { code: 'CA-ON', name: 'Ontario', type: 'division' },
  { code: 'AU-NSW', name: 'New South Wales', type: 'division' },
  { code: 'GB-ENG', name: 'England', type: 'division' },
  { code: 'DE-BY', name: 'Bavaria', type: 'division' },
  { code: 'FR-IDF', name: 'Île-de-France', type: 'division' },
  { code: 'IT-LO', name: 'Lombardy', type: 'division' },
  { code: 'MX-JAL', name: 'Jalisco', type: 'division' },
  { code: 'BR-SP', name: 'São Paulo', type: 'division' },
];
```

---

## Part 6: Update FlagGrid Component

### 6.1 Extend FlagGrid to Display Divisions

**File:** `components/vx2/customization/FlagGrid.tsx` (EXTEND existing)

**IMPORTANT:** ALL badges are opt-in. Only show badges if `preferences.badgesEnabled === true`.

**Current Implementation:**
```typescript
// Group: countries first, then US states, then US counties
const countries = flags.filter((f) => f.type === 'country');
const states = flags.filter((f) => f.type === 'state');
const counties = flags.filter((f) => f.type === 'county');

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
    {counties.length > 0 && (
      <div>
        <h4 className="text-sm font-medium mb-2">US Counties</h4>
        {/* ... county grid */}
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
  ? flags.filter((f) => f.type === 'county')
  : [];
const divisions = preferences.badgesEnabled
  ? flags.filter((f) => f.type === 'division')  // NEW
  : [];

// Group divisions by country for better organization
const divisionsByCountry = useMemo(() => {
  const grouped: Record<string, FlagOption[]> = {};
  divisions.forEach(div => {
    const countryCode = div.code.split('-')[0];
    if (!grouped[countryCode]) {
      grouped[countryCode] = [];
    }
    grouped[countryCode].push(div);
  });
  return grouped;
}, [divisions]);

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

    {/* EXISTING - US States (keep as is) */}
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

    {/* EXISTING - US Counties (keep as is) */}
    {counties.length > 0 && (
      <div>
        <h4 className="text-sm font-medium mb-2" style={{ color: 'rgba(209, 213, 219, 0.9)' }}>US Counties</h4>
        {/* ... county grid */}
      </div>
    )}

    {/* NEW - International Divisions (grouped by country) */}
    {Object.keys(divisionsByCountry).length > 0 && (
      <div>
        <h4 className="text-sm font-medium mb-2" style={{ color: 'rgba(209, 213, 219, 0.9)' }}>Administrative Divisions</h4>
        {Object.entries(divisionsByCountry).map(([countryCode, countryDivisions]) => {
          const countryName = countries.find(c => c.code === countryCode)?.name || countryCode;
          return (
            <div key={countryCode} className="mb-4">
              <h5 className="text-xs font-medium mb-2" style={{ color: 'rgba(209, 213, 219, 0.7)' }}>
                {countryName}
              </h5>
              <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2 sm:gap-3">
                {countryDivisions.map((flag) => (
                  <FlagItem
                    key={flag.code}
                    flag={flag}
                    isSelected={selectedCode === flag.code}
                    onSelect={onSelect}
                    onDelete={flag.type === 'division' ? handleDeleteDivision : undefined}  // NEW - Deletion support
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);
```

**Note:** `FlagItem` already has error handling, so division badges will automatically show fallback if image is missing.

### 6.2 Update Flag URL Function

**File:** `lib/customization/flags.ts` (EXTEND existing)

**Current Implementation:**
```typescript
export function getFlagUrl(code: string): string {
  // County format: "US-{stateCode}-{fipsCode}"
  if (code.match(/^US-[A-Z]{2}-\d{5}$/)) {
    return `/badges/county/${code}.svg`;
  }
  
  // State format: "US-{stateCode}"
  if (code.startsWith('US-')) {
    return `/flags/states/${code.slice(3).toLowerCase()}.svg`;
  }
  
  // Country format: "{countryCode}"
  return `/flags/countries/${code.toLowerCase()}.svg`;
}
```

**Enhanced Implementation:**

```typescript
export function getFlagUrl(code: string): string {
  // County format: "US-{stateCode}-{fipsCode}"
  if (code.match(/^US-[A-Z]{2}-\d{5}$/)) {
    return `/badges/county/${code}.svg`;
  }
  
  // State format: "US-{stateCode}"
  if (code.startsWith('US-')) {
    return `/flags/states/${code.slice(3).toLowerCase()}.svg`;
  }
  
  // Division format: "{countryCode}-{subdivisionCode}" (ISO 3166-2)
  // Check for division pattern (e.g., "CA-ON", "AU-NSW", "GB-ENG")
  if (code.match(/^[A-Z]{2}-[A-Z0-9]{1,3}$/)) {
    // Division badge - use badges directory
    return `/badges/division/${code}.svg`;
  }
  
  // Country format: "{countryCode}"
  return `/flags/countries/${code.toLowerCase()}.svg`;
}

export function parseFlagCode(code: string): { type: 'country' | 'state' | 'county' | 'division'; code: string } {
  // County format: "US-{stateCode}-{fipsCode}"
  if (code.match(/^US-[A-Z]{2}-\d{5}$/)) {
    return { type: 'county', code };
  }
  
  // State format: "US-{stateCode}"
  if (code.startsWith('US-')) {
    return { type: 'state', code: code.slice(3) };
  }
  
  // Division format: "{countryCode}-{subdivisionCode}" (ISO 3166-2)
  if (code.match(/^[A-Z]{2}-[A-Z0-9]{1,3}$/)) {
    return { type: 'division', code };
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
    return code;
  }
  
  // State format: "US-{stateCode}"
  if (code.startsWith('US-')) {
    return US_STATE_NAMES[code.slice(3)] ?? code;
  }
  
  // Division format: "{countryCode}-{subdivisionCode}" (ISO 3166-2)
  if (code.match(/^[A-Z]{2}-[A-Z0-9]{1,3}$/)) {
    // Try to get division name from mapping
    const divisionName = DIVISION_NAMES[code];
    if (divisionName) {
      return divisionName;
    }
    // Fallback: return code if name not found
    return code;
  }
  
  // Country format: "{countryCode}"
  return COUNTRY_NAMES[code] ?? code;
}
```

### 6.3 Division Name Mapping

**File:** `lib/customization/divisionNames.ts` (NEW - Generated)

Similar to county names, but for international divisions. Generated from ISO 3166-2 data.

**File:** `scripts/generate-division-names.js` (NEW)

```javascript
/**
 * Generate Division Names Mapping
 * 
 * Reads administrativeDivisions.json and generates DIVISION_NAMES mapping for flags.ts
 * 
 * Usage: node scripts/generate-division-names.js
 */

const fs = require('fs');
const path = require('path');

const DIVISIONS_FILE = path.join(__dirname, '../data/administrativeDivisions.json');
const OUTPUT_FILE = path.join(__dirname, '../lib/customization/divisionNames.ts');

const divisions = JSON.parse(fs.readFileSync(DIVISIONS_FILE, 'utf8'));

const mapping = {};
divisions.forEach(division => {
  const code = `${division.countryCode}-${division.subdivisionCode}`;
  mapping[code] = division.name;
});

const output = `/**
 * Division Names Mapping
 * 
 * Auto-generated from data/administrativeDivisions.json
 * Last updated: ${new Date().toISOString()}
 * Total divisions: ${divisions.length}
 */

export const DIVISION_NAMES: Record<string, string> = ${JSON.stringify(mapping, null, 2)};
`;

fs.writeFileSync(OUTPUT_FILE, output);
console.log(`✓ Generated division names mapping: ${Object.keys(mapping).length} divisions`);
```

Then import in `flags.ts`:
```typescript
import { DIVISION_NAMES } from './divisionNames';
```

---

## Part 7: Division Badge Deletion

### 7.1 Division Badge Deletion Functions

**File:** `lib/customization/badgeDeletion.ts` (EXTEND existing)

**Current Implementation:** Only handles county deletion

**Enhanced Implementation:**

```typescript
/**
 * Delete a division badge from user's location history
 * 
 * Behavior: Removes division as if user never drafted from that location.
 * User can re-earn the badge by drafting from that location again.
 * This prevents suspicion (missing badge looks normal if it can be re-earned).
 * 
 * Only divisions can be deleted, not countries.
 * 
 * Privacy Note: Users may delete badges to avoid revealing
 * where they've been (relationship privacy concerns).
 */
export async function deleteDivisionBadge(
  userId: string,
  divisionCode: string
): Promise<void> {
  if (!db) {
    throw new Error('Firebase db not initialized');
  }
  
  // Validate division code format (ISO 3166-2)
  if (!/^[A-Z]{2}-[A-Z0-9]{1,3}$/.test(divisionCode)) {
    throw new Error('Invalid division code format');
  }
  
  const docRef = doc(db, 'userLocations', userId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return; // Nothing to delete
  }
  
  const data = docSnap.data() as UserLocations;
  const divisions = data.divisions || [];
  
  // Remove division from array
  const updatedDivisions = divisions.filter(d => d.code !== divisionCode);
  
  await updateDoc(docRef, {
    divisions: updatedDivisions,
    updatedAt: serverTimestamp()
  });
}

/**
 * Restore a deleted division badge (undo deletion)
 * 
 * Re-adds the division badge to user's location history.
 * Used for undo functionality within 60 second window.
 */
export async function restoreDivisionBadge(
  userId: string,
  divisionCode: string,
  divisionName: string,
  divisionType?: string
): Promise<void> {
  if (!db) {
    throw new Error('Firebase db not initialized');
  }
  
  // Validate division code format
  if (!/^[A-Z]{2}-[A-Z0-9]{1,3}$/.test(divisionCode)) {
    throw new Error('Invalid division code format');
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
      divisions: [],
      consentGiven: true,
      updatedAt: serverTimestamp(),
    });
  }
  
  const data = docSnap.data() as UserLocations;
  const divisions = data.divisions || [];
  
  // Check if division already exists
  const exists = divisions.some(d => d.code === divisionCode);
  if (exists) {
    return; // Already exists, nothing to restore
  }
  
  // Re-add division with current timestamp
  const now = Timestamp.now();
  divisions.push({
    code: divisionCode,
    name: divisionName,
    firstSeen: now, // Reset to now (as if first time earning)
    lastSeen: now,
    visitCount: 1,
    divisionType: divisionType as any,
  });
  
  await updateDoc(docRef, {
    divisions,
    updatedAt: serverTimestamp()
  });
}
```

### 7.2 Press/Hold Implementation in FlagGrid

**File:** `components/vx2/customization/FlagGrid.tsx` (EXTEND existing)

Similar to county deletion, but for divisions. Use the same press/hold gesture with 1.5s duration and 60s undo timer.

```typescript
// Press/hold gesture for division badge deletion (similar to counties)
const [deletingDivision, setDeletingDivision] = useState<string | null>(null);
const [holdProgress, setHoldProgress] = useState(0);
const holdDuration = 1500; // 1.5 seconds

// Undo functionality state
const [deletedDivision, setDeletedDivision] = useState<{ code: string; name: string } | null>(null);
const [undoTimer, setUndoTimer] = useState(60); // 60 second countdown

// Handle division deletion (similar to county deletion)
const handleDeleteDivision = async (divisionCode: string, divisionName: string) => {
  // Similar implementation to county deletion
  // Use deleteDivisionBadge and restoreDivisionBadge functions
};
```

---

## Part 8: Draft Location Tracking

### 8.1 Draft Start Location Tracking (International)

**File:** `lib/customization/draftLocationTracking.ts` (EXTEND existing)

Extend existing draft location tracking to detect divisions for international countries.

```typescript
// In recordDraftLocation function
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
  
  // Detect division if non-US location
  let divisionCode: string | undefined;
  let divisionName: string | undefined;
  let divisionType: string | undefined;
  
  if (location.countryCode !== 'US') {
    const { detectDivisionFromCoordinates } = await import('@/lib/customization/divisionDetection');
    const division = await detectDivisionFromCoordinates(
      location.latitude,
      location.longitude,
      location.countryCode
    );
    if (division) {
      divisionCode = division.code;
      divisionName = division.name;
      divisionType = division.divisionType;
    }
  } else {
    // US location - use county detection (existing logic)
    const { detectCountyFromCoordinates } = await import('@/lib/customization/countyDetection');
    const county = await detectCountyFromCoordinates(
      location.latitude,
      location.longitude
    );
    // ... existing county logic
  }
  
  // Record to userLocations (for badge unlocking)
  const { recordLocationVisit } = await import('@/lib/customization/geolocation');
  await recordLocationVisit(
    userId,
    {
      country: { code: location.countryCode, name: location.countryName },
      state: location.stateCode ? { code: location.stateCode, name: location.stateName || '' } : null
    },
    location.countryCode === 'US' ? county?.code : undefined,  // countyCode (US only)
    location.countryCode === 'US' ? county?.name : undefined,   // countyName (US only)
    divisionCode,      // NEW - divisionCode (non-US)
    divisionName,       // NEW - divisionName (non-US)
    divisionType        // NEW - divisionType (non-US)
  );
  
  // Record to user research system (with draft context)
  const { recordDraftLocationForResearch } = await import('@/lib/customization/draftLocationResearch');
  await recordDraftLocationForResearch(userId, roomId, {
    country: { code: location.countryCode, name: location.countryName },
    state: location.stateCode ? { code: location.stateCode, name: location.stateName || '' } : null
  }, county, division, {  // NEW - pass division
    eventType,
    draftType: isFastDraft ? 'fast' : 'slow',
    timestamp: Date.now()
  });
}
```

---

## Part 9: Data Sources and Images

### 9.1 Administrative Division Data Structure

**File:** `data/administrativeDivisions.json` (NEW)

```json
[
  {
    "countryCode": "CA",
    "countryName": "Canada",
    "subdivisionCode": "ON",
    "name": "Ontario",
    "divisionType": "province",
    "iso3166_2": "CA-ON"
  },
  {
    "countryCode": "CA",
    "countryName": "Canada",
    "subdivisionCode": "QC",
    "name": "Quebec",
    "divisionType": "province",
    "iso3166_2": "CA-QC"
  },
  {
    "countryCode": "AU",
    "countryName": "Australia",
    "subdivisionCode": "NSW",
    "name": "New South Wales",
    "divisionType": "state",
    "iso3166_2": "AU-NSW"
  },
  {
    "countryCode": "GB",
    "countryName": "United Kingdom",
    "subdivisionCode": "ENG",
    "name": "England",
    "divisionType": "country",
    "iso3166_2": "GB-ENG"
  }
  // ... all divisions for priority countries
]
```

**Data Sources:**
- ISO 3166-2 standard codes (official source)
- Geonames.org (free, comprehensive)
- OpenStreetMap Nominatim (free, community-maintained)
- Country-specific government sources

### 9.2 Image Storage Structure

```
public/
  flags/
    countries/          # Existing (country flags)
    states/             # Existing (US state flags)
  badges/
    county/             # Existing (US county badges)
    division/            # NEW (international division badges)
      CA-ON.svg         # Ontario, Canada
      AU-NSW.svg         # New South Wales, Australia
      GB-ENG.svg         # England, United Kingdom
      DE-BY.svg          # Bavaria, Germany
      FR-IDF.svg         # Île-de-France, France
      IT-LO.svg          # Lombardy, Italy
      MX-JAL.svg         # Jalisco, Mexico
      BR-SP.svg          # São Paulo, Brazil
      # ... all divisions for priority countries
    default.svg         # Existing - Fallback badge image
```

**Image Specifications:**
- **Format:** SVG (preferred) or PNG
- **Size:** 200x200px base size
- **Style:** Regional flag/emblem/seal in center
- **Naming:** `{countryCode}-{subdivisionCode}.svg` (ISO 3166-2 format)
- **Fallback:** `/badges/default.svg` for missing badges

**Image Sources:**
- Regional flags (where available)
- Government seals/emblems
- OpenStreetMap (some regions have flags)
- Country-specific sources

---

## Part 10: Integration Points - All Call Sites

### 10.1 Update Signup API

**File:** `pages/api/auth/signup.js` (EXTEND existing)

Extend existing signup handler to support international divisions.

### 10.2 Update Auth Context

**File:** `components/vx2/auth/context/AuthContext.tsx` (EXTEND existing)

Extend existing auth context to support international divisions.

### 10.3 Update useCustomization Hook

**File:** `components/vx2/customization/hooks/useCustomization.ts` (EXTEND existing)

Already covered in Part 5.

### 10.4 Update Location Settings Display

**File:** `components/vx2/location/LocationSettingsSection.tsx` (EXTEND existing)

```typescript
<div className="grid grid-cols-4 gap-4 mb-6">  {/* Changed to 4 columns */}
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
  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: BG_COLORS.secondary }}>
    <div className="text-2xl font-bold" style={{ color: TEXT_COLORS.primary }}>
      {userLocations.counties?.length || 0}
    </div>
    <div className="text-sm" style={{ color: TEXT_COLORS.secondary }}>
      US Counties
    </div>
  </div>
  {/* NEW - Divisions stat */}
  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: BG_COLORS.secondary }}>
    <div className="text-2xl font-bold" style={{ color: TEXT_COLORS.primary }}>
      {userLocations.divisions?.length || 0}
    </div>
    <div className="text-sm" style={{ color: TEXT_COLORS.secondary }}>
      Divisions
    </div>
  </div>
</div>
```

---

## Part 11: Backward Compatibility & Migration

### 11.1 Handle Existing UserLocations Documents

**Issue:** Existing `userLocations` documents don't have `divisions` array.

**Solution:** Always check if `divisions` exists before accessing:

```typescript
// In recordLocationVisit
if (!data.divisions) {
  data.divisions = [];
}

// In useCustomization hook
...(locations.divisions || []).map(...)  // Safe access with ||

// In LocationSettingsSection
{userLocations.divisions?.length || 0}  // Optional chaining
```

### 11.2 Migration Script (Optional)

**File:** `scripts/migrate-user-locations-divisions.js` (NEW - Optional)

Similar to county migration script, but for divisions.

---

## Part 12: Testing Strategy

### 12.1 Unit Tests

**File:** `__tests__/lib/customization/divisionDetection.test.ts` (NEW)

Test division detection functions, code generation, parsing, validation.

### 12.2 Integration Tests

Test division recording, badge display, deletion, undo, draft location tracking.

### 12.3 E2E Tests

Test signup with international address, division unlocking, badge display, deletion with undo.

---

## Part 13: Performance Considerations

### 13.1 FlagGrid Performance

- Group divisions by country for better organization
- Lazy loading images (already implemented)
- Virtual scrolling for large division lists (if needed)
- Search/filter by country

### 13.2 Division Name Lookup Performance

- Generate static mapping at build time
- Use tree-shaking to only include used divisions
- Cache division names to avoid repeated lookups

---

## Part 14: Deployment Considerations

### 14.1 Firestore Rules

**File:** `firestore.rules` (NO CHANGES NEEDED)

Existing rules for `userLocations` collection already allow users to write to their own document. Divisions are just another field.

### 14.2 Environment Variables

**New Variables (for division detection - Phase 2):**
- `NEXT_PUBLIC_MAPBOX_TOKEN` - For Mapbox reverse geocoding (optional)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - For Google Maps geocoding (optional)

### 14.3 Build Process

**New Build Step:**
```json
// package.json
{
  "scripts": {
    "generate:division-names": "node scripts/generate-division-names.js",
    "prebuild": "npm run generate:division-names"
  }
}
```

### 14.4 Image Assets

- Division badge images need to be added to `public/badges/division/`
- Priority: Start with Phase 1 countries (Canada, UK, Australia, Germany, France, Italy, Spain, Mexico, Brazil, India)
- Total: ~200-300 images for Phase 1 countries

---

## Part 15: Rollout Strategy

### Phase 1: Foundation (Week 1-2)
- Type extensions
- ISO 3166-2 integration
- Location tracking updates
- Flag display updates
- Basic testing

### Phase 2: Priority Countries (Week 3-4)
- Canada, UK, Australia, Germany, France, Italy, Spain, Mexico, Brazil, India
- Division data collection
- Image processing
- Division name mapping
- Image upload

### Phase 3: Detection & Polish (Week 5-6)
- Division detection implementation
- Testing and refinement
- Performance optimization
- UI/UX polish

### Phase 4: Additional Countries (Ongoing)
- Add countries based on user base
- Expand division coverage

---

## Conclusion

This plan extends the existing flag/badge system to support international administrative divisions, reusing all existing infrastructure. The implementation follows the same patterns as the county badge system but uses ISO 3166-2 standard codes for consistency across all countries.

**Key Points:**
- Extends existing system, doesn't create new one
- **Badges are customization options** (unified `badgesEnabled` flag - not privacy/security)
- **Division badge deletion** available (press/hold gesture, 1.5s duration, undo with 60s timer, allows re-earning, divisions only)
- **ISO 3166-2 standard** for consistent international division identification
- **Multi-country support** with different division types (provinces, states, regions, districts, etc.)
- **Draft location tracking** integrated with existing user research system
- **Address geocoding** for signup (don't ask user directly)
- **Tags are separate from badges** (different system, can be deferred)
- Backward compatible with existing users
- Handles all edge cases and errors gracefully
- Performance optimized for large division lists
- Comprehensive testing strategy
- Clear implementation phases

**Estimated Total Time:** 35-45 hours (includes address geocoding, draft location tracking, badge deletion with undo, ISO 3166-2 integration, and multi-country support)

**Priority:** Medium (can be implemented incrementally, starting with Phase 1 countries)

**Next Steps:**
1. Review and approve this comprehensive plan
2. Begin Phase 1 (signup address & division detection for international)
3. Implement type extensions and location tracking
4. Add draft location tracking (start + periodic for slow)
5. Integrate with user research system
6. Implement badge display control (customization option)
7. Add division display to FlagGrid (with badge control)
8. Implement division badge deletion with undo
9. Process division badge images for Phase 1 countries
10. Enhance division detection (reverse geocoding)
11. Test and deploy
