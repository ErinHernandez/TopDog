# Developer Guide - BestBall Site

**Last Updated:** January 2025  
**Status:** Enterprise-Grade Platform  
**Philosophy:** Enterprise grade = reliability for critical features (drafts, payments)

---

## Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- Firebase account
- Environment variables configured

### Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

---

## Project Structure

```
bestball-site/
├── pages/
│   ├── api/              # API routes
│   │   ├── v1/           # Versioned API endpoints
│   │   └── _template.ts  # API route template
│   └── ...
├── components/            # React components
├── lib/                  # Utilities and helpers
│   ├── structuredLogger.ts    # Server-side logging
│   ├── clientLogger.ts         # Client-side logging
│   ├── apiErrorHandler.js      # API error handling
│   └── ...
├── __tests__/            # Test files
├── docs/                 # Documentation
└── ...
```

---

## Key Concepts

### Error Handling

All API routes should use `withErrorHandling`:

```typescript
import { withErrorHandling, validateMethod, createSuccessResponse } from '../../lib/apiErrorHandler';

export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['GET'], logger);
    // Your logic here
    const response = createSuccessResponse({ data }, 200, logger);
    return res.status(response.statusCode).json(response.body);
  });
}
```

### Logging

**Server-side (API routes):**
```typescript
import { logger } from '@/lib/structuredLogger';

logger.info('Event occurred', { context: 'data' });
logger.error('Error occurred', error, { context: 'data' });
```

**Client-side (components):**
```typescript
import { logger } from '@/lib/clientLogger';

logger.debug('Debug info', { userId: '123' });
logger.error('Error occurred', error, { context: 'data' });
```

**❌ Don't use:**
```typescript
console.log('Something happened'); // ESLint will warn
```

### TypeScript

- `noImplicitAny: true` is enabled
- All implicit `any` errors have been fixed
- Use explicit types for function parameters and return values
- Use `@ts-expect-error` with comments only when necessary

### Testing

- Draft state machine tests: `__tests__/draft-state.test.js`
- Run tests: `npm test`
- Coverage: `npm run test:coverage`

---

## Creating New API Routes

1. **Copy the template:**
   ```bash
   cp pages/api/_template.ts pages/api/your-endpoint.ts
   ```

2. **Customize:**
   - Update JSDoc comment
   - Define request/response types
   - Implement business logic
   - Add middleware as needed

3. **See:** `docs/API_ROUTE_TEMPLATE.md` for complete guide

---

## Critical Systems

### Payment System
- All payment webhooks use structured logging
- All payment APIs use structured logging
- Idempotency verified
- Transaction safety (Firestore transactions)

### Draft System
- State machine tests implemented
- Transaction safety (Firestore transactions)
- Error boundaries integrated
- Structured logging in critical paths

### Authentication
- Signup route uses structured logging
- Username change route uses structured logging
- Security logging integrated

---

## Environment Variables

Required environment variables (see `.env.example` or setup docs):
- `NEXT_PUBLIC_FIREBASE_*` - Firebase configuration
- `FIREBASE_SERVICE_ACCOUNT` - Firebase Admin
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `SPORTSDATAIO_API_KEY` - SportsDataIO API key
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry error tracking (optional)

---

## Code Quality Standards

### ESLint Rules
- `no-console` - Warns on `console.log` (use structured logger instead)
- React hooks rules
- Next.js best practices

### TypeScript
- `noImplicitAny: true` - All implicit `any` errors fixed
- Use explicit types
- Avoid `any` type

### Error Handling
- Use `withErrorHandling` wrapper for API routes
- Use `createErrorResponse` for consistent error format
- Use `createSuccessResponse` for consistent success format

### Logging
- Use structured logger (server-side) or client logger (client-side)
- Don't log sensitive data (passwords, tokens, credit cards)
- Include context in logs

---

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- __tests__/draft-state.test.js

# Watch mode
npm run test:watch
```

### Test Coverage
- Draft state machine: `__tests__/draft-state.test.js`
- Focus on critical paths (draft logic, payment flows)
- Integration tests with Firestore mocks (future)

---

## Monitoring & Observability

### Error Tracking
- **Sentry:** Configured (needs DSN setup)
- **Setup:** See `TIER1_ERROR_TRACKING_SETUP.md`

### Health Check
- **Endpoint:** `/api/health`
- **Returns:** Status, uptime, version, environment

### Logging
- **Server:** Structured JSON logs (production)
- **Client:** Environment-aware logging
- **Format:** JSON in production, pretty-print in development

### Monitoring Setup
- **Vercel Analytics:** Enable in Vercel Dashboard
- **UptimeRobot:** See `docs/MONITORING_SETUP.md`

---

## API Versioning

### Current Version
- **v1:** `/api/v1/` (examples created)
- **Legacy:** Unversioned endpoints (backward compatible)

### Versioning Policy
- See `docs/API_VERSIONING_POLICY.md`
- New breaking changes should use `/api/v1/`
- Legacy endpoints deprecated after 6-12 months

---

## CI/CD

### GitHub Actions
- **Workflow:** `.github/workflows/ci.yml`
- **Runs:** Tests, linting, builds, security scans
- **Triggers:** Push to main/develop, pull requests

### Manual Deployment
- Vercel automatically deploys on push to main
- Or use `vercel deploy` command

---

## Common Tasks

### Adding a New API Route
1. Copy `pages/api/_template.ts`
2. Customize for your endpoint
3. Add middleware (auth, rate limiting, CSRF) as needed
4. Test locally
5. See `docs/API_ROUTE_TEMPLATE.md`

### Fixing TypeScript Errors
1. Run `npx tsc --noEmit` to see errors
2. Add explicit types to function parameters
3. Use `@ts-expect-error` with comments only when necessary
4. See `TIER2_TYPESCRIPT_STRICT_MODE_PLAN.md`

### Replacing Console Statements
1. Use `logger` from `lib/structuredLogger` (server-side)
2. Use `logger` from `lib/clientLogger` (client-side)
3. ESLint will warn on new `console.log` usage

### Adding Tests
1. Create test file in `__tests__/`
2. Use Jest and React Testing Library
3. Focus on critical paths
4. Mock external dependencies (Firestore, APIs)

---

## Troubleshooting

### TypeScript Errors
- Run `npx tsc --noEmit` to see all errors
- Check `tsconfig.json` for configuration
- See `TIER2_TYPESCRIPT_ERRORS_FIXED.md` for common fixes

### ESLint Warnings
- Run `npm run lint` to see warnings
- Fix console.log warnings by using structured logger
- See `.eslintrc.json` for rules

### Build Errors
- Check TypeScript errors first
- Verify environment variables are set
- Check `next.config.js` for configuration

### Test Failures
- Run `npm test` to see failures
- Check test mocks are set up correctly
- Verify test data matches current schema

---

## Documentation

### Essential Docs
- `ENTERPRISE_GRADE_COMPLETE_SUMMARY.md` - Complete transformation summary
- `ALL_TIERS_IMPLEMENTATION_STATUS.md` - Master status document
- `NEXT_STEPS_AND_QUICK_WINS.md` - Next steps and quick wins
- `docs/API_ROUTE_TEMPLATE.md` - API route creation guide
- `docs/API_VERSIONING_POLICY.md` - API versioning guide
- `docs/MONITORING_SETUP.md` - Monitoring setup guide

### Setup Guides
- `TIER1_ERROR_TRACKING_SETUP.md` - Sentry setup
- `TIER1_CICD_SETUP.md` - CI/CD setup
- `FIREBASE_SETUP.md` - Firebase configuration

### Status Documents
- `TIER1_COMPLETE_SUMMARY.md` - Tier 1 completion
- `TIER2_COMPLETE_SUMMARY.md` - Tier 2 completion
- `TIER1_IMPLEMENTATION_STATUS.md` - Tier 1 detailed status
- `TIER2_IMPLEMENTATION_STATUS.md` - Tier 2 detailed status

---

## Best Practices

### Do ✅
- Use `withErrorHandling` for API routes
- Use structured logger instead of console.log
- Add explicit TypeScript types
- Write tests for critical paths
- Use API route template for new routes
- Follow API versioning policy
- Include context in logs
- Validate request parameters

### Don't ❌
- Use `console.log` in production code
- Use `any` type without good reason
- Skip error handling
- Log sensitive data
- Create unversioned breaking API changes
- Skip tests for critical features
- Ignore ESLint warnings

---

## Getting Help

### Documentation
- Check `docs/` directory for guides
- See status documents for implementation details
- Review `ENTERPRISE_GRADE_COMPLETE_SUMMARY.md` for overview

### Code Examples
- `pages/api/_template.ts` - API route template
- `pages/api/v1/stripe/customer.ts` - Versioned API example
- `__tests__/draft-state.test.js` - Test examples

### Common Issues
- TypeScript errors: See `TIER2_TYPESCRIPT_ERRORS_FIXED.md`
- Console.log warnings: Use structured logger
- API errors: Check `withErrorHandling` usage

---

## Contributing

### Code Standards
- Follow ESLint rules
- Use TypeScript with explicit types
- Write tests for new features
- Use structured logging
- Follow API route template

### Pull Request Process
1. Create feature branch
2. Make changes following standards
3. Run tests: `npm test`
4. Run linter: `npm run lint`
5. Check TypeScript: `npx tsc --noEmit`
6. Create pull request
7. CI/CD will run automatically

---

**Last Updated:** January 2025  
**Status:** Enterprise-Grade Platform ✅
