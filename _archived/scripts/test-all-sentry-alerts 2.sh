#!/bin/bash

# Test All Sentry Alerts
# This script tests all 3 Tier 1 Sentry alerts: Fatal, Payment, and Auth

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
BASE_URL="${1:-http://localhost:3000}"
API_URL="${BASE_URL}/api/test-sentry"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Sentry Alerts Testing Script${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "Testing URL: ${API_URL}"
echo ""
echo "⚠️  Note: Make sure your application is running!"
echo "⚠️  Note: This will create test errors in Sentry!"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

# Function to test an alert
test_alert() {
    local alert_name=$1
    local type=$2
    local component=$3
    local message=$4
    
    echo -e "${YELLOW}Testing: ${alert_name}${NC}"
    echo "  Type: ${type}"
    echo "  Component: ${component:-N/A}"
    echo "  Message: ${message}"
    echo ""
    
    # Build JSON payload
    local json_payload="{\"type\":\"${type}\",\"message\":\"${message}\""
    if [ -n "${component}" ]; then
        json_payload="${json_payload},\"component\":\"${component}\""
    fi
    json_payload="${json_payload}}"
    
    # Make the request
    local response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}" \
        -H "Content-Type: application/json" \
        -d "${json_payload}")
    
    # Extract status code and body
    local http_code=$(echo "${response}" | tail -n1)
    local body=$(echo "${response}" | sed '$d')
    
    if [ "${http_code}" -eq 200 ]; then
        echo -e "${GREEN}✅ Success! HTTP ${http_code}${NC}"
        echo "Response: ${body}" | jq '.' 2>/dev/null || echo "Response: ${body}"
        echo ""
        echo -e "${YELLOW}→ Check Sentry dashboard: https://topdogdog.sentry.io/issues/${NC}"
        echo -e "${YELLOW}→ Error should appear within 30 seconds${NC}"
        echo -e "${YELLOW}→ Alert should trigger if configured correctly${NC}"
    else
        echo -e "${RED}❌ Failed! HTTP ${http_code}${NC}"
        echo "Response: ${body}"
    fi
    
    echo ""
    echo "Waiting 5 seconds before next test..."
    sleep 5
    echo ""
}

# Test 1: Fatal Error Alert
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Test 1: Fatal Error Alert${NC}"
echo -e "${YELLOW}========================================${NC}"
test_alert "Fatal Error Alert" "fatal" "" "🧪 Test fatal error - Sentry alert test"

# Test 2: Payment Error Alert
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Test 2: Payment Error Alert${NC}"
echo -e "${YELLOW}========================================${NC}"
test_alert "Payment Error Alert" "error" "Payment" "🧪 Test payment error - Sentry alert test"

# Test 3: Auth Error Alert
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Test 3: Auth Error Alert${NC}"
echo -e "${YELLOW}========================================${NC}"
test_alert "Auth Error Alert" "error" "Auth" "🧪 Test auth error - Sentry alert test"

# Summary
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Testing Complete!${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "📊 Next Steps:"
echo ""
echo "1. Check Sentry Dashboard:"
echo "   → https://topdogdog.sentry.io/issues/"
echo "   → Look for 'SentryTestError' issues"
echo "   → Verify each error has correct tags/level"
echo ""
echo "2. Check Alert Activity:"
echo "   → https://topdogdog.sentry.io/alerts/activity/"
echo "   → Verify all 3 alerts triggered"
echo ""
echo "3. Check Notifications:"
echo "   → Check your email for alert notifications"
echo "   → Verify notifications were received"
echo ""
echo "4. Verify Alert Configuration:"
echo "   → Go to: https://topdogdog.sentry.io/alerts/rules/"
echo "   → Click on each alert"
echo "   → Verify conditions and actions are correct"
echo ""
echo -e "${GREEN}Done!${NC}"
