# ESPN Fantasy API Integration - Testing Guide

## Quick Test

### 1. Test Configuration

```bash
node scripts/test-espn-integration.js
```

This will:
- ✅ Validate environment variables
- ✅ Check data source configuration
- ✅ Test module loading
- ✅ Verify fallback mechanism

### 2. Test via API Endpoint

**Start the dev server:**
```bash
npm run dev
```

**In another terminal, test the API:**
```bash
# Test with ESPN (if configured)
curl "http://localhost:3000/api/nfl/projections?position=RB&limit=5"

# Or use the test script
./scripts/test-espn-api-endpoint.sh
```

## Manual Testing Steps

### Step 1: Verify Environment Variables

Check that your `.env.local` has the required variables:

```bash
# For ESPN
DATA_SOURCE_PROJECTIONS=espn
ESPN_S2_COOKIE=your_cookie
ESPN_SWID_COOKIE={your_swid}

# For SportsDataIO (fallback)
SPORTSDATAIO_API_KEY=your_key
```

### Step 2: Test Projections API

**With ESPN:**
```bash
curl "http://localhost:3000/api/nfl/projections?position=RB&limit=10"
```

**Expected response:**
```json
{
  "success": true,
  "statusCode": 200,
  "body": {
    "season": 2025,
    "count": 10,
    "source": "espn",
    "data": [
      {
        "PlayerID": 12345,
        "Name": "Player Name",
        "Position": "RB",
        "Team": "BUF",
        "FantasyPointsPPR": 250.5,
        "_source": "espn"
      }
    ]
  }
}
```

### Step 3: Test Fallback

To test fallback, temporarily use invalid ESPN credentials:

```bash
# Set invalid cookie
ESPN_S2_COOKIE=invalid
```

Then make the same API request. It should automatically fall back to SportsDataIO.

### Step 4: Test Historical Data Ingestion

```bash
# Using ESPN Core API (default, no auth needed)
node scripts/ingest-historical-data.js

# Using ESPN Fantasy API (requires auth)
DATA_SOURCE_HISTORICAL=espn_fantasy node scripts/ingest-historical-data.js
```

## Verification Checklist

- [ ] Configuration test passes
- [ ] Projections API returns data
- [ ] Source is correctly identified in response
- [ ] Fallback works when ESPN fails
- [ ] Historical data ingestion script runs
- [ ] Player cards still display correctly
- [ ] No errors in server logs

## Troubleshooting

### "ESPN credentials required" error
- Make sure `ESPN_S2_COOKIE` and `ESPN_SWID_COOKIE` are set
- Extract cookies from browser DevTools (see README in `lib/dataSources/`)

### "SPORTSDATAIO_API_KEY required" error
- Set `SPORTSDATAIO_API_KEY` in `.env.local`
- Or set `DATA_SOURCE_PROJECTIONS=espn` to use ESPN only

### API returns empty data
- Check that the season is correct (current year)
- Verify ESPN cookies are valid (they can expire)
- Check server logs for detailed error messages

### TypeScript import errors in test script
- This is normal - TypeScript modules work in Next.js runtime
- Test via API endpoint instead
- Or use `ts-node` to run TypeScript directly

## Next Steps After Testing

1. **If tests pass**: Switch to ESPN in production by updating environment variables
2. **If issues found**: Check logs, verify credentials, test fallback
3. **Monitor**: Watch for ESPN API changes or rate limiting
