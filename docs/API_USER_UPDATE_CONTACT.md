# API: Update User Contact Information
**Endpoint:** `POST /api/user/update-contact`

---

## Overview

Updates a user's email or phone number. Users can only update their own contact information.

---

## Authentication

**Required:** Yes (Bearer token)

```bash
Authorization: Bearer <firebase-id-token>
```

---

## Request Body

```typescript
{
  userId: string;      // Required - User ID (must match authenticated user)
  email?: string;     // Optional - New email address
  phone?: string;     // Optional - New phone number
}
```

**Note:** At least one of `email` or `phone` must be provided.

---

## Response

### Success (200)
```json
{
  "ok": true,
  "data": {
    "userId": "user123",
    "email": "newemail@example.com",
    "phone": "+1234567890"
  }
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 403 Forbidden
```json
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied - can only update your own contact information"
  }
}
```

#### 400 Bad Request
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Either email or phone is required"
  }
}
```

---

## Validation Rules

### Email
- Must be valid email format: `user@domain.com`
- Email verification is reset when email is updated

### Phone
- Must contain at least 10 digits
- Phone verification is reset when phone is updated

---

## Example Usage

### Update Email
```typescript
const response = await fetch('/api/user/update-contact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`,
  },
  body: JSON.stringify({
    userId: 'user123',
    email: 'newemail@example.com',
  }),
});

const data = await response.json();
```

### Update Phone
```typescript
const response = await fetch('/api/user/update-contact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`,
  },
  body: JSON.stringify({
    userId: 'user123',
    phone: '+1234567890',
  }),
});
```

### Update Both
```typescript
const response = await fetch('/api/user/update-contact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`,
  },
  body: JSON.stringify({
    userId: 'user123',
    email: 'newemail@example.com',
    phone: '+1234567890',
  }),
});
```

---

## Security

- ✅ User can only update their own contact information
- ✅ Authentication token verified
- ✅ Input validation and sanitization
- ✅ Email/phone verification reset on update
- ✅ Structured logging for audit trail

---

## Testing

See: `__tests__/api/user/update-contact.test.ts`

Run tests:
```bash
npm test -- update-contact
```

---

**Status:** ✅ Implemented and ready to use
