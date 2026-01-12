#!/bin/bash
# Quick script to update Sentry DSN in .env.local
# Usage: ./update-sentry-dsn.sh "https://your-dsn-here"

if [ -z "$1" ]; then
    echo "❌ Error: DSN required"
    echo ""
    echo "Usage: ./update-sentry-dsn.sh \"https://your-dsn@o0.ingest.sentry.io/123456\""
    echo ""
    echo "Or manually edit .env.local and update:"
    echo "NEXT_PUBLIC_SENTRY_DSN=your-dsn-here"
    exit 1
fi

DSN="$1"
ENV_FILE=".env.local"

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Creating .env.local file..."
    touch "$ENV_FILE"
fi

# Check if DSN line exists
if grep -q "NEXT_PUBLIC_SENTRY_DSN" "$ENV_FILE"; then
    # Update existing DSN
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|NEXT_PUBLIC_SENTRY_DSN=.*|NEXT_PUBLIC_SENTRY_DSN=$DSN|" "$ENV_FILE"
    else
        # Linux
        sed -i "s|NEXT_PUBLIC_SENTRY_DSN=.*|NEXT_PUBLIC_SENTRY_DSN=$DSN|" "$ENV_FILE"
    fi
    echo "✅ Updated Sentry DSN in .env.local"
else
    # Add new DSN
    echo "" >> "$ENV_FILE"
    echo "# Sentry Error Tracking" >> "$ENV_FILE"
    echo "NEXT_PUBLIC_SENTRY_DSN=$DSN" >> "$ENV_FILE"
    echo "✅ Added Sentry DSN to .env.local"
fi

echo ""
echo "📋 Next step: Restart your dev server"
echo "   npm run dev"
echo ""
echo "You should see:"
echo "   [Sentry] Client-side error tracking initialized"
echo "   [Sentry] Server-side error tracking initialized"
