# Quick Reference Guide

**Last Updated:** January 2025  
**Purpose:** Quick lookup for common tasks and information

---

## 🚀 Quick Links

### Most Used Documents
- **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)** - Complete developer guide
- **[docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** - API reference
- **[docs/API_ROUTE_TEMPLATE.md](docs/API_ROUTE_TEMPLATE.md)** - Create new API routes
- **[ALL_TIERS_IMPLEMENTATION_STATUS.md](ALL_TIERS_IMPLEMENTATION_STATUS.md)** - Status overview

### Setup & Configuration
- **[TIER1_ERROR_TRACKING_SETUP.md](TIER1_ERROR_TRACKING_SETUP.md)** - Sentry setup
- **[docs/MONITORING_SETUP.md](docs/MONITORING_SETUP.md)** - Monitoring setup
- **[TIER1_CICD_SETUP.md](TIER1_CICD_SETUP.md)** - CI/CD setup

---

## 📋 Common Tasks

### Creating a New API Route

1. Copy template:
   ```bash
   cp pages/api/_template.ts pages/api/my-endpoint.ts
   ```

2. Follow guide: `docs/API_ROUTE_TEMPLATE.md`

3. Use structured logging:
   ```typescript
   import { logger } from '@/lib/structuredLogger';
   logger.info('Event', { context: 'data' });
   ```

### Running Database Migrations

1. Create migration file:
   ```bash
   # Create: lib/migrations/migrations/002_my_migration.ts
   ```

2. Register in `lib/migrations/index.ts`

3. Run migration:
   ```bash
   # Via API
   POST /api/migrations/run
   Body: { "dryRun": false }
   
   # Or via code
   import { runMigrations, migrations } from '@/lib/migrations';
   await runMigrations(migrations, false);
   ```

4. See guide: `docs/DATABASE_MIGRATIONS_GUIDE.md`

### Checking Performance Metrics

1. Health endpoint:
   ```bash
   GET /api/health
   ```

2. Performance metrics:
   ```bash
   POST /api/performance/metrics
   Body: { "lcp": 2500, "fid": 50, "cls": 0.05 }
   ```

3. Client-side collection:
   ```typescript
   import { collectAndReportWebVitals } from '@/lib/performance/webVitals';
   collectAndReportWebVitals();
   ```

### Running Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Draft tests only
npm test -- __tests__/draft

# Watch mode
npm run test:watch
```

### Type Checking

```bash
# Check TypeScript errors
npx tsc --noEmit --noImplicitAny

# Full strict mode check
npx tsc --noEmit --strict
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

---

## 🔧 Code Patterns

### Structured Logging (Server)

```typescript
import { logger } from '@/lib/structuredLogger';

logger.info('User action', { userId, action: 'pick' });
logger.error('Error occurred', error, { context: 'draft' });
logger.warn('Warning', { message: 'Low balance' });
logger.debug('Debug info', { data: 'details' });
```

### Structured Logging (Client)

```typescript
import { logger } from '@/lib/clientLogger';

logger.info('User action', { action: 'click' });
logger.error('Error occurred', error, { component: 'DraftRoom' });
logger.warn('Warning', { message: 'Slow connection' });
logger.debug('Debug info', { data: 'details' });
```

### Error Handling (API Routes)

```typescript
import { withErrorHandling, validateMethod, validateBody } from '@/lib/apiErrorHandler';

export default withErrorHandling(async (req, res, logger) => {
  validateMethod(req, ['POST'], logger);
  validateBody(req, ['userId', 'amount'], logger);
  
  // Your logic here
  
  return res.status(200).json({ ok: true, data: result });
});
```

### Error Tracking

```typescript
import { captureError } from '@/lib/errorTracking';

try {
  // Your code
} catch (error) {
  await captureError(error as Error, {
    tags: { component: 'payment', operation: 'charge' },
    extra: { userId, amount },
  });
  throw error;
}
```

---

## 📊 Status Checks

### Check Migration Status

```bash
GET /api/migrations/status
Authorization: Bearer <admin-token>
```

### Check Health

```bash
GET /api/health
```

### Check API Version

All versioned endpoints include:
```
API-Version: 1
```

---

## 🐛 Troubleshooting

### TypeScript Errors

1. Check `tsconfig.json` settings
2. Run: `npx tsc --noEmit --noImplicitAny`
3. See: `TIER2_TYPESCRIPT_ERRORS_FIXED.md`

### Test Failures

1. Check test output
2. Run specific test: `npm test -- test-name`
3. Check coverage: `npm run test:coverage`

### API Errors

1. Check structured logs
2. Verify error handling wrapper
3. Check Sentry (if configured)
4. See: `docs/API_ERROR_HANDLING.md`

### Migration Issues

1. Check migration status
2. Verify migration version
3. Test with dry run first
4. See: `docs/DATABASE_MIGRATIONS_GUIDE.md`

---

## 📚 Documentation Quick Find

### Need to...

| Task | Document |
|------|----------|
| Create API route | `docs/API_ROUTE_TEMPLATE.md` |
| Check API docs | `docs/API_DOCUMENTATION.md` |
| Set up Sentry | `TIER1_ERROR_TRACKING_SETUP.md` |
| Set up monitoring | `docs/MONITORING_SETUP.md` |
| Create migration | `docs/DATABASE_MIGRATIONS_GUIDE.md` |
| Audit accessibility | `docs/ACCESSIBILITY_AUDIT_GUIDE.md` |
| Check tech debt | `docs/TECHNICAL_DEBT_AUDIT.md` |
| See status | `ALL_TIERS_IMPLEMENTATION_STATUS.md` |
| Production deploy | `PRODUCTION_READINESS_REPORT.md` |

---

## 🔑 Environment Variables

### Required for Production

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_SERVICE_ACCOUNT=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=
```

---

## 📈 Performance Budgets

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| **FID** | ≤ 100ms | ≤ 300ms | > 300ms |
| **CLS** | ≤ 0.1 | ≤ 0.25 | > 0.25 |
| **FCP** | ≤ 1.8s | ≤ 3.0s | > 3.0s |
| **TTFB** | ≤ 800ms | ≤ 1.8s | > 1.8s |

---

## 🎯 Priority Levels

### Technical Debt

- **P0 (Critical):** Security issues, data loss risks
- **P1 (High):** Performance issues, major refactoring
- **P2 (Medium):** Code quality improvements
- **P3 (Low):** Nice-to-have improvements

See: `docs/TECHNICAL_DEBT_AUDIT.md`

---

## 📞 Support Resources

### Documentation
- **Index:** `DOCUMENTATION_INDEX.md`
- **Developer Guide:** `DEVELOPER_GUIDE.md`
- **Complete Summary:** `ENTERPRISE_GRADE_TRANSFORMATION_COMPLETE.md`

### Status Documents
- **All Tiers:** `ALL_TIERS_IMPLEMENTATION_STATUS.md`
- **Tier 1:** `TIER1_COMPLETE_SUMMARY.md`
- **Tier 2:** `TIER2_COMPLETE_SUMMARY.md`
- **Tier 3:** `TIER3_COMPLETE_SUMMARY.md`

---

**Last Updated:** January 2025  
**For detailed information, see:** `DOCUMENTATION_INDEX.md`
