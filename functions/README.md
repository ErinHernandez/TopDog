# Firebase Functions - Draft Alerts

This directory contains Firebase Cloud Functions for server-side push notification delivery.

## Setup

1. **Install dependencies:**
   ```bash
   cd functions
   npm install
   ```

2. **Build TypeScript:**
   ```bash
   npm run build
   ```

3. **Deploy functions:**
   ```bash
   npm run deploy
   ```

## Functions

### `onDraftUpdate`

Firestore trigger that fires when a draft document is updated. Automatically sends push notifications to users when:
- Draft room is filled
- Draft starts
- User's turn begins (on the clock)

**Trigger:** `drafts/{draftId}` document updates

**Reliability:** Server-side execution ensures notifications are sent even if the triggering user goes offline.

## Configuration

The functions use Firebase Admin SDK which is automatically initialized with your Firebase project credentials.

## Testing

Test locally with Firebase Emulators:

```bash
npm run serve
```

## Deployment

Deploy to Firebase:

```bash
npm run deploy
```

View logs:

```bash
npm run logs
```
