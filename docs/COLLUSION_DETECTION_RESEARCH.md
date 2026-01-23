# Collusion Detection Algorithm Research

**Project:** Bestball Tournament Integrity System
**Date:** January 2025
**Purpose:** Deep research synthesis for building a collusion detection algorithm for a $15M best ball tournament
**Data Source:** Location Integrity System ([`LOCATION_INTEGRITY_SYSTEM_DESIGN.md`](../LOCATION_INTEGRITY_SYSTEM_DESIGN.md))

---

## Executive Summary

This document synthesizes research on collusion detection algorithms, fraud detection techniques, and fantasy sports-specific integrity measures. The goal is to design an algorithm that identifies coordinated behavior between users drafting from the same physical location or network—a key indicator of potential collusion in best ball tournaments.

### Key Findings

1. **Graph Neural Networks (GNNs)** outperform traditional ML in detecting complex collusive patterns by modeling relationships between entities
2. **Multi-signal detection** is essential—no single indicator is sufficient; combine location, behavior, timing, and draft patterns
3. **Proximity detection** (same room/same IP) is a strong signal but requires behavioral context to avoid false positives (legitimate households)
4. **The DraftKings 2023 case** shows collusion in best ball is detectable through draft pattern analysis—abnormal pick sequences that benefit specific teams
5. **Ensemble methods** (XGBoost + Isolation Forest + Random Forest) achieve 98%+ accuracy in fraud detection when properly tuned

---

## Part 1: Collusion Patterns in Best Ball Drafts

### 1.1 What Collusion Looks Like

Based on the [DraftKings Best Ball incident](https://www.casino.org/news/draftkings-best-ball-draft-scrapped-after-charges-of-cheating/) (July 2023), collusion in snake drafts manifests as:

**Draft Manipulation Patterns:**
- **Tanking picks**: Deliberately selecting low-value players early to let a confederate get premium players
- **Reach picks**: Selecting players far above their ADP (Average Draft Position) to leave better players for a partner
- **Positional sabotage**: Over-drafting a position to deplete the pool for opponents while a partner drafts optimally
- **Coordinated stacking**: Multiple colluders selecting players that complement one specific team

**The DraftKings Example:**
- Gabe Davis (normally Round 6+) was picked 3rd overall
- Justin Ross (often undrafted) picked in Round 2
- George Pickens (Round 7 ADP) picked in Round 2
- Result: 1-2 "superteams" with abnormally strong rosters

### 1.2 Best Ball-Specific Vulnerabilities

Unlike managed leagues, best ball has unique collusion vectors:

| Vector | Description | Detection Difficulty |
|--------|-------------|---------------------|
| **Draft manipulation** | Throwing picks to help a partner | Medium - detectable via ADP deviation |
| **Multi-accounting** | Same person controls multiple teams | High - requires device/location matching |
| **Information sharing** | Sharing draft board in real-time | Very High - requires location co-detection |
| **Chip dumping** | One team sacrifices for another | N/A in best ball (no trades/drops) |

**Key insight:** In best ball, collusion happens almost exclusively during the draft. Post-draft, there's no team management, so the draft IS the entire integrity surface.

---

## Part 2: Detection Signals & Features

### 2.1 Location-Based Signals (From Your System)

Your Location Integrity System already captures the most valuable signals:

```typescript
// From pickLocations collection
interface CollisionSignals {
  // PRIMARY - Strong signals
  within50ft: string[];      // Users physically co-located
  sameIp: string[];          // Users on same network

  // SECONDARY - Context signals
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: Timestamp;
  deviceId: string;
}
```

**Signal Interpretation:**

| Signal Combination | Risk Level | Interpretation |
|--------------------|------------|----------------|
| `within50ft` + `sameIp` + same draft | 🔴 Critical | Same room, same network, same draft |
| `within50ft` only | 🟡 Medium | Could be public venue (sports bar, office) |
| `sameIp` only | 🟡 Medium | Could be household, VPN, university |
| Neither | 🟢 Low | Independent users |

### 2.2 Behavioral Signals (To Be Computed)

Beyond location, analyze draft behavior:

**Draft Pattern Features:**
```typescript
interface DraftBehaviorFeatures {
  // ADP Deviation
  avgAdpDeviation: number;        // How far picks deviate from consensus ADP
  maxAdpDeviation: number;        // Largest single deviation
  adpDeviationVariance: number;   // Consistency of deviation

  // Pick Timing
  avgPickTime: number;            // Seconds per pick
  pickTimeVariance: number;       // Consistency of pick speed
  timeoutCount: number;           // Auto-picks from timeout

  // Positional Balance
  positionEntropy: number;        // How balanced across positions
  earlyPositionConcentration: string[];  // Positions over-drafted early

  // Value Extraction
  totalExpectedValue: number;     // Sum of player values vs ADP
  valueByRound: number[];         // Value distribution across rounds
}
```

**Interaction Features (Pairwise):**
```typescript
interface PairwiseFeatures {
  userId1: string;
  userId2: string;
  draftId: string;

  // Co-occurrence
  draftsShared: number;           // How many drafts they've been in together
  seatProximity: number;          // Draft position distance (1-11)

  // Behavioral Correlation
  pickTimeCorrelation: number;    // Do they take similar time to pick?
  adpDeviationCorrelation: number; // Do they deviate similarly?

  // Benefit Analysis
  user1ValueWhenUser2Present: number;  // Does user1 get more value when user2 is in draft?
  user2ValueWhenUser1Present: number;

  // Location Co-occurrence
  locationCoincidenceRate: number; // % of shared drafts where co-located
  sameIpRate: number;              // % of shared drafts with same IP
}
```

### 2.3 Graph-Based Features

Model the draft as a graph to detect coordination:

```typescript
interface DraftGraph {
  nodes: {
    users: UserNode[];      // 12 users per draft
    picks: PickNode[];      // 228 picks (12 * 19)
    players: PlayerNode[];  // All available players
  };

  edges: {
    userMadePick: Edge[];   // User -> Pick
    pickSelected: Edge[];   // Pick -> Player
    userProximity: Edge[];  // User <-> User (weighted by location)
    userBenefit: Edge[];    // User -> User (weighted by value transfer)
  };
}
```

**Graph Metrics to Compute:**
- **Clustering coefficient**: Do certain users always cluster together?
- **Betweenness centrality**: Is one user at the center of a "value transfer" network?
- **Community detection**: Do subgroups of users form distinct communities across drafts?

---

## Part 3: Algorithm Architecture

### 3.1 Multi-Stage Detection Pipeline

Based on [industry best practices](https://seon.io/resources/device-fingerprinting/), implement a staged approach:

```
┌─────────────────────────────────────────────────────────────────┐
│                    COLLUSION DETECTION PIPELINE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STAGE 1: Real-Time Flagging (During Draft)                     │
│  ├─ Location proximity check (within50ft)                        │
│  ├─ Same IP detection                                            │
│  ├─ Known device cluster detection                               │
│  └─ Output: Flag for enhanced monitoring                         │
│                                                                  │
│  STAGE 2: Post-Draft Analysis (After Draft Completes)           │
│  ├─ ADP deviation scoring                                        │
│  ├─ Pairwise benefit analysis                                    │
│  ├─ Pick timing anomaly detection                                │
│  └─ Output: Risk score per user pair                             │
│                                                                  │
│  STAGE 3: Cross-Draft Pattern Mining (Weekly/Monthly)           │
│  ├─ Graph neural network analysis                                │
│  ├─ Community detection across all drafts                        │
│  ├─ Historical pattern matching                                  │
│  └─ Output: Collusion ring identification                        │
│                                                                  │
│  STAGE 4: Human Review (Flagged Cases)                          │
│  ├─ Manual hand history review                                   │
│  ├─ Account investigation                                        │
│  ├─ User contact if needed                                       │
│  └─ Output: Ban/warning/clear decision                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Risk Scoring Model

Combine signals into a composite risk score:

```typescript
interface CollusionRiskScore {
  userId: string;
  partnerId: string;  // Suspected partner
  draftId: string;

  // Component Scores (0-100)
  locationScore: number;      // Based on proximity/IP overlap
  behaviorScore: number;      // Based on draft pattern analysis
  historyScore: number;       // Based on cross-draft patterns
  benefitScore: number;       // Based on value transfer analysis

  // Composite
  compositeScore: number;     // Weighted combination
  confidence: number;         // How confident are we in this score?

  // Flags
  flags: string[];            // Human-readable flags
  recommendation: 'clear' | 'monitor' | 'review' | 'suspend';
}
```

**Recommended Weighting:**

| Component | Weight | Rationale |
|-----------|--------|-----------|
| Location | 35% | Strong signal, hard to fake |
| Behavior | 30% | Draft patterns reveal intent |
| History | 20% | Repeat offenders cluster |
| Benefit | 15% | Outcome-based validation |

### 3.3 Machine Learning Models

Based on [fraud detection research](https://www.infoq.com/articles/fraud-detection-random-forest/), use an ensemble approach:

**Recommended Ensemble:**

1. **Isolation Forest** (Anomaly Detection)
   - Unsupervised
   - Identifies draft behaviors that are statistically unusual
   - Good for catching novel collusion patterns

2. **XGBoost** (Classification)
   - Supervised (requires labeled examples)
   - High recall (catches most fraud)
   - Handles class imbalance well with `scale_pos_weight`

3. **Graph Neural Network** (Relationship Learning)
   - Captures structural patterns in user networks
   - [Research shows](https://arxiv.org/abs/2410.07091) GNNs outperform feedforward NNs for collusion
   - Useful for detecting collusion rings

**Ensemble Strategy:**
```python
# Pseudo-code for ensemble
def compute_risk_score(user_pair, draft_data):
    # Individual model scores
    anomaly_score = isolation_forest.predict_proba(draft_features)
    classification_score = xgboost.predict_proba(draft_features)
    graph_score = gnn.predict_proba(user_graph)

    # Weighted ensemble
    composite = (
        0.3 * anomaly_score +
        0.4 * classification_score +
        0.3 * graph_score
    )

    return composite
```

---

## Part 4: Feature Engineering Details

### 4.1 ADP Deviation Analysis

The most important behavioral feature:

```typescript
function computeAdpDeviation(picks: Pick[], adpData: Map<string, number>): AdpAnalysis {
  const deviations: number[] = [];

  for (const pick of picks) {
    const expectedAdp = adpData.get(pick.playerId) || 200;  // Default to late if unknown
    const actualPick = pick.pickNumber;
    const deviation = actualPick - expectedAdp;  // Negative = reached, Positive = fell
    deviations.push(deviation);
  }

  return {
    avgDeviation: mean(deviations),
    maxReach: Math.min(...deviations),     // Most aggressive reach
    maxFall: Math.max(...deviations),       // Biggest value fall to them
    variance: variance(deviations),
    reachCount: deviations.filter(d => d < -20).length,  // Picks 20+ spots early

    // Suspicious pattern: Many reaches but still got good value
    suspiciousPattern: deviations.filter(d => d < -20).length > 3 &&
                       mean(deviations) < 0
  };
}
```

**Interpretation:**
- `avgDeviation < -10`: User consistently reaches → potentially helping partners
- `avgDeviation > 10`: User consistently gets value → potentially being helped
- High `variance`: Inconsistent strategy → possible coordination
- `suspiciousPattern = true`: Reaches often but still gets value → strong signal

### 4.2 Pairwise Benefit Analysis

Detect if one user's bad picks consistently benefit another:

```typescript
function computePairwiseBenefit(
  user1Picks: Pick[],
  user2Picks: Pick[],
  draftOrder: number[]  // Pick order in the draft
): BenefitAnalysis {

  let benefitToUser2 = 0;

  for (const pick of user1Picks) {
    // Did user1 reach on this pick?
    const reach = pick.pickNumber - getAdp(pick.playerId);
    if (reach < -15) {  // Significant reach
      // Was user2 picking soon after?
      const user2NextPick = getNextPick(user2Picks, pick.pickNumber);
      if (user2NextPick && user2NextPick.pickNumber - pick.pickNumber < 12) {
        // Did user2 benefit from players user1 passed on?
        const passedPlayers = getPlayersBetween(pick.pickNumber, user2NextPick.pickNumber);
        const valuePassed = passedPlayers
          .filter(p => getAdp(p) < pick.pickNumber)  // Should have been picked earlier
          .reduce((sum, p) => sum + getValue(p), 0);

        benefitToUser2 += valuePassed;
      }
    }
  }

  return {
    benefitToUser2,
    benefitPerPick: benefitToUser2 / user1Picks.length,
    isSuspicious: benefitToUser2 > threshold
  };
}
```

### 4.3 Location Co-occurrence Analysis

Your system already captures this—compute derived metrics:

```typescript
interface LocationCooccurrence {
  userPair: [string, string];

  // Raw counts
  totalDraftsTogether: number;
  draftsWithin50ft: number;
  draftsWithSameIp: number;
  draftsWithBoth: number;

  // Rates
  coLocationRate: number;     // draftsWithin50ft / totalDraftsTogether
  sameIpRate: number;         // draftsWithSameIp / totalDraftsTogether
  criticalRate: number;       // draftsWithBoth / totalDraftsTogether

  // Context
  uniqueLocations: number;    // How many different co-locations?
  uniqueIps: number;          // How many different shared IPs?

  // Time patterns
  firstCoOccurrence: Timestamp;
  lastCoOccurrence: Timestamp;
  avgDaysBetween: number;
}

function assessLocationRisk(cooc: LocationCooccurrence): RiskLevel {
  // Same location every time = suspicious
  if (cooc.coLocationRate > 0.8 && cooc.totalDraftsTogether > 5) {
    return 'critical';
  }

  // Sometimes same location, consistent IP = household or coordinated
  if (cooc.sameIpRate > 0.9 && cooc.coLocationRate > 0.3) {
    return 'high';
  }

  // Occasional overlap = probably coincidence
  if (cooc.coLocationRate < 0.2 && cooc.sameIpRate < 0.3) {
    return 'low';
  }

  return 'medium';
}
```

---

## Part 5: Handling Edge Cases

### 5.1 Legitimate Same-Household Users

**The Problem:** Family members or roommates may legitimately draft from the same location.

**Solution: Behavioral Differentiation**

```typescript
function isLegitimateHousehold(
  user1: UserProfile,
  user2: UserProfile,
  draftHistory: DraftHistory[]
): boolean {
  // Check 1: Do they compete against each other fairly?
  const headToHeadRecord = getHeadToHead(user1.id, user2.id, draftHistory);
  if (headToHeadRecord.isBalanced) {
    // Neither consistently helps the other
    return true;
  }

  // Check 2: Do they have independent draft patterns?
  const patternCorrelation = computePatternCorrelation(user1, user2, draftHistory);
  if (patternCorrelation < 0.3) {
    // Very different draft styles = independent decision-making
    return true;
  }

  // Check 3: Do they draft the same players when apart?
  const independentDrafts = draftHistory.filter(d => !areCoLocated(user1, user2, d));
  const overlapRate = computePlayerOverlap(user1, user2, independentDrafts);
  if (overlapRate > 0.5) {
    // They have similar taste even when apart = legitimate
    return true;
  }

  return false;  // Suspicious household
}
```

### 5.2 Public Venues (Sports Bars, Offices)

**The Problem:** Multiple unrelated users may draft from the same public location.

**Solution: Venue Detection + Social Network Analysis**

```typescript
function isPublicVenue(location: Location, userIds: string[]): boolean {
  // Check 1: Many different users from this location over time
  const uniqueUsersAtLocation = getUniqueUsers(location, 30_days);
  if (uniqueUsersAtLocation > 20) {
    return true;  // Probably public venue
  }

  // Check 2: Users at this location don't know each other
  const socialConnections = getSocialConnections(userIds);
  if (socialConnections.length === 0) {
    return true;  // Strangers = public venue
  }

  // Check 3: Location is a known business
  const businessData = reverseGeocodeToBusinessType(location);
  if (businessData.type in ['bar', 'restaurant', 'office', 'university']) {
    return true;
  }

  return false;  // Probably private residence
}
```

### 5.3 VPN and Location Spoofing

**The Problem:** Sophisticated users may use VPNs or GPS spoofing.

**Detection Signals:**
- IP geolocation doesn't match GPS location
- Known VPN/datacenter IP ranges
- GPS accuracy is suspiciously perfect (programmatic)
- Device sensor data inconsistent with location

```typescript
interface SpoofingSignals {
  ipLocationMismatch: boolean;    // IP says NYC, GPS says LA
  isKnownVpn: boolean;            // IP in VPN provider range
  suspiciousAccuracy: boolean;    // GPS accuracy exactly 1m (fake)
  impossibleTravel: boolean;      // User moved 1000 miles in 1 hour
}

function detectSpoofing(pickLocations: PickLocation[]): SpoofingSignals {
  // Implementation would check:
  // 1. IP geolocation databases for VPN detection
  // 2. Velocity checks between picks
  // 3. Accuracy patterns (real GPS has variance)
  // 4. Device sensor consistency (if available)
}
```

---

## Part 6: Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
**Goal:** Basic flagging system using location data

- [ ] Create `collusionFlags` collection in Firestore
- [ ] Implement real-time proximity flagging during drafts
- [ ] Build dashboard for manual review of flagged pairs
- [ ] Define initial thresholds (within50ft + sameIp = flag)

**Output:** Ability to flag and review suspicious co-locations

### Phase 2: Behavioral Analysis (Weeks 3-4)
**Goal:** Add draft pattern analysis

- [ ] Integrate ADP data source (consensus rankings)
- [ ] Compute ADP deviation for all completed drafts
- [ ] Build pairwise benefit analysis
- [ ] Create risk scoring formula (weighted combination)

**Output:** Risk score for each user pair per draft

### Phase 3: Historical Pattern Mining (Weeks 5-6)
**Goal:** Cross-draft analysis

- [ ] Build location co-occurrence metrics
- [ ] Implement repeat offender detection
- [ ] Create "collusion ring" community detection
- [ ] Backfill analysis on historical drafts

**Output:** Identification of persistent suspicious patterns

### Phase 4: Machine Learning (Weeks 7-10)
**Goal:** Predictive models

- [ ] Label training data (manually reviewed cases)
- [ ] Train Isolation Forest for anomaly detection
- [ ] Train XGBoost for classification
- [ ] Evaluate and tune ensemble

**Output:** Automated risk scoring with ML

### Phase 5: Graph Neural Network (Weeks 11-14)
**Goal:** Advanced relationship modeling

- [ ] Build draft graph data structure
- [ ] Implement GNN architecture
- [ ] Train on historical collusion cases
- [ ] Integrate with ensemble

**Output:** State-of-the-art collusion detection

---

## Part 7: Thresholds and Decisions

### 7.1 Risk Tiers

| Tier | Score Range | Action | Volume Estimate |
|------|-------------|--------|-----------------|
| **Critical** | 90-100 | Immediate suspension pending review | ~0.01% of drafts |
| **High** | 70-89 | Flag for priority manual review | ~0.1% of drafts |
| **Medium** | 50-69 | Add to monitoring watchlist | ~1% of drafts |
| **Low** | 0-49 | No action, log for pattern mining | ~99% of drafts |

### 7.2 Decision Framework

```
IF score >= 90:
  → Suspend accounts
  → Void affected drafts
  → Escalate to integrity team

ELSE IF score >= 70:
  → Flag for review within 24 hours
  → Continue monitoring
  → Do not void yet

ELSE IF score >= 50:
  → Add to watchlist
  → Increase monitoring sensitivity
  → Review if pattern continues

ELSE:
  → No action
  → Log for future pattern mining
```

### 7.3 Appeals Process

1. **User notification** with specific concerns (not full algorithm details)
2. **Evidence review** by different analyst than original
3. **Response window** (72 hours)
4. **Final decision** with documentation

---

## Part 8: Privacy and Legal Considerations

### 8.1 Data Retention

| Data Type | Retention | Rationale |
|-----------|-----------|-----------|
| Pick locations | 1 year | Needed for season-long analysis |
| Collusion flags | 3 years | Pattern detection requires history |
| Risk scores | 3 years | Audit trail for decisions |
| Banned users | Indefinitely | Prevent re-registration |

### 8.2 User Consent

Your Terms of Service should include:
- Location tracking during drafts for integrity purposes
- Automated analysis of draft patterns
- Right to suspend accounts based on integrity violations
- Appeal process for disputed decisions

### 8.3 Transparency

- Never reveal exact algorithm details (prevents gaming)
- Provide general explanation of what triggers flags
- Document decision rationale for each case
- Maintain audit trail for legal defensibility

---

## Part 9: Success Metrics

### Detection Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Precision** | >90% | % of flagged cases that are true positives |
| **Recall** | >80% | % of actual collusion cases caught |
| **False Positive Rate** | <1% | % of legitimate users incorrectly flagged |
| **Time to Detection** | <24 hours | Average time from collusion to flag |

### Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **User trust** | >4.5/5 | Survey: "I trust the tournament is fair" |
| **Collusion incidents** | <0.1% | % of drafts with confirmed collusion |
| **Appeal success rate** | <10% | % of appeals that overturn decisions |
| **Detection cost** | <$0.01/draft | Compute + storage + review cost |

---

## Part 10: Research Sources

### Academic Papers
- [Collusion Detection with Graph Neural Networks](https://arxiv.org/abs/2410.07091) - GNN methodology for collusion detection
- [AI-based betting anomaly detection](https://pmc.ncbi.nlm.nih.gov/articles/PMC10948790/) - ML models for sports integrity
- [GoSage: Heterogeneous GNN for Collusion Fraud](https://dl.acm.org/doi/abs/10.1145/3604237.3626856) - Hierarchical attention for fraud

### Industry Resources
- [Fingerprint Proximity Detection](https://www.businesswire.com/news/home/20251209097107/en/Fingerprint-Announces-Proximity-Detection-to-Combat-Device-Farms-and-Multi-Accounting-Fraud) - Device proximity for fraud
- [SEON Device Fingerprinting](https://seon.io/resources/device-fingerprinting/) - Multi-accounting detection
- [Poker Collusion Detection](https://www.partypoker.com/blog/en/poker-collusion-what-is-it-and-how-do-we-detect-it.html) - Pattern analysis methods

### Case Studies
- [DraftKings Best Ball Collusion 2023](https://www.casino.org/news/draftkings-best-ball-draft-scrapped-after-charges-of-cheating/) - Real-world collusion example
- [DraftKings Game Integrity Unit](https://www.legalsportsreport.com/11026/draftkings-game-integrity/) - Industry integrity practices

### Technical Guides
- [Ensemble Fraud Detection](https://www.infoq.com/articles/fraud-detection-random-forest/) - Random Forest + XGBoost + Isolation Forest
- [Behavioral Analytics for Fraud](https://seon.io/resources/dictionary/behavioral-analysis/) - Feature engineering
- [Graph Fraud Detection Papers](https://github.com/safe-graph/graph-fraud-detection-papers) - Curated research list

---

## Conclusion

Building an effective collusion detection system for your $15M best ball tournament requires:

1. **Your location data is gold** — `within50ft` and `sameIp` are strong signals most platforms don't have
2. **Combine multiple signal types** — Location alone isn't enough; add behavioral and historical analysis
3. **Start simple, iterate** — Begin with rule-based flagging, add ML as you collect labeled data
4. **Human review is essential** — Automated systems flag; humans decide
5. **Document everything** — Audit trails protect you legally and improve the algorithm

The staged approach (real-time flagging → post-draft analysis → pattern mining → ML) lets you ship value quickly while building toward sophisticated detection.

**Next Steps:**
1. Review [`LOCATION_INTEGRITY_SYSTEM_DESIGN.md`](../LOCATION_INTEGRITY_SYSTEM_DESIGN.md) to ensure it captures all needed signals
2. Define initial flagging rules (thresholds for `within50ft` + `sameIp`)
3. Build manual review dashboard
4. Start collecting labeled data for future ML training
