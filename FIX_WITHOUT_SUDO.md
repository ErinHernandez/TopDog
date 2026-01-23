# Fix npm Cache Issue Without Sudo

## Alternative Solution (No Password Required)

If you can't use sudo, you can work around the npm cache issue by using a different cache location:

```bash
# 1. Set npm to use a cache in your home directory (no sudo needed)
export npm_config_cache="$HOME/.npm-cache"
mkdir -p "$HOME/.npm-cache"

# 2. Remove the broken debug package
rm -rf node_modules/debug

# 3. Install debug with the new cache location
npm install debug@4.3.1

# 4. Verify it worked
ls -la node_modules/debug/src/index.js

# 5. Restart the server
npm run dev
```

## Or: Use npm ci with clean install

```bash
# 1. Remove node_modules and package-lock
rm -rf node_modules package-lock.json

# 2. Set custom cache
export npm_config_cache="$HOME/.npm-cache"
mkdir -p "$HOME/.npm-cache"

# 3. Fresh install
npm install

# 4. Start server
npm run dev
```

## Why This Works

By setting `npm_config_cache` to a directory you own, npm will use that instead of the root-owned `/Users/td.d/.npm` cache, avoiding the permission issue entirely.

---

**Note**: The `export` command only lasts for the current terminal session. If you open a new terminal, you'll need to run it again, or add it to your `~/.zshrc` file to make it permanent.
