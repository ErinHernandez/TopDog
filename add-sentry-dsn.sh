#!/bin/bash
# Add Sentry DSN to .env.local
# Run this script, then replace the placeholder with your actual DSN

ENV_FILE=".env.local"

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Creating .env.local file..."
    touch "$ENV_FILE"
fi

# Check if DSN already exists
if grep -q "NEXT_PUBLIC_SENTRY_DSN" "$ENV_FILE"; then
    echo "⚠️  Sentry DSN already exists in .env.local"
    echo ""
    echo "Current value:"
    grep "NEXT_PUBLIC_SENTRY_DSN" "$ENV_FILE"
    echo ""
    echo "If you want to update it, edit .env.local manually."
else
    echo "Adding Sentry DSN placeholder to .env.local..."
    echo "" >> "$ENV_FILE"
    echo "# Sentry Error Tracking" >> "$ENV_FILE"
    echo "# Get your DSN from https://sentry.io -> Your Project -> Settings -> Client Keys" >> "$ENV_FILE"
    echo "NEXT_PUBLIC_SENTRY_DSN=https://your-public-key@o0.ingest.sentry.io/your-project-id" >> "$ENV_FILE"
    echo ""
    echo "✅ Added Sentry DSN placeholder to .env.local"
    echo ""
    echo "📋 Next steps:"
    echo "1. Get your DSN from https://sentry.io"
    echo "2. Open .env.local and replace the placeholder with your actual DSN"
    echo "3. Restart your dev server: npm run dev"
fi
