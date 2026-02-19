/**
 * User Metrics System for Research and Caching Optimization
 */

import type { User } from 'firebase/auth';

import { createScopedLogger } from './clientLogger';
import { auth } from './firebase';

const logger = createScopedLogger('[UserMetrics]');

// ============================================================================
// TYPES
// ============================================================================

export interface PersonalIdentifiers {
  userId: string | null;
  sessionId: string;
  persistentId?: string | null;
  email?: string | null;
  username?: string | null;
  phoneNumber?: string | null;
  ipAddress?: string | null;
  socialMediaIds?: Record<string, string | null>;
  deviceId?: string | null;
  browserId?: string | null;
  canvasFingerprint?: string | null;
  webglFingerprint?: {
    vendor: string;
    renderer: string;
  } | null;
  audioFingerprint?: string | null;
  fontFingerprint?: string | null;
  timestamp: number;
}

export interface SessionData {
  sessionId: string;
  sessionStartTime?: number;
  sessionDuration?: number;
  pageViews?: unknown[];
  userInteractions?: unknown[];
  scrollDepth?: number;
  timeOnPage?: number;
  mouseMovements?: unknown[];
  keyboardEvents?: unknown[];
  touchEvents?: unknown[];
  referrer?: string;
  landingPage?: string;
  utmParams?: {
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    utm_term?: string | null;
    utm_content?: string | null;
  };
  timestamp: number;
}

export interface DeviceData {
  userAgent?: string;
  platform?: string;
  language?: string;
  languages?: readonly string[];
  cookieEnabled?: boolean;
  doNotTrack?: string | null;
  screenWidth?: number;
  screenHeight?: number;
  colorDepth?: number;
  pixelDepth?: number;
  devicePixelRatio?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  timezone?: string;
  timezoneOffset?: number;
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  } | null;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  maxTouchPoints?: number;
  vendor?: string;
  product?: string;
  appName?: string;
  appVersion?: string;
  buildId?: string | undefined;
  oscpu?: string | undefined;
  plugins?: Array<{
    name: string;
    description: string;
    filename: string;
  }>;
  mimeTypes?: Array<{
    type: string;
    description: string;
    enabledPlugin?: string;
  }>;
  timestamp: number;
}

export interface LocationData {
  ipLocation?: string | null;
  gpsLocation?: string | null;
  timezone?: string;
  timezoneOffset?: number;
  locale?: string;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  postalCode?: string | null;
  timestamp: number;
}

export interface UserFingerprint {
  userId: string | null;
  sessionId: string;
  userAgent?: string;
  language?: string;
  languages?: readonly string[];
  platform?: string;
  cookieEnabled?: boolean;
  doNotTrack?: string | null;
  screenWidth?: number;
  screenHeight?: number;
  colorDepth?: number;
  pixelDepth?: number;
  timezone?: string;
  timezoneOffset?: number;
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  } | null;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  maxTouchPoints?: number;
  vendor?: string;
  referrer?: string;
  url?: string;
  timestamp: number;
}

export interface DraftCompletion {
  timestamp: number;
  tournamentId: string;
  tournamentName: string;
  draftId: string;
  date: string;
  userId: string | null;
  sessionId: string;
  userFingerprint?: UserFingerprint;
  [key: string]: unknown;
}

export interface PageVisit {
  page: string;
  referrer: string | null;
  timestamp: number;
  date: string;
  userId: string | null;
  sessionId: string;
  userFingerprint?: UserFingerprint;
}

interface UserMetrics {
  lastDraftCompletion?: DraftCompletion;
  draftCompletions?: DraftCompletion[];
  totalDraftsCompleted?: number;
  lastActivity?: number;
  pageVisits?: PageVisit[];
  [key: string]: unknown;
}

export interface ActivitySummary {
  userId: string | null;
  sessionId: string;
  userFingerprint?: UserFingerprint;
  totalDraftsCompleted: number;
  lastDraftCompletion?: DraftCompletion;
  lastActivity?: number;
  daysSinceLastDraft: number | null;
  hasRecentActivity: boolean;
  totalPageVisits: number;
  lastPageVisit: PageVisit | null;
}

export interface ComprehensiveUserData {
  userId: string | null;
  sessionId: string;
  personalIdentifiers: PersonalIdentifiers;
  sessionData: SessionData;
  deviceData: DeviceData;
  locationData: LocationData;
  activitySummary: ActivitySummary;
  draftCompletions: DraftCompletion[];
  pageVisits: PageVisit[];
  lastActivity?: number;
  totalDraftsCompleted: number;
  userFingerprint: UserFingerprint;
  fullMetrics: UserMetrics;
  timestamp: number;
}

interface WindowWithGtag extends Window {
  gtag?: (command: string, event: string, params: Record<string, unknown>) => void;
}

// ============================================================================
// CLASS
// ============================================================================

class UserMetrics {
  private metricsKey: string;
  private draftCompletionKey: string;
  private exposureDataKey: string;
  private exposureTimestampKey: string;
  private userId: string | null;
  private sessionId: string;
  private sessionStartTime: number;
  private landingPage: string | undefined;
  private pageViews: unknown[] | undefined;
  private userInteractions: unknown[] | undefined;
  private scrollDepth: number | undefined;
  private timeOnPage: number | undefined;
  private mouseMovements: unknown[] | undefined;
  private keyboardEvents: unknown[] | undefined;
  private touchEvents: unknown[] | undefined;

  constructor() {
    this.metricsKey = 'topdog_user_metrics';
    this.draftCompletionKey = 'topdog_last_draft_completion';
    this.exposureDataKey = 'topdog_exposure_data_cache';
    this.exposureTimestampKey = 'topdog_exposure_data_timestamp';
    this.userId = this.generateUserId();
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    if (typeof window !== 'undefined') {
      this.landingPage = window.location.href;
    }
  }

  // Generate persistent user ID
  private generateUserId(): string | null {
    try {
      if (typeof window === 'undefined') return null;
      
      let userId = localStorage.getItem('topdog_user_id');
      if (!userId) {
        userId = `user_${  Date.now()  }_${  Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('topdog_user_id', userId);
      }
      return userId;
    } catch (error) {
      return `user_${  Date.now()  }_${  Math.random().toString(36).substr(2, 9)}`;
    }
  }

  // Generate session ID
  private generateSessionId(): string {
    return `session_${  Date.now()  }_${  Math.random().toString(36).substr(2, 9)}`;
  }

  // Collect comprehensive personal identifiers
  collectPersonalIdentifiers(): PersonalIdentifiers {
    try {
      if (typeof window === 'undefined') return {
        userId: this.userId,
        sessionId: this.sessionId,
        timestamp: Date.now()
      };
      
      return {
        userId: this.userId,
        sessionId: this.sessionId,
        persistentId: this.getPersistentId(),
        email: this.getStoredEmail(),
        username: this.getStoredUsername(),
        phoneNumber: this.getStoredPhone(),
        ipAddress: this.getStoredIP(),
        socialMediaIds: this.getSocialMediaIds(),
        deviceId: this.getDeviceId(),
        browserId: this.getBrowserId(),
        canvasFingerprint: this.getCanvasFingerprint(),
        webglFingerprint: this.getWebGLFingerprint(),
        audioFingerprint: this.getAudioFingerprint(),
        fontFingerprint: this.getFontFingerprint(),
        timestamp: Date.now()
      };
    } catch (error) {
      return { userId: this.userId, sessionId: this.sessionId, timestamp: Date.now() };
    }
  }

  // Collect session data
  collectSessionData(): SessionData {
    try {
      if (typeof window === 'undefined') return {
        sessionId: this.sessionId,
        timestamp: Date.now()
      };
      
      return {
        sessionId: this.sessionId,
        sessionStartTime: this.sessionStartTime,
        sessionDuration: Date.now() - this.sessionStartTime,
        pageViews: this.getPageViews(),
        userInteractions: this.getUserInteractions(),
        scrollDepth: this.getScrollDepth(),
        timeOnPage: this.getTimeOnPage(),
        mouseMovements: this.getMouseMovements(),
        keyboardEvents: this.getKeyboardEvents(),
        touchEvents: this.getTouchEvents(),
        referrer: document.referrer,
        landingPage: this.landingPage,
        utmParams: this.getUTMParams(),
        timestamp: Date.now()
      };
    } catch (error) {
      return { sessionId: this.sessionId, timestamp: Date.now() };
    }
  }

  // Collect device data
  collectDeviceData(): DeviceData {
    try {
      if (typeof window === 'undefined') return { timestamp: Date.now() };
      
      const nav = navigator;
      const screenObj = screen;
      const win = window;
      
      return {
        userAgent: nav.userAgent,
        platform: nav.platform,
        language: nav.language,
        languages: nav.languages,
        cookieEnabled: nav.cookieEnabled,
        doNotTrack: nav.doNotTrack,
        screenWidth: screenObj.width,
        screenHeight: screenObj.height,
        colorDepth: screenObj.colorDepth,
        pixelDepth: screenObj.pixelDepth,
        devicePixelRatio: win.devicePixelRatio,
        viewportWidth: win.innerWidth,
        viewportHeight: win.innerHeight,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        connection: (nav as unknown as { connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean } }).connection ? {
          effectiveType: (nav as unknown as { connection?: { effectiveType?: string } }).connection?.effectiveType,
          downlink: (nav as unknown as { connection?: { downlink?: number } }).connection?.downlink,
          rtt: (nav as unknown as { connection?: { rtt?: number } }).connection?.rtt,
          saveData: (nav as unknown as { connection?: { saveData?: boolean } }).connection?.saveData
        } : null,
        hardwareConcurrency: nav.hardwareConcurrency,
        deviceMemory: (nav as unknown as { deviceMemory?: number }).deviceMemory,
        maxTouchPoints: nav.maxTouchPoints,
        vendor: nav.vendor,
        product: nav.product,
        appName: nav.appName,
        appVersion: nav.appVersion,
        buildId: (nav as unknown as { buildId?: string }).buildId,
        oscpu: (nav as unknown as { oscpu?: string }).oscpu,
        plugins: this.getPluginList(),
        mimeTypes: this.getMimeTypeList(),
        timestamp: Date.now()
      };
    } catch (error) {
      return { userAgent: navigator?.userAgent, timestamp: Date.now() };
    }
  }

  // Collect location data
  collectLocationData(): LocationData {
    try {
      if (typeof window === 'undefined') return { timestamp: Date.now() };
      
      return {
        ipLocation: this.getStoredIPLocation(),
        gpsLocation: this.getStoredGPSLocation(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        locale: navigator.language,
        country: this.getStoredCountry(),
        region: this.getStoredRegion(),
        city: this.getStoredCity(),
        postalCode: this.getStoredPostalCode(),
        timestamp: Date.now()
      };
    } catch (error) {
      return { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, timestamp: Date.now() };
    }
  }

  // Get comprehensive user fingerprint
  getUserFingerprint(): UserFingerprint {
    try {
      if (typeof window === 'undefined') return {
        userId: this.userId,
        sessionId: this.sessionId,
        timestamp: Date.now()
      };
      
      const nav = navigator;
      const screenObj = screen;
      const win = window;
      
      return {
        userId: this.userId,
        sessionId: this.sessionId,
        userAgent: nav.userAgent,
        language: nav.language,
        languages: nav.languages,
        platform: nav.platform,
        cookieEnabled: nav.cookieEnabled,
        doNotTrack: nav.doNotTrack,
        screenWidth: screenObj.width,
        screenHeight: screenObj.height,
        colorDepth: screenObj.colorDepth,
        pixelDepth: screenObj.pixelDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        connection: (nav as unknown as { connection?: { effectiveType?: string; downlink?: number; rtt?: number } }).connection ? {
          effectiveType: (nav as unknown as { connection?: { effectiveType?: string } }).connection?.effectiveType,
          downlink: (nav as unknown as { connection?: { downlink?: number } }).connection?.downlink,
          rtt: (nav as unknown as { connection?: { rtt?: number } }).connection?.rtt
        } : null,
        hardwareConcurrency: nav.hardwareConcurrency,
        deviceMemory: (nav as unknown as { deviceMemory?: number }).deviceMemory,
        maxTouchPoints: nav.maxTouchPoints,
        vendor: nav.vendor,
        referrer: document.referrer,
        url: win.location.href,
        timestamp: Date.now()
      };
    } catch (error) {
      return { userId: this.userId, sessionId: this.sessionId, timestamp: Date.now() };
    }
  }

  // Get all user metrics
  getMetrics(): UserMetrics {
    try {
      if (typeof window === 'undefined') return {} as UserMetrics;
      const metrics = localStorage.getItem(this.metricsKey);
      return metrics ? JSON.parse(metrics) as UserMetrics : {} as UserMetrics;
    } catch (error) {
      logger.warn('Failed to get user metrics, clearing corrupted data');
      // Clear corrupted data from localStorage to prevent future errors
      try {
        localStorage.removeItem(this.metricsKey);
      } catch (clearError) {
        logger.warn('Could not clear corrupted metrics from localStorage');
      }
      return {} as UserMetrics;
    }
  }

  // Save all user metrics
  saveMetrics(metrics: UserMetrics): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(this.metricsKey, JSON.stringify(metrics));
      
      // Send to analytics immediately
      this.sendToAnalytics('metrics_updated', metrics);
    } catch (error) {
      logger.warn('Failed to save user metrics');
    }
  }

  // Record draft completion with full personal data
  recordDraftCompletion(
    tournamentId: string,
    tournamentName: string,
    draftId: string,
    additionalData: Record<string, unknown> = {}
  ): UserMetrics | null {
    try {
      const metrics = this.getMetrics();
      const timestamp = Date.now();
      const fingerprint = this.getUserFingerprint();
      
      // Update last draft completion with full personal data
      metrics.lastDraftCompletion = {
        timestamp,
        tournamentId,
        tournamentName,
        draftId,
        date: new Date(timestamp).toISOString(),
        userId: this.userId,
        sessionId: this.sessionId,
        userFingerprint: fingerprint,
        ...additionalData
      };

      // Track draft completion history with personal identifiers
      if (!metrics.draftCompletions) {
        metrics.draftCompletions = [];
      }
      
      metrics.draftCompletions.push({
        timestamp,
        tournamentId,
        tournamentName,
        draftId,
        date: new Date(timestamp).toISOString(),
        userId: this.userId,
        sessionId: this.sessionId,
        userFingerprint: fingerprint,
        ...additionalData
      });

      // Keep only last 100 completions for performance
      if (metrics.draftCompletions.length > 100) {
        metrics.draftCompletions = metrics.draftCompletions.slice(-100);
      }

      // Update total drafts completed
      metrics.totalDraftsCompleted = (metrics.totalDraftsCompleted || 0) + 1;
      
      // Update last activity
      metrics.lastActivity = timestamp;

      this.saveMetrics(metrics);
      
      // Send to Google Analytics
      this.sendToGoogleAnalytics('draft_completion', {
        tournament_id: tournamentId,
        tournament_name: tournamentName,
        draft_id: draftId,
        user_id: this.userId,
        session_id: this.sessionId,
        total_drafts: metrics.totalDraftsCompleted,
        ...additionalData
      });

      // Send to external analytics API
      this.sendToAnalytics('draft_completion', {
        tournamentId,
        tournamentName,
        draftId,
        userId: this.userId,
        sessionId: this.sessionId,
        userFingerprint: fingerprint,
        totalDraftsCompleted: metrics.totalDraftsCompleted,
        ...additionalData
      });

      // Also store in session storage for immediate access
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(this.draftCompletionKey, timestamp.toString());
      }

      logger.debug('Draft completion recorded', {
        tournamentName,
        draftId,
        userId: this.userId,
        sessionId: this.sessionId,
        timestamp
      });

      return metrics;
    } catch (error) {
      logger.warn('Failed to record draft completion');
      return null;
    }
  }

  // Get last draft completion time
  getLastDraftCompletion(): DraftCompletion | null {
    try {
      const metrics = this.getMetrics();
      return metrics.lastDraftCompletion || null;
    } catch (error) {
      logger.warn('Failed to get last draft completion');
      return null;
    }
  }

  // Check if user has completed any drafts recently
  hasRecentDraftActivity(hours: number = 24): boolean {
    try {
      const lastCompletion = this.getLastDraftCompletion();
      if (!lastCompletion) return false;
      
      const now = Date.now();
      const timeDiff = now - lastCompletion.timestamp;
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      return hoursDiff <= hours;
    } catch (error) {
      logger.warn('Failed to check recent draft activity');
      return false;
    }
  }

  // Get exposure data cache
  getExposureDataCache(): unknown | null {
    try {
      if (typeof window === 'undefined') return null;
      const cached = localStorage.getItem(this.exposureDataKey);
      const timestamp = localStorage.getItem(this.exposureTimestampKey);
      
      if (cached && timestamp) {
        const cacheTime = parseInt(timestamp, 10);
        const now = Date.now();
        const cacheAge = now - cacheTime;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (cacheAge < maxAge) {
          return JSON.parse(decodeURIComponent(cached));
        } else {
          // Cache expired, clear it
          this.clearExposureDataCache();
        }
      }
      return null;
    } catch (error) {
      logger.warn('Failed to get exposure data cache');
      this.clearExposureDataCache();
      return null;
    }
  }

  // Save exposure data cache
  saveExposureDataCache(data: unknown): void {
    try {
      if (typeof window === 'undefined') return;
      const dataString = encodeURIComponent(JSON.stringify(data));
      const timestamp = Date.now().toString();
      
      localStorage.setItem(this.exposureDataKey, dataString);
      localStorage.setItem(this.exposureTimestampKey, timestamp);
      
      logger.debug('Exposure data cached successfully');
    } catch (error) {
      logger.warn('Failed to save exposure data cache');
    }
  }

  // Clear exposure data cache
  clearExposureDataCache(): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(this.exposureDataKey);
      localStorage.removeItem(this.exposureTimestampKey);
    } catch (error) {
      logger.warn('Failed to clear exposure data cache');
    }
  }

  // Record page visit with full personal data
  recordPageVisit(page: string, referrer: string | null = null): void {
    try {
      const metrics = this.getMetrics();
      const timestamp = Date.now();
      const fingerprint = this.getUserFingerprint();
      
      if (!metrics.pageVisits) {
        metrics.pageVisits = [];
      }
      
      metrics.pageVisits.push({
        page,
        referrer,
        timestamp,
        date: new Date(timestamp).toISOString(),
        userId: this.userId,
        sessionId: this.sessionId,
        userFingerprint: fingerprint
      });

      // Keep only last 200 page visits
      if (metrics.pageVisits.length > 200) {
        metrics.pageVisits = metrics.pageVisits.slice(-200);
      }

      metrics.lastActivity = timestamp;
      this.saveMetrics(metrics);

      // Send to Google Analytics
      this.sendToGoogleAnalytics('page_view', {
        page_title: page,
        page_location: typeof window !== 'undefined' ? window.location.href : '',
        user_id: this.userId,
        session_id: this.sessionId,
        referrer: referrer
      });

      // Send to external analytics
      this.sendToAnalytics('page_visit', {
        page,
        referrer,
        userId: this.userId,
        sessionId: this.sessionId,
        userFingerprint: fingerprint,
        timestamp
      });
    } catch (error) {
      logger.warn('Failed to record page visit');
    }
  }

  // Send data to Google Analytics
  sendToGoogleAnalytics(eventName: string, parameters: Record<string, unknown>): void {
    try {
      if (typeof window === 'undefined') return;
      const win = window as unknown as WindowWithGtag;
      if (!win.gtag) return;
      
      win.gtag('event', eventName, {
        ...parameters,
        custom_map: {
          'user_id': 'user_id',
          'session_id': 'session_id'
        }
      });
    } catch (error) {
      logger.warn('Failed to send to Google Analytics');
    }
  }

  // Send data to external analytics API
  async sendToAnalytics(eventName: string, data: Record<string, unknown>): Promise<void> {
    try {
      if (typeof window === 'undefined') return;
      
      // Get Firebase Auth token if available
      let authToken: string | null = null;
      if (auth && auth.currentUser) {
        try {
          authToken = await auth.currentUser.getIdToken();
        } catch {
          // If token fetch fails, continue without auth (for development)
          logger.debug('Failed to get auth token for analytics');
        }
      }
      
      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if we have a token
      // SECURITY: Only send requests with valid Firebase auth tokens
      // Dev-token fallback has been removed for security - use Firebase Auth Emulator in development
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        logger.debug('Sending analytics with Firebase auth token');
      } else {
        // No auth token - skip authenticated analytics in development
        // In production, this would indicate a session issue
        logger.debug('Skipping authenticated analytics - no auth token available');
        return; // Don't send unauthenticated analytics requests
      }
      
      // Send to your analytics endpoint
      try {
        const response = await fetch('/api/analytics', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            event: eventName,
            data: data,
            timestamp: Date.now(),
            userId: this.userId,
            sessionId: this.sessionId
          })
        });
        
        // Log non-2xx responses for debugging
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          logger.debug('Analytics API error', { status: response.status, error: errorText });
        }
      } catch {
        // Silently fail - don't block user experience
        logger.debug('Analytics API call failed');
      }
    } catch {
      // Silently fail
      logger.debug('Analytics send error');
    }
  }

  // Get user activity summary with personal identifiers
  getActivitySummary(): ActivitySummary {
    try {
      const metrics = this.getMetrics();
      const now = Date.now();
      const fingerprint = this.getUserFingerprint();
      
      return {
        userId: this.userId,
        sessionId: this.sessionId,
        userFingerprint: fingerprint,
        totalDraftsCompleted: metrics.totalDraftsCompleted || 0,
        lastDraftCompletion: metrics.lastDraftCompletion,
        lastActivity: metrics.lastActivity,
        daysSinceLastDraft: metrics.lastDraftCompletion ? 
          Math.floor((now - metrics.lastDraftCompletion.timestamp) / (1000 * 60 * 60 * 24)) : null,
        hasRecentActivity: this.hasRecentDraftActivity(),
        totalPageVisits: metrics.pageVisits ? metrics.pageVisits.length : 0,
        lastPageVisit: metrics.pageVisits && metrics.pageVisits.length > 0 ? 
          metrics.pageVisits[metrics.pageVisits.length - 1] as PageVisit : null
      };
    } catch (error) {
      logger.warn('Failed to get activity summary');
      return {
        userId: this.userId,
        sessionId: this.sessionId,
        totalDraftsCompleted: 0,
        daysSinceLastDraft: null,
        hasRecentActivity: false,
        totalPageVisits: 0,
        lastPageVisit: null
      };
    }
  }

  // Export comprehensive user data (with all personal identifiers)
  exportComprehensiveUserData(): ComprehensiveUserData {
    try {
      const metrics = this.getMetrics();
      const summary = this.getActivitySummary();
      
      return {
        userId: this.userId,
        sessionId: this.sessionId,
        personalIdentifiers: this.collectPersonalIdentifiers(),
        sessionData: this.collectSessionData(),
        deviceData: this.collectDeviceData(),
        locationData: this.collectLocationData(),
        activitySummary: summary,
        draftCompletions: metrics.draftCompletions || [],
        pageVisits: metrics.pageVisits || [],
        lastActivity: metrics.lastActivity,
        totalDraftsCompleted: metrics.totalDraftsCompleted || 0,
        userFingerprint: this.getUserFingerprint(),
        fullMetrics: metrics, // Include everything
        timestamp: Date.now()
      };
    } catch (error) {
      logger.warn('Failed to export comprehensive user data');
      return {
        userId: this.userId,
        sessionId: this.sessionId,
        personalIdentifiers: { userId: this.userId, sessionId: this.sessionId, timestamp: Date.now() },
        sessionData: { sessionId: this.sessionId, timestamp: Date.now() },
        deviceData: { timestamp: Date.now() },
        locationData: { timestamp: Date.now() },
        activitySummary: this.getActivitySummary(),
        draftCompletions: [],
        pageVisits: [],
        totalDraftsCompleted: 0,
        userFingerprint: this.getUserFingerprint(),
        fullMetrics: {} as UserMetrics,
        timestamp: Date.now()
      };
    }
  }

  // Export metrics for research (with personal identifiers)
  exportMetricsForResearch(): Record<string, unknown> {
    try {
      const metrics = this.getMetrics();
      const summary = this.getActivitySummary();
      
      // Include personal identifiers for research
      return {
        userId: this.userId,
        sessionId: this.sessionId,
        userFingerprint: this.getUserFingerprint(),
        activitySummary: summary,
        draftCompletions: metrics.draftCompletions || [],
        pageVisits: metrics.pageVisits || [],
        lastActivity: metrics.lastActivity,
        totalDraftsCompleted: metrics.totalDraftsCompleted || 0,
        fullMetrics: metrics // Include everything
      };
    } catch (error) {
      logger.warn('Failed to export metrics for research');
      return {};
    }
  }

  // Helper methods for collecting personal identifiers
  private getPersistentId(): string | null {
    try {
      let persistentId = localStorage.getItem('topdog_persistent_id');
      if (!persistentId) {
        persistentId = `user_${  Date.now()  }_${  Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('topdog_persistent_id', persistentId);
      }
      return persistentId;
    } catch (error) {
      return `user_${  Date.now()}`;
    }
  }

  private getStoredEmail(): string | null {
    try {
      return localStorage.getItem('topdog_user_email') || 
             sessionStorage.getItem('topdog_user_email') || 
             this.extractEmailFromPage() || null;
    } catch (error) {
      return null;
    }
  }

  private getStoredUsername(): string | null {
    try {
      return localStorage.getItem('topdog_username') || 
             sessionStorage.getItem('topdog_username') || 
             this.extractUsernameFromPage() || null;
    } catch (error) {
      return null;
    }
  }

  private getStoredPhone(): string | null {
    try {
      return localStorage.getItem('topdog_phone') || 
             sessionStorage.getItem('topdog_phone') || null;
    } catch (error) {
      return null;
    }
  }

  private getStoredIP(): string | null {
    try {
      return localStorage.getItem('topdog_ip_address') || null;
    } catch (error) {
      return null;
    }
  }

  private getSocialMediaIds(): Record<string, string | null> {
    try {
      return {
        facebook: this.extractSocialId('facebook'),
        twitter: this.extractSocialId('twitter'),
        instagram: this.extractSocialId('instagram'),
        linkedin: this.extractSocialId('linkedin')
      };
    } catch (error) {
      return {};
    }
  }

  private getDeviceId(): string | null {
    try {
      let deviceId = localStorage.getItem('topdog_device_id');
      if (!deviceId) {
        deviceId = `device_${  Date.now()  }_${  Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('topdog_device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      return `device_${  Date.now()}`;
    }
  }

  private getBrowserId(): string | null {
    try {
      let browserId = localStorage.getItem('topdog_browser_id');
      if (!browserId) {
        browserId = `browser_${  Date.now()  }_${  Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('topdog_browser_id', browserId);
      }
      return browserId;
    } catch (error) {
      return `browser_${  Date.now()}`;
    }
  }

  private getCanvasFingerprint(): string | null {
    try {
      if (typeof window === 'undefined') return null;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('TopDog fingerprint test', 2, 2);
      return canvas.toDataURL();
    } catch (error) {
      return null;
    }
  }

  private getWebGLFingerprint(): { vendor: string; renderer: string } | null {
    try {
      if (typeof window === 'undefined') return null;
      const canvas = document.createElement('canvas');
      const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
      if (!gl) return null;
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return null;
      
      return {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) as string,
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string
      };
    } catch (error) {
      return null;
    }
  }

  private getAudioFingerprint(): string | null {
    try {
      if (typeof window === 'undefined') return null;
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return null;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      oscillator.connect(analyser);
      oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      return Array.from(dataArray).slice(0, 10).join(',');
    } catch (error) {
      return null;
    }
  }

  private getFontFingerprint(): string | null {
    try {
      if (typeof window === 'undefined') return null;
      const fonts = ['Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia'];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      const baseString = 'abcdefghijklmnopqrstuvwxyz0123456789';
      
      const fontSizes = fonts.map(font => {
        ctx.font = `12px ${font}`;
        return ctx.measureText(baseString).width;
      });
      
      return fontSizes.join(',');
    } catch (error) {
      return null;
    }
  }

  private getPluginList(): Array<{ name: string; description: string; filename: string }> {
    try {
      if (typeof window === 'undefined') return [];
      return Array.from(navigator.plugins).map(plugin => ({
        name: plugin.name,
        description: plugin.description,
        filename: plugin.filename
      }));
    } catch (error) {
      return [];
    }
  }

  private getMimeTypeList(): Array<{ type: string; description: string; enabledPlugin?: string }> {
    try {
      if (typeof window === 'undefined') return [];
      return Array.from(navigator.mimeTypes).map(mimeType => ({
        type: mimeType.type,
        description: mimeType.description,
        enabledPlugin: mimeType.enabledPlugin?.name
      }));
    } catch (error) {
      return [];
    }
  }

  private getPageViews(): unknown[] {
    try {
      return this.pageViews || [];
    } catch (error) {
      return [];
    }
  }

  private getUserInteractions(): unknown[] {
    try {
      return this.userInteractions || [];
    } catch (error) {
      return [];
    }
  }

  private getScrollDepth(): number {
    try {
      return this.scrollDepth || 0;
    } catch (error) {
      return 0;
    }
  }

  private getTimeOnPage(): number {
    try {
      return this.timeOnPage || 0;
    } catch (error) {
      return 0;
    }
  }

  private getMouseMovements(): unknown[] {
    try {
      return this.mouseMovements || [];
    } catch (error) {
      return [];
    }
  }

  private getKeyboardEvents(): unknown[] {
    try {
      return this.keyboardEvents || [];
    } catch (error) {
      return [];
    }
  }

  private getTouchEvents(): unknown[] {
    try {
      return this.touchEvents || [];
    } catch (error) {
      return [];
    }
  }

  private getUTMParams(): {
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    utm_term?: string | null;
    utm_content?: string | null;
  } {
    try {
      if (typeof window === 'undefined') return {};
      const urlParams = new URLSearchParams(window.location.search);
      return {
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
        utm_term: urlParams.get('utm_term'),
        utm_content: urlParams.get('utm_content')
      };
    } catch (error) {
      return {};
    }
  }

  private getStoredIPLocation(): string | null {
    try {
      return localStorage.getItem('topdog_ip_location') || null;
    } catch (error) {
      return null;
    }
  }

  private getStoredGPSLocation(): string | null {
    try {
      return localStorage.getItem('topdog_gps_location') || null;
    } catch (error) {
      return null;
    }
  }

  private getStoredCountry(): string | null {
    try {
      return localStorage.getItem('topdog_country') || null;
    } catch (error) {
      return null;
    }
  }

  private getStoredRegion(): string | null {
    try {
      return localStorage.getItem('topdog_region') || null;
    } catch (error) {
      return null;
    }
  }

  private getStoredCity(): string | null {
    try {
      return localStorage.getItem('topdog_city') || null;
    } catch (error) {
      return null;
    }
  }

  private getStoredPostalCode(): string | null {
    try {
      return localStorage.getItem('topdog_postal_code') || null;
    } catch (error) {
      return null;
    }
  }

  private extractEmailFromPage(): string | null {
    try {
      if (typeof window === 'undefined') return null;
      // Look for email in various page elements
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const pageText = document.body.innerText;
      const emails = pageText.match(emailRegex);
      return emails ? emails[0] : null;
    } catch (error) {
      return null;
    }
  }

  private extractUsernameFromPage(): string | null {
    try {
      if (typeof window === 'undefined') return null;
      // Look for username in various page elements
      const usernameElements = document.querySelectorAll('[data-username], .username, #username, [name="username"]');
      for (const element of usernameElements) {
        if (element.textContent || (element as HTMLInputElement).value) {
          return element.textContent || (element as HTMLInputElement).value;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private extractSocialId(platform: string): string | null {
    try {
      if (typeof window === 'undefined') return null;
      // Look for social media IDs in meta tags or page content
      const metaTag = document.querySelector(`meta[property="og:${platform}:id"]`);
      if (metaTag) return metaTag.getAttribute('content');
      
      // Look for social links
      const socialLink = document.querySelector(`a[href*="${platform}.com"]`);
      if (socialLink) {
        const href = socialLink.getAttribute('href');
        if (href) {
          const match = href.match(/\/([^\/]+)$/);
          return match ? (match[1] ?? null) : null;
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  trackUserBehavior(eventType: string, data: unknown): void {
    try {
      if (!this.userInteractions) this.userInteractions = [];
      
      this.userInteractions.push({
        eventType,
        data,
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        userId: this.userId,
        sessionId: this.sessionId
      });

      // Keep only last 1000 interactions
      if (this.userInteractions.length > 1000) {
        this.userInteractions = this.userInteractions.slice(-1000);
      }
    } catch (error) {
      logger.warn('Failed to track user behavior');
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Create singleton instance
const userMetrics = new UserMetrics();

// Named export for explicit imports
export { userMetrics };

// Default export for backward compatibility
export default userMetrics;
