/**
 * Data Validation and Quality Control
 *
 * Validates NFL player statistics across multiple sources for consistency,
 * reasonableness, and accuracy. Flags suspicious data for manual review.
 */

// ============================================================================
// TYPES
// ============================================================================

export type Position = 'QB' | 'RB' | 'WR' | 'TE';

export type ValidationStatus = 'PASS' | 'FAIL' | 'REVIEW';

interface StatBounds {
  min: number;
  max: number;
}

interface PositionBounds {
  games: StatBounds;
  passing?: {
    attempts: StatBounds;
    yards: StatBounds;
    touchdowns: StatBounds;
    interceptions: StatBounds;
    completion_pct: StatBounds;
  };
  rushing?: {
    attempts: StatBounds;
    yards: StatBounds;
    touchdowns: StatBounds;
    yards_per_attempt?: StatBounds;
  };
  receiving?: {
    receptions: StatBounds;
    yards: StatBounds;
    touchdowns: StatBounds;
    targets: StatBounds;
    yards_per_reception?: StatBounds;
  };
}

interface HistoricalRecords {
  QB: {
    passing_yards_season: number;
    passing_tds_season: number;
    rushing_yards_season: number;
  };
  RB: {
    rushing_yards_season: number;
    rushing_tds_season: number;
    receiving_yards_season: number;
  };
  WR: {
    receiving_yards_season: number;
    receiving_tds_season: number;
    receptions_season: number;
  };
}

interface SeasonStats {
  year: number;
  games: number;
  passing?: {
    attempts: number;
    completions: number;
    yards: number;
    touchdowns: number;
    interceptions: number;
  };
  rushing?: {
    attempts: number;
    yards: number;
    touchdowns: number;
    yardsPerAttempt?: number;
  };
  receiving?: {
    receptions: number;
    yards: number;
    touchdowns: number;
    targets: number;
    yardsPerReception?: number;
  };
}

interface CareerStats {
  games: number;
  rushing: {
    attempts: number;
    yards: number;
    touchdowns: number;
  };
  receiving: {
    receptions: number;
    yards: number;
    touchdowns: number;
    targets: number;
  };
}

interface MergedData {
  name: string;
  source: string;
  backupSources?: string[];
  reliability?: number;
  seasons: SeasonStats[];
  career: CareerStats;
  validation?: {
    conflicts?: number;
    consensus?: string;
    disputedStats?: unknown[];
  };
}

interface ValidationFlags {
  bounds_violations: number;
  consistency_issues: number;
  outlier_stats: number;
  missing_data: number;
}

interface SeasonValidation {
  issues: string[];
  warnings: string[];
  flags: ValidationFlags;
}

interface SourceQuality {
  primary_source: string;
  backup_sources: string[];
  reliability_score: number;
  source_agreement: {
    agreement_percentage: number;
    conflict_count: number;
  };
  data_freshness: {
    latest_season: number;
    seasons_behind: number;
    freshness: 'CURRENT' | 'STALE';
  };
}

interface CrossValidation {
  conflicts_detected: number;
  consensus_level: string;
  disputed_stats: unknown[];
}

interface PlayerValidation {
  player: string;
  position: Position;
  timestamp: string;
  overall: ValidationStatus;
  issues: string[];
  warnings: string[];
  flags: ValidationFlags;
  source_quality: SourceQuality;
  cross_validation: CrossValidation;
}

interface ValidationReport {
  total_players: number;
  passed: number;
  failed: number;
  needs_review: number;
  total_issues: number;
  total_warnings: number;
  common_issues: Array<{ issue: string; count: number }>;
  quality_metrics: {
    overall_pass_rate: number;
    avg_source_reliability: number;
    avg_source_agreement: number;
    data_freshness_rate: number;
  };
}

// ============================================================================
// CLASS
// ============================================================================

class DataValidator {
  private bounds: Record<Position, PositionBounds>;
  private historicalContext: {
    recordBreaking: HistoricalRecords;
  };

  constructor() {
    // Statistical bounds for reasonable NFL player stats
    this.bounds = {
      QB: {
        games: { min: 1, max: 17 },
        passing: {
          attempts: { min: 0, max: 800 },
          yards: { min: 0, max: 6000 },
          touchdowns: { min: 0, max: 60 },
          interceptions: { min: 0, max: 30 },
          completion_pct: { min: 0, max: 100 },
        },
        rushing: {
          attempts: { min: 0, max: 200 },
          yards: { min: -100, max: 1500 },
          touchdowns: { min: 0, max: 20 },
        },
      },
      RB: {
        games: { min: 1, max: 17 },
        rushing: {
          attempts: { min: 0, max: 500 },
          yards: { min: -50, max: 2500 },
          touchdowns: { min: 0, max: 30 },
          yards_per_attempt: { min: 0, max: 15 },
        },
        receiving: {
          receptions: { min: 0, max: 150 },
          yards: { min: 0, max: 2000 },
          touchdowns: { min: 0, max: 25 },
          targets: { min: 0, max: 200 },
        },
      },
      WR: {
        games: { min: 1, max: 17 },
        receiving: {
          receptions: { min: 0, max: 180 },
          yards: { min: 0, max: 2500 },
          touchdowns: { min: 0, max: 30 },
          targets: { min: 0, max: 250 },
          yards_per_reception: { min: 0, max: 50 },
        },
        rushing: {
          attempts: { min: 0, max: 50 },
          yards: { min: -50, max: 500 },
          touchdowns: { min: 0, max: 10 },
        },
      },
      TE: {
        games: { min: 1, max: 17 },
        receiving: {
          receptions: { min: 0, max: 150 },
          yards: { min: 0, max: 1800 },
          touchdowns: { min: 0, max: 25 },
          targets: { min: 0, max: 200 },
        },
        rushing: {
          attempts: { min: 0, max: 20 },
          yards: { min: -20, max: 200 },
          touchdowns: { min: 0, max: 5 },
        },
      },
    };

    // Historical context for detecting outliers
    this.historicalContext = {
      recordBreaking: {
        QB: {
          passing_yards_season: 5477, // Drew Brees 2011
          passing_tds_season: 55, // Peyton Manning 2013
          rushing_yards_season: 1206, // Lamar Jackson 2019
        },
        RB: {
          rushing_yards_season: 2105, // Eric Dickerson 1984
          rushing_tds_season: 28, // LaDainian Tomlinson 2006
          receiving_yards_season: 2137, // Christian McCaffrey (theoretical)
        },
        WR: {
          receiving_yards_season: 1964, // Calvin Johnson 2012
          receiving_tds_season: 23, // Randy Moss 2007
          receptions_season: 149, // Michael Thomas 2019
        },
      },
    };
  }

  /**
   * Validate complete player dataset
   */
  validatePlayerData(
    playerName: string,
    position: Position,
    mergedData: MergedData,
  ): PlayerValidation {
    const validation: PlayerValidation = {
      player: playerName,
      position: position,
      timestamp: new Date().toISOString(),
      overall: 'PASS',
      issues: [],
      warnings: [],
      flags: {
        bounds_violations: 0,
        consistency_issues: 0,
        outlier_stats: 0,
        missing_data: 0,
      },
      source_quality: this.assessSourceQuality(mergedData),
      cross_validation: this.crossValidateStats(mergedData),
    };

    // Validate each season
    mergedData.seasons.forEach(season => {
      const seasonValidation = this.validateSeason(playerName, position, season);
      validation.issues.push(...seasonValidation.issues);
      validation.warnings.push(...seasonValidation.warnings);

      // Aggregate flags
      Object.keys(validation.flags).forEach(flag => {
        const key = flag as keyof ValidationFlags;
        validation.flags[key] += seasonValidation.flags[key] || 0;
      });
    });

    // Validate career totals consistency
    const careerValidation = this.validateCareerTotals(mergedData.seasons, mergedData.career);
    validation.issues.push(...careerValidation.issues);
    validation.warnings.push(...careerValidation.warnings);

    // Determine overall status
    if (validation.issues.length > 0) {
      validation.overall = 'FAIL';
    } else if (validation.warnings.length > 3) {
      validation.overall = 'REVIEW';
    }

    return validation;
  }

  /**
   * Validate individual season data
   */
  private validateSeason(
    playerName: string,
    position: Position,
    season: SeasonStats,
  ): SeasonValidation {
    const validation: SeasonValidation = {
      issues: [],
      warnings: [],
      flags: {
        bounds_violations: 0,
        consistency_issues: 0,
        outlier_stats: 0,
        missing_data: 0,
      },
    };

    const positionBounds = this.bounds[position];
    if (!positionBounds) {
      validation.warnings.push(`Unknown position: ${position}`);
      return validation;
    }

    // Check basic bounds
    if (season.games < 1 || season.games > 17) {
      validation.issues.push(`Invalid games count: ${season.games}`);
      validation.flags.bounds_violations++;
    }

    // Position-specific validation
    if (position === 'QB') {
      this.validateQBStats(season, validation, positionBounds);
    } else if (position === 'RB') {
      this.validateRBStats(season, validation, positionBounds);
    } else if (position === 'WR' || position === 'TE') {
      this.validateReceivingStats(season, validation, positionBounds);
    }

    // Check for statistical consistency
    this.validateStatisticalConsistency(season, validation);

    // Check for historical outliers
    this.checkHistoricalOutliers(playerName, position, season, validation);

    return validation;
  }

  /**
   * Validate QB-specific statistics
   */
  private validateQBStats(
    season: SeasonStats,
    validation: SeasonValidation,
    bounds: PositionBounds,
  ): void {
    const passing = season.passing;
    const rushing = season.rushing;

    // Passing bounds
    if (bounds.passing && passing) {
      if (passing.attempts !== undefined) {
        this.checkBounds('passing_attempts', passing.attempts, bounds.passing.attempts, validation);
      }
      if (passing.yards !== undefined) {
        this.checkBounds('passing_yards', passing.yards, bounds.passing.yards, validation);
      }
      if (passing.touchdowns !== undefined) {
        this.checkBounds(
          'passing_touchdowns',
          passing.touchdowns,
          bounds.passing.touchdowns,
          validation,
        );
      }
      if (passing.interceptions !== undefined) {
        this.checkBounds(
          'passing_interceptions',
          passing.interceptions,
          bounds.passing.interceptions,
          validation,
        );
      }
    }

    // Rushing bounds (QBs can rush significantly)
    if (bounds.rushing && rushing) {
      if (rushing.attempts !== undefined) {
        this.checkBounds('rushing_attempts', rushing.attempts, bounds.rushing.attempts, validation);
      }
      if (rushing.yards !== undefined) {
        this.checkBounds('rushing_yards', rushing.yards, bounds.rushing.yards, validation);
      }
      if (rushing.touchdowns !== undefined) {
        this.checkBounds(
          'rushing_touchdowns',
          rushing.touchdowns,
          bounds.rushing.touchdowns,
          validation,
        );
      }
    }

    // QB-specific consistency checks
    if (passing && passing.completions !== undefined && passing.attempts !== undefined) {
      if (passing.completions > passing.attempts) {
        validation.issues.push(
          `Completions (${passing.completions}) > Attempts (${passing.attempts})`,
        );
        validation.flags.consistency_issues++;
      }

      const completionPct = (passing.completions / passing.attempts) * 100;
      if (completionPct < 30 || completionPct > 95) {
        validation.warnings.push(`Unusual completion %: ${completionPct.toFixed(1)}%`);
      }
    }
  }

  /**
   * Validate RB-specific statistics
   */
  private validateRBStats(
    season: SeasonStats,
    validation: SeasonValidation,
    bounds: PositionBounds,
  ): void {
    const rushing = season.rushing;
    const receiving = season.receiving;

    // Rushing bounds (primary for RBs)
    if (bounds.rushing && rushing) {
      if (rushing.attempts !== undefined) {
        this.checkBounds('rushing_attempts', rushing.attempts, bounds.rushing.attempts, validation);
      }
      if (rushing.yards !== undefined) {
        this.checkBounds('rushing_yards', rushing.yards, bounds.rushing.yards, validation);
      }
      if (rushing.touchdowns !== undefined) {
        this.checkBounds(
          'rushing_touchdowns',
          rushing.touchdowns,
          bounds.rushing.touchdowns,
          validation,
        );
      }
    }

    // Receiving bounds
    if (bounds.receiving && receiving) {
      if (receiving.receptions !== undefined) {
        this.checkBounds(
          'receiving_receptions',
          receiving.receptions,
          bounds.receiving.receptions,
          validation,
        );
      }
      if (receiving.yards !== undefined) {
        this.checkBounds('receiving_yards', receiving.yards, bounds.receiving.yards, validation);
      }
      if (receiving.touchdowns !== undefined) {
        this.checkBounds(
          'receiving_touchdowns',
          receiving.touchdowns,
          bounds.receiving.touchdowns,
          validation,
        );
      }
      if (receiving.targets !== undefined) {
        this.checkBounds(
          'receiving_targets',
          receiving.targets,
          bounds.receiving.targets,
          validation,
        );
      }
    }

    // RB-specific consistency
    if (receiving && receiving.receptions !== undefined && receiving.targets !== undefined) {
      if (receiving.receptions > receiving.targets) {
        validation.issues.push(
          `Receptions (${receiving.receptions}) > Targets (${receiving.targets})`,
        );
        validation.flags.consistency_issues++;
      }
    }

    // Check for unusual RB receiving volume
    if (receiving && receiving.receptions !== undefined && receiving.receptions > 100) {
      validation.warnings.push(`High RB receptions: ${receiving.receptions}`);
    }
  }

  /**
   * Validate WR/TE receiving statistics
   */
  private validateReceivingStats(
    season: SeasonStats,
    validation: SeasonValidation,
    bounds: PositionBounds,
  ): void {
    const receiving = season.receiving;
    const rushing = season.rushing;

    // Receiving bounds (primary for WR/TE)
    if (bounds.receiving && receiving) {
      if (receiving.receptions !== undefined) {
        this.checkBounds(
          'receiving_receptions',
          receiving.receptions,
          bounds.receiving.receptions,
          validation,
        );
      }
      if (receiving.yards !== undefined) {
        this.checkBounds('receiving_yards', receiving.yards, bounds.receiving.yards, validation);
      }
      if (receiving.touchdowns !== undefined) {
        this.checkBounds(
          'receiving_touchdowns',
          receiving.touchdowns,
          bounds.receiving.touchdowns,
          validation,
        );
      }
      if (receiving.targets !== undefined) {
        this.checkBounds(
          'receiving_targets',
          receiving.targets,
          bounds.receiving.targets,
          validation,
        );
      }
    }

    // Rushing bounds (occasional for WR/TE)
    if (bounds.rushing && rushing) {
      if (rushing.attempts !== undefined) {
        this.checkBounds('rushing_attempts', rushing.attempts, bounds.rushing.attempts, validation);
      }
      if (rushing.yards !== undefined) {
        this.checkBounds('rushing_yards', rushing.yards, bounds.rushing.yards, validation);
      }
      if (rushing.touchdowns !== undefined) {
        this.checkBounds(
          'rushing_touchdowns',
          rushing.touchdowns,
          bounds.rushing.touchdowns,
          validation,
        );
      }
    }

    // Consistency checks
    if (receiving && receiving.receptions !== undefined && receiving.targets !== undefined) {
      if (receiving.receptions > receiving.targets) {
        validation.issues.push(
          `Receptions (${receiving.receptions}) > Targets (${receiving.targets})`,
        );
        validation.flags.consistency_issues++;
      }

      const catchRate = (receiving.receptions / receiving.targets) * 100;
      if (catchRate > 95 && receiving.targets > 20) {
        validation.warnings.push(`Unusually high catch rate: ${catchRate.toFixed(1)}%`);
      }
    }
  }

  /**
   * Check statistical consistency within a season
   */
  private validateStatisticalConsistency(season: SeasonStats, validation: SeasonValidation): void {
    const rushing = season.rushing;
    const receiving = season.receiving;

    // Yards per attempt consistency
    if (
      rushing &&
      rushing.attempts !== undefined &&
      rushing.attempts > 0 &&
      rushing.yards !== undefined
    ) {
      const calculatedYPA = rushing.yards / rushing.attempts;
      const reportedYPA = rushing.yardsPerAttempt;

      if (reportedYPA !== undefined && Math.abs(calculatedYPA - reportedYPA) > 0.2) {
        validation.warnings.push(
          `YPA mismatch: calculated ${calculatedYPA.toFixed(1)} vs reported ${reportedYPA}`,
        );
        validation.flags.consistency_issues++;
      }
    }

    // Yards per reception consistency
    if (
      receiving &&
      receiving.receptions !== undefined &&
      receiving.receptions > 0 &&
      receiving.yards !== undefined
    ) {
      const calculatedYPR = receiving.yards / receiving.receptions;
      const reportedYPR = receiving.yardsPerReception;

      if (reportedYPR !== undefined && Math.abs(calculatedYPR - reportedYPR) > 0.2) {
        validation.warnings.push(
          `YPR mismatch: calculated ${calculatedYPR.toFixed(1)} vs reported ${reportedYPR}`,
        );
        validation.flags.consistency_issues++;
      }
    }
  }

  /**
   * Check for historical outliers
   */
  private checkHistoricalOutliers(
    playerName: string,
    position: Position,
    season: SeasonStats,
    validation: SeasonValidation,
  ): void {
    const records = this.historicalContext.recordBreaking[position as keyof HistoricalRecords];
    if (!records) return;

    // Check against historical records
    if (position === 'QB' && 'passing_yards_season' in records) {
      const qbRecords = records as HistoricalRecords['QB'];
      if (
        season.passing?.yards !== undefined &&
        season.passing.yards > qbRecords.passing_yards_season * 0.9
      ) {
        validation.warnings.push(`Exceptional passing yards: ${season.passing.yards}`);
        validation.flags.outlier_stats++;
      }
      if (
        season.rushing?.yards !== undefined &&
        season.rushing.yards > qbRecords.rushing_yards_season * 0.8
      ) {
        validation.warnings.push(`Exceptional QB rushing: ${season.rushing.yards}`);
        validation.flags.outlier_stats++;
      }
    } else if (position === 'RB' && 'rushing_yards_season' in records) {
      const rbRecords = records as HistoricalRecords['RB'];
      if (
        season.rushing?.yards !== undefined &&
        season.rushing.yards > rbRecords.rushing_yards_season * 0.8
      ) {
        validation.warnings.push(`Exceptional rushing yards: ${season.rushing.yards}`);
        validation.flags.outlier_stats++;
      }
    } else if (position === 'WR' && 'receiving_yards_season' in records) {
      const wrRecords = records as HistoricalRecords['WR'];
      if (
        season.receiving?.yards !== undefined &&
        season.receiving.yards > wrRecords.receiving_yards_season * 0.9
      ) {
        validation.warnings.push(`Exceptional receiving yards: ${season.receiving.yards}`);
        validation.flags.outlier_stats++;
      }
    }
  }

  /**
   * Validate career totals match season summation
   */
  private validateCareerTotals(
    seasons: SeasonStats[],
    career: CareerStats,
  ): { issues: string[]; warnings: string[] } {
    const validation: { issues: string[]; warnings: string[] } = { issues: [], warnings: [] };

    if (!seasons || seasons.length === 0) {
      validation.issues.push('No season data for career validation');
      return validation;
    }

    // Sum up seasons
    const calculated = {
      games: 0,
      rushing: { attempts: 0, yards: 0, touchdowns: 0 },
      receiving: { receptions: 0, yards: 0, touchdowns: 0, targets: 0 },
    };

    seasons.forEach(season => {
      calculated.games += season.games || 0;
      calculated.rushing.attempts += season.rushing?.attempts || 0;
      calculated.rushing.yards += season.rushing?.yards || 0;
      calculated.rushing.touchdowns += season.rushing?.touchdowns || 0;
      calculated.receiving.receptions += season.receiving?.receptions || 0;
      calculated.receiving.yards += season.receiving?.yards || 0;
      calculated.receiving.touchdowns += season.receiving?.touchdowns || 0;
      calculated.receiving.targets += season.receiving?.targets || 0;
    });

    // Compare with career totals
    const tolerance = 5; // Allow small discrepancies

    if (Math.abs(calculated.games - career.games) > tolerance) {
      validation.issues.push(
        `Career games mismatch: calculated ${calculated.games} vs career ${career.games}`,
      );
    }

    if (Math.abs(calculated.rushing.yards - career.rushing.yards) > tolerance) {
      validation.warnings.push(
        `Career rushing yards mismatch: calculated ${calculated.rushing.yards} vs career ${career.rushing.yards}`,
      );
    }

    if (Math.abs(calculated.receiving.yards - career.receiving.yards) > tolerance) {
      validation.warnings.push(
        `Career receiving yards mismatch: calculated ${calculated.receiving.yards} vs career ${career.receiving.yards}`,
      );
    }

    return validation;
  }

  /**
   * Assess source quality and reliability
   */
  private assessSourceQuality(mergedData: MergedData): SourceQuality {
    return {
      primary_source: mergedData.source,
      backup_sources: mergedData.backupSources || [],
      reliability_score: mergedData.reliability || 0,
      source_agreement: this.calculateSourceAgreement(mergedData),
      data_freshness: this.assessDataFreshness(mergedData),
    };
  }

  /**
   * Cross-validate statistics between different data sources
   */
  private crossValidateStats(mergedData: MergedData): CrossValidation {
    return {
      conflicts_detected: mergedData.validation?.conflicts || 0,
      consensus_level: mergedData.validation?.consensus || 'unknown',
      disputed_stats: mergedData.validation?.disputedStats || [],
    };
  }

  /**
   * Check if a value is within acceptable bounds
   */
  private checkBounds(
    statName: string,
    value: number | null | undefined,
    bounds: StatBounds,
    validation: SeasonValidation,
  ): void {
    if (value === null || value === undefined) {
      validation.warnings.push(`Missing data: ${statName}`);
      validation.flags.missing_data++;
      return;
    }

    if (value < bounds.min || value > bounds.max) {
      validation.issues.push(
        `${statName} out of bounds: ${value} (expected ${bounds.min}-${bounds.max})`,
      );
      validation.flags.bounds_violations++;
    }
  }

  /**
   * Calculate agreement level between sources
   */
  private calculateSourceAgreement(mergedData: MergedData): {
    agreement_percentage: number;
    conflict_count: number;
  } {
    // This would analyze conflicts in the merged data
    const conflicts = mergedData.validation?.conflicts || 0;
    const totalStats = 20; // Approximate number of stats we track

    return {
      agreement_percentage: ((totalStats - conflicts) / totalStats) * 100,
      conflict_count: conflicts,
    };
  }

  /**
   * Assess how fresh/recent the data is
   */
  private assessDataFreshness(mergedData: MergedData): {
    latest_season: number;
    seasons_behind: number;
    freshness: 'CURRENT' | 'STALE';
  } {
    const currentYear = new Date().getFullYear();
    const seasonYears = mergedData.seasons?.map(s => s.year) || [];
    const latestSeason = seasonYears.length > 0 ? Math.max(...seasonYears) : currentYear;

    return {
      latest_season: latestSeason,
      seasons_behind: currentYear - latestSeason,
      freshness: latestSeason >= currentYear - 1 ? 'CURRENT' : 'STALE',
    };
  }

  /**
   * Generate validation summary report
   */
  generateValidationReport(validations: PlayerValidation[]): ValidationReport {
    const summary: ValidationReport = {
      total_players: validations.length,
      passed: validations.filter(v => v.overall === 'PASS').length,
      failed: validations.filter(v => v.overall === 'FAIL').length,
      needs_review: validations.filter(v => v.overall === 'REVIEW').length,
      total_issues: validations.reduce((sum, v) => sum + v.issues.length, 0),
      total_warnings: validations.reduce((sum, v) => sum + v.warnings.length, 0),
      common_issues: this.findCommonIssues(validations),
      quality_metrics: this.calculateQualityMetrics(validations),
    };

    return summary;
  }

  /**
   * Find the most common validation issues
   */
  private findCommonIssues(
    validations: PlayerValidation[],
  ): Array<{ issue: string; count: number }> {
    const issueMap = new Map<string, number>();

    validations.forEach(validation => {
      validation.issues.forEach(issue => {
        const key = issue.split(':')[0]!; // Get issue type
        issueMap.set(key, (issueMap.get(key) || 0) + 1);
      });
    });

    return Array.from(issueMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));
  }

  /**
   * Calculate overall data quality metrics
   */
  private calculateQualityMetrics(
    validations: PlayerValidation[],
  ): ValidationReport['quality_metrics'] {
    const total = validations.length;
    if (total === 0) {
      return {
        overall_pass_rate: 0,
        avg_source_reliability: 0,
        avg_source_agreement: 0,
        data_freshness_rate: 0,
      };
    }

    return {
      overall_pass_rate: (validations.filter(v => v.overall === 'PASS').length / total) * 100,
      avg_source_reliability:
        validations.reduce((sum, v) => sum + (v.source_quality.reliability_score || 0), 0) / total,
      avg_source_agreement:
        validations.reduce(
          (sum, v) => sum + (v.source_quality.source_agreement.agreement_percentage || 0),
          0,
        ) / total,
      data_freshness_rate:
        (validations.filter(v => v.source_quality.data_freshness.freshness === 'CURRENT').length /
          total) *
        100,
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export singleton instance
const dataValidator = new DataValidator();

export { dataValidator };
