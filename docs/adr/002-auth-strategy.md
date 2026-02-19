# ADR-002: Authentication Strategy

**Status:** Accepted
**Date:** 2025-10-01
**Authors:** Engineering Team

## Context

The application needs authentication for: API routes, client-side page access, Firestore rules, and Stripe customer identity. Options evaluated:

1. **Session cookies** — traditional, requires session store
2. **Firebase Auth + ID tokens** — managed service, JWT-based
3. **NextAuth.js** — framework-specific, multiple providers
4. **Custom JWT** — full control, high maintenance

## Decision

Use **Firebase Authentication** with ID tokens, verified server-side via Firebase Admin SDK.

### Client Side
- Firebase Auth SDK handles login (email/password, Google OAuth)
- `AuthProvider` React context wraps the app, provides `user` and `loading` state
- `ProtectedRoute` component redirects unauthenticated users to `/login`
- Protected pages also use `getServerSideProps` with token verification for SSR

### Server Side (API Routes)
- Client sends `Authorization: Bearer <idToken>` header
- `authMiddleware` verifies token via `admin.auth().verifyIdToken()`
- Decoded token provides `uid`, `email`, `emailVerified`
- User tier loaded from Firestore `users` collection for rate limit decisions

### Firestore Rules
- `request.auth.uid` used for all ownership checks
- Rules enforce `isOwner()` pattern: document's `userId` must match `request.auth.uid`

## Consequences

**Positive:**
- Firebase manages password hashing, email verification, OAuth flows
- ID tokens are short-lived JWTs (1 hour) — no session store needed
- Same auth identity used across API, Firestore, and Storage
- Google OAuth "just works" with Firebase

**Negative:**
- Vendor lock-in to Firebase Auth (migration would require re-implementing)
- ID token refresh requires client-side Firebase SDK loaded on every page
- Token verification adds ~50ms latency per API request
- Dev mode requires Firebase emulators or mock auth

**Mitigations:**
- Auth logic abstracted behind `AuthProvider` — swappable
- Dev mode uses Firebase Auth emulator (not hardcoded credentials)
- Token verification cached per-request via middleware chain
