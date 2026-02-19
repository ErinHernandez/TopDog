# Enterprise User Signup System Plan

**Version:** 1.0  
**Created:** January 1, 2026  
**Status:** PLANNING - DO NOT BUILD

---

## Executive Summary

This document outlines an enterprise-grade username creation and user signup system for the TopDog platform. The system is designed to support a global user base of 570,000+ teams across 47,000 drafts, with particular consideration for users in emerging markets (LATAM, Africa, Southeast Asia, Eastern Europe) where infrastructure constraints exist.

### Key Design Principles

1. **Mobile-First, Low-Bandwidth Tolerant** - Works on 3G connections and older devices
2. **Global by Default** - No US-centric assumptions; supports 25+ countries from day one
3. **Minimal Friction** - Reduce signup abandonment; progressive profile completion
4. **Security Without Complexity** - Fraud prevention that doesn't burden legitimate users
5. **VX2 Architecture Compliance** - TypeScript, hooks-based, constants-driven

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Global Constraints & Considerations](#2-global-constraints--considerations)
3. [System Architecture](#3-system-architecture)
4. [Username System Design](#4-username-system-design)
5. [Authentication Strategy](#5-authentication-strategy)
6. [Profile Management](#6-profile-management)
7. [Security & Fraud Prevention](#7-security--fraud-prevention)
8. [Data Schema](#8-data-schema)
9. [API Design](#9-api-design)
10. [VX2 Component Architecture](#10-vx2-component-architecture)
11. [Implementation Phases](#11-implementation-phases)
12. [Testing Strategy](#12-testing-strategy)
13. [Monitoring & Analytics](#13-monitoring--analytics)
14. [Risk Assessment](#14-risk-assessment)

---

## 1. Current State Analysis

### What Exists Today

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Username Validation | `lib/usernameValidation.js` | Basic | 3-18 chars, locale support |
| Locale Characters | `lib/localeCharacters.js` | Good | 25 countries, extensible |
| User Registration Service | `lib/userRegistration.js` | Basic | Firestore CRUD |
| Registration Modal | `components/RegistrationModal.js` | Basic | Functional but not VX2 |
| Auth Modal | `components/AuthModal.js` | Stub | Mock auth only |
| VX2 useUser Hook | `components/vx2/hooks/data/useUser.ts` | Mock | TypeScript, proper patterns |
| Firestore Rules | `firestore.rules.production` | Basic | Needs expansion |

### Gaps Identified

1. **No Real Authentication** - Currently using mock/anonymous auth
2. **No VX2 Signup Components** - Registration modal is legacy JS, not TypeScript
3. **No Account Security** - No 2FA, no session management, no device tracking
4. **No Progressive Profiling** - All-or-nothing signup flow
5. **No Offline Support** - Fails silently on poor connections
6. **No Username Change Flow** - Can't update username after creation
7. **No Account Recovery** - No password reset, no account merge
8. **No Fraud Detection Integration** - Signup not connected to fraud system
9. **No Rate Limiting** - Vulnerable to enumeration attacks
10. **No Internationalization** - Error messages English-only

---

## 2. Global Constraints & Considerations

### Infrastructure Realities by Region

| Region | Internet Quality | Device Age | Payment Infrastructure | ID Systems |
|--------|-----------------|------------|----------------------|------------|
| **North America** | Excellent | Modern | Full | Robust |
| **Western Europe** | Excellent | Modern | Full | Robust |
| **Eastern Europe** | Good-Variable | Mixed | Good | Variable |
| **LATAM** | Variable | 50%+ 4yr old | Good (Pix, MercadoPago) | Variable |
| **Southeast Asia** | Variable | Mixed | Good (GrabPay, GCash) | Variable |
| **Africa** | Poor-Variable | Often older | Mobile Money dominant | Limited |
| **Middle East** | Good | Modern | Variable | Good |

### Design Implications

#### 2.1 Network Resilience

```
Problem: Users in Brazil, Nigeria, Philippines experience:
- 3G/2G connections
- High latency (200-500ms)
- Frequent disconnections
- Expensive data plans

Solutions:
- Aggressive request batching
- Optimistic UI updates
- Offline-first validation
- Small payload sizes (<50KB for signup)
- Retry logic with exponential backoff
- Progress persistence (don't lose work on disconnect)
```

#### 2.2 Device Constraints

```
Problem: 50%+ of LATAM/Africa users on 4+ year old devices
- iPhone 7/8 era
- Android 8-10
- Limited RAM (2-3GB)
- Slower CPUs

Solutions:
- No heavy animations during signup
- Lazy load non-critical components
- Minimize JavaScript bundle for auth
- Test on iPhone 8 as baseline
- Use CSS over JS for transitions
```

#### 2.3 Phone Number as Identity

```
Reality: In many developing nations, phone numbers are MORE reliable than email
- SIM registration laws require ID in most African/Asian countries
- Phone numbers are verified identity proxies
- Users more likely to have phone than email
- WhatsApp ubiquity means phone is primary contact

Implication:
- Phone number should be PRIMARY identifier option
- Email optional, not required
- SMS OTP widely supported
- WhatsApp integration consideration for future
```

#### 2.4 Name & Character Constraints

```
APPROVED LOCATIONS: 49 countries (Updated January 2026)
See lib/localeCharacters.js for full list

Additional Considerations:
- Some cultures use single names (Indonesia)
- Name order varies (family name first in Asia)
- Transliteration expectations (Cyrillic users may prefer Latin)
- Username vs Display Name distinction critical

APPROVED COUNTRIES BY REGION:

North America (4):
- US, CA, MX, PR

Caribbean (9):
- AW (Aruba), BM (Bermuda), CW (Curacao), DO (Dominican Republic)
- GD (Grenada), HT (Haiti), JM (Jamaica), MQ (Martinique), TT (Trinidad)

Central America (7):
- BZ (Belize), CR (Costa Rica), SV (El Salvador), GT (Guatemala)
- HN (Honduras), NI (Nicaragua), PA (Panama)

South America (8):
- BO (Bolivia), CL (Chile), CO (Colombia), GY (Guyana)
- PE (Peru), SR (Suriname), UY (Uruguay), VE (Venezuela)

Western Europe (6):
- AT (Austria), DE (Germany), FR (France), IE (Ireland)
- LU (Luxembourg), PT (Portugal)

Northern Europe (5):
- DK (Denmark), FI (Finland), IS (Iceland), NO (Norway), SE (Sweden)

Southern Europe (3):
- CY (Cyprus), ES (Spain), GR (Greece)

Eastern Europe (11):
- BG (Bulgaria), CZ (Czech Republic), EE (Estonia), HR (Croatia)
- HU (Hungary), LT (Lithuania), LV (Latvia), PL (Poland)
- RO (Romania), SI (Slovenia), SK (Slovakia)

Asia (5):
- ID (Indonesia), MY (Malaysia), MM (Myanmar), MN (Mongolia), SG (Singapore)

Oceania (2):
- AU (Australia), NZ (New Zealand)
```

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │   VX2        │  │   VX2        │  │   VX2        │                   │
│  │   Signup     │  │   Login      │  │   Profile    │                   │
│  │   Flow       │  │   Flow       │  │   Manager    │                   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                   │
│         │                 │                 │                            │
│  ┌──────▼─────────────────▼─────────────────▼──────┐                    │
│  │              useAuth Hook (VX2)                  │                    │
│  │  - Authentication state                          │                    │
│  │  - Session management                            │                    │
│  │  - Token refresh                                 │                    │
│  └──────────────────────┬──────────────────────────┘                    │
│                         │                                                │
└─────────────────────────┼────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────────────────────┐
│                    SERVICE LAYER                                         │
├─────────────────────────┼────────────────────────────────────────────────┤
│                         ▼                                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    AuthService (lib/auth/)                       │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │  - signUpWithEmail()      - signUpWithPhone()                   │    │
│  │  - signInWithEmail()      - signInWithPhone()                   │    │
│  │  - signInWithGoogle()     - signInWithApple()                   │    │
│  │  - signOut()              - refreshSession()                    │    │
│  │  - sendPasswordReset()    - verifyPhoneOTP()                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                         │                                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                  UserService (lib/user/)                         │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │  - createProfile()        - updateProfile()                     │    │
│  │  - checkUsernameAvailable() - reserveUsername()                 │    │
│  │  - changeUsername()       - getProfile()                        │    │
│  │  - deactivateAccount()    - exportUserData()                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                         │                                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │               SecurityService (lib/security/)                    │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │  - checkSignupRisk()      - trackDevice()                       │    │
│  │  - detectProxyVPN()       - rateLimit()                         │    │
│  │  - checkIPReputation()    - logSecurityEvent()                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────────────────────┐
│                    DATA LAYER                                            │
├─────────────────────────┼────────────────────────────────────────────────┤
│                         ▼                                                │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     Firebase Auth                                  │  │
│  │  - Email/Password    - Phone/SMS    - Google    - Apple           │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                         │                                                │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     Firestore                                      │  │
│  │  /users/{uid}           - User profiles                           │  │
│  │  /usernames/{username}  - Username reservations (uniqueness)      │  │
│  │  /sessions/{sessionId}  - Active sessions                         │  │
│  │  /security_events/      - Audit log                               │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Authentication Flow Options

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      SUPPORTED AUTH METHODS                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  TIER 1 - Primary (Launch)                                              │
│  ─────────────────────────                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │
│  │   Email +   │  │   Phone +   │  │   Google    │                      │
│  │  Password   │  │    OTP      │  │   OAuth     │                      │
│  └─────────────┘  └─────────────┘  └─────────────┘                      │
│       Global         Global          Global                              │
│                      (Primary for    (Popular in                         │
│                       emerging        Western                            │
│                       markets)        markets)                           │
│                                                                          │
│  TIER 2 - Secondary (Phase 2)                                           │
│  ────────────────────────────                                           │
│  ┌─────────────┐  ┌─────────────┐                                       │
│  │   Apple     │  │  Magic Link │                                       │
│  │   Sign In   │  │   (Email)   │                                       │
│  └─────────────┘  └─────────────┘                                       │
│      iOS users       Low-friction                                        │
│      required        passwordless                                        │
│                                                                          │
│  TIER 3 - Future Consideration                                          │
│  ─────────────────────────────                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │
│  │  WhatsApp   │  │   Passkeys  │  │  Telegram   │                      │
│  │   Login     │  │   (WebAuthn)│  │    Login    │                      │
│  └─────────────┘  └─────────────┘  └─────────────┘                      │
│    LATAM/Africa      Future-proof     Eastern Europe                     │
│    high adoption     biometric        high adoption                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Username System Design

### 4.1 Username Rules

| Rule | Value | Rationale |
|------|-------|-----------|
| **Min Length** | 3 characters | Prevent meaningless names |
| **Max Length** | 18 characters | Fit in UI, prevent abuse |
| **Case** | Stored UPPERCASE, display flexible | Consistency, prevents "John" vs "john" |
| **Characters** | a-z, A-Z, 0-9 + locale-specific | Global support |
| **No Spaces** | Enforced | Technical simplicity |
| **No Special Chars** | No @#$%^&*()! etc. | Prevent confusion, injection |
| **Reserved Words** | Blocked list | Prevent impersonation |
| **Uniqueness** | Global unique | Cross-draft identification |

### 4.2 Reserved Username List

```typescript
const RESERVED_USERNAMES = [
  // Platform terms
  'admin', 'administrator', 'mod', 'moderator', 'support', 'help',
  'topdog', 'topdogdog', 'official', 'staff', 'team', 'system',
  
  // Generic terms
  'user', 'guest', 'anonymous', 'unknown', 'deleted', 'banned',
  'test', 'demo', 'example', 'sample',
  
  // Competitors (prevent confusion)
  'underdog', 'draftkings', 'fanduel', 'sleeper', 'yahoo',
  
  // Offensive patterns (expand as needed)
  'admin*', 'mod_*', '*support*', '*official*',
  
  // Technical
  'null', 'undefined', 'void', 'root', 'api', 'www',
];
```

### 4.2.1 VIP Username Reservations

The system supports reserving usernames for VIPs, influencers, streamers, and partners. These reservations are separate from system reserved names and can be claimed by the intended VIP.

#### VIP Reservation Functions (in `lib/usernameValidation.js`)

```typescript
import {
  // Reserve a username for a VIP
  reserveUsernameForVIP,
  
  // Reserve multiple usernames at once
  bulkReserveUsernamesForVIP,
  
  // Remove a reservation (if unclaimed)
  removeVIPReservation,
  
  // Check if a username is VIP reserved
  checkVIPReservation,
  
  // VIP claims their reserved username during registration
  claimVIPUsername,
  
  // Get all reservations (with optional filters)
  getAllVIPReservations,
  
  // Get reservation statistics
  getVIPReservationStats,
  
  // Clean up expired unclaimed reservations
  cleanupExpiredVIPReservations,
  
  // Export/import for backup
  exportVIPReservations,
  importVIPReservations,
} from './lib/usernameValidation';
```

#### Reserve a Username for a VIP

```javascript
// Reserve a single username
const result = reserveUsernameForVIP({
  username: 'MAHOMES',
  reservedFor: 'Patrick Mahomes - NFL QB',
  reservedBy: 'admin@topdog.dog',
  notes: 'Official account for Patrick Mahomes',
  expiresAt: null, // Never expires (or set a Date)
});

if (result.success) {
  console.log('Reserved:', result.reservation);
} else {
  console.error('Failed:', result.error);
}
```

#### Bulk Reserve Usernames

```javascript
// Reserve multiple usernames for influencers
const results = bulkReserveUsernamesForVIP([
  { username: 'JJZACHARIASON', reservedFor: 'JJ Zachariason - Late Round Podcast' },
  { username: 'ESTABLISH', reservedFor: 'Establish The Run' },
  { username: 'ROTOUNDERWORLD', reservedFor: 'Roto Underworld' },
  { username: 'FANTASYLIFE', reservedFor: 'Fantasy Life App' },
  { username: 'THEFANTASYFOOTBALLERS', reservedFor: 'Fantasy Footballers Podcast' },
], 'admin@topdog.dog');

console.log(`Reserved: ${results.success}, Failed: ${results.failed.length}`);
```

#### VIP Claim Flow

```javascript
// 1. VIP visits signup page with reserved username
// 2. System detects VIP reservation
const check = checkVIPReservation('MAHOMES');

if (check.isReserved && !check.reservation.claimed) {
  // Show special VIP claim UI
  console.log(`Reserved for: ${check.reservation.reservedFor}`);
}

// 3. After VIP completes registration, claim the username
const claimResult = claimVIPUsername('MAHOMES', firebaseUser.uid);

if (claimResult.success) {
  // Username is now claimed and linked to this user
}
```

#### VIP Reservation Data Structure

```typescript
interface VIPReservation {
  username: string;        // 'MAHOMES'
  reservedFor: string;     // 'Patrick Mahomes - NFL QB'
  reservedBy: string;      // 'admin@topdog.dog'
  reservedAt: Date;        // When reserved
  expiresAt: Date | null;  // When reservation expires (null = never)
  notes: string;           // Additional notes
  claimed: boolean;        // Has VIP claimed it?
  claimedByUid: string | null;  // UID of claiming user
  claimedAt: Date | null;  // When claimed
}
```

#### Admin Dashboard Functions

```javascript
// Get all unclaimed reservations
const unclaimed = getAllVIPReservations({ unclaimedOnly: true });

// Get statistics
const stats = getVIPReservationStats();
// { total: 50, claimed: 12, unclaimed: 38, expired: 3 }

// Clean up expired reservations
const cleanup = cleanupExpiredVIPReservations();
// { removed: 3, usernames: ['OLDVIP1', 'OLDVIP2', 'OLDVIP3'] }

// Export for backup
const backup = exportVIPReservations();
fs.writeFileSync('vip-backup.json', backup);

// Import from backup
const imported = importVIPReservations(fs.readFileSync('vip-backup.json'));
```

#### Integration with Validation

The VIP reservation system is automatically integrated:

```javascript
// Regular user tries to register with VIP username
const validation = validateUsername('MAHOMES', 'US');
// { isValid: false, errors: ['This username is reserved'], isVIPReserved: true }

// VIP registers (admin bypasses VIP check)
const validation = validateUsername('MAHOMES', 'US', { skipVIPCheck: true });
// { isValid: true, errors: [] }

// Check availability
const availability = await checkUsernameAvailability('MAHOMES');
// { isAvailable: false, message: 'This username is reserved', isVIPReserved: true }

// VIP checking their reserved username (with claim UID)
const availability = await checkUsernameAvailability('MAHOMES', { 
  vipClaimUid: 'firebase-uid-123' 
});
// { isAvailable: true, message: 'Username is reserved for you', isVIPReserved: true }
```

### 4.2.2 VIP Account Merge System

For VIPs who signed up without knowing they had a reserved username, admins can merge their existing account with the reserved username.

#### VIP Account Manager (in `lib/vipAccountManager.js`)

```typescript
import { VIPAccountManager } from './lib/vipAccountManager';
```

#### Finding Potential VIP Matches

```javascript
// Find users who might be a specific VIP
const matches = await VIPAccountManager.findPotentialVIPMatches('MAHOMES', {
  email: 'patrick@chiefs.com',
  displayNameContains: 'Patrick',
  usernameContains: 'MAHOMES'
});

// Result:
// {
//   success: true,
//   matches: [
//     { uid: 'abc123', username: 'PATRICKMAHOMES15', matchReason: 'username_partial_match' },
//     { uid: 'def456', username: 'PMAHOMES', matchReason: 'display_name_match' }
//   ],
//   reservation: { reservedFor: 'Patrick Mahomes - NFL QB', ... }
// }

// Get all unclaimed VIPs with potential matches (for admin dashboard)
const unclaimedReport = await VIPAccountManager.getUnclaimedVIPsWithMatches();
// {
//   success: true,
//   results: [
//     { reservation: {...}, potentialMatches: [...], matchCount: 2 },
//     { reservation: {...}, potentialMatches: [], matchCount: 0 }
//   ],
//   totalUnclaimed: 38,
//   withMatches: 12
// }
```

#### Merge Request Workflow

```javascript
// 1. Create a merge request (pending admin approval)
const request = await VIPAccountManager.createMergeRequest({
  uid: 'abc123',                      // User's Firebase UID
  reservedUsername: 'MAHOMES',        // The VIP username
  requestedBy: 'admin@topdog.dog',    // Admin making request
  notes: 'Verified via Twitter DM',
  requireUserAcceptance: true         // User must accept the change
});

// 2. (Optional) Another admin approves
await VIPAccountManager.approveMergeRequest(request.mergeRequest.id, 'senior-admin@topdog.dog');

// 3. User accepts the change (if requireUserAcceptance is true)
await VIPAccountManager.userAcceptsMerge(request.mergeRequest.id, 'abc123');

// 4. Execute the merge
const result = await VIPAccountManager.executeMerge(request.mergeRequest.id, 'admin@topdog.dog');

// Result:
// {
//   success: true,
//   audit: {
//     oldUsername: 'PATRICKMAHOMES15',
//     newUsername: 'MAHOMES',
//     changeType: 'vip_merge',
//     changedBy: 'admin@topdog.dog'
//   }
// }
```

#### Quick Merge (Bypass Approval Workflow)

```javascript
// For trusted admins - create and execute in one step
const result = await VIPAccountManager.quickMerge({
  uid: 'abc123',
  reservedUsername: 'MAHOMES',
  adminId: 'trusted-admin@topdog.dog',
  notes: 'Verified identity via video call'
});
```

#### User-Facing Flow

```javascript
// Check if user has a pending merge offer
const pending = await VIPAccountManager.getPendingMergeForUser(currentUser.uid);

if (pending.hasPending) {
  // Show UI: "Your reserved VIP username MAHOMES is available. Accept?"
  const { mergeRequest } = pending;
  
  // User accepts
  await VIPAccountManager.userAcceptsMerge(mergeRequest.id, currentUser.uid);
  
  // Or user declines
  await VIPAccountManager.userDeclinesMerge(mergeRequest.id, currentUser.uid, 'I prefer my current username');
}
```

#### Audit Trail

```javascript
// Get username change history for a user
const history = await VIPAccountManager.getUsernameChangeHistory('abc123');
// {
//   history: [
//     { oldUsername: 'PATRICKMAHOMES15', newUsername: 'MAHOMES', changeType: 'vip_merge', ... }
//   ],
//   totalChanges: 1
// }

// Get all VIP merges (admin audit)
const allMerges = await VIPAccountManager.getAllUsernameChanges({ changeType: 'vip_merge' });
```

#### Statistics

```javascript
const stats = await VIPAccountManager.getMergeStatistics();
// {
//   total: 50,
//   pending: 5,
//   approved: 3,
//   completed: 38,
//   rejected: 2,
//   cancelled: 2,
//   awaitingUserAcceptance: 3
// }
```

#### Firestore Collections Created

```
/merge_requests/{mergeRequestId}
├── id: string
├── uid: string
├── currentUsername: string
├── reservedUsername: string
├── reservedFor: string
├── status: 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled'
├── requestedBy: string
├── requestedAt: Timestamp
├── approvedBy: string | null
├── approvedAt: Timestamp | null
├── completedAt: Timestamp | null
├── requireUserAcceptance: boolean
├── userAccepted: boolean
├── userNotified: boolean
└── notes: string

/username_change_audit/{auditId}
├── id: string
├── uid: string
├── oldUsername: string
├── newUsername: string
├── changeType: 'vip_merge' | 'user_request' | 'admin_override'
├── changedBy: string
├── changedAt: Timestamp
├── reason: string
└── metadata: object
```

#### Merge Request Status Flow

```
                    ┌─────────────────┐
                    │    PENDING      │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │  APPROVED   │   │  REJECTED   │   │  CANCELLED  │
    └──────┬──────┘   └─────────────┘   └─────────────┘
           │                                   ▲
           │                                   │
           │ (execute)              (user declines)
           │                                   │
           ▼                                   │
    ┌─────────────┐                           │
    │  COMPLETED  │◄──────────────────────────┘
    └─────────────┘     (if userAccepted)
```

### 4.3 Username Validation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     USERNAME VALIDATION PIPELINE                         │
└─────────────────────────────────────────────────────────────────────────┘

User Input: "João123"
     │
     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Sanitization (Client-Side)                                      │
│ ─────────────────────────────────                                       │
│ • Trim whitespace                                                        │
│ • Convert to uppercase for storage                                       │
│ • Remove zero-width characters                                           │
│                                                                          │
│ Result: "JOÃO123"                                                        │
└─────────────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Length Validation (Client-Side)                                 │
│ ───────────────────────────────────────                                 │
│ • Check >= 3 characters                                                  │
│ • Check <= 18 characters                                                 │
│                                                                          │
│ Result: PASS (7 characters)                                              │
└─────────────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Character Validation (Client-Side)                              │
│ ──────────────────────────────────────────                              │
│ • Get allowed characters for user's country (BR)                         │
│ • Check each character against allowed set                               │
│ • Allowed: a-z, A-Z, 0-9, ã, õ, á, é, í, ó, ú, â, ê, ô, ç               │
│                                                                          │
│ Result: PASS (all characters allowed for Brazil)                         │
└─────────────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Reserved Word Check (Client-Side)                               │
│ ─────────────────────────────────────────                               │
│ • Check against reserved username list                                   │
│ • Check against offensive word patterns                                  │
│                                                                          │
│ Result: PASS (not reserved)                                              │
└─────────────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Availability Check (Server-Side, Debounced 500ms)               │
│ ─────────────────────────────────────────────────────────               │
│ • Query /usernames/{username} collection                                 │
│ • Rate limited: 10 checks per minute per IP                              │
│                                                                          │
│ Result: AVAILABLE or TAKEN                                               │
└─────────────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 6: Similarity Check (Server-Side, Optional)                        │
│ ────────────────────────────────────────────────                        │
│ • Check for lookalike usernames (l vs 1, O vs 0)                         │
│ • Warn if similar to existing username                                   │
│ • Don't block, just warn                                                 │
│                                                                          │
│ Result: WARNING if similar exists, else PASS                             │
└─────────────────────────────────────────────────────────────────────────┘
     │
     ▼
  ✓ VALID - Ready for reservation
```

### 4.4 Username Reservation System

To prevent race conditions where two users claim the same username simultaneously:

```typescript
// Atomic username reservation using Firestore transaction
async function reserveUsername(username: string, uid: string): Promise<boolean> {
  const normalizedUsername = username.toUpperCase();
  const usernameRef = doc(db, 'usernames', normalizedUsername);
  const userRef = doc(db, 'users', uid);
  
  try {
    await runTransaction(db, async (transaction) => {
      const usernameDoc = await transaction.get(usernameRef);
      
      if (usernameDoc.exists()) {
        throw new Error('USERNAME_TAKEN');
      }
      
      // Reserve username
      transaction.set(usernameRef, {
        uid: uid,
        reservedAt: serverTimestamp(),
        username: normalizedUsername,
      });
      
      // Update user profile
      transaction.update(userRef, {
        username: normalizedUsername,
        usernameSetAt: serverTimestamp(),
      });
    });
    
    return true;
  } catch (error) {
    if (error.message === 'USERNAME_TAKEN') {
      return false;
    }
    throw error;
  }
}
```

### 4.5 Username Change Policy

| Scenario | Allowed | Cost/Limit |
|----------|---------|------------|
| First username set | Yes | Free |
| Username change (first) | Yes | Free, once per 90 days |
| Username change (subsequent) | Yes | 90-day cooldown |
| Username change (whale users) | Yes | 30-day cooldown |
| Forced change (inappropriate) | Yes | Admin-initiated |

---

## 5. Authentication Strategy

### 5.1 Primary Auth Method Selection by Region

| Region | Recommended Primary | Secondary | Notes |
|--------|-------------------|-----------|-------|
| **US/Canada** | Google OAuth | Email/Password | High Google adoption |
| **Western Europe** | Email/Password | Google OAuth | GDPR considerations |
| **Eastern Europe** | Email/Password | Phone OTP | Email more common |
| **LATAM** | Phone OTP | Email/Password | Phone more reliable |
| **Southeast Asia** | Phone OTP | Google OAuth | High mobile usage |
| **Africa** | Phone OTP | Email/Password | SIM registration = ID |
| **Middle East** | Phone OTP | Email/Password | Phone primary |

### 5.2 Phone OTP Implementation

```typescript
interface PhoneAuthConfig {
  // Provider: Firebase Auth with SMS
  provider: 'firebase';
  
  // Rate limits
  otpRequestsPerPhone: 5;      // Per hour
  otpRequestsPerIP: 20;        // Per hour
  otpValiditySeconds: 300;     // 5 minutes
  
  // OTP format
  otpLength: 6;
  otpType: 'numeric';
  
  // Retry policy
  maxVerificationAttempts: 3;
  lockoutDurationMinutes: 30;
  
  // Cost considerations
  smsProviderPrimary: 'twilio';
  smsProviderFallback: 'firebase';
  
  // Countries with special handling
  countryOverrides: {
    'NG': { provider: 'africatalking' },  // Nigeria - local provider cheaper
    'KE': { provider: 'africatalking' },  // Kenya
    'IN': { provider: 'msg91' },          // India - local provider required
  };
}
```

### 5.3 Session Management

```typescript
interface SessionConfig {
  // Token configuration
  accessTokenExpiryMinutes: 60;
  refreshTokenExpiryDays: 30;
  
  // Session limits
  maxConcurrentSessions: 5;      // Per user
  sessionInactivityDays: 7;      // Auto-logout after
  
  // Device tracking
  trackDeviceFingerprint: true;
  requireReauthForNewDevice: false;  // Don't block, just track
  
  // Security events that invalidate sessions
  invalidateOnPasswordChange: true;
  invalidateOnEmailChange: true;
  invalidateOnSuspiciousActivity: true;
}
```

### 5.4 Auth Flow State Machine

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AUTH STATE MACHINE                                │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌───────────┐
                              │UNAUTHENTI-│
                              │   CATED   │
                              └─────┬─────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
       ┌────────────┐       ┌────────────┐       ┌────────────┐
       │  Sign Up   │       │  Sign In   │       │   OAuth    │
       │   Flow     │       │   Flow     │       │   Flow     │
       └─────┬──────┘       └─────┬──────┘       └─────┬──────┘
             │                    │                    │
             ▼                    │                    │
       ┌────────────┐             │                    │
       │  Username  │             │                    │
       │  Creation  │             │                    │
       └─────┬──────┘             │                    │
             │                    │                    │
             └─────────────┬──────┴────────────────────┘
                           │
                           ▼
                    ┌────────────┐
                    │AUTHENTICATED│
                    │  (Active)   │
                    └─────┬──────┘
                          │
           ┌──────────────┼──────────────┐
           │              │              │
           ▼              ▼              ▼
    ┌────────────┐ ┌────────────┐ ┌────────────┐
    │  Session   │ │  Token     │ │  Sign Out  │
    │  Timeout   │ │  Expired   │ │            │
    └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
          │              │              │
          └──────────────┴──────────────┘
                         │
                         ▼
                  ┌────────────┐
                  │UNAUTHENTI- │
                  │   CATED    │
                  └────────────┘
```

---

## 6. Profile Management

### 6.1 Profile Completion Tiers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PROGRESSIVE PROFILE COMPLETION                      │
└─────────────────────────────────────────────────────────────────────────┘

TIER 0: Anonymous (Pre-Signup)
────────────────────────────
• Can browse tournaments
• Can view public draft boards
• Cannot enter tournaments
• Cannot participate in drafts

TIER 1: Basic Account (Minimum to Play)
───────────────────────────────────────
Required:
• Authentication method (email OR phone OR OAuth)
• Username (validated, unique)
• Country selection

Unlocks:
• Enter free tournaments
• Participate in drafts
• View own teams/exposure

TIER 2: Verified Account (Required for Paid)
────────────────────────────────────────────
Required:
• Tier 1 complete
• Email verified OR phone verified (at least one)

Unlocks:
• Enter paid tournaments
• Deposit funds
• Withdraw funds (with additional checks)

TIER 3: Complete Profile (Optional)
───────────────────────────────────
Optional but encouraged:
• Display name (different from username)
• Avatar/profile picture
• Timezone preference
• Notification preferences
• Draft preferences (autodraft limits, queue defaults)

Unlocks:
• Profile customization
• Enhanced features
• Potential future perks
```

### 6.2 Profile Data Structure

```typescript
interface UserProfile {
  // === CORE IDENTITY (Set at signup) ===
  uid: string;                      // Firebase UID
  username: string;                 // Unique, uppercase
  usernameHistory: UsernameChange[]; // Track changes
  
  // === AUTHENTICATION ===
  authMethods: {
    email: string | null;
    emailVerified: boolean;
    emailVerifiedAt: Timestamp | null;
    
    phone: string | null;           // E.164 format: +1234567890
    phoneVerified: boolean;
    phoneVerifiedAt: Timestamp | null;
    
    googleLinked: boolean;
    appleLinked: boolean;
  };
  
  // === LOCATION ===
  countryCode: string;              // ISO 3166-1 alpha-2
  timezone: string | null;          // IANA timezone
  locale: string;                   // e.g., 'en-US', 'pt-BR'
  
  // === DISPLAY ===
  displayName: string | null;       // Optional, can differ from username
  avatarUrl: string | null;
  
  // === ACCOUNT STATUS ===
  accountTier: 'basic' | 'verified' | 'complete';
  isActive: boolean;
  isSuspended: boolean;
  suspensionReason: string | null;
  
  // === PREFERENCES ===
  preferences: UserPreferences;
  
  // === STATISTICS ===
  stats: UserStats;
  
  // === TIMESTAMPS ===
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
  lastActiveAt: Timestamp;
  
  // === SECURITY ===
  security: UserSecurity;
}

interface UserPreferences {
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
    draftReminders: boolean;
    tournamentUpdates: boolean;
    promotions: boolean;
  };
  
  draft: {
    autodraftEnabled: boolean;
    autodraftLimits: AutodraftLimits | null;
    defaultQueueEnabled: boolean;
  };
  
  display: {
    borderColor: string;            // Profile customization
    theme: 'dark' | 'light' | 'system';
  };
  
  privacy: {
    publicProfile: boolean;
    showInLeaderboards: boolean;
  };
}

interface UserStats {
  tournamentsEntered: number;
  tournamentsWon: number;
  totalWinnings: number;            // Cents
  draftsCompleted: number;
  averageFinish: number | null;
  bestFinish: {
    tournamentId: string;
    tournamentName: string;
    rank: number;
    payout: number;
    date: Timestamp;
  } | null;
}

interface UserSecurity {
  deviceHistory: DeviceRecord[];
  loginHistory: LoginRecord[];
  securityEvents: SecurityEvent[];
  
  // Rate limiting
  failedLoginAttempts: number;
  lockedUntil: Timestamp | null;
  
  // 2FA (future)
  twoFactorEnabled: boolean;
  twoFactorMethod: 'sms' | 'totp' | null;
}
```

---

## 7. Security & Fraud Prevention

### 7.1 Signup-Specific Threats

| Threat | Risk Level | Mitigation |
|--------|------------|------------|
| **Mass Account Creation** | HIGH | Rate limiting, CAPTCHA on threshold |
| **Username Squatting** | MEDIUM | Reserved words, monitoring |
| **Bot Registrations** | HIGH | Behavioral analysis, device fingerprinting |
| **Account Enumeration** | MEDIUM | Consistent response times, no user existence leak |
| **Credential Stuffing** | HIGH | Rate limiting, breach database checks |
| **Fake Referrals** | MEDIUM | Device fingerprinting, IP tracking |
| **Multi-Accounting** | HIGH | Device tracking, behavioral analysis |

### 7.2 Rate Limiting Configuration

```typescript
const SIGNUP_RATE_LIMITS = {
  // Username availability checks
  usernameCheck: {
    perIP: { limit: 30, window: '1m' },
    perDevice: { limit: 60, window: '1m' },
    burst: 10,
  },
  
  // OTP requests
  otpRequest: {
    perPhone: { limit: 5, window: '1h' },
    perIP: { limit: 20, window: '1h' },
    perDevice: { limit: 10, window: '1h' },
  },
  
  // Account creation
  accountCreation: {
    perIP: { limit: 3, window: '1h' },
    perDevice: { limit: 2, window: '24h' },
    perPhone: { limit: 1, window: '24h' },  // One account per phone
    perEmail: { limit: 1, window: 'forever' }, // One account per email
  },
  
  // Login attempts
  loginAttempt: {
    perAccount: { limit: 5, window: '15m' },
    perIP: { limit: 20, window: '15m' },
    lockoutDuration: '30m',
  },
};
```

### 7.3 Device Fingerprinting

```typescript
interface DeviceFingerprint {
  // Browser/App info
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
  
  // Screen info
  screenResolution: string;
  colorDepth: number;
  
  // Canvas fingerprint (hashed)
  canvasHash: string;
  
  // WebGL info (hashed)
  webglHash: string;
  
  // Audio fingerprint (hashed)
  audioHash: string;
  
  // Fonts available (hashed)
  fontsHash: string;
  
  // Combined unique ID
  fingerprintId: string;
  
  // Confidence score
  confidence: number;  // 0-100
}
```

### 7.4 Multi-Account Detection

```typescript
interface MultiAccountSignals {
  // Strong signals (likely same user)
  sameDeviceFingerprint: boolean;
  samePaymentMethod: boolean;
  sameIPAddress: boolean;
  
  // Medium signals (possibly same user)
  similarUsername: boolean;
  sameTimezone: boolean;
  sameISP: boolean;
  similarBehavior: boolean;
  
  // Weak signals (coincidental)
  sameCountry: boolean;
  similarEntryTimes: boolean;
}

// Multi-account is allowed, but:
// 1. Same tournament entry with multiple accounts = BAN
// 2. Collusion between accounts = BAN
// 3. Bonus abuse with multiple accounts = BAN
```

### 7.5 Integration with Existing Fraud System

The signup system should integrate with `lib/fraudDetection.js`:

```typescript
// On signup attempt
const signupRiskAssessment = await fraudDetectionEngine.analyzeSignup({
  email: formData.email,
  phone: formData.phone,
  deviceFingerprint: deviceData,
  ipAddress: context.ip,
  referrer: context.referrer,
  timing: {
    pageLoadToSubmit: timeSpent,
    keystrokeDynamics: keystrokeData,
  },
});

// Risk actions
switch (signupRiskAssessment.action) {
  case 'approve':
    // Proceed with signup
    break;
  case 'challenge':
    // Require additional verification (CAPTCHA)
    break;
  case 'review':
    // Allow but flag for manual review
    break;
  case 'block':
    // Reject signup
    break;
}
```

---

## 8. Data Schema

### 8.1 Firestore Collections

```
/users/{uid}
├── Core user profile (see UserProfile interface)
└── Subcollections:
    ├── /teams/{teamId}          - User's drafted teams
    ├── /transactions/{txnId}    - Financial transactions
    └── /notifications/{notifId} - User notifications

/usernames/{username}
├── uid: string                   - Owner's UID
├── username: string              - Normalized (uppercase)
├── reservedAt: Timestamp
├── previousOwner: string | null  - For username recycling
└── releasedAt: Timestamp | null

/sessions/{sessionId}
├── uid: string
├── deviceFingerprint: string
├── ipAddress: string
├── userAgent: string
├── createdAt: Timestamp
├── lastActiveAt: Timestamp
├── expiresAt: Timestamp
└── isActive: boolean

/security_events/{eventId}
├── uid: string | null
├── eventType: string             - 'signup_attempt', 'login_failed', etc.
├── severity: 'low' | 'medium' | 'high' | 'critical'
├── details: object
├── ipAddress: string
├── deviceFingerprint: string | null
├── timestamp: Timestamp
└── resolved: boolean

/rate_limits/{key}
├── count: number
├── windowStart: Timestamp
├── windowEnd: Timestamp
└── blocked: boolean
```

### 8.2 Firestore Security Rules (Production)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ==========================================
    // USERS COLLECTION
    // ==========================================
    match /users/{userId} {
      // Users can read their own profile
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Users can create their own profile (signup)
      allow create: if request.auth != null 
        && request.auth.uid == userId
        && isValidUserProfile(request.resource.data);
      
      // Users can update their own profile with restrictions
      allow update: if request.auth != null 
        && request.auth.uid == userId
        && isValidProfileUpdate(request.resource.data, resource.data);
      
      // Subcollections
      match /teams/{teamId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow write: if false; // Server-only writes
      }
      
      match /transactions/{txnId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow write: if false; // Server-only writes
      }
    }
    
    // ==========================================
    // USERNAMES COLLECTION
    // ==========================================
    match /usernames/{username} {
      // Anyone authenticated can check availability
      allow read: if request.auth != null;
      
      // Only server can write (via Cloud Functions)
      allow write: if false;
    }
    
    // ==========================================
    // SESSIONS COLLECTION
    // ==========================================
    match /sessions/{sessionId} {
      // Users can read their own sessions
      allow read: if request.auth != null 
        && resource.data.uid == request.auth.uid;
      
      // Only server can write
      allow write: if false;
    }
    
    // ==========================================
    // SECURITY EVENTS (Admin only)
    // ==========================================
    match /security_events/{eventId} {
      allow read, write: if false; // Server/Admin only
    }
    
    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================
    
    function isValidUserProfile(data) {
      return data.uid == request.auth.uid
        && data.username is string
        && data.username.size() >= 3
        && data.username.size() <= 18
        && data.countryCode is string
        && data.countryCode.size() == 2
        && data.createdAt == request.time;
    }
    
    function isValidProfileUpdate(newData, oldData) {
      // Cannot change UID
      return newData.uid == oldData.uid
        // Cannot change username directly (use Cloud Function)
        && newData.username == oldData.username
        // Cannot change creation date
        && newData.createdAt == oldData.createdAt;
    }
  }
}
```

### 8.3 Firestore Indexes

```json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "username", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "authMethods.email", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "authMethods.phone", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "uid", "order": "ASCENDING" },
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "security_events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "uid", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "security_events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "eventType", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 9. API Design

### 9.1 Cloud Functions

```typescript
// ==========================================
// AUTH FUNCTIONS
// ==========================================

/**
 * Check username availability
 * Rate limited: 30/min per IP
 */
export const checkUsernameAvailability = functions.https.onCall(
  async (data: { username: string }, context) => {
    // Rate limit check
    // Validation
    // Check /usernames collection
    // Return { available: boolean, suggestions?: string[] }
  }
);

/**
 * Reserve username during signup
 * Called after Firebase Auth user created
 */
export const reserveUsername = functions.https.onCall(
  async (data: { username: string }, context) => {
    // Verify auth
    // Validate username
    // Atomic transaction to reserve
    // Create user profile
    // Return { success: boolean, error?: string }
  }
);

/**
 * Change username
 * Enforces cooldown period
 */
export const changeUsername = functions.https.onCall(
  async (data: { newUsername: string }, context) => {
    // Verify auth
    // Check cooldown period
    // Validate new username
    // Atomic swap in transaction
    // Return { success: boolean, error?: string }
  }
);

/**
 * Send phone OTP
 * Rate limited per phone and IP
 */
export const sendPhoneOTP = functions.https.onCall(
  async (data: { phone: string, countryCode: string }, context) => {
    // Rate limit check
    // Validate phone format
    // Select SMS provider based on country
    // Send OTP
    // Return { success: boolean, retryAfter?: number }
  }
);

/**
 * Verify phone OTP
 */
export const verifyPhoneOTP = functions.https.onCall(
  async (data: { phone: string, otp: string }, context) => {
    // Verify OTP
    // Update user profile if verified
    // Return { success: boolean, error?: string }
  }
);

// ==========================================
// SECURITY FUNCTIONS
// ==========================================

/**
 * Log security event
 * Called from client on suspicious activity
 */
export const logSecurityEvent = functions.https.onCall(
  async (data: SecurityEventData, context) => {
    // Validate event data
    // Enrich with server-side info
    // Store in security_events collection
    // Trigger alerts if high severity
  }
);

/**
 * Invalidate all sessions
 * Called on password change or security incident
 */
export const invalidateAllSessions = functions.https.onCall(
  async (data: {}, context) => {
    // Verify auth
    // Mark all sessions as inactive
    // Revoke refresh tokens
    // Return { success: boolean, sessionsInvalidated: number }
  }
);

// ==========================================
// TRIGGERS
// ==========================================

/**
 * On user created - initialize profile
 */
export const onUserCreated = functions.auth.user().onCreate(
  async (user) => {
    // Create minimal profile placeholder
    // Log signup event
    // Send welcome notification
  }
);

/**
 * On user deleted - cleanup
 */
export const onUserDeleted = functions.auth.user().onDelete(
  async (user) => {
    // Release username
    // Archive user data
    // Clean up sessions
  }
);
```

### 9.2 API Response Standards

```typescript
// Standard success response
interface APISuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

// Standard error response
interface APIErrorResponse {
  success: false;
  error: {
    code: string;           // Machine-readable: 'USERNAME_TAKEN'
    message: string;        // Human-readable: 'This username is already taken'
    field?: string;         // Which field caused error: 'username'
    retryAfter?: number;    // Seconds until retry (for rate limits)
  };
  timestamp: string;
}

// Error codes
const ERROR_CODES = {
  // Username errors
  USERNAME_TAKEN: 'This username is already taken',
  USERNAME_INVALID_LENGTH: 'Username must be 3-18 characters',
  USERNAME_INVALID_CHARS: 'Username contains invalid characters',
  USERNAME_RESERVED: 'This username is reserved',
  USERNAME_CHANGE_COOLDOWN: 'Username can only be changed once every 90 days',
  
  // Auth errors
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password',
  AUTH_ACCOUNT_LOCKED: 'Account temporarily locked. Try again later',
  AUTH_EMAIL_IN_USE: 'An account with this email already exists',
  AUTH_PHONE_IN_USE: 'An account with this phone number already exists',
  AUTH_INVALID_OTP: 'Invalid or expired verification code',
  
  // Rate limit errors
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',
  
  // Security errors
  SECURITY_SUSPICIOUS_ACTIVITY: 'Suspicious activity detected',
  SECURITY_DEVICE_BLOCKED: 'This device has been blocked',
};
```

---

## 10. VX2 Component Architecture

### 10.1 Directory Structure

```
components/vx2/
├── auth/                           # NEW - Auth module
│   ├── components/
│   │   ├── SignupFlowVX2.tsx       # Main signup orchestrator
│   │   ├── LoginFlowVX2.tsx        # Main login orchestrator
│   │   ├── UsernameInput.tsx       # Username with validation
│   │   ├── PhoneInput.tsx          # International phone input
│   │   ├── OTPInput.tsx            # 6-digit OTP input
│   │   ├── CountrySelector.tsx     # Country dropdown
│   │   ├── AuthMethodPicker.tsx    # Email/Phone/Google/Apple
│   │   ├── PasswordInput.tsx       # Password with strength meter
│   │   └── index.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts              # Main auth state hook
│   │   ├── useSignup.ts            # Signup flow state
│   │   ├── useLogin.ts             # Login flow state
│   │   ├── useUsernameValidation.ts # Real-time username validation
│   │   ├── usePhoneAuth.ts         # Phone OTP flow
│   │   ├── useOAuth.ts             # Google/Apple OAuth
│   │   ├── useSession.ts           # Session management
│   │   └── index.ts
│   │
│   ├── context/
│   │   ├── AuthContext.tsx         # Global auth state provider
│   │   └── index.ts
│   │
│   ├── constants/
│   │   ├── auth.ts                 # Auth-related constants
│   │   ├── countries.ts            # Country list with phone codes
│   │   └── index.ts
│   │
│   ├── types/
│   │   ├── auth.ts                 # Auth TypeScript interfaces
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── validation.ts           # Validation utilities
│   │   ├── phone.ts                # Phone number utilities
│   │   └── index.ts
│   │
│   └── index.ts                    # Barrel export
│
├── profile/                        # NEW - Profile module
│   ├── components/
│   │   ├── ProfileViewVX2.tsx      # Profile display
│   │   ├── ProfileEditVX2.tsx      # Profile editing
│   │   ├── UsernameChangeModal.tsx # Username change flow
│   │   ├── AvatarPicker.tsx        # Avatar selection
│   │   ├── PreferencesForm.tsx     # User preferences
│   │   └── index.ts
│   │
│   ├── hooks/
│   │   ├── useProfile.ts           # Profile data hook
│   │   ├── useProfileEdit.ts       # Profile editing state
│   │   └── index.ts
│   │
│   └── index.ts
```

### 10.2 Core Components

#### SignupFlowVX2

```tsx
/**
 * SignupFlowVX2 - Main signup orchestrator
 * 
 * Multi-step signup flow with progress persistence.
 * Handles network failures gracefully.
 * 
 * @example
 * ```tsx
 * <SignupFlowVX2
 *   onComplete={(user) => router.push('/lobby')}
 *   onCancel={() => router.back()}
 *   initialMethod="phone" // Optional: pre-select auth method
 * />
 * ```
 */
export function SignupFlowVX2({
  onComplete,
  onCancel,
  initialMethod,
}: SignupFlowProps) {
  // Steps: method_select -> credentials -> username -> complete
  const [step, setStep] = useState<SignupStep>('method_select');
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(initialMethod);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  
  // Persist progress to localStorage for recovery
  useSignupPersistence({ step, authMethod, credentials });
  
  return (
    <div className="flex flex-col h-full">
      {/* Progress indicator */}
      <SignupProgress currentStep={step} />
      
      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        {step === 'method_select' && (
          <AuthMethodPicker
            onSelect={(method) => {
              setAuthMethod(method);
              setStep('credentials');
            }}
          />
        )}
        
        {step === 'credentials' && authMethod && (
          <CredentialsStep
            method={authMethod}
            onComplete={(creds) => {
              setCredentials(creds);
              setStep('username');
            }}
            onBack={() => setStep('method_select')}
          />
        )}
        
        {step === 'username' && credentials && (
          <UsernameStep
            onComplete={(username) => {
              handleSignupComplete(credentials, username);
            }}
            onBack={() => setStep('credentials')}
          />
        )}
      </div>
      
      {/* Cancel button always visible */}
      <button onClick={onCancel} className="...">
        Cancel
      </button>
    </div>
  );
}
```

#### UsernameInput

```tsx
/**
 * UsernameInput - Real-time validated username input
 * 
 * Features:
 * - Real-time character validation
 * - Debounced availability check
 * - Visual feedback (valid/invalid/checking)
 * - Country-specific character support
 * 
 * @example
 * ```tsx
 * <UsernameInput
 *   value={username}
 *   onChange={setUsername}
 *   countryCode="BR"
 *   onValidationChange={(isValid) => setCanSubmit(isValid)}
 * />
 * ```
 */
export function UsernameInput({
  value,
  onChange,
  countryCode,
  onValidationChange,
}: UsernameInputProps) {
  const {
    validationState,
    availabilityState,
    errors,
  } = useUsernameValidation(value, countryCode);
  
  // Determine border color based on state
  const borderColor = useMemo(() => {
    if (!value) return COLORS.INPUT_BORDER_DEFAULT;
    if (errors.length > 0) return COLORS.INPUT_BORDER_ERROR;
    if (availabilityState === 'checking') return COLORS.INPUT_BORDER_DEFAULT;
    if (availabilityState === 'unavailable') return COLORS.INPUT_BORDER_ERROR;
    if (availabilityState === 'available') return COLORS.INPUT_BORDER_SUCCESS;
    return COLORS.INPUT_BORDER_DEFAULT;
  }, [value, errors, availabilityState]);
  
  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-300">
        Username
      </label>
      
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          maxLength={18}
          className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white"
          style={{ borderColor, borderWidth: 2 }}
          placeholder="Enter username"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
        
        {/* Status indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {availabilityState === 'checking' && <Spinner size={20} />}
          {availabilityState === 'available' && <CheckIcon color={COLORS.SUCCESS} />}
          {availabilityState === 'unavailable' && <XIcon color={COLORS.ERROR} />}
        </div>
      </div>
      
      {/* Error messages */}
      {errors.length > 0 && (
        <div className="text-sm text-red-400">
          {errors.map((error, i) => (
            <div key={i}>{error}</div>
          ))}
        </div>
      )}
      
      {/* Availability message */}
      {availabilityState === 'available' && (
        <div className="text-sm text-green-400">
          Username is available
        </div>
      )}
      {availabilityState === 'unavailable' && (
        <div className="text-sm text-red-400">
          Username is already taken
        </div>
      )}
      
      {/* Character count */}
      <div className="text-xs text-gray-500 text-right">
        {value.length}/18
      </div>
    </div>
  );
}
```

### 10.3 Core Hooks

#### useAuth

```typescript
/**
 * useAuth - Main authentication state hook
 * 
 * Provides authentication state, user data, and auth methods.
 * Should be used within AuthProvider context.
 * 
 * @example
 * ```tsx
 * const { user, isAuthenticated, isLoading, signOut } = useAuth();
 * 
 * if (isLoading) return <LoadingSpinner />;
 * if (!isAuthenticated) return <LoginPrompt />;
 * return <Dashboard user={user} />;
 * ```
 */
export function useAuth(): UseAuthResult {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
}

interface UseAuthResult {
  // State
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Auth methods
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signInWithPhone: (phone: string) => Promise<OTPResult>;
  verifyPhoneOTP: (otp: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithApple: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  
  // Account methods
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  
  // Session
  refreshSession: () => Promise<void>;
  invalidateAllSessions: () => Promise<void>;
}
```

#### useUsernameValidation

```typescript
/**
 * useUsernameValidation - Real-time username validation hook
 * 
 * Handles client-side validation and debounced server-side availability check.
 * 
 * @example
 * ```tsx
 * const { validationState, availabilityState, errors } = 
 *   useUsernameValidation(username, countryCode);
 * ```
 */
export function useUsernameValidation(
  username: string,
  countryCode: string,
): UseUsernameValidationResult {
  const [availabilityState, setAvailabilityState] = useState<AvailabilityState>('idle');
  const [errors, setErrors] = useState<string[]>([]);
  
  // Client-side validation (immediate)
  useEffect(() => {
    if (!username) {
      setErrors([]);
      return;
    }
    
    const validation = validateUsernameClient(username, countryCode);
    setErrors(validation.errors);
  }, [username, countryCode]);
  
  // Server-side availability check (debounced)
  const debouncedUsername = useDebounce(username, 500);
  
  useEffect(() => {
    if (!debouncedUsername || errors.length > 0) {
      setAvailabilityState('idle');
      return;
    }
    
    let cancelled = false;
    
    async function checkAvailability() {
      setAvailabilityState('checking');
      
      try {
        const result = await checkUsernameAvailabilityAPI(debouncedUsername);
        
        if (!cancelled) {
          setAvailabilityState(result.available ? 'available' : 'unavailable');
        }
      } catch (error) {
        if (!cancelled) {
          setAvailabilityState('error');
        }
      }
    }
    
    checkAvailability();
    
    return () => { cancelled = true; };
  }, [debouncedUsername, errors.length]);
  
  return {
    validationState: errors.length === 0 ? 'valid' : 'invalid',
    availabilityState,
    errors,
    isValid: errors.length === 0 && availabilityState === 'available',
  };
}
```

### 10.4 Auth Context Provider

```typescript
/**
 * AuthProvider - Global authentication context provider
 * 
 * Wraps the application and provides auth state to all components.
 * Handles Firebase auth state changes and session management.
 * 
 * @example
 * ```tsx
 * // In _app.tsx
 * function MyApp({ Component, pageProps }) {
 *   return (
 *     <AuthProvider>
 *       <Component {...pageProps} />
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from Firestore
        const profile = await fetchUserProfile(firebaseUser.uid);
        setUser(profile);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  // Auth methods...
  const signInWithEmail = async (email: string, password: string) => { /* ... */ };
  const signInWithPhone = async (phone: string) => { /* ... */ };
  // etc.
  
  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    error,
    signInWithEmail,
    signInWithPhone,
    // etc.
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## 11. Implementation Phases

### Phase 1: Foundation (2-3 weeks / 50 hours)

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Create VX2 auth module structure | HIGH | 2h | None |
| Implement AuthContext provider | HIGH | 8h | Module structure |
| Implement useAuth hook | HIGH | 8h | AuthContext |
| Create UsernameInput component | HIGH | 8h | None |
| Create useUsernameValidation hook | HIGH | 4h | None |
| Update localeCharacters.js (add BR, NG, PH, ID) | MEDIUM | 2h | None |
| Create Cloud Function: checkUsernameAvailability | HIGH | 4h | None |
| Create Cloud Function: reserveUsername | HIGH | 8h | None |
| Update Firestore security rules | HIGH | 4h | None |
| Create Firestore indexes | HIGH | 2h | None |

**Deliverable:** Username validation system working end-to-end

### Phase 2: Email/Password Auth (2 weeks / 64 hours)

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Create SignupFlowVX2 component | HIGH | 16h | Phase 1 |
| Create LoginFlowVX2 component | HIGH | 12h | Phase 1 |
| Create PasswordInput component | HIGH | 4h | None |
| Implement email/password signup | HIGH | 8h | SignupFlowVX2 |
| Implement email/password login | HIGH | 4h | LoginFlowVX2 |
| Implement password reset flow | MEDIUM | 8h | None |
| Create email verification flow | HIGH | 8h | None |
| Rate limiting for auth endpoints | HIGH | 4h | None |

**Deliverable:** Complete email/password auth working

### Phase 3: Phone Auth (2 weeks / 48 hours)

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Create PhoneInput component | HIGH | 8h | None |
| Create OTPInput component | HIGH | 4h | None |
| Create CountrySelector component | HIGH | 4h | None |
| Create Cloud Function: sendPhoneOTP | HIGH | 8h | None |
| Create Cloud Function: verifyPhoneOTP | HIGH | 4h | sendPhoneOTP |
| Implement phone signup flow | HIGH | 8h | OTP functions |
| Implement phone login flow | HIGH | 4h | OTP functions |
| Configure Twilio/Firebase SMS | HIGH | 4h | None |
| Add Africa's Talking for NG/KE | MEDIUM | 4h | Phone auth |

**Deliverable:** Phone OTP auth working globally

### Phase 4: OAuth (1 week / 28 hours)

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Create AuthMethodPicker component | HIGH | 4h | None |
| Implement Google OAuth | HIGH | 8h | AuthMethodPicker |
| Implement Apple Sign In | MEDIUM | 8h | AuthMethodPicker |
| Handle OAuth + username flow | HIGH | 8h | Phase 1 |

**Deliverable:** Google and Apple sign-in working

### Phase 5: Profile Management (2 weeks / 56 hours)

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Create ProfileViewVX2 component | HIGH | 8h | Phase 2 |
| Create ProfileEditVX2 component | HIGH | 12h | ProfileViewVX2 |
| Create UsernameChangeModal | MEDIUM | 8h | Phase 1 |
| Create AvatarPicker component | LOW | 8h | None |
| Create PreferencesForm component | MEDIUM | 8h | None |
| Implement username change flow | MEDIUM | 8h | UsernameChangeModal |
| Implement profile update API | HIGH | 4h | None |

**Deliverable:** Complete profile management system

### Phase 6: Security Hardening (2 weeks / 72 hours)

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Integrate with fraudDetection.js | HIGH | 8h | Phase 2 |
| Implement device fingerprinting | HIGH | 8h | None |
| Implement rate limiting | HIGH | 8h | None |
| Add security event logging | HIGH | 8h | None |
| Implement session management | MEDIUM | 8h | Phase 2 |
| Add multi-account detection | MEDIUM | 16h | Device fingerprinting |
| Security audit and penetration testing | HIGH | 16h | All above |

**Deliverable:** Production-ready security

### Phase 7: Polish & Optimization (1 week / 36 hours)

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Network resilience improvements | HIGH | 8h | All phases |
| Offline-first enhancements | MEDIUM | 8h | All phases |
| Error message internationalization | MEDIUM | 4h | All phases |
| Performance optimization | MEDIUM | 8h | All phases |
| Documentation | HIGH | 8h | All phases |

**Deliverable:** Production-ready system

---

### Hours Summary

| Phase | Weeks | Hours |
|-------|-------|-------|
| 1. Foundation | 2-3 | 50h |
| 2. Email/Password | 2 | 64h |
| 3. Phone Auth | 2 | 48h |
| 4. OAuth | 1 | 28h |
| 5. Profile Management | 2 | 56h |
| 6. Security Hardening | 2 | 72h |
| 7. Polish | 1 | 36h |
| **TOTAL** | **~12** | **354h** |

**Assumed pace:** ~30 hours/week (accounting for code review, testing, meetings)

---

## 12. Testing Strategy

### 12.1 Unit Tests

```typescript
// Username validation tests
describe('usernameValidation', () => {
  describe('validateUsername', () => {
    it('should reject usernames under 3 characters', () => {
      expect(validateUsername('AB', 'US').isValid).toBe(false);
    });
    
    it('should reject usernames over 18 characters', () => {
      expect(validateUsername('A'.repeat(19), 'US').isValid).toBe(false);
    });
    
    it('should accept locale-specific characters for Brazil', () => {
      expect(validateUsername('JOÃO123', 'BR').isValid).toBe(true);
    });
    
    it('should reject locale-specific characters for wrong country', () => {
      expect(validateUsername('JOÃO123', 'US').isValid).toBe(false);
    });
    
    it('should reject reserved usernames', () => {
      expect(validateUsername('ADMIN', 'US').isValid).toBe(false);
    });
    
    it('should reject spaces', () => {
      expect(validateUsername('JOHN DOE', 'US').isValid).toBe(false);
    });
  });
});

// Auth flow tests
describe('SignupFlow', () => {
  it('should complete email signup flow', async () => { /* ... */ });
  it('should complete phone signup flow', async () => { /* ... */ });
  it('should handle network failures gracefully', async () => { /* ... */ });
  it('should persist progress on disconnect', async () => { /* ... */ });
});
```

### 12.2 Integration Tests

```typescript
// Firestore integration tests
describe('UserRegistration', () => {
  it('should atomically reserve username', async () => {
    const result1 = reserveUsername('TESTUSER', 'uid1');
    const result2 = reserveUsername('TESTUSER', 'uid2');
    
    const results = await Promise.all([result1, result2]);
    
    // Only one should succeed
    expect(results.filter(r => r.success)).toHaveLength(1);
  });
  
  it('should enforce rate limits', async () => {
    // Make 31 requests in rapid succession
    const results = await Promise.all(
      Array(31).fill(null).map(() => 
        checkUsernameAvailability('TEST' + Math.random())
      )
    );
    
    // Last request should be rate limited
    expect(results[30].error?.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
```

### 12.3 E2E Tests

```typescript
// Cypress E2E tests
describe('Signup Flow', () => {
  it('should complete full signup with email', () => {
    cy.visit('/signup');
    
    // Select email method
    cy.get('[data-testid="auth-method-email"]').click();
    
    // Enter email and password
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('SecurePassword123!');
    cy.get('[data-testid="continue-button"]').click();
    
    // Enter username
    cy.get('[data-testid="username-input"]').type('TESTUSER');
    
    // Wait for availability check
    cy.get('[data-testid="username-available"]').should('be.visible');
    
    // Complete signup
    cy.get('[data-testid="signup-button"]').click();
    
    // Should redirect to lobby
    cy.url().should('include', '/lobby');
  });
  
  it('should handle slow network gracefully', () => {
    // Simulate 3G network
    cy.intercept('**/api/**', { delay: 2000 });
    
    cy.visit('/signup');
    
    // Should show loading states
    cy.get('[data-testid="username-input"]').type('TESTUSER');
    cy.get('[data-testid="username-checking"]').should('be.visible');
    
    // Eventually should show result
    cy.get('[data-testid="username-available"]', { timeout: 5000 })
      .should('be.visible');
  });
});
```

### 12.4 Device Testing Matrix

| Device | OS Version | Test Priority |
|--------|------------|---------------|
| iPhone 8 | iOS 15 | HIGH (baseline) |
| iPhone 12 | iOS 17 | HIGH |
| iPhone 15 Pro | iOS 18 | MEDIUM |
| Samsung Galaxy S10 | Android 10 | HIGH |
| Samsung Galaxy S23 | Android 14 | HIGH |
| Xiaomi Redmi Note 9 | Android 11 | HIGH (emerging markets) |
| iPad Pro 11" | iPadOS 17 | MEDIUM |

### 12.5 Network Condition Testing

| Condition | Parameters | Test Scenarios |
|-----------|------------|----------------|
| Excellent (4G+) | 20ms latency, 10Mbps | Baseline |
| Good (4G) | 100ms latency, 5Mbps | Standard |
| Variable (3G) | 300ms latency, 1Mbps | Signup flow |
| Poor (2G) | 500ms latency, 200kbps | Critical paths only |
| Offline | No connection | Error handling |
| Intermittent | Random disconnects | Progress persistence |

---

## 13. Monitoring & Analytics

### 13.1 Key Metrics

| Metric | Description | Target | Alert Threshold |
|--------|-------------|--------|-----------------|
| **Signup Completion Rate** | Users who complete signup / started | >70% | <50% |
| **Signup Time (P50)** | Median time to complete signup | <60s | >120s |
| **Signup Time (P95)** | 95th percentile signup time | <180s | >300s |
| **Username Availability Check Latency** | Time for availability response | <200ms | >500ms |
| **OTP Delivery Success Rate** | OTPs successfully delivered | >98% | <95% |
| **OTP Verification Success Rate** | Valid OTP entered first try | >80% | <60% |
| **Login Success Rate** | Successful logins / attempts | >95% | <90% |
| **Rate Limit Hits** | Requests blocked by rate limiting | <1% | >5% |
| **Fraud Block Rate** | Signups blocked by fraud detection | <3% | >10% |

### 13.2 Funnel Tracking

```
Signup Funnel:
─────────────
1. Signup Page Viewed        → Track: page_view
2. Auth Method Selected      → Track: auth_method_selected (method)
3. Credentials Entered       → Track: credentials_entered
4. Credentials Verified      → Track: credentials_verified
5. Username Page Viewed      → Track: username_step_started
6. Username Entered          → Track: username_entered (length, has_locale_chars)
7. Username Valid            → Track: username_validated
8. Signup Completed          → Track: signup_completed (total_time, method)

Drop-off Analysis:
──────────────────
Track at each step:
- time_spent: How long user spent on step
- errors_encountered: Validation errors shown
- network_errors: Network failures
- device_info: Device/browser details
- country: User's country
```

### 13.3 Error Tracking

```typescript
interface SignupErrorEvent {
  errorCode: string;
  errorMessage: string;
  step: SignupStep;
  method: AuthMethod;
  
  // Context
  deviceInfo: DeviceInfo;
  networkInfo: NetworkInfo;
  country: string;
  
  // Timing
  timeInStep: number;
  totalTime: number;
  
  // Recovery
  recovered: boolean;
  recoveryMethod: string | null;
}

// Track errors with enough context to debug
trackSignupError({
  errorCode: 'OTP_DELIVERY_FAILED',
  errorMessage: 'SMS not delivered within 30 seconds',
  step: 'phone_verification',
  method: 'phone',
  deviceInfo: getDeviceInfo(),
  networkInfo: await getNetworkInfo(),
  country: 'NG',
  timeInStep: 45000,
  totalTime: 120000,
  recovered: true,
  recoveryMethod: 'resend_otp',
});
```

### 13.4 Dashboard Metrics

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     SIGNUP SYSTEM DASHBOARD                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  TODAY'S METRICS                                                        │
│  ───────────────                                                        │
│  Signups Completed: 1,247 (+12% vs yesterday)                           │
│  Completion Rate: 73.2% (target: 70%)                                   │
│  Avg Signup Time: 47s (target: <60s)                                    │
│  Fraud Blocks: 28 (2.2%)                                                │
│                                                                          │
│  AUTH METHOD BREAKDOWN                                                  │
│  ─────────────────────                                                  │
│  Email/Password: 42%                                                    │
│  Phone OTP: 31%                                                         │
│  Google OAuth: 22%                                                      │
│  Apple Sign In: 5%                                                      │
│                                                                          │
│  GEOGRAPHIC DISTRIBUTION                                                │
│  ────────────────────────                                               │
│  North America: 45%                                                     │
│  Europe: 28%                                                            │
│  LATAM: 15%                                                             │
│  Asia: 8%                                                               │
│  Africa: 4%                                                             │
│                                                                          │
│  TOP DROP-OFF POINTS                                                    │
│  ──────────────────                                                     │
│  1. Username already taken: 8.3%                                        │
│  2. OTP not received: 5.1%                                              │
│  3. Password too weak: 3.7%                                             │
│                                                                          │
│  ALERTS                                                                 │
│  ──────                                                                 │
│  [WARN] OTP delivery to Nigeria degraded (92% success, target 98%)      │
│  [INFO] Signup surge from Brazil (+40% last hour)                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 14. Risk Assessment

### 14.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Firebase Auth rate limits | MEDIUM | HIGH | Pre-warm, circuit breakers |
| SMS delivery failures in emerging markets | HIGH | MEDIUM | Multiple providers, fallbacks |
| Username collision race conditions | LOW | HIGH | Firestore transactions |
| OAuth provider outages | LOW | MEDIUM | Multiple auth methods |
| Device fingerprinting blocked by browsers | MEDIUM | LOW | Graceful degradation |

### 14.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| High signup abandonment | MEDIUM | HIGH | Progressive profiling, persistence |
| Username squatting | MEDIUM | LOW | Reserved words, monitoring |
| Multi-accounting abuse | HIGH | MEDIUM | Device tracking, behavioral analysis |
| Regulatory compliance (GDPR, etc.) | MEDIUM | HIGH | Privacy by design, data minimization |
| SMS costs in high-volume markets | HIGH | MEDIUM | Local providers, email alternatives |

### 14.3 Security Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Credential stuffing | HIGH | HIGH | Rate limiting, breach checks |
| Account enumeration | MEDIUM | MEDIUM | Consistent responses, rate limiting |
| Bot registrations | HIGH | MEDIUM | CAPTCHA, behavioral analysis |
| Session hijacking | LOW | HIGH | Secure tokens, device binding |
| Phone number recycling attacks | LOW | MEDIUM | Re-verification on suspicious activity |

---

## 15. Appendices

### A. Country Phone Codes Reference

```typescript
const COUNTRY_PHONE_CODES: Record<string, CountryPhoneConfig> = {
  'US': { code: '+1', format: '(XXX) XXX-XXXX', length: 10 },
  'CA': { code: '+1', format: '(XXX) XXX-XXXX', length: 10 },
  'BR': { code: '+55', format: '(XX) XXXXX-XXXX', length: 11 },
  'MX': { code: '+52', format: 'XX XXXX XXXX', length: 10 },
  'NG': { code: '+234', format: 'XXX XXX XXXX', length: 10 },
  'KE': { code: '+254', format: 'XXX XXX XXX', length: 9 },
  'PH': { code: '+63', format: 'XXX XXX XXXX', length: 10 },
  'ID': { code: '+62', format: 'XXX-XXXX-XXXX', length: 11 },
  // ... more countries
};
```

### B. Approved Countries Character Reference

All 49 approved countries are configured in `lib/localeCharacters.js`.

```typescript
// Character sets by language family:

// STANDARD LATIN ONLY (no additional characters)
// AU, BM, BZ, CY, GD, GR, GY, ID, JM, MM, MN, MY, NZ, SG, TT, US

// SPANISH (áéíóúñü)
// BO, CL, CO, CR, DO, ES, GT, HN, MX, NI, PA, PE, PR, SV, UY, VE

// PORTUGUESE (ãõáéíóúâêôç)
// PT

// FRENCH (éèêëàâäôöùûüçîïœæ)
// FR, HT, MQ

// GERMAN (äöüß)
// AT, DE

// DUTCH/PAPIAMENTO (éèëïóòö)
// AW, CW, SR

// SCANDINAVIAN
// DK, NO: æøå
// SE: åäö
// FI: äöå
// IS: áéíóúýþæö

// EASTERN EUROPEAN
// PL: ąćęłńóśźż
// CZ: áčďéěíňóřšťúůýž
// SK: áäčďéíĺľňóôŕšťúýž
// HU: áéíóöőúüű
// RO: ăâîșț
// HR: čćđšž
// SI: čšž
// EE: äöõü
// LV: āčēģīķļņšūž
// LT: ąčęėįšųūž
// BG: абвгдежзийклмнопрстуфхцчшщъьюя (Cyrillic)

// OTHER
// IE: áéíóú (Irish)
// LU: éèêëàâäôöùûüçîïäöüß (French + German)
// CA: éèêëàâäôöùûüçîï (French)
```

### C. How to Add New Countries

The system is designed for easy addition of new countries. Follow these steps:

#### Step 1: Identify Character Set

Check `CHARACTER_SETS` in `lib/localeCharacters.js` for pre-defined character sets:

```javascript
import { suggestCharacterSet } from './lib/localeCharacters';

// Get suggestion based on primary language
suggestCharacterSet('spanish');  // Returns: 'SPANISH'
suggestCharacterSet('german');   // Returns: 'GERMAN'
```

#### Step 2: Add to localeCharacters Object

```javascript
// In lib/localeCharacters.js, add to the appropriate regional section:

'BR': {
  additionalChars: CHARACTER_SETS.PORTUGUESE,  // Use pre-defined set
  description: 'Brazil - Western alphabet + Portuguese accents'
},
```

#### Step 3: Add to approvedCountries Array

```javascript
// In lib/localeCharacters.js, add to approvedCountries:

{ code: 'BR', name: 'Brazil', region: 'South America' },
```

#### Step 4: Validate Configuration

```bash
# Run validation to ensure consistency
node -e "require('./lib/localeCharacters').validateConfiguration()"

# Expected output:
# Configuration is valid. All countries are properly configured.
# Total approved countries: 50
```

#### Step 5: No Code Changes Needed

The system automatically picks up new countries because:

- `getApprovedCountriesSorted()` dynamically returns all countries
- `getAllowedCharacters(code)` falls back to standard Latin for unknown codes
- `isApprovedCountry(code)` uses a Set derived from `approvedCountries`
- Registration modal imports countries dynamically

#### Helper Functions Available

```javascript
import {
  validateConfiguration,      // Check data integrity
  getConfigurationStats,      // Get country/region statistics
  generateCountryEntry,       // Generate code snippets for new country
  getCountriesByCharacterSet, // Find countries using same character set
  suggestCharacterSet,        // Suggest character set by language
} from './lib/localeCharacters';

// Generate code for a new country
const entry = generateCountryEntry('BR', 'Brazil', 'South America', 'PORTUGUESE');
console.log(entry.localeEntry);    // Code for localeCharacters
console.log(entry.approvedEntry);  // Code for approvedCountries

// Get statistics
const stats = getConfigurationStats();
console.log(stats);
// {
//   totalCountries: 49,
//   byRegion: { 'North America': 4, 'Caribbean': 9, ... },
//   countriesWithStandardLatinOnly: 16,
//   countriesWithAdditionalChars: 33
// }
```

#### Regions Available

```javascript
import { REGIONS } from './lib/localeCharacters';

// Use these for consistency:
REGIONS.NORTH_AMERICA    // 'North America'
REGIONS.CARIBBEAN        // 'Caribbean'
REGIONS.CENTRAL_AMERICA  // 'Central America'
REGIONS.SOUTH_AMERICA    // 'South America'
REGIONS.WESTERN_EUROPE   // 'Western Europe'
REGIONS.NORTHERN_EUROPE  // 'Northern Europe'
REGIONS.SOUTHERN_EUROPE  // 'Southern Europe'
REGIONS.EASTERN_EUROPE   // 'Eastern Europe'
REGIONS.ASIA             // 'Asia'
REGIONS.OCEANIA          // 'Oceania'
REGIONS.AFRICA           // 'Africa' (future)
REGIONS.MIDDLE_EAST      // 'Middle East' (future)
```

#### Pre-Defined Character Sets

```javascript
import { CHARACTER_SETS } from './lib/localeCharacters';

CHARACTER_SETS.STANDARD_LATIN    // '' (English, etc.)
CHARACTER_SETS.SPANISH           // 'áéíóúñü'
CHARACTER_SETS.PORTUGUESE        // 'ãõáéíóúâêôç'
CHARACTER_SETS.FRENCH            // 'éèêëàâäôöùûüçîïœæ'
CHARACTER_SETS.GERMAN            // 'äöüß'
CHARACTER_SETS.DUTCH             // 'éèëïóòö'
CHARACTER_SETS.ITALIAN           // 'àèéìíîòóùú'
CHARACTER_SETS.POLISH            // 'ąćęłńóśźż'
CHARACTER_SETS.CZECH             // 'áčďéěíňóřšťúůýž'
CHARACTER_SETS.HUNGARIAN         // 'áéíóöőúüű'
CHARACTER_SETS.ROMANIAN          // 'ăâîșț'
CHARACTER_SETS.RUSSIAN_CYRILLIC  // Full Cyrillic alphabet
CHARACTER_SETS.TURKISH           // 'çğıöşü'
CHARACTER_SETS.VIETNAMESE        // Full Vietnamese diacritics
// ... and more
```

### C. Reserved Username Patterns

```typescript
const RESERVED_USERNAME_PATTERNS = [
  // Exact matches
  /^admin$/i,
  /^moderator$/i,
  /^support$/i,
  /^topdog$/i,
  /^official$/i,
  
  // Patterns
  /^admin[_-]?\d*$/i,       // admin, admin1, admin_1
  /^mod[_-]?\d*$/i,         // mod, mod1, mod_1
  /^support[_-]?\d*$/i,     // support, support1
  /^.*support.*$/i,         // anything with support
  /^.*official.*$/i,        // anything with official
  /^.*topdog.*$/i,          // anything with topdog
  
  // Competitors
  /^underdog/i,
  /^draftkings/i,
  /^fanduel/i,
  /^sleeper/i,
  
  // Technical
  /^null$/i,
  /^undefined$/i,
  /^api$/i,
  /^www$/i,
];
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-01 | TopDog Team | Initial plan |

---

**STATUS: PLANNING COMPLETE - AWAITING APPROVAL TO BUILD**

