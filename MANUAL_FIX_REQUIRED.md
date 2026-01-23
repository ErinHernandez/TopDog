# Manual Fix Required - npm Cache Permissions

## Issue

The npm cache directory (`/Users/td.d/.npm`) contains root-owned files that prevent npm from working. This requires **sudo** access to fix.

## Solution

Run these commands **manually in your terminal** (they require your password):

```bash
# 1. Fix npm cache permissions
sudo chown -R $(whoami) "/Users/td.d/.npm"

# 2. Reinstall debug package
npm install debug@4.3.1

# 3. Verify the file exists
ls -la node_modules/debug/src/index.js

# 4. Start the server
npm run dev
```

## Alternative: Use a Different Cache Location

If you can't use sudo, you can temporarily use a different cache:

```bash
# Set npm to use a cache in your home directory
export npm_config_cache="$HOME/.npm-cache"
mkdir -p "$HOME/.npm-cache"

# Then install
npm install debug@4.3.1

# Start server
npm run dev
```

## Why This Happened

A previous npm operation (possibly run with sudo) created root-owned files in the npm cache. This is a known issue with older npm versions.

## After Fix

Once the server starts successfully, test:

```bash
curl "http://localhost:3000/api/nfl/projections?position=RB&limit=5"
```

Expected: Should return player projections with `"source": "sportsdataio"`

---

**Note**: The server is currently running in the background but will fail due to the missing debug module. Fix the npm cache issue first, then restart the server.
