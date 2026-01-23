# Deep Research Handoff Document: BestBall Site Codebase
## Comprehensive Codebase Context for Major Refactoring Planning

**Date:** January 2025  
**Purpose:** Provide extreme codebase context for planning a major refactoring  
**Target Audience:** AI Agent or Developer Planning Refactoring  
**Status:** Complete Deep Research

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Technology Stack & Dependencies](#technology-stack--dependencies)
3. [Application Architecture](#application-architecture)
4. [Core Systems Deep Dive](#core-systems-deep-dive)
5. [Data Models & Firestore Schema](#data-models--firestore-schema)
6. [API Architecture](#api-architecture)
7. [Component Architecture](#component-architecture)
8. [State Management Patterns](#state-management-patterns)
9. [Authentication & Security](#authentication--security)
10. [Payment System Architecture](#payment-system-architecture)
11. [Draft Room System](#draft-room-system)
12. [Testing Infrastructure](#testing-infrastructure)
13. [Build & Deployment](#build--deployment)
14. [Environment Configuration](#environment-configuration)
15. [Known Technical Debt](#known-technical-debt)
16. [Refactoring Considerations](#refactoring-considerations)

---

## Executive Summary

### Application Overview

**BestBall Site** is a fantasy football draft platform built with Next.js, featuring:
- **Real-time draft rooms** with live pick submission
- **Multi-provider payment system** (Stripe, Paystack, PayMongo, Xendit)
- **Mobile-first VX2 framework** with tablet support
- **Firebase backend** (Firestore + Auth)
- **Enterprise-grade error handling** and logging
- **Collusion detection system** for integrity
- **Location-based payment restrictions** (US states only)

### Key Metrics

- **Codebase Size:** ~530 component files, 209 lib files, 176 page files
- **API Routes:** 73 total (71 standardized with `withErrorHandling`)
- **Draft Room Versions:** 5 distinct implementations (v2, v3, topdog, VX, VX2)
- **TypeScript Coverage:** Strict mode enabled, gradual migration from JS
- **Test Coverage:** Risk-based thresholds (Payment: 95%+, Security: 90%+)

### Critical Architecture Decisions

1. **Multi-Version Draft Rooms:** Legacy versions (v2, v3) coexist with modern VX2
2. **Payment Provider Abstraction:** Unified interface for 4 payment providers
3. **Context-Based State:** React Context + hooks (Redux being phased out)
4. **API Standardization:** 98.6% of routes use `withErrorHandling` wrapper
5. **Mobile-First Design:** VX2 framework designed for mobile, with tablet adaptations

---

## Technology Stack & Dependencies

### Core Framework

```json
{
  "next": "^16.0.8",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.9.3"
}
```

### Key Dependencies

**Backend Services:**
- `firebase`: `^11.9.1` - Client SDK
- `firebase-admin`: `^13.0.1` - Server SDK
- `stripe`: `^18.3.0` - Payment processing
- `@sentry/nextjs`: `^10.33.0` - Error tracking

**State & Data:**
- `swr`: `^2.3.7` - Data fetching
- `react-redux`: `^7.2.9` - Legacy state (being phased out)
- `redux`: `^5.0.1` - Legacy state

**UI Libraries:**
- `react-beautiful-dnd`: `^13.1.1` - Drag and drop
- `react-window`: `^1.8.11` - Virtual scrolling
- `tailwindcss`: `^3.3.3` - Styling

**Testing:**
- `jest`: `^30.0.3` - Test runner
- `@testing-library/react`: `^16.3.0` - Component testing
- `cypress`: `^14.5.0` - E2E testing

### Build Configuration

**Next.js Config** (`next.config.js`):
- PWA support via `next-pwa` (production only)
- Bundle analyzer support
- Webpack optimization with code splitting
- Security headers (CSP, HSTS, etc.)
- Image optimization (AVIF, WebP)
- Service worker caching strategies

**TypeScript Config** (`tsconfig.json`):
- **Strict mode:** ✅ ALL flags enabled
- `strictNullChecks`: true
- `noImplicitAny`: true
- `strictFunctionTypes`: true
- Path aliases: `@/*`, `@/lib/*`, `@/components/*`

---

## Application Architecture

### Entry Points

**Main App** (`pages/_app.js`):
```javascript
// Key providers wrapping the app
<SWRConfig value={swrConfig}>
  <UserProvider>
    <PlayerDataProvider>
      <GlobalErrorBoundary>
        <Component {...pageProps} />
      </GlobalErrorBoundary>
    </PlayerDataProvider>
  </UserProvider>
</SWRConfig>
```

**Home Page** (`pages/index.js`):
- Auto-redirects mobile devices to `/testing-grounds/vx2-mobile-app-demo`
- Desktop shows landing page

**Middleware** (`middleware.ts`):
- Handles draft room version redirects (disabled by default)
- Can redirect `/draft/v2/` → `/draft/vx2/` (controlled by env var)

### Application Flow

```
User Request
  ↓
Next.js Middleware (optional redirects)
  ↓
pages/_app.js (providers, error boundary)
  ↓
Page Component
  ├── Desktop: Standard pages
  └── Mobile: VX2 AppShell
      ├── AuthGateVX2 (mandatory login)
      ├── TabNavigationProvider
      └── TabContentVX2
          ├── LobbyTabVX2
          ├── MyTeamsTabVX2
          ├── LiveDraftsTabVX2
          ├── ExposureTabVX2
          └── ProfileTabVX2
```

---

## Core Systems Deep Dive

### 1. API Error Handling System

**Location:** `lib/apiErrorHandler.ts` / `lib/apiErrorHandler.js`

**Pattern:** All API routes wrap handlers with `withErrorHandling`:

```typescript
// Standard API route pattern
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // 1. Validate HTTP method
    validateMethod(req, ['GET', 'POST'], logger);
    
    // 2. Validate inputs
    validateQueryParams(req, ['param1'], logger);
    validateBody(req, ['field1'], logger);
    
    // 3. Business logic
    logger.info('Processing request');
    const data = await fetchData();
    
    // 4. Return response
    const response = createSuccessResponse(data, 200, logger);
    return res.status(response.statusCode).json(response.body);
  });
}
```

**Features:**
- Automatic error categorization (VALIDATION, UNAUTHORIZED, FORBIDDEN, etc.)
- Request ID generation and tracking
- Structured JSON logging
- Security-conscious error messages (no stack traces in production)
- Duration tracking

**Error Types:**
```typescript
export const ErrorType = {
  VALIDATION: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  RATE_LIMIT: 'RATE_LIMIT',
  EXTERNAL_API: 'EXTERNAL_API_ERROR',
  DATABASE: 'DATABASE_ERROR',
  INTERNAL: 'INTERNAL_SERVER_ERROR',
  CONFIGURATION: 'CONFIGURATION_ERROR',
  STRIPE: 'STRIPE_ERROR',
} as const;
```

**Standardization Status:** 71/73 routes (98.6%) standardized

---

### 2. Firebase Integration

**Client SDK** (`lib/firebase.js`):
```javascript
// Initialization with offline persistence
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable offline persistence (client-side only)
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    // Graceful fallback if persistence unavailable
  });
}

const auth = getAuth(app);
```

**Admin SDK** (`lib/firebase-utils.ts`):
- Server-side Firestore operations
- Authentication token verification
- Admin operations

**Key Collections:**
- `users/{userId}` - User profiles
- `draftRooms/{roomId}` - Draft configurations
- `draftRooms/{roomId}/picks/{pickNumber}` - Individual picks
- `transactions/{transactionId}` - Payment records
- `username_index/{username}` - Username lookup index

---

### 3. Structured Logging

**Server-Side** (`lib/structuredLogger.ts`):
```typescript
import { logger } from '@/lib/structuredLogger';

logger.info('Event occurred', { context: 'data' });
logger.error('Error occurred', error, { context: 'data' });
```

**Client-Side** (`lib/clientLogger.ts`):
```typescript
import { createScopedLogger } from '@/lib/clientLogger';

const logger = createScopedLogger('[ComponentName]');
logger.debug('Debug info', { userId: '123' });
logger.error('Error occurred', error, { context: 'data' });
```

**Features:**
- Scoped loggers for components
- Structured JSON output
- Log levels (DEBUG, INFO, WARN, ERROR)
- Context data attached to logs

---

## Data Models & Firestore Schema

### User Document (`/users/{userId}`)

```typescript
interface UserDocument {
  // Identity
  id: string;
  email?: string;
  username?: string;
  displayName?: string;
  
  // Payment data
  balance: number;
  stripeCustomerId?: string;
  paystackCustomerCode?: string;
  preferredPaymentProvider?: 'stripe' | 'paystack';
  
  // Statistics
  totalDeposits?: number;
  totalWithdrawals?: number;
  depositCount?: number;
  withdrawalCount?: number;
  
  // Security
  registrationCountry?: string;
  lastPaymentCountry?: string;
  deviceFingerprints?: string[];
  paymentFlagged?: boolean;
  
  // Timestamps
  createdAt: Timestamp;
  lastActive?: Timestamp;
  lastLogin?: Timestamp;
}
```

### Draft Room Document (`/draftRooms/{roomId}`)

```typescript
interface DraftRoom {
  // Identity
  id: string;
  tournamentId: string;
  
  // Configuration
  draftType: 'fast' | 'slow';
  pickTimeSeconds: number; // 30 for fast, 43200 for slow
  numTeams: number; // Usually 12
  numRounds: number; // Usually 18
  snakeOrder: boolean;
  
  // State
  status: 'scheduled' | 'filling' | 'active' | 'paused' | 'completed' | 'cancelled';
  currentPickNumber: number; // 1-216
  currentPickDeadline: Timestamp;
  
  // Participants (ordered by draft position)
  participants: DraftParticipant[];
  
  // Timestamps
  scheduledStartTime: Timestamp;
  actualStartTime: Timestamp | null;
  completedTime: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface DraftParticipant {
  orderId: number; // 0-11 (draft position)
  userId: string;
  username: string; // Denormalized for display
  isConnected: boolean; // Real-time presence
  lastSeenAt: Timestamp;
  autopickEnabled: boolean;
}
```

### Pick Document (`/draftRooms/{roomId}/picks/{pickNumber}`)

```typescript
interface Pick {
  // Identity
  id: string; // `${roomId}_${pickNumber}`
  roomId: string;
  pickNumber: number; // 1-216
  
  // Pick data
  playerId: string;
  playerName: string; // Denormalized
  position: string;
  team: string;
  
  // Picker info
  userId: string;
  username: string; // Denormalized
  userIndex: number; // Draft position (0-11)
  
  // Metadata
  isAutopick: boolean;
  source?: 'manual' | 'queue' | 'custom_ranking' | 'adp';
  timestamp: Timestamp;
  
  // Location tracking (for integrity)
  location?: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  deviceId?: string;
}
```

### Transaction Document (`/transactions/{transactionId}`)

```typescript
interface Transaction {
  id: string;
  userId: string;
  
  // Transaction details
  type: 'deposit' | 'withdrawal' | 'entry_fee' | 'payout';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: number; // In smallest currency unit
  currency: string;
  
  // Provider info
  provider: 'stripe' | 'paystack' | 'paymongo' | 'xendit';
  providerTransactionId?: string;
  providerReference?: string;
  
  // Metadata
  description?: string;
  metadata?: Record<string, unknown>;
  
  // Timestamps
  createdAt: Timestamp;
  completedAt?: Timestamp;
  failedAt?: Timestamp;
}
```

### Firestore Security Rules

**Location:** `firestore.rules`

**Key Rules:**
```javascript
// Users can read/write their own data
match /users/{userId} {
  allow read: if isOwner(userId) || isAdmin();
  allow create: if isOwner(userId);
  allow update: if isOwner(userId);
  allow delete: if isOwner(userId) || isAdmin();
}

// Draft rooms - authenticated users can read, only participants can write
match /draftRooms/{roomId} {
  allow read: if isAuthenticated();
  allow write: if isAuthenticated() && 
    request.auth.uid in resource.data.participants[].userId;
}

// Picks - authenticated users can read
match /draftRooms/{roomId}/picks/{pickNumber} {
  allow read: if isAuthenticated();
  allow write: if false; // Server-only writes via API
}
```

---

## API Architecture

### Route Organization

```
pages/api/
├── auth/                    # Authentication
│   ├── signup.js
│   ├── username/
│   │   ├── check.js
│   │   ├── claim.js
│   │   └── reserve.js
│   └── verify-admin.ts
├── stripe/                  # Stripe payments
│   ├── payment-intent.ts
│   ├── webhook.ts
│   ├── customer.ts
│   └── connect/
├── paystack/                # Paystack payments
│   ├── initialize.ts
│   ├── verify.ts
│   ├── webhook.ts
│   └── transfer/
├── paymongo/                # PayMongo payments
│   ├── payment.ts
│   ├── webhook.ts
│   └── payout.ts
├── xendit/                  # Xendit payments
│   ├── ewallet.ts
│   ├── webhook.ts
│   └── disbursement.ts
├── draft/                   # Draft operations
│   ├── submit-pick.ts       # CRITICAL: Atomic pick submission
│   └── validate-pick.ts
├── slow-drafts/             # Slow draft specific
│   └── [draftId]/
│       └── quick-pick.ts
├── nfl/                     # NFL data
│   ├── players.js
│   ├── projections.js
│   ├── fantasy/
│   │   ├── rankings.js
│   │   └── adp.js
│   └── stats/
├── user/                    # User management
│   ├── display-currency.ts
│   └── update-contact.ts
├── admin/                   # Admin operations
│   ├── integrity/           # Collusion detection
│   │   ├── drafts.ts
│   │   ├── pairs.ts
│   │   └── actions.ts
│   └── verify-claims.ts
└── v1/                      # Versioned API
    ├── stripe/
    └── user/
```

### Critical API Routes

#### 1. Draft Pick Submission (`/api/draft/submit-pick`)

**File:** `pages/api/draft/submit-pick.ts`

**Purpose:** Atomic pick submission with validation

**Key Features:**
- Firestore transaction for atomicity
- Turn validation
- Player availability check
- Location integrity tracking (optional)
- Autopick support

**Code Example:**
```typescript
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubmitPickResponse>
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST'], logger);
    validateBody(req, ['roomId', 'userId', 'playerId'], logger);
    
    const { roomId, userId, playerId, isAutopick, location } = req.body;
    
    // Use Firestore transaction for atomicity
    const result = await runTransaction(db, async (transaction) => {
      // 1. Get room data
      const roomRef = doc(db, 'draftRooms', roomId);
      const roomDoc = await transaction.get(roomRef);
      
      if (!roomDoc.exists()) {
        throw new Error('ROOM_NOT_FOUND:Draft room not found');
      }
      
      const room = roomDoc.data() as DraftRoom;
      
      // 2. Validate draft is active
      if (room.status !== 'active') {
        throw new Error(`DRAFT_NOT_ACTIVE:Draft is not active (${room.status})`);
      }
      
      // 3. Validate it's user's turn
      const participantIndex = getParticipantIndexForPick(
        room.currentPickNumber,
        room.teamCount
      );
      const currentParticipant = room.participants[participantIndex];
      
      if (currentParticipant.userId !== userId) {
        throw new Error('NOT_YOUR_TURN:It is not your turn to pick');
      }
      
      // 4. Check player not already picked
      const picksRef = collection(db, 'draftRooms', roomId, 'picks');
      const existingPicks = await getDocs(
        query(picksRef, where('playerId', '==', playerId))
      );
      
      if (!existingPicks.empty) {
        throw new Error('PLAYER_ALREADY_PICKED:Player already drafted');
      }
      
      // 5. Create pick document
      const pickRef = doc(picksRef);
      const pickData = {
        id: pickRef.id,
        roomId,
        pickNumber: room.currentPickNumber,
        playerId,
        userId,
        timestamp: serverTimestamp(),
        // ... other fields
      };
      
      transaction.set(pickRef, pickData);
      
      // 6. Update room state
      transaction.update(roomRef, {
        currentPickNumber: room.currentPickNumber + 1,
        lastPickAt: serverTimestamp(),
      });
      
      return pickData;
    });
    
    // Return success
    const response = createSuccessResponse(result, 200, logger);
    return res.status(response.statusCode).json(response.body);
  });
}
```

#### 2. Payment Intent Creation (`/api/stripe/payment-intent`)

**File:** `pages/api/stripe/payment-intent.ts`

**Purpose:** Create Stripe payment intent with fraud detection

**Key Features:**
- Fraud detection before payment
- Location verification (US states only)
- Balance update via transaction
- Webhook event tracking

#### 3. Webhook Handlers

**Stripe Webhook** (`/api/stripe/webhook.ts`):
- Verifies Stripe signature
- Handles async payment events
- Updates transaction status
- Updates user balance

**Pattern:**
```typescript
export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
  
  // Process event based on type
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
    // ... other event types
  }
}
```

---

## Component Architecture

### VX2 Framework (Modern, Recommended)

**Location:** `components/vx2/`

**Structure:**
```
components/vx2/
├── index.ts                 # Main exports
├── shell/                   # App shell
│   ├── AppShellVX2.tsx     # Root orchestrator
│   └── MobilePhoneFrame.tsx
├── auth/                    # Authentication
│   ├── context/
│   │   └── AuthContext.tsx   # Auth state management
│   ├── components/
│   │   └── AuthGateVX2.tsx # Mandatory login gate
│   └── types.ts
├── core/                    # Core systems
│   ├── context/
│   │   ├── TabNavigationContext.tsx
│   │   └── HeaderContext.tsx
│   └── constants/
├── navigation/              # Navigation components
│   ├── TabBarVX2.tsx
│   └── TabContentVX2.tsx
├── tabs/                    # Tab implementations
│   ├── lobby/
│   │   ├── LobbyTabVX2.tsx
│   │   └── TournamentCard.tsx
│   ├── my-teams/
│   ├── live-drafts/
│   ├── exposure/
│   └── profile/
├── draft-room/              # Draft room components
│   ├── components/
│   │   └── DraftRoomVX2.tsx
│   ├── hooks/
│   │   ├── useDraftRoom.ts
│   │   └── useDraftPicks.ts
│   └── adapters/
│       └── firebaseAdapter.ts
├── modals/                  # Modal components
│   ├── DepositModalVX2.tsx
│   ├── WithdrawModalVX2.tsx
│   └── ...
└── hooks/                   # Shared hooks
    ├── ui/
    └── data/
```

### AppShellVX2 Architecture

**File:** `components/vx2/shell/AppShellVX2.tsx`

**Responsibilities:**
1. Authentication gate (mandatory login)
2. Tab navigation orchestration
3. Header rendering
4. Content area management
5. Tab bar rendering
6. Modal layer management

**Code Structure:**
```typescript
export function AppShellVX2({ devicePreset }: AppShellVX2Props) {
  const { user, status } = useAuth();
  
  // Mandatory authentication gate
  if (status === 'loading' || !user) {
    return <AuthGateVX2 />;
  }
  
  return (
    <TabNavigationProvider>
      <HeaderProvider>
        <MobilePhoneFrame devicePreset={devicePreset}>
          <TabContentVX2 />
          <TabBarVX2 />
        </MobilePhoneFrame>
        
        {/* Modal layer */}
        <DepositModalVX2 />
        <WithdrawModalVX2 />
        {/* ... other modals */}
      </HeaderProvider>
    </TabNavigationProvider>
  );
}
```

### Legacy Draft Room Versions

**V2** (`components/draft/v2/`):
- JavaScript
- Context-based state (DraftProvider)
- ⚠️ Deprecated, migration to VX2 planned

**V3** (`components/draft/v3/`):
- JavaScript
- Fixed-layout architecture
- ⚠️ Deprecated, migration to VX2 planned

**VX** (`components/vx/`):
- TypeScript
- Mobile-focused
- ⚠️ Being superseded by VX2

**TopDog** (`pages/draft/topdog/`):
- TypeScript
- Active but legacy
- ⚠️ Migration to VX2 planned

---

## State Management Patterns

### Current State Management

**1. React Context (Modern, Preferred)**
- `AuthContext` (`components/vx2/auth/context/AuthContext.tsx`)
- `TabNavigationContext` (`components/vx2/core/context/TabNavigationContext.tsx`)
- `UserContext` (`lib/userContext.js`)

**2. Custom Hooks**
- `useDraftRoom` - Draft room state
- `useDraftPicks` - Draft picks management
- `useAuth` - Authentication state
- `useTournaments` - Tournament data

**3. SWR (Server State)**
- Global player data
- Tournament data
- User stats

**4. Redux (Legacy, Being Phased Out)**
- Limited usage in older components
- ⚠️ Not recommended for new code

### AuthContext Example

**File:** `components/vx2/auth/context/AuthContext.tsx`

```typescript
interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  user: FirebaseUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: AuthError | null;
  profileCompleteness: ProfileCompleteness;
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_STATE_CHANGED':
      return {
        ...state,
        status: action.payload.user ? 'authenticated' : 'unauthenticated',
        user: action.payload.user,
      };
    case 'PROFILE_LOADED':
      return {
        ...state,
        profile: action.payload.profile,
        isLoading: false,
      };
    // ... other cases
  }
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      dispatch({ type: 'AUTH_STATE_CHANGED', payload: { user } });
    });
    return unsubscribe;
  }, []);
  
  // Load user profile from Firestore
  useEffect(() => {
    if (state.user) {
      loadUserProfile(state.user.uid);
    }
  }, [state.user]);
  
  return (
    <AuthContext.Provider value={{ ...state, ...actions }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## Authentication & Security

### Authentication Flow

**1. Client-Side Auth** (`components/vx2/auth/`):
- Firebase Auth (email/password, phone)
- AuthContext manages state
- AuthGateVX2 blocks unauthenticated access

**2. Server-Side Auth** (`lib/apiAuth.js` / `lib/apiAuth.ts`):
- Token verification via Firebase Admin
- Middleware for protected routes

**Code Example:**
```typescript
export async function verifyAuthToken(authHeader: string | undefined) {
  if (!authHeader?.startsWith('Bearer ')) {
    return { uid: null, error: 'Missing authorization header' };
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  // Development fallback (dev mode only)
  if (process.env.NODE_ENV === 'development' && token === 'dev-token') {
    return { uid: 'dev-uid', email: 'dev@example.com' };
  }
  
  // Verify with Firebase Admin
  const adminAuth = admin.auth();
  const decodedToken = await adminAuth.verifyIdToken(token);
  
  return {
    uid: decodedToken.uid,
    email: decodedToken.email,
  };
}
```

### Admin Authentication

**File:** `lib/adminAuth.ts`

**Pattern:**
- Custom claims: `admin: true` (preferred)
- Environment variable UID list (fallback)
- Development token (dev mode only)

### Security Features

**1. CSRF Protection** (`lib/csrfProtection.js`):
- Token generation and validation
- API route protection

**2. Rate Limiting** (`lib/rateLimiter.js`):
- Per-route rate limits
- IP-based tracking

**3. Input Sanitization** (`lib/inputSanitization.js`):
- XSS prevention
- SQL injection prevention (Firestore doesn't use SQL, but good practice)

**4. Location Integrity** (`lib/integrity/LocationIntegrityService.ts`):
- Tracks user locations for draft picks
- Detects suspicious patterns
- Part of collusion detection system

---

## Payment System Architecture

### Payment Provider Abstraction

**Location:** `lib/payments/`

**Structure:**
```
lib/payments/
├── index.ts              # Main exports
├── router.ts             # Provider routing
├── types.ts              # Type definitions
└── providers/
    ├── stripe.ts         # Stripe implementation
    ├── paystack.ts       # Paystack implementation
    ├── paymongo.ts       # PayMongo implementation
    └── xendit.ts         # Xendit implementation
```

### Provider Interface

```typescript
interface PaymentProvider {
  name: string;
  supportedCountries: string[];
  supportedCurrencies: string[];
  
  createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse>;
  verifyPayment(reference: string): Promise<PaymentVerificationResult>;
  handleWebhook(event: WebhookEvent): Promise<WebhookResult>;
  getAvailableMethods(country: string): PaymentMethod[];
}
```

### Provider Selection

**File:** `lib/payments/router.ts`

```typescript
export function getProviderForUser(country: string): PaymentProvider | null {
  // Stripe: US, CA, GB, AU, etc.
  if (STRIPE_COUNTRIES.includes(country)) {
    return stripeProvider;
  }
  
  // Paystack: NG, GH, KE, ZA, etc.
  if (PAYSTACK_COUNTRIES.includes(country)) {
    return paystackProvider;
  }
  
  // PayMongo: PH
  if (country === 'PH') {
    return paymongoProvider;
  }
  
  // Xendit: ID
  if (country === 'ID') {
    return xenditProvider;
  }
  
  return null;
}
```

### Payment Flow

**1. Create Payment Intent:**
```
Client → /api/stripe/payment-intent
  ↓
Fraud detection check
  ↓
Location verification (US states only)
  ↓
Create Stripe PaymentIntent
  ↓
Return client_secret
```

**2. Client Confirmation:**
```
Client → Stripe.js confirmPayment()
  ↓
Stripe processes payment
  ↓
Webhook → /api/stripe/webhook
  ↓
Update transaction status
  ↓
Update user balance (Firestore transaction)
```

### Payment Security

**1. Fraud Detection** (`lib/fraudDetection.js`):
- Device fingerprinting
- IP address tracking
- Transaction pattern analysis
- Risk scoring

**2. Location Verification:**
- Geolocation required for deposits
- US states only (enforced)
- Location stored with transaction

**3. Webhook Security:**
- Signature verification
- Idempotency checks
- Event deduplication

---

## Draft Room System

### Draft Room Architecture

**VX2 Draft Room** (`components/vx2/draft-room/`):

**Components:**
- `DraftRoomVX2.tsx` - Main component
- `DraftNavbar` - Navigation
- `PicksBar` - Recent picks display
- `PlayerList` - Available players
- `RosterPanel` - User's roster
- `QueuePanel` - Draft queue

**Hooks:**
- `useDraftRoom` - Room state management
- `useDraftPicks` - Picks data and real-time updates
- `useDraftEngine` - Draft logic (turn calculation, etc.)

**Adapters:**
- `FirebaseAdapter` - Firestore integration
- Enables testing with mock adapters

### Draft State Management

**File:** `components/vx2/draft-room/hooks/useDraftRoom.ts`

```typescript
interface DraftRoomState {
  roomId: string;
  status: 'loading' | 'waiting' | 'active' | 'paused' | 'completed';
  participants: Participant[];
  currentPickNumber: number;
  currentPickDeadline: Timestamp | null;
  isMyTurn: boolean;
  myPosition: number;
}

export function useDraftRoom({
  roomId,
  initialStatus = 'loading',
}: UseDraftRoomOptions): UseDraftRoomResult {
  const [state, setState] = useState<DraftRoomState>({
    roomId,
    status: initialStatus,
    // ... initial state
  });
  
  // Real-time Firestore listener
  useEffect(() => {
    const roomRef = doc(db, 'draftRooms', roomId);
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      const roomData = snapshot.data() as DraftRoom;
      setState({
        ...state,
        status: roomData.status,
        currentPickNumber: roomData.currentPickNumber,
        participants: roomData.participants,
        // ... update state
      });
    });
    
    return unsubscribe;
  }, [roomId]);
  
  return { ...state, ...actions };
}
```

### Pick Submission Flow

**1. Client-Side:**
```
User selects player
  ↓
useDraftEngine.makePick(playerId)
  ↓
FirebaseAdapter.submitPick(pickData)
  ↓
POST /api/draft/submit-pick
```

**2. Server-Side:**
```
API route receives request
  ↓
Validate turn, player availability
  ↓
Firestore transaction:
  - Create pick document
  - Update room state (currentPickNumber++)
  ↓
Return success
```

**3. Real-Time Update:**
```
Firestore change triggers
  ↓
onSnapshot listener fires
  ↓
useDraftPicks hook updates
  ↓
UI re-renders with new pick
```

### Draft Types

**Fast Draft:**
- 30-second pick timer
- Real-time, synchronous
- Used for: TopDog tournaments

**Slow Draft:**
- 12-hour pick timer (43200 seconds)
- Asynchronous, queue-based
- Used for: Slow draft tournaments

---

## Testing Infrastructure

### Test Configuration

**Jest Config:**
- Risk-based coverage thresholds
- Tier 0 (Payment): 95%+
- Tier 1 (Security/Auth): 90%+
- Global baseline: 60%

**Test Structure:**
```
__tests__/
├── __mocks__/
│   ├── firebase.js
│   └── stripe.js
├── factories/
│   └── index.js
├── api/
│   ├── stripe-*.test.js
│   └── auth-*.test.js
├── lib/
│   ├── integrity/
│   │   ├── validation.test.ts
│   │   └── CollusionFlagService.test.ts
│   └── payments/
└── components/
```

### Test Patterns

**API Route Test:**
```javascript
describe('POST /api/draft/submit-pick', () => {
  describe('Success Cases', () => {
    it('should submit pick successfully', async () => {
      // Mock Firestore transaction
      // Call API
      // Assert response
    });
  });
  
  describe('Error Cases', () => {
    it('should reject pick if not user turn', async () => {
      // Test validation
    });
  });
});
```

### E2E Testing

**Cypress:**
- Configuration: `cypress/`
- Limited test coverage
- Focus on critical user flows

---

## Build & Deployment

### Build Process

**Development:**
```bash
npm run dev
# Kills port 3000, ensures manifests, starts Next.js dev server
```

**Production Build:**
```bash
npm run build
# Generates service worker, builds Next.js, merges service workers
```

**Scripts:**
- `dev`: Development server
- `build`: Production build
- `start`: Production server
- `test`: Run tests
- `lint`: ESLint check
- `type-check`: TypeScript validation

### Deployment

**Platform:** Vercel (inferred from config)

**Build Optimizations:**
- Bundle splitting (vendor, stripe, firebase chunks)
- Code splitting for draft room components
- Image optimization (AVIF, WebP)
- Service worker caching

### Service Worker

**PWA Support:**
- `next-pwa` (production only)
- Runtime caching strategies
- Cache-first for static assets
- Stale-while-revalidate for dynamic content

---

## Environment Configuration

### Required Environment Variables

**Firebase:**
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

**Stripe:**
```
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
```

**Paystack:**
```
PAYSTACK_SECRET_KEY
PAYSTACK_PUBLIC_KEY
```

**Other:**
```
SENTRY_DSN
NODE_ENV
```

### Environment Validation

**File:** `lib/firebase.js`

- Validates required vars at runtime
- Fails hard in production
- Warns in development
- Graceful fallback for optional features

---

## Known Technical Debt

### 1. Multiple Draft Room Versions

**Issue:** 5 distinct draft room implementations
- V2 (JavaScript, deprecated)
- V3 (JavaScript, deprecated)
- TopDog (TypeScript, legacy)
- VX (TypeScript, being superseded)
- VX2 (TypeScript, modern)

**Impact:**
- Code duplication
- Maintenance burden
- Inconsistent behavior
- Testing complexity

**Migration Status:**
- VX2 framework complete
- Migration in progress
- Legacy versions still active

### 2. Mixed JavaScript/TypeScript

**Issue:** Gradual TypeScript migration
- Many `.js` files remain
- Type safety incomplete
- Inconsistent patterns

**Status:**
- Strict TypeScript enabled
- New code should be TypeScript
- Legacy JS files remain

### 3. Redux Usage (Legacy)

**Issue:** Redux still used in some components
- Being phased out
- Context + hooks preferred

**Status:**
- Limited usage
- Not recommended for new code

### 4. API Route Standardization

**Issue:** 2 routes not standardized
- 71/73 routes use `withErrorHandling`
- 2 Edge Runtime routes (different pattern)

**Status:**
- 98.6% standardized
- Remaining routes documented

### 5. Test Coverage

**Issue:** Incomplete test coverage
- Risk-based thresholds defined
- Coverage measurement needed
- E2E tests limited

**Status:**
- Payment routes: High coverage
- Security routes: High coverage
- Other areas: Needs improvement

---

## Refactoring Considerations

### 1. Draft Room Consolidation

**Goal:** Single draft room implementation (VX2)

**Steps:**
1. Complete VX2 feature parity with legacy versions
2. Migrate all active drafts to VX2
3. Deprecate legacy versions
4. Remove legacy code

**Challenges:**
- Active drafts using legacy versions
- Feature parity requirements
- Real-time migration complexity

### 2. TypeScript Migration

**Goal:** 100% TypeScript

**Steps:**
1. Convert remaining `.js` files to `.ts`
2. Add type definitions
3. Enable stricter checks
4. Remove `allowJs` from tsconfig

**Challenges:**
- Large codebase
- Gradual migration needed
- Breaking changes possible

### 3. State Management Consolidation

**Goal:** Single state management pattern

**Steps:**
1. Remove Redux dependencies
2. Migrate Redux code to Context/hooks
3. Standardize on Context + hooks pattern
4. Consider Zustand for complex state (if needed)

**Challenges:**
- Redux components still in use
- State migration complexity
- Testing updates needed

### 4. API Route Standardization

**Goal:** 100% standardized routes

**Steps:**
1. Standardize remaining 2 routes
2. Document Edge Runtime pattern
3. Ensure consistent error handling

**Challenges:**
- Edge Runtime different API
- May require different pattern

### 5. Component Architecture

**Goal:** Consistent component patterns

**Steps:**
1. Standardize on VX2 patterns
2. Create component library
3. Document patterns
4. Remove duplicate components

**Challenges:**
- Multiple component systems
- Breaking changes
- Migration effort

---

## Critical Code Examples

### Example 1: API Route with Error Handling

**File:** `pages/api/draft/submit-pick.ts`

```typescript
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubmitPickResponse>
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST'], logger);
    validateBody(req, ['roomId', 'userId', 'playerId'], logger);
    
    const { roomId, userId, playerId } = req.body;
    
    logger.info('Submitting draft pick', {
      component: 'draft',
      operation: 'submit-pick',
      roomId,
      userId,
      playerId,
    });
    
    // Atomic transaction
    const result = await runTransaction(db, async (transaction) => {
      // ... transaction logic
    });
    
    const response = createSuccessResponse(result, 200, logger);
    return res.status(response.statusCode).json(response.body);
  });
}
```

### Example 2: VX2 Component with Context

**File:** `components/vx2/tabs/lobby/LobbyTabVX2.tsx`

```typescript
export function LobbyTabVX2() {
  const { activeTab } = useTabNavigation();
  const { user } = useAuth();
  const { tournaments, isLoading } = useTournaments();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div>
      {tournaments.map(tournament => (
        <TournamentCard
          key={tournament.id}
          tournament={tournament}
          userId={user?.uid}
        />
      ))}
    </div>
  );
}
```

### Example 3: Payment Provider Usage

**File:** `lib/payments/index.ts`

```typescript
import { createPayment, getProviderForUser } from '@/lib/payments';

// Determine provider based on user country
const provider = getProviderForUser(userCountry);

if (!provider) {
  throw new Error('No payment provider available');
}

// Create payment through provider
const result = await createPayment({
  amountSmallestUnit: 10000,
  currency: 'USD',
  userId: user.id,
  country: userCountry,
});
```

### Example 4: Firestore Real-Time Listener

**File:** `components/vx2/draft-room/hooks/useDraftPicks.ts`

```typescript
export function useDraftPicks({
  roomId,
  currentPickNumber,
}: UseDraftPicksOptions) {
  const [picks, setPicks] = useState<Pick[]>([]);
  
  useEffect(() => {
    const picksRef = collection(db, 'draftRooms', roomId, 'picks');
    const q = query(
      picksRef,
      where('pickNumber', '<=', currentPickNumber),
      orderBy('pickNumber', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPicks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Pick[];
      
      setPicks(newPicks);
    });
    
    return unsubscribe;
  }, [roomId, currentPickNumber]);
  
  return { picks };
}
```

---

## File Path Reference

### Critical Files for Refactoring

**API Routes:**
- `pages/api/draft/submit-pick.ts` - Draft pick submission
- `pages/api/stripe/webhook.ts` - Stripe webhook handler
- `pages/api/auth/signup.js` - User registration

**Components:**
- `components/vx2/shell/AppShellVX2.tsx` - Main app shell
- `components/vx2/auth/context/AuthContext.tsx` - Auth state
- `components/vx2/draft-room/components/DraftRoomVX2.tsx` - Draft room

**Libraries:**
- `lib/apiErrorHandler.ts` - Error handling wrapper
- `lib/payments/router.ts` - Payment provider routing
- `lib/firebase.js` - Firebase client initialization
- `lib/firebase-utils.ts` - Firebase admin utilities

**Configuration:**
- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `firestore.rules` - Firestore security rules
- `package.json` - Dependencies

**Documentation:**
- `docs/SYSTEM_ARCHITECTURE_OVERVIEW.md` - Architecture overview
- `docs/FIRESTORE_SCHEMA.md` - Database schema
- `API_STANDARDIZATION_MASTER.md` - API standardization status

---

## Conclusion

This codebase represents a mature fantasy football platform with:
- **Strong foundation:** Enterprise-grade error handling, logging, security
- **Modern architecture:** VX2 framework with TypeScript, React hooks
- **Payment flexibility:** Multi-provider abstraction
- **Real-time capabilities:** Firestore real-time listeners
- **Technical debt:** Multiple draft room versions, gradual TypeScript migration

**Key Refactoring Priorities:**
1. Consolidate draft room versions to VX2
2. Complete TypeScript migration
3. Remove Redux, standardize on Context/hooks
4. Improve test coverage
5. Standardize component patterns

**Recommended Approach:**
- Incremental refactoring
- Maintain backward compatibility during migration
- Comprehensive testing before removing legacy code
- Document all breaking changes

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Maintained By:** Development Team
