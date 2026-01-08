# Security Testing Guide

**Date:** January 2025  
**Purpose:** Comprehensive guide for testing all security implementations

---

## 🧪 SECURITY TESTING CHECKLIST

### 1. Authentication Testing

#### Test Authentication Middleware
```bash
# Test without token
curl -X POST http://localhost:3000/api/stripe/payment-intent \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","amountCents":1000}'
# Expected: 401 Unauthorized

# Test with invalid token
curl -X POST http://localhost:3000/api/stripe/payment-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"userId":"test","amountCents":1000}'
# Expected: 401 Unauthorized

# Test with valid token
curl -X POST http://localhost:3000/api/stripe/payment-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <valid-firebase-token>" \
  -d '{"userId":"test","amountCents":1000}'
# Expected: 200 OK or appropriate response
```

#### Test User Access Control
```bash
# Test accessing another user's data
curl -X GET "http://localhost:3000/api/stripe/customer?userId=other-user-id" \
  -H "Authorization: Bearer <valid-token-for-different-user>"
# Expected: 403 Forbidden
```

---

### 2. CSRF Protection Testing

#### Test CSRF Token Endpoint
```bash
# Get CSRF token
curl -X GET http://localhost:3000/api/csrf-token
# Expected: 200 OK with csrfToken in response and Set-Cookie header
```

#### Test Without CSRF Token
```bash
# Attempt state-changing operation without CSRF token
curl -X POST http://localhost:3000/api/stripe/payment-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <valid-token>" \
  -d '{"userId":"test","amountCents":1000}'
# Expected: 403 Forbidden - CSRF_TOKEN_INVALID
```

#### Test With Invalid CSRF Token
```bash
# Attempt with invalid CSRF token
curl -X POST http://localhost:3000/api/stripe/payment-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <valid-token>" \
  -H "X-CSRF-Token: invalid-token" \
  -H "Cookie: csrf-token=invalid-token" \
  -d '{"userId":"test","amountCents":1000}'
# Expected: 403 Forbidden - CSRF_TOKEN_INVALID
```

#### Test With Valid CSRF Token
```bash
# Get token first
TOKEN=$(curl -s -c cookies.txt http://localhost:3000/api/csrf-token | jq -r '.csrfToken')

# Use token in request
curl -X POST http://localhost:3000/api/stripe/payment-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <valid-token>" \
  -H "X-CSRF-Token: $TOKEN" \
  -b cookies.txt \
  -d '{"userId":"test","amountCents":1000}'
# Expected: 200 OK or appropriate response
```

---

### 3. Rate Limiting Testing

#### Test Rate Limit Headers
```bash
# Make multiple requests quickly
for i in {1..25}; do
  curl -X GET "http://localhost:3000/api/analytics" \
    -H "Authorization: Bearer <valid-token>" \
    -v 2>&1 | grep -i "x-ratelimit"
done
# Expected: Headers show decreasing remaining count
```

#### Test Rate Limit Exceeded
```bash
# Exceed rate limit
for i in {1..25}; do
  curl -X POST http://localhost:3000/api/stripe/payment-intent \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <valid-token>" \
    -H "X-CSRF-Token: <valid-token>" \
    -d '{"userId":"test","amountCents":1000}'
done
# Expected: 429 Too Many Requests after limit exceeded
```

---

### 4. Security Headers Testing

#### Test Security Headers
```bash
# Check all security headers
curl -I http://localhost:3000/
# Expected headers:
# - X-Frame-Options: DENY
# - X-Content-Type-Options: nosniff
# - X-XSS-Protection: 1; mode=block
# - Referrer-Policy: strict-origin-when-cross-origin
# - Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# - Content-Security-Policy: (comprehensive CSP)
```

#### Test Using securityheaders.com
1. Deploy to staging environment
2. Visit https://securityheaders.com
3. Enter your domain
4. Verify all headers are present and properly configured
5. Aim for A+ rating

---

### 5. File Upload Security Testing

#### Test File Type Validation
```bash
# Test with invalid file type
# Upload a .exe file as CSV
# Expected: Validation error - invalid file type

# Test with valid file type but wrong extension
# Upload .txt file renamed to .csv
# Expected: Validation error - MIME type mismatch
```

#### Test File Size Validation
```bash
# Test with oversized file (>10MB for CSV)
# Expected: Validation error - file size exceeds limit
```

#### Test Malicious Content
```bash
# Test CSV with script tags
echo '<script>alert("xss")</script>,test,data' > test.csv
# Expected: Validation error - malicious content detected
```

---

### 6. Environment Variable Validation Testing

#### Test Missing Variables
```bash
# Remove required environment variable
unset NEXT_PUBLIC_FIREBASE_API_KEY

# Start application
npm run dev
# Expected: Error message and application fails to start (in production)
```

#### Test Invalid Variable Formats
```bash
# Set invalid JSON for FIREBASE_SERVICE_ACCOUNT
export FIREBASE_SERVICE_ACCOUNT="invalid-json"

# Start application
npm run dev
# Expected: Validation error for invalid format
```

---

### 7. Firestore Rules Validation Testing

#### Test Rules Validation Script
```bash
# Run validation script
node scripts/validate-firestore-rules.js
# Expected: Passes if production rules are in place

# Test with development rules
cp firestore.rules.production firestore.rules.backup
cp firestore.rules firestore.rules.production
node scripts/validate-firestore-rules.js
# Expected: Fails with error about development rules
```

---

### 8. Security Logging Testing

#### Test Authentication Logging
```bash
# Make authentication requests (success and failure)
# Check Firestore security_events collection
# Expected: Events logged with user ID, IP, timestamp
```

#### Test Payment Logging
```bash
# Create payment
# Check security_events collection
# Expected: Payment transaction logged with all details
```

---

### 9. XSS Protection Testing

#### Test XSS in SVG Content
```bash
# Attempt to inject script in SVG
# Expected: Script tags removed by sanitization
```

#### Test CSP Protection
```bash
# Attempt to inject inline script
# Expected: Blocked by Content-Security-Policy
```

---

### 10. CORS Testing

#### Test CORS in Production
```bash
# Test from unauthorized origin
curl -X GET "http://yourdomain.com/api/export/draft/123" \
  -H "Origin: https://malicious-site.com"
# Expected: 403 Forbidden - CORS policy violation

# Test from authorized origin
curl -X GET "http://yourdomain.com/api/export/draft/123" \
  -H "Origin: https://yourdomain.com"
# Expected: 200 OK (if authenticated)
```

---

## 🔍 AUTOMATED SECURITY TESTING

### Recommended Tools

1. **OWASP ZAP** - Web application security scanner
2. **Burp Suite** - Web vulnerability scanner
3. **npm audit** - Dependency vulnerability scanner
4. **Snyk** - Security scanning for dependencies
5. **SonarQube** - Code quality and security analysis

### CI/CD Integration

```yaml
# Example GitHub Actions workflow
name: Security Tests

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run npm audit
        run: npm audit --production
      - name: Run security tests
        run: npm run test:security
      - name: Validate Firestore rules
        run: node scripts/validate-firestore-rules.js
```

---

## 📋 MANUAL TESTING CHECKLIST

### Pre-Deployment
- [ ] All authentication endpoints require valid tokens
- [ ] CSRF protection works on all state-changing endpoints
- [ ] Rate limiting prevents abuse
- [ ] Security headers are present
- [ ] File uploads are validated
- [ ] Environment variables are validated
- [ ] Firestore rules are production-ready
- [ ] Security events are logged

### Post-Deployment
- [ ] Security headers verified (securityheaders.com)
- [ ] CSRF tokens work in production
- [ ] Rate limiting works correctly
- [ ] Authentication flows work
- [ ] Security logs are being recorded
- [ ] No exposed credentials in git history
- [ ] All environment variables set

---

## 🐛 COMMON SECURITY ISSUES TO TEST

1. **SQL/NoSQL Injection** - Test with malicious queries
2. **XSS** - Test with script tags in inputs
3. **CSRF** - Test without tokens
4. **Authentication Bypass** - Test with invalid tokens
5. **Authorization Bypass** - Test accessing other users' data
6. **Rate Limit Bypass** - Test rapid requests
7. **File Upload Bypass** - Test malicious files
8. **Information Disclosure** - Test error messages

---

## 📊 TESTING METRICS

Track these metrics:
- Authentication success/failure rate
- CSRF violation attempts
- Rate limit hits
- Security event volume
- Failed authentication attempts
- Suspicious activity patterns

---

**Last Updated:** January 2025

