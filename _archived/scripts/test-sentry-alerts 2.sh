#!/bin/bash

# Test Sentry Alerts Script
# 
# Purpose: Test Sentry alerts by triggering test errors
# Usage: ./scripts/test-sentry-alerts.sh [domain]
#
# Example:
#   ./scripts/test-sentry-alerts.sh https://your-app.vercel.app
#   ./scripts/test-sentry-alerts.sh http://localhost:3000

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get domain from argument or use default
DOMAIN=${1:-"http://localhost:3000"}

echo -e "${YELLOW}Testing Sentry Alerts${NC}"
echo -e "Domain: ${DOMAIN}"
echo ""

# Function to test an alert
test_alert() {
    local name=$1
    local type=$2
    local component=$3
    local message=$4
    
    echo -e "${YELLOW}Testing: ${name}${NC}"
    
    # Build curl command
    local curl_cmd="curl -X POST ${DOMAIN}/api/test-sentry -H 'Content-Type: application/json'"
    
    if [ -n "$component" ]; then
        curl_cmd="${curl_cmd} -d '{\"type\": \"${type}\", \"component\": \"${component}\", \"message\": \"${message}\"}'"
    else
        curl_cmd="${curl_cmd} -d '{\"type\": \"${type}\", \"message\": \"${message}\"}'"
    fi
    
    echo -e "Command: ${curl_cmd}"
    
    # Execute curl command
    response=$(eval $curl_cmd 2>&1)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Request sent successfully${NC}"
        echo "Response: $response" | head -5
    else
        echo -e "${RED}✗ Request failed${NC}"
        echo "Error: $response"
    fi
    
    echo ""
    sleep 2
}

# Test Fatal Error Alert
echo -e "${YELLOW}=== Testing Fatal Error Alert ===${NC}"
test_alert "Fatal Error Alert" "fatal" "" "Test fatal error for alert verification"
echo "Check Sentry dashboard for fatal error and alert notification"
echo ""

# Test Payment Error Alert
echo -e "${YELLOW}=== Testing Payment Error Alert ===${NC}"
test_alert "Payment Error Alert" "error" "Payment" "Test payment error for alert verification"
echo "Check Sentry dashboard for payment error with component tag and alert notification"
echo ""

# Test Auth Error Alert
echo -e "${YELLOW}=== Testing Auth Error Alert ===${NC}"
test_alert "Auth Error Alert" "error" "Auth" "Test auth error for alert verification"
echo "Check Sentry dashboard for auth error with component tag and alert notification"
echo ""

# Test Error Spike (Tier 2 - Optional)
read -p "Test Error Spike Alert? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}=== Testing Error Spike Alert (15 errors) ===${NC}"
    for i in {1..15}; do
        echo "Triggering error $i/15..."
        test_alert "Error Spike Test $i" "error" "" "Spike test error $i" > /dev/null 2>&1
        sleep 1
    done
    echo -e "${GREEN}✓ 15 errors sent${NC}"
    echo "Check Sentry dashboard for error spike alert (if configured)"
fi

echo ""
echo -e "${GREEN}=== Test Complete ===${NC}"
echo ""
echo "Next Steps:"
echo "1. Go to Sentry Dashboard > Issues"
echo "2. Check that errors appear within 30 seconds"
echo "3. Go to Sentry Dashboard > Alerts > Alert Activity"
echo "4. Verify alerts were triggered"
echo "5. Check your email/Slack for notifications"
echo ""
echo "Reference: docs/SENTRY_ALERTS_SETUP.md for detailed instructions"
