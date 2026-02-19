# API Documentation

**Last Updated:** January 2025  
**Version:** 1.0  
**Base URL:** `https://your-domain.com/api`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [API Endpoints](#api-endpoints)
   - [Health & Monitoring](#health--monitoring)
   - [Authentication](#authentication-endpoints)
   - [Payments](#payments)
   - [NFL Data](#nfl-data)
   - [User Management](#user-management)
   - [Draft & Export](#draft--export)
   - [Performance](#performance)

---

## Overview

The BestBall API provides endpoints for managing users, payments, NFL data, drafts, and more. All endpoints return JSON responses and use standard HTTP status codes.

### Base URL

- **Production:** `https://your-domain.com/api`
- **Development:** `http://localhost:3000/api`

### API Versioning

- **Current Version:** v1
- **Versioned Endpoints:** `/api/v1/*`
- **Legacy Endpoints:** `/api/*` (backward compatible)

### Response Format

All successful responses follow this format:

```json
{
  "ok": true,
  "data": { /* response data */ },
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

Error responses follow this format:

```json
{
  "ok": false,
  "error": {
    "type": "ERROR_TYPE",
    "message": "Human-readable error message",
    "details": { /* additional error details */ }
  },
  "requestId": "req_1705320000_abc123",
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

---

## Authentication

Most endpoints require authentication via Firebase ID token.

### Authentication Header

```
Authorization: Bearer <firebase-id-token>
```

### Getting a Token

1. Authenticate with Firebase Auth
2. Get the ID token: `firebase.auth().currentUser.getIdToken()`
3. Include in `Authorization` header

### Unauthenticated Endpoints

- `GET /api/health`
- `GET /api/nfl/*` (public data)
- `POST /api/auth/signup`

---

## Error Handling

### Error Types

| Error Type | Status Code | Description |
|------------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `METHOD_NOT_ALLOWED` | 405 | HTTP method not allowed |
| `RATE_LIMIT` | 429 | Too many requests |
| `EXTERNAL_API_ERROR` | 502 | External service unavailable |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `STRIPE_ERROR` | 500 | Stripe API error |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

### Error Response Example

```json
{
  "ok": false,
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Missing required query parameters: userId",
    "details": {
      "missingParams": ["userId"]
    }
  },
  "requestId": "req_1705320000_abc123",
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

---

## Rate Limiting

Some endpoints have rate limiting to prevent abuse.

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705323600
```

### Rate Limit Response

When rate limit is exceeded:

```json
{
  "ok": false,
  "error": {
    "type": "RATE_LIMIT",
    "message": "Too many requests. Please try again later."
  },
  "retryAfter": 60
}
```

---

## API Endpoints

### Health & Monitoring

#### GET /api/health

Health check endpoint for monitoring.

**Authentication:** Not required

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-01-15T12:00:00.000Z",
  "uptime": 86400,
  "version": "1.0.0",
  "environment": "production",
  "responseTimeMs": 25.34,
  "checks": {
    "api": "ok"
  },
  "performance": {
    "memoryUsageMB": 125.5
  }
}
```

**Status Codes:**
- `200 OK` - Application is healthy
- `503 Service Unavailable` - Application is down or degraded

---

#### POST /api/performance/metrics

Submit performance metrics (Core Web Vitals).

**Authentication:** Not required

**Request Body:**

```json
{
  "lcp": 2500,
  "fid": 50,
  "cls": 0.05,
  "fcp": 1800,
  "ttfb": 800,
  "url": "https://your-domain.com/draft/room123",
  "deviceType": "mobile",
  "connectionType": "4g",
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "received": true,
    "metricsId": "perf_1705320000_abc123",
    "message": "Performance metrics recorded"
  },
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

---

### Authentication Endpoints

#### POST /api/auth/signup

Create a new user account.

**Authentication:** Not required

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "username",
  "countryCode": "US"
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "success": true,
    "userId": "firebase-uid",
    "username": "username"
  },
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

**Error Codes:**
- `USERNAME_TAKEN` - Username already exists
- `USERNAME_VIP_RESERVED` - Username reserved for VIP users
- `VALIDATION_ERROR` - Invalid input

---

#### POST /api/auth/username/change

Change username.

**Authentication:** Required

**Request Body:**

```json
{
  "newUsername": "newusername",
  "countryCode": "US"
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "success": true,
    "message": "Username changed successfully",
    "newUsername": "newusername",
    "cooldownInfo": {
      "cooldownDays": 30,
      "retryAfterDate": "2025-02-15T12:00:00.000Z"
    }
  },
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

**Error Codes:**
- `USERNAME_TAKEN` - Username already exists
- `USERNAME_CHANGED` - Username changed recently (cooldown active)

---

#### GET /api/auth/username/check

Check username availability.

**Authentication:** Not required

**Query Parameters:**
- `username` (required) - Username to check
- `countryCode` (required) - Country code (e.g., "US")

**Response:**

```json
{
  "ok": true,
  "data": {
    "isAvailable": true,
    "isReserved": false,
    "isSimilar": false
  },
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

---

### Payments

#### POST /api/stripe/payment-intent

Create a Stripe payment intent.

**Authentication:** Required

**Request Body:**

```json
{
  "amount": 10000,
  "currency": "usd",
  "paymentMethodId": "pm_1234567890",
  "metadata": {
    "userId": "firebase-uid",
    "draftId": "draft-123"
  }
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "clientSecret": "pi_1234567890_secret_abc",
    "paymentIntentId": "pi_1234567890",
    "status": "requires_confirmation"
  },
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

**Error Codes:**
- `STRIPE_ERROR` - Stripe API error
- `VALIDATION_ERROR` - Invalid amount or currency

---

#### POST /api/v1/stripe/payment-intent

Versioned endpoint for creating payment intents (same as above).

**Authentication:** Required

**Headers:**
- `API-Version: 1`

---

#### POST /api/stripe/customer

Create or retrieve Stripe customer.

**Authentication:** Required

**Request Body (POST):**

```json
{
  "userId": "firebase-uid"
}
```

**Query Parameters (GET):**
- `userId` (required) - Firebase user ID

**Response:**

```json
{
  "ok": true,
  "data": {
    "customerId": "cus_1234567890",
    "paymentMethods": [
      {
        "id": "pm_1234567890",
        "type": "card",
        "card": {
          "brand": "visa",
          "last4": "4242",
          "expMonth": 12,
          "expYear": 2025
        }
      }
    ]
  },
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

---

#### POST /api/stripe/webhook

Stripe webhook endpoint (handled by Stripe).

**Authentication:** Not required (verified via Stripe signature)

**Note:** This endpoint is called by Stripe, not by your application.

---

#### POST /api/paystack/initialize

Initialize Paystack payment.

**Authentication:** Required

**Request Body:**

```json
{
  "amount": 10000,
  "currency": "NGN",
  "email": "user@example.com",
  "reference": "ref_1234567890",
  "metadata": {
    "userId": "firebase-uid"
  }
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "authorizationUrl": "https://checkout.paystack.com/...",
    "accessCode": "access_code_123",
    "reference": "ref_1234567890"
  },
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

---

#### POST /api/paystack/webhook

Paystack webhook endpoint (handled by Paystack).

**Authentication:** Not required (verified via Paystack signature)

---

### NFL Data

#### GET /api/nfl/players

Get NFL players list.

**Authentication:** Not required

**Query Parameters:**
- `team` (optional) - Filter by team abbreviation
- `position` (optional) - Filter by position (QB, RB, WR, TE, etc.)

**Response:**

```json
{
  "ok": true,
  "data": {
    "players": [
      {
        "id": "player-123",
        "name": "Player Name",
        "position": "QB",
        "team": "BUF",
        "jerseyNumber": 12
      }
    ]
  },
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

---

#### GET /api/nfl/fantasy/rankings

Get fantasy football rankings.

**Authentication:** Not required

**Query Parameters:**
- `position` (optional) - Filter by position
- `format` (optional) - Response format (default: "json")

**Response:**

```json
{
  "ok": true,
  "data": {
    "rankings": [
      {
        "playerId": "player-123",
        "rank": 1,
        "position": "QB",
        "projectedPoints": 350.5
      }
    ]
  },
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

---

#### GET /api/nfl/fantasy/adp

Get Average Draft Position (ADP) data.

**Authentication:** Not required

**Query Parameters:**
- `position` (optional) - Filter by position

**Response:**

```json
{
  "ok": true,
  "data": {
    "adp": [
      {
        "playerId": "player-123",
        "adp": 5.2,
        "position": "QB",
        "round": 1
      }
    ]
  },
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

---

#### GET /api/nfl/scores

Get NFL game scores.

**Authentication:** Not required

**Query Parameters:**
- `week` (optional) - Week number (1-18)
- `season` (optional) - Season year (default: current season)

**Response:**

```json
{
  "ok": true,
  "data": {
    "games": [
      {
        "gameId": "game-123",
        "homeTeam": "BUF",
        "awayTeam": "KC",
        "homeScore": 24,
        "awayScore": 21,
        "status": "final",
        "week": 1
      }
    ]
  },
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

---

### User Management

#### GET /api/user/display-currency

Get user's display currency preference.

**Authentication:** Required

**Response:**

```json
{
  "ok": true,
  "data": {
    "currency": "USD",
    "symbol": "$",
    "exchangeRate": 1.0
  },
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

---

#### POST /api/user/display-currency

Update user's display currency preference.

**Authentication:** Required

**Request Body:**

```json
{
  "currency": "EUR"
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "currency": "EUR",
    "symbol": "€",
    "exchangeRate": 0.92
  },
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

---

### Draft & Export

#### GET /api/export/draft/:draftId

Export draft data.

**Authentication:** Required

**Path Parameters:**
- `draftId` (required) - Draft ID

**Query Parameters:**
- `format` (optional) - Export format (json, csv) (default: "json")

**Response:**

```json
{
  "ok": true,
  "data": {
    "draftId": "draft-123",
    "exportedAt": "2025-01-15T12:00:00.000Z",
    "data": { /* draft data */ }
  },
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

**Error Codes:**
- `NOT_FOUND` - Draft not found
- `FORBIDDEN` - User doesn't have access to this draft

---

### Performance

#### POST /api/performance/metrics

Submit performance metrics (Core Web Vitals).

**Authentication:** Not required

**Request Body:**

```json
{
  "lcp": 2500,
  "fid": 50,
  "cls": 0.05,
  "fcp": 1800,
  "ttfb": 800,
  "url": "https://your-domain.com/draft/room123",
  "deviceType": "mobile",
  "connectionType": "4g",
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "received": true,
    "metricsId": "perf_1705320000_abc123",
    "message": "Performance metrics recorded"
  },
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

---

## Additional Resources

- **API Versioning Policy:** See `docs/API_VERSIONING_POLICY.md`
- **API Route Template:** See `pages/api/_template.ts`
- **Error Handling Guide:** See `docs/API_ERROR_HANDLING.md`

---

## Support

For API support or questions:
- Review error messages and status codes
- Check request/response formats
- Verify authentication tokens
- Review rate limit headers

---

**Last Updated:** January 2025  
**API Version:** 1.0
