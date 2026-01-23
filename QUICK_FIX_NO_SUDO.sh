#!/bin/bash
# Quick fix for debug module without sudo
# Run this script in your terminal: bash QUICK_FIX_NO_SUDO.sh

echo "🔧 Fixing debug module without sudo..."

# Use a cache directory in the project
export npm_config_cache="$(pwd)/.npm-cache-local"
mkdir -p .npm-cache-local

# Remove broken debug package
echo "Removing broken debug package..."
rm -rf node_modules/debug

# Install debug with custom cache
echo "Installing debug@4.3.1..."
npm install debug@4.3.1 --cache .npm-cache-local

# Verify
if [ -f "node_modules/debug/src/index.js" ]; then
    echo "✅ Success! debug module installed correctly"
    ls -la node_modules/debug/src/index.js
else
    echo "❌ Still missing. Try the manual method below."
fi

echo ""
echo "Now restart your server: npm run dev"
