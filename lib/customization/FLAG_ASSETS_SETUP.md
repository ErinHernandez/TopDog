# Flag Assets Setup Guide

## Overview

The customization system requires flag SVG assets for country and US state flags. These flags are unlocked based on user location history.

## Directory Structure

```
public/
├── flags/
│   ├── countries/          # Country flag SVGs (lowercase ISO alpha-2 codes)
│   │   ├── us.svg
│   │   ├── ca.svg
│   │   ├── gb.svg
│   │   └── ... (~50 common countries)
│   └── states/            # US state flag SVGs (lowercase state abbreviations)
│       ├── ca.svg
│       ├── ny.svg
│       ├── tx.svg
│       └── ... (all 50 states + DC)
└── customization/
    └── images/
        └── hotdog.svg     # Initial overlay image (already created)
```

## Flag Sources

### Country Flags

**Recommended Source:** https://flagcdn.com/

Free tier allows 1000 requests/day. Flags are available at:
- `https://flagcdn.com/{code}.svg` (e.g., `https://flagcdn.com/us.svg`)

**Common Countries to Include:**
- US, CA, MX, GB, DE, FR, ES, IT, PT, NL, BE, CH, AT, SE, NO, DK, FI, IE, PL, CZ, GR, TR, RU, UA, JP, CN, KR, IN, AU, NZ, BR, AR, CL, CO, PE, ZA, EG, NG, KE, IL, AE, SA, SG, MY, TH, VN, PH, ID, PK

### US State Flags

**Recommended Source:** https://github.com/CivilServiceUSA/us-states/tree/master/images/flags

Or use individual state government websites for official flags.

**All 50 States + DC:**
- AL, AK, AZ, AR, CA, CO, CT, DE, FL, GA, HI, ID, IL, IN, IA, KS, KY, LA, ME, MD, MA, MI, MN, MS, MO, MT, NE, NV, NH, NJ, NM, NY, NC, ND, OH, OK, OR, PA, RI, SC, SD, TN, TX, UT, VT, VA, WA, WV, WI, WY, DC

## Download Script

A bash script is provided in the implementation plan to download country flags from flagcdn.com. US state flags must be added manually.

## File Naming Convention

- **Countries:** Lowercase ISO alpha-2 code (e.g., `us.svg`, `ca.svg`, `gb.svg`)
- **States:** Lowercase state abbreviation (e.g., `ca.svg`, `ny.svg`, `tx.svg`)
- **State codes in Firebase:** Prefixed with `US-` (e.g., `US-CA`, `US-NY`)

## Caching

Flag assets are cached via `vercel.json` headers:
- Cache-Control: `public, max-age=31536000, immutable`

## Fallback Behavior

If a flag image fails to load, the `FlagGrid` component displays a fallback with the flag code text.
