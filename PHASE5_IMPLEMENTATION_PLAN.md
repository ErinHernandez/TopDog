# Phase 5: Data Routes - Implementation Plan

**Date:** January 2025  
**Status:** Planning  
**Target Coverage:** 60%+ for Tier 3 data routes  
**Plan Reference:** TEST_COVERAGE_PLAN_REFINED.md

---

## Objective

Phase 5 focuses on testing data fetching routes (Tier 3) that are read-only and return cached data. According to the refined plan, these routes should have 60%+ coverage with focus on error handling and caching behavior.

**Target Coverage:** 60%+  
**Realistic Effort:** 15-20 hours  
**Timeline:** 1 week

---

## Key Areas to Test (Tier 3 - 60%+ Coverage)

### NFL Data Routes

These routes are read-only, return cached data, and don't modify state. Focus should be on:
- Error handling (missing params, API failures, invalid data)
- Caching behavior (cache hits, cache misses, force refresh)
- Response format validation
- Rate limiting (if applicable)

### Priority Routes (Most Commonly Used)

1. **Season Stats** (`/api/nfl/stats/season.js`)
   - Most commonly used endpoint
   - Filtering (position, team, limit, sort)
   - Cache behavior (6 hours)
   - Error handling

2. **Single Player Stats** (`/api/nfl/stats/player.js`)
   - Player lookup by name
   - Season filtering
   - Cache behavior
   - Not found handling

3. **Projections** (`/api/nfl/projections.js`)
   - Player projections
   - Position filtering
   - Cache behavior
   - Error handling

4. **Game Scores** (`/api/nfl/scores.js`)
   - Week scores with filtering
   - Current week detection
   - Cache behavior (10 seconds during live)
   - Status filtering

5. **Fantasy ADP** (`/api/nfl/fantasy/adp.js`)
   - ADP data
   - Cache behavior
   - Error handling

---

## Test Strategy

1. **Error Handling Focus** - Test missing params, API failures, invalid data
2. **Caching Behavior** - Test cache hits, cache misses, force refresh
3. **Response Format** - Validate response structure
4. **Rate Limiting** - Test rate limit enforcement (if applicable)
5. **Realistic Scenarios** - Test actual usage patterns

---

## Approach

- **Unit/Integration Tests:** Mock external API calls (SportsDataIO)
- **Mocking:** Mock `lib/sportsdataio` functions
- **Error Cases:** Test API failures, missing data, invalid params
- **Caching:** Test cache behavior (if cache is exposed/testable)
- **Lightweight:** 60% coverage means focus on critical paths, not exhaustive coverage

---

## Success Criteria

✅ Error handling tested (missing params, API failures)  
✅ Caching behavior tested (if testable)  
✅ Response format validated  
✅ Rate limiting tested (if applicable)  
✅ Most common usage patterns covered  
✅ Tests pass linting  

---

**Status:** Planning → Ready to Implement
