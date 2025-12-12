import userMetrics from './userMetrics';

// Draft Completion Tracker
class DraftCompletionTracker {
  constructor() {
    this.isTracking = false;
  }

  // Record when a user completes a draft with comprehensive personal data
  recordDraftCompletion(tournamentId, tournamentName, draftId, additionalData = {}) {
    try {
      if (this.isTracking) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Draft completion already being recorded, skipping...');
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
        console.log('✅ Draft completion recorded with comprehensive personal data:', {
          tournamentName,
          draftId,
          timestamp: new Date().toISOString(),
          personalData,
          sessionData,
          deviceData,
          locationData
        });
      }

      // Trigger exposure data refresh if needed
      this.triggerExposureDataRefresh();

      return metrics;
    } catch (error) {
      console.error('❌ Failed to record draft completion:', error);
      return null;
    } finally {
      this.isTracking = false;
    }
  }

  // Trigger exposure data refresh after draft completion
  async triggerExposureDataRefresh() {
    try {
      // Import dynamically to avoid circular dependencies
      const { default: exposurePreloader } = await import('./exposurePreloader');
      
      // Force refresh exposure data since user just completed a draft
      await exposurePreloader.forceRefresh();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Exposure data refresh triggered after draft completion');
      }
    } catch (error) {
      console.warn('Failed to trigger exposure data refresh:', error);
    }
  }

  // Get draft completion statistics
  getDraftStats() {
    try {
      const summary = userMetrics.getActivitySummary();
      return {
        totalDraftsCompleted: summary.totalDraftsCompleted,
        lastDraftCompletion: summary.lastDraftCompletion,
        daysSinceLastDraft: summary.daysSinceLastDraft,
        hasRecentActivity: summary.hasRecentActivity
      };
    } catch (error) {
      console.warn('Failed to get draft stats:', error);
      return {};
    }
  }

  // Check if user should see exposure data (based on activity)
  shouldShowExposureData() {
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
      const hasVisitedExposure = pageVisits.some(visit => 
        visit.page.includes('/exposure') || visit.page.includes('exposure')
      );
      
      return hasVisitedExposure;
    } catch (error) {
      console.warn('Failed to check if should show exposure data:', error);
      return true; // Default to showing
    }
  }

  // Export user research data (anonymized)
  exportResearchData() {
    try {
      return userMetrics.exportMetricsForResearch();
    } catch (error) {
      console.warn('Failed to export research data:', error);
      return {};
    }
  }
}

// Create singleton instance
const draftCompletionTracker = new DraftCompletionTracker();

export default draftCompletionTracker;

// Convenience function for easy calling
export const recordDraftCompletion = (tournamentId, tournamentName, draftId, additionalData) => {
  return draftCompletionTracker.recordDraftCompletion(tournamentId, tournamentName, draftId, additionalData);
};
