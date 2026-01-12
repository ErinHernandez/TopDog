#!/bin/bash
# Test Sentry error tracking
# Run this after starting your dev server: npm run dev

echo "🧪 Testing Sentry Error Tracking..."
echo ""

# Check if server is running
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "❌ Dev server is not running!"
    echo ""
    echo "Please start it first:"
    echo "  npm run dev"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "✅ Dev server is running"
echo ""

# Test 1: Check Sentry configuration
echo "📋 Test 1: Checking Sentry configuration..."
CONFIG_RESPONSE=$(curl -s http://localhost:3000/api/test-sentry)
echo "$CONFIG_RESPONSE" | jq '.' 2>/dev/null || echo "$CONFIG_RESPONSE"
echo ""

# Test 2: Trigger server-side error
echo "📋 Test 2: Triggering server-side error..."
ERROR_RESPONSE=$(curl -s -X POST http://localhost:3000/api/test-sentry)
echo "$ERROR_RESPONSE" | jq '.' 2>/dev/null || echo "$ERROR_RESPONSE"
echo ""

echo "✅ Test complete!"
echo ""
echo "📊 Next steps:"
echo "1. Check your Sentry dashboard: https://topdogdog.sentry.io/issues/"
echo "2. The error should appear within 30 seconds"
echo "3. Look for 'SentryTestError' in the Issues feed"
echo ""
echo "🌐 Or visit the test page in your browser:"
echo "   http://localhost:3000/test-sentry"
