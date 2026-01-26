/**
 * Draft Completion Tracker
 * Tracks when users complete drafts with comprehensive analytics
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const userMetrics = require('./userMetrics').default || require('./userMetrics').userMetrics;
import { createScopedLogger } from './clientLogger';

const logger = createScopedLogger('[DraftCompletionTracker]');

// ============================================================================
// TYPES
// ============================================================================

export interface DraftCompletionData {
  tournamentId: string;
  tournamentName: string;
  draftId: string;
  [key: string]: unknown;
}

export interface DraftStats {
  totalDraftsCompleted?: number;
  lastDraftCompletion?: string;
  daysSinceLastDraft?: number;
  hasRecentActivity?: boolean;
}

// ============================================================================
// CLASS
// ============================================================================

// Draft Completion Tracker
class DraftCompletionTracker {
  private isTracking: boolean = false;

  /**
   * Record when a user completes a draft with comprehensive personal data
   */
  recordDraftCompletion(
    tournamentId: string,
    tournamentName: string,
    draftId: string,
    additionalData: Record<string, unknown> = {}
  ): unknown {
    try {
      if (this.isTracking) {
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Draft completion already being recorded, skipping...');
        }
        return;
      }

      this.isTracking = true;

      // Collect comprehensive personal data
      const personalData = userMetrics.collectPersonalIdentifiers();
      const sessionData = userMetrics.collectSessionData();
      const deviceData = userMetrics.collectDeviceData();
      const locationData = userMetrics.collectLocationData();

      // Record the completion in user metrics with full personal data
      const metrics = userMetrics.recordDraftCompletion(
        tournamentId, 
        tournamentName, 
        draftId,
        {
          personalIdentifiers: personalData,
          sessionData: sessionData,
          deviceData: deviceData,
          locationData: locationData,
          ...additionalData
        }
      );

      // Track user behavior
      userMetrics.trackUserBehavior('draft_completion', {
        tournamentId,
        tournamentName,
        draftId,
        personalData,
        sessionData,
        deviceData,
        locationData,
        ...additionalData
      });

      if (process.env.NODE_ENV === 'development') {
        logger.debug('Draft completion recorded with comprehensive personal data', {
          tournamentName,
          draftId,
          timestamp: new Date().toISOString()
        });
      }

      // Trigger exposure data refresh if needed
      this.triggerExposureDataRefresh();

      return metrics;
    } catch (error) {
      logger.error('Failed to record draft completion', error instanceof Error ? error : new Error(String(error)));
      return null;
    } finally {
      this.isTracking = false;
    }
  }

  /**
   * Trigger exposure data refresh after draft completion
   */
  async triggerExposureDataRefresh(): Promise<void> {
    try {
      // Import dynamically to avoid circular dependencies
      const { default: exposurePreloader } = await import('./exposurePreloader');
      
      // Force refresh exposure data since user just completed a draft
      await exposurePreloader.forceRefresh();

      if (process.env.NODE_ENV === 'development') {
        logger.debug('Exposure data refresh triggered after draft completion');
      }
    } catch (error) {
      logger.warn('Failed to trigger exposure data refresh');
    }
  }

  /**
   * Get draft completion statistics
   */
  getDraftStats(): DraftStats {
    try {
      const summary = userMetrics.getActivitySummary();
      return {
        totalDraftsCompleted: summary.totalDraftsCompleted,
        lastDraftCompletion: summary.lastDraftCompletion,
        daysSinceLastDraft: summary.daysSinceLastDraft,
        hasRecentActivity: summary.hasRecentActivity
      };
    } catch (error) {
      logger.warn('Failed to get draft stats');
      return {};
    }
  }

  /**
   * Check if user should see exposure data (based on activity)
   */
  shouldShowExposureData(): boolean {
    try {
      const summary = userMetrics.getActivitySummary();
      
      // Show if user has completed any drafts
      if (summary.totalDraftsCompleted > 0) {
        return true;
      }

      // Show if user has recent activity
      if (summary.hasRecentActivity) {
        return true;
      }

      // Show if user has visited exposure page before
      const pageVisits = userMetrics.getMetrics().pageVisits || [];
      const hasVisitedExposure = pageVisits.some((visit: { page?: string }) => 
        visit.page?.includes('/exposure') || visit.page?.includes('exposure')
      );
      
      return hasVisitedExposure;
    } catch (error) {
      logger.warn('Failed to check if should show exposure data');
      return true; // Default to showing
    }
  }

  /**
   * Export user research data (anonymized)
   */
  exportResearchData(): Record<string, unknown> {
    try {
      return userMetrics.exportMetricsForResearch();
    } catch (error) {
      logger.warn('Failed to export research data');
      return {};
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// Create singleton instance
const draftCompletionTracker = new DraftCompletionTracker();

export default draftCompletionTracker;

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Convenience function for easy calling
 */
export const recordDraftCompletion = (
  tournamentId: string,
  tournamentName: string,
  draftId: string,
  additionalData: Record<string, unknown> = {}
): unknown => {
  return draftCompletionTracker.recordDraftCompletion(tournamentId, tournamentName, draftId, additionalData);
};
