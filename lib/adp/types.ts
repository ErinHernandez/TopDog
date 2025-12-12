/**
 * ADP (Average Draft Position) Types
 */

// ============================================================================
// SEED ADP (Manual, Pre-Season)
// ============================================================================

export interface ADPSeed {
  metadata: {
    createdBy: string;
    createdAt: string;
    season: string;
    description: string;
  };
  /** Player ID -> Initial ADP value */
  players: Record<string, number>;
}

// ============================================================================
// LIVE ADP (Algorithmic, 1-2x Daily)
// ============================================================================

export interface PlayerADP {
  /** Calculated ADP value */
  adp: number;
  /** Total times this player has been drafted */
  pickCount: number;
  /** Highest pick (earliest) */
  highPick: number;
  /** Lowest pick (latest) */
  lowPick: number;
  /** Standard deviation of pick positions */
  stdDev: number;
  /** Change from previous calculation */
  change: number;
}

/** Internal type with confidence (used for blending, not exposed) */
export interface PlayerADPInternal extends PlayerADP {
  /** Confidence score (0-1) based on sample size - internal use only */
  _confidence: number;
}

export interface LiveADP {
  metadata: {
    generatedAt: string;
    season: string;
    algorithm: string;
    /** Blend mode for calculation */
    blendMode: 'seed-only' | 'slow-only' | 'blended' | 'fast-only';
    /** Total drafts included in calculation */
    totalDrafts: number;
    /** Date range of drafts included */
    dateRange: {
      start: string;
      end: string;
    };
    /** Algorithm parameters used */
    params: ADPParams;
    /** Optional: Pick counts by type (for blended mode) */
    slowPicks?: number;
    fastPicks?: number;
  };
  players: Record<string, PlayerADP>;
}

// ============================================================================
// ALGORITHM PARAMETERS
// ============================================================================

export interface ADPParams {
  /** Days for recency half-life (e.g., 7 = drafts from 7 days ago have 50% weight) */
  decayDays: number;
  /** Minimum picks required for full confidence */
  minPicksForConfidence: number;
  /** Number of standard deviations for outlier removal */
  outlierThreshold: number;
  /** Maximum days of data to include */
  maxAgeDays: number;
  /** Blend ratio with seed when confidence is low (0-1) */
  seedBlendRatio: number;
}

// ============================================================================
// PICK DATA (Input to Algorithm)
// ============================================================================

export interface DraftPick {
  /** Player ID */
  playerId: string;
  /** Pick number (1-216 for 12-team, 18-round draft) */
  pickNumber: number;
  /** When the pick was made */
  timestamp: number;
  /** Draft ID (for grouping) */
  draftId: string;
  /** Draft type: 'fast' (30s/pick) or 'slow' (12h/pick) */
  draftType: 'fast' | 'slow';
}

// ============================================================================
// CALCULATION RESULT
// ============================================================================

export interface ADPCalculationResult {
  /** The generated ADP data */
  adp: LiveADP;
  /** Statistics about the calculation */
  stats: {
    playersCalculated: number;
    playersFromSeed: number;
    totalPicksProcessed: number;
    outliersRemoved: number;
    executionTimeMs: number;
  };
}

