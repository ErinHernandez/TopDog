# K6 Load Testing Suite - Idesaign

Production-grade load testing infrastructure for the Idesaign API (Next.js 15 with 73 API routes). This suite provides comprehensive testing of AI routes, uploads, generation pipelines, SSE connections, community features, and rate limiting.

## Overview

The load testing suite includes 6 comprehensive test scenarios covering:

- **AI Routes** (face detection, enhancement, inpainting, background removal, text editing, upscaling)
- **Upload Routes** (file uploads with 100KB to 10MB sizes, pagination, retrieval)
- **Generation Routes** (model inference, batch processing, cost estimation, A/B comparisons)
- **SSE Connections** (long-lived progress streams, 50-200 concurrent connections)
- **Community Routes** (gallery, social interactions, prompts, user profiles)
- **Rate Limiting** (tier validation, recovery behavior, header correctness)

## Prerequisites

### System Requirements

- **Node.js**: >= 20.0.0
- **K6**: >= 0.50.0
- **Bash**: For running the orchestration script

### K6 Installation

**macOS:**
```bash
brew install k6
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install -y apt-transport-https
curl https://dl.k6.io/key.gpg | sudo apt-key add -
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Linux (Other distributions):**
```bash
# Download from https://github.com/grafana/k6/releases
wget https://github.com/grafana/k6/releases/download/v0.50.0/k6-v0.50.0-linux-amd64.tar.gz
tar xzf k6-v0.50.0-linux-amd64.tar.gz
sudo mv k6 /usr/local/bin/
```

**Windows (using Chocolatey):**
```bash
choco install k6
```

### Verify Installation

```bash
k6 --version
```

## Project Structure

```
load-tests/
├── k6-config.ts              # Shared configuration, metrics, and utilities
├── scenarios/
│   ├── ai-routes.ts          # AI tool endpoints (200 lines)
│   ├── upload-routes.ts       # File upload operations (150 lines)
│   ├── generation-routes.ts   # Model inference & batch processing (200 lines)
│   ├── sse-connections.ts     # Long-lived SSE streams (100 lines)
│   ├── community-routes.ts    # Social & community features (150 lines)
│   └── rate-limiter.ts        # Rate limit validation (150 lines)
├── run-all.sh                 # Master orchestration script (50 lines)
├── reports/                   # Generated test reports
│   └── *.json                 # Detailed metrics per scenario
└── README.md                  # This file

Total: ~950 lines of production-grade k6 test code
```

## Quick Start

### 1. Basic Test Run

```bash
cd /sessions/great-elegant-noether/mnt/td.d/load-tests

# Run all tests against local development server
./run-all.sh

# Or specify custom base URL and auth token
./run-all.sh http://localhost:3000 "your-auth-token"
```

### 2. Run Individual Scenario

```bash
# Test AI routes only
k6 run scenarios/ai-routes.ts \
  --env BASE_URL=http://localhost:3000 \
  --env AUTH_TOKEN="your-auth-token"

# Test upload routes with custom VU configuration
k6 run scenarios/upload-routes.ts \
  --env BASE_URL=http://localhost:3000 \
  --env AUTH_TOKEN="your-auth-token" \
  --vus 50 \
  --duration 300s

# Test with HTML report
k6 run scenarios/ai-routes.ts \
  --env BASE_URL=http://localhost:3000 \
  --env AUTH_TOKEN="your-auth-token" \
  --out json=report.json
```

### 3. Generate Reports

All test results are automatically exported to the `reports/` directory in JSON format. K6 provides several ways to visualize results:

```bash
# View summary statistics
k6 run scenarios/ai-routes.ts --summary-export=summary.json

# Generate detailed metrics
k6 run scenarios/ai-routes.ts --out json=detailed-metrics.json
```

## Test Scenarios

### AI Routes (`scenarios/ai-routes.ts`)

Tests AI tool endpoints with realistic image processing payloads.

**Endpoints Tested:**
- `POST /api/studio/ai/detect-faces` — 20 req/s target
- `POST /api/studio/ai/enhance-portrait` — 15 req/s
- `POST /api/studio/ai/inpaint` — 10 req/s
- `POST /api/studio/ai/remove-bg` — 15 req/s
- `POST /api/studio/ai/text-edit` — 15 req/s
- `POST /api/studio/ai/upscale` — 8 req/s

**Configuration:**
- Virtual Users: 50
- Load Profile: Ramp up (1m) → Sustained (5m) → Spike (1m) → Ramp down (1m)
- Thresholds: p95 < 5s, p99 < 8s, error rate < 1%

**Key Metrics:**
- Per-endpoint latency tracking (detectFacesLatency, enhancePortraitLatency, etc.)
- Error rate per endpoint
- Response validation

### Upload Routes (`scenarios/upload-routes.ts`)

Tests file upload operations with varying file sizes (100KB to 10MB) and pagination.

**Endpoints Tested:**
- `POST /api/studio/files/upload` — multiple file sizes
- `GET /api/studio/files/list` — paginated listing
- `GET /api/studio/files/{fileId}` — file retrieval

**File Sizes:**
- Small: 100 KB (25% of traffic)
- Medium: 1 MB (25% of traffic)
- Large: 5 MB (20% of traffic)
- Extra Large: 10 MB (10% of traffic)

**Configuration:**
- Virtual Users: 30 (bandwidth-constrained)
- Thresholds: p95 < 3s (small), p95 < 10s (large)

**Key Metrics:**
- Latency per file size category
- Upload throughput (MB/s)
- List pagination performance

### Generation Routes (`scenarios/generation-routes.ts`)

Tests model inference, batch processing, and A/B comparison endpoints.

**Endpoints Tested:**
- `POST /api/studio/generate/{model}` — image generation (35% traffic)
- `POST /api/studio/generate/estimate` — cost estimation (20% traffic)
- `GET /api/studio/generate/status` — polling (15% traffic)
- `POST /api/studio/generate/batch` — batch generation (15% traffic)
- `POST /api/studio/comparison/create` — A/B testing (15% traffic)

**Configuration:**
- Virtual Users: 40
- Thresholds: p95 < 10s, p99 < 15s, error rate < 2%
- Supports longer timeouts (60s) for generation endpoints

**Key Metrics:**
- Generation job queue depth
- Cost estimation accuracy
- Status polling latency
- Batch request consolidation benefits

### SSE Connections (`scenarios/sse-connections.ts`)

Tests long-lived Server-Sent Events connections for real-time progress tracking.

**Endpoints Tested:**
- `GET /api/studio/jobs/{jobId}/progress` — SSE stream establishment
- Connection establishment latency
- Message delivery reliability

**Concurrency Testing:**
- 50 concurrent connections (30% of traffic)
- 100 concurrent connections (25% of traffic)
- 200 concurrent connections (15% of traffic)
- Connection recovery (7% of traffic)
- Message delivery validation (8% of traffic)

**Configuration:**
- Virtual Users: 50
- Thresholds: p95 < 1s (connection), p99 < 2s

**Key Metrics:**
- Connection establishment time
- Active connections gauge
- Message delivery latency
- Connection recovery success rate
- SSE error counting

### Community Routes (`scenarios/community-routes.ts`)

Tests social features with realistic user behavior patterns (read-heavy).

**Endpoints Tested:**
- `GET /api/studio/community/gallery` — gallery browsing (40% traffic)
- `POST /api/studio/community/posts/{id}/like` — engagement (20% traffic)
- `GET /api/studio/community/users/{userId}` — profile views (15% traffic)
- `POST /api/studio/community/posts/{id}/comments` — commenting (10% traffic)
- `POST /api/studio/community/users/{userId}/follow` — following (8% traffic)
- `POST /api/studio/community/prompts` — prompt sharing (7% traffic)

**Configuration:**
- Virtual Users: 60
- Thresholds: p95 < 1s (reads), p95 < 2s (writes)

**Key Metrics:**
- Read vs. write latency comparison
- Engagement metrics (likes, comments, follows)
- User-generated content velocity

### Rate Limiter (`scenarios/rate-limiter.ts`)

Validates rate limiting enforcement across user tiers.

**User Tiers Tested:**
- **Free**: 30 req/min, 5 burst requests
- **Pro**: 150 req/min, 20 burst requests
- **Team**: 500 req/min, 50 burst requests
- **Enterprise**: 2000 req/min, 200 burst requests

**Tests:**
- Burst limit enforcement
- 429 response correctness
- `Retry-After` header presence and correctness
- Per-endpoint rate limit behavior
- Concurrent request counting
- Rate limit recovery after window expiration
- `X-RateLimit-*` header validation

**Configuration:**
- Virtual Users: 20
- Thresholds: Higher allowed failure rate (5%) for this test type

**Key Metrics:**
- Rate limit hit count per tier
- Valid requests vs. throttled requests
- Retry-After value distribution
- Tier-specific request distribution

## Interpreting Results

### Standard Metrics

K6 reports standard HTTP metrics for all tests:

```
✓ http_req_duration ........... avg=150ms, p(95)=800ms, p(99)=1200ms, max=2100ms
✓ http_req_failed ............. 0.50%
✓ http_reqs ................... 1500 (50/s average)
✓ http_req_blocked ............ avg=0.1ms
✓ http_req_connecting ......... avg=0.05ms
✓ http_req_tls_handshaking ... avg=0.05ms
✓ http_req_sending ............ avg=0.1ms
✓ http_req_waiting ............ avg=150ms
✓ http_req_receiving .......... avg=0.1ms
```

### Custom Metrics

Each scenario reports custom metrics for detailed analysis:

```
✓ ai_detect_faces_latency_ms ......... avg=120ms, p(95)=600ms
✓ p95_latency_ms ..................... avg=450ms, p(95)=800ms
✓ error_rate ......................... 0.8%
✓ active_connections ................. 50 (gauge)
✓ requests_per_second ................ 75 (gauge)
```

### Threshold Failures

Thresholds define success/failure criteria:

```javascript
thresholds: {
  'http_req_duration': ['p(95)<5000'],  // 95th percentile latency < 5 seconds
  'http_req_failed': ['rate<0.01'],     // Error rate < 1%
  'error_rate': ['rate<0.01'],          // Custom error rate < 1%
}
```

If a threshold fails, k6 exits with code 1, triggering CI/CD pipeline failure.

### Performance Tiers

Use these guidelines to interpret results:

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|-----------|------|
| **p95 Latency** | <500ms | <1s | <5s | >5s |
| **p99 Latency** | <1s | <2s | <8s | >8s |
| **Error Rate** | <0.1% | <0.5% | <1% | >1% |
| **Success Rate** | >99.9% | >99.5% | >99% | <99% |

## Threshold Tuning

### Adjusting Thresholds

Edit threshold values in `k6-config.ts` based on your infrastructure:

```typescript
export const aiRouteThresholds = {
  http_req_duration: ['p(95)<5000', 'p(99)<8000'],  // Adjust these values
  http_req_failed: ['rate<0.01'],                   // Adjust failure threshold
};
```

### Recommended Adjustments

**For Development Environment:**
- Relax thresholds by 50% (p95 < 7.5s instead of 5s)
- Allow up to 2% error rate for experimental features
- Focus on p95, ignore p99 for initial testing

**For Staging Environment:**
- Standard thresholds (as provided)
- Test with production-like data volumes
- Validate threshold values before production

**For Production:**
- Tighten thresholds by 20% (p95 < 4s)
- Zero tolerance for critical paths
- Monitor for regressions in CI/CD

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Load Testing

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly at 2 AM Sunday
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install k6
        run: sudo apt-get install -y apt-transport-https && \
             curl https://dl.k6.io/key.gpg | sudo apt-key add - && \
             echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list && \
             sudo apt-get update && sudo apt-get install k6

      - name: Run Load Tests
        run: cd load-tests && ./run-all.sh ${{ secrets.STAGING_URL }} ${{ secrets.API_TOKEN }}

      - name: Upload Reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: load-test-reports
          path: load-tests/reports/

      - name: Notify on Failure
        if: failure()
        run: echo "Load tests failed - check artifacts"
```

### GitLab CI Example

```yaml
load-testing:
  stage: performance
  image: grafana/k6:latest
  script:
    - cd load-tests
    - ./run-all.sh $STAGING_URL $API_TOKEN
  artifacts:
    paths:
      - load-tests/reports/
    reports:
      performance: load-tests/reports/*-summary-*.json
  only:
    - schedules
```

### Pre-deployment Checks

```bash
#!/bin/bash
# Run before production deployment
cd load-tests
./run-all.sh http://staging.example.com $TOKEN

if [ $? -ne 0 ]; then
  echo "Load tests failed - aborting deployment"
  exit 1
fi
```

## Advanced Configuration

### Custom Load Profiles

Define custom VU ramp patterns:

```typescript
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp to 100 VUs
    { duration: '5m', target: 100 },   // Stay at 100
    { duration: '2m', target: 200 },   // Spike to 200
    { duration: '5m', target: 200 },   // Hold spike
    { duration: '2m', target: 0 },     // Ramp down
  ],
};
```

### Custom Metrics

Add custom metrics for business logic:

```typescript
import { Trend, Counter, Rate } from 'k6/metrics';

const conversionRate = new Rate('conversions');
const cartValue = new Trend('cart_value_cents');

// Track in your test
conversionRate.add(isSuccessful);
cartValue.add(totalPrice);
```

### Environment-specific Configuration

```bash
# Load test against different environments
./run-all.sh http://dev.example.com $DEV_TOKEN      # Development
./run-all.sh http://staging.example.com $STAGING_TOKEN  # Staging
./run-all.sh http://prod.example.com $PROD_TOKEN   # Production (careful!)
```

## Troubleshooting

### Common Issues

**1. Connection Refused**
```
Error: Failed to connect to http://localhost:3000
```
Ensure the server is running and accessible.

**2. Authentication Failures**
```
http_req_failed rate: 401 responses
```
Verify the AUTH_TOKEN is valid for your environment.

**3. Memory Issues**
```
FATAL: out of memory
```
Reduce VUs or duration, or increase system memory.

**4. Rate Limit Exceeded During Setup**
```
http_req_failed rate: 429 responses
```
Wait for rate limit window to reset before retrying.

### Debug Mode

Run with verbose logging:

```bash
k6 run scenarios/ai-routes.ts \
  --env BASE_URL=http://localhost:3000 \
  --env AUTH_TOKEN="token" \
  -v  # Verbose output
```

### Collecting Detailed Metrics

Export metrics for analysis:

```bash
k6 run scenarios/ai-routes.ts \
  --out json=detailed.json \
  --out influxdb=http://localhost:8086/load-tests

# Analyze with InfluxDB + Grafana
```

## Performance Best Practices

### Test Preparation

- [ ] Ensure server is in clean state before testing
- [ ] Use consistent test data (same images, prompts, etc.)
- [ ] Warm up server with a brief load period
- [ ] Test during non-peak hours to avoid production impact
- [ ] Document baseline metrics before infrastructure changes

### Test Execution

- [ ] Run tests multiple times to establish average behavior
- [ ] Gradually increase VU count to identify breaking points
- [ ] Monitor server resources during tests (CPU, memory, disk I/O)
- [ ] Check database query performance during load
- [ ] Verify cache hit rates during sustained load

### Analysis & Reporting

- [ ] Compare p95 and p99 metrics (not just average)
- [ ] Analyze error patterns (which endpoints fail first?)
- [ ] Track trends over time (regressions in performance)
- [ ] Correlate load test results with server metrics
- [ ] Include business context (user impact) in reports

## Maintenance

### Updating Test Scenarios

When API endpoints change:

1. Update endpoint paths in the scenario file
2. Update request payload schema
3. Update response validation checks
4. Test the updated scenario with k6 lint

```bash
k6 lint scenarios/ai-routes.ts
```

### Regular Testing Schedule

- **Weekly**: Run full suite against staging
- **Before releases**: Run full suite with production data
- **Quarterly**: Spike tests and long-duration stress tests
- **On-demand**: After infrastructure changes

## References

- **K6 Documentation**: https://k6.io/docs/
- **K6 API Reference**: https://k6.io/docs/javascript-api/
- **Idesaign API Docs**: See ADMIN_API_REFERENCE.md
- **Performance Testing Guide**: https://k6.io/blog/performance-testing-best-practices/

## License

These load testing scripts are part of the Idesaign project and follow the same license.

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review k6 documentation for k6-specific issues
3. Consult Idesaign API documentation for endpoint-specific details
4. Open an issue in the project repository

---

**Last Updated:** 2026-02-11
**K6 Version:** >= 0.50.0
**Next.js Version:** 15
**API Routes:** 73
