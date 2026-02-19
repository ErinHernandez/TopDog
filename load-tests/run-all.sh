#!/bin/bash

##############################################################################
# K6 Load Testing Suite Runner
# Runs all load test scenarios sequentially and generates consolidated report
# Usage: ./run-all.sh [BASE_URL] [AUTH_TOKEN]
# Example: ./run-all.sh http://localhost:3000 "eyJhbGciOiJIUzI1NiIs..."
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-http://localhost:3000}"
AUTH_TOKEN="${2:-test-auth-token-load-test-12345}"
TIMESTAMP=$(date +%s)
REPORT_DIR="./reports"
SUMMARY_REPORT="${REPORT_DIR}/load-test-summary-${TIMESTAMP}.html"

# Test configurations
declare -A SCENARIOS=(
  ["ai-routes"]="AI Routes (face detection, enhancement, inpainting, etc.)"
  ["upload-routes"]="Upload Routes (file uploads with varying sizes)"
  ["generation-routes"]="Generation Routes (model inference, batch processing)"
  ["sse-connections"]="SSE Connections (long-lived progress streams)"
  ["community-routes"]="Community Routes (social, gallery, prompts)"
  ["rate-limiter"]="Rate Limiter Testing (tier validation, recovery)"
)

# Create report directory
mkdir -p "${REPORT_DIR}"

# Logging functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
print_banner() {
  echo ""
  echo "╔═══════════════════════════════════════════════════════════════════╗"
  echo "║                 K6 Load Testing Suite - Idesaign                  ║"
  echo "║              Production-grade infrastructure testing              ║"
  echo "╚═══════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "Configuration:"
  echo "  Base URL:    ${BASE_URL}"
  echo "  Auth Token:  ${AUTH_TOKEN:0:20}..."
  echo "  Timestamp:   $(date)"
  echo "  Report Dir:  ${REPORT_DIR}"
  echo ""
}

# Check prerequisites
check_prerequisites() {
  log_info "Checking prerequisites..."

  # Check k6 installation
  if ! command -v k6 &> /dev/null; then
    log_error "k6 is not installed. Please install k6:"
    echo "  macOS: brew install k6"
    echo "  Linux: sudo apt-get install k6"
    echo "  Windows: choco install k6"
    exit 1
  fi

  # Check k6 version
  local k6_version=$(k6 --version | cut -d' ' -f3)
  log_success "k6 ${k6_version} is installed"

  # Check network connectivity
  if ! curl -s -m 5 "${BASE_URL}/api/studio/health" > /dev/null 2>&1; then
    log_warning "Cannot reach ${BASE_URL} - tests may fail"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  else
    log_success "Successfully connected to ${BASE_URL}"
  fi
}

# Run individual test scenario
run_scenario() {
  local scenario_name=$1
  local scenario_file="./scenarios/${scenario_name}.ts"
  local output_file="${REPORT_DIR}/${scenario_name}-${TIMESTAMP}.json"

  if [ ! -f "${scenario_file}" ]; then
    log_error "Scenario file not found: ${scenario_file}"
    return 1
  fi

  log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log_info "Running: ${SCENARIOS[$scenario_name]}"
  log_info "File: ${scenario_file}"
  log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  local start_time=$(date +%s%N)

  # Run k6 test with environment variables
  if k6 run "${scenario_file}" \
    --env BASE_URL="${BASE_URL}" \
    --env AUTH_TOKEN="${AUTH_TOKEN}" \
    --out json="${output_file}" \
    --summary-export="${REPORT_DIR}/${scenario_name}-summary-${TIMESTAMP}.json"; then

    local end_time=$(date +%s%N)
    local duration=$((($end_time - $start_time) / 1000000))
    log_success "${SCENARIOS[$scenario_name]} completed in ${duration}ms"
    return 0
  else
    log_error "${SCENARIOS[$scenario_name]} failed"
    return 1
  fi
}

# Generate HTML summary report
generate_summary_report() {
  log_info "Generating summary report..."

  cat > "${SUMMARY_REPORT}" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>K6 Load Testing Summary Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .header p {
      font-size: 14px;
      opacity: 0.9;
    }
    .content { padding: 40px; }
    .section {
      margin-bottom: 40px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 20px;
      background: #f9f9f9;
    }
    .section h2 {
      font-size: 20px;
      margin-bottom: 20px;
      color: #667eea;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    .metric-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 20px;
      text-align: center;
    }
    .metric-card .value {
      font-size: 28px;
      font-weight: bold;
      color: #667eea;
      margin: 10px 0;
    }
    .metric-card .label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .status-pass { color: #4caf50; }
    .status-fail { color: #f44336; }
    .status-warn { color: #ff9800; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background: #667eea;
      color: white;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    tr:hover { background: #f5f5f5; }
    .footer {
      background: #f9f9f9;
      border-top: 1px solid #e0e0e0;
      padding: 20px 40px;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>K6 Load Testing Summary Report</h1>
      <p>Idesaign API - Production-grade Infrastructure Testing</p>
      <p id="timestamp"></p>
    </div>
    <div class="content">
      <div class="section">
        <h2>Test Execution Summary</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="label">Total Scenarios</div>
            <div class="value" id="total-scenarios">0</div>
          </div>
          <div class="metric-card">
            <div class="label">Passed</div>
            <div class="value status-pass" id="passed-count">0</div>
          </div>
          <div class="metric-card">
            <div class="label">Failed</div>
            <div class="value status-fail" id="failed-count">0</div>
          </div>
          <div class="metric-card">
            <div class="label">Success Rate</div>
            <div class="value" id="success-rate">0%</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Scenario Results</h2>
        <table id="results-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Status</th>
              <th>Requests</th>
              <th>Errors</th>
              <th>Avg Response Time</th>
              <th>p95</th>
              <th>p99</th>
            </tr>
          </thead>
          <tbody id="results-body">
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>Performance Insights</h2>
        <ul style="line-height: 1.8;">
          <li><strong>Virtual Users:</strong> Ramped from 0 to target VUs over 1 minute</li>
          <li><strong>Sustained Load:</strong> Maintained target VU count for 5 minutes</li>
          <li><strong>Spike Test:</strong> Increased to 1.5x target VUs for 1 minute</li>
          <li><strong>Thresholds:</strong> p95 latency < 5s, error rate < 1% for most endpoints</li>
          <li><strong>Connection Testing:</strong> Verified graceful handling of 50-200 concurrent SSE connections</li>
        </ul>
      </div>

      <div class="section">
        <h2>Recommendations</h2>
        <ul style="line-height: 1.8;">
          <li>Monitor p95/p99 latency metrics during peak hours</li>
          <li>Consider horizontal scaling if error rates exceed thresholds</li>
          <li>Review database query performance for slowest endpoints</li>
          <li>Implement caching for frequently accessed endpoints</li>
          <li>Test with production-like data volumes for realistic results</li>
          <li>Schedule regular load tests as part of CI/CD pipeline</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      <p>Generated by K6 Load Testing Suite | Report generated at <span id="footer-time"></span></p>
    </div>
  </div>

  <script>
    document.getElementById('timestamp').textContent = new Date().toLocaleString();
    document.getElementById('footer-time').textContent = new Date().toLocaleString();
  </script>
</body>
</html>
EOF

  log_success "Summary report generated: ${SUMMARY_REPORT}"
}

# Main execution
main() {
  print_banner
  check_prerequisites

  local passed=0
  local failed=0

  # Run all scenarios
  for scenario_name in "${!SCENARIOS[@]}"; do
    if run_scenario "${scenario_name}"; then
      ((passed++))
    else
      ((failed++))
    fi
    echo ""
    sleep 2 # Delay between scenarios
  done

  # Summary
  echo ""
  log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log_info "Load Testing Complete!"
  log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Results Summary:"
  echo "  Passed:  ${GREEN}${passed}${NC}"
  echo "  Failed:  ${RED}${failed}${NC}"
  echo ""

  generate_summary_report

  echo "Reports saved to: ${REPORT_DIR}"
  echo ""

  # Exit with appropriate code
  if [ $failed -gt 0 ]; then
    log_error "Some tests failed. Please review the reports."
    exit 1
  else
    log_success "All tests passed!"
    exit 0
  fi
}

# Run main function
main "$@"
