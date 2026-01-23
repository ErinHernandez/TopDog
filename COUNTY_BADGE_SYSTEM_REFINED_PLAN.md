# County Badge System - Refined Implementation Plan

**Project:** Bestball Site  
**Date:** January 2025  
**Status:** Plan Refined - Ready for Review  
**Scope:** County badge system with address-based signup, opt-in flags, and draft location tracking

---

## Executive Summary

This refined plan extends the existing flag/badge system to support county-level badges with the following key requirements:

1. **Signup Integration:** Detect county from user's signup address (geocoding)
2. **Badge Display Control:** Badges are customization options - users control which badges to display (not privacy/security)
3. **Location-Based Unlocking:** Users can only access counties they've been geolocated to
4. **Draft Location Tracking:** Record location at draft start and during drafts (especially slow drafts)
5. **Data Separation:** Clear delineation between slow and fast draft location data
6. **Badge Deletion:** Users can delete specific county badges they've earned (permanent deletion with warning)
7. **Tags vs Badges:** "Experienced Drafter" is a TAG (not a badge), separate system, structured differently

**Key Insight:** The existing system uses `userLocations` collection for location tracking. We'll extend this to include counties and integrate with the existing user research/analytics system for draft location tracking.

**Important Notes:**
- Tags (like "Experienced Drafter") are separate from badges. Tags have two levels (150 drafts, 500 drafts) but no user can reach 150 drafts this year (max limit), so tag implementation can be deferred/simplified.
- Badges are **customization options**, not privacy features. Users control display for personalization purposes.
- Users can **delete county badges** they've earned (with permanent deletion warning). Countries cannot be deleted.
- Remove educational text about earning flags after user earns their second country flag.

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

---

## Part 2: Location Tracking During Drafts

### 2.1 Draft Start Location Tracking

**Integration Points:**
- `components/vx2/draft-room/hooks/useDraftRoom.ts` - When draft starts
- `components/vx2/draft-logic/hooks/useDraftEngine.ts` - Draft engine initialization
- `pages/api/draft/submit-pick.ts` - First pick submission (draft start)

**Implementation:**
```typescript
// In useDraftRoom or draft start handler
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
  const location = await getCurrentLocation();
  if (!location) return;
  
  // Detect county if US location
  const county = await detectCounty(location);
  
  // Record to userLocations (for badge unlocking)
  await recordLocationVisit(
    userId,
    { country: { code: location.countryCode, name: location.countryName }, state: location.stateCode ? { code: location.stateCode, name: location.stateName || '' } : null },
    county?.code,
    county?.name
  );
  
  // Record to user research system (with draft context)
  await recordDraftLocationForResearch(userId, roomId, location, county, {
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
- Record location updates periodically (every 5-10 minutes during active slow draft)
- Stop tracking when draft completes or user leaves draft room

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
  if (navigator.geolocation && 'watchPosition' in navigator.geolocation) {
    activeDraftTracking.context = context;
    activeDraftTracking.lastRecordedAt = Date.now();
    
    activeDraftTracking.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        // Only record if enough time has passed
        if (now - activeDraftTracking.lastRecordedAt < LOCATION_UPDATE_INTERVAL_MS) {
          return;
        }
        
        // Get location from coordinates
        const location = await reverseGeocode(position.coords.latitude, position.coords.longitude);
        if (location) {
          const county = await detectCountyFromCoordinates(
            position.coords.latitude,
            position.coords.longitude
          );
          
          // Record location for badge unlocking
          await recordLocationVisit(
            context.userId,
            location,
            county?.code,
            county?.name
          );
          
          // Record for research (with draft context)
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
  if (activeDraftTracking.watchId !== null && navigator.geolocation) {
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

---

## Part 3: County Badge Unlocking & Display

### 3.1 County Unlocking Logic

**Principle:** Users can only access counties they've been geolocated to

**Data Source:** `userLocations` collection - `counties` array

**Unlocking Triggers:**
1. Signup address geocoding (if address provided)
2. Location permission granted (when user opts in)
3. Draft start location (when draft begins)
4. Draft location updates (during slow drafts, if moving)

**Implementation:**
- Counties are automatically added to `userLocations.counties` when detected
- No manual county selection - only geolocation-based
- County codes stored in format: `US-{stateCode}-{fipsCode}`

### 3.2 Badge Display Control (Customization Option)

**Requirement:** Badges are customization options - users control which badges to display for personalization

**Implementation:**
- Add `badgesEnabled` flag to `CustomizationPreferences` (controls badge display - customization, not privacy)
- Only show badges in FlagGrid if `badgesEnabled === true`
- Add toggle in customization settings (framed as personalization, not privacy)
- This applies to countries, states, AND counties - unified display control
- **Note:** This is a customization preference, not a privacy/security feature

**File:** `lib/customization/types.ts`

```typescript
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
  badgesEnabled: boolean;  // NEW - Display control for ALL badges (customization option)
}

export const DEFAULT_PREFERENCES: CustomizationPreferences = {
  // ... existing defaults
  badgesEnabled: false,  // Default to hidden (user can enable for customization)
};
```

**File:** `components/vx2/customization/hooks/useCustomization.ts`

```typescript
// In subscribeToLocations callback
// ALL badges are opt-in (countries, states, counties)
const flags: FlagOption[] = preferences.badgesEnabled ? [
  // Countries (only if opt-in enabled)
  ...(locations.countries || []).map((c) => ({
    code: c.code,
    name: c.name,
    type: 'country' as const,
  })),
  // States (only if opt-in enabled)
  ...(locations.states || []).map((s) => ({
    code: `US-${s.code}`,
    name: s.name,
    type: 'state' as const,
  })),
  // Counties (only if opt-in enabled)
  ...(locations.counties || []).map((c) => ({
    code: c.code,
    name: c.name,
    type: 'county' as const,
  })),
] : []; // Empty array if badges disabled
```

**File:** `components/vx2/customization/ProfileCustomizationPage.tsx`

```typescript
// Add badge display toggle (customization option)
<div>
  <label className="flex items-center space-x-2">
    <input
      type="checkbox"
      checked={draft.badgesEnabled}
      onChange={(e) => updateDraft({ badgesEnabled: e.target.checked })}
      className="rounded"
    />
    <span>Show Badges</span>
  </label>
  <p className="text-sm text-gray-400 mt-1">
    Display badges (countries, states, counties) for personalization
  </p>
</div>
```

### 3.3 FlagGrid County Display

**File:** `components/vx2/customization/FlagGrid.tsx`

**Changes:**
- Only show badges section if `badgesEnabled` is true (applies to all badge types)
- Filter all flags based on opt-in preference
- Group counties by state for better organization

**Implementation:**
```typescript
// Filter flags based on preferences (ALL badges are opt-in)
const countries = preferences.badgesEnabled
  ? flags.filter((f) => f.type === 'country')
  : [];
const states = preferences.badgesEnabled
  ? flags.filter((f) => f.type === 'state')
  : [];
const counties = preferences.badgesEnabled
  ? flags.filter((f) => f.type === 'county')
  : [];

// Group counties by state
const countiesByState = useMemo(() => {
  const grouped: Record<string, FlagOption[]> = {};
  counties.forEach(county => {
    const stateCode = county.code.split('-')[1]; // Extract state from "US-{state}-{fips}"
    if (!grouped[stateCode]) {
      grouped[stateCode] = [];
    }
    grouped[stateCode].push(county);
  });
  return grouped;
}, [counties]);

// Render counties grouped by state
{counties.length > 0 && (
  <div>
    <h4 className="text-sm font-medium mb-2">US Counties</h4>
    {Object.entries(countiesByState).map(([stateCode, stateCounties]) => (
      <div key={stateCode} className="mb-4">
        <h5 className="text-xs font-medium mb-2 text-gray-400">
          {US_STATE_NAMES[stateCode] || stateCode}
        </h5>
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2 sm:gap-3">
          {stateCounties.map((flag) => (
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
```

### 3.4 County Badge Deletion

**Requirement:** Users can delete specific county badges they've earned (for privacy reasons)

**Key Behavior:**
- Deletion functions as if user never drafted from that location
- User can re-earn the badge if they draft from that location again
- This prevents suspicion (missing badge looks normal if it can be re-earned)
- Use press/hold gesture (like iOS app deletion) with longer hold duration
- Only counties can be deleted (countries cannot be deleted)

**Implementation:**
- Add press/hold gesture for county badges in FlagGrid (like app deletion)
- Longer hold duration (e.g., 1-2 seconds) to prevent accidental deletion
- Show visual feedback during hold (shaking animation, delete icon)
- Show permanent deletion confirmation after hold completes
- Deletion removes county from `userLocations.counties` array
- Badge can be re-earned if user drafts from that location again

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

```typescript
// Press/hold gesture for county badge deletion (like iOS app deletion)
const [deletingCounty, setDeletingCounty] = useState<string | null>(null);
const [holdProgress, setHoldProgress] = useState(0);
const holdDuration = 1500; // 1.5 seconds
const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

// Undo functionality
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

// Handle press start for county badges
const handlePressStart = (countyCode: string) => {
  if (flag.type !== 'county') return;
  
  setDeletingCounty(countyCode);
  setHoldProgress(0);
  
  // Animate progress bar
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

// Delete confirmation and execution
const handleDeleteConfirm = (countyCode: string, countyName: string) => {
  if (!confirm(
    `Delete "${countyName}" county badge?\n\n` +
    `This will remove the badge. If you draft here again, you will earn the badge again.`
  )) {
    return;
  }
  
  deleteCountyBadge(user.uid, countyCode)
    .then(() => {
      // Badge removed, UI will update via subscription
      // Show undo button with 60 second timer
      setDeletedCounty({ code: countyCode, name: countyName });
      startUndoTimer();
    })
    .catch((error) => {
      console.error('Failed to delete county badge:', error);
      alert('Failed to delete badge. Please try again.');
    });
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
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
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

// Undo button at bottom of badge page
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

### 3.5 Remove Educational Text After Second Country Flag

**Requirement:** Remove explanation about earning flags after user earns their second country flag

**Implementation:**
- Check if user has 2+ country flags
- Hide educational text/help text about earning flags if condition is met
- This applies to any UI that explains how flags are earned

**File:** `components/vx2/customization/ProfileCustomizationPage.tsx`

```typescript
// Check if user has 2+ countries
const hasMultipleCountries = locations.countries?.length >= 2;

// Conditionally show educational text
{!hasMultipleCountries && (
  <div className="text-sm text-gray-400 mb-4">
    <p>Earn badges by visiting new locations. Enable location tracking to start collecting badges!</p>
  </div>
)}
```

---

## Part 4: Database Schema Extensions

### 4.1 Extend UserLocations Type

**File:** `lib/customization/types.ts`

```typescript
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
  // NEW - Optional context for research
  contexts?: string[];  // e.g., ['signup', 'draft_start', 'draft_update']
}
```

### 4.2 Extend CustomizationPreferences

**File:** `lib/customization/types.ts`

```typescript
export interface CustomizationPreferences {
  // ... existing fields
  badgesEnabled: boolean;  // NEW - Opt-in flag for ALL badges (countries, states, counties)
}
```

### 4.4 Tags System (Separate from Badges)

**Important:** Tags are NOT badges. They are a separate system.

**Tag Types:**
- **Experienced Drafter Tag:** Based on draft count
  - Level 1: 150 drafts completed
  - Level 2: 500 drafts completed

**Implementation Note:**
- No user can reach 150 drafts this year (max limit is 150 drafts per user)
- Tag implementation can be deferred/simplified since no one will earn tags this year
- Tags should be structured separately from badges (different UI location, different data structure)

**Future Tag Structure:**
```typescript
// Future implementation (can be deferred)
export interface UserTags {
  userId: string;
  tags: TagRecord[];
  updatedAt: Timestamp;
}

export interface TagRecord {
  tagType: 'experienced_drafter';
  level: 1 | 2;  // 1 = 150 drafts, 2 = 500 drafts
  earnedAt: Timestamp;
  draftCount: number;
}

// Tags displayed separately from badges (different section in profile)
```

### 4.3 New Research Collections

**Collections:**
- `userResearch_slowDraftLocations/{userId}_{roomId}_{timestamp}`
- `userResearch_fastDraftLocations/{userId}_{roomId}_{timestamp}`

**Purpose:** Store draft location events separately for slow vs fast drafts

**Indexes Needed:**
- `userId` + `draftType` + `timestamp`
- `roomId` + `draftType` + `timestamp`
- `county` + `draftType` + `timestamp` (for county analysis)

---

## Part 5: Implementation Checklist

### Phase 1: Signup Address & County Detection (4-6 hours)
- [ ] Add address field to RegistrationModal.js
- [ ] Add address field to signup API endpoint
- [ ] Create addressGeocoding.ts service
- [ ] Implement geocodeAddressToCounty function
- [ ] Integrate county detection in signup flow
- [ ] Test geocoding with various address formats
- [ ] Handle geocoding failures gracefully

### Phase 2: Draft Location Tracking (6-8 hours)
- [ ] Create draftLocationTracking.ts service
- [ ] Implement startDraftLocationTracking for slow drafts
- [ ] Implement stopDraftLocationTracking
- [ ] Integrate draft start location recording
- [ ] Integrate periodic location updates for slow drafts
- [ ] Test location tracking during active drafts
- [ ] Handle location permission denial gracefully

### Phase 3: User Research Integration (3-4 hours)
- [ ] Create draftLocationResearch.ts service
- [ ] Implement recordDraftLocationForResearch
- [ ] Create Firestore collections for slow/fast draft locations
- [ ] Add Firestore indexes
- [ ] Integrate with existing userMetrics.js
- [ ] Update exportMetricsForResearch to include draft locations
- [ ] Test data separation between slow and fast drafts

### Phase 4: County Badge Unlocking (2-3 hours)
- [ ] Extend recordLocationVisit to handle counties
- [ ] Update all call sites (signup, location tracking, draft tracking)
- [ ] Test county unlocking from various sources
- [ ] Verify counties are stored correctly in userLocations

### Phase 5: Badge Display Control (3-4 hours)
- [ ] Add badgesEnabled to CustomizationPreferences (customization option, not privacy)
- [ ] Add badge display toggle to ProfileCustomizationPage (framed as personalization)
- [ ] Update useCustomization hook to filter ALL badges based on display preference
- [ ] Update FlagGrid to show badges only if display enabled (countries, states, counties)
- [ ] Group counties by state in FlagGrid
- [ ] Test badge display toggle flow

### Phase 5b: County Badge Deletion (4-5 hours)
- [ ] Create badgeDeletion.ts service with deleteCountyBadge function
- [ ] Add restoreCountyBadge function for undo functionality
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

### Phase 5c: Remove Educational Text (1 hour)
- [ ] Add check for 2+ country flags
- [ ] Hide educational text about earning flags after second country earned
- [ ] Test text visibility based on country count

### Phase 7: Tags System (Deferred - No users will earn tags this year)
- [ ] Design tag data structure (separate from badges)
- [ ] Create UserTags type and collection
- [ ] Implement tag earning logic (150 drafts, 500 drafts)
- [ ] Create tag display component (separate from badge section)
- [ ] Note: Can be deferred since max draft limit is 150 this year

### Phase 6: Testing & Polish (4-6 hours)
- [ ] Test signup with address geocoding
- [ ] Test draft start location recording
- [ ] Test slow draft periodic location updates
- [ ] Test fast draft location recording (should only record at start)
- [ ] Test county badge unlocking from all sources
- [ ] Test opt-in/opt-out functionality
- [ ] Verify data separation between slow and fast drafts
- [ ] Performance testing with many counties
- [ ] Error handling and edge cases

---

## Part 6: Key Design Decisions

### 6.1 Address Geocoding
- **Decision:** Use free services (BigDataCloud/Nominatim) initially
- **Rationale:** No API costs, sufficient accuracy for county detection
- **Future:** Can upgrade to Google Maps API for better accuracy if needed

### 6.2 Draft Location Tracking
- **Decision:** Only track slow drafts continuously (watchPosition)
- **Rationale:** Fast drafts are too quick, users unlikely to move
- **Implementation:** Record location at start for fast drafts, periodic updates for slow drafts

### 7.3 Data Separation
- **Decision:** Separate Firestore collections for slow vs fast draft locations
- **Rationale:** Clear separation for analysis, easier querying, better performance
- **Collections:** `userResearch_slowDraftLocations` and `userResearch_fastDraftLocations`

### 6.4 Badge Display Control
- **Decision:** Badges are customization options - users control display (not privacy/security feature)
- **Rationale:** Personalization feature, not privacy concern. Users choose what to display.
- **Implementation:** `badgesEnabled` flag in preferences (customization option, default: disabled)

### 6.7 County Badge Deletion
- **Decision:** Users can delete county badges using press/hold gesture (like iOS app deletion)
- **Rationale:** Privacy concern - users may not want to reveal where they've been (relationship privacy)
- **Behavior:** Deletion functions as if user never drafted from that location - can be re-earned naturally
- **Implementation:** 
  - Press/hold gesture on county badges only (longer hold duration: 1.5 seconds)
  - Visual feedback during hold (shaking animation, progress indicator)
  - Confirmation dialog after hold completes
  - Countries cannot be deleted (no press/hold on countries)
- **UX Principle:** "Never say welcome back" - respect that users may have been somewhere they don't want revealed
- **Suspicion Prevention:** Missing badge looks normal if it can be re-earned by drafting from that location again

### 6.6 Tags vs Badges
- **Decision:** Tags (like "Experienced Drafter") are separate from badges
- **Rationale:** Avoids confusion, different use case (achievement vs location), different UI
- **Implementation:** Separate data structure, separate display section
- **Note:** Tag implementation can be deferred since no user can reach 150 drafts this year

### 6.5 County Unlocking
- **Decision:** Only unlock counties from geolocation (no manual selection)
- **Rationale:** Maintains authenticity, encourages location sharing
- **Sources:** Signup address, location permission, draft locations

---

## Part 7: Edge Cases & Error Handling

### 7.1 Geocoding Failures
- **Handling:** Don't fail signup if geocoding fails
- **Fallback:** User can still sign up, county will be unlocked later via geolocation
- **Logging:** Log geocoding failures for debugging

### 7.2 Location Permission Denied
- **Handling:** Don't block draft functionality
- **Fallback:** Record draft without location, user can enable later
- **UX:** Show message encouraging location sharing for county badges

### 7.3 Invalid Address Format
- **Handling:** Try to geocode anyway, may still work
- **Fallback:** If geocoding fails, user can unlock county later via geolocation
- **Validation:** Basic format check (not empty), but accept any text

### 7.4 County Not Found in Mapping
- **Handling:** Log warning, don't record county
- **Fallback:** User can unlock county later via geolocation
- **Data:** Ensure county mapping is comprehensive (all 3,143 counties)

### 7.5 Draft Location Tracking Errors
- **Handling:** Log errors but don't stop tracking
- **Fallback:** Continue tracking, skip failed updates
- **UX:** Silent failures, don't interrupt user experience

---

## Part 8: Performance Considerations

### 8.1 Geocoding Rate Limits
- **Issue:** Free services have rate limits
- **Solution:** Cache geocoding results, batch requests if possible
- **Monitoring:** Track geocoding success/failure rates

### 8.2 Location WatchPosition Battery
- **Issue:** Continuous location tracking drains battery
- **Solution:** Use low accuracy mode, 5-minute intervals, stop when draft ends
- **Optimization:** Only track during active slow drafts

### 8.3 Many Counties Performance
- **Issue:** Users could have 100+ counties
- **Solution:** Group by state, lazy loading, virtual scrolling if needed
- **Optimization:** Only load counties if opt-in enabled

---

## Part 9: Future Enhancements

### 9.1 Enhanced Geocoding
- Upgrade to Google Maps Geocoding API for better accuracy
- Add address autocomplete for better UX
- Support international addresses (non-US counties)

### 9.2 County Statistics
- Show most visited counties
- County leaderboards
- County visit history

### 9.3 Draft Location Analytics
- Heat maps of draft locations
- Slow vs fast draft location patterns
- Travel patterns during drafts

---

## Conclusion

This refined plan addresses all requirements:
- ✅ County detection from signup address
- ✅ Badge display control (customization option for ALL badges: countries, states, counties)
- ✅ Location-based county unlocking
- ✅ Draft location tracking (start + periodic for slow drafts)
- ✅ Clear separation of slow vs fast draft data
- ✅ Integration with existing user research system
- ✅ County badge deletion (press/hold gesture, longer duration, allows re-earning, counties only)
- ✅ Undo functionality (60 second countdown timer, restore deleted badge)
- ✅ Remove educational text after second country flag earned
- ✅ Tags vs Badges separation (tags are separate system, can be deferred)

**Estimated Total Time:** 26-35 hours (includes badge deletion with undo, and educational text removal)

**Priority:** Medium (can be implemented incrementally)

**Next Steps:**
1. Review and approve this refined plan
2. Begin Phase 1 (signup address integration)
3. Implement incrementally, testing each phase
4. Deploy with feature flag for gradual rollout
