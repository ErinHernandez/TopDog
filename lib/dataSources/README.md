# Data Sources Configuration

This directory contains the data source abstraction layer that allows switching between ESPN Fantasy API and SportsDataIO for player projections and historical stats.

## Environment Variables

### Data Source Selection

```bash
# Choose data source for projections (default: 'sportsdataio')
DATA_SOURCE_PROJECTIONS=espn          # or 'sportsdataio'

# Choose data source for historical stats ingestion (default: 'espn_core')
DATA_SOURCE_HISTORICAL=espn_fantasy   # or 'espn_core' or 'sportsdataio'
```

### ESPN Fantasy API Credentials

Required when `DATA_SOURCE_PROJECTIONS=espn` or `DATA_SOURCE_HISTORICAL=espn_fantasy`:

```bash
# ESPN authentication cookies (extract from browser DevTools)
ESPN_S2_COOKIE=your_espn_s2_cookie_here
ESPN_SWID_COOKIE={your_swid_cookie_here}

# Optional: League ID (defaults to public league if not provided)
ESPN_LEAGUE_ID=123456
```

**How to get ESPN cookies:**
1. Log into ESPN Fantasy Football website
2. Open browser Developer Tools (F12)
3. Go to Application/Storage → Cookies → `https://fantasy.espn.com`
4. Copy the values for `espn_s2` and `SWID` cookies

### SportsDataIO (Fallback)

Required for fallback or when using SportsDataIO:

```bash
SPORTSDATAIO_API_KEY=your_sportsdataio_api_key_here
```

## Usage

### Projections API

The projections API automatically uses the configured data source:

```typescript
import { getProjections } from '@/lib/dataSources';

// Automatically uses ESPN or SportsDataIO based on DATA_SOURCE_PROJECTIONS
const projections = await getProjections(2025, {
  position: 'RB',
  limit: 50,
  forceRefresh: false,
});
```

### Historical Stats Ingestion

The historical stats ingestion script uses the configured source:

```bash
# Uses ESPN Fantasy API if DATA_SOURCE_HISTORICAL=espn_fantasy
node scripts/ingest-historical-data.js
```

## Fallback Behavior

- If ESPN is selected but fails, automatically falls back to SportsDataIO
- If SportsDataIO is selected, no fallback is available
- All fallbacks are logged for monitoring

## Switching Data Sources

To switch data sources, simply update the environment variables:

```bash
# Switch to ESPN
DATA_SOURCE_PROJECTIONS=espn
ESPN_S2_COOKIE=...
ESPN_SWID_COOKIE=...

# Switch back to SportsDataIO
DATA_SOURCE_PROJECTIONS=sportsdataio
```

No code changes or deployments needed - just update environment variables.
