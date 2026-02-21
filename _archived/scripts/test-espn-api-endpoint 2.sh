#!/bin/bash

# Test ESPN Integration via API Endpoint
# Requires dev server to be running: npm run dev

echo "🧪 Testing ESPN Integration via API Endpoint"
echo "=============================================="
echo ""

# Check if server is running
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
  echo "❌ Dev server is not running!"
  echo "   Please start it with: npm run dev"
  exit 1
fi

echo "✅ Dev server is running"
echo ""

# Test projections endpoint
echo "📊 Testing Projections API..."
echo "   GET /api/nfl/projections?position=RB&limit=5"
echo ""

response=$(curl -s "http://localhost:3000/api/nfl/projections?position=RB&limit=5")

if [ $? -eq 0 ]; then
  echo "✅ API request successful"
  echo ""
  echo "Response:"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
  echo ""
  
  # Check if response has data
  count=$(echo "$response" | jq '.body.data | length' 2>/dev/null || echo "0")
  source=$(echo "$response" | jq -r '.body.source' 2>/dev/null || echo "unknown")
  
  echo "   Results: $count players"
  echo "   Source: $source"
  
  if [ "$count" -gt 0 ]; then
    echo ""
    echo "✅ Test passed!"
    exit 0
  else
    echo ""
    echo "⚠️  No data returned (may be expected if no projections available)"
    exit 0
  fi
else
  echo "❌ API request failed"
  exit 1
fi
