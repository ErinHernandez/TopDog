# Fix Server Errors

## Current Issues

1. **Missing `debug` module**: Babel can't find `/node_modules/debug/src/index.js`
2. **Missing build manifest**: `.next/dev/fallback-build-manifest.json` doesn't exist

## Root Cause

After `rm -rf node_modules package-lock.json` and `npm install`, the `debug` package (which has an override in `package.json`) may not have been installed correctly, or the node_modules structure is incomplete.

## Solution

Run these commands in order:

```bash
# 1. Clean everything
rm -rf node_modules package-lock.json .next

# 2. Reinstall dependencies
npm install

# 3. Restart the server
npm run dev
```

## Alternative: If npm install fails

If you get override conflicts, try:

```bash
# Remove the override temporarily (or adjust it)
# Then:
npm install --legacy-peer-deps
```

## After Fix

The server should:
- ✅ Compile without Babel errors
- ✅ Create the `.next` directory properly
- ✅ Load the dataSources TypeScript modules
- ✅ Respond to API requests

## Test

Once the server starts successfully:

```bash
curl "http://localhost:3000/api/nfl/projections?position=RB&limit=5"
```

Expected: Should return player projections (not "Internal Server Error")

---

**Note**: The `.next` directory has already been cleaned. You just need to reinstall dependencies and restart.
