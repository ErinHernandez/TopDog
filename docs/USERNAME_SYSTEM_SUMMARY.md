# Username System Summary

**Last Updated:** January 2026  
**Status:** Production-Ready  
**Quick Reference:** Development guide for the TopDog username system

---

## Executive Summary

The TopDog username system provides enterprise-grade username management with:
- **Format Validation**: 3-18 characters, country-specific character support
- **Atomic Reservations**: Firestore transactions prevent race conditions
- **VIP System**: Firestore-backed reservations for influencers/partners
- **Real-time UX**: Debounced validation with availability checking
- **Security**: Rate limiting, timing attack prevention, audit trails
- **Advanced Features**: Suggestions, similarity detection, change cooldowns

**Key Constraint**: Usernames are stored **lowercase** (case-insensitive matching)

---

## System Architecture

### Data Flow

```
User Input → UsernameInput Component
    │
    ├─► Real-time Validation (300ms debounce)
    │   └─► validateUsername() - format check
    │
    └─► Availability Check (500ms debounce)
        └─► /api/auth/username/check
            ├─► Check VIP reservations (Firestore)
            ├─► Check existing users (Firestore)
            └─► Generate suggestions if taken

User Submits → /api/auth/signup
    │
    └─► Atomic Transaction
        ├─► Validate format & country
        ├─► Check users collection
        ├─► Check VIP reservations
        ├─► Create user profile
        └─► Return success/error
```

### Core Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **Validation Library** | Format & availability checking | `lib/usernameValidation.js` |
| **API: Signup** | User registration with username | `pages/api/auth/signup.js` |
| **API: Check** | Availability checking | `pages/api/auth/username/check.js` |
| **API: Change** | Username changes (cooldown) | `pages/api/auth/username/change.js` |
| **API: Reserve** | VIP reservations (admin) | `pages/api/auth/username/reserve.js` |
| **React Hook** | Real-time validation | `components/vx2/auth/hooks/useUsernameValidation.ts` |
| **React Component** | Username input field | `components/vx2/auth/components/UsernameInput.tsx` |
| **Suggestions** | Generate alternatives | `lib/usernameSuggestions.js` |
| **Similarity** | Lookalike detection | `lib/usernameSimilarity.js` |
| **Change Policy** | Cooldown enforcement | `lib/usernameChangePolicy.js` |
| **Locale Support** | Country character sets | `lib/localeCharacters.js` |

---

## Validation Rules

### Format Constraints

- **Length**: 3-18 characters
- **Start**: Must begin with a letter (a-z, A-Z, or locale-specific)
- **Characters**: Alphanumeric + underscore + locale-specific characters
- **Restrictions**: 
  - No spaces
  - No consecutive underscores (`__`)
  - No reserved usernames (admin, moderator, topdog, etc.)

### Locale Support

Country-specific character validation:
- **6 Approved Countries**: IE, DE, MX, BR, SG, NZ
- **Character Sets**: Extended Latin, accents, umlauts
- **Mixing**: Users can mix locale characters with standard Western alphabet

Example valid usernames:
- `François2023` (French with accent + numbers)
- `Müller` (German umlaut)
- `José123` (Spanish accent + numbers)

### Reserved Usernames

System prevents registration of:
```
admin, administrator, root, system, bot
moderator, mod, support, help, info
api, www, web, app, mobile
topdog, top_dog, top-dog, topdogfantasy
bestball, best_ball, best-ball
test, null, undefined, anonymous
deleted, banned, suspended
```

---

## Database Schema

### Users Collection (`/users/{uid}`)

```typescript
{
  uid: string;                    // Firebase UID (document ID)
  username: string;               // Normalized (lowercase)
  email: string | null;
  countryCode: string;            // ISO 3166-1 alpha-2
  displayName: string;
  
  // Username change tracking
  previousUsername?: string;
  lastUsernameChange?: Timestamp;
  usernameChangeCount?: number;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLogin: Timestamp;
  isActive: boolean;
  profileComplete: boolean;
  
  // Stats
  tournamentsEntered: number;
  tournamentsWon: number;
  totalWinnings: number;
  bestFinish: number | null;
  
  // Preferences
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    publicProfile: boolean;
    borderColor: string;
  };
}
```

### VIP Reservations (`/vip_reservations/{id}`)

```typescript
{
  id: string;                     // `vip_{username}_{timestamp}`
  username: string;               // Normalized (lowercase)
  usernameLower: string;          // Duplicate for querying
  reservedFor: string;            // VIP identifier/name
  reservedBy: string;             // Admin UID
  reservedByEmail?: string;       // Admin email
  reservedAt: Timestamp;
  expiresAt: Timestamp | null;    // null = never expires
  claimed: boolean;
  claimedBy: string | null;       // User UID who claimed
  claimedAt: Timestamp | null;
  priority: 'normal' | 'high' | 'critical';
  notes: string;
}
```

### Username Change Audit (`/username_change_audit/{id}`)

```typescript
{
  id: string;                     // `${uid}_${timestamp}`
  uid: string;
  oldUsername: string;
  newUsername: string;
  changeType: 'vip_merge' | 'user_request' | 'admin_override';
  changedBy: string;              // User/Admin UID
  changedAt: Timestamp;
  reason: string;
  metadata: {
    changeCount: number;
    countryCode: string;
  };
}
```

### Firestore Indexes

**Users Collection:**
- `username` (ASC) - For availability checks
- `countryCode` + `createdAt` (DESC) - User listings
- `isActive` + `lastLogin` (DESC) - Active users

**VIP Reservations:**
- `usernameLower` + `claimed` (ASC) - Unclaimed reservations
- `claimed` + `expiresAt` (ASC) - Expired cleanup

---

## API Endpoints

### POST `/api/auth/signup`

Creates a new user account with username reservation.

**Request:**
```typescript
{
  uid: string;              // Firebase UID
  username: string;         // Desired username
  email?: string;
  countryCode?: string;     // Default: 'US'
  displayName?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  user?: UserProfile;
  error?: string;           // 'USERNAME_TAKEN' | 'USERNAME_VIP_RESERVED' | ...
}
```

**Features:**
- ✅ Atomic transaction (prevents race conditions)
- ✅ Rate limited (3 requests/minute)
- ✅ Timing attack prevention
- ✅ Validates country code

---

### POST `/api/auth/username/check`

Checks username availability in real-time.

**Request:**
```typescript
{
  username: string;
  countryCode?: string;     // Default: 'US'
}
```

**Response:**
```typescript
{
  isAvailable: boolean;
  message: string;
  isVIPReserved?: boolean;
  reservedFor?: string;     // If VIP reserved
  suggestions?: string[];   // If unavailable
  warnings?: string[];      // Similarity warnings
  errors?: string[];        // Format errors
}
```

**Features:**
- ✅ Rate limited (30 checks/minute per IP)
- ✅ Generates suggestions when taken
- ✅ Similarity detection warnings
- ✅ Consistent timing (prevents enumeration)

---

### POST `/api/auth/username/change`

Changes a user's username (respects cooldown).

**Request:**
```typescript
{
  newUsername: string;
  countryCode?: string;
}
Headers: { Authorization: 'Bearer <token>' }
```

**Response:**
```typescript
{
  success: boolean;
  username?: string;
  previousUsername?: string;
  cooldownInfo?: {
    cooldownDays: number;
    retryAfterDate?: string;
  };
  error?: string;           // 'COOLDOWN_ACTIVE' | 'USERNAME_TAKEN' | ...
}
```

**Cooldown Rules:**
- **Default**: 90 days between changes
- **Whales**: 30 days (150+ tournament entries)
- **First Change**: Free, but 90-day cooldown applies

**Features:**
- ✅ Requires authentication
- ✅ Enforces cooldown policy
- ✅ Atomic transaction
- ✅ Audit trail creation
- ✅ Rate limited (3 requests/minute)

---

### POST `/api/auth/username/reserve`

Reserves a username for VIP (admin only).

**Request:**
```typescript
{
  username: string;
  reservedFor: string;      // VIP identifier/name
  expiresInDays?: number;   // Default: 90
  priority?: 'normal' | 'high' | 'critical';
  notes?: string;
}
Headers: { Authorization: 'Bearer <admin-token>' }
```

**Response:**
```typescript
{
  success: boolean;
  reservation?: {
    id: string;
    username: string;
    reservedFor: string;
    expiresAt: string | null;
    priority: string;
  };
  error?: string;
}
```

**Features:**
- ✅ Admin authentication required
- ✅ Checks existing reservations
- ✅ Audit logging
- ✅ Rate limited

---

## Security Features

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/signup` | 3 requests | 1 minute |
| `/api/auth/username/check` | 30 requests | 1 minute per IP |
| `/api/auth/username/change` | 3 requests | 1 minute |
| `/api/auth/username/reserve` | Admin-specific | Configurable |

### Race Condition Prevention

**Atomic Transactions**: All username reservations use Firestore transactions to prevent simultaneous claims of the same username.

```javascript
// In pages/api/auth/signup.js
await runTransaction(db, async (transaction) => {
  // Check availability
  // Create user profile
  // All atomic
});
```

### Timing Attack Prevention

All endpoints use minimum response times to prevent enumeration:
- Username check: 100ms minimum
- Signup: 150ms minimum

### Input Sanitization

- Automatic lowercase normalization
- Trim whitespace
- Character validation against allowed sets
- Reserved word filtering

---

## Frontend Components

### UsernameInput Component

**Location:** `components/vx2/auth/components/UsernameInput.tsx`

**Usage:**
```tsx
<UsernameInput
  value={username}
  onChange={setUsername}
  countryCode="US"
  onValidation={(result) => console.log(result)}
  onAvailability={(result) => console.log(result)}
  showRequirements={true}
/>
```

**Features:**
- Real-time validation feedback
- Visual status indicators (idle/loading/valid/invalid)
- Suggestions display when unavailable
- Similarity warnings
- Accessibility (ARIA labels)

---

### useUsernameValidation Hook

**Location:** `components/vx2/auth/hooks/useUsernameValidation.ts`

**Usage:**
```tsx
const {
  username,
  setUsername,
  validation,
  availability,
  isValid,
  isAvailable,
  canSubmit,
  errorMessage,
  isValidating,
  isCheckingAvailability,
} = useUsernameValidation({
  countryCode: 'US',
  validationDebounce: 300,    // ms
  availabilityDebounce: 500,   // ms
  autoCheckAvailability: true,
});
```

**Return Values:**
- `validation`: Format validation result
- `availability`: Server availability check result
- `canSubmit`: `isValid && isAvailable && !isValidating`
- `errorMessage`: Combined error message

**Debounce Strategy:**
- Format validation: 300ms delay
- Availability check: 500ms delay (only if format valid)

---

## Key Functions Reference

### Validation Functions

**`validateUsername(username, countryCode, options)`**
```javascript
import { validateUsername } from 'lib/usernameValidation';

const result = validateUsername('johndoe123', 'US');
// Returns: { isValid: boolean, errors: string[] }
```

**`checkUsernameAvailability(username, options)`**
```javascript
import { checkUsernameAvailability } from 'lib/usernameValidation';

const result = await checkUsernameAvailability('johndoe');
// Returns: { isAvailable: boolean, message: string, ... }
```

**`getUsernameRequirements(countryCode)`**
```javascript
import { getUsernameRequirements } from 'lib/usernameValidation';

const reqs = getUsernameRequirements('FR');
// Returns: { minLength, maxLength, allowedCharacters, description, rules }
```

---

### Username Suggestions

**`generateUsernameSuggestions(baseUsername, maxSuggestions)`**
```javascript
import { generateUsernameSuggestions } from 'lib/usernameSuggestions';

const suggestions = await generateUsernameSuggestions('johndoe', 3);
// Returns: ['johndoe1', 'johndoe2', 'johndoe3'] (if available)
```

**Strategy**: Appends numbers (1, 2, 3...) or higher numbers if low ones taken.

---

### Similarity Detection

**`findSimilarUsernames(username, maxResults)`**
```javascript
import { findSimilarUsernames } from 'lib/usernameSimilarity';

const similar = await findSimilarUsernames('johndoe', 3);
// Returns: ['j0hndoe', 'johnd0e'] if they exist
```

**Detection**: Uses Levenshtein distance + character substitution (O↔0, l↔1, etc.)

---

### Username Change Policy

**`usernameChangePolicy.canChangeUsername(uid)`**
```javascript
import { usernameChangePolicy } from 'lib/usernameChangePolicy';

const canChange = await usernameChangePolicy.canChangeUsername(uid);
// Returns: { allowed: boolean, retryAfterDays?: number, reason?: string }
```

**Cooldowns:**
- Default: 90 days
- Whales (150+ entries): 30 days
- First change: Allowed, but cooldown applies

---

### VIP Functions

**`reserveUsernameForVIP(options)`**
```javascript
import { reserveUsernameForVIP } from 'lib/usernameValidation';

const result = await reserveUsernameForVIP({
  username: 'celebrity',
  reservedFor: 'John Celebrity',
  reservedBy: 'admin-uid',
  expiresAt: new Date('2026-12-31'),
});
```

**`checkVIPReservation(username)`**
```javascript
import { checkVIPReservation } from 'lib/usernameValidation';

const check = await checkVIPReservation('celebrity');
// Returns: { isReserved: boolean, reservation?: VIPReservation }
```

---

## Common Operations

### Check if Username is Available

```javascript
// Client-side (API call)
const response = await fetch('/api/auth/username/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'johndoe', countryCode: 'US' }),
});
const { isAvailable, suggestions } = await response.json();

// Server-side (library)
const availability = await checkUsernameAvailability('johndoe');
```

---

### Validate Username Format

```javascript
// Client-side or server-side
const validation = validateUsername('johndoe123', 'US');
if (!validation.isValid) {
  console.error(validation.errors);
}
```

---

### Change Username (with Auth)

```javascript
const response = await fetch('/api/auth/username/change', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`,
  },
  body: JSON.stringify({
    newUsername: 'newusername',
    countryCode: 'US',
  }),
});

const result = await response.json();
if (!result.success) {
  console.error(result.error); // 'COOLDOWN_ACTIVE' | 'USERNAME_TAKEN' | ...
}
```

---

### Reserve Username for VIP (Admin)

```javascript
const response = await fetch('/api/auth/username/reserve', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`,
  },
  body: JSON.stringify({
    username: 'celebrity',
    reservedFor: 'John Celebrity - Influencer',
    expiresInDays: 90,
    priority: 'high',
    notes: 'Partnership deal',
  }),
});
```

---

## File Quick Reference

| File | Purpose | Key Exports |
|------|---------|-------------|
| `lib/usernameValidation.js` | Core validation | `validateUsername`, `checkUsernameAvailability`, `reserveUsernameForVIP` |
| `lib/usernameSuggestions.js` | Generate alternatives | `generateUsernameSuggestions` |
| `lib/usernameSimilarity.js` | Lookalike detection | `findSimilarUsernames`, `generateSimilarityWarnings` |
| `lib/usernameChangePolicy.js` | Cooldown enforcement | `usernameChangePolicy` |
| `lib/localeCharacters.js` | Country character sets | `getAllowedCharacters`, `getLocaleDescription`, `isApprovedCountry` |
| `pages/api/auth/signup.js` | User registration | POST handler |
| `pages/api/auth/username/check.js` | Availability check | POST handler |
| `pages/api/auth/username/change.js` | Username change | POST handler (auth required) |
| `pages/api/auth/username/reserve.js` | VIP reservation | POST handler (admin only) |
| `components/vx2/auth/components/UsernameInput.tsx` | Input component | `UsernameInput` |
| `components/vx2/auth/hooks/useUsernameValidation.ts` | React hook | `useUsernameValidation` |

---

## Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Format Validation | ✅ Complete | 3-18 chars, locale support |
| Availability Checking | ✅ Complete | Rate limited, atomic |
| VIP Reservations | ✅ Complete | Firestore-backed |
| Username Suggestions | ✅ Complete | Number appending strategy |
| Similarity Detection | ✅ Complete | Levenshtein + lookalikes |
| Username Changes | ✅ Complete | 90-day cooldown enforced |
| Rate Limiting | ✅ Complete | All endpoints protected |
| Timing Attack Prevention | ✅ Complete | Minimum response times |
| Atomic Transactions | ✅ Complete | Race condition prevention |
| Audit Trail | ✅ Complete | All changes logged |
| Locale Support | ✅ Partial | 6 countries approved |

---

## Important Notes

1. **Case-Insensitive**: Usernames stored lowercase, matching is case-insensitive
2. **Atomic Operations**: All username reservations use Firestore transactions
3. **VIP System**: Uses Firestore only (no in-memory state)
4. **Cooldowns**: First change is free but still has cooldown period
5. **Whale Benefits**: Users with 150+ tournament entries get 30-day cooldown
6. **Suggestions**: Generated on-demand when username is unavailable
7. **Similarity**: Warnings only (doesn't block registration)

---

## Related Documentation

- **Detailed Research**: `docs/USERNAME_SYSTEM_RESEARCH.md` - Comprehensive analysis, best practices, trade-offs
- **User Registration**: `USER_REGISTRATION_README.md` - Registration flow documentation
- **Signup System Plan**: `docs/USER_SIGNUP_SYSTEM_PLAN.md` - Architecture planning

---

**Quick Links:**
- Core Validation: [`lib/usernameValidation.js`](../lib/usernameValidation.js)
- Signup API: [`pages/api/auth/signup.js`](../pages/api/auth/signup.js)
- Username Input: [`components/vx2/auth/components/UsernameInput.tsx`](../components/vx2/auth/components/UsernameInput.tsx)
