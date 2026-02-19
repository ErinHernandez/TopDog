/**
 * TypeScript interfaces for Location Integrity System
 */

import { Timestamp } from 'firebase/firestore';

export interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  ipAddress: string;
}

export interface PickLocationData {
  draftId: string;
  pickNumber: number;
  userId: string;
  location: LocationData;
  deviceId: string;
}

export type DivisionType =
  | 'province'    // Canada, China, South Africa, Netherlands
  | 'state'       // Australia, Brazil, Mexico, India, Germany
  | 'region'      // France, Italy, Spain, Chile
  | 'country'     // UK constituent countries (England, Scotland, Wales, NI)
  | 'prefecture'  // Japan
  | 'territory'   // Canadian territories, Australian territories
  | 'district'    // Other
  | 'other';

export interface PickLocationRecord {
  id: string;
  draftId: string;
  pickNumber: number;
  userId: string;
  timestamp: Timestamp;
  lat: number;
  lng: number;
  accuracy: number;
  ipAddress: string;
  countyCode: string | null;
  countryCode: string;
  stateCode: string | null;
  // International administrative division (ISO 3166-2)
  divisionCode: string | null;      // e.g., "CA-ON", "AU-NSW", "GB-ENG"
  divisionName: string | null;      // e.g., "Ontario", "New South Wales"
  divisionType: DivisionType | null;
  within50ft: string[];
  sameIp: string[];
  deviceId: string;
  createdAt: Timestamp;
}

export interface ProximityFlags {
  within50ft: string[];
  sameIp: string[];
}

export interface BadgeRecord {
  code: string;
  name: string;
  firstEarned: Timestamp;
  lastSeen: Timestamp;
  pickCount: number;
  // Optional metadata for divisions
  divisionType?: DivisionType;
}

export interface UserBadges {
  userId: string;
  countries: BadgeRecord[];
  states: BadgeRecord[];
  counties: BadgeRecord[];
  divisions: BadgeRecord[];  // International administrative divisions
  updatedAt: Timestamp;
  createdAt: Timestamp;
}

export interface DraftLocationState {
  draftId: string;
  locations: {
    [userId: string]: {
      lat: number;
      lng: number;
      ipAddress: string;
      lastPickNumber: number;
      timestamp: Timestamp;
    };
  };
  updatedAt: Timestamp;
}

// ============================================================================
// COLLUSION DETECTION TYPES
// ============================================================================

// === STAGE 1: Real-Time Flagging ===

export interface DraftIntegrityFlags {
  draftId: string;
  flaggedPairs: IntegrityFlag[];
  totalWithin50ftEvents: number;
  totalSameIpEvents: number;
  uniqueUserPairsFlagged: number;
  draftStartedAt: Timestamp;
  lastUpdatedAt: Timestamp;
  status: 'active' | 'completed' | 'reviewed';
}

export interface IntegrityFlag {
  userId1: string;
  userId2: string;
  flagType: 'within50ft' | 'sameIp' | 'both';
  events: FlagEvent[];
  firstDetectedAt: Timestamp;
  lastDetectedAt: Timestamp;
  eventCount: number;
}

export interface FlagEvent {
  pickNumber: number;
  triggeringUserId: string;
  otherUserId: string;
  distance?: number;
  timestamp: Timestamp;
}

// === STAGE 2: Post-Draft Risk Scoring ===

export interface DraftRiskScores {
  draftId: string;
  analyzedAt: Timestamp;
  pairScores: PairRiskScore[];
  maxRiskScore: number;
  avgRiskScore: number;
  pairsAboveThreshold: number;
  status: 'pending' | 'analyzed' | 'reviewed';
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  reviewNotes?: string;
  reviewAction?: string;
}

export interface PairRiskScore {
  userId1: string;
  userId2: string;
  locationScore: number;
  behaviorScore: number;
  benefitScore: number;
  compositeScore: number;
  flags: string[];
  recommendation: 'clear' | 'monitor' | 'review' | 'urgent';
}

// === STAGE 3: Cross-Draft Analysis ===

export interface UserPairAnalysis {
  pairId: string;
  userId1: string;
  userId2: string;
  totalDraftsTogether: number;
  draftsWithin50ft: number;
  draftsSameIp: number;
  draftsWithBothFlags: number;
  coLocationRate: number;
  sameIpRate: number;
  avgRiskScoreColocated: number;
  avgRiskScoreNotColocated: number;
  riskScoreDifferential: number;
  riskScoreHistory: {
    draftId: string;
    score: number;
    wasColocated: boolean;
    timestamp: Timestamp;
  }[];
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  firstDraftTogether: Timestamp;
  lastDraftTogether: Timestamp;
  lastAnalyzedAt: Timestamp;
  lastReviewedBy?: string;
  lastReviewedAt?: Timestamp;
  lastReviewAction?: string;
}

// === STAGE 4: Admin Actions ===

export interface AdminAction {
  id: string;
  targetType: 'draft' | 'userPair' | 'user';
  targetId: string;
  adminId: string;
  adminEmail: string;
  timestamp: Timestamp;
  action: 'cleared' | 'warned' | 'suspended' | 'banned' | 'escalated';
  reason: string;
  notes?: string;
  evidenceSnapshot: object;
}

// === Draft Pick Interface (for analysis) ===

export interface DraftPick {
  pickNumber: number;
  userId: string;
  playerId: string;
  timestamp: Timestamp;
}
