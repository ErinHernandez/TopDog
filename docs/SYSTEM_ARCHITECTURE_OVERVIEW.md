# System Architecture Overview

**Date:** January 12, 2025  
**Status:** ✅ **CREATED**  
**Last Updated:** January 12, 2025

---

## Overview

This document provides a high-level overview of the BestBall site architecture, including key components, data flows, and system design patterns.

---

## System Components

### 1. Frontend (Next.js)

**Technology Stack:**
- Next.js (React framework)
- Firebase Client SDK
- React hooks for state management
- Server-side rendering (SSR)
- Static site generation (SSG)

**Key Features:**
- Draft room interface
- User authentication
- Payment processing UI
- Real-time updates via Firebase

### 2. Backend API (Next.js API Routes)

**Technology Stack:**
- Next.js API Routes (serverless functions)
- Firebase Admin SDK
- Stripe, Paystack, PayMongo, Xendit integrations
- Error handling with `withErrorHandling`
- Structured logging

**Key Features:**
- Payment processing
- Webhook handlers
- Admin operations
- User management

### 3. Database (Firestore)

**Collections:**
- `users` - User profiles and payment data
- `draftRooms` - Draft room configuration
- `draftRooms/{roomId}/picks` - Draft picks (subcollection)
- `transactions` - Payment transactions
- `stripe_webhook_events` - Stripe webhook event tracking
- `audit_log` - Security audit trail

**Features:**
- Real-time listeners
- Transactions for atomic operations
- Security rules for access control

### 4. Authentication (Firebase Auth)

**Features:**
- Email/password authentication
- Custom claims for admin roles
- Token-based API authentication
- User session management

---

## Architecture Patterns

### 1. API Route Standardization

**Pattern:** All API routes use `withErrorHandling` wrapper

**Benefits:**
- Consistent error handling
- Request ID tracking
- Structured logging
- Automatic error categorization

**Status:** 71/72 routes standardized (98.6%)

**Documentation:** `API_STANDARDIZATION_MASTER.md`

---

### 2. Payment Processing

**Pattern:** Multi-provider payment system with unified interface

**Providers:**
- Stripe (primary - US, Europe)
- Paystack (Africa - Nigeria, Ghana, South Africa, Kenya)
- PayMongo (Philippines)
- Xendit (Indonesia, Southeast Asia)

**Flow:**
1. User initiates payment
2. API route creates payment intent
3. User completes payment on provider
4. Webhook handler processes payment
5. Balance updated via transaction
6. Transaction record created

**Security:**
- Webhook signature verification
- Idempotency keys
- Atomic transactions
- Balance verification

**Documentation:** `docs/PAYMENT_ENHANCEMENTS_2025.md`

---

### 3. Draft Room State Management

**Pattern:** Firebase real-time synchronization with local state

**Flow:**
1. Firebase listeners sync room/picks data
2. Local state updated on changes
3. User actions write to Firebase
4. Transactions ensure atomicity
5. Race conditions prevented

**State Manager:** `lib/draft/stateManager.js` (new - Phase 1)

**Features:**
- Atomic state updates
- State validation
- Subscription pattern
- Derived state calculations

**Documentation:** `docs/DRAFT_STATE_MANAGER.md`

---

### 4. Error Handling

**Pattern:** Centralized error handling with structured logging

**Components:**
- `withErrorHandling` wrapper
- `createErrorResponse` / `createSuccessResponse`
- `captureError` for error tracking
- Structured logger for audit trail

**Error Types:**
- VALIDATION_ERROR (400)
- UNAUTHORIZED (401)
- FORBIDDEN (403)
- NOT_FOUND (404)
- INTERNAL_SERVER_ERROR (500)

**Documentation:** `docs/API_ERROR_HANDLING.md`

---

### 5. Data Adapters

**Pattern:** Adapter pattern for data transformation

**Purpose:**
- Transform API responses to internal formats
- Validate data structures
- Provide type safety
- Handle errors gracefully

**Status:** Utilities created (Phase 1)

**Documentation:** `docs/ADAPTER_TYPE_SAFETY.md`

---

## Data Flow Diagrams

### Payment Flow

```
User → API Route → Payment Provider
                    ↓
                  Webhook → Transaction → Balance Update
                    ↓
                  Audit Log
```

### Draft Pick Flow

```
User → makePick() → Firebase Transaction
                        ↓
                    Pick Document Created
                        ↓
                    Room State Updated
                        ↓
                    Real-time Listener → UI Update
```

### Webhook Flow

```
Provider → Webhook Route → Signature Verification
                              ↓
                          Event Processing
                              ↓
                          Transaction Update
                              ↓
                          Balance Adjustment
                              ↓
                          Event Tracking
```

---

## Security Architecture

### Authentication

- Firebase Auth for user authentication
- Custom claims for admin roles
- Token-based API authentication
- Session management

### Authorization

- Firestore security rules
- Custom claims in rules
- API route authentication checks
- Admin-only endpoints

### Payment Security

- Webhook signature verification
- Idempotency keys
- Atomic transactions
- Balance verification
- Audit logging

### Data Protection

- Transaction encryption (Stripe, etc.)
- Secure token storage
- Rate limiting (where applicable)
- Input validation

---

## Performance Optimizations

### Frontend

- React.memo for expensive components
- useMemo for computed values
- useCallback for event handlers
- Virtual scrolling for long lists
- Lazy loading for non-critical components

**Status:** Utilities created (Phase 1)

**Documentation:** `docs/DRAFT_RENDERING_OPTIMIZATIONS.md`

### Backend

- Serverless functions (automatic scaling)
- Database indexing
- Query optimization
- Caching where appropriate
- Retry logic with exponential backoff

---

## Monitoring & Logging

### Error Tracking

- Sentry integration (configured, needs DSN)
- Structured logging
- Error categorization
- Request ID tracking

### Audit Trail

- Payment events logged
- Admin actions tracked
- Security events recorded
- Webhook events tracked

### Performance Monitoring

- Health check endpoint
- Performance metrics endpoint
- Response time tracking
- Error rate monitoring

---

## Deployment Architecture

### Hosting

- Vercel (Next.js deployment)
- Firebase Hosting (static assets)
- Serverless functions

### Database

- Firestore (primary database)
- Real-time synchronization
- Automatic scaling

### CDN

- Vercel Edge Network
- Static asset caching
- Global distribution

---

## Integration Points

### External Services

1. **Payment Providers**
   - Stripe API
   - Paystack API
   - PayMongo API
   - Xendit API

2. **Authentication**
   - Firebase Auth
   - Custom claims management

3. **Data Sources**
   - NFL data APIs
   - Player statistics
   - Rankings data

---

## State Management

### Frontend State

- React hooks (useState, useEffect)
- Context API (where needed)
- Local state for UI
- Firebase real-time listeners

### Backend State

- Firestore database
- Transaction-based updates
- Event tracking
- Audit logs

---

## Error Recovery

### Payment Errors

- Automatic retry with exponential backoff
- Balance restoration on failure
- Transaction status tracking
- Manual review flags

### Draft Errors

- Transaction-based picks (atomicity)
- Race condition prevention
- State validation
- Recovery mechanisms

---

## Scalability Considerations

### Horizontal Scaling

- Serverless functions (automatic)
- Firestore (automatic)
- CDN distribution

### Performance

- Database indexing
- Query optimization
- Caching strategies
- Code splitting

### Reliability

- Error handling
- Retry logic
- Health checks
- Monitoring

---

## Related Documentation

### System Documentation
- `API_STANDARDIZATION_MASTER.md` - API standardization status
- `docs/API_ERROR_HANDLING.md` - Error handling guide
- `docs/API_DOCUMENTATION.md` - API reference

### Payment Documentation
- `docs/PAYMENT_ENHANCEMENTS_2025.md` - Payment enhancements
- `docs/PAYSTACK_RETRY_LOGIC.md` - Paystack retry logic
- `docs/STRIPE_WEBHOOK_EVENT_TRACKING.md` - Stripe webhook tracking

### Draft Documentation
- `docs/DRAFT_STATE_MANAGER.md` - State management
- `docs/DRAFT_RENDERING_OPTIMIZATIONS.md` - Rendering optimizations
- `docs/draft-room-v3-architecture.md` - Draft room architecture

### Security Documentation
- `docs/ADMIN_CLAIMS_MIGRATION.md` - Admin claims migration
- `SECURITY_FIXES.md` - Security fixes
- `CUSTOM_CLAIMS_SETUP.md` - Custom claims setup

---

## Architecture Diagrams (Text-based)

### System Overview

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Next.js App    │
│  (Frontend)     │
└──────┬──────────┘
       │
       ├──────────────┐
       ▼              ▼
┌─────────────┐  ┌──────────────┐
│ API Routes  │  │  Firebase    │
│ (Backend)   │  │  (Real-time) │
└──────┬──────┘  └──────┬───────┘
       │                │
       ├────────────┬───┘
       ▼            ▼
┌─────────────┐  ┌──────────────┐
│  Payment    │  │  Firestore   │
│  Providers  │  │  (Database)  │
└─────────────┘  └──────────────┘
```

### Payment Architecture

```
User Request
    │
    ▼
API Route (withErrorHandling)
    │
    ├─→ Payment Provider API
    │       │
    │       └─→ Webhook → Event Tracking
    │                        │
    │                        ├─→ Transaction Update
    │                        └─→ Balance Update
    │
    └─→ Firestore Transaction
            │
            └─→ Audit Log
```

---

## Next Steps

### Phase 1: ✅ Complete
- API standardization (98.6%)
- Payment enhancements
- Error handling improvements
- State management utilities
- Rendering optimization utilities
- Adapter type safety utilities

### Phase 2: Future Work
- Full draft room state manager integration
- Full rendering optimization integration
- Adapter pattern migration
- Performance monitoring
- Additional architecture diagrams (visual)

---

**Last Updated:** January 12, 2025  
**Status:** ✅ **ACTIVE DOCUMENTATION**
