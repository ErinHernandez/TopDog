# Stripe Webhook Event Tracking

**Date:** January 12, 2025  
**Status:** ✅ **IMPLEMENTED**  
**Files:** `lib/stripe/stripeService.ts`, `pages/api/stripe/webhook.ts`

---

## Overview

Comprehensive event tracking system for Stripe webhooks to ensure idempotency, prevent duplicate processing, and enable error recovery.

---

## Features

### Event Tracking
- **Idempotency** - Prevents duplicate processing of the same event
- **Status Tracking** - Tracks event status (pending, processed, failed)
- **Retry Count** - Tracks retry attempts for failed events
- **Error Tracking** - Stores error messages for failed events
- **Metadata** - Stores event metadata for debugging

### Event Lifecycle
1. **Event Received** - Create/update event record as 'pending'
2. **Event Processed** - Mark as 'processed' with timestamp
3. **Event Failed** - Mark as 'failed' with error message and increment retry count

---

## Event Tracking Functions

### `findEventByStripeId(stripeEventId: string)`

Find webhook event by Stripe event ID.

```typescript
const event = await findEventByStripeId('evt_1234567890');
if (event?.status === 'processed') {
  // Event already processed, skip
}
```

**Returns:**
- `StripeWebhookEvent | null` - Event record or null if not found

---

### `createOrUpdateWebhookEvent(stripeEventId, eventType, metadata?)`

Create or update webhook event record for tracking.

```typescript
await createOrUpdateWebhookEvent(
  event.id,
  event.type,
  {
    livemode: event.livemode,
    apiVersion: event.api_version,
  }
);
```

**Parameters:**
- `stripeEventId` (string) - Stripe event ID
- `eventType` (string) - Event type (e.g., 'payment_intent.succeeded')
- `metadata` (optional) - Additional metadata

**Returns:**
- `StripeWebhookEvent` - Event record

---

### `markEventAsProcessed(stripeEventId, metadata?)`

Mark webhook event as successfully processed.

```typescript
await markEventAsProcessed(event.id, {
  eventType: event.type,
  actions: result.actions,
});
```

**Parameters:**
- `stripeEventId` (string) - Stripe event ID
- `metadata` (optional) - Additional metadata to store

**Side Effects:**
- Sets `status` to 'processed'
- Sets `processedAt` timestamp
- Updates `updatedAt` timestamp

---

### `markEventAsFailed(stripeEventId, errorMessage, metadata?)`

Mark webhook event as failed with error message.

```typescript
await markEventAsFailed(
  event.id,
  err.message,
  {
    eventType: event.type,
    errorStack: err.stack,
  }
);
```

**Parameters:**
- `stripeEventId` (string) - Stripe event ID
- `errorMessage` (string) - Error message
- `metadata` (optional) - Additional metadata

**Side Effects:**
- Sets `status` to 'failed'
- Sets `failedAt` timestamp
- Increments `retryCount`
- Stores `errorMessage`
- Updates `updatedAt` timestamp

---

## Event Schema

### StripeWebhookEvent Interface

```typescript
interface StripeWebhookEvent {
  id: string;                    // Firestore document ID
  stripeEventId: string;         // Stripe event ID (evt_xxx)
  eventType: string;             // Event type (e.g., 'payment_intent.succeeded')
  status: 'pending' | 'processed' | 'failed';
  processedAt?: string;          // ISO timestamp when processed
  failedAt?: string;             // ISO timestamp when failed
  errorMessage?: string;         // Error message if failed
  retryCount: number;            // Number of retry attempts
  createdAt: string;             // ISO timestamp when created
  updatedAt: string;             // ISO timestamp of last update
  metadata?: Record<string, unknown>; // Additional metadata
}
```

**Firestore Collection:** `stripe_webhook_events`

**Index Required:**
- `stripeEventId` (for fast lookups)

---

## Webhook Handler Integration

### Idempotency Check

```typescript
// Check for duplicate event before processing
const existingEvent = await findEventByStripeId(event.id);
if (existingEvent?.status === 'processed') {
  // Return early - already processed
  return { success: true, actions: ['already_processed'] };
}
```

### Event Tracking

```typescript
// Create/update event record before processing
await createOrUpdateWebhookEvent(event.id, event.type, {
  livemode: event.livemode,
  apiVersion: event.api_version,
});
```

### Success Handling

```typescript
// Mark event as processed after successful handling
if (result.success) {
  await markEventAsProcessed(event.id, {
    eventType: event.type,
    actions: result.actions,
  });
}
```

### Error Handling

```typescript
// Mark event as failed on error
catch (error) {
  await markEventAsFailed(event.id, error.message, {
    eventType: event.type,
    errorStack: error.stack,
  });
  throw error;
}
```

---

## Benefits

### Idempotency
- Prevents duplicate processing of the same event
- Safe to retry webhook processing
- Prevents double-balance credits/debits

### Error Recovery
- Tracks failed events with error messages
- Retry count enables smart retry logic
- Failed events can be reprocessed manually

### Audit Trail
- Complete history of all webhook events
- Processing timestamps for debugging
- Error tracking for failed events

### Monitoring
- Track event processing success rate
- Monitor retry patterns
- Identify problematic events

---

## Usage Example

```typescript
// In webhook handler
export default async function handler(req, res) {
  const event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  
  // Check if already processed
  const existingEvent = await findEventByStripeId(event.id);
  if (existingEvent?.status === 'processed') {
    return res.status(200).json({ received: true, already_processed: true });
  }
  
  // Create event record
  await createOrUpdateWebhookEvent(event.id, event.type);
  
  try {
    // Process event
    const result = await processEvent(event);
    
    // Mark as processed
    if (result.success) {
      await markEventAsProcessed(event.id);
    } else {
      await markEventAsFailed(event.id, result.error);
    }
    
    return res.status(200).json({ received: true, ...result });
  } catch (error) {
    // Mark as failed
    await markEventAsFailed(event.id, error.message);
    return res.status(200).json({ received: true, error: error.message });
  }
}
```

---

## Monitoring Queries

### Failed Events

```javascript
// Get all failed events
const failedEvents = await getDocs(
  query(
    collection(db, 'stripe_webhook_events'),
    where('status', '==', 'failed')
  )
);
```

### Retry Count

```javascript
// Get events with multiple retries
const retryEvents = await getDocs(
  query(
    collection(db, 'stripe_webhook_events'),
    where('retryCount', '>', 3)
  )
);
```

### Recent Events

```javascript
// Get events processed in last hour
const recentEvents = await getDocs(
  query(
    collection(db, 'stripe_webhook_events'),
    where('processedAt', '>=', oneHourAgo)
  )
);
```

---

## Firestore Index

**Required Index:**
- Collection: `stripe_webhook_events`
- Fields: `stripeEventId` (Ascending)

**Create Index:**
```bash
# Using Firebase Console or CLI
firebase firestore:indexes
```

---

## Error Scenarios

### Duplicate Event
- **Detection:** Event already exists with status 'processed'
- **Action:** Return early, skip processing
- **Logging:** Log duplicate event detection

### Processing Failure
- **Detection:** Exception thrown during processing
- **Action:** Mark event as failed, increment retry count
- **Logging:** Log error with full context

### Network Failure
- **Detection:** Database write fails (markEventAsProcessed)
- **Action:** Continue processing (graceful degradation)
- **Logging:** Log tracking failure but don't fail webhook

---

## Related Documentation

- `lib/stripe/stripeService.ts` - Service implementation
- `pages/api/stripe/webhook.ts` - Webhook handler
- `docs/PAYMENT_ENHANCEMENTS_2025.md` - Payment enhancements summary

---

**Implementation Date:** January 12, 2025  
**Status:** ✅ **PRODUCTION READY**
