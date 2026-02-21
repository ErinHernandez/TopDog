#!/bin/bash

echo "======================================"
echo "Production Security Audit - $(date)"
echo "======================================"

# Run npm audit for production only
echo -e "\n📦 Running npm audit (production)..."
npm audit --production --json > audit-results.json 2>/dev/null

# Parse and display results
CRITICAL=$(cat audit-results.json | jq '.metadata.vulnerabilities.critical // 0')
HIGH=$(cat audit-results.json | jq '.metadata.vulnerabilities.high // 0')
MODERATE=$(cat audit-results.json | jq '.metadata.vulnerabilities.moderate // 0')
LOW=$(cat audit-results.json | jq '.metadata.vulnerabilities.low // 0')

echo -e "\n🔴 Critical: $CRITICAL"
echo "🟠 High: $HIGH"
echo "🟡 Moderate: $MODERATE"
echo "🟢 Low: $LOW"

# Fail if critical or high vulnerabilities exist
if [ "$CRITICAL" -gt 0 ] || [ "$HIGH" -gt 0 ]; then
    echo -e "\n❌ SECURITY AUDIT FAILED"
    echo "Fix critical/high vulnerabilities before deploying!"
    cat audit-results.json | jq '.vulnerabilities | to_entries[] | select(.value.severity == "critical" or .value.severity == "high") | {name: .key, severity: .value.severity, via: .value.via[0], recommendation: .value.fixAvailable}'
    exit 1
fi

echo -e "\n✅ Security audit passed"
exit 0
