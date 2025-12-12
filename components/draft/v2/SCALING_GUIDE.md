# Scaling Guide: 47,000+ Concurrent Drafts

## Database Architecture for Scale

### Firestore Collection Structure

```
draftRooms/
├── {roomId}/
│   ├── name: string
│   ├── type: string ('topdog', 'bestball', etc.)
│   ├── status: string ('waiting', 'active', 'completed')
│   ├── participants: string[] (max 12)
│   ├── draftOrder: string[]
│   ├── settings: {
│   │   timerSeconds: number,
│   │   totalRounds: number,
│   │   autoStart: boolean
│   │ }
│   ├── currentTimer: number
│   ├── currentPick: number
│   ├── layoutConfig: object (optional)
│   ├── createdAt: timestamp
│   ├── lastPickAt: timestamp
│   └── picks/ (subcollection)
│       └── {pickId}/
│           ├── player: string
│           ├── user: string
│           ├── pickNumber: number
│           ├── round: number
│           ├── position: string
│           ├── team: string
│           ├── adp: number
│           ├── timestamp: timestamp
│           ├── roomId: string (for security)
│           └── userIndex: number
```

### Scalability Optimizations

#### 1. Sharding Strategy
```javascript
// Distribute rooms across multiple collections
const shardCount = 100;
const shard = roomId.hash() % shardCount;
const collection = `draftRooms_${shard}`;
```

#### 2. Connection Pooling
```javascript
// Limit concurrent connections per user
const MAX_CONNECTIONS_PER_USER = 3;
const connectionPool = new Map();

const getConnection = (userId) => {
  if (connectionPool.get(userId)?.length >= MAX_CONNECTIONS_PER_USER) {
    // Close oldest connection
    connectionPool.get(userId)[0].close();
  }
  // Return new connection
};
```

#### 3. Optimized Queries
```javascript
// Use composite indexes for efficient queries
const availableRooms = query(
  collection(db, 'draftRooms'),
  where('status', '==', 'waiting'),
  where('type', '==', tournamentType),
  where('participantCount', '<', 12),
  orderBy('createdAt', 'desc'),
  limit(10)
);
```

## Security Architecture

### 1. Server-Side Validation
```javascript
// Cloud Function for pick validation
exports.validatePick = functions.firestore
  .document('draftRooms/{roomId}/picks/{pickId}')
  .onCreate(async (snap, context) => {
    const pick = snap.data();
    const roomRef = admin.firestore().doc(`draftRooms/${context.params.roomId}`);
    
    // Validate user's turn
    // Validate player availability
    // Validate pick timing
    // Apply positional limits
    
    if (!isValidPick) {
      await snap.ref.delete();
      throw new functions.https.HttpsError('invalid-argument', 'Invalid pick');
    }
  });
```

### 2. Rate Limiting
```javascript
// Prevent rapid-fire picking
const PICK_COOLDOWN = 1000; // 1 second
const lastPickTimes = new Map();

const rateLimitPick = (userId) => {
  const lastPick = lastPickTimes.get(userId) || 0;
  const now = Date.now();
  
  if (now - lastPick < PICK_COOLDOWN) {
    throw new Error('Too many picks too quickly');
  }
  
  lastPickTimes.set(userId, now);
};
```

### 3. Anti-Collusion Detection
```javascript
// Monitor for suspicious patterns
const detectCollusion = {
  // IP address clustering
  checkIPClustering: (roomParticipants) => {
    // Flag if >3 users from same IP
  },
  
  // Pick timing analysis
  checkPickPatterns: (picks) => {
    // Flag coordinated pick timing
  },
  
  // Location verification
  checkGeolocation: async (userId) => {
    // Verify consistent location
  }
};
```

## Performance Optimizations

### 1. Component-Level Optimizations
```javascript
// Memoized expensive calculations
const availablePlayers = useMemo(() => {
  return PLAYER_POOL.filter(player => 
    !pickedNames.includes(player.name)
  );
}, [pickedNames]);

// Virtualized long lists
const VirtualizedPlayerList = ({ players }) => {
  return (
    <VariableSizeList
      height={600}
      itemCount={players.length}
      itemSize={index => 60}
      itemData={players}
    >
      {PlayerRow}
    </VariableSizeList>
  );
};
```

### 2. State Management Optimizations
```javascript
// Batched state updates
const batchUpdates = useCallback((updates) => {
  unstable_batchedUpdates(() => {
    updates.forEach(update => update());
  });
}, []);

// Selective re-renders
const PlayerCard = memo(({ player, isSelected }) => {
  return <div>...</div>;
}, (prevProps, nextProps) => {
  return prevProps.player.name === nextProps.player.name &&
         prevProps.isSelected === nextProps.isSelected;
});
```

### 3. Network Optimizations
```javascript
// Debounced Firebase writes
const debouncedUpdate = useCallback(
  debounce((data) => updateDoc(roomRef, data), 300),
  [roomRef]
);

// Optimistic updates
const optimisticPick = (player) => {
  // Update UI immediately
  setPicks(prev => [...prev, optimisticPickData]);
  
  // Then sync to server
  makePick(player).catch(() => {
    // Rollback on error
    setPicks(prev => prev.slice(0, -1));
  });
};
```

## Data Analytics & Monitoring

### 1. Draft Analytics Schema
```javascript
// Analytics events for monitoring
const trackEvent = (eventType, data) => {
  analytics.track(eventType, {
    roomId,
    userId,
    timestamp: Date.now(),
    ...data
  });
};

// Key events to track:
// - pick_made
// - timer_expired
// - user_joined
// - room_created
// - error_occurred
```

### 2. Performance Monitoring
```javascript
// Performance metrics collection
const performanceMetrics = {
  renderTime: 0,
  memoryUsage: 0,
  networkLatency: 0,
  errorRate: 0,
  
  track: function(metric, value) {
    this[metric] = value;
    
    // Send to monitoring service
    if (value > ALERT_THRESHOLDS[metric]) {
      alerting.send(`High ${metric}: ${value}`);
    }
  }
};
```

### 3. Error Tracking
```javascript
// Comprehensive error tracking
const errorHandler = {
  logError: (error, context) => {
    console.error('Draft Room Error:', error);
    
    // Send to error tracking service
    errorTracking.captureException(error, {
      tags: {
        component: context.component,
        roomId: context.roomId,
        userId: context.userId
      },
      extra: context
    });
  },
  
  // Auto-recovery mechanisms
  attemptRecovery: (error) => {
    switch (error.type) {
      case 'FIREBASE_DISCONNECT':
        return reconnectFirebase();
      case 'INVALID_STATE':
        return syncStateWithServer();
      default:
        return reloadComponent();
    }
  }
};
```

## Deployment & Infrastructure

### 1. CDN Strategy
```javascript
// Serve static assets from CDN
const CDN_BASE = 'https://cdn.bestball.com';
const assetUrls = {
  playerImages: `${CDN_BASE}/players/`,
  teamLogos: `${CDN_BASE}/teams/`,
  staticAssets: `${CDN_BASE}/assets/`
};
```

### 2. Load Balancing
```javascript
// Regional deployment strategy
const getOptimalRegion = (userLocation) => {
  const regions = ['us-east1', 'us-west1', 'europe-west1'];
  
  // Route to closest region
  return regions.reduce((closest, region) => {
    const distance = calculateDistance(userLocation, region);
    return distance < closest.distance ? 
      { region, distance } : closest;
  });
};
```

### 3. Auto-Scaling Rules
```yaml
# Cloud Run auto-scaling configuration
resources:
  limits:
    cpu: '2'
    memory: '2Gi'
  
annotations:
  run.googleapis.com/execution-environment: gen2
  autoscaling.knative.dev/minScale: '10'
  autoscaling.knative.dev/maxScale: '1000'
  run.googleapis.com/cpu-throttling: 'false'
```

## Testing at Scale

### 1. Load Testing Scripts
```javascript
// Simulate 47k concurrent users
const loadTest = async () => {
  const userCount = 47000;
  const roomsNeeded = Math.ceil(userCount / 12);
  
  // Create test rooms
  const rooms = await Promise.all(
    Array(roomsNeeded).fill().map(() => createTestRoom())
  );
  
  // Simulate user joins
  const users = Array(userCount).fill().map((_, i) => 
    simulateUser(i, rooms[Math.floor(i / 12)])
  );
  
  // Run for 30 minutes
  await Promise.all(users);
};
```

### 2. Chaos Engineering
```javascript
// Test system resilience
const chaosTests = {
  randomFirebaseDisconnects: () => {
    // Randomly disconnect 5% of users
  },
  
  serverLatencyInjection: () => {
    // Add random delays to 10% of requests
  },
  
  memoryPressure: () => {
    // Consume additional memory
  }
};
```

## Recovery & Disaster Planning

### 1. Data Backup Strategy
```javascript
// Automated backups every hour
const backupStrategy = {
  frequency: '0 * * * *', // Every hour
  retention: '7 days',
  locations: ['us-central1', 'europe-west1'],
  
  backup: async () => {
    const collections = ['draftRooms', 'picks', 'users'];
    
    for (const collection of collections) {
      await admin.firestore().collection(collection).export({
        outputUriPrefix: `gs://backup-bucket/${Date.now()}/`
      });
    }
  }
};
```

### 2. Failover Mechanisms
```javascript
// Graceful degradation
const failoverStrategy = {
  // If Firebase fails, use local storage
  firebaseFailover: () => {
    enableLocalStorageMode();
    showOfflineNotification();
  },
  
  // If CDN fails, use fallback assets
  cdnFailover: () => {
    useFallbackAssets();
  },
  
  // If main region fails, redirect
  regionFailover: () => {
    redirectToBackupRegion();
  }
};
```

This scaling architecture ensures the system can handle 47,000+ concurrent users while maintaining performance, security, and reliability.