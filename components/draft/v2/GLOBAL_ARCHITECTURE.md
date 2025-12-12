# Global Architecture: Worldwide Draft Rooms

## Technical Implications of Global Users

### The Challenge
When users from different continents participate in the same draft room, you face several critical issues:

#### 1. **Latency Disparities**
```
User in Sydney:    300ms to US servers
User in London:    150ms to US servers  
User in New York:   20ms to US servers
User in São Paulo: 200ms to US servers
```
This creates **unfair advantages** - some users see picks 280ms before others!

#### 2. **Timer Synchronization Issues**
```javascript
// What happens with a 30-second timer:
// NY user sees: 30, 29, 28, 27...
// Sydney user sees: 30, 29, 28, 26... (missed 27 due to latency)
// Result: Sydney user gets 1-2 seconds less time
```

#### 3. **Pick Conflicts**
```javascript
// Race condition scenario:
// 1. Timer hits 0 in London (11:00:00 GMT)
// 2. Auto-pick triggers for London user
// 3. Sydney user submits manual pick at 11:00:00.2 GMT
// 4. Both arrive at server - who gets the pick?
```

## Global Architecture Solutions

### 1. **Multi-Region Deployment with Smart Routing**

#### Firebase Multi-Region Setup
```javascript
// Deploy to multiple regions
const regions = {
  'us-central1': ['US', 'CA', 'MX'],           // Americas
  'europe-west1': ['GB', 'DE', 'FR', 'ES'],   // Europe  
  'asia-southeast1': ['AU', 'SG', 'JP'],      // Asia-Pacific
  'southamerica-east1': ['BR', 'AR', 'CL']    // South America
};

// Smart region selection
const getOptimalRegion = (userLocation) => {
  const userCountry = getUserCountry(userLocation);
  
  // Find region that serves this country
  for (const [region, countries] of Object.entries(regions)) {
    if (countries.includes(userCountry)) {
      return region;
    }
  }
  
  return 'us-central1'; // Default fallback
};
```

#### Cross-Region Data Synchronization
```javascript
// Master-replica architecture
const draftRoomSync = {
  // Master region hosts the "source of truth"
  masterRegion: 'us-central1',
  
  // Replicas in other regions for read performance
  replicas: ['europe-west1', 'asia-southeast1'],
  
  // Sync strategy
  syncPicks: async (pick) => {
    // Write to master first
    await masterDB.collection('picks').add(pick);
    
    // Then propagate to replicas
    await Promise.all(
      replicas.map(region => 
        replicaDBs[region].collection('picks').add(pick)
      )
    );
  }
};
```

### 2. **Latency-Compensated Timers**

#### Server-Authoritative Timing
```javascript
// Server maintains authoritative time
const ServerTimer = {
  startTime: null,
  duration: 30000, // 30 seconds
  
  getCurrentTime: () => Date.now(),
  
  getTimeRemaining: function() {
    if (!this.startTime) return this.duration;
    
    const elapsed = this.getCurrentTime() - this.startTime;
    return Math.max(0, this.duration - elapsed);
  },
  
  // Send regular time sync to all clients
  broadcastTimeSync: function() {
    const timeRemaining = this.getTimeRemaining();
    
    // Send to all users in room with server timestamp
    broadcastToRoom({
      type: 'TIME_SYNC',
      serverTime: this.getCurrentTime(),
      timeRemaining: timeRemaining
    });
  }
};

// Client-side latency compensation
const ClientTimer = {
  serverTimeOffset: 0,
  estimatedLatency: 0,
  
  // Sync with server time
  syncWithServer: function(serverTime, receivedAt) {
    this.estimatedLatency = (receivedAt - serverTime) / 2;
    this.serverTimeOffset = serverTime - receivedAt + this.estimatedLatency;
  },
  
  // Get compensated time remaining
  getCompensatedTimeRemaining: function(serverTimeRemaining) {
    // Subtract estimated latency to give fair time
    return serverTimeRemaining - this.estimatedLatency;
  }
};
```

#### Fair Timer Implementation
```javascript
const FairTimer = ({serverTimeRemaining, userLatency}) => {
  // Compensate for user's latency
  const compensatedTime = Math.max(0, serverTimeRemaining - userLatency);
  
  // Visual indicator of compensation
  return (
    <div className="timer-container">
      <div className="timer-main">
        {Math.ceil(compensatedTime / 1000)}
      </div>
      
      {userLatency > 200 && (
        <div className="latency-indicator">
          <span className="text-xs text-yellow-400">
            +{Math.round(userLatency)}ms compensation
          </span>
        </div>
      )}
    </div>
  );
};
```

### 3. **Global CDN Strategy**

#### Asset Distribution
```javascript
// Multi-CDN setup for optimal performance
const globalCDN = {
  regions: {
    'americas': 'https://americas-cdn.bestball.com',
    'europe': 'https://europe-cdn.bestball.com', 
    'asia': 'https://asia-cdn.bestball.com',
    'oceania': 'https://oceania-cdn.bestball.com'
  },
  
  getAssetURL: function(assetPath, userRegion) {
    const cdnBase = this.regions[userRegion] || this.regions['americas'];
    return `${cdnBase}${assetPath}`;
  },
  
  // Preload critical assets
  preloadCriticalAssets: function() {
    const criticalAssets = [
      '/player-images/top-100.webp',
      '/team-logos/all-teams.svg',
      '/sounds/pick-notification.mp3'
    ];
    
    criticalAssets.forEach(asset => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = this.getAssetURL(asset, getUserRegion());
      document.head.appendChild(link);
    });
  }
};
```

### 4. **Conflict Resolution System**

#### Pick Priority Algorithm
```javascript
const PickResolver = {
  // Resolve conflicting picks fairly
  resolvePicks: function(conflictingPicks) {
    // Sort by adjusted timestamp (compensating for latency)
    const sortedPicks = conflictingPicks.map(pick => ({
      ...pick,
      adjustedTime: pick.timestamp + pick.userLatency
    })).sort((a, b) => a.adjustedTime - b.adjustedTime);
    
    // Winner is earliest adjusted time
    const winningPick = sortedPicks[0];
    const losingPicks = sortedPicks.slice(1);
    
    // Notify losing users immediately
    losingPicks.forEach(pick => {
      notifyUser(pick.userId, {
        type: 'PICK_CONFLICT_LOST',
        message: 'Another user selected this player first',
        suggestedAlternatives: getSimilarPlayers(pick.player)
      });
    });
    
    return winningPick;
  }
};
```

#### Auto-Pick Fairness
```javascript
const FairAutoPick = {
  // Ensure auto-picks don't advantage high-latency users
  scheduleAutoPick: function(userId, timeRemaining, userLatency) {
    // Auto-pick should trigger when user would see timer hit 0
    const adjustedDelay = timeRemaining + userLatency;
    
    setTimeout(() => {
      this.executeAutoPick(userId);
    }, adjustedDelay);
  },
  
  executeAutoPick: function(userId) {
    // Double-check user hasn't picked manually
    if (!hasUserPicked(userId)) {
      const bestAvailable = getBestAvailablePlayer(userId);
      submitPick(userId, bestAvailable, { isAutoPick: true });
    }
  }
};
```

### 5. **Connection Quality Monitoring**

#### Real-Time Latency Tracking
```javascript
const ConnectionMonitor = {
  latencyHistory: [],
  
  // Ping server regularly to measure latency
  startLatencyMonitoring: function() {
    setInterval(() => {
      const start = performance.now();
      
      // Send ping to server
      sendPing().then(() => {
        const latency = performance.now() - start;
        this.updateLatency(latency);
      });
    }, 5000); // Every 5 seconds
  },
  
  updateLatency: function(latency) {
    this.latencyHistory.push({
      timestamp: Date.now(),
      latency: latency
    });
    
    // Keep only last 10 measurements
    if (this.latencyHistory.length > 10) {
      this.latencyHistory.shift();
    }
    
    // Update UI with connection quality
    this.updateConnectionQuality();
  },
  
  getAverageLatency: function() {
    if (this.latencyHistory.length === 0) return 0;
    
    const sum = this.latencyHistory.reduce((acc, item) => acc + item.latency, 0);
    return sum / this.latencyHistory.length;
  },
  
  updateConnectionQuality: function() {
    const avgLatency = this.getAverageLatency();
    
    let quality = 'excellent';
    let color = 'green';
    
    if (avgLatency > 500) {
      quality = 'poor';
      color = 'red';
    } else if (avgLatency > 200) {
      quality = 'fair';
      color = 'yellow';
    }
    
    // Update UI indicator
    updateConnectionIndicator(quality, color, avgLatency);
  }
};
```

### 6. **Global User Experience Enhancements**

#### Connection Quality Indicator
```javascript
const ConnectionIndicator = ({ latency, quality }) => {
  const getIndicatorColor = () => {
    if (latency < 100) return 'bg-green-500';
    if (latency < 200) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${getIndicatorColor()}`} />
      <span className="text-gray-400">
        {Math.round(latency)}ms
      </span>
      
      {latency > 300 && (
        <span className="text-yellow-400 text-xs">
          (timer compensated)
        </span>
      )}
    </div>
  );
};
```

#### Timezone-Aware Scheduling
```javascript
const GlobalScheduling = {
  // Find optimal draft times for global participants
  findOptimalDraftTime: function(participantTimezones) {
    const timezoneOffsets = participantTimezones.map(tz => 
      getTimezoneOffset(tz)
    );
    
    // Find time that's reasonable for most participants
    // (avoiding middle of night for anyone)
    const optimalHours = [];
    
    for (let hour = 0; hour < 24; hour++) {
      const localTimes = timezoneOffsets.map(offset => 
        (hour + offset) % 24
      );
      
      // Count how many users have reasonable time (6 AM - 11 PM)
      const reasonableCount = localTimes.filter(time => 
        time >= 6 && time <= 23
      ).length;
      
      optimalHours.push({
        hour,
        reasonableCount,
        percentage: reasonableCount / participantTimezones.length
      });
    }
    
    // Return best option
    return optimalHours.sort((a, b) => 
      b.reasonableCount - a.reasonableCount
    )[0];
  }
};
```

## Implementation Priority

### Phase 1: Core Global Support (Week 1-2)
1. **Multi-region Firebase deployment**
2. **Server-authoritative timing system**
3. **Basic latency compensation**
4. **Connection quality monitoring**

### Phase 2: Advanced Features (Week 3-4)  
1. **Conflict resolution system**
2. **Global CDN optimization**
3. **Timezone-aware scheduling**
4. **Enhanced fairness algorithms**

### Phase 3: Optimization (Week 5-6)
1. **Performance tuning for each region**
2. **Advanced latency prediction**
3. **Regional user analytics**
4. **Automated region scaling**

## Expected Outcomes

✅ **Fair competition** regardless of location  
✅ **<200ms perceived latency** for 90% of users globally  
✅ **Zero pick conflicts** from latency issues  
✅ **Transparent connection quality** indicators  
✅ **Optimal draft scheduling** for mixed timezones  

This global architecture ensures **fair, competitive drafting** for users worldwide while maintaining the real-time excitement that makes drafting fun!