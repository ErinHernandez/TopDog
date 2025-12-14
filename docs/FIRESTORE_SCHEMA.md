# Firestore Schema Design

## Overview

This document defines the Firestore database structure for the TopDog draft platform.

**Scale Requirements:**
- 47,000 drafts over 4 months
- 570,000 user teams
- 150 max entries per user
- Global users (latency considerations)

---

## Collections

### 1. `/drafts/{draftId}`

The main draft document. One per draft room.

```typescript
interface Draft {
  // Identity
  id: string;                    // Auto-generated
  tournamentId: string;          // Reference to tournament
  
  // Draft Configuration
  draftType: 'fast' | 'slow';    // CRITICAL for ADP calculation
  pickTimeSeconds: number;       // 30 for fast, 43200 (12h) for slow
  numTeams: number;              // Usually 12
  numRounds: number;             // Usually 18
  snakeOrder: boolean;           // true for snake drafts
  
  // State
  status: 'scheduled' | 'filling' | 'active' | 'paused' | 'completed' | 'cancelled';
  currentPickNumber: number;     // 1-216
  currentPickDeadline: Timestamp;// When current pick expires
  
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
  oderserId: number;              // 0-11 (draft position)
  oderserId: string;               // Reference to user
  username: string;               // Denormalized for display
  isConnected: boolean;           // Real-time presence
  lastSeenAt: Timestamp;
  autopickEnabled: boolean;
}
```

**Indexes needed:**
- `draftType` + `status` + `createdAt` (for ADP queries)
- `tournamentId` + `status`
- `participants.userId` + `status`

---

### 2. `/drafts/{draftId}/picks/{pickNumber}`

Individual picks as subcollection. Enables real-time listeners on specific picks.

```typescript
interface Pick {
  // Identity
  pickNumber: number;            // 1-216 (also the document ID)
  
  // The Pick
  playerId: string;              // Reference to player (e.g., 'chase_jamarr')
  participantIndex: number;      // 0-11 (who made the pick)
  userId: string;                // User who made the pick
  
  // Context
  roundNumber: number;           // 1-18
  pickInRound: number;           // 1-12
  
  // Timing
  timestamp: Timestamp;          // When pick was made
  timeUsedSeconds: number;       // How long they took
  wasAutopick: boolean;          // Timer expired or manual autopick
  
  // Denormalized for queries (avoids joins)
  draftType: 'fast' | 'slow';    // Copied from parent draft
  tournamentId: string;          // Copied from parent draft
}
```

**Why subcollection?**
- Real-time listeners can watch specific picks
- Atomic writes within a draft
- Natural ordering by pickNumber

---

### 3. `/picks_flat/{pickId}`

**Denormalized flat collection for ADP queries.** 

This is a copy of pick data optimized for cross-draft queries.

```typescript
interface PickFlat {
  // Identity
  id: string;                    // `${draftId}_${pickNumber}`
  draftId: string;
  pickNumber: number;
  
  // The Pick
  playerId: string;
  
  // For ADP calculation
  draftType: 'fast' | 'slow';    // INDEXED - critical for filtering
  timestamp: Timestamp;          // INDEXED - for recency queries
  
  // Optional context
  tournamentId?: string;
  userId?: string;
}
```

**Why a flat collection?**
- Firestore can't query across subcollections efficiently
- ADP calculation needs: "all picks where draftType='fast' AND timestamp > 30 days ago"
- This flat structure enables that query

**Indexes needed:**
- `draftType` + `timestamp` (compound, descending timestamp)
- `playerId` + `draftType` + `timestamp`

---

### 4. `/tournaments/{tournamentId}`

Tournament configuration.

```typescript
interface Tournament {
  id: string;
  name: string;
  entryFee: number;
  prizePool: number;
  maxEntries: number;
  currentEntries: number;
  
  draftType: 'fast' | 'slow';    // All drafts in tournament use same type
  
  status: 'upcoming' | 'filling' | 'active' | 'completed';
  
  // Scheduling
  draftWindowStart: Timestamp;   // When drafts can begin
  draftWindowEnd: Timestamp;     // When all drafts must complete
  
  createdAt: Timestamp;
}
```

---

### 5. `/users/{userId}`

User profile and preferences.

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  
  // Draft preferences
  defaultAutopickEnabled: boolean;
  queuedPlayers: string[];       // Player IDs in queue order
  
  // Stats
  totalDrafts: number;
  totalTeams: number;
  
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
}
```

---

### 6. `/users/{userId}/teams/{teamId}`

User's drafted teams.

```typescript
interface Team {
  id: string;                    // Same as draftId
  
  tournamentId: string;
  tournamentName: string;        // Denormalized
  
  draftType: 'fast' | 'slow';
  
  // Roster (denormalized for quick access)
  roster: TeamPlayer[];
  
  // Status
  status: 'drafting' | 'active' | 'eliminated' | 'won';
  
  // Results
  totalPoints?: number;
  rank?: number;
  payout?: number;
  
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

interface TeamPlayer {
  playerId: string;
  name: string;
  position: string;
  team: string;
  pickNumber: number;
}
```

---

## Query Patterns

### ADP Calculation (runs 1-2x daily)

```javascript
// Get all fast draft picks from last 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const picks = await db.collection('picks_flat')
  .where('draftType', '==', 'fast')
  .where('timestamp', '>', thirtyDaysAgo)
  .get();

// Group by playerId and calculate ADP
const picksByPlayer = {};
picks.forEach(doc => {
  const pick = doc.data();
  if (!picksByPlayer[pick.playerId]) {
    picksByPlayer[pick.playerId] = [];
  }
  picksByPlayer[pick.playerId].push(pick.pickNumber);
});
```

### Real-time Draft Room

```javascript
// Listen to all picks in a draft
const unsubscribe = db.collection('drafts')
  .doc(draftId)
  .collection('picks')
  .orderBy('pickNumber')
  .onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        // New pick made
        handleNewPick(change.doc.data());
      }
    });
  });
```

### User's Active Drafts

```javascript
// Get user's active drafts
const drafts = await db.collection('drafts')
  .where('participants', 'array-contains', { userId: currentUserId })
  .where('status', 'in', ['active', 'paused'])
  .get();
```

### User's Teams

```javascript
// Get user's teams (uses subcollection, no cross-collection query)
const teams = await db.collection('users')
  .doc(userId)
  .collection('teams')
  .orderBy('createdAt', 'desc')
  .get();
```

---

## Write Patterns

### Making a Pick

```javascript
async function makePick(draftId, pickNumber, playerId, userId, participantIndex) {
  const batch = db.batch();
  const now = Timestamp.now();
  
  // 1. Get draft to check state and get draftType
  const draftRef = db.collection('drafts').doc(draftId);
  const draft = await draftRef.get();
  const draftData = draft.data();
  
  // 2. Validate it's the right pick number
  if (draftData.currentPickNumber !== pickNumber) {
    throw new Error('Not the current pick');
  }
  
  // 3. Write to picks subcollection
  const pickRef = draftRef.collection('picks').doc(pickNumber.toString());
  const pickData = {
    pickNumber,
    playerId,
    participantIndex,
    userId,
    roundNumber: Math.ceil(pickNumber / draftData.numTeams),
    pickInRound: ((pickNumber - 1) % draftData.numTeams) + 1,
    timestamp: now,
    timeUsedSeconds: calculateTimeUsed(draftData.currentPickDeadline, now),
    wasAutopick: false,
    draftType: draftData.draftType,
    tournamentId: draftData.tournamentId,
  };
  batch.set(pickRef, pickData);
  
  // 4. Write to flat collection for ADP queries
  const flatRef = db.collection('picks_flat').doc(`${draftId}_${pickNumber}`);
  batch.set(flatRef, {
    id: `${draftId}_${pickNumber}`,
    draftId,
    pickNumber,
    playerId,
    draftType: draftData.draftType,
    timestamp: now,
    tournamentId: draftData.tournamentId,
    userId,
  });
  
  // 5. Update draft state
  const nextPickNumber = pickNumber + 1;
  const totalPicks = draftData.numTeams * draftData.numRounds;
  
  if (nextPickNumber > totalPicks) {
    // Draft complete
    batch.update(draftRef, {
      currentPickNumber: nextPickNumber,
      status: 'completed',
      completedTime: now,
      updatedAt: now,
    });
  } else {
    // Advance to next pick
    batch.update(draftRef, {
      currentPickNumber: nextPickNumber,
      currentPickDeadline: calculateDeadline(now, draftData.pickTimeSeconds),
      updatedAt: now,
    });
  }
  
  // 6. Commit atomically
  await batch.commit();
  
  return pickData;
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         WRITE PATH                               │
│                                                                   │
│   User makes pick                                                │
│         │                                                         │
│         ▼                                                         │
│   Cloud Function (validates, atomic write)                       │
│         │                                                         │
│         ├──────────────────┬────────────────────┐                │
│         ▼                  ▼                    ▼                │
│   /drafts/{id}/picks   /picks_flat/{id}    /users/{id}/teams    │
│   (real-time)          (ADP queries)       (user's roster)      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         READ PATH                                │
│                                                                   │
│   Draft Room (real-time)     ADP Calculation (batch)            │
│         │                           │                            │
│         ▼                           ▼                            │
│   /drafts/{id}/picks          /picks_flat                       │
│   onSnapshot listener         where draftType == 'fast'         │
│                               where timestamp > 30 days ago     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Indexes Required

Create these in `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "picks_flat",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "draftType", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "picks_flat",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "playerId", "order": "ASCENDING" },
        { "fieldPath": "draftType", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "drafts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "draftType", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "drafts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tournamentId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## Cost Considerations

| Operation | Frequency | Est. Reads/Writes |
|-----------|-----------|-------------------|
| Make a pick | 216 per draft × 47K drafts | ~10M writes |
| ADP calculation | 2x daily | ~10M reads per run |
| Draft room listeners | Concurrent users | Variable |
| User teams query | Per user session | 1-50 reads |

**Optimization tips:**
- `picks_flat` is write-heavy but read-optimized for ADP
- Use batch writes to minimize costs
- Cache ADP results in static JSON (already implemented)
- Consider archiving old `picks_flat` docs after season

---

## Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Drafts - read by participants, write by cloud functions only
    match /drafts/{draftId} {
      allow read: if isParticipant(resource.data.participants);
      allow write: if false; // Cloud functions only
      
      match /picks/{pickNumber} {
        allow read: if isParticipant(get(/databases/$(database)/documents/drafts/$(draftId)).data.participants);
        allow write: if false; // Cloud functions only
      }
    }
    
    // Picks flat - read by admin/cloud functions only (for ADP)
    match /picks_flat/{pickId} {
      allow read: if false; // Cloud functions only
      allow write: if false;
    }
    
    // Users - read/write own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      
      match /teams/{teamId} {
        allow read: if request.auth.uid == userId;
        allow write: if false; // Cloud functions only
      }
    }
    
    // Tournaments - public read
    match /tournaments/{tournamentId} {
      allow read: if true;
      allow write: if false; // Admin only
    }
    
    function isParticipant(participants) {
      return request.auth != null && 
        participants.hasAny([{'userId': request.auth.uid}]);
    }
  }
}
```

---

## Migration Notes

When transitioning from dev to production:

1. **Create indexes first** - Deploy `firestore.indexes.json` before heavy writes
2. **Seed `picks_flat`** - Backfill from existing draft picks if any
3. **Set up Cloud Functions** - Move pick validation to server-side
4. **Enable security rules** - Lock down client access


