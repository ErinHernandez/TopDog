# International Administrative Divisions - Extension to Location Integrity System

**Project:** Bestball Site
**Date:** January 2025
**Status:** Ready for Implementation
**Dependency:** `LOCATION_INTEGRITY_SYSTEM_DESIGN.md` (must be implemented first or in parallel)

---

## Executive Summary

This document extends the **Location Integrity System** to support international administrative division badges (provinces, regions, states, districts, etc.) for countries outside the United States.

**This is NOT a standalone system.** It hooks into the location data already being captured by `LocationIntegrityService` from `LOCATION_INTEGRITY_SYSTEM_DESIGN.md`.

### What the Location Integrity System Already Provides
- Per-pick lat/lng capture with every pick submission
- Reverse geocoding via BigDataCloud API
- `pickLocations` Firestore collection with coordinates
- `userBadges` Firestore collection for badge derivation
- Country and state codes from reverse geocoding

### What This Extension Adds
- Extract ISO 3166-2 division codes from existing BigDataCloud response
- Store division data in `pickLocations` (additional fields)
- Derive division badges in `userBadges` (additional array)
- Display division badges in `FlagGrid` component
- Division badge images (~200-300 for Phase 1 countries)

**Estimated Implementation Time:** 8-12 hours (leverages existing location infrastructure)

---

## Part 1: Schema Extensions

### 1.1 Extend PickLocation Interface

**File:** `lib/location/types.ts` (or wherever Location Integrity types are defined)

Add these fields to the existing `PickLocation` interface:

```typescript
interface PickLocation {
  // ... existing fields from LOCATION_INTEGRITY_SYSTEM_DESIGN.md ...
  // id, draftId, pickNumber, userId, timestamp, lat, lng, accuracy,
  // ipAddress, countyCode, countryCode, stateCode, within50ft, sameIp,
  // deviceId, createdAt

  // NEW - International administrative division (ISO 3166-2)
  divisionCode: string | null;      // e.g., "CA-ON", "AU-NSW", "GB-ENG"
  divisionName: string | null;      // e.g., "Ontario", "New South Wales"
  divisionType: DivisionType | null;
}

type DivisionType =
  | 'province'    // Canada, China, South Africa, Netherlands
  | 'state'       // Australia, Brazil, Mexico, India, Germany
  | 'region'      // France, Italy, Spain, Chile
  | 'country'     // UK constituent countries (England, Scotland, Wales, NI)
  | 'prefecture'  // Japan
  | 'territory'   // Canadian territories, Australian territories
  | 'district'    // Other
  | 'other';
```

### 1.2 Extend UserBadges Interface

**File:** `lib/location/types.ts`

Add divisions array to existing `UserBadges` interface:

```typescript
interface UserBadges {
  // ... existing fields ...
  // userId, visibleBadge, countries, states, counties, updatedAt

  // NEW - International divisions
  divisions: BadgeRecord[];
}

// BadgeRecord already exists, reuse it:
interface BadgeRecord {
  code: string;        // ISO 3166-2 code: "CA-ON"
  name: string;        // "Ontario"
  firstEarned: Timestamp;
  pickCount: number;
  // NEW - Optional metadata for divisions
  divisionType?: DivisionType;
}
```

---

## Part 2: Extract Division from BigDataCloud Response

### 2.1 BigDataCloud Response Structure

The Location Integrity System already calls BigDataCloud for reverse geocoding. The response includes division data we're currently ignoring:

```json
{
  "countryCode": "CA",
  "countryName": "Canada",
  "principalSubdivision": "Ontario",
  "principalSubdivisionCode": "ON",
  "city": "Toronto",
  "locality": "Toronto",
  "localityInfo": {
    "administrative": [
      {
        "name": "Ontario",
        "isoCode": "CA-ON",
        "order": 4,
        "adminLevel": 4
      }
    ]
  }
}
```

**Key fields to extract:**
- `principalSubdivision` → division name
- `principalSubdivisionCode` → subdivision code (combine with countryCode for ISO 3166-2)
- OR `localityInfo.administrative[].isoCode` → full ISO 3166-2 code directly

### 2.2 Modify reverseGeocode() in LocationIntegrityService

**File:** `lib/location/LocationIntegrityService.ts` (from main design)

Find the `reverseGeocode()` method and extend the return type and extraction logic:

```typescript
interface ReverseGeocodeResult {
  // Existing fields
  countryCode: string;
  countryName: string;
  stateCode: string | null;
  stateName: string | null;
  countyCode: string | null;  // US only: "US-CA-06037"
  countyName: string | null;

  // NEW - International division fields
  divisionCode: string | null;   // ISO 3166-2: "CA-ON", "AU-NSW"
  divisionName: string | null;
  divisionType: DivisionType | null;
}

private async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const response = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
  );
  const data = await response.json();

  const countryCode = data.countryCode || 'XX';

  // Existing US county logic...
  let countyCode: string | null = null;
  let countyName: string | null = null;
  if (countryCode === 'US') {
    // ... existing county extraction ...
  }

  // NEW - International division extraction (non-US only)
  let divisionCode: string | null = null;
  let divisionName: string | null = null;
  let divisionType: DivisionType | null = null;

  if (countryCode !== 'US' && data.principalSubdivisionCode) {
    // Build ISO 3166-2 code
    divisionCode = `${countryCode}-${data.principalSubdivisionCode}`;
    divisionName = data.principalSubdivision || null;
    divisionType = getDivisionTypeForCountry(countryCode);
  }

  return {
    countryCode,
    countryName: data.countryName || countryCode,
    stateCode: countryCode === 'US' ? data.principalSubdivisionCode : null,
    stateName: countryCode === 'US' ? data.principalSubdivision : null,
    countyCode,
    countyName,
    divisionCode,
    divisionName,
    divisionType,
  };
}
```

### 2.3 Division Type Mapping by Country

**File:** `lib/location/divisionTypes.ts` (NEW)

```typescript
/**
 * Maps country codes to their administrative division type.
 * Used for display purposes ("Province" vs "State" vs "Region").
 */

const DIVISION_TYPE_BY_COUNTRY: Record<string, DivisionType> = {
  // Provinces
  'CA': 'province',  // Canada
  'CN': 'province',  // China
  'ZA': 'province',  // South Africa
  'NL': 'province',  // Netherlands
  'BE': 'province',  // Belgium
  'AR': 'province',  // Argentina
  'PK': 'province',  // Pakistan

  // States
  'AU': 'state',     // Australia
  'BR': 'state',     // Brazil
  'MX': 'state',     // Mexico
  'IN': 'state',     // India
  'DE': 'state',     // Germany (Länder)
  'NG': 'state',     // Nigeria
  'MY': 'state',     // Malaysia

  // Regions
  'FR': 'region',    // France
  'IT': 'region',    // Italy
  'ES': 'region',    // Spain (autonomous communities)
  'CL': 'region',    // Chile
  'PE': 'region',    // Peru
  'PH': 'region',    // Philippines

  // UK constituent countries
  'GB': 'country',   // United Kingdom

  // Prefectures
  'JP': 'prefecture', // Japan

  // Territories (handled as special cases within countries)
};

export function getDivisionTypeForCountry(countryCode: string): DivisionType {
  return DIVISION_TYPE_BY_COUNTRY[countryCode] || 'other';
}

export function getDivisionTypeLabel(type: DivisionType): string {
  const labels: Record<DivisionType, string> = {
    province: 'Province',
    state: 'State',
    region: 'Region',
    country: 'Country',
    prefecture: 'Prefecture',
    territory: 'Territory',
    district: 'District',
    other: 'Division',
  };
  return labels[type];
}
```

---

## Part 3: Store Division in pickLocations

### 3.1 Update recordPickLocation()

**File:** `lib/location/LocationIntegrityService.ts`

In the `recordPickLocation()` method, include the division fields when writing to Firestore:

```typescript
async recordPickLocation(params: {
  draftId: string;
  pickNumber: number;
  userId: string;
  lat: number;
  lng: number;
  accuracy: number;
  ipAddress: string;
  deviceId: string;
}): Promise<void> {
  const { draftId, pickNumber, userId, lat, lng, accuracy, ipAddress, deviceId } = params;

  // Reverse geocode (already includes division extraction now)
  const geo = await this.reverseGeocode(lat, lng);

  // Check proximity (existing logic)
  const proximity = await this.checkProximity(draftId, lat, lng, ipAddress, userId);

  // Write to Firestore
  const pickLocationRef = doc(collection(db, 'pickLocations'));
  await setDoc(pickLocationRef, {
    id: pickLocationRef.id,
    draftId,
    pickNumber,
    userId,
    timestamp: serverTimestamp(),
    lat,
    lng,
    accuracy,
    ipAddress,

    // Location hierarchy
    countryCode: geo.countryCode,
    stateCode: geo.stateCode,         // US only
    countyCode: geo.countyCode,       // US only

    // NEW - International division
    divisionCode: geo.divisionCode,   // Non-US only
    divisionName: geo.divisionName,
    divisionType: geo.divisionType,

    // Proximity flags
    within50ft: proximity.within50ft,
    sameIp: proximity.sameIp,

    deviceId,
    createdAt: serverTimestamp(),
  });

  // Update badges (existing call, but now includes divisions)
  await this.updateUserBadges(userId, geo);
}
```

---

## Part 4: Derive Division Badges

### 4.1 Update updateUserBadges()

**File:** `lib/location/LocationIntegrityService.ts`

Extend the badge derivation to include divisions:

```typescript
private async updateUserBadges(
  userId: string,
  geo: ReverseGeocodeResult
): Promise<void> {
  const badgesRef = doc(db, 'userBadges', visibleBadge
  const now = Timestamp.now();

  await runTransaction(db, async (transaction) => {
    const badgesSnap = await transaction.get(badgesRef);

    const badges: UserBadges = badgesSnap.exists()
      ? badgesSnap.data() as UserBadges
      : {
          userId,
          visibleBadge: null,
          countries: [],
          states: [],
          counties: [],
          divisions: [],  // NEW
          updatedAt: now,
        };

    // Update country badge (existing logic)
    // ... existing code ...

    // Update state badge - US only (existing logic)
    // ... existing code ...

    // Update county badge - US only (existing logic)
    // ... existing code ...

    // NEW - Update division badge (non-US only)
    if (geo.divisionCode && geo.countryCode !== 'US') {
      const divIdx = badges.divisions.findIndex(d => d.code === geo.divisionCode);
      if (divIdx >= 0) {
        badges.divisions[divIdx].pickCount++;
      } else {
        badges.divisions.push({
          code: geo.divisionCode,
          name: geo.divisionName || geo.divisionCode,
          firstEarned: now,
          pickCount: 1,
          divisionType: geo.divisionType || undefined,
        });
      }
    }

    badges.updatedAt = now;
    transaction.set(badgesRef, badges);
  });
}
```

---

## Part 5: Display Division Badges

### 5.1 Update FlagOption Type

**File:** `lib/customization/types.ts`

```typescript
export interface FlagOption {
  code: string;
  name: string;
  type: 'country' | 'state' | 'county' | 'division';  // Add 'division'
}
```

### 5.2 Update useCustomization Hook

**File:** `components/vx2/customization/hooks/useCustomization.ts`

In the subscription callback that converts badges to flags:

```typescript
// Subscribe to userBadges (from Location Integrity System)
const unsubscribe = onSnapshot(
  doc(db, 'userBadges', user.uid),
  (snapshot) => {
    if (!snapshot.exists()) {
      setAvailableFlags([]);
      return;
    }

    const badges = snapshot.data() as UserBadges;

    const flags: FlagOption[] = [
      // Countries
      ...badges.countries.map(c => ({
        code: c.code,
        name: c.name,
        type: 'country' as const,
      })),

      // US States
      ...badges.states.map(s => ({
        code: s.code,
        name: s.name,
        type: 'state' as const,
      })),

      // US Counties
      ...(badges.counties || []).map(c => ({
        code: c.code,
        name: c.name,
        type: 'county' as const,
      })),

      // NEW - International Divisions
      ...(badges.divisions || []).map(d => ({
        code: d.code,
        name: d.name,
        type: 'division' as const,
      })),
    ];

    setAvailableFlags(flags);
  }
);
```

### 5.3 Update FlagGrid Component

**File:** `components/vx2/customization/FlagGrid.tsx`

Add division section:

```typescript
const divisions = flags.filter(f => f.type === 'division');

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

// In the JSX return:
{Object.keys(divisionsByCountry).length > 0 && (
  <div>
    <h4 className="text-sm font-medium mb-2" style={{ color: 'rgba(209, 213, 219, 0.9)' }}>
      Regions & Provinces
    </h4>
    {Object.entries(divisionsByCountry).map(([countryCode, countryDivisions]) => (
      <div key={countryCode} className="mb-3">
        <h5 className="text-xs font-medium mb-1" style={{ color: 'rgba(209, 213, 219, 0.6)' }}>
          {getCountryName(countryCode)}
        </h5>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {countryDivisions.map(flag => (
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

### 5.4 Update getFlagUrl Function

**File:** `lib/customization/flags.ts`

```typescript
export function getFlagUrl(code: string): string {
  // County format: "US-{stateCode}-{fipsCode}"
  if (code.match(/^US-[A-Z]{2}-\d{5}$/)) {
    return `/badges/county/${code}.svg`;
  }

  // US State format: "US-{stateCode}"
  if (code.match(/^US-[A-Z]{2}$/)) {
    return `/flags/states/${code.slice(3).toLowerCase()}.svg`;
  }

  // International Division format: "{countryCode}-{subdivisionCode}" (ISO 3166-2)
  // Must be checked AFTER US state (both are XX-YY format)
  if (code.match(/^[A-Z]{2}-[A-Z0-9]{1,3}$/) && !code.startsWith('US-')) {
    return `/badges/division/${code}.svg`;
  }

  // Country format: "{countryCode}"
  return `/flags/countries/${code.toLowerCase()}.svg`;
}
```

---

## Part 6: Division Name Mapping

### 6.1 Create Division Names File

**File:** `lib/customization/divisionNames.ts` (NEW)

```typescript
/**
 * Division Names Mapping
 *
 * Maps ISO 3166-2 codes to display names for international divisions.
 * Only includes Phase 1 priority countries.
 */

export const DIVISION_NAMES: Record<string, string> = {
  // Canada - Provinces
  'CA-ON': 'Ontario',
  'CA-QC': 'Quebec',
  'CA-BC': 'British Columbia',
  'CA-AB': 'Alberta',
  'CA-MB': 'Manitoba',
  'CA-SK': 'Saskatchewan',
  'CA-NS': 'Nova Scotia',
  'CA-NB': 'New Brunswick',
  'CA-NL': 'Newfoundland and Labrador',
  'CA-PE': 'Prince Edward Island',
  'CA-NT': 'Northwest Territories',
  'CA-YT': 'Yukon',
  'CA-NU': 'Nunavut',

  // Australia - States & Territories
  'AU-NSW': 'New South Wales',
  'AU-VIC': 'Victoria',
  'AU-QLD': 'Queensland',
  'AU-WA': 'Western Australia',
  'AU-SA': 'South Australia',
  'AU-TAS': 'Tasmania',
  'AU-ACT': 'Australian Capital Territory',
  'AU-NT': 'Northern Territory',

  // United Kingdom - Countries
  'GB-ENG': 'England',
  'GB-SCT': 'Scotland',
  'GB-WLS': 'Wales',
  'GB-NIR': 'Northern Ireland',

  // Germany - States (Länder)
  'DE-BW': 'Baden-Württemberg',
  'DE-BY': 'Bavaria',
  'DE-BE': 'Berlin',
  'DE-BB': 'Brandenburg',
  'DE-HB': 'Bremen',
  'DE-HH': 'Hamburg',
  'DE-HE': 'Hesse',
  'DE-MV': 'Mecklenburg-Vorpommern',
  'DE-NI': 'Lower Saxony',
  'DE-NW': 'North Rhine-Westphalia',
  'DE-RP': 'Rhineland-Palatinate',
  'DE-SL': 'Saarland',
  'DE-SN': 'Saxony',
  'DE-ST': 'Saxony-Anhalt',
  'DE-SH': 'Schleswig-Holstein',
  'DE-TH': 'Thuringia',

  // France - Regions
  'FR-IDF': 'Île-de-France',
  'FR-ARA': 'Auvergne-Rhône-Alpes',
  'FR-BFC': 'Bourgogne-Franche-Comté',
  'FR-BRE': 'Brittany',
  'FR-CVL': 'Centre-Val de Loire',
  'FR-COR': 'Corsica',
  'FR-GES': 'Grand Est',
  'FR-HDF': 'Hauts-de-France',
  'FR-NOR': 'Normandy',
  'FR-NAQ': 'Nouvelle-Aquitaine',
  'FR-OCC': 'Occitanie',
  'FR-PDL': 'Pays de la Loire',
  'FR-PAC': "Provence-Alpes-Côte d'Azur",

  // Italy - Regions
  'IT-21': 'Piedmont',
  'IT-23': 'Aosta Valley',
  'IT-25': 'Lombardy',
  'IT-32': 'Trentino-Alto Adige',
  'IT-34': 'Veneto',
  'IT-36': 'Friuli Venezia Giulia',
  'IT-42': 'Liguria',
  'IT-45': 'Emilia-Romagna',
  'IT-52': 'Tuscany',
  'IT-55': 'Umbria',
  'IT-57': 'Marche',
  'IT-62': 'Lazio',
  'IT-65': 'Abruzzo',
  'IT-67': 'Molise',
  'IT-72': 'Campania',
  'IT-75': 'Apulia',
  'IT-77': 'Basilicata',
  'IT-78': 'Calabria',
  'IT-82': 'Sicily',
  'IT-88': 'Sardinia',

  // Mexico - States
  'MX-AGU': 'Aguascalientes',
  'MX-BCN': 'Baja California',
  'MX-BCS': 'Baja California Sur',
  'MX-CAM': 'Campeche',
  'MX-CHP': 'Chiapas',
  'MX-CHH': 'Chihuahua',
  'MX-CMX': 'Mexico City',
  'MX-COA': 'Coahuila',
  'MX-COL': 'Colima',
  'MX-DUR': 'Durango',
  'MX-GUA': 'Guanajuato',
  'MX-GRO': 'Guerrero',
  'MX-HID': 'Hidalgo',
  'MX-JAL': 'Jalisco',
  'MX-MEX': 'México',
  'MX-MIC': 'Michoacán',
  'MX-MOR': 'Morelos',
  'MX-NAY': 'Nayarit',
  'MX-NLE': 'Nuevo León',
  'MX-OAX': 'Oaxaca',
  'MX-PUE': 'Puebla',
  'MX-QUE': 'Querétaro',
  'MX-ROO': 'Quintana Roo',
  'MX-SLP': 'San Luis Potosí',
  'MX-SIN': 'Sinaloa',
  'MX-SON': 'Sonora',
  'MX-TAB': 'Tabasco',
  'MX-TAM': 'Tamaulipas',
  'MX-TLA': 'Tlaxcala',
  'MX-VER': 'Veracruz',
  'MX-YUC': 'Yucatán',
  'MX-ZAC': 'Zacatecas',

  // Brazil - States (most populous)
  'BR-SP': 'São Paulo',
  'BR-RJ': 'Rio de Janeiro',
  'BR-MG': 'Minas Gerais',
  'BR-BA': 'Bahia',
  'BR-RS': 'Rio Grande do Sul',
  'BR-PR': 'Paraná',
  'BR-PE': 'Pernambuco',
  'BR-CE': 'Ceará',
  'BR-PA': 'Pará',
  'BR-SC': 'Santa Catarina',
  'BR-GO': 'Goiás',
  'BR-MA': 'Maranhão',
  'BR-AM': 'Amazonas',
  'BR-ES': 'Espírito Santo',
  'BR-PB': 'Paraíba',
  'BR-DF': 'Federal District',

  // India - States (most populous)
  'IN-UP': 'Uttar Pradesh',
  'IN-MH': 'Maharashtra',
  'IN-BR': 'Bihar',
  'IN-WB': 'West Bengal',
  'IN-MP': 'Madhya Pradesh',
  'IN-TN': 'Tamil Nadu',
  'IN-RJ': 'Rajasthan',
  'IN-KA': 'Karnataka',
  'IN-GJ': 'Gujarat',
  'IN-AP': 'Andhra Pradesh',
  'IN-OR': 'Odisha',
  'IN-TG': 'Telangana',
  'IN-KL': 'Kerala',
  'IN-JH': 'Jharkhand',
  'IN-AS': 'Assam',
  'IN-PB': 'Punjab',
  'IN-HR': 'Haryana',
  'IN-DL': 'Delhi',

  // Spain - Autonomous Communities
  'ES-AN': 'Andalusia',
  'ES-AR': 'Aragon',
  'ES-AS': 'Asturias',
  'ES-IB': 'Balearic Islands',
  'ES-CN': 'Canary Islands',
  'ES-CB': 'Cantabria',
  'ES-CL': 'Castile and León',
  'ES-CM': 'Castilla-La Mancha',
  'ES-CT': 'Catalonia',
  'ES-EX': 'Extremadura',
  'ES-GA': 'Galicia',
  'ES-MD': 'Madrid',
  'ES-MC': 'Murcia',
  'ES-NC': 'Navarre',
  'ES-PV': 'Basque Country',
  'ES-RI': 'La Rioja',
  'ES-VC': 'Valencia',
};

export function getDivisionName(code: string): string {
  return DIVISION_NAMES[code] || code;
}
```

---

## Part 7: Badge Images

### 7.1 Directory Structure

```
public/
  badges/
    division/           # NEW - International division badges
      CA-ON.svg         # Ontario
      CA-QC.svg         # Quebec
      CA-BC.svg         # British Columbia
      ...
      AU-NSW.svg        # New South Wales
      AU-VIC.svg        # Victoria
      ...
      GB-ENG.svg        # England
      GB-SCT.svg        # Scotland
      ...
      DE-BY.svg         # Bavaria
      ...
      FR-IDF.svg        # Île-de-France
      ...
    default.svg         # Fallback (already exists)
```

### 7.2 Image Specifications

- **Format:** SVG preferred, PNG acceptable
- **Size:** 200x200px recommended
- **Content:** Regional flag, coat of arms, or emblem
- **Naming:** `{ISO 3166-2 code}.svg` (e.g., `CA-ON.svg`)
- **Fallback:** Component already handles missing images via `default.svg`

### 7.3 Image Sources

1. **Regional flags** (Wikipedia Commons, public domain)
2. **Coats of arms** (government sources)
3. **Generated badges** (use country flag + division name overlay)

### 7.4 Phase 1 Image Count

| Country | Divisions | Priority |
|---------|-----------|----------|
| Canada | 13 | High |
| Australia | 8 | High |
| United Kingdom | 4 | High |
| Germany | 16 | High |
| France | 13 | Medium |
| Italy | 20 | Medium |
| Spain | 17 | Medium |
| Mexico | 32 | Medium |
| Brazil | 16 | Medium |
| India | 18 | Medium |
| **Total** | **~157** | |

---

## Part 8: Dev Testing

### 8.1 Add Division Dev Flags

**File:** `components/vx2/customization/hooks/useCustomization.ts`

```typescript
const DEV_FLAGS: FlagOption[] = [
  // Existing
  { code: 'US', name: 'United States', type: 'country' },
  { code: 'US-SC', name: 'South Carolina', type: 'state' },
  { code: 'US-CA-06037', name: 'Los Angeles', type: 'county' },

  // NEW - Sample divisions for testing
  { code: 'CA-ON', name: 'Ontario', type: 'division' },
  { code: 'AU-NSW', name: 'New South Wales', type: 'division' },
  { code: 'GB-ENG', name: 'England', type: 'division' },
  { code: 'DE-BY', name: 'Bavaria', type: 'division' },
  { code: 'FR-IDF', name: 'Île-de-France', type: 'division' },
];
```

---

## Part 9: Implementation Checklist

### Phase 1: Schema & Extraction (2-3 hours)
- [ ] Add `divisionCode`, `divisionName`, `divisionType` to `PickLocation` interface
- [ ] Add `divisions` array to `UserBadges` interface
- [ ] Create `lib/location/divisionTypes.ts` with type mapping
- [ ] Modify `reverseGeocode()` to extract division from BigDataCloud response

### Phase 2: Storage & Derivation (2-3 hours)
- [ ] Update `recordPickLocation()` to store division fields
- [ ] Update `updateUserBadges()` to derive division badges
- [ ] Test with sample international coordinates

### Phase 3: Display (2-3 hours)
- [ ] Add `'division'` to `FlagOption` type
- [ ] Update `useCustomization` hook to include divisions
- [ ] Update `FlagGrid` to display divisions grouped by country
- [ ] Update `getFlagUrl()` to handle division codes
- [ ] Create `divisionNames.ts` mapping file

### Phase 4: Images (2-3 hours)
- [ ] Create `public/badges/division/` directory
- [ ] Source/create badges for Phase 1 countries (~157 images)
- [ ] Test fallback behavior for missing images

---

## Part 10: What This Document Does NOT Cover

These items are either:
- Already handled by `LOCATION_INTEGRITY_SYSTEM_DESIGN.md`
- Explicitly out of scope
- Deferred to future iterations

1. **Location capture mechanism** → Use `LocationIntegrityService` from main design
2. **Proximity detection** → Already in main design
3. **Address geocoding at signup** → Not needed; coordinate-based is more accurate
4. **Separate location tracking files** → Use unified system
5. **Badge deletion with undo** → Can add later if needed
6. **Tags system ("Experienced Drafter")** → Separate feature, deferred
7. **User research integration** → Main design handles data storage; research queries are separate

---

## Summary

This extension adds international division badges with minimal new code by leveraging:

1. **Existing BigDataCloud response** — just extract additional fields
2. **Existing `pickLocations` collection** — just add 3 fields
3. **Existing `userBadges` collection** — just add 1 array
4. **Existing `FlagGrid` component** — just add 1 section
5. **Existing fallback behavior** — handles missing images gracefully

**Total new files:** 2 (`divisionTypes.ts`, `divisionNames.ts`)
**Total modified files:** 4-5
**Estimated time:** 8-12 hours
**Dependency:** `LOCATION_INTEGRITY_SYSTEM_DESIGN.md` must be implemented first or in parallel
