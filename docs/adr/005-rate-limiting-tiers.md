# ADR-005: Tiered Rate Limiting Strategy

**Status:** Accepted
**Date:** 2025-10-01
**Authors:** Engineering Team

## Context

The API serves three user tiers (free, pro, enterprise) with different usage allowances. Rate limiting must protect against abuse while allowing legitimate heavy usage by paying customers. Two dimensions:

1. **API rate limiting** — requests per time window (DoS protection)
2. **Generation rate limiting** — AI generation credits per day/month (cost control)

## Decision

### Layer 1: Per-IP Rate Limiting (All Routes)
- Implemented via Upstash Redis sliding window
- 60 requests/minute for authenticated users
- 20 requests/minute for unauthenticated users
- Applied by `rateLimitMiddleware` in the factory chain
- Returns `429 Too Many Requests` with `Retry-After` header

### Layer 2: Per-User Tier Rate Limiting (Generation Routes)
- Applied only to routes with `actionType: 'generate'`
- Limits by tier:
  - **Free:** 10 generations/day, 100/month
  - **Pro:** 100 generations/day, 2000/month
  - **Enterprise:** 500 generations/day, 10000/month
- Tracked in Firestore `users` document (`generationsToday`, `generationsThisMonth`)
- Reset via daily/monthly Cloud Functions or on first request after period change

### Layer 3: Firestore Write Throttling (Community Collections)
- Implemented in Firestore security rules using `user_write_timestamps`
- 60-second cooldown between community posts/chains
- 30-second cooldown between prompt submissions
- Prevents spam without server-side rate limit infrastructure

## Consequences

**Positive:**
- Three defense layers cover different attack vectors
- Paying users get proportionally more resources
- Firestore rules enforce throttling even if API is bypassed
- Redis-based rate limiting is fast (~1ms per check)

**Negative:**
- Three systems to maintain and keep in sync
- Tier changes require Firestore document updates (not instant)
- Firestore rules rate limiting requires extra document reads
- Redis failure degrades to no rate limiting (fail-open by design)

**Trade-offs:**
- Chose fail-open over fail-closed for rate limiting to prioritize availability
- Chose per-IP over per-session for unauthenticated rate limiting
- Chose Firestore over Redis for generation counts (consistency > speed for billing)
