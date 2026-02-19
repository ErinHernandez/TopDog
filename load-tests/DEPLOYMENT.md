# Load Testing Suite - Deployment Guide

## Quick Start (< 5 minutes)

### 1. Install K6

```bash
# macOS
brew install k6

# Ubuntu/Debian
curl https://dl.k6.io/key.gpg | sudo apt-key add -
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows (WSL2)
# Use Ubuntu/Debian instructions above
```

### 2. Run Load Tests

```bash
cd /sessions/great-elegant-noether/mnt/td.d/load-tests

# Against local development server
./run-all.sh http://localhost:3000 your-auth-token

# Against staging
./run-all.sh https://staging.idesaign.com your-auth-token

# Individual scenario
k6 run scenarios/ai-routes.ts --env BASE_URL=http://localhost:3000 --env AUTH_TOKEN=token
```

### 3. View Results

```bash
# Check the reports directory
ls -la reports/

# Open HTML summary report
open reports/load-test-summary-*.html
```

## File Manifest

```
load-tests/
├── k6-config.ts                  # Shared configuration & metrics
├── scenarios/
│   ├── ai-routes.ts              # AI endpoints (6 routes)
│   ├── upload-routes.ts           # File operations (3 routes)
│   ├── generation-routes.ts       # Model inference (5 routes)
│   ├── sse-connections.ts         # Real-time streams
│   ├── community-routes.ts        # Social features (6 routes)
│   └── rate-limiter.ts            # Rate limit validation
├── run-all.sh                    # Master orchestration script
├── reports/                      # Generated test reports
├── README.md                     # Full documentation
├── VALIDATION.md                 # Quality checklist
└── DEPLOYMENT.md                 # This file
```

## Key Metrics to Monitor

### Performance Metrics
- **p95 Latency**: 95th percentile response time
  - AI Routes: < 5000ms
  - Upload Routes: < 10000ms (large files)
  - Community Routes: < 1000ms (reads)

- **p99 Latency**: 99th percentile response time
  - Should be within 2x of p95

- **Error Rate**: Failed requests percentage
  - Target: < 1% for most endpoints
  - Rate limiting tests: < 5% (intentional 429s)

### Endpoint-Specific Metrics
- `ai_detect_faces_latency_ms` - Face detection latency
- `upload_small_latency_ms` - Small file upload speed
- `generate_latency_ms` - Model inference latency
- `sse_connection_latency_ms` - SSE handshake latency
- `community_gallery_latency_ms` - Gallery load time
- `rate_limit_hits_count` - Rate limit enforcement count

### System Metrics
- `http_reqs` - Total requests made
- `http_req_failed` - Failed request count
- `http_req_duration` - Response time distribution
- `active_connections` - Concurrent SSE connections
- `requests_per_second` - Throughput

## Test Configuration

### Default Settings

Each scenario includes:
- **VUs (Virtual Users)**: 20-60 depending on scenario
- **Ramp-up**: 1 minute to target VUs
- **Sustained Load**: 5 minutes at target VUs
- **Spike**: 1 minute at 1.5x target VUs
- **Ramp-down**: 1 minute to 0 VUs
- **Total Duration**: ~8 minutes per scenario

### Adjusting Load

```bash
# Run with custom VU count
k6 run scenarios/ai-routes.ts \
  --vus 100 \
  --duration 10m \
  --env BASE_URL=http://localhost:3000 \
  --env AUTH_TOKEN=token
```

### Adjusting Thresholds

Edit `k6-config.ts`:

```typescript
export const aiRouteThresholds = {
  http_req_duration: ['p(95)<5000'],  // Change this value
  http_req_failed: ['rate<0.01'],     // Or this
};
```

## Testing Scenarios Summary

| Scenario | VUs | Duration | Key Tests | Thresholds |
|----------|-----|----------|-----------|-----------|
| AI Routes | 50 | 8m | detect-faces, enhance, inpaint, remove-bg, text-edit, upscale | p95 < 5s |
| Upload Routes | 30 | 8m | upload (4 sizes), list, retrieve | p95 < 3-10s |
| Generation | 40 | 8m | generate, estimate, status, batch, compare | p95 < 10s |
| SSE | 50 | 8m | connections (50/100/200), recovery, messages | p95 < 1s |
| Community | 60 | 8m | gallery, posts, profiles, comments, follows | p95 < 1-2s |
| Rate Limiter | 20 | 8m | tiers, enforcement, 429s, recovery | custom |

## Error Handling

### Common Issues & Solutions

**Connection Refused**
```
Error: Failed to connect to http://localhost:3000
```
Ensure server is running: `npm run dev`

**Authentication Failed**
```
http_req_failed rate: 401 responses
```
Verify AUTH_TOKEN is valid

**Rate Limit Hit During Test**
```
http_req_failed rate: 429 responses
```
Wait 60 seconds for window reset, then retry

**Out of Memory**
```
FATAL: out of memory
```
Reduce VUs: `k6 run scenario.ts --vus 10`

### Debug Mode

```bash
k6 run scenarios/ai-routes.ts -v \
  --env BASE_URL=http://localhost:3000 \
  --env AUTH_TOKEN=token
```

## Report Interpretation

### Threshold Pass/Fail

```
✓ http_req_duration ........... p(95)=450ms
✗ http_req_failed ............. rate=1.50%  (threshold: < 1%)
```

Green checkmark = passed
Red X = failed threshold

Exit code 0 = all thresholds passed
Exit code 1 = at least one threshold failed

### Example Report Output

```
data_received             4.2 MB  50 kB/s
data_sent                 2.1 MB  25 kB/s
http_req_blocked          avg=1ms  p(95)=2ms  p(99)=3ms
http_req_connecting       avg=0.5ms  p(95)=1ms  p(99)=2ms
http_req_duration         avg=150ms  p(95)=450ms  p(99)=850ms
http_req_failed           0.50%
http_req_receiving        avg=10ms  p(95)=20ms  p(99)=40ms
http_req_sending          avg=5ms  p(95)=15ms  p(99)=25ms
http_req_tls_handshaking  avg=50ms  p(95)=100ms  p(99)=150ms
http_req_waiting          avg=130ms  p(95)=430ms  p(99)=820ms
http_reqs                 1500  17.647/s
iteration_duration        avg=8.05s  min=5.02s  med=8.01s  max=12.04s
iterations                187  2.205/s
vus                       50  min=50  max=50
vus_max                   50  min=50  max=50
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Load Tests
on: [push, schedule: {cron: '0 2 * * 0'}]

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: sudo apt-get install k6
      - run: cd load-tests && ./run-all.sh ${{ secrets.STAGING_URL }} ${{ secrets.API_TOKEN }}
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: load-test-reports
          path: load-tests/reports/
```

### Pre-deployment Hook

```bash
#!/bin/bash
# Before deploying to production, run load tests against staging

cd load-tests
if ! ./run-all.sh https://staging.example.com "$STAGING_TOKEN"; then
    echo "Load tests failed - aborting deployment"
    exit 1
fi
echo "Load tests passed - proceeding with deployment"
```

## Performance Baselines

Use these as reference points:

### Local Development (Intel i7, 16GB RAM)
- AI Routes p95: ~500ms
- Upload (1MB) p95: ~1000ms
- Community (reads) p95: ~100ms

### Staging Server (2-CPU, 4GB RAM)
- AI Routes p95: ~1500ms
- Upload (1MB) p95: ~2000ms
- Community (reads) p95: ~200ms

### Production (Auto-scaled)
- AI Routes p95: ~300ms (cached)
- Upload (1MB) p95: ~800ms
- Community (reads) p95: ~50ms

## Monitoring & Alerts

### Recommended Alerting

Set up alerts for:
1. Error rate exceeds 1%
2. p95 latency exceeds threshold
3. Test execution failure
4. Response size > 10MB

### Integration with Monitoring

Export to InfluxDB:

```bash
k6 run scenario.ts \
  --out influxdb=http://localhost:8086/k6
```

## Maintenance

### Regular Testing Schedule

- **Daily**: Lightweight spot checks (1 VU, 1m duration)
- **Weekly**: Full suite against staging
- **Before release**: Full suite with production data
- **Quarterly**: Spike and stress tests

### Updating Scenarios

When APIs change:

1. Update endpoint path
2. Update request payload
3. Update response checks
4. Test with `k6 lint scenarios/xxx.ts`

## Support & Troubleshooting

### Getting Help

1. Check README.md for detailed documentation
2. Review K6 docs: https://k6.io/docs/
3. Enable verbose logging: `k6 run scenario.ts -v`
4. Check network connectivity to target server

### Useful Commands

```bash
# List all metrics
k6 run scenario.ts --summary-export=metrics.json

# Export detailed JSON
k6 run scenario.ts --out json=detailed.json

# Lint test files
k6 lint scenarios/ai-routes.ts

# Check k6 version
k6 version

# Run with timeout
timeout 600 k6 run scenario.ts
```

## Next Steps

1. Install k6 (see "Quick Start" above)
2. Run `./run-all.sh` against your development server
3. Review generated reports in `reports/` directory
4. Adjust thresholds based on your infrastructure
5. Integrate into CI/CD pipeline
6. Schedule regular testing

## Additional Resources

- **K6 Official Docs**: https://k6.io/docs/
- **K6 Scripting API**: https://k6.io/docs/javascript-api/
- **Performance Testing Guide**: https://k6.io/blog/performance-testing-best-practices/
- **Idesaign Docs**: See project README and API documentation

---

**Version**: 1.0.0
**Last Updated**: 2026-02-11
**K6 Minimum Version**: 0.50.0
